---
id: T088
title: Fix wave 19 cycle 1 review findings in T087
wave: 20
deps: [T087]
status: done
agent: build_t088
base: 02a0a4458601cc0b8da127402f3dfc3689d85073
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
- 2026-10-18 — build_T088 (serial round, primary checkout, base 02a0a44).
  Correction to T087's Log: its sentence "The root eslint.config.mjs was not read." is wrong. The T087 trace ran with a warm workspace-data cache, so the @nx/eslint plugin's cached createNodes result was reused and its `projectRoot === '.'` branch never loaded the root config. On a cold graph build, the plugin loads it, and changing eslint.config.mjs changes the plugin cache key for '.', which makes the cache miss.
  Cold sweep: I reran the same scratchpad read tracer (the `--import` hook in NODE_OPTIONS) over the whole `targets.test.command`, with NX_WORKSPACE_DATA_DIRECTORY set to a new, empty scratchpad directory, so every plugin's createNodes ran uncached. The tracer ran a second time on the coordinator's instruction. It is read-only logging, kept at scratchpad/trace-reads.mjs. Tests 124, pass 124. I stopped that directory's daemon and deleted the directory afterwards. Inputs before: 405 files.
  Files the cold trace read that the warm trace did not, and what I did about each:
  - eslint.config.mjs (root): existsSync, stat, readFileSync and import by @nx/eslint's createNodes for '.'. Added `{workspaceRoot}/eslint.config.mjs`. It imports only npm packages, and the trace saw no other repository import from it.
  - apps/yeti-analog/tsconfig.app.json: an existsSync probe by the uncached graph build (the vite/vitest plugins include only apps/yeti-analog). Whether the file exists shapes the inferred targets, so I added `{workspaceRoot}/apps/yeti-analog/tsconfig.app.json`.
  - vendor/yeti/node_modules/esbuild/package.json and vendor/yeti/node_modules/parse5/package.json: read by the yeti-css `runtime` input command of tools/yeti/nx-plugin.mjs. They are gitignored node_modules, which Nx cannot hash as files, and the runtime input already hashes their versions. Not added.
  - Probed but absent (no file to hash; not added): the root .eslintignore, .eslintrc*, eslint.config.{js,cjs,mts,cts,ts} and eslint.base* variants; each project's .eslintignore; .eslintcache, .npmrc, .yarnrc, .yarnrc.yml, bunfig.toml; root src and lib; tools/eslint-rules; apps/yeti-analog/.env, .env.local, .env.development, .env.development.local; deno.json, deno.jsonc, lerna.json and pnpm-workspace.yaml under apps/ and apps/yeti-analog; and the package.json and node_modules lookups of module resolution under apps/, packages/ and each package entry point's folders.
  - Seen again from the warm sweep, unchanged: vendor/yeti/package.json (.nxignore, stood for by vendor/yeti/COMMIT) and tmp/playwright-server. The environment-variable dependency (BROWSERS, PLAYWRIGHT_SERVER, SAFARI, tmp/playwright-server) stays as it is, on the coordinator's instruction; a separate task owns it.
  Change: project.json `targets.test.inputs` gains `{workspaceRoot}/apps/yeti-analog/tsconfig.app.json` and `{workspaceRoot}/eslint.config.mjs`, keeps every earlier input, and changes no other target. Inputs after: 407 files; the 2 new files are exactly these, and none were dropped. The tools/nx/browser-floor-inputs.test.mjs self-check list gains 'eslint.config.mjs' and 'apps/yeti-analog/tsconfig.app.json', and its comment now names the root ESLint config.
  Red first (unchanged project.json, extended guard, run through heavy-lock): tests 39, pass 37, fail 2. The failing cases were "@ngx-yeti/source:test hashes eslint.config.mjs" and "@ngx-yeti/source:test hashes apps/yeti-analog/tsconfig.app.json".
  Verify, exactly as written, through heavy-lock: exit 0. npm ci added 1942 packages. Guard: tests 39, pass 39, fail 0. `nx run @ngx-yeti/source:test --skip-nx-cache`: tests 126, pass 126, fail 0. `nx typecheck @ngx-yeti/source --skip-nx-cache` succeeded (scripts-coverage: 1 test, 1 pass). Prettier on the two files is clean, and the daemon stopped. Also: `npx prettier --check .` is clean. `nx affected -t lint typecheck test test-storybook --base=HEAD` affects only @ngx-yeti/source; its typecheck and test succeeded, exit 0. The Git index is untouched.
- 2026-10-17 — orchestrator Verify (sidecar gsd-path-verify/task-t088-verify): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  ```
