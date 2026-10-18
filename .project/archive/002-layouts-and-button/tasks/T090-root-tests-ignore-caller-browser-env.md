---
id: T090
title: Make the root test target's tests independent of the caller's BROWSERS, PLAYWRIGHT_SERVER, SAFARI and FLOOR_* variables and of tmp/playwright-server
wave: 20
deps: [T061, T066]
status: done
agent: build_t090
base: 2feb1a1d383e820e22a5c46ffdc81954e49058e4
worktree: null
task_branch: null
files:
  - tools/playwright/engines.test.mjs
  - tools/playwright/vitest-configs.test.mjs
---

# T090 — Make the root test target's tests independent of the caller's BROWSERS, PLAYWRIGHT_SERVER, SAFARI and FLOOR_* variables and of tmp/playwright-server

## Context

The wave 19 cycle 1 review (.project/plan/build-recovery-a1815a6374b5c99bc5628167f1aca227c702eb6f/review/wave-19.cycle1.md, moved there by the recovery) passed T087's other criteria and recorded a MAJOR inherited warning under Lars's ruling, verbatim: "Nx cache/inputs/outputs issues are important". The root `@ngx-yeti/source:test` result depends on the unhashed environment variables BROWSERS, PLAYWRIGHT_SERVER and SAFARI and on the gitignored tmp/playwright-server. Two places read them:

- tools/playwright/engines.test.mjs:163 calls `vitestBrowserApi()` with no env, so it takes `localEnv()` (tools/playwright/engines.mjs:43-46: `process.env` plus PLAYWRIGHT_SERVER from tmp/playwright-server through `serverFileEndpoint()`). With BROWSERS=safari, `engines()` throws and the test fails; with a remote engine in BROWSERS it pins the port.
- tools/playwright/vitest-configs.test.mjs:31 imports every Vitest browser config under apps/ and packages/; those configs call `vitestBrowserApi()` and read the floor variables (FLOOR_*, SAFARI) at module top. Only the unit-config test at :53 clears FLOOR_CHROMIUM_PATH, FLOOR_FIREFOX and FLOOR_WEBKIT, and only around its own import.

An Nx input cannot cover a gitignored file under tmp/, and hashing the variables would split the cache for runs that do not depend on them, so the fix makes the tests independent of the caller's environment instead. Advisory: tmp/afk-m002/wave19-thermos-bugs.md H1, measured with a probe. The planner's sweep of the other files in `targets.test.command` at a1815a6: browser-projects.test.mjs and playwright-configs.test.mjs pass an explicit env to every call (playwright-configs loads each config in a child with its own env); container.test.mjs, run-job.test.mjs, navigation-budget.test.mjs, lars-verify-spec.test.mjs and browser-floor-inputs.test.mjs read none of these variables (outside tools/playwright only tools/playwright-server/server.mjs names them, and no test imports it). The coder repeats that sweep. T061 last changed engines.test.mjs and T066 last changed vitest-configs.test.mjs (file overlap).

## Approach

- Sweep every test file in `targets.test.command` and the modules they import for reads of BROWSERS, PLAYWRIGHT_SERVER, SAFARI, FLOOR_* (FLOOR_FIREFOX_E2E included) and tmp/playwright-server that take the caller's environment, and record the sweep in the Log. If it finds such a read in a file outside this task's files, stop and report it as blocked rather than editing that file.
- engines.test.mjs: pass an explicit env to every call that defaults to `localEnv()` or `process.env`.
- vitest-configs.test.mjs: clear BROWSERS, PLAYWRIGHT_SERVER, SAFARI and every FLOOR_* variable before the configs are imported, keep PLAYWRIGHT_SERVER from falling back to tmp/playwright-server (for example by setting it to an empty string or a fixed dummy, whichever engines.mjs treats as no server), and restore each variable afterwards, the way the unit-config test does today. Mind ESM module caching: a config imported once keeps the env it saw.
- Show it failing first: run the unchanged test files under `BROWSERS=safari` (and the other variables the Verify sets) and record the failing cases in the Log, then make them pass. Product code (engines.mjs, browser-projects.mjs, the configs) does not change.
- Follow the repository's script rules (typed `.mjs`, `// @ts-check`) and the type-safety skill; no new files.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `node --test tools/playwright/engines.test.mjs tools/playwright/vitest-configs.test.mjs` passes both with BROWSERS=safari, SAFARI=true, PLAYWRIGHT_SERVER=ws://127.0.0.1:1/unused, FLOOR_WEBKIT=true, FLOOR_FIREFOX=true and FLOOR_CHROMIUM_PATH=/no/such/chrome set and with all of them unset; the Log records the same command failing on the unchanged files with those variables set, naming the failing cases.
2. No test in the two files calls `vitestBrowserApi`, `engines`, `chromiumFloor`, `vitestInstances` or `browserProjects` without an explicit env, and no config import in vitest-configs.test.mjs sees the caller's BROWSERS, PLAYWRIGHT_SERVER, SAFARI or FLOOR_* values or tmp/playwright-server; every variable the tests change is restored afterwards.
3. The Log records the sweep of every test file in `targets.test.command` for those reads, with the result per file.
4. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache`, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` and `npx prettier --check` on the two files pass.

## Verify

