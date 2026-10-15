---
id: T074
title: Run a full maintenance pass on control-ngx-yeti-storybook against the fixed static build, drive the dev flow, and fix every triaged survivor and contract finding
wave: 15
deps: [T075]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/features/stories.md
  - .claude/skills/control-ngx-yeti-storybook/features/play-functions.md
  - .claude/skills/control-ngx-yeti-storybook/features/axe-results.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts
---

# T074 — Run a full maintenance pass on control-ngx-yeti-storybook against the fixed static build, drive the dev flow, and fix every triaged survivor and contract finding

## Context

This task does not come from .project/review/PATCH-FINDINGS.md. It comes from the user ruling of 2026-10-15, recorded in .project/STATE.md's Log, verbatim: "Approve all recommendations, as part of M002." The recommendation it approves, as the Log records it: "fold the triaged control-skill survivors into wave 15 as tasks that run /lars-maintain-control-skill passes". T074 covers control-ngx-yeti-storybook. It runs after T075, which makes the static build keep inline dark-scheme wrappers dark (P003), so the live pass drives the fixed build, and the skill gets no gotcha about the old lowering.

Sources, all read-only reviews at f8aa2ea (the session scratchpad C:/Users/LARSGY~1/AppData/Local/Temp/claude/D--projects-github-LayZeeDK-ngx-yeti/ba6c4748-6ff9-45be-9f61-4a3f79255ee4/scratchpad/): control-combined-triage.md, which summarises control-trial-triage.md (the audit of the untracked trial report C:/Users/LARSGY~1/AppData/Local/Temp/claude/D--projects-github-LayZeeDK-ngx-yeti/ba6c4748-6ff9-45be-9f61-4a3f79255ee4/scratchpad/moved-from-primary/plans/control-skill-maintenance-trial.report.md) and contract-review-control-ngx-yeti-storybook.md. The trial session's regenerated patch is C:/Users/LARSGY~1/AppData/Local/Temp/claude/C--Users-LarsGyrupBrinkNielse/bb52653b-a268-4383-ba38-3cff4b6e3f70/scratchpad/control-ngx-yeti-storybook.patch. It has 5 files, +11 -4, and includes the README Preconditions rule. It applies at f8aa2ea (measured with `git apply --check`). It is a starting point, not a contract. Line numbers are at f8aa2ea.

Orchestrator measurement: check-skill.mjs reports 3 Preconditions failures on this skill at f8aa2ea (`the Driving section does not start with "Preconditions:"` for axe-results, play-functions and stories).

Trial drift (control-trial-triage.md):

- S1 (minor): the Stretched Link test count. card.stories.ts has 10 stories. The map says `7 skipped (8)` at features/play-functions.md:43 and "1 passed, 7 skipped" at SKILL.md:54. Fix: drop the hard-coded skipped count ("1 passed, the rest skipped"), so a new card story does not make it stale.
- S2 (minor): features/stories.md:3 says every story is `<item>.stories.ts` with id `<item>--<story>`. But packages/ngx-yeti/styles/src/setup.stories.ts has `meta.id: 'setup'`, and `index.json` lists `setup--item-links` and `setup--shared-host`. Add them.
- S3 (minor, with contract F12): the three feature files' Driving sections lack the `Preconditions:` lead that check-skill enforces. Add it, and add the rule to the README's "Feature entry contract" (features/README.md:34): "The Driving section opens with a `Preconditions:` line."
- S4 (minor): `test-storybook` can fail to import modules through a junctioned `node_modules` (trial measurement, not re-run). Add the gotcha to SKILL.md.
- D1 (minor): the dev flow (`--dev`, ports 4400 and 4420-4618) is documented, but no feature file names it and no test launches it. Its only proof is the creation run's "dev 13.8 s". Fix in the pass: drive `up --dev`, `doctor --dev`, one `stories` recipe and `down --dev`, twice, and record the runs. Add one line to features/README.md saying the recipes run on either flow. Add no dev launch to control.test.mjs (the triage leaves that to Lars, since it adds a launch to every suite run).

Contract review (contract-review-control-ngx-yeti-storybook.md):

