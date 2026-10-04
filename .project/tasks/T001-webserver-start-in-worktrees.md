---
id: T001
title: Reproduce and fix the Playwright webServer start in pipeline worktrees
wave: 1
deps: []
status: done
agent: build_T001
base: 5ecb15d82792a80be67e0f23a67fd8fbd57b4570
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/ngx-yeti-e2e/playwright.config.mts
  - apps/yeti-analog-e2e/playwright.config.mts
  - docs/decisions/2026-10-03-test-infrastructure.tsv
---

# T001 — Reproduce and fix the Playwright webServer start in pipeline worktrees

## Context

The program synthesis decision "Playwright webServer failure 'nx' is not recognized" (low confidence) records that `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` could not start their web servers in a disposable worktree under the C: temp folder, under both npm installs and with both `npx nx` and `npm exec -- nx`; the cause was never found. GSD Path runs every task and review Verify in a linked worktree with a fresh `npm ci`, so a worktree-only failure would block every e2e Verify of this milestone. This task is the wave-1 spike: reproduce or rule out the failure in a pipeline-created linked worktree and in the primary checkout, fix `webServer.command` in all three e2e projects if it reproduces, and record the outcome either way. The milestone synthesis lists it as wave-1 blocker 1; INTENT.md Scope: in names the three configs and says `yeti-analog-e2e` is touched only for this fix.

## Approach

- Reproduce first, in two places, and keep the evidence: (1) a linked worktree created the way the pipeline creates task worktrees (ask the orchestrator for the path its isolation helper uses, or create one with `git worktree add` beside the primary checkout on the D: drive), after `npm ci --no-audit --no-fund`; (2) the primary checkout. In each, run `npx nx e2e ngx-yeti-e2e` and `npx nx e2e yeti-app-e2e` and capture the webServer's stderr.
- The three commands today are `npx nx run ...` strings in `apps/yeti-app-e2e/playwright.config.mts`, `apps/ngx-yeti-e2e/playwright.config.mts`, and `apps/yeti-analog-e2e/playwright.config.mts`. On Windows, Playwright spawns `webServer.command` through a shell whose PATH may not resolve the `nx` bin shim inside a nested process; the fix (if needed) must not depend on PATH resolution of `nx`, for example by invoking Nx's CLI through `node` with the resolved path of the installed `nx` package. The coder picks the mechanism; apply the same one to all three configs.
- Keep everything else in each config: `cwd: workspaceRoot`, the `env: { PORT }` and its comment (it keeps `@nx/playwright` from inferring a `serve-ssr` dependency), `reuseExistingServer`, the timeouts, the readiness `url` (the `highlight` readiness URL moves to `card` later, in the placeholder task), and `projects: browserProjects()`. Do not edit `tools/playwright/browser-projects.mjs`, the CI or floor workflows, or anything else under `apps/yeti-analog` or `apps/yeti-analog-e2e` beyond the command.
- If it does not reproduce in either place, leave the configs unchanged and record that the scratch location under the C: temp folder was the cause.
- Append one row to `docs/decisions/2026-10-03-test-infrastructure.tsv` in its column order (`ts`, `phase`, `decision`, `why`, `evidence`, `result`, tab-separated, UTC timestamp), phase `e2e`, whose text names `webServer`, both reproduction locations, the cause found, and the fix or the scratch-location ruling.
- Bisect-safe commit: `npx prettier --check .` and `npx nx run-many -t lint typecheck -p yeti-app-e2e ngx-yeti-e2e yeti-analog-e2e` pass. Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (layer 4, the e2e projects, engines).

## Interface contract

- None

## Intent coverage

- SC6

## Acceptance criteria

