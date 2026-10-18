# Review — wave 12, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 4

Re-review after the 2026-10-17 SC8/SC9 intent correction, at review base 217b67d7e3ebe4f7c0d6a677b2a3b229382a38bd (sidecar `git rev-parse HEAD`, clean). The wave 12 PLAN section and the task files T065 to T068 are byte-identical to the reviewed set (orchestrator's `git diff 16f8ff0 HEAD`, per the brief), so each criterion carries the verdict of the preserved review .project/plan/build-recovery-16f8ff041ef0bcec0ff6bfb50cc5b0fa719afd37/review/wave-12.cycle1.md (pass) with its cited evidence. No wave 12 task owns an INTENT success criterion (PLAN.md `## Intent coverage`), so this review has no Intent coverage section. Checked by this reviewer: every task file's `base` equals the brief's base; `git diff --name-only <landing>^ <landing>` lists only `files` plus the task file for each landing (T065 11 paths, T066 7, T067 7, T068 2; zero outside); T066 and T068 sit directly on their bases; T065 and T067 share no file and their recorded base is 131cf8e; ledger lines 29 (f44ebda, T068) and 30 (b871f0c, T066) of .project/build/verify-ledger.jsonl read result pass; one fact per task read with `git show <landing>:<path>` (listed under each task). Nothing was re-run.

## T065 — Limit the painted-band ink reset to the alert emphasis that paints a fill the ring reads on, test low- and high-emphasis alerts in a band, and record Yeti's ring on a high-emphasis alert: pass

Landing 9e5f58223269d6284defed8fd662872d48ee64b0 on recorded base 131cf8e920681d3fe01528a6f2df874ee3b386e1.

- ✅ The Log records Yeti's ring against a default-, high-, and low-emphasis alert fill (default variant, both schemes), and the reset in `packages/ngx-yeti/ngx-yeti-globals.css` names only the emphasis values whose fill gives at least 3:1; it no longer names `.dropdown > [popover]`, `.nav > ul[popover]`, or `.dialog`, and it still has no specificity and comes before the paint lines. — carried; spot-checked: `git show 9e5f582:packages/ngx-yeti/ngx-yeti-globals.css` contains `.alert:not([data-emphasis='low'], [data-emphasis='high'])`.
- ✅ `accessibility.node.spec.ts` pins the narrowed list and fails when the reset differs from it or when a pin move renames `.alert` or a named `data-emphasis` value; its surface test title says "pinned", and `inkResets` returns no selector for a sheet without a reset; the `'A11Y-35'` entry of `sanctionedSelectors` matches the rule; both node specs pass. — carried: finish-T065.log 6 files / 58 tests.
- ✅ `box--paint` asserts, in the light and the dark scheme, a ring of at least 3:1 for a control in a low-emphasis alert in a `primary` band (against the band) and for a control in a high-emphasis default-variant alert in a `primary` band (against the alert's fill), with Yeti's alert stylesheet applied; it passes in Chromium, Firefox, and WebKit. — carried: native 8/8 and `ci unit` 24/24 over three engines.
- ✅ The Log records both new cases failing with the reset's alert entry restored to the whole `.alert`, each at its named assertion. — carried: box.stories.ts:580 and :599.
- ✅ `docs/specs/upstream-bugs.md` has a row for Yeti's ring on a high-emphasis alert outside bands with the ratios measured in this task; ledger A11Y-35, the CHANGELOG line, the specs skill's `box.md:207` row, the accessibility skill, and step 5 of the yeti-pin skill name the narrowed list and its count. — carried (row Y18 and the five records).
- ✅ Lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the changed files. — carried: finish-T065.log.

Warnings (non-blocking):
- Carried thermos bugs M1: `white` and `black` alerts in bands regress under the narrowed entry; T069 (wave 13) rewrote the alert part from a full variant x emphasis x band x scheme matrix.

Contract violations (blocking):
- none

## T066 — Make the run-job output-folder test able to fail, let a .d.ts edit miss the scripts typecheck cache, clear every floor variable in the unit-config test, fix the ci-local unit row, and bound the VoiceOver foreground query: pass

Landing b871f0c175e61e0b286a2227aeee5ab492df25e6 on base d22e9f6fc751b748f5f468e450f177c4e54cbb8c (its parent).

- ✅ `leg()` in `tools/ci-local/run-job.mjs` takes its checkout hash, volume, and `out` from one `legPaths` call, and no call with an empty label is left. — carried: the Verify's negative rg passed.
- ✅ `tools/ci-local/run-job.test.mjs` keeps the pure `legPaths` test and has a dry-run assertion that the printed `-v <host>:/out` host path equals `legPaths(...).out`, skipped only when a `git ls-files` probe at module load fails, with a skip reason that names the refusal; the pure `legPaths` test never skips; the Log records it failing with test-analyzer M1's mutant. — carried: finish-T066b.log native 12/12, the container skip reason, the Log's `deadbeef` mutant (6 pass, 1 fail).
- ✅ The root `typecheck` target's inputs cover the `.d.ts` files `tsconfig.scripts.json` reaches, and the Log records that editing `storybook-preview.d.ts` alone makes the next run execute instead of replaying. — carried; spot-checked: `git show b871f0c:project.json` contains `{workspaceRoot}/**/*.d.ts`, and project.json at the review base keeps it in `targets.typecheck.inputs` (read). Ledger line 30, exit 0.
- ✅ With `FLOOR_FIREFOX` and `FLOOR_WEBKIT` exported, the unit-config test of `tools/playwright/vitest-configs.test.mjs` passes. — carried: finish-T066b.log tests 1 / pass 1.
- ✅ The `unit` row of `references/ci-local.md` gives one run's time, passed/skipped counts, and commit, recorded in the Log, and the note narrates no history. — carried.
- ✅ The VoiceOver foreground query has a timeout, and its failure names the foreground query. — carried (static; runs on macOS in CI).
- ✅ `node --test` passes on the changed tests natively and in the `ci unit` container leg, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, lint and typecheck of `screen-reader-e2e` pass, and `npx prettier --check` passes on the task's files. — carried: finish-T066b.log.

Warnings (non-blocking):
- Carried: the dry-run check skips wherever Git refuses the checkout (the local container leg); it ran natively.

Contract violations (blocking):
- none

## T067 — Make both control scripts refuse a malformed state file and write it atomically, keep only run members on Storybook's dead-PID path, scan Git's sources for Storybook freshness, and bound yeti-app's listener wait: pass

Landing 3f6f2ce2f69c1715899d9c16e251863532863bff on recorded base 131cf8e920681d3fe01528a6f2df874ee3b386e1.

- ✅ In both scripts a truncated or non-JSON state file gets the exit-2 refusal with one JSON object under `--json` for every command, and the state file is written through a temporary file and a rename; a test in each suite shows the refusal. — carried; spot-checked: both control.mjs files at 3f6f2ce contain `renameSync` (2 occurrences each).
- ✅ Storybook's `treeMembers` drops processes that started before the recorded root's start time on both paths, and a test shows `down` on a dead PID not naming such a process. — carried.
- ✅ Storybook's freshness check reads its sources from Git's list, ignores Git-ignored output, and names the newest file in its detail; a test shows an ignored file written after launch does not fail `doctor`. — carried.
- ✅ yeti-app's `down` stops waiting at the first timed-out or failed listener query (or within one stated overall deadline) and reports `listenerError`; SKILL.md states the bound; a test shows it. — carried: the Log's reverted run (24978 ms) against 2.7 to 3.1 s.
- ✅ The folded cosmetics hold as the Approach states them, each behaviour change with a test that fails without it. — carried (negative run measured for the timeout test only; the others read as unable to pass on the old code).
- ✅ Both suites pass, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, and `npx prettier --check --ignore-unknown` passes on both skill folders. — carried: finish-T067.log 15/15 and 18/18.

Warnings (non-blocking):
- Carried thermos bugs L1/L2 and quality M1/L1 (deferred to M003 by the r5 triage).

Contract violations (blocking):
- none

## T068 — Split the pressed-contrast check of button--variants by colour scheme so it holds in the floor WebKit job with every assertion kept: pass

Landing f44ebda9f3dfc30c4baa3606ec415e3b0f339ceb on base 131cf8e920681d3fe01528a6f2df874ee3b386e1 (its parent). Ledger line 29.

- ✅ `apps/ngx-yeti-e2e/src/button.spec.ts` checks the pressed ratio of `button--variants` in one test per colour scheme (or finer), each asserting it found its scheme's buttons, and together the tests assert every button the single test asserted, with the same 4.5:1 threshold and `:active` check. — carried; spot-checked: `git show f44ebda:apps/ngx-yeti-e2e/src/button.spec.ts` contains `for (const scheme of ['light', 'dark'] as const)`.
- ✅ The Log records each new test's duration in the floor WebKit run, each at most half of its timeout, or the measured reason for a raised budget. — carried: light 14.7 s, dark 13.4 s against 30 s.
- ✅ `node tools/ci-local/run-job.mjs floor webkit-26-4` passes with no flaky test, and the spec passes in the `ci e2e` development legs of Chromium, Firefox, and WebKit. — carried: finish-T068.log and ledger line 29. This criterion runs a container job, which the corrected SC8 moves to CI; it is judged as written and was met.
- ✅ Lint and typecheck of `ngx-yeti-e2e` pass, and `npx prettier --check` passes on the spec. — carried.

Warnings (non-blocking):
- Carried: light at 14.7 s sits 0.3 s under the half budget in a spec-only timing.

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none in this record.
- warnings worth a human eye: T065's narrowed alert entry regressed `white`/`black` alerts in bands until T069 (wave 13); the CI half of SC8 and SC9 (including T066's VoiceOver timeout) waits for the milestone's pull request.
