---
id: T084
title: Run one /lars-maintain-verification pass on both control skills to the current verification contract, with a ports table and doctor ports line, process trees through proctree.mjs, fresh byte copies, the Nx daemon left running, and a /lars-verify run per skill
wave: 17
deps: [T074, T076]
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
  - .claude/skills/control-yeti-app/scripts/proctree.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/features/stories.md
  - .claude/skills/control-ngx-yeti-storybook/features/play-functions.md
  - .claude/skills/control-ngx-yeti-storybook/features/axe-results.md
  - .claude/skills/control-ngx-yeti-storybook/features/.proven.json
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/proctree.mjs
  - .prettierignore
---

# T084 — Run one /lars-maintain-verification pass on both control skills to the current verification contract, with a ports table and doctor ports line, process trees through proctree.mjs, fresh byte copies, the Nx daemon left running, and a /lars-verify run per skill

## Context

This task does not come from .project/review/PATCH-FINDINGS.md. Lars's rulings, verbatim: "Yes, wait for proctree and add T084" (2026-10-17); "Approve, resolve in M002" and "Verification artifacts should be runnable by /lars-verify" (2026-10-16). Relayed by the peer session larsgyrupbrinknielse-d0 in Lars's words from that session: to "(a) Move the stop out of `down` and into removing a sidecar worktree. (b) Keep it in `down` as a recorded exception to the contract." he answered "1: Option A." The standing ngx-yeti rule holds: never NX_DAEMON=false.

What changed: the global lars-create-verification contract changed on 2026-10-16 and 2026-10-17. Its owner is C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/references/generated-skill.md, sections "Ports", "State", "Process trees", "Teardown check" and "Proof manifest"; it wins over any summary, this task's included. The new C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/proctree.mjs records, refreshes and stops a run's process tree by PID plus start time, keeps a process recorded after its parent exits (an orphaned grandchild), never records or stops the Nx daemon (a shared helper), and imports `printable` from the fingerprint.mjs beside it. Generated-skill.md quotes Lars, 2026-10-17: "Why is stopping the Nx Daemon important? In an Nx workspace, it is needed continuously." C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-maintain-verification/SKILL.md step 2 now says leave the daemon running, and a script test that asserts no daemon runs is drift to fix.

Measured at 82b390f:

- check-skill.mjs (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs, run with `--json`) fails five checks on both skills: ports (no Port | Kind | Default | How it moves table), doctor-ports (no 'ports' doctor line), proctree-import, fingerprint-copy (each skill's fingerprint.mjs differs from the create skill's copy of 2026-10-16) and proctree-copy (no scripts/proctree.mjs).
- Both control scripts stop the Nx daemon: control-yeti-app's `stopDaemon` runs `nx daemon --stop` from `down` and from `up`'s failure path (`stopLaunch`), and control-ngx-yeti-storybook's `stopDaemon` runs from both `down` paths; both put a `daemon` field in `down`'s result.
- Both scripts still walk the tree locally: control-yeti-app has `tree()` (parent PID alone) and `treeMembers` and stops with `taskkill /T`; control-ngx-yeti-storybook has `treeMembers` and `taskkill /T`.
- `node .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs check` exits 1: play-functions and stories are stale since e69aa1f (packages/ngx-yeti/project.json changed, by T079). control-yeti-app's four features are fresh since 13c9bc4.
- Prettier with the repository's .prettierrc reformats an untouched copy of proctree.mjs (the `SHARED_HELPERS` line and `isSharedHelper`'s return), so a byte copy fails `prettier --check` unless .prettierignore lists it. .prettierignore already lists both skills' fingerprint.mjs and features/.proven.json through `control-*` globs (T076).

The proctree.mjs landing as relayed by the peer session (global `npm run check` 150/150, mutation run 22/22 killed, code and security reviews closed, no more contract changes planned) is summarised in C:/Users/LARSGY~1/AppData/Local/Temp/claude/D--projects-github-LayZeeDK-ngx-yeti/ba6c4748-6ff9-45be-9f61-4a3f79255ee4/scratchpad/proctree-landing.md; the contract file wins over it. Its reference implementation of the port rules is D:/projects/sandbox/angular-ai-devtools-worktrees/verification-skills (branch verification-skills); read it, copy nothing from it without checking it against the contract.

T080 (control-yeti-app's P003 proof, after this task) and T083 (both scripts' PID-mismatch refusal output, after T080) edit these control scripts next. T080's saved attempt 1 (tmp/afk-m002/tools/T080-attempt1.patch) is not landed; this task does not apply it.

## Approach