1. `npx nx e2e ngx-yeti-e2e` and `npx nx e2e yeti-app-e2e` start their web servers and pass on Chromium both in a pipeline-created linked worktree and in the primary checkout; the task Log records the command, location, and exit code of each of the four runs, and the stderr of any failed start before the fix.
2. If the failure reproduced, the `webServer.command` of all three e2e configs uses the same PATH-independent invocation and `npx nx e2e yeti-analog-e2e` still starts its server and passes; if it did not reproduce, the three configs are unchanged.
3. `docs/decisions/2026-10-03-test-infrastructure.tsv` has one new row, phase `e2e`, that names `webServer`, the two reproduction locations, the cause, and the fix or the scratch-location ruling.
4. `npx prettier --check .` and `npx nx run-many -t lint typecheck -p yeti-app-e2e ngx-yeti-e2e yeti-analog-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx e2e ngx-yeti-e2e && npx nx e2e yeti-app-e2e && npx nx e2e yeti-analog-e2e && rg -q webServer docs/decisions/2026-10-03-test-infrastructure.tsv
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
- 2026-10-04 — coder: reproduced. Worktree W = C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\task\T001 (pipeline isolation helper), after `npm ci --no-audit --no-fund` (exit 0). Primary P = D:\projects\github\LayZeeDK\ngx-yeti.
  - Run 1, W, before fix: `npx nx e2e ngx-yeti-e2e --skip-nx-cache` exit 1. webServer stderr: `Running target build-storybook for project ngx-yeti and 1 task it depends on failed ... Failed tasks: - yeti-css:yeti-build` / `Error: Process from config.webServer exited early.`; the stored Nx terminal output of the nested task reads `> node bin/build.js` / `'node' is not recognized as an internal or external command, operable program or batch file.` Reproduced twice. Without `--skip-nx-cache` it passed because yeti-build was a cache hit in the shared user-level Nx cache, so a cached run masks it.
  - Cause (measured with a NODE_OPTIONS `--import` logger recording each node process's PATH and the PATH handed to each `shell: true` spawn): every `npx` layer and every Nx run-commands layer prepends `node_modules/.bin` dirs for each ancestor of the workspace. Chain: npx nx e2e (4717) -> playwright (5664) -> `npx nx run ngx-yeti:static-storybook` (6516) -> the @nx/storybook executor's own `npx nx run ngx-yeti:build-storybook` (7368) -> cmd for `node bin/build.js` with PATH 8311 chars, past cmd.exe's 8191 limit, so cmd stops searching PATH and `node`/`nx` are not found. The earlier C: temp-folder failure is the same limit (also a long, deep path).
  - Run 2, W, before fix: `npx nx e2e yeti-app-e2e --skip-nx-cache` exit 0, 12 passed (one nested Nx level only; deepest cmd PATH 7459).
  - Fix: all three `webServer.command`s run Nx as `"<process.execPath>" "<fileURLToPath(import.meta.resolve('nx'))>" run ...` instead of `npx nx run ...`, removing one npx layer and any PATH lookup for node or nx at the top. Deepest cmd PATH in W drops from 8311 to 7459. The executor's inner npx layer is outside this task, so a much deeper checkout could still hit the limit.
  - Run 1 after fix, W: `npx nx e2e ngx-yeti-e2e --skip-nx-cache` exit 0, 3 passed. `npx nx e2e yeti-app-e2e --skip-nx-cache` exit 0, 12 passed. `npx nx e2e yeti-analog-e2e --skip-nx-cache` exit 0, 3 passed (chromium, firefox, webkit).
  - Run 3, P, unchanged config (no files copied there): `npx nx e2e ngx-yeti-e2e --skip-nx-cache` exit 0, 3 passed (deepest cmd PATH 5749, short D: path). At P HEAD 8decde2 (T003 landed) `npx nx e2e yeti-app-e2e --skip-nx-cache` first exited 1 twice with `X [ERROR] Could not resolve "ngx-yeti/accessibility.css"` (yeti-app:build:development) because P's node_modules was stale (T003 changed package.json/package-lock.json; node_modules/ngx-yeti link missing). Not a webServer start failure. Ran `npm ci --no-audit --no-fund` in P (exit 0).
  - Run 4, P, after npm ci: `npx nx e2e yeti-app-e2e --skip-nx-cache` exit 0, 12 passed; `npx nx e2e ngx-yeti-e2e --skip-nx-cache` exit 0, 3 passed. The fix holds in P too: it only removes a PATH layer and resolves node and nx by absolute path, and P's PATH is already well under the limit.
  - TSV: appended one `e2e` row to docs/decisions/2026-10-03-test-infrastructure.tsv (6 columns).
  - Checks in W: `npx nx run-many -t lint typecheck -p yeti-app-e2e ngx-yeti-e2e yeti-analog-e2e --skip-nx-cache` exit 0. `npx prettier --check .` reports 8 files, all `.project/` pipeline artifacts already unformatted at base (CHARTER, INTENT, PLAN, DOCS-AUDIT, evidence-codebase, RESEARCH, ROADMAP, STATE); none is in this task's files; the changed product files pass prettier.
  - Verify (verbatim, W): exit 0 — ngx-yeti-e2e 3 passed, yeti-app-e2e 12 passed, yeti-analog-e2e 3 passed, rg found webServer.
- 2026-10-04 — orchestrator Verify (isolate gsd-path-task/T001): pass, exit 0; output tail:
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
