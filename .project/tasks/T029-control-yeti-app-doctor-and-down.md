---
id: T029
title: Make control-yeti-app's doctor see library edits and its down keep the record of an incomplete teardown
wave: 2
deps: [T005]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-yeti-app/features/build-configurations.md
---

# T029 — Make control-yeti-app's doctor see library edits and its down keep the record of an incomplete teardown

## Context

Build repair. User ruling, verbatim (2026-10-11): "Wave-1 defects: Approve recommendation." The recommendation it approves: "A patch wave through plan: one or two fix tasks appended to M002, each with its own Verify and review. This costs a plan re-gate with your approval. It fixes `doctor` before wave-3 coders rely on it to walk their routes, and the stub tests before 28 routes depend on them." This task fixes the two confirmed defects in the control script T005 landed (8802d37). Neither breaks an acceptance criterion of T005, so T005's contract stays as it is. The evidence, verbatim from the hand-off:

D1. control-yeti-app `doctor` reports a stale server build as fresh

- Where: `.claude/skills/control-yeti-app/scripts/control.mjs:402-405` (the `build-fresh` check, ssr mode).
- Observed: the check scans only `apps/yeti-app/src` and `packages/ngx-yeti/src`. Library code lives in `packages/ngx-yeti/<entry>/src` (card, lift, styles, and the 22 M002 entry points), so after an edit to `packages/ngx-yeti/box/src/...` doctor still reports the running SSR build as fresh.
- Fix direction: scan all of `packages/ngx-yeti` and skip `node_modules`, `storybook-static`, and `dist`, as `.claude/skills/control-ngx-yeti-storybook/scripts/control.mjs:490` already does.
- Landed by: T005 (8802d37).

D2. control-yeti-app `down` deletes its state file when teardown is incomplete

- Where: `.claude/skills/control-yeti-app/scripts/control.mjs:584`.
- Observed: `rmSync(stateFile)` runs before the exit-1 result, so a surviving server has no record; the next `up` refuses with "port in use" and `down` says there is nothing recorded to stop.
- Fix direction: remove the state file only when the port is free and no survivors remain, as the Storybook script does (`control-ngx-yeti-storybook/scripts/control.mjs:626-633`).
- Landed by: T005 (8802d37).

Wave 3 coders and the reviewers of every later wave use this script to launch the Fixture app's server build and walk their routes, so both fixes land and are reviewed in wave 2.

## Approach

- D1: the `build-fresh` check of `doctor` in `.claude/skills/control-yeti-app/scripts/control.mjs` (ssr mode) must count every source file of the library, not only the primary entry point. Scan `apps/yeti-app/src` and all of `packages/ngx-yeti`, skipping directories named `node_modules`, `storybook-static`, and `dist`. The pattern is `newestMtime(dir, skip)` in `.claude/skills/control-ngx-yeti-storybook/scripts/control.mjs` (its use for the static build is near line 490). Keep the comparison with the launch time: the script's own comment and SKILL.md's Gotchas record why the bundle's modification time cannot be used (an Nx cache restore keeps the original build's times). The check's pass and fail texts name the scanned paths; make them match.
- D2: `down` removes the state file only when the port is free and no recorded process survives. When the wait ends with a survivor or a busy port, it exits 1, keeps the file, and its result names the surviving PIDs, whether the port is free, and the state file's path, as the Storybook script's `teardown incomplete` result does (near lines 626 to 633). Follow the record through a retry: today a second `down` finds the recorded PID gone, removes the file, and exits 0 while the port is still busy, which loses the record one call later. Do not widen what `down` may stop: it still stops only processes it can prove are the recorded ones (start time and command line), and it never runs `close-all` or `kill-all`.
- Leave everything else as it is: the other warnings of the wave 1 review about this script (the liveness check of `up`, the `netstat` wording, the `taskkill /T` tree, the differences between the two control scripts) are out of scope by the user's ruling.
- Proof, as one runnable check: `.claude/skills/control-yeti-app/scripts/control.test.mjs`, a `node:test` file with no new dependency that drives `control.mjs` as a child process. One launch can serve both defects: `up --mode=ssr`, `doctor` passes; move the modification time of one library entry-point source file (for example `packages/ngx-yeti/box/src/index.ts`) past the launch time and `doctor` exits 1 with `build-fresh` failed; restore the time; a newer file under a skipped directory changes nothing; then make the teardown incomplete without leaving a real survivor, for example by pointing the recorded port at a port the test itself listens on, and assert the exit code, the kept file, and the retry. The test always ends with a complete `down`, also when an assertion fails, so the verify worktree can be removed; it leaves no tracked file changed.
- Docs in this task: `.claude/skills/control-yeti-app/SKILL.md` states the old behaviour in the `build-fresh` row of the Doctor table, in the Cleanup section, and in the `down` row of the Helpers table; `.claude/skills/control-yeti-app/features/build-configurations.md` describes `build-fresh` in its Gotchas. Update each to what the script now does, and say how to run the test. Prettier formats the tables.
- The script is Windows-only (its process table comes from `pwsh`); the test may be too. An `ssr` launch builds the app first and writes the same output folder as the e2e run, so nothing else may build in the same checkout while the test runs.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. D1: with an `ssr` instance up, `doctor` passes `build-fresh`; after the modification time of a source file under a library entry point other than the primary one (such as packages/ngx-yeti/box/src/index.ts) is later than the launch, `doctor` exits 1 and lists `build-fresh` in `failed`; a newer file under a directory named `node_modules`, `storybook-static`, or `dist` inside packages/ngx-yeti does not fail the check. On the current script the second step still exits 0.
2. D2: when `down` ends with a recorded process alive or the port still listening, it exits 1, the state file (state.json under tmp/control-yeti-app/) still exists, and the result names the surviving PIDs, whether the port is free, and the state file's path; a second `down` while the port is still busy also exits 1 and keeps the file; `down` after the port is free and the survivors are gone exits 0 and removes the file. On the current script the first `down` already removes the file.
3. `down` still refuses a PID whose start time or command line does not match the record (exit 2, file kept), and stops no process outside the recorded tree.
4. `node --test .claude/skills/control-yeti-app/scripts/control.test.mjs` passes, covers criteria 1 and 2 by driving the script, and ends with the port free, no process of the launch alive, and no state file.
5. SKILL.md's Doctor table, Cleanup section, and Helpers table and the build-configurations feature file describe the new `build-fresh` scan and the kept state file.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair of the wave 1 defects D1 and D2; user ruling "Wave-1 defects: Approve recommendation."). The Verify ends by stopping the Nx daemon and keeps its own exit code, as every pending task's does; run it exactly as written and never set NX_DAEMON.
