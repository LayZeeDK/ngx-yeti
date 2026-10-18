---
id: T068
title: Split the pressed-contrast check of button--variants by colour scheme so it holds in the floor WebKit job with every assertion kept
wave: 12
deps: [T020]
status: done
agent: build_T068
base: 131cf8e920681d3fe01528a6f2df874ee3b386e1
worktree: null
task_branch: null
files:
  - apps/ngx-yeti-e2e/src/button.spec.ts
---

# T068 — Split the pressed-contrast check of button--variants by colour scheme so it holds in the floor WebKit job with every assertion kept

## Context

Seventh build repair (2026-10-15): the gate finding of the wave 11 gate at b1a3897, triaged by Claude on 2026-10-15 in the git-ignored local record tmp/afk-m002/lars-review/r4/triage.md as group D, item 8. The gate log is tmp/afk-m002/gate-wave11-c1/floor-webkit.log (lines 342 to 417) and the idle rerun is tmp/afk-m002/gate-wave11-rerun/floor-webkit-2.log. It blocks the local half of INTENT SC8 (every CI and floor job passes locally), which T028 owns; this task owns no criterion and makes the floor WebKit job pass without a flaky test.

Triage item 8, verbatim: "apps/ngx-yeti-e2e/src/button.spec.ts:244 (`button--variants` keeps every variant and emphasis at least 4.5:1 while pressed, in both schemes) hovers and presses about 50 buttons per scheme inside one 30 s test timeout; in the floor WebKit 26.4 job it timed out at button 49, then at button 35 on retry, then passed, and the job counts the flaky test as a failure (tmp/afk-m002/gate-wave11-c1/floor-webkit.log:342-417, measured). It passed with no flake at 13af1fd (gate-wave9-c3). Not the round 4 reviewer's Storybook run: that ran 02:44-02:46, the step 03:08-03:17 (file times, measured). Blocks SC8's local half. Fix: give the loop a budget that holds on the floor engines (one test per scheme or per variant, or a slow-test budget), keeping every assertion."

From the gate log (measured, quoted): "1) [webkit] › src/button.spec.ts:244:7 › button--variants › keeps every variant and emphasis at least 4.5:1 while pressed, in both schemes / Test timeout of 30000ms exceeded. / Error: locator.hover: Test timeout of 30000ms exceeded. ... waiting for locator('#storybook-root').locator('[yetibutton]').nth(49)" at `await button.hover();` (button.spec.ts:254); "Retry #1 ... Error: locator.evaluate: Test timeout of 30000ms exceeded. ... waiting for locator('#storybook-root').locator('[yetibutton]').nth(35)" in `backgroundsOf` (button.spec.ts:136, called from :269); then "1 flaky ... 17 skipped ... 135 passed (3.3m)" and "Warning: command "playwright test" exited with non-zero status code". `apps/ngx-yeti-e2e/playwright.config.mts` sets `failOnFlakyTests: Boolean(process.env['CI'])`, and the container jobs set `CI=true`. The idle rerun of the same job (floor-webkit-2.log) passed: `ngx-yeti-e2e` 136 passed, `yeti-app-e2e` 608 passed, "pass floor-webkit-26-4 in 7 m 53 s".

