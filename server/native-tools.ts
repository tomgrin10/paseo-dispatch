import { defineAgentTool, type PluginHandlerContext, type PluginServerContext } from "@getpaseo/plugin/server";
import { z } from "zod";
import { rankWorkspaces, type RoutingWorkspace, type RoutingAgent } from "../shared/routing";
import { registerAgentTools } from "./agent-tools.ts";
type Api = PluginHandlerContext["paseo"];
export async function routingCandidates(paseo: Api, signal: AbortSignal) {
  const workspaces: RoutingWorkspace[] = [], agents: RoutingAgent[] = [];
  let cursor: string | undefined;
  do {
    if (signal.aborted) throw new Error("Tool call cancelled.");
    const page = await paseo.workspaces.list({ page: { limit: 200, ...(cursor ? { cursor } : {}) } });
    workspaces.push(...page.entries.map(w => ({ id: w.id, projectId: w.projectId, projectName: w.projectCustomName ?? w.projectDisplayName, projectRootPath: w.projectRootPath, name: w.name, title: w.title, labels: w.labels, branch: w.gitRuntime?.currentBranch, pullRequestTitle: w.githubRuntime?.pullRequest?.title, status: w.status, activityAt: w.activityAt })));
    cursor = page.pageInfo.nextCursor ?? undefined;
  } while (cursor);
  cursor = undefined;
  do {
    if (signal.aborted) throw new Error("Tool call cancelled.");
    const page: Awaited<ReturnType<Api["agents"]["list"]>> = await paseo.agents.list({ filter: { includeArchived: false }, page: { limit: 200, ...(cursor ? { cursor } : {}) }, signal });
    agents.push(...page.entries.map(({ agent: a }) => ({ workspaceId: a.workspaceId, title: a.title, provider: a.provider, model: a.model, currentModeId: a.currentModeId, updatedAt: a.updatedAt })));
    cursor = page.pageInfo.nextCursor ?? undefined;
  } while (cursor);
  return { workspaces, agents };
}
export function contributeAgentTools(server: PluginServerContext) {
  return registerAgentTools(server, [defineAgentTool({
    name: "dispatch_find_workspace", description: "Rank all active workspaces on this host against a task using project, branch, PR and recent agent titles. Returns evidence and confidence. Does not send a task or create an agent.",
    input: z.object({ task: z.string().trim().min(1).max(10000), limit: z.number().int().min(1).max(20).default(5) }).strict(),
    async execute({ task, limit }, { paseo, signal }) {
      const { workspaces, agents } = await routingCandidates(paseo, signal);
      const result = { candidates: rankWorkspaces(task, workspaces, agents).slice(0, limit), totalWorkspaces: workspaces.length };
      return { text: JSON.stringify(result), structuredContent: result };
    },
  })]);
}
