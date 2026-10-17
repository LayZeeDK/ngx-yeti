---
id: T088
title: Fix wave 19 cycle 1 review findings in T087
wave: 20
deps: [T087]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T088 — Fix wave 19 cycle 1 review findings in T087

## Context

Repair task created from the wave 19 cycle 1 review of T087.
The failed criteria and every reviewer observation are recorded verbatim under Review findings.
The source task contracts are unchanged; read them and .project/intent/INTENT.md before editing.

## Approach

- Fix only what the Review findings name, inside the listed files; do not change the source
  tasks' acceptance criteria or interface contracts.
- Re-run the source tasks' Verify commands after the fix and record the result in the Log.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. The Log records the sweep of every test file in `targets.test.command`: the repository files each reads and whether each was already an input.

## Verify

```bash
set -e
(
set -o pipefail && npm ci && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
)
```

Heavy: no

## Review findings

### t087_ac3
Criterion: The Log records the sweep of every test file in `targets.test.command`: the repository files each reads and whether each was already an input.
- The Log records the sweep of every test file in `targets.test.command`: the repository files each reads and whether each was already an input. — found: the sweep entry for tools/nx/browser-floor-inputs.test.mjs counts the project-graph reads of its `nx show` spawns as the test's reads (that is how it found project.json and the tsconfig.json files), but it states "The root eslint.config.mjs was not read." That is wrong when the @nx/eslint plugin cache misses. node_modules/@nx/eslint/dist/src/plugins/plugin.js:48-62: on a cache miss, for `projectRoot === '.'` it builds an `ESLint` for the root config dir and calls `isPathIgnored`, which loads the root eslint.config.mjs. The root project `@ngx-yeti/source` exists (root project.json) and has no `lint` target (measured: `nx show project @ngx-yeti/source --json` targets are `test`, `typecheck`, `local-registry`), so the plugin does run that branch for '.'. The plugin cache key for '.' includes its parent config (plugin.js:105-112), so the cache misses exactly when eslint.config.mjs changes, and on every cold workspace-data dir. tmp/afk-m002/wave19-thermos-quality.md H1 measured the read with an empty `NX_WORKSPACE_DATA_DIRECTORY` (the cold run imports eslint.config.mjs; the warm run the Log traced does not). Measured at the review base: `eslint.config.mjs` is not among the 405 inputs (only the 8 project-level eslint.config.mjs files are). So an edit to eslint.config.mjs that makes the guard's `nx show` fail (for example an export the project configs import from it, packages/ngx-yeti/eslint.config.mjs:3-6) leaves the root test hash unchanged and replays a cached pass: an Nx inputs gap, MAJOR under Lars's ruling "Nx cache/inputs/outputs issues are important". tmp/afk-m002/wave19-thermos-bugs.md says the root config is never loaded because every project has its own config; that reading misses the `projectRoot === '.'` branch, so this review follows the quality review's measurement and the plugin source. fix: in project.json `targets.test.inputs` add `"{workspaceRoot}/eslint.config.mjs"`; add `'eslint.config.mjs'` to the self-check list at tools/nx/browser-floor-inputs.test.mjs:118-136 and show that case failing on the current project.json first. Redo the guard's sweep trace with `NX_WORKSPACE_DATA_DIRECTORY` set to an empty temp directory so every plugin's createNodes runs uncached (eslint, playwright, storybook, vite, vitest), and record in the Log every file that cold trace reads that is not an input, with the reason for each one left out (vendor/yeti/package.json under .nxignore is the known one). Correct the Log's "not read" line.

## Log

- 2026-10-17 — created by dispatch_driver.py fix-tasks from wave 19 cycle 1