- F2 (major): an exception in `up` or `doctor` exits 1 with a stack trace, no JSON and no failing check named. `renderCheck` (control.mjs:595-635) throws on a missing browser or a story that never settles. `processTable` (:409-417) throws on a PowerShell failure. `await run();` (:1213) has no catch. Measured: a top-level rejection exits 1 with empty stdout. Fix: catch at the dispatch and `finish(2, { message: 'could not run: ...' })`. A render timeout in `doctor` may instead fail the `known story renders` check (exit 1, named). Document the 2 case in Helpers.
- F3 (major, keep): `down` stops the checkout's Nx daemon whether or not the run started it (control.mjs:389-406, :1162). The stop was added on purpose (T047). Keep it, and document the reason and the cost in Cleanup, as control-yeti-app's F11.
- F4 (minor): `doctor --url` also skips `build matches checkout`, but SKILL.md:46 names only the two process checks. Name all three.
- F5 (minor): `--url` is accepted and ignored by `up`, `info` and `down` (measured: `info --url=http://x --json` runs). Treat it as unknown for every command but `doctor` (exit 2 `unknown argument`), or document that it is ignored.
- F6 (minor): Helpers does not list every output field: `info`'s `statePath`, `worktree`, `target`, `startedAt` (and the exit-2 path's `port`, `session`, `worktree`); `up`'s `readyMs`, `owner`, `logTail`, `render`; the live-path incomplete `down` result's `statePath`. Add one "Output" line per command.
- F7 (minor): a live-path incomplete `down` exits before `endTeardown`, so the daemon is not stopped and the result has no `daemon` field (control.mjs:1041-1054). SKILL.md:89 and :115 say the stop always runs. Say so in Cleanup, or stop the daemon there too (as F3 keeps it).
- F8 (minor): the test script and the `CONTROL_SESSION_REGISTRY` and `CONTROL_LISTENER_TIMEOUT_MS` variables are documented under Cleanup (SKILL.md:100, :104). Move them into Helpers.
- F9 (minor): the README proof rules lack three yardstick rules: a snapshot before and after; check the side effects the action changes (the URL, requests, location-mock state); and a location mock proves the directive's call, not real navigation. Add them, with a `<story-id>.before.yml` line in Evidence.
- F10 (minor): there is no wait recipe. The recipes read the render phase once, right after `open` (play-functions.md:22-23, stories.md:31-32). Add one `run-code` recipe to the README's driving conventions that waits for `window.__STORYBOOK_PREVIEW__.currentRender.phase` to reach `finished`, `errored` or `aborted`. Use it after every `open` or `goto`, and probe it once.
- F11 (minor): in the main checkout the static flow holds port 4401, which layer-4 and screen-reader e2e need with `reuseExistingServer: false`. Add the gotcha: `down` before running them, or drive from a worktree.
- F12: see S3.
- F13 (cosmetic): the main-port refusal from a worktree cannot happen, because the derived range never holds 4400 or 4401. Drop the clause from SKILL.md:46 and :113 and say the ranges are disjoint, or call the guard a backstop.
- F14 (cosmetic): state the browser profile in Pick a flow: "Sessions use playwright-cli's in-memory profile; nothing to remove."
- F15 (cosmetic): SKILL.md:100 implies a full command comparison. Write "whose start time differs, or whose command line lacks the recorded target and `--port`".
- F16 (cosmetic): selector order (SKILL.md:61): add labels after roles. Keep `.card` only if Yeti owns the class, and say so.
- F17 (cosmetic): the scope line (SKILL.md:8) is three sentences. Move the pointer to `ngx-yeti-stories` into Gotchas or Drive.

Declined, not planned: contract F1 (reshaping the map per component family; the maintain skill accepts a mechanism-shaped map). Not in scope: the yardstick notes Y1-Y4; the O20 interim gotcha, because T075 fixes the build.

## Approach