- Invoke the Skill tool with "lars-maintain-verification" once per skill (`control-yeti-app`, then `control-ngx-yeti-storybook`) and follow steps 0 to 8 inside this task's checkout. Read first: the maintain skill, generated-skill.md, the create skill's references/tool-catalogue.md and references/storybook.md, C:/Users/LarsGyrupBrinkNielse/.claude/references/verification-skills.md, and lars-verify's SKILL.md and references/contract.md (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/). Take every rule from them.
- GSD Path's rules win over the maintain skill: no commits, branches or worktrees; step 8 leaves the corrections in the checkout and writes the intended commit split in the Log. Run directories and last-run.md go under the git-ignored tmp/control-yeti-app/maintain/ and tmp/control-ngx-yeti-storybook/maintain/; nothing from them enters the diff.
- Byte copies: copy the create skill's current fingerprint.mjs and proctree.mjs into each skill's scripts/ folder, never edit either copy, and add one `/.claude/skills/control-*/scripts/proctree.mjs` line to .prettierignore beside the existing fingerprint line. Each control.mjs imports what it uses from the proctree.mjs beside it.
- Ports: each SKILL.md's "Pick a flow" gets the ports table in the contract's exact shape, one row per port the app stack opens (control-yeti-app: the serve and SSR ports; control-ngx-yeti-storybook: the static and dev Storybook ports), each row proven by a probe in the live pass. `up` follows the "Ports" rules: slot 0 in the main checkout, a hashed slot elsewhere, a busy derived port moves every derived port to the next slot within 10 tries, `--port N` sets the main port with no fallback, a busy `N` or fixed port exits 2 naming its holder, and a worktree never derives or accepts the main checkout's ports. Keep the two skills' derived ranges apart, as today (4420-4619 Storybook, 4620-4819 yeti-app). `info --json` gains `ports: [{ name, port, kind, reason? }]`. Doctor gains the `ports` line that fails (exit 1) when a port is not listening or is held outside the recorded tree, and reports skipped with `--url`; prove an `[OK]` and an `[ERROR]` result live.
- Process trees: record, refresh and stop every tree through proctree.mjs as "Process trees" says: `up` records `snapshot(<spawned PID>, { notBefore, notAfter })` right after the spawn and refreshes with `merge` once ready; `doctor` refreshes it as its one write; `down` takes a last snapshot while the parents live and runs `stop(merge(tree, last))`; the state file and `info --json` carry the records as the top-level `tree` array, root first. `down`'s exit codes follow the contract (a root refused as `reused` is the exit-2 mismatch refusal; a `survived` record exits 2 naming it; a descendant refused as `reused` or `helper` is printed and leaves the exit code alone). The ready check and doctor's port ownership use the recorded tree. Replace each local walk and `taskkill /T` stop that these rules cover; whatever local tree code a script still holds afterwards, list it in the Log with the reason it stays.
- Orphaned grandchild: each suite gets a test where a wrapper the launch started exits while its own child keeps running, and `down` still stops that child from the recorded tree; check-teardown.mjs with the saved info.json proves it in the live pass too.
- Nx daemon: no command of either control.mjs stops the Nx daemon or sets NX_DAEMON; remove `stopDaemon`, the `daemon` result field and the `nx daemon --stop failed` problem, and every test that asserts a daemon stop or that no daemon runs; SKILL.md says the daemon stays running and that only removing a worktree the work created stops it. Step 2 resolves targets with `nx show project` and leaves the daemon running.
- Keep what no contract rule changes: every other documented exit code, the exit-2 refusals (missing state file, malformed state file, mismatch), the flag allow lists, the atomic state-file write, the listener-query bound, the session-close outcomes, the `map-fresh` line, and the `up --json` fields the spec writer reads (`session`, `url`, `evidenceDir`). Every behaviour change gets a test in that skill's control.test.mjs that fails against the pre-change script; record each red run in the Log.
- Proof manifest: re-record each feature with the new fingerprint.mjs only after the live pass proved it (every sub-feature passed its drive, a changed recipe twice from the edited file, no gap open), with the entries the readers cited; every feature of each README's Features list ends recorded and fresh. A feature the pass cannot prove ends the task blocked with its evidence.
- /lars-verify: one `verdict.mjs run` per skill from a spec tools/verification/lars-verify-spec.mjs writes, as T076 and T074 did (recipe `cardItemLinks` with `--open card` for control-yeti-app; recipe `renderFinished` on the button--variants story for control-ngx-yeti-storybook), each ending `verified` with `verdict.mjs lint` exit 0. The spec's teardown runs check-teardown.mjs on the `info --json` output, so the `tree` records are checked there. If the writer needs a change to pass, block: tools/verification is not in this task's files.
- Teardown, maintain step 7, per flow the pass started: info --json and the state file saved to the run directory, `down`, check-teardown.mjs with one `--artifact` per proof file, prove-refusal.mjs (down and the PID logic change here), and the ports probe of /lars-create-verification step 8 (port derivation changes here). Record each exit code and evidence path in the Log.
- Machine load: before each heavy step (a suite, `up`, a verdict run) check free memory, then run it through node D:/projects/github/LayZeeDK/ngx-yeti/tmp/afk-m002/tools/heavy-lock.mjs, one at a time. A failure under memory pressure is re-run on a quiet machine before triage. Readers are haiku-medium agents, at most 6 at once.
- Typed scripts (AGENTS.md "Scripts"): control.mjs and its test keep `// @ts-check` and JSDoc types, add no `any` and no unchecked assertion; `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` covers both byte copies too and stays at 0 errors. If a byte copy fails the root type check, block with the error; never edit the copy.
- Comments say only what the code cannot; no planning IDs, dates or measurements in code. Skills: `.claude/skills/type-safety/SKILL.md`; AGENTS.md "Evidence and honesty".

