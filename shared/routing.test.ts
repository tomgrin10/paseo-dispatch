import assert from "node:assert/strict";
import test from "node:test";
import {
  configForWorkspace,
  PASEO_MAX_PAGE_SIZE,
  rankWorkspaces,
  taskTitle,
  type RoutingAgent,
  type RoutingWorkspace,
} from "./routing.ts";

const workspaces: RoutingWorkspace[] = [
  {
    id: "vendor",
    projectId: "hero",
    projectName: "hero-poc",
    projectRootPath: "/Projects/hero-poc",
    name: "hanging-kiwi",
    title: "Make vendor allowlist visible to interpretation",
    labels: ["backend", "interpretation"],
    branch: "feature/vendor-allowlist",
    pullRequestTitle: null,
    status: "done",
    activityAt: "2026-09-09T12:00:00Z",
  },
  {
    id: "plugin",
    projectId: "tools",
    projectName: "paseo-smart-session",
    projectRootPath: "/Projects/paseo-smart-session",
    name: "smart-compact",
    title: "Make smart compact continue message configurable",
    labels: ["paseo", "plugin"],
    branch: "feature/continuation-message",
    pullRequestTitle: null,
    status: "running",
    activityAt: "2026-09-11T12:00:00Z",
  },
  {
    id: "send-to-paseo",
    projectId: "send",
    projectName: "send-to-paseo",
    projectRootPath: "/Projects/send-to-paseo",
    name: "multi-host",
    title: "Add multi-host support to plugin",
    labels: ["paseo", "plugin"],
    branch: "feature/multi-host",
    pullRequestTitle: null,
    status: "done",
    activityAt: "2026-09-11T13:00:00Z",
  },
];

const agents: RoutingAgent[] = [
  {
    workspaceId: "vendor",
    title: "Fix the failing vendor mapping tests",
    provider: "claude",
    model: "claude-opus-5",
    thinkingOptionId: "high",
    currentModeId: "default",
    updatedAt: "2026-09-10T10:00:00Z",
  },
];

test("inventory requests stay within Paseo 0.8's page-size ceiling", () => {
  assert.equal(PASEO_MAX_PAGE_SIZE, 200);
});

test("project and workspace metadata route a Paseo plugin task", () => {
  const ranked = rankWorkspaces("Update the smart compact Paseo plugin", workspaces, agents);
  assert.equal(ranked[0]?.workspace.id, "plugin");
  assert.equal(ranked[0]?.confidence, "high");
});

test("recent agent titles help route follow-up work", () => {
  const ranked = rankWorkspaces("Fix the vendor mapping tests", workspaces, agents);
  assert.equal(ranked[0]?.workspace.id, "vendor");
  assert.match(ranked[0]?.reasons.join(" ") ?? "", /recent agent work/);
});

test("empty prompts fall back deterministically to active recent work", () => {
  const ranked = rankWorkspaces("", workspaces, agents);
  assert.equal(ranked[0]?.workspace.id, "plugin");
  assert.equal(ranked[0]?.confidence, "review");
});

test("agent configuration follows the latest agent in the chosen workspace", () => {
  assert.deepEqual(configForWorkspace(agents, "vendor"), {
    provider: "claude/claude-opus-5",
    thinkingOptionId: "high",
    modeId: "default",
  });
  assert.deepEqual(configForWorkspace(agents, "missing"), {
    provider: "codex/gpt-5.6-sol",
    thinkingOptionId: "high",
  });
});

test("task titles use only a bounded first line", () => {
  assert.equal(taskTitle("Fix this\nwith more context"), "Fix this");
  assert.equal(taskTitle("x".repeat(100)).length, 72);
});