- Run a full `/lars-maintain-control-skill` pass on control-ngx-yeti-storybook in this task's checkout: 0 locate and set up, 1 contract check, 2 tool and dependent drift, 3 source wave, 4 reconcile, 5 live pass, 6 triage, 7 teardown. Read the maintain skill (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/SKILL.md), the create skill's references/generated-skill.md and references/storybook.md first, and take every rule from them. Step 8 does not commit, because the pipeline's rules win (the maintain skill says so) and the orchestrator lands the task. Write `last-run.md` and the evidence under the git-ignored `tmp/control-ngx-yeti-storybook/maintain/`. Nothing from the run directory enters the diff.
- The live pass drives the static flow on the T075 build and the dev flow (D1), each changed recipe twice from the edited file. It runs the repository's Storybook test target for the stories each feature file covers, and drives at least one story per feature file at `iframe.html?id=<story-id>`. Include one dark-scheme wrapper story (for example `button--variants`) in the static flow, and record that its dark wrapper renders dark.
- Step 3's readers are read-only and write only their result files (haiku-medium, at most 6 at once). If spawning them is not possible, read each feature file against its source yourself. Step 2 resolves targets with `nx show project` and then stops the daemon. Never set `NX_DAEMON`.
- Fix every survivor in Context: S1-S4, D1, contract F2, F4-F17. Document F3 with its reason and cost. Fix anything else the pass proves as drift, within the edit scope: this skill's folder only, never product code. A product gap the pass finds is reported in the Log with its evidence. It is not fixed and gets no ledger row here.
- Recipes use the `async function <name>(page) {...}` declaration form where Prettier would otherwise add a trailing `;` that `run-code` rejects. No `prettier-ignore` comment. Run Prettier, then re-read each recipe from the file before driving it.
- Code fixes keep every documented exit code that no finding changes, the exit-2 refusals, the dead-PID path and its start-time filter, the listener query, and the existing tests. Every behaviour change gets a test in control.test.mjs that fails without it. Show each new test failing against the pre-change script and record those runs in the Log.
- Teardown proof (maintain step 7): `info --json` to the run directory, copy the state file there, `down`, then `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-control-skill/scripts/check-teardown.mjs <run dir>/info.json --artifact <file>` (one `--artifact` per proof file). Then `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-control-skill/scripts/prove-refusal.mjs --control .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs --state tmp/control-ngx-yeti-storybook/state-static.json --saved <copied state file>`. Neither has been run against this script yet (contract review Y4).
- Keep the script typed (Interface contract). No JSDoc cast through `unknown`. Comments say only what the code cannot, with no planning id, date or measurement.
- The suite and the live pass build and serve Storybook on fixed and derived ports, and the static flow takes 4401 in the main checkout. The orchestrator runs this task with no other heavy command, coder, e2e or NVDA run.
- Skills: `.claude/skills/control-ngx-yeti-storybook/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; AGENTS.md "Scripts" and "Evidence and honesty".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/scripts/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json` exits 0.
2. `node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs` passes.
3. A new or changed test covers each code fix, and the Log records it failing against the pre-change script: an exception in `up` or `doctor` exits 2 with one JSON object; `--url` on a command other than `doctor` is refused (or the documented alternative holds); the live-path incomplete `down` reports its daemon state as Cleanup states.
4. Every changed recipe or command passed two live drives, both from the edited file. The dev flow (`up --dev`, `doctor --dev`, a `stories` recipe, `down --dev`) was driven twice. One dark-scheme wrapper story was driven on the static flow, with its dark wrapper rendering dark. All are recorded in the Log with the evidence paths.
5. `check-teardown.mjs` and `prove-refusal.mjs` exit 0 against the pass's saved `info.json` and state file, recorded in the Log.
6. The test count without a hard-coded skipped number, the setup stories, the `Preconditions:` leads and the README rule, the junction gotcha, the either-flow line, Helpers (exit 2, output fields, the test script and its variables), the README proof rules and Evidence line, the wait recipe, the port-4401 gotcha, the F3 reason and cost, and F4, F13-F17 hold as Context states. The skill has no gotcha about the old dark-wrapper lowering.
7. The Log records the pass outcome (`changed` or `blocked`) and its coverage summary per feature and sub-feature. Evidence stays git-ignored.
8. `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` exits 0, and `npx prettier --check --ignore-unknown` passes on the skill folder.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "7 skipped" .claude/skills/control-ngx-yeti-storybook && rg -q -F "setup--item-links" .claude/skills/control-ngx-yeti-storybook/features/stories.md && ! rg -q -F "prettier-ignore" .claude/skills/control-ngx-yeti-storybook && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/scripts/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-ngx-yeti-storybook; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (wave 15, user ruling "Approve all recommendations, as part of M002."), from control-combined-triage.md, control-trial-triage.md and contract-review-control-ngx-yeti-storybook.md in the session scratchpad.
