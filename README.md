# paseo-dispatch

[![Paseo](https://img.shields.io/badge/Paseo-plugin-8A63D2?style=for-the-badge)](https://paseo.sh)
[![License](https://img.shields.io/github/license/tomgrin10/paseo-dispatch?style=for-the-badge&color=2563eb)](LICENSE)

A Paseo proof of concept for sending a free-form task to the most relevant existing workspace.

> Test plugin: not published to npm or listed in Paseo Cafe.

## Use

Open **Dispatch** in the Paseo sidebar, write a task, review the ranked destination, and press the
dispatch button. Pick another candidate if the suggested route is wrong. The plugin starts a new
agent in that workspace and opens it.

The POC's router is local and deterministic. It uses workspace metadata and recent agent titles;
no routing request leaves the connected Paseo client.

## Develop

```sh
npm install
npm run verify
paseo plugin install "$PWD"
paseo plugin reload paseo-dispatch
paseo plugin logs paseo-dispatch
```

Paseo plugins are trusted, unsandboxed code. This POC has no server entry and performs all work
through the Paseo client API supplied by the host.

## More Paseo plugins

Also available from [Tom Gringauz](https://github.com/tomgrin10):

- [Defer](https://github.com/tomgrin10/paseo-defer) — Schedule messages to agents for later delivery.
- [Graphite](https://github.com/tomgrin10/paseo-graphite) — Monitor Graphite stacks and PR action state.
- [Smart Session](https://github.com/tomgrin10/paseo-smart-session) — Context-aware compaction and usage insights for long-running agents.
- [Vitals](https://github.com/tomgrin10/paseo-vitals) — Host, Paseo, agent, and Docker health in one dashboard.
- [Send to Paseo](https://github.com/tomgrin10/send-to-paseo) — Send GitHub and Graphite PRs to Paseo from Chrome.
