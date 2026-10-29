import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
async function tools(stubs = {}, read) {
  const bundle = await build({ entryPoints: ["server/native-tools.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "fixture-services", setup(build) { build.onResolve({ filter: /^\./ }, args => Object.hasOwn(stubs, args.path) ? { path: "fixture:" + args.path, external: true } : undefined); } }] });
  const module = { exports: {} };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(id => id.startsWith("fixture:") ? stubs[id.slice(8)] : require(id), module, module.exports);
  let open;
  module.exports.contributeAgentTools({ before(name, handler) { assert.equal(name, "agent.session_open"); open = handler; return () => {}; } }, read);
  const request = { purpose: "interactive", provider: "claude", labels: {}, workspaceId: "w1", tools: [] };
  return { definitions: open({ request }).tools, module: module.exports };
}
const context = () => ({ agent: { id: "caller", workspaceId: "w1", provider: "claude", cwd: "/fixture", title: "Fixture" }, paseo: {}, signal: new AbortController().signal });
async function call(tool, input, ctx = context()) { return tool.execute(tool.input.parse(input), ctx); }
test("workspace ranking reads all pages and never creates or sends work", async () => {
  const { definitions } = await tools(); let workspaceReads = 0;
  const base = { projectId: "p", projectDisplayName: "Project", projectRootPath: "/fixture", name: "Unrelated", status: "idle", activityAt: null, labels: [] };
  const ctx = context();
  ctx.paseo = { workspaces: { async list({ page }) { workspaceReads++; return page.cursor ? { entries: [{ ...base, id: "relevant", name: "Vendor allowlist" }], pageInfo: { nextCursor: null } } : { entries: Array.from({ length: 200 }, (_, i) => ({ ...base, id: String(i) })), pageInfo: { nextCursor: "next" } }; } }, agents: { list: async () => ({ entries: [], pageInfo: { nextCursor: null } }) } };
  const result = (await call(definitions[0], { task: "Fix vendor allowlist" }, ctx)).structuredContent;
  assert.equal(workspaceReads, 2); assert.equal(result.totalWorkspaces, 201); assert.equal(result.candidates[0].workspace.id, "relevant");
});