```bash
set -o pipefail && npm ci && BROWSERS=safari SAFARI=true PLAYWRIGHT_SERVER=ws://127.0.0.1:1/unused FLOOR_WEBKIT=true FLOOR_FIREFOX=true FLOOR_CHROMIUM_PATH=/no/such/chrome node --test tools/playwright/engines.test.mjs tools/playwright/vitest-configs.test.mjs && env -u BROWSERS -u SAFARI -u PLAYWRIGHT_SERVER -u FLOOR_WEBKIT -u FLOOR_FIREFOX -u FLOOR_FIREFOX_E2E -u FLOOR_CHROMIUM_PATH node --test tools/playwright/engines.test.mjs tools/playwright/vitest-configs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check tools/playwright/engines.test.mjs tools/playwright/vitest-configs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair after the wave 19 cycle 1 review's inherited warning)
- 2026-10-18 — build_T090 (serial round, primary checkout, base 2feb1a1). No scratchpad script was written or run.
  Sweep: I searched every test file in `targets.test.command`, plus the modules they import, for reads of BROWSERS, PLAYWRIGHT_SERVER, SAFARI, FLOOR_* (FLOOR_FIREFOX_E2E included) and tmp/playwright-server that take the caller's environment, that is, calls that leave env out and so default to `localEnv()`, `process.env` use, and config imports. Per file:
  - tools/playwright/engines.test.mjs: one read takes the caller's env, at :163, `vitestBrowserApi()` with no env (fixed). Every other `engines`, `vitestInstances`, `vitestBrowserApi` and `chromiumFloor` call passes an explicit env.
  - tools/playwright/vitest-configs.test.mjs: the config imports at :31 and :62 run each Vitest browser config's top level. That code calls `vitestBrowserApi()`, `vitestInstances(...)` and `chromiumFloor()` with no env (so `localEnv()` and tmp/playwright-server) and reads FLOOR_FIREFOX, SAFARI and FLOOR_WEBKIT from `process.env` (packages/ngx-yeti/vitest.unit.config.mts:13-54, packages/ngx-yeti/vitest.config.mts:11,42, packages/ngx-yeti-testing/vitest.config.mts:45,77). Fixed in the test, and the configs are unchanged.
  - tools/playwright/browser-projects.test.mjs: all three `browserProjects` calls (:8, :30, :39) pass an explicit env. Clean.
  - tools/playwright/playwright-configs.test.mjs: each config loads in a child with only the env the test passes (:29-37). Clean.
  - tools/playwright/navigation-budget.test.mjs, tools/playwright-server/container.test.mjs (container.mjs names none of the variables), tools/ci-local/run-job.test.mjs (run-job.mjs names none), tools/verification/lars-verify-spec.test.mjs (passes process.env to its writer child; lars-verify-spec.mjs names none) and tools/nx/browser-floor-inputs.test.mjs (its `nx show` output lists env names, not values): none read these variables. Outside tools/playwright, only tools/playwright-server/server.mjs names them, and no test imports it. No read sits outside this task's files, so nothing is blocked.
  Red first (unchanged files, `BROWSERS=safari SAFARI=true PLAYWRIGHT_SERVER=ws://127.0.0.1:1/unused FLOOR_WEBKIT=true FLOOR_FIREFOX=true FLOOR_CHROMIUM_PATH=/no/such/chrome node --test tools/playwright/engines.test.mjs tools/playwright/vitest-configs.test.mjs`, run through heavy-lock): tests 19, pass 14, fail 5. Every failure is `Error: BROWSERS=safari: "safari" is not one of ...`, in these cases: "names the Vite server URL 127.0.0.1 at the port vitestBrowserApi() picks"; "packages/ngx-yeti-testing/vitest.config.mts binds its browser server to 127.0.0.1 at a picked port"; "packages/ngx-yeti/vitest.config.mts binds ..."; "packages/ngx-yeti/vitest.unit.config.mts binds ..."; "the unit config starts the Chromium floor build without the stack profiler".
  Change:
  - engines.test.mjs: `vitestBrowserApi({})`.
  - vitest-configs.test.mjs: every config import goes through `importConfig(href, env)`. It deletes BROWSERS, PLAYWRIGHT_SERVER, SAFARI, FLOOR_CHROMIUM_PATH, FLOOR_FIREFOX, FLOOR_FIREFOX_E2E, FLOOR_WEBKIT, every other set FLOOR_* variable, and each key of `env`. It then sets PLAYWRIGHT_SERVER to `ws://127.0.0.1:1/unused`: an empty value would make `localEnv()` fall back to tmp/playwright-server, and with BROWSERS unset no local engine uses the dummy. Then it applies `env`, imports, and restores every variable in a `finally`, so the restore also runs when the import fails.
  - The unit-config test passes `{ FLOOR_CHROMIUM_PATH: '/floor/chrome' }` through the same helper and keeps its `?floor` URL, so it gets a fresh module. Each config URL is imported once.
  - A new last test, "leaves the caller browser variables as it found them", checks that those variables and the set of FLOOR_* names match a snapshot taken when the module loads. A whole-env comparison is not possible, because the imported packages set their own keys (PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS, STORYBOOK_ANGULAR_BUILDER_OPTIONS_JSON).
  After the change, the same set-variables command gives tests 20, pass 20, fail 0.
  Verify, exactly as written, through heavy-lock: exit 0. npm ci added 1942 packages. Set-variables run: tests 20, pass 20. Unset run: tests 20, pass 20. `nx run @ngx-yeti/source:test --skip-nx-cache`: tests 127, pass 127, fail 0. `nx typecheck @ngx-yeti/source --skip-nx-cache` succeeded (1 test, 1 pass). Prettier on the two files is clean, and the daemon stopped. Also: `npx prettier --check .` is clean, and `nx affected -t lint typecheck test test-storybook --base=HEAD` succeeded for 9 projects and 2 dependency tasks (25 tasks, 7 cache hits), exit 0. The Git index is untouched.
- 2026-10-18 — orchestrator Verify (sidecar gsd-path-verify/task-t090-verify): pass, exit 0; output tail:
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
