import type { PaseoAgent, PaseoWorkspace } from "@getpaseo/client";
import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { usePaseo } from "@getpaseo/plugin/client";
import { Icon, ScrollView, TextInput, useToast } from "@getpaseo/plugin/client/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  configForWorkspace,
  PASEO_MAX_PAGE_SIZE,
  rankWorkspaces,
  taskTitle,
  type RoutingAgent,
  type RoutingWorkspace,
} from "../shared/routing";

function toRoutingWorkspace(workspace: PaseoWorkspace): RoutingWorkspace {
  return {
    id: workspace.id,
    projectId: workspace.projectId,
    projectName: workspace.projectCustomName ?? workspace.projectDisplayName,
    projectRootPath: workspace.projectRootPath,
    name: workspace.name,
    title: workspace.title,
    labels: workspace.labels,
    branch: workspace.gitRuntime?.currentBranch,
    pullRequestTitle: workspace.githubRuntime?.pullRequest?.title,
    status: workspace.status,
    activityAt: workspace.activityAt,
  };
}

function toRoutingAgent(agent: PaseoAgent): RoutingAgent {
  return {
    workspaceId: agent.workspaceId,
    title: agent.title,
    provider: agent.provider,
    model: agent.model,
    thinkingOptionId: agent.effectiveThinkingOptionId ?? agent.thinkingOptionId,
    currentModeId: agent.currentModeId,
    updatedAt: agent.updatedAt,
  };
}

function confidenceLabel(confidence: "high" | "medium" | "review") {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Likely match";
  return "Please review";
}

