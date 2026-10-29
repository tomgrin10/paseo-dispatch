# paseo-dispatch

[![Paseo](https://img.shields.io/badge/Paseo-%E2%89%A5%200.14.0-8A63D2?style=for-the-badge)](https://paseo.sh)
[![License](https://img.shields.io/github/license/tomgrin10/paseo-dispatch?style=for-the-badge&color=2563eb)](LICENSE)

A Paseo proof of concept for sending a free-form task to the most relevant existing workspace.

> Test plugin: not published to npm or listed in Paseo Cafe.

## Use

Open **Dispatch** in the Paseo sidebar, write a task, review the ranked destination, and press the
dispatch button. Pick another candidate if the suggested route is wrong. The plugin starts a new
agent in that workspace and opens it.

The POC's router is local and deterministic. It uses workspace metadata and recent agent titles;
no routing request leaves the connected Paseo client.

## Development

```sh
npm install
npm run verify
paseo plugin install "$PWD"
paseo plugin reload paseo-dispatch
paseo plugin logs paseo-dispatch
```

Paseo plugins are trusted, unsandboxed code. This POC has no server entry and performs all work
through the Paseo client API supplied by the host.

## License

[MIT](LICENSE) © 2026 Tom Gringauz.

## Navigation and display

Open this plugin from Command-K or its sidebar entry. **Overview** and **Display settings** link the main view and settings directly, without opening the Plugins settings page. Hiding a sidebar entry keeps Command-K available.

## Paseo 0.14 agent integration

`dispatch_find_workspace` ranks every active workspace on this host, including inventories beyond 200 entries. It returns confidence and matching evidence without creating an agent or sending a task.

Requires Paseo **0.14.0 or newer**. Agent tools are scoped to interactive Claude
and Codex sessions; history-only opens receive none. They become available on
the next idle session open after install or reload. The agent label
`plugin-tools/enabled: "false"` opts a session out. Existing plugin data and
settings are retained.

## Other plugins

- [Defer](https://github.com/tomgrin10/paseo-defer) — Schedule messages for later delivery.
- [Graphite](https://github.com/tomgrin10/paseo-graphite) — Graphite stacks and PR status.
- [Smart Session](https://github.com/tomgrin10/paseo-smart-session) — Context compaction and usage insights.
- [Vitals](https://github.com/tomgrin10/paseo-vitals) — Host, agent, and Docker health.
- [Session Guard](https://github.com/tomgrin10/paseo-session-guard) — Pause at session limits and continue after reset.
- [Transfer](https://github.com/tomgrin10/paseo-transfer) — Copy or move workspaces between hosts.
- [Transcript Search](https://github.com/tomgrin10/paseo-transcript-search) — Search conversations across connected hosts.
- [Send to Paseo](https://github.com/tomgrin10/send-to-paseo) — Send GitHub and Graphite PRs to Paseo from Chrome.
