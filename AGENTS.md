# Repository instructions

## Project

- This is the trusted, unsandboxed Paseo plugin `paseo-dispatch`.
- This is a test plugin. Keep `package.json` private; do not publish it to npm or submit it to Paseo Cafe.
- Keep `paseo-plugin.json`, `package.json`, the README compatibility badge, and install commands aligned.
- Read the current plugin docs at <https://paseo.sh/docs/plugins> and <https://paseo.sh/docs/plugins/reference> before changing runtime code.

## Code boundaries

- `index.client.tsx` wires contributions; `client/` contains React Native UI and hooks.
- `shared/` contains dependency-free routing logic used by runtime code and tests.
- Paseo supplies SDK, React, React Native, TanStack Query, and Zod at runtime. Keep those packages in `devDependencies`.
- Never commit credentials, daemon state, logs, or local paths.

## Verification and release

- Run `npm ci`, `npm run verify`, and `npm pack --dry-run` after changes.
- Do not restart the Paseo daemon. Use `paseo plugin reload paseo-dispatch` for an installed development copy.
- Keep release preparation local unless the repository owner explicitly promotes the plugin out of test status.