export function DispatchSurface({ theme, layout, navigation }: PluginSurfaceProps) {
  const paseo = usePaseo();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ["paseo-dispatch", "workspaces"],
    queryFn: () => paseo.workspaces.list({
      sort: [{ key: "activity_at", direction: "desc" }],
      page: { limit: PASEO_MAX_PAGE_SIZE },
    }),
    refetchInterval: 15_000,
  });
  const agentsQuery = useQuery({
    queryKey: ["paseo-dispatch", "agents"],
    queryFn: () => paseo.agents.list({
      filter: { includeArchived: false },
      sort: [{ key: "updated_at", direction: "desc" }],
      page: { limit: PASEO_MAX_PAGE_SIZE },
    }),
    refetchInterval: 15_000,
  });

  const workspaces = useMemo(
    () => (workspacesQuery.data?.entries ?? []).map(toRoutingWorkspace),
    [workspacesQuery.data],
  );
  const agents = useMemo(
    () => (agentsQuery.data?.entries ?? []).map((entry) => toRoutingAgent(entry.agent)),
    [agentsQuery.data],
  );
  const ranked = useMemo(() => rankWorkspaces(prompt, workspaces, agents), [prompt, workspaces, agents]);
  const selected = ranked.find((candidate) => candidate.workspace.id === selectedId) ?? ranked[0];

  const dispatch = useMutation({
    mutationFn: async () => {
      if (selected === undefined || prompt.trim().length === 0) throw new Error("Write a task and choose a workspace first.");
      const agent = await paseo.workspaces.ref(selected.workspace.id).agents.create({
        config: configForWorkspace(agents, selected.workspace.id),
        prompt: prompt.trim(),
        title: taskTitle(prompt),
        labels: {
          "paseo-dispatch": "true",
          "paseo-dispatch-confidence": selected.confidence,
        },
      });
      return { agentId: agent.id, workspace: selected.workspace };
    },
    onSuccess({ agentId, workspace }) {
      toast.show(`Dispatched to ${workspace.title ?? workspace.name}`, { variant: "success" });
      setPrompt("");
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ["paseo-dispatch"] });
      navigation?.openAgent({ agentId });
    },
    onError(error) {
      toast.error(error instanceof Error ? error.message : String(error));
    },
  });

  const loading = workspacesQuery.isLoading || agentsQuery.isLoading;
  const error = workspacesQuery.error ?? agentsQuery.error;
  const padding = layout.compact ? 14 : 24;
  const cardPadding = layout.compact ? 12 : 16;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface0 }}
      contentContainerStyle={{ padding, gap: 18, maxWidth: 860, width: "100%", alignSelf: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Icon name="Send" size={20} color={theme.colors.accent} />
          <Text style={{ color: theme.colors.foreground, fontSize: 21, fontWeight: "700" }}>Dispatch</Text>
        </View>
        <Text style={{ color: theme.colors.foregroundMuted, lineHeight: 19 }}>
          Tell the manager what needs doing. It will rank your existing workspaces before starting a fresh agent.
        </Text>
      </View>

      <View
        style={{
          gap: 10,
          padding: cardPadding,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface1,
        }}
      >
        <Text style={{ color: theme.colors.foreground, fontWeight: "600" }}>What should happen?</Text>
        <TextInput
          accessibilityLabel="Task to dispatch"
          multiline
          value={prompt}
          onChangeText={(value) => {
            setPrompt(value);
            setSelectedId(null);
          }}
          placeholder="e.g. Fix the vendor allowlist tests and open a PR"
          placeholderTextColor={theme.colors.foregroundMuted}
          style={{
            minHeight: layout.compact ? 110 : 140,
            padding: 12,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: theme.colors.border,
            color: theme.colors.foreground,
            backgroundColor: theme.colors.surface0,
            textAlignVertical: "top",
          }}
        />
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
          Routing stays on this client. The task is sent only when you press Dispatch.
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: "center", gap: 10 }}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={{ color: theme.colors.foregroundMuted }}>Reading workspaces...</Text>
        </View>
      ) : null}

      {error !== null && error !== undefined ? (
        <Text style={{ color: theme.colors.statusDanger }}>
          {error instanceof Error ? error.message : String(error)}
        </Text>
      ) : null}

      {!loading && selected !== undefined ? (
        <View style={{ gap: 9 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <Text style={{ color: theme.colors.foreground, fontSize: 16, fontWeight: "700" }}>Route preview</Text>
            <Text
              style={{
                color: selected.confidence === "review" ? theme.colors.statusWarning : theme.colors.accent,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {confidenceLabel(selected.confidence)}
            </Text>
          </View>

          {ranked.slice(0, 5).map((candidate, index) => {
            const isSelected = candidate.workspace.id === selected.workspace.id;
            return (
              <Pressable
                key={candidate.workspace.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Route to ${candidate.workspace.title ?? candidate.workspace.name}`}
                onPress={() => setSelectedId(candidate.workspace.id)}
                style={{
                  flexDirection: layout.compact ? "column" : "row",
                  alignItems: layout.compact ? "stretch" : "center",
                  gap: 10,
                  padding: cardPadding,
                  borderRadius: 11,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.surface2 : theme.colors.surface1,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface2,
                  }}
                >
                  <Text style={{ color: isSelected ? theme.colors.accentForeground : theme.colors.foregroundMuted, fontWeight: "700" }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: theme.colors.foreground, fontWeight: "600" }}>
                    {candidate.workspace.title ?? candidate.workspace.name}
                  </Text>
                  <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
                    {candidate.workspace.projectName} · {candidate.reasons.join(" · ")}
                  </Text>
                </View>
                {isSelected ? <Icon name="Check" size={18} color={theme.colors.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!loading && workspaces.length === 0 ? (
        <Text style={{ color: theme.colors.foregroundMuted }}>No active workspaces are available on this host.</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dispatch task"
        disabled={dispatch.isPending || prompt.trim().length === 0 || selected === undefined}
        onPress={() => dispatch.mutate()}
        style={{
          minHeight: 46,
          borderRadius: 10,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: dispatch.isPending || prompt.trim().length === 0 || selected === undefined ? 0.45 : 1,
          backgroundColor: theme.colors.accent,
        }}
      >
        {dispatch.isPending ? <ActivityIndicator color={theme.colors.accentForeground} /> : <Icon name="Send" size={17} color={theme.colors.accentForeground} />}
        <Text style={{ color: theme.colors.accentForeground, fontWeight: "700" }}>
          {dispatch.isPending ? "Dispatching..." : selected === undefined ? "No workspace available" : `Dispatch to ${selected.workspace.projectName}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