Read by the planner at b1a3897: the test (`apps/ngx-yeti-e2e/src/button.spec.ts:243-283`) opens `button--variants` once, collects every `[yetibutton]` under the story root (both scheme wrappers, `data-scheme` light and dark, drawn by the spec's own scheme wrapper at :44-50), and for each one hovers, presses with the real mouse, finishes its transitions, reads `:active` and the colour, computes the contrast against `backgroundsOf(button)`, and releases; it collects failures and asserts the list is empty. The file already writes one test per colour scheme for `button--toggle` (`records the ratios between the toggle states with a ${colorScheme} page scheme`, :308).

## Approach

- Split the test into one test per colour scheme (the `button--toggle` pattern at :308), each pressing only the buttons inside its own `[data-scheme]` wrapper with the same per-button steps and the same `expect(failures).toStrictEqual([])`; each test also asserts it found the buttons of its scheme, and together they cover every button the single test covered (no variant, emphasis, or scheme dropped). Each title names its scheme.
- Measure in the floor WebKit job and record in the Log the duration of each new test from the Playwright report. When a per-scheme test takes more than half of its 30 s timeout there, split further by variant inside the scheme instead of raising the timeout; a raised timeout or `test.slow()` is allowed only with that measurement recorded and a reason the split cannot hold.
- Keep the spec comment above the describe (why a real pointer holds each button), and keep every other test in the file as it is. No assertion gets weaker: no skip, no lower ratio, no raised retry budget.
- The floor job is the measurement: run `node tools/ci-local/run-job.mjs floor webkit-26-4` (the whole job, since the timeout appeared under the job's own load) and the spec in the `ci e2e` development legs of Chromium, Firefox, and WebKit.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (e2e projects, engines, the floor), `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `apps/ngx-yeti-e2e/src/button.spec.ts` checks the pressed ratio of `button--variants` in one test per colour scheme (or finer), each asserting it found its scheme's buttons, and together the tests assert every button the single test asserted, with the same 4.5:1 threshold and `:active` check.
2. The Log records each new test's duration in the floor WebKit run, each at most half of its timeout, or the measured reason for a raised budget.
3. `node tools/ci-local/run-job.mjs floor webkit-26-4` passes with no flaky test, and the spec passes in the `ci e2e` development legs of Chromium, Firefox, and WebKit.
4. Lint and typecheck of `ngx-yeti-e2e` pass, and `npx prettier --check` passes on the spec.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "while pressed, in both schemes" apps/ngx-yeti-e2e/src/button.spec.ts && rg -q -F "while pressed" apps/ngx-yeti-e2e/src/button.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-e2e && node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=chromium button.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox button.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit button.spec.ts && node tools/ci-local/run-job.mjs floor webkit-26-4 && npx prettier --check apps/ngx-yeti-e2e/src/button.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 7), from tmp/afk-m002/lars-review/r4/triage.md group D, item 8, and the wave 11 gate log.
- 2026-10-15 — build_T068: split the single pressed-contrast test of `button--variants` into one test per scheme (`for (const scheme of ['light','dark'])`), each locating `[data-scheme="<scheme>"] [yetibutton]`, asserting a non-empty set, same hover/press/`:active`/4.5:1 steps and `expect(failures).toStrictEqual([])`. The failure text dropped its now-constant scheme suffix. Only `apps/ngx-yeti-e2e/src/button.spec.ts` changed.
- Verify (exact, via heavy lock) exit 0: lint+typecheck ngx-yeti-e2e pass; ci e2e button.spec.ts chromium 13 passed, firefox 13 passed, webkit 9 passed / 4 skipped; floor webkit-26-4 pass (8 m 4 s): ngx-yeti-e2e 137 passed / 17 skipped, yeti-app-e2e 608 passed / 12 skipped, no flaky; prettier check clean.
- Durations in the floor webkit-26-4 job container (a separate run of the job with the spec only, `--reporter=list`; the full-job dot reporter prints none): light 14.7 s, dark 13.4 s, each under half of the 30 s timeout (15 s), but light is close to the line. If it flakes again, split by variant within the scheme.
- Rule 13 checks: prettier --check . clean; nx affected -t lint typecheck test test-storybook --base=HEAD succeeded (5 tasks, 4 cached; no storybook project affected).
- 2026-10-15 — orchestrator Verify (isolate gsd-path-task/T068): pass, exit 0; output tail:
  ```
  [floor-webkit-26-4] - Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Generating FESM and DTS bundles
  [floor-webkit-26-4] [32m✔[39m Built ngx-yeti/spinner
  [floor-webkit-26-4] - Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Generating FESM and DTS bundles
  [floor-webkit-26-4] [32m✔[39m Built ngx-yeti/stack
  [floor-webkit-26-4] - Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Generating FESM and DTS bundles
  [floor-webkit-26-4] [32m✔[39m Built ngx-yeti/table
  [floor-webkit-26-4] - Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Generating FESM and DTS bundles
  [floor-webkit-26-4] [32m✔[39m Built ngx-yeti/timeline
  [floor-webkit-26-4] - Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [floor-webkit-26-4] [32m✔[39m Generating FESM and DTS bundles
  [floor-webkit-26-4] [32m✔[39m Built ngx-yeti/visually-hidden
  ```
