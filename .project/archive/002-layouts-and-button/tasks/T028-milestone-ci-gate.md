---
id: T028
title: Run every CI and floor job locally on the milestone tip and re-time the long jobs
wave: 9
deps: [T027, T053, T054, T055, T056, T057, T058]
status: done
agent: build_T028
base: 330742b630db9c29aade74725e825b10e58c204d
worktree: null
task_branch: null
files:
  - references/ci-local.md
  - .github/workflows/ci.yml
  - .github/workflows/floor.yml
  - tools/ci-local/run-job.mjs
---

# T028 — Run every CI and floor job locally on the milestone tip and re-time the long jobs

## Context

SC8 (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."): `npm run check` passes and every job of `.github/workflows/ci.yml` and `floor.yml` passes locally (container jobs through `node tools/ci-local/run-job.mjs`, the others natively, the `nvda` lane included), the macOS-only `safari` and `voiceover` jobs excepted, which pass in CI on the milestone's pull request before the user merges it (integration `pull-request`). M002 roughly triples the stories and e2e tests: measured on 2026-10-10 (runs 38057092891 and 38050819430) `unit` took 1 to 2 minutes, each `e2e` leg 2 to 3, and `safari` 1, under 20-minute caps; this task re-times the jobs after the item waves and adds a Playwright `--shard` axis only to a job that passes about 15 minutes.

## Approach

- On the milestone tip, run in turn (one job at a time per checkout, references/ci-local.md): `npx prettier --check .` and `npm run check`; `npm exec nx -- run-many -t build pack-check`; `node tools/ci-local/run-job.mjs ci unit`; `node tools/ci-local/run-job.mjs ci e2e` (every engine and configuration, the Tailwind ones included); `node tools/ci-local/run-job.mjs floor webkit-26-4`; `node tools/ci-local/run-job.mjs floor firefox-146-e2e`; `firefox-145` and `chromium-141` natively as references/ci-local.md's table says; `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`, and the same target once with no `BROWSERS` (Playwright's Chromium and then Firefox, the job's own browsers; T041). For `chromium-141`, give `@puppeteer/browsers` an absolute `--path`, such as `--path "$(pwd)/tmp/floor-chrome"`: with a relative one the printed browser path is relative and Vitest does not find the browser (measured at the wave 3 gate, 2026-10-11: 409 of 409 passed with the absolute path). Say so in the `chromium-141` row of references/ci-local.md. Record each job's wall time and result in the Log, and the timings in `references/ci-local.md` where it lists measured runs.
- Since T043, `run-job.mjs` can run a job's legs concurrently, and locally with more e2e workers than CI. GitHub runs each leg on its own runner with the workflow's settings, so the 15-minute decision below uses one leg's time measured as CI runs it: run the longest leg alone with `--matrix` and the local worker count and build cache off (references/ci-local.md says how), not the job's concurrent wall clock.
- A job that passes about 15 minutes gets a `--shard` axis in its matrix, as `floor.yml`'s `firefox-146-e2e` has, in the workflow and kept runnable through `run-job.mjs`; otherwise leave the workflows unchanged, apart from the guidepup version steps below.
- The guidepup version steps of `.github/workflows/ci.yml` (the `voiceover` and `nvda` jobs' `id` steps, lines 129-130 and 161-163 at 1747fe0) must fail when the version lookup fails or prints nothing. Review round 1 and the security review (triaged by the orchestrator on 2026-10-12) found, verbatim: "a failed version lookup in the guidepup `id` steps does not fail the step ... `run: echo "version=$(node -p "require('@guidepup/guidepup/package.json').version")" >> "$GITHUB_OUTPUT"` ... under `bash -e`, a failing command substitution inside `echo`'s argument does not stop the step. The cache key would become `guidepup-<reader>-<os>-` and restore or save a cache that does not match any guidepup version." and "[A08] the `guidepup` step output can be empty, which collapses the cache key across versions and gives a stale reader binary, not a poisoned one. Use `set -o pipefail` and fail the step on an empty version." Triage fix: compute the version into a variable, test it is not empty, then write the output. The `guidepup setup --ci` step stays (declined by the triage: it documents the lane's setup parity with voiceover). Show the step failing on an empty version once locally, for example by running its `run` text in Git Bash with the package path swapped for a missing one, and record it in the Log; the `voiceover` job's step first runs in CI on the milestone's pull request.
- A failing job is a finding, not something to fix here: write `NEEDS-ORCHESTRATOR:` with the job, the failing test, and the engine, so the wave review turns it into a fix task in the owning item's files. Change `tools/ci-local/run-job.mjs` only if it refuses a workflow key the milestone added, with a test of the change if it has one.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; references/ci-local.md.

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- SC8

## Acceptance criteria

1. On the milestone tip, `npm run check`, `npx prettier --check .`, `build` and `pack-check`, the `unit` and every `e2e` combination through `run-job.mjs`, the floor jobs `webkit-26-4`, `firefox-146-e2e`, `firefox-145`, and `chromium-141`, and the `nvda` lane all pass locally; the Log records each job's wall time and result.
2. `references/ci-local.md` records the re-timed jobs; any job past about 15 minutes has a `--shard` axis that `run-job.mjs` runs, and no other workflow change was made besides criterion 4.
3. `npx prettier --check .` passes at the task commit.
4. Both guidepup version steps of `.github/workflows/ci.yml` exit non-zero when the version is empty or its lookup fails, and the Log records one such failing run.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f references/ci-local.md && ! rg -q -F 'echo "version=$(node -p' .github/workflows/ci.yml && npx prettier --check . && npm run check && npm exec nx -- run-many -t build pack-check && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e && FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser && npm exec nx -- run screen-reader-e2e:nvda && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — planner: build repair before wave 4 (user rulings of 2026-10-11, quoted in T035 to T041). Approach names the absolute Chrome 141 path (user ruling "5: Approve.") and the lane run with no BROWSERS, which the Verify now also runs after T041 (reached through T027). Acceptance criteria, deps, files, and wave are unchanged.
- 2026-10-12 — planner: build repair #2. T042 changes the `unit` job in `ci.yml` (`VITEST_MAX_WORKERS: 2`, `--parallel=1`) and T043 changes `run-job.mjs` and `references/ci-local.md`, both in wave 4. This task comes in wave 5, after them, so it needs no dependency edge on either. Approach gains one bullet: the shard decision uses one leg's time as CI runs it, not the concurrent local wall clock. Acceptance criteria, deps, files, and Verify are unchanged.
- 2026-10-12 — planner (build repair #3, review round 1 and the security review): the orchestrator's triage routes item 18b and security finding 2 (the guidepup version steps) to this task, which owns `.github/workflows/ci.yml` in wave 5. Approach gains one bullet with the findings verbatim; criterion 4 is new and criterion 2 allows it; the Verify first checks that the bare `echo "version=$(node -p` form is gone. Files, deps, and wave are unchanged.
- 2026-10-13 — planner (build repair 5): moved from wave 5 to wave 9, after the new tasks T053 to T058, with an edge to each. Build runs the lowest unfinished wave first (`build_state.py ready`), so in wave 5 this gate would have run before the typed scripts (T053), the review round 2 fixes (T054 to T057), and the painted-band rules (T058), and its "milestone tip" would not be the tip; T053 and T054 also edit `tools/ci-local/run-job.mjs` and T054 edits `references/ci-local.md`, which this task edits. The Interface contract gains the typed-scripts contract, because `run-job.mjs` is a typed script by then. Acceptance criteria, files, and Verify are unchanged; `npm run check` now also runs the root `typecheck` target T053 adds.
- 2026-10-14 — coder build_T028 (partial, blocked): criterion 4 done. Both guidepup `id` steps of `.github/workflows/ci.yml` now run `version=$(node -p ...)`, `test -n "$version"`, then `echo "version=$version" >> "$GITHUB_OUTPUT"`. Each step's run text, taken from ci.yml and run under `bash -e -c` (the macOS default shell) and `bash --noprofile --norc -eo pipefail -c` (`shell: bash`): real lookup exits 0 and writes `version=0.35.0`. The package path swapped for `@guidepup/missing` exits 1, and the version swapped for `''` exits 1; in both failing cases GITHUB_OUTPUT stays empty. The old form with the missing package exited 0 and wrote `version=` (empty), which reproduces the finding. `references/ci-local.md` `chromium-141` row: `--path <absolute dir>`, plus a sentence after the table that a relative `--path` prints a relative path that Vitest does not find.
- 2026-10-14 — coder build_T028, jobs run at 4d63e28 plus this diff, each through the heavy lock: `npx prettier --check .` pass, 5 s. `npm run check` pass, 26 s with 23 of 25 tasks from the Nx cache; with `--skip-nx-cache` it passes in 91 s. `ci.yml` `package` (`run-many -t build pack-check`) pass, 24 s (2 of 5 cached). `ci.yml` `unit` through run-job.mjs pass, 2 m 29 s for the leg (first setup in this checkout's volumes included), 150 s overall. Counts: 126, 504, 1713, 1 and 1 tests passed (11, 75, 139, 1 and 1 files).
- 2026-10-14 — NEEDS-ORCHESTRATOR: Claude Code killed the coder's background job queue for low system memory while `node tools/ci-local/run-job.mjs ci e2e` ran its first two legs (chromium-development and chromium-production, during the Yeti build). This was the harness's memory-pressure reaper, not a test failure. Its notice says not to restart the work until asked. After the kill: free physical memory was 5.6 GB of 32 GB, and vmmemWSL held 9.4 GB with Docker Desktop up and no container running. The heavy lock dir still holds owner.json for the dead holder pid 29020 (its child pid 13568 is gone too), so the next waiter takes it over. Docker was left up because coder rule 15 forbids stopping it by hand. Not yet run: `ci e2e` (12 legs) and the single-leg re-time, `floor webkit-26-4`, `floor firefox-146-e2e`, `firefox-145`, `chromium-141`, both `nvda` runs, the full Verify, and rule 13's `affected` check. `references/ci-local.md` gets its re-timed rows only after these runs. Logs: tmp/T028-logs/ in this worktree.
- 2026-10-14 — coder build_T028 (resumed on the orchestrator's instruction): `node tools/ci-local/run-job.mjs ci e2e --legs 1` passed all 12 legs in 20 m 8 s (1208 s). It ran with the default 3 local workers, and no leg needed a retry. Leg times and counts (passed/skipped): chromium-development 3 m 7 s (yeti-analog-e2e 1, ngx-yeti-e2e 152/1, yeti-app-e2e 618/2). chromium-production 1 m 40 s (559/61). firefox-development 4 m 26 s (1, 152/1, 616/4). firefox-production 2 m 51 s (557/63). webkit-development 4 m 8 s (1, 144/9, 612/8). webkit-production 2 m 27 s (553/67). Each tailwind-c1 and tailwind-c2 leg ran 8 passed in 13 to 17 s. The longest leg alone, as CI runs it (`--matrix engine=firefox --matrix configuration=development --legs 1 --e2e-workers 0`), passed in 10 m 10 s with the same counts. That is under about 15 minutes, so `e2e` gets no `--shard` axis.
- 2026-10-14 — NEEDS-ORCHESTRATOR: the handback was required before the run finished. After the single-leg re-time, free memory read 4.6 GB, under the orchestrator's 8 GB start threshold. Docker and WSL were already stopped, and the coder was waiting for memory to recover. Still not run: `floor webkit-26-4`, `floor firefox-146-e2e`, `firefox-145`, `chromium-141`, both `nvda` runs, the re-timed rows in references/ci-local.md, the full Verify, and the rule 13 `affected` check.
- 2026-10-14 — coder build_T028 (second resume), one heavy-lock hold per job. `floor webkit-26-4`: pass, 7 m 3 s (unit 507; ngx-yeti-e2e 136 passed, 17 skipped; yeti-app-e2e 608 passed, 12 skipped). `floor firefox-146-e2e --legs 1`: pass, shard 1 in 3 m 46 s (76/1, then 308/2) and shard 2 in 2 m 53 s (76, then 308/2). `firefox-145` (`FLOOR_FIREFOX=true ... --skip-nx-cache`): pass, 77 s, 507 tests. `chromium-141` natively: Chrome for Testing 141.0.7390.54 was installed with an absolute `--path` under this worktree's tmp/floor-chrome, and both steps ran with `CI=true` under `timeout 1800`. Pass in 12 m 23 s: unit 507 in 32 s; ngx-yeti-e2e 152 passed, 1 skipped; yeti-app-e2e 618 passed, 2 skipped. Chromium exited by itself. The 17 floor `chrome.exe` processes still listed afterwards all date from 2026-10-13 13:54 to 15:47 and run from the primary checkout's tmp/floor-chrome; none of them is this run's.
- 2026-10-14 — references/ci-local.md: a new "Re-timed after the layouts and button items" section before "Concurrent legs and local workers" records every job above with its time and counts, and the e2e shard decision (no `--shard` axis; longest leg 10 m 10 s as CI runs it). The workflows change only in criterion 4's guidepup steps. `npx prettier --check .`: clean. Rule 13, `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` through the lock: pass (typecheck and test of @ngx-yeti/source, the only affected project).
- 2026-10-14 — NEEDS-ORCHESTRATOR: the `nvda` lane is blocked by a locked Windows desktop; this is not a test defect. While `LogonUI.exe` and `LockApp.exe` run (the workstation lock screen), the lane's foreground guard throws `Error: Cannot bring the browser window to the foreground: "" keeps it.` in every test. Results: `npm exec nx -- run screen-reader-e2e:nvda --skip-nx-cache` with no BROWSERS gave 20 failed and 2 passed in 29 m 32 s (Chromium and Firefox, all with that guard message; log tmp/T028-logs/nvda.log). Retry 1 about 5 minutes later and retry 2 about 4 minutes after that, each a one-test run (`SCREEN_READER=nvda npx --no-install playwright test -c apps/screen-reader-e2e/screen-reader.config.mts --grep card--list --retries=0`), both failed with the same message. A `BROWSERS=msedge` run of the same test failed the same way. NVDA was not left running after any run. The lane needs Lars to unlock the desktop.
- 2026-10-14 — NEEDS-ORCHESTRATOR: the full Verify was not run. Free physical memory stayed between 5.5 and 6.8 GB for more than 30 minutes of checks, under the orchestrator's 8 GB start threshold, with no heavy process running (Memory Compression 1.6 GB was the largest). The Verify also cannot pass its two `screen-reader-e2e:nvda` steps while the desktop is locked. Every other step of the Verify passed in this checkout today, as recorded above.
- 2026-10-14 — coder build_T028 (third resume, after Lars unlocked the desktop): `npm exec nx -- run screen-reader-e2e:nvda --skip-nx-cache` with no BROWSERS passed 22 tests in 6 m 27 s (Playwright's Chromium, then Firefox), with no retry. `BROWSERS=msedge` passed 11 in 3 m 3 s. NVDA was not left running. Both rows were added to the re-time table in references/ci-local.md. The two NEEDS-ORCHESTRATOR items above are resolved.
- 2026-10-14 — Verify, run exactly as written through the heavy lock with HEAVY_DOCKER=1: exit 0 in 37 m 30 s. In order: npm ci; the Playwright install; ci-local.md present; the old `echo "version=$(node -p` form absent; prettier clean; `npm run check` passed for 9 projects; build and pack-check passed for 3 projects. `ci unit` passed in 2 m 19 s (1713, 1 and 1 among its counts). `ci e2e` passed all 12 legs at the default `--legs 2`: firefox-development 6 m 21 s, firefox-production 4 m 11 s, webkit-development 5 m 38 s, webkit-production 3 m 48 s, tailwind legs 19 to 34 s. `floor webkit-26-4` passed in 5 m 6 s (unit 507). `floor firefox-146-e2e` passed, shards 4 m 1 s and 4 m 11 s. firefox-145 passed 507. The nvda lane passed 22, and the msedge lane passed 11. The Nx daemon was stopped. Rule 13 (`affected ... --base=HEAD`) and `npx prettier --check .` pass after the last edit.
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T028): fail, exit 1; output tail:
  ```
  [2m[WebServer] [22m
  [2m[WebServer] [22m  ngx-yeti:static-storybook -> yeti-app:serve-ssr:development -> yeti-app:serve:development -> screen-reader-e2e:nvda -> ngx-yeti:static-storybook
  [2m[WebServer] [22m
  [2m[WebServer] [22mTask "ngx-yeti:static-storybook" was already invoked by a parent Nx process in this chain.
  [2m[WebServer] [22mThis typically happens when a task's command (e.g., "nx static-storybook ngx-yeti")
  [2m[WebServer] [22mtriggers a chain of tasks that eventually re-invokes itself.
  [2m[WebServer] [22m
  [2m[WebServer] [22mTo fix this, review the command configuration for the tasks in the chain above.
  [2m[WebServer] [22m
  Warning: command "npx --no-install playwright test -c apps/screen-reader-e2e/screen-reader.config.mts" exited with non-zero status code
  [7m[1m[31m NX [39m[22m[27m  [31mRunning target [1mnvda[22m for project screen-reader-e2e and [1m1[22m task it depends on failed[39m
  
  [2mFailed tasks:[22m
  
  [2m-[22m screen-reader-e2e:nvda
  
  
  [2mOutput of 1 successful task was not shown. Run with[22m --verbose [2mor[22m --output-style=static [2mto see it.[22m
  [2mHint: run the command with[22m --verbose [2mfor more details.[22m
  ```
- 2026-10-14 — orchestrator: landing attempt rejected (finish: Verify failed in the isolate at its last step, `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`: "Process from config.webServer was not able to start. Exit code: 1" 6.8 s in, right after the no-BROWSERS lane passed 22/22; every earlier step passed). The same lane alone in the isolate passed 11/11 (measured), so the failure is a collision between the two consecutive lane runs, not this patch. Rejected diff paths: .github/workflows/ci.yml, references/ci-local.md; patch sha256 0354c3ccbf62417f2a5462c503c830ebafca626c48c10b781f938b35f6149cda (saved as tmp/afk-m002/tools/T028-attempt1.patch). Retry: same patch on a fresh isolate.
- 2026-10-14 — coder (retry): reapplied the earlier attempt's patch tmp/afk-m002/tools/T028-attempt1.patch unchanged (ci.yml, references/ci-local.md); prettier on both files passes. The full Verify runs in the orchestrator's landing.
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T028): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m(node:20172) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:37628) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  (node:3424) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  [2m[WebServer] [22m(node:25688) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:6964) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  ```
