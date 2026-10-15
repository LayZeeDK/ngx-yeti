---
id: T073
title: Run a full maintenance pass on control-yeti-app and fix every triaged survivor, the map drift, the build-fresh scan, and the contract findings
wave: 15
deps: [T072]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-yeti-app/features/README.md
  - .claude/skills/control-yeti-app/features/item-routes.md
  - .claude/skills/control-yeti-app/features/javascript-off.md
  - .claude/skills/control-yeti-app/features/hydration-and-replay.md
  - .claude/skills/control-yeti-app/features/build-configurations.md
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
---

# T073 — Run a full maintenance pass on control-yeti-app and fix every triaged survivor, the map drift, the build-fresh scan, and the contract findings

## Context

This task does not come from .project/review/PATCH-FINDINGS.md. It comes from the user ruling of 2026-10-15, recorded in .project/STATE.md's Log, verbatim: "Approve all recommendations, as part of M002." The recommendation it approves, as the Log records it: "fold the triaged control-skill survivors into wave 15 as tasks that run /lars-maintain-control-skill passes". T073 covers control-yeti-app. The Storybook pass (T074) and the static Storybook dark-wrapper build fix (P003, T075) are separate tasks.

Sources, all read-only reviews at f8aa2ea (the session scratchpad C:/Users/LARSGY~1/AppData/Local/Temp/claude/D--projects-github-LayZeeDK-ngx-yeti/ba6c4748-6ff9-45be-9f61-4a3f79255ee4/scratchpad/): control-combined-triage.md, which summarises control-trial-triage.md (the audit of the trial report C:/Users/LARSGY~1/AppData/Local/Temp/claude/D--projects-github-LayZeeDK-ngx-yeti/ba6c4748-6ff9-45be-9f61-4a3f79255ee4/scratchpad/moved-from-primary/plans/control-skill-maintenance-trial.report.md, an untracked file in the primary checkout) and contract-review-control-yeti-app.md (the skill against the updated lars-create-control-skill contract). The trial's proven patch is C:/Users/LARSGY~1/AppData/Local/Temp/claude/C--Users-LarsGyrupBrinkNielse/bb52653b-a268-4383-ba38-3cff4b6e3f70/scratchpad/control-yeti-app.patch. It applies at f8aa2ea and touches the same three files as T072 in other line ranges (measured by the triage). It is a starting point, not a contract: its `prettier-ignore` hunks are replaced by the declaration form (Y2). Every finding is inlined below. Line numbers are at f8aa2ea; T072 lands first and moves the `down` lines.