## Interface contract

- The process-tree seam that T080 and T083 code against in .claude/skills/control-yeti-app/scripts/control.mjs: proctree.mjs beside control.mjs is a byte copy of C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/proctree.mjs, and control.mjs imports from it what it uses of `snapshot`, `merge`, `stop`, `describe`, `matches`, `isSharedHelper` and `processTable`. A record is `{ pid, ppid, start, commandLine }`; the state file and `info --json` carry the records as the top-level `tree` array, root first. `stop(records)` returns `{ stopped, gone, refused }`, each refused record carrying `reason` `reused`, `helper`, `caller` or `survived`. No command stops the Nx daemon, and `down`'s result has no `daemon` field.

## Intent coverage

- None

## Acceptance criteria

1. check-skill.mjs `--json` exits 0 on .claude/skills/control-yeti-app and on .claude/skills/control-ngx-yeti-storybook, the ports, doctor-ports, proctree-import, fingerprint-copy and proctree-copy checks included.
2. Each skill's scripts/fingerprint.mjs and scripts/proctree.mjs are byte copies of the create skill's current files, each control.mjs imports from its proctree.mjs, and .prettierignore lists the proctree.mjs copies.
3. Each SKILL.md's "Pick a flow" holds the ports table in the contract's shape with every row proven by a probe; `up` follows the slot, fallback, `--port` and fixed-port rules; `info --json` carries `ports`; doctor's `ports` line was shown `[OK]` and `[ERROR]` live (Log), and a failing line makes doctor exit 1.
4. `up`, `doctor` and `down` record, refresh and stop the tree through proctree.mjs as "Process trees" says, the state file and `info --json` carry `tree`, and each suite has a test, failing against the pre-change script first (Log), in which a wrapper exits and `down` still stops its child.
5. No command of either control.mjs stops the Nx daemon or sets NX_DAEMON; no test asserts a daemon stop or a daemon's absence; each SKILL.md says the daemon stays running.
6. `node <skill>/scripts/fingerprint.mjs check --json` exits 0 for both skills, every feature recorded only after the live pass proved it.
7. One `verdict.mjs run` per skill from a spec the spec writer made gives `verified`, and `verdict.mjs lint` exits 0 on its verdict.json.
8. Per flow the pass started, check-teardown.mjs exits 0 on the saved info.json, prove-refusal.mjs exits 0, and the ports probe passes; the Log records each with its evidence path (git-ignored), and records per skill the pass outcome, coverage per feature and sub-feature, the versions step 2 read, any local tree code kept and why, and the intended commit split.
9. Both control suites pass, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` exits 0, and `npx prettier --check --ignore-unknown` passes on both skill folders and .prettierignore.

## Verify

```bash
npm ci && npx playwright install chromium && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && node .claude/skills/control-yeti-app/scripts/fingerprint.mjs check --json && node .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs check --json && rg -q -F "/.claude/skills/control-*/scripts/proctree.mjs" .prettierignore && ! rg -q "stopDaemon|'--stop'|NX_DAEMON" .claude/skills/control-yeti-app/scripts/control.mjs .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && out=tmp/control-yeti-app/verify/item-routes/T084-$(date -u +%Y%m%dT%H%M%SZ) && node tools/verification/lars-verify-spec.mjs --skill .claude/skills/control-yeti-app --feature item-routes --recipe cardItemLinks --open card --claim "The prerendered card route loads the item links grid, button, card, spinner and lift" --out "$out/spec" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs run --spec "$out/spec/spec.json" --out "$out/run" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs lint "$out/run/verdict.json" && sb=tmp/control-ngx-yeti-storybook/verify/stories/T084-$(date -u +%Y%m%dT%H%M%SZ) && node tools/verification/lars-verify-spec.mjs --skill .claude/skills/control-ngx-yeti-storybook --feature stories --recipe renderFinished --open "/iframe.html?id=button--variants&viewMode=story" --claim "The button--variants story renders and its play function finishes in the static Storybook" --out "$sb/spec" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs run --spec "$sb/spec/spec.json" --out "$sb/run" && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-verify/scripts/verdict.mjs lint "$sb/run/verdict.json" && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook .prettierignore; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-17 — created by planner (build-repair of wave 17, Lars's ruling "Yes, wait for proctree and add T084")
