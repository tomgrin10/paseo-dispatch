# Paseo Dispatch POC

## Problem

When many Paseo projects and workspaces are active, deciding where a new task belongs costs more
attention than writing the task. The Discord thread describes a human-friendly manager agent: one
persistent place where Mongorian can state intent at a higher level, then let Paseo find the work
context and queue the message.

## POC scope

The plugin contributes a global **Dispatch** sidebar surface and Command Center item. The surface:

1. accepts a free-form task;
2. ranks active workspaces from project/workspace names, paths, labels, branch and PR metadata, and
   recent agent titles;
3. explains the leading match and exposes the top five as one-tap overrides;
4. starts a fresh agent in the selected workspace with the task as its first prompt; and
5. opens the created agent when the client supports navigation.

Agent configuration follows the latest agent in that workspace so each project's established model,
thinking level, and mode carry forward. With no precedent, the POC uses `codex/gpt-5.6-sol` with high
reasoning, matching the current environment.

## Why deterministic routing first

The POC must make routing observable and cheap. A local ranker updates instantly, leaks no prompt to
another service, and can explain every match. Low-confidence routes are labelled **Please review**;
the user chooses before any agent is created. This gives us real corrections to evaluate before
adding an LLM router.

## Next slices

- Persist accepted and corrected routes as per-project aliases.
- Add an optional semantic/LLM ranker behind the same ranked-candidate contract.
- Decide whether dispatch should create a new workspace when no existing candidate is credible.
- Support sending to an idle existing agent as an explicit alternative to creating a new one.
- Add multi-host aggregation after the single-daemon interaction proves useful.

## Success criteria

- Dispatch is reachable from the sidebar on desktop and mobile.
- Typing a task produces a ranked, explained route without mutating daemon state.
- A manual override is always possible.
- One press creates exactly one agent in the chosen workspace and opens it.
- Routing logic is unit-tested and the plugin typechecks against Paseo 0.8.0.

Both workspace and agent inventory reads use Paseo's maximum supported page size of 200. A future
version that needs more history should follow `pageInfo` cursors rather than increasing that limit.