Trial drift (control-trial-triage.md; [M] measured by the triager, [T] the trial's own measurement):

- Y1 (minor): the map says `/sub/card` loads the item links `card, lift` at SKILL.md:108, features/item-routes.md:38, features/javascript-off.md:32 and features/hydration-and-replay.md:61. card-fixture.ts imports `YetiButton`, `YetiCard`, `YetiGrid` and `NgxYetiLift`, and button.ts:101-102 loads `spinner`, so there are five items [M]. Their order `grid, button, card, spinner, lift` is [T]. Fix all four sites.
- Y2 (major): the `run-code --filename` recipes end in `;` (item-routes.md:34, hydration-and-replay.md:57 and :86). playwright-cli 0.1.21 evaluates `vm.runInContext("(" + code + ")")`, so `async (page) => page.url();` is a SyntaxError, and Prettier adds the `;` back inside Markdown [M]. All three recipes fail. Fix (measured): write each recipe as a named declaration, `async function <name>(page) { ... }`. Prettier formats it and adds no `;`, and in parentheses it parses as a function expression. Put the convention in the README's driving conventions ("a recipe file is one `async function <name>(page)` declaration"). Use no `prettier-ignore` comment.
- Y3 (cosmetic): the hydration summary line. Angular's message continues after `were skipped.`, so the map should say "a line starting `...`" (as the patch does).
- Y4 (minor): features/build-configurations.md:40-42 names the wrong folders for `build-fresh`. control.mjs:741 scans `apps/yeti-app`, `packages/ngx-yeti` and `vendor/yeti`. Land it with Y5.
- Y5 (major, harness bug): `newestSource` (control.mjs:740-766) walks every file and skips only `node_modules`, `storybook-static` and `dist`. An uncached `yeti-build` during `up` writes the git-ignored `vendor/yeti/docs/llms*.txt` after the recorded start, so `doctor` `build-fresh` fails on a healthy instance [T, proven live twice]. A Vitest run after `up` trips the same check through the git-ignored `.vitest-attachments` and `__screenshots__` PNGs [I]. Fix (as patched): take the sources from `git ls-files -co --exclude-standard -z -- apps/yeti-app packages/ngx-yeti vendor/yeti`, as the Storybook script's tested helper does. A git failure fails the check with its message. Listed files that are gone are skipped. The test's ignored-output case must be shown failing on the base scan.

Contract review (contract-review-control-yeti-app.md; "cm" is scripts/control.mjs, "S" is SKILL.md, "R" is features/README.md):

- F1 (major): an uncaught exception exits 1, the code for "not healthy" or "teardown incomplete", with a stack trace and no JSON. `await run()` at cm:1119 has no catch. Throw sites: cm:222, :557, :650, :736, :750, :855. Fix: catch at the dispatch and `finish(2, { error: String(error) })`.
- F2 (minor): the usage line (cm:5-6, cm:1115) teaches `[--mode serve|ssr]`, which the parser refuses (measured: exit 2 "unknown argument --mode"). Write the `=` forms.
- F3 (minor): flags that do not belong to a command are accepted and ignored. `info --port=4000` ran (measured). Fix: a per-command allow list, exit 2 `flag --x does not apply to <command>`.
- F4 (minor): `info` names one session, so check-teardown.mjs cannot see the `-jsoff` session (measured with a probe: it passes with `<session>-jsoff` still open). Fix: record and print both session names.
- F5 (minor): a dead recorded PID with a free port ends exit 0 without saying the PID was already gone. Fix: `recordedPidRunning: false` and a `[WARN] pid <n> was not running` line. T072 does not cover it (its criteria are the port-held case), so it is this task's.
- F6 (minor): `up` records `start` and `commandLine` as null when the fresh PID is not yet in the process table (cm:677, :685-686). `down` then refuses its own server, and `build-fresh` fails. Fix: in `up`, poll the table until the PID appears, or stop the child tree and exit 1.
- F7 (minor): Helpers leaves out output fields: `worktree` and `survivors` in `info`, `readySeconds` in `up`, `stopped`, `evidenceDir` and `evidenceKept` in `down`, `command` and `exit` in every object, and the `[WARN]` marker.
- F8 (minor): two `up` exit-1 paths leave the server and the state file (cm:711-716 port owned by another tree, cm:727-730 not ready in time). S:185 says "state removed on exit". Make Helpers and the code agree, with a test of each path.
- F9 (cosmetic): `info` exit 2 also covers an invalid state file. Write "2 no or invalid state file".
- F10 (minor): `doctor`'s `build` check reports the recorded configuration and probes `window.ng` only with `--url` (cm:894, :906-914). Probe on every doctor run, and fail when the probe disagrees with the state file.
- F11 (minor, keep): `down` stops the checkout's Nx daemon whoever started it. This is deliberate (a missing daemon stop caused sidecar failures). Keep it, and state the reason and the cost in Cleanup: other Nx work in the same checkout loses its daemon. The test's no-daemon assertion says no other Nx work may run.
- F12 (minor): Helpers does not list `.claude/skills/control-yeti-app/scripts/control.test.mjs`. Move the Test paragraph under Helpers, or point to it there.
- F13 (cosmetic): the worktree port range 4600-4799 (cm:35) overlaps the Storybook skill's 4420-4619. Start it at 4620 (4620-4819).
- F14 (cosmetic): the README lacks two proof rules: a negative result is reported as it is, and mocks only behind a production boundary.
- F15 (cosmetic): add a `## Manual only` section after `## Features` in the README. It names DevTools, and what playwright-cli cannot do with JavaScript off (`eval`, `run-code`, computed style), routed to e2e.
- F16 (cosmetic): recipes the README calls literal use shorthand (R:9-10, build-configurations.md:26, :29, :31). Write `node .claude/skills/control-yeti-app/scripts/control.mjs <command> ...` in full.
- F17 (cosmetic): each feature file's Preconditions bullets run into its steps. Add a `Steps:` line between them.
- F18 (cosmetic): S:42-43 marks `serve` production "inferred, not run". The trial ran it live on 2026-10-15. Mark it measured with the date.
- F19 (minor): the global playwright-cli is a precondition the skill never states. README baseline: "`playwright-cli --version` answers; if not, stop and ask Lars (a global install is his call)".
- F20 (cosmetic): `info` does not report the state file path. Add `stateFile`.

Not in scope: the yardstick notes Y1-Y7 of the contract review (global-skill findings, sent elsewhere); B1 (`yeti-build` outputs, deferred); O20 (the static Storybook build, P003/T075); the Storybook skill (T074).

## Approach

- Run a full `/lars-maintain-control-skill` pass on control-yeti-app in this task's checkout: 0 locate and set up, 1 contract check, 2 tool and dependent drift, 3 source wave, 4 reconcile, 5 live pass, 6 triage, 7 teardown. Read the maintain skill (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/SKILL.md) and the create skill's references/generated-skill.md first, and take every rule from them. Step 8 does not commit, because the pipeline's rules win (the maintain skill says so) and the orchestrator lands the task. Write `last-run.md` and the evidence under the git-ignored `tmp/control-yeti-app/maintain/`. Nothing from the run directory enters the diff.
- Step 3's readers are read-only and write only their result files (haiku-medium, at most 6 at once). If spawning them is not possible, read each feature file against its source yourself.
- Step 2 resolves the targets with `nx show project` and then stops the daemon. Never set `NX_DAEMON` (repository rule).
- Fix every survivor in Context: Y1-Y5, and F1-F10, F12-F20 (F5 included). Document F11 with its reason and cost. Fix anything else the pass proves as drift, within the edit scope: this skill's folder only, never product code. A product gap the pass finds is reported in the Log with its evidence. It is not fixed and gets no ledger row here.
- Recipes use the `async function <name>(page) {...}` declaration form. No `prettier-ignore` comment anywhere in the skill. Run Prettier, then re-read each recipe from the file before driving it.
- Code fixes keep T072's dead-root `down` as landed. Keep every documented exit code that no finding changes, the exit-2 refusals, the listener-query bound, and the existing tests. Every behaviour change gets a test in control.test.mjs that fails without it. Show each new test failing against the pre-change script and record those runs in the Log.
- Teardown proof (maintain step 7): `info --json` to the run directory, copy the state file there, `down`, then `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-control-skill/scripts/check-teardown.mjs <run dir>/info.json --artifact <file>` (one `--artifact` per proof file), then `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-control-skill/scripts/prove-refusal.mjs --control .claude/skills/control-yeti-app/scripts/control.mjs --state tmp/control-yeti-app/state.json --saved <copied state file>` (this pass changes the PID logic).
- Keep the script typed (Interface contract). No JSDoc cast through `unknown`. Comments say only what the code cannot, with no planning id, date or measurement. SKILL.md and the feature files state what stays true, with dated proof rows where the contract asks for them.
- The suite and the live pass build and launch the Fixture app on fixed and derived ports. The orchestrator runs this task with no other heavy command, coder or NVDA run.
- Skills: `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; AGENTS.md "Scripts" and "Evidence and honesty".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/scripts/check-skill.mjs .claude/skills/control-yeti-app --json` exits 0.
2. `node --test .claude/skills/control-yeti-app/scripts/control.test.mjs` passes.
3. A new or changed test covers each code fix, and the Log records it failing against the pre-change script: the `build-fresh` scan ignores git-ignored files (`vendor/yeti/docs`, `.vitest-attachments`); an uncaught error exits 2 with one JSON object; a null `start` or `commandLine` is never recorded; both `up` exit-1 paths behave as Helpers states; `info` names both sessions; a flag that does not apply to a command exits 2; a dead PID with a free port is reported as not running.
4. Every changed recipe or command passed two live drives, both from the edited file, recorded in the Log with the evidence paths.
5. `check-teardown.mjs` and `prove-refusal.mjs` exit 0 against the pass's saved `info.json` and state file, recorded in the Log.
6. The four item-link sites, the three `run-code` recipes (declaration form, no `prettier-ignore`), the hydration line, the `build-fresh` folders, the usage line, the port range 4620-4819, Helpers (fields, `[WARN]`, the test script, `info` exit 2), the README (two proof rules, `## Manual only`, the playwright-cli baseline), full recipe commands, the `Steps:` lines, the `serve` production proof row, and the F11 reason and cost hold as Context states.
7. The Log records the pass outcome (`changed` or `blocked`) and its coverage summary per feature and sub-feature. Evidence stays git-ignored.
8. `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` exits 0, and `npx prettier --check --ignore-unknown` passes on the skill folder.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "ls-files" .claude/skills/control-yeti-app/scripts/control.mjs && ! rg -q -F "[--mode serve|ssr]" .claude/skills/control-yeti-app/scripts/control.mjs && ! rg -q -F "prettier-ignore" .claude/skills/control-yeti-app && rg -q -F "async function" .claude/skills/control-yeti-app/features/hydration-and-replay.md && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (wave 15, user ruling "Approve all recommendations, as part of M002."), from control-combined-triage.md, control-trial-triage.md and contract-review-control-yeti-app.md in the session scratchpad.
