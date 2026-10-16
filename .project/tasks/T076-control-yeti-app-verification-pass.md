---
id: T076
title: Run a full /lars-maintain-verification pass on control-yeti-app, adopt the proof manifest, and make the skill runnable by /lars-verify through a spec written from its feature map
wave: 15
deps: [T071, T073]
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
  - .claude/skills/control-yeti-app/features/.proven.json
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/scripts/fingerprint.mjs
  - tools/verification/lars-verify-spec.mjs
  - tools/verification/lars-verify-spec.test.mjs
  - project.json
  - .prettierignore
---

# T076 — Run a full /lars-maintain-verification pass on control-yeti-app, adopt the proof manifest, and make the skill runnable by /lars-verify through a spec written from its feature map

## Context

This task does not come from .project/review/PATCH-FINDINGS.md. It comes from Lars's rulings of 2026-10-16, recorded in .project/STATE.md's Log, verbatim: "Use /lars-maintain-verification and /lars-create-verification to audit/(re)create control-* skills and other verification artifacts.s" and "Verification artifacts should be runnable by /lars-verify". The orchestrator reads them as moving the first maintain pass on each control skill into M002 (an earlier "Yes" from Lars had placed those passes after M002 leaves its pipeline) and asks Lars to confirm at plan approval.

What changed since T073 (orchestrator measurements of 2026-10-16):

- On 2026-10-15 the global skills were renamed: /lars-create-control-skill is now /lars-create-verification and /lars-maintain-control-skill is now /lars-maintain-verification, and /lars-verify (run only, one verdict read from exit codes) was added. The old folder C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-control-skill/ no longer exists. check-skill.mjs, check-teardown.mjs, prove-refusal.mjs and fingerprint.mjs now live in C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/.
- The new contract adds a proof manifest: each control skill carries `.claude/skills/control-yeti-app/scripts/fingerprint.mjs` (a byte copy of the create skill's script, never edited) and a features/.proven.json written only by `fingerprint.mjs record`, and `control.mjs doctor` prints a `map-fresh` line from `mapFresh(skillDir)`, which never changes doctor's exit code (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/references/generated-skill.md, "Exact headings" and "Proof manifest").
- At 7031099 (T073 landed), the renamed check-skill.mjs fails exactly two checks on this skill: doctor-map-fresh and fingerprint-copy.
- T073 ran the old-contract pass on this skill (its Log records the outcome `changed`, every feature proven, 25/25 tests). Its task file is landed and stays byte-identical; this task builds on what it landed.

Trial patch: C:/Users/LARSGY~1/AppData/Local/Temp/claude/C--Users-LarsGyrupBrinkNielse/bb52653b-a268-4383-ba38-3cff4b6e3f70/scratchpad/control-yeti-app.patch (8 files, +101 -70; proven in an earlier trial of the maintain skill, relayed by another Claude session). T073 folded the trial's findings into its triage (Y1 to Y5 and the contract findings), so many hunks are on the branch in another form. Planner measurement at 6930b5d: `git apply --check` fails on all 8 files, and `git apply --check -R` fails too, so the patch is neither absent nor fully present. Check each hunk against the current file and apply only what is missing; record per hunk `applied`, `already present` or `superseded by T073` (with the line that supersedes it) in the Log.

Observed by T073 and not fixed then, for this pass to re-check: check-teardown.mjs reads only the top-level `session`, so it does not prove the `-jsoff` session closed (a global-skill limit; `info` lists both under `sessions`); the Fixture app logs NG02952 (an NgOptimizedImage aspect-ratio warning on trail.svg) on /sub/card in development, which doctor's console-errors check passes as a warning.

Planner measurements of 2026-10-16 that shape the shared seam (Interface contract):

- `npx prettier --check` with the repository's .prettierrc fails on an untouched copy of the create skill's fingerprint.mjs, and on a manifest in the `JSON.stringify(manifest, null, 2)` form that `record` writes (single-entry arrays). Neither file may be reformatted: check-skill fails a copy that differs, and `record` rewrites the manifest in its own form. So `.prettierignore` gets both paths for every control skill.
- `tsc` with tsconfig.scripts.json's options passes on the copy when `typescript` resolves (probe in the scratchpad with a paths override; inferred to hold in place, where `typescript` resolves from the repository's node_modules).
- verdict.mjs's `parseSpec` requires `sides.head.dir` to be an absolute local path that is the top of the checkout under test, so no committed file can hold a spec that runs in a fresh sidecar.

