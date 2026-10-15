---
id: T072
title: Make control-yeti-app down on a dead recorded root wait for the root's surviving children, name them and the port's listeners, and remove the state file, as Storybook's down does
wave: 15
deps: [T053, T067]
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

# T072 — Make control-yeti-app down on a dead recorded root wait for the root's surviving children, name them and the port's listeners, and remove the state file, as Storybook's down does

## Context

Final-review patch of M002 (2026-10-15), finding P002 of .project/review/PATCH-FINDINGS.md (reviewed HEAD f8aa2eacac8aabf1099271b52466cc8605b65aeb), source .project/review/final-gap-2.md, Risk: control-yeti-app and control-ngx-yeti-storybook `down` on a dead recorded root PID whose descendant still holds the port (teardown lifecycle changed across waves 1, 2, 4, 9, 11 and 12). The user ruling it enforces, recorded in .project/STATE.md (line 172), verbatim: "down: Use Storybook's behaviour, fixed before shipping M002" (control-yeti-app down dead-root lockout). INTENT.md:79 requires both control skills "proven end to end".

P002, verbatim:

- **Evidence**: control-ngx-yeti-storybook meets all three expectations: on a dead root it closes the session, names the child (pid 25352) and the port listener, removes the state file, and exits 1; a second down exits 2; `up` refuses only while the named process holds the port. control-yeti-app does not: on a dead root it never looks at the dead root's descendants or the port's listener. It exits 1 with `run down again`, keeps state.json with `survivors: []`, and repeats this on every later down. `up` stays refused (`already up ... run down first`). The SKILL.md advice (`Run down again`, SKILL.md:163) cannot work. The output never names the process to stop, so the caller has to find the listener by hand and stop it, or delete state.json. This breaks the 2026-10-15 user ruling ("down: Use Storybook's behaviour, fixed before shipping M002") and the INTENT.md:79 "proven end to end" scope for control-yeti-app. control.test.mjs has no dead-root, port-held case for this script.
- **Fix direction**: control-yeti-app only (.claude/skills/control-yeti-app/scripts/control.mjs `down`, :1012-1082). When `live` is undefined, do what Storybook's dead-PID path does (control-ngx-yeti-storybook control.mjs:975-990, 1085-1187). Collect the dead root's tree members, leaving out processes that started before the recorded `start`. Wait without stopping them. Query the port's listeners. Remove state.json even on exit 1, and end the message by naming `pid <survivors and listeners>` to stop by hand. Keep the kept-state, `run down again` path only for a live root. Update SKILL.md:128-131, :158-164 and the `down` row at :188 to match. Add a control.test.mjs case: a dead root whose child keeps the port, so down exits 1 naming the child and the port and removes state.json, and a second down exits 2.

Measured by the gap reviewer at f8aa2ea (final-gap-2.md): with a recorded root pid 908 gone and its child pid 13892 (ParentProcessId 908) listening on 127.0.0.1:4746, control-yeti-app `down --json` exited 1 after 2 m 50 s with `"error": "teardown incomplete; state kept at ...; run down again"`, `"stopped": []`, `"survivors": []`, `"portFree": false`, both sessions `not-open`, `daemon.stopped: true`, and state.json kept; a second `down` gave the same; `up` exited 2 with `already up (pid 908, port 4746); run down first`. Storybook's `down` in the same setup exited 1 after 27 s naming `pid 25352 still running; port 4513 still answers (listeners [25352])`, with `survivors: [25352]` and its state file removed; a second `down` exited 2 (`no state file ...; nothing to stop`) and `up` exited 2 with `refused: port 4513 is in use (listeners [25352])`.

## Approach

