export interface RoutingAgent {
  workspaceId?: string;
  title: string | null;
  provider: string;
  model: string | null;
  thinkingOptionId?: string | null;
  currentModeId: string | null;
  updatedAt: string;
}

export interface RoutingWorkspace {
  id: string;
  projectId: string;
  projectName: string;
  projectRootPath: string;
  name: string;
  title?: string | null;
  labels?: readonly string[];
  branch?: string | null;
  pullRequestTitle?: string | null;
  status: string;
  activityAt: string | null;
}

export interface RankedWorkspace {
  workspace: RoutingWorkspace;
  score: number;
  reasons: string[];
  confidence: "high" | "medium" | "review";
}

/** Paseo 0.8 rejects workspace and agent page sizes above this value. */
export const PASEO_MAX_PAGE_SIZE = 200 as const;

const STOP_WORDS = new Set([
  "a", "agent", "an", "and", "at", "be", "do", "for", "from", "i", "in", "is", "it", "me", "my",
  "of", "on", "paseo", "please", "plugin", "project", "task", "that", "the", "this", "to", "up", "want",
  "with", "workspace",
]);

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalized(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token)))];
}

function fieldScore(query: string, queryTokens: readonly string[], value: string, weight: number): number {
  const haystack = normalized(value);
  if (!haystack) return 0;
  const phraseBonus = query.length >= 4 && haystack.includes(query) ? weight * 2 : 0;
  const matched = queryTokens.filter((token) => haystack.includes(token)).length;
  return phraseBonus + matched * weight;
}

function activityMs(workspace: RoutingWorkspace): number {
  if (workspace.activityAt === null) return 0;
  const parsed = Date.parse(workspace.activityAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rankWorkspaces(
  prompt: string,
  workspaces: readonly RoutingWorkspace[],
  agents: readonly RoutingAgent[],
): RankedWorkspace[] {
  const query = normalized(prompt);
  const queryTokens = tokens(prompt);
  const agentTitles = new Map<string, string[]>();
  for (const agent of agents) {
    if (agent.workspaceId === undefined || agent.title === null) continue;
    const values = agentTitles.get(agent.workspaceId) ?? [];
    values.push(agent.title);
    agentTitles.set(agent.workspaceId, values);
  }

  const scored = workspaces.map((workspace) => {
    const fields = [
      { label: `project ${workspace.projectName}`, value: workspace.projectName, weight: 12 },
      { label: `workspace ${workspace.title ?? workspace.name}`, value: `${workspace.title ?? ""} ${workspace.name}`, weight: 10 },
      { label: "workspace labels", value: (workspace.labels ?? []).join(" "), weight: 9 },
      { label: `branch ${workspace.branch ?? ""}`, value: workspace.branch ?? "", weight: 8 },
      { label: "pull request", value: workspace.pullRequestTitle ?? "", weight: 8 },
      { label: "project path", value: workspace.projectRootPath, weight: 5 },
      { label: "recent agent work", value: (agentTitles.get(workspace.id) ?? []).join(" "), weight: 4 },
    ];

    const matches = fields
      .map((field) => ({ ...field, score: fieldScore(query, queryTokens, field.value, field.weight) }))
      .filter((field) => field.score > 0);
    const lexicalScore = matches.reduce((sum, match) => sum + match.score, 0);
    const statusBonus = workspace.status === "running" ? 2 : workspace.status === "attention" ? 1 : 0;
    return {
      workspace,
      score: lexicalScore + statusBonus,
      reasons: matches.slice(0, 3).map((match) => match.label),
      confidence: "review" as const,
    };
  });

  scored.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const activity = activityMs(right.workspace) - activityMs(left.workspace);
    if (activity !== 0) return activity;
    return left.workspace.id.localeCompare(right.workspace.id);
  });

  return scored.map((candidate, index) => {
    const nextScore = scored[index + 1]?.score ?? 0;
    const statusBonus = candidate.workspace.status === "running" ? 2 : candidate.workspace.status === "attention" ? 1 : 0;
    const lexicalScore = candidate.score - statusBonus;
    const margin = candidate.score - nextScore;
    const confidence = index === 0
      ? queryTokens.length > 0 && lexicalScore >= 24 && margin >= 8
        ? "high"
        : queryTokens.length > 0 && lexicalScore >= 12 && margin >= 3
          ? "medium"
          : "review"
      : "review";
    return {
      ...candidate,
      reasons: candidate.reasons.length > 0 ? candidate.reasons : ["recent workspace activity"],
      confidence,
    };
  });
}

export function configForWorkspace(agents: readonly RoutingAgent[], workspaceId: string) {
  const latest = [...agents]
    .filter((agent) => agent.workspaceId === workspaceId)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0];
  if (latest === undefined) {
    return { provider: "codex/gpt-5.6-sol", thinkingOptionId: "high" };
  }
  return {
    provider: latest.model === null ? latest.provider : `${latest.provider}/${latest.model}`,
    ...(latest.thinkingOptionId ? { thinkingOptionId: latest.thinkingOptionId } : {}),
    ...(latest.currentModeId ? { modeId: latest.currentModeId } : {}),
  };
}

export function taskTitle(prompt: string): string {
  const firstLine = prompt.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (firstLine.length <= 72) return firstLine || "Dispatched task";
  return `${firstLine.slice(0, 69).trimEnd()}...`;
}
