# Research notes

Checked against Paseo 0.8.0 on 2026-09-11.

- The [v0.8 plugin quickstart](https://paseo.sh/docs/plugins/v0.8) defines separate client and server
  entries and says client contributions run on desktop, web, and mobile clients connected to the
  daemon. This POC needs only `index.client.tsx`.
- The [v0.8 plugin reference](https://paseo.sh/docs/plugins/v0.8/reference) documents global
  surfaces/sidebar items and exposes ordinary Paseo operations through the client context. The POC
  registers one of each and creates an agent through the selected workspace handle.
- The [workspace documentation](https://paseo.sh/docs/workspaces) confirms the hierarchy the router
  uses: projects contain workspaces, and workspaces contain sessions.
- The plugin API is experimental. The manifest therefore pins the current compatibility floor with
  `"requirements": { "paseo": ">=0.8.0" }`, and local verification typechecks against version 0.8.0.
- Plugins are trusted code. The POC deliberately has no daemon-side entry, filesystem access,
  subprocess, credential, network, timer, or persistence layer; it uses the client API supplied by
  Paseo and creates an agent only after an explicit button press.
