---
id: T059
title: Start the floor Chromium without its stack profiler so the Chromium 141 floor run exits
wave: 10
deps: [T024]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/playwright/browser-projects.mjs
  - tools/playwright/browser-projects.test.mjs
  - tools/playwright/engines.mjs
  - packages/ngx-yeti/vitest.unit.config.mts
  - docs/specs/upstream-bugs.md
  - references/ci-local.md
---

# T059 — Start the floor Chromium without its stack profiler so the Chromium 141 floor run exits

## Context

Repair task for the wave 4 review of the record after plan repair 5 (cycle 1, blocked on SC8 alone; the wave 8 review blocks on the same item). The failed criterion and the reviewer's observation are verbatim under Review findings. The orchestrator wrote this task by hand from the task template: the fix-tasks helper matched the earlier record's T052 for "wave 4 cycle 1" and created nothing.

The cause was measured after the review (orchestrator's investigator, 2026-10-13; record tmp/afk-m002/spike-chromium-141-hang.md, logs and a runnable check beside it): no test or teardown hangs. All 620 yeti-app-e2e tests pass on Chrome for Testing 141, then `browser.close()` never returns in one or more Playwright workers. On this Windows-on-Arm machine Chrome for Testing 141 is an x64 build under emulation; about one renderer in five starts with `--start-stack-profiler`, and two or three of those per full run end as a process Windows lists but can neither open nor kill. That keeps the browser's crashpad handler alive, the handler holds the browser's stdout and stderr open, Node reports the browser's `exit` but never `close`, and Playwright 1.63.0 waits on `close` with no time limit. Killing the handler makes Playwright finish at once (measured twice). With `--disable-stack-profiler` in the floor Chromium's launch arguments, three of three full runs exited by themselves with 618 passed in about 135 s and no stuck renderer; a control run without it hung again. T052 has no part in it: the spec files of T052's parent hang the same way. So the reviewer's fix direction ("no product change is indicated") is superseded by this measurement: the floor's launch options change, in the tooling this task names, which lies outside the source task's files.

## Approach

- `tools/playwright/browser-projects.mjs`: the project that runs when `FLOOR_CHROMIUM_PATH` is set starts Chromium with `--disable-stack-profiler` beside its `executablePath`. No other project's launch options change.
- `tools/playwright/engines.mjs`: the launch-options type admits `args`.
- `packages/ngx-yeti/vitest.unit.config.mts`: the Vitest floor instance for `FLOOR_CHROMIUM_PATH` passes the same argument (the same browser binary runs layer 2; its exposure there is inferred, not measured).
- `tools/playwright/browser-projects.test.mjs`: one case that fails when the floor Chromium project lacks the argument (the investigator's check file shows one way to assert it).
- `docs/specs/upstream-bugs.md`: rows for the Chromium behaviour (a renderer started with the stack profiler can end unkillable under x64 emulation on Windows on Arm) and for Playwright waiting on the browser's `close` without a limit; file nothing upstream.
- `references/ci-local.md`: one line where the floor `chromium-141` job is described, saying why the floor Chromium starts without the profiler.
- Comments keep only what the code cannot say: the reason for the argument in one line, no measurement, date, or task id.
- Run every e2e and browser test through the heavy lock, with a time limit, and kill what a hung run leaves behind before the next one.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").
2. With `FLOOR_CHROMIUM_PATH` set to Chrome for Testing 141.0.7390.54, `npm exec nx -- run-many --output-style=static -t e2e -p ngx-yeti-e2e yeti-app-e2e --skip-nx-cache` exits by itself with every test passed, three runs in a row, and no `chrome.exe` of that run stays listed afterwards; the Log records each run's counts and wall time.
3. With the same variable set, `npm exec nx -- test ngx-yeti -- --project=browser` passes.
4. `tools/playwright/browser-projects.test.mjs` fails when the floor Chromium project lacks `--disable-stack-profiler`, and `npm exec nx -- run @ngx-yeti/source:test` passes.
5. `docs/specs/upstream-bugs.md` has the two rows and `references/ci-local.md` the line; no other launch option of any project changed.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F -e "--disable-stack-profiler" tools/playwright/browser-projects.mjs && rg -q -F -e "--disable-stack-profiler" packages/ngx-yeti/vitest.unit.config.mts && npx prettier --check . && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app-e2e && FLOOR_CHROMIUM_PATH="$(npx --no-install @puppeteer/browsers install chrome@141.0.7390.54 --path "$(pwd)/tmp/floor-chrome" | awk '{print $2}')" && test -x "$FLOOR_CHROMIUM_PATH" && export FLOOR_CHROMIUM_PATH && timeout 1200 npm exec nx -- test ngx-yeti --skip-nx-cache -- --project=browser && timeout 1200 npm exec nx -- run-many --output-style=static -t e2e -p ngx-yeti-e2e yeti-app-e2e --skip-nx-cache; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Review findings

### sc8
Criterion: `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").
- every job of ci.yml and floor.yml passes locally — found: floor chromium-141: layer 2 507 of 507 and ngx-yeti-e2e 152 passed, but the step failed: the gate step was stopped after an hour-long hang (summary.txt exit 1) and the rerun of the whole step alone (floor-chromium-141-rerun.log, read last) ends `EXIT 1`: layer 2 507 of 507 and ngx-yeti-e2e 152 passed again, then yeti-app-e2e listed all 620 tests as started, printed no passed or failed count and no failure detail, and `playwright test` exited non-zero after 10 m 19 s (a healthy run of this leg takes about 2.6 m). So the step failed twice on the tip without naming a failing test. fix: no product change is indicated (the same product tree passed these table cases on Chrome 141 in the earlier gate's rerun: 617 passed, the one failure being setup-serving.spec.ts:84, since fixed). Run the floor chromium-141 step alone on the tip until it ends with an exit code (`npm exec nx -- run-many --output-style=static -t e2e -p ngx-yeti-e2e yeti-app-e2e` with `FLOOR_CHROMIUM_PATH` set as tmp/afk-m002/wave-gate.mjs does), with no other heavy job running; if the Chrome 141 main processes die again in table's "rule under forced colours" cases of yeti-app-e2e, capture the browser's stderr and the Playwright trace for apps/yeti-app-e2e/src/table.spec.ts, and decide from that whether it is a machine-load limit or a Chrome 141 crash that needs an upstream-bugs row.

## Log

- 2026-10-13 — orchestrator: created by hand from the wave 4 review (record after plan repair 5, cycle 1) because `dispatch_driver.py fix-tasks --wave 4 --cycle 1` returned `exists` for the earlier record's T052. `files` are the tooling the measured cause names, not the source task's files (documented plan defect: the batch's files hold none of them). Evidence: tmp/afk-m002/spike-chromium-141-hang.md.