- Change only the dead-root branch of `down` in .claude/skills/control-yeti-app/scripts/control.mjs (`live` undefined: no process holds the recorded PID). A PID held by another process still gets the existing exit-2 mismatch refusal. The live-root path, its `taskkill /T /F`, its kept state with recorded survivors and its `run down again` message stay as they are.
- Dead root, following Storybook's dead-PID path (`treeMembers`, `awaitTeardown`, `teardownProblems`, `endTeardown` in `.claude/skills/control-ngx-yeti-storybook/scripts/control.mjs`): close both sessions and stop the daemon as today; collect the dead root's tree members from the process table (`tree`, which follows `ParentProcessId`), leaving out every process whose `Start` is earlier than the recorded `start`; a member whose start, or a recorded `start` that cannot be parsed, is kept and reported by PID, not dropped silently; wait for them without stopping them; query the port's listeners (`queryListeners`, keeping its error); then remove state.json whatever the outcome. When a member survives or the port still listens, exit 1 with an error that starts `teardown incomplete`, names the surviving PIDs and the port with its listeners (or the query error), and ends by naming `pid <survivors and listeners>` to stop by hand; otherwise exit 0 as today.
- Recorded survivors: a state file kept by an incomplete live-root `down` lists `survivors`; on the next `down` the root is dead, and the survivors that still match by PID, start time and command line are still stopped first, as today, so the live path's `run down again` stays true. Then the dead path above runs and removes the file. (Planner's reading: the Fix direction's "wait without stopping them" covers the dead root's tree members; the recorded survivors are proven members of this run and are stopped as before.)
- Keep every outcome, field and exit code the SKILL.md tables already state for the live path and the sessions (`left-open`, `timeout`, `failed`), the exit-2 refusals, the listener-query bound (one timed-out query ends the wait), and the existing tests. Keep the result fields `stopped`, `survivors`, `portFree`, `listenerError`, `sessions`, `daemon`.
- Test in .claude/skills/control-yeti-app/scripts/control.test.mjs, modelled on the Storybook suite's test of the same name: a stand-in root that starts a detached child listening on a free port and then dies, a state file recording the root's PID, `start` (no later than the child's start), command line and port, `CONTROL_SESSION_REGISTRY` pointed at an empty folder and playwright-cli off `PATH` as the suite's other dead-run tests do; `down` exits 1 naming the child and the port and removes state.json; a second `down` exits 2; `up` then exits 2 naming the child as the port's listener, not `already up`; the child is stopped in cleanup. Use the per-checkout scratch folder the suite already uses and leave no state file behind for another run.
- SKILL.md (.claude/skills/control-yeti-app/SKILL.md): the Cleanup paragraph on a dead recorded PID (:128-131), the wait and kept-state paragraph (:158-164), the `down` row of the Helpers table (:188), and the Test paragraph state the dead-root path as built and say the kept state and `run down again` belong to a live root only. It states what stays true, without history.
- Keep the script typed (Interface contract); no JSDoc cast through `unknown`. Comments say only what the code cannot, with no planning id, date, or measurement.
- The suite builds and launches the Fixture app on fixed ports; the orchestrator runs this task with no other heavy command, coder, or NVDA run. Never set `NX_DAEMON`.
- Skills: `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; AGENTS.md "Scripts" and "Evidence and honesty".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. On a dead recorded root whose child keeps the recorded port, control-yeti-app `down` stops no process of the dead root's tree, closes both sessions, stops the Nx daemon, removes state.json, and exits 1 with an error that starts `teardown incomplete`, names the child's PID and the port, and ends by naming `pid <survivors and listeners>` to stop by hand; `survivors` holds the child and `portFree` is false.
2. Processes in the dead root's tree that started before the recorded `start` are neither waited on nor named; a member or a recorded `start` whose time cannot be parsed is kept and reported by PID.
3. After that `down`, a second `down` exits 2 with the no-state-file refusal, and `up` exits 2 naming the child as the port's listener, not `already up`.
4. A live root's incomplete teardown still keeps state.json with its survivors and says `run down again`; on the next `down`, recorded survivors that still match by PID, start time and command line are stopped before the dead path runs.
5. control.test.mjs has the test `down on a dead recorded pid exits 1 while a child of it keeps the port`, asserting criteria 1 and 3; the Log records it failing against the base control.mjs on its assertion.
6. SKILL.md's Cleanup paragraph, its wait and kept-state paragraph, the `down` row and the Test paragraph describe the dead-root path and limit the kept state and `run down again` to a live root.
7. The control-yeti-app suite passes, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` exits 0, and `npx prettier --check --ignore-unknown` passes on the skill folder.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "down on a dead recorded pid exits 1 while a child of it keeps the port" .claude/skills/control-yeti-app/scripts/control.test.mjs && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (final-review patch), from .project/review/PATCH-FINDINGS.md P002 (source .project/review/final-gap-2.md).