## Approach

- Invoke the Skill tool with "lars-maintain-verification" and the argument `control-yeti-app`, and follow the pass, steps 0 to 8, inside this task's checkout. Read first: the maintain skill (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-verification/SKILL.md), the create skill's references/generated-skill.md and references/tool-catalogue.md, C:/Users/LarsGyrupBrinkNielse/.claude/references/verification-skills.md, and lars-verify's SKILL.md and references/contract.md (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/). Take every rule from them.
- GSD Path's rules win over the maintain skill: no commits, no branches, no worktrees. Step 0's worktree advice does not apply; work in this task's checkout. Step 8 does not commit: corrections stay in the checkout for the orchestrator's finish, and the intended commit split goes in the Log. Write the run directory and last-run.md under the git-ignored tmp/control-yeti-app/maintain/; nothing from it enters the diff. This is the skill's first pass under the new contract: no last-run.md and no verdict.json exist, and every feature starts `unproven`.
- Proof manifest: copy the create skill's fingerprint.mjs byte for byte to `.claude/skills/control-yeti-app/scripts/fingerprint.mjs`; give `doctor` its `map-fresh` line through `mapFresh` with the skill folder taken from the script's own location, as generated-skill.md says; document fingerprint.mjs (record, check, flags, exit codes) and the `map-fresh` line in Helpers. After the live pass proves a feature (every sub-feature passed its drive, a changed recipe twice from the edited file, no gap open), record it with `fingerprint.mjs record --feature <id> --entries <path>...`, the entries being the source files the reader cited (route components, `apps/yeti-app/src/main.ts`, the server entry, the fixture registry). Every feature in the README's Features list must end recorded and fresh; a feature the pass cannot prove ends the task blocked with its evidence, since the Verify's `check` would fail.
- Runnable by /lars-verify: add to features/item-routes.md one recipe file `async function cardItemLinks(page) { ... }` that reads the item links of the open card route and throws `new Error('CLAIM: <what it saw>')` unless they are `["grid","button","card","spinner","lift"]`, and returns otherwise. Keep the existing `itemLinks` recipe, which the Leave step reuses. Write the shared spec writer of the Interface contract, `tools/verification/lars-verify-spec.mjs`, with its test `tools/verification/lars-verify-spec.test.mjs`, and add that test to the root `test` target of `project.json` (command and inputs). That target runs in CI, where Lars's global skills are absent, so the test reads no file outside its own temporary folders (for example, it points `os.homedir()` at one through `USERPROFILE` and `HOME`). Prove the condition can fail: one extra `verdict.mjs run` on a spec the writer made with `--open replay` (no item links) must end `not verified` with the thrown `CLAIM:` line; record it in the Log.
- Where the spec lives, and why: it is written at run time into a new git-ignored folder under tmp/control-yeti-app/verify/, never committed. The create contract's folder (generated-skill.md, "Folder") names SKILL.md, scripts/control.mjs, scripts/fingerprint.mjs, features/README.md, the feature files and features/.proven.json, plus references/ only for material over about 100 lines, so a spec has no place in the skill folder. A committed spec could not hold `sides.head.dir`, which must be the absolute top of the checkout under test and differs for every sidecar. A fixed pass condition kept beside the app would be a verify-yeti-app check, which the maintain skill writes only after lars-verify reported the same pass condition written by hand twice, or Lars asks. So the Verify writes the spec from committed sources: the recipe from its one home, the feature file, and the steps from the spec writer. The writer lives in tools/ rather than in a skill folder so control-yeti-app and control-ngx-yeti-storybook (T074) share one copy.
- verify-yeti-app checks: none exist, and neither condition for writing one holds. Write none unless this pass meets the maintain skill's rule; if it does, the check follows lars-verify's check format and gets a code review and a security review by someone other than its author before it counts.
- Live pass and teardown as the maintain skill says: every feature serially, each changed recipe or command twice from the edited file, readers as haiku-medium agents (at most 6 at once; read the feature files yourself if spawning is not possible). Step 2 resolves targets with `nx show project` and then stops the daemon; never set `NX_DAEMON`. Step 7: `info --json` to the run directory, copy the state file there, `down`, then check-teardown.mjs from the create skill's scripts with one `--artifact` per proof file; prove-refusal.mjs too when the pass changes `down` or the PID logic.
- Code fixes keep T072's dead-root `down` and T073's behaviour as landed: every documented exit code no finding changes, the exit-2 refusals, the flag allow list, the listener-query bound, and the existing tests. Every behaviour change gets a test in `.claude/skills/control-yeti-app/scripts/control.test.mjs` that fails without it; show each new test failing against the pre-change script and record those runs in the Log. The `map-fresh` line's tests cover fresh (`[OK]`), stale or unproven (`[WARN]`), and doctor's exit code unchanged by it.
- Fix what the pass proves as drift, within the maintain edit scope (this skill's folder) plus the files above; never product code. A product gap is reported in the Log with its evidence and, where the project keeps a filing ledger, a ledger entry of the kind its cause fits, in the maintain skill's terms. Recipes stay in the `async function <name>(page) {...}` declaration form, with no `prettier-ignore` comment; run Prettier, then re-read each recipe from the file before driving it.
- Every script this task ships (the spec writer, any change to control.mjs) starts `// @ts-check`, is typed with JSDoc, and has a `node:test` test. Comments say only what the code cannot, with no planning ID, date or measurement.
- Machine load: before each heavy step (the suite, `up`, a verdict run) check free memory (the machine has had 4.5 to 7.4 GB free, and Claude Code stops background commands when memory runs low), then run it through `node D:/projects/github/LayZeeDK/ngx-yeti/tmp/afk-m002/tools/heavy-lock.mjs <label> -- '<command>'`, one at a time. A failure under memory pressure is re-run on a quiet machine before triage. The orchestrator runs this task with no other heavy command, coder or NVDA run.
- Skills: `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; AGENTS.md "Scripts" and "Evidence and honesty".

## Interface contract

- Spec writer (written by T076, used by T074): `node tools/verification/lars-verify-spec.mjs --skill <skill dir> --feature <id> --recipe <name> --open <path> --claim <text> --out <dir>`, run from the top of the checkout under test. `<skill dir>` is repository-relative with `/` (for example `.claude/skills/control-yeti-app`); `<id>` names `<skill dir>/features/<id>.md`; `<name>` names exactly one fenced `js` block of that file whose first line starts `async function <name>(page)`; `<path>` is appended to the `url` field that `up --json` prints; `<dir>` is absent or empty. It writes `<dir>/<name>.js` (the block's lines unchanged, ending in one newline) and `<dir>/spec.json`, a spec `verdict.mjs run` accepts: `claim` from `--claim`; `kind` `regression`; `sides.head.dir` the absolute path that `git rev-parse --show-toplevel` prints for the working directory; no baseline; `runs` 2; `steps.setup`, in order, `{ "argv": ["node", "<skill dir>/scripts/control.mjs", "up", "--json"], "as": "up" }`, `["node", "<skill dir>/scripts/control.mjs", "doctor"]`, `["playwright-cli", "-s={up.session}", "open", "{up.url}<path>"]` and `["playwright-cli", "-s={up.session}", "snapshot", "--filename={up.evidenceDir}/<name>.before.yml"]`; `steps.condition` `["playwright-cli", "-s={up.session}", "run-code", "--filename=<absolute dir>/<name>.js"]`; `steps.teardown`, in order, `["node", "<skill dir>/scripts/control.mjs", "info", "--json"]`, `["node", "<skill dir>/scripts/control.mjs", "down"]` and `["node", "<home>/.claude/skills/lars-create-verification/scripts/check-teardown.mjs", "{runDir}/steps/teardown-1.out", "--artifact", "{up.evidenceDir}/<name>.before.yml"]`, where `<home>` is `os.homedir()` written with `/`; `artifacts` `["{up.evidenceDir}/<name>.before.yml"]`. It prints the absolute path of spec.json and exits 0. It exits 2 with the reason and writes nothing on a missing, repeated or unknown flag, no or several matching blocks, a `<dir>` that is not empty, a working directory that is not the top of a git checkout, or no check-teardown.mjs at that path. It spawns only `git`, with an argv array and no shell.
- What the spec needs of a control skill: `up --json` prints one JSON object whose `session`, `url` and `evidenceDir` are strings; `doctor`, `info --json` and `down`, given no flow flag, act on the flow `up` started with none; the named recipe returns on the claimed state and throws `new Error('CLAIM: <what it saw>')` on any other.
- `.prettierignore` (written by T076): the lines `/.claude/skills/control-*/scripts/fingerprint.mjs` and `/.claude/skills/control-*/features/.proven.json`, for every control skill.
- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json` exits 0, doctor-map-fresh and fingerprint-copy included.
2. `node .claude/skills/control-yeti-app/scripts/fingerprint.mjs check --json` exits 0: every feature of the README's Features list is recorded in features/.proven.json and fresh, each recorded only after the live pass proved it.
3. `doctor` prints a `map-fresh` line (`[OK]` when every feature is fresh, `[WARN]` naming the stale and unproven ones otherwise), and its exit code does not depend on that line. Helpers documents it and fingerprint.mjs's commands, flags and exit codes.
4. `node --test .claude/skills/control-yeti-app/scripts/control.test.mjs tools/verification/lars-verify-spec.test.mjs` passes. A new or changed test covers each code change, and the Log records it failing against the pre-change script (the `map-fresh` line; the spec writer's written spec, each exit-2 refusal, and the byte-for-byte recipe file).
5. A spec the writer made from features/item-routes.md (recipe `cardItemLinks`, `--open card`) gives `verdict.mjs run` exit 0 with `verdict` `verified`, and `verdict.mjs lint` exits 0 on its verdict.json. A spec with `--open replay` gives `not verified` with the thrown `CLAIM:` line in its condition output (Log).
6. Each hunk of the trial patch is checked; the missing ones are applied, and the Log lists every hunk as applied, already present, or superseded with its reason.
7. Every changed recipe or command passed two live drives, both from the edited file; check-teardown.mjs exits 0 against the pass's saved info.json (and prove-refusal.mjs when `down` or the PID logic changed). All recorded in the Log with evidence paths, which stay git-ignored.
8. The Log records the pass outcome (`changed` or `blocked`), its coverage per feature and sub-feature, the versions step 2 read, and that no verify-yeti-app skill was written (or, when the rule was met, the check with its two reviews).
9. `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` exits 0, and `npx prettier --check --ignore-unknown` passes on the skill folder, tools/verification and .prettierignore.

## Verify

```bash
npm ci && npx playwright install chromium && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && node .claude/skills/control-yeti-app/scripts/fingerprint.mjs check --json && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs tools/verification/lars-verify-spec.test.mjs && out=tmp/control-yeti-app/verify/item-routes/T076-$(date -u +%Y%m%dT%H%M%SZ) && node tools/verification/lars-verify-spec.mjs --skill .claude/skills/control-yeti-app --feature item-routes --recipe cardItemLinks --open card --claim "The prerendered card route loads the item links grid, button, card, spinner and lift" --out "$out/spec" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs run --spec "$out/spec/spec.json" --out "$out/run" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs lint "$out/run/verdict.json" && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app tools/verification .prettierignore; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner (wave 15, build repair after Lars's rulings of 2026-10-16 "Use /lars-maintain-verification and /lars-create-verification to audit/(re)create control-* skills and other verification artifacts.s" and "Verification artifacts should be runnable by /lars-verify").
