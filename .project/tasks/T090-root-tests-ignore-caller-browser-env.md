---
id: T090
title: Make the root test target's tests independent of the caller's BROWSERS, PLAYWRIGHT_SERVER, SAFARI and FLOOR_* variables and of tmp/playwright-server
wave: 20
deps: [T061, T066]
status: pending
agent: null
base: null
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
