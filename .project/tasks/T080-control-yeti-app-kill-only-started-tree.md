---
id: T080
title: Make control-yeti-app's live down, up, doctor and stopLaunch see only the processes the launch started, and never kill or report a dead launch's PID as stopped
wave: 17
deps: [T076]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
---

# T080 — Make control-yeti-app's live down, up, doctor and stopLaunch see only the processes the launch started, and never kill or report a dead launch's PID as stopped

## Context

Final-review patch, ship attempt 2, finding P003 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-3.md`, locator "Risk: a control script's kill can reach a process it did not start, because taskkill /T on an identity-checked root selects children by parent PID alone, and control-yeti-app stopLaunch kills and reports a launch that may already have exited"), fixed in M002 under Lars's rulings, verbatim: "Approve, resolve in M002" (2026-10-16) and "down: Use Storybook's behaviour, fixed before shipping M002" (2026-10-15).

Evidence, verbatim: "blocked. Measured: control-yeti-app's live `down` takes its member list from `tree()`, which matches children by parent PID alone, so a process that started before the recorded root but carries its PID as parent (PID reuse) is listed in `stopped`, survives taskkill /T (which itself filters it out), is written to `state.json` as a survivor, and the "run down again" retry kills it by PID and exits 0. That contradicts SKILL.md's own rule for the dead-root tree (:145-147, processes started before the recorded `start` are left out because Windows hands a dead PID out again) and Storybook's behaviour that Lars's 2026-10-15 ruling adopts. Inferred: on `up`'s launch-exited path `stopLaunch` reports `launchStopped: true` with the launch's surviving children unchecked and removes the state file, so SKILL.md:194's "stops the started tree ... nothing is left for `down`" does not hold, and the PID it kills may by then belong to another process. control-ngx-yeti-storybook passes: its live path uses `treeMembers`, and native taskkill /T spares pre-root processes (measured twice)."

Fix direction, verbatim: "In .claude/skills/control-yeti-app/scripts/control.mjs, build the live `down` member list with `treeMembers(table, state.pid, state.start)` plus the root entry instead of `tree(table, state.pid)` (:1164-1167), so a pre-root process is never recorded as a survivor and never reaches the retry's taskkill. In `stopLaunch`, take the launch's start (`live.Start`, when known) and, when the root is already gone, do not taskkill the PID; collect `treeMembers` and report `launchStopped: true` only when no member survives, naming survivors otherwise (as down's dead path does; this also closes part of risk 4). Update SKILL.md:176-179 and :194 to match. Proof in .claude/skills/control-yeti-app/scripts/control.test.mjs, shown failing at d63e7e0 first: the PID-reuse setup from tmp/gap3-spike2.mjs (a bounded spawn loop until a live stand-in root holds an exited parent's PID, a state file with that root's real start and command line), then two `down` runs that must leave the pre-root orphan alive and never list it in `stopped` or `survivors`; and an `up` whose launch exits while a child keeps running must report `launchStopped: false` naming that child."

Measured by the gap reviewer at d63e7e0 (final-gap-3.md): with the PID-reuse stand-in, the first `down` exits 1 with `stopped: [18416, 58840, 2748]`, `survivors: [58840]` (58840 the orphan, started 37 s before the recorded root); the second exits 0 with `stopped: [58840]` and the orphan is gone. Native `taskkill /PID <root> /T /F` spared the pre-root orphan in both spike runs. The gap reviewer's tmp/gap3-spike*.mjs files are not in this checkout.

Planner's pattern search (read at d63e7e0): `tree()` (control.mjs:261-277) has three callers, each matching by parent PID alone: `up`'s ready check `owned = tree(processTable(), pid)` (:824), which would accept a pre-root process listening on the port as the launch's own; `doctor`'s `port-owned` check (:946), which would pass on such a listener; and live `down` (:1165). `treeMembers` (:291-323) is the start-time-guarded walk.

## Approach

- Every member list of the launch's tree uses the start-time guard: `treeMembers` with the recorded or live root start (or `tree()` goes and its callers move). The live `down` list is the root entry plus `treeMembers(table, state.pid, state.start)`; a pre-root process is never in `stopped`, `survivors` or the state file's survivors.
- `stopLaunch` gets the launch's start when known. With the root still alive it stops the tree as today; with the root gone it runs no taskkill on the PID, waits for the start-guarded members as `down`'s dead path does, reports `launchStopped: true` only when none survives, and otherwise `launchStopped: false` with the surviving PIDs named. A failed `up` still removes the state file and exits 1, and the Nx daemon stop still runs.
- Keep T072's dead-root behaviour (wait without stopping, name survivors and the port's listeners, remove the state file), the exit-2 mismatch refusal for a PID another process now holds, every documented exit code and the `--json` result fields; add fields only where a survivor must be named.
- SKILL.md: update the live-PID paragraph (:176-179 at d63e7e0), the `up` Helpers row (:194) and anything else that describes these paths, in the reader's words, with no planning ids.
- Tests in control.test.mjs, each shown failing at d63e7e0 first with the run in the Log: "down on a live recorded root leaves out a process that started before it" (the bounded PID-reuse spawn loop, a stand-in state file with the live root's real start and command line, two `down` runs that leave the orphan alive and never list it in `stopped` or `survivors`), and "up reports a launch that exited with a child still running as not stopped" (`launchStopped: false` naming the child). Bound every spawn loop and clean up every process the test starts, also on failure.
- Typed scripts: keep `// @ts-check` and the JSDoc types; `npm exec nx -- typecheck @ngx-yeti/source` stays at 0 errors. The skill stays runnable by /lars-verify (Lars, 2026-10-16: "Verification artifacts should be runnable by /lars-verify"): check-skill.mjs passes.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. On a live recorded root whose PID an earlier exited parent's orphan names as its parent, two `down` runs leave the orphan running and never list it in `stopped`, `survivors` or the state file; the test "down on a live recorded root leaves out a process that started before it" proves it and fails at d63e7e0.
2. An `up` whose launch exits while a child keeps running reports `launchStopped: false` and names that child, runs no taskkill on the dead launch PID, still exits 1 and removes the state file; the test "up reports a launch that exited with a child still running as not stopped" proves it and fails at d63e7e0.
3. No member list of the launch's tree in control.mjs walks by parent PID without the start-time guard, `up`'s ready check and `doctor`'s `port-owned` check included.
4. T072's dead-root tests, the mismatch refusal and every exit code in SKILL.md's Helpers table still hold; SKILL.md describes the new live-path and `stopLaunch` behaviour.
5. `node --test .claude/skills/control-yeti-app/scripts/control.test.mjs` passes, check-skill.mjs passes on the skill, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes and Prettier passes on the skill folder.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "down on a live recorded root leaves out a process that started before it" .claude/skills/control-yeti-app/scripts/control.test.mjs && rg -q -F "up reports a launch that exited with a child still running as not stopped" .claude/skills/control-yeti-app/scripts/control.test.mjs && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
