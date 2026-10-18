# Review — wave 9, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 7

Re-review after the 2026-10-17 SC8/SC9 intent correction, at review base 217b67d7e3ebe4f7c0d6a677b2a3b229382a38bd (sidecar `git rev-parse HEAD`, clean). The wave 9 PLAN section and the task files T028 and T053 to T058 are byte-identical to the reviewed set (orchestrator's `git diff 16f8ff0 HEAD`, per the brief), so each acceptance criterion carries the verdict of the preserved review .project/plan/build-recovery-16f8ff041ef0bcec0ff6bfb50cc5b0fa719afd37/review/wave-9.cycle1.md (wave verdict pass) with its cited evidence; SC8 is judged afresh against its current text. Checked by this reviewer: (1) provenance, by a scratchpad script over the brief's task table: every task file's `base` equals the table's base, and `git diff --name-only <landing>^ <landing>` for each landing lists only paths in that task's `files` plus its own task file (T028 3 paths, T053 40, T054 5, T055 7, T056 8, T057 18, T058 12; zero outside). (2) One cited fact per task, read with `git show <landing>:<path>` (listed under each task). (3) Ledger line 27 of .project/build/verify-ledger.jsonl: commit c99718a, exit 0, result pass, with T028's full Verify command. Nothing was re-run; no task Verify and no project Verify.

## T028 — Run every CI and floor job locally on the milestone tip and re-time the long jobs: pass

Landing c99718ab10a5e32c11fa1307a1b919b5266eedcf on base 330742b630db9c29aade74725e825b10e58c204d (its parent).

- ✅ On the milestone tip, `npm run check`, `npx prettier --check .`, `build` and `pack-check`, the `unit` and every `e2e` combination through `run-job.mjs`, the floor jobs `webkit-26-4`, `firefox-146-e2e`, `firefox-145`, and `chromium-141`, and the `nvda` lane all pass locally; the Log records each job's wall time and result. — carried from the prior review: ledger line 27 (exit 0) runs every step but `chromium-141` chained with `&&`; the Log records `chromium-141` natively (507; 152/1; 618/2; 12 m 23 s) and the wave 9 gate at 13af1fd repeats it. Spot-checked: tmp/afk-m002/gate-wave9-c3/summary.txt lists 8 steps, each exit 0, "failed steps: 0", and floor-chromium-141.log:280-281 reads "Test Files 27 passed (27)", "Tests 507 passed (507)"; the evidence file .git/gsd-path/dispatch/gsd-path-M002/c5a8a3203b69d416818ed40ad67a337e10256a7a/T028/manual-2026-10-14T110906+0000/verify.json holds both `nx run screen-reader-e2e:nvda` runs (6 m 37 s without `BROWSERS`, 3 m 20 s with msedge) and `"exit_code": 0`.
- ✅ `references/ci-local.md` records the re-timed jobs; any job past about 15 minutes has a `--shard` axis that `run-job.mjs` runs, and no other workflow change was made besides criterion 4. — carried: the "Re-timed after the layouts and button items" section; longest e2e leg as CI runs it 10 m 10 s, so no shard axis; the landing changes ci.yml and references/ci-local.md only (3 paths with the task file, measured above).
- ✅ `npx prettier --check .` passes at the task commit. — carried: ledger line 27, "All matched files use Prettier code style!".
- ✅ Both guidepup version steps of `.github/workflows/ci.yml` exit non-zero when the version is empty or its lookup fails, and the Log records one such failing run. — carried; spot-checked: `git show c99718a:.github/workflows/ci.yml` holds `test -n "$version"` twice (one per guidepup step). The Log records the missing-package and empty-version runs exiting 1.

Warnings (non-blocking):
- Criterion 1 still names the container jobs; under the corrected SC8 they pass in CI and need no local run. The criterion as written is met (it is a superset of the corrected local set), so this is wording drift only.
- The CI half (every job on the milestone's pull request, `safari` and `voiceover` included) waits for that pull request; see Intent coverage.

Contract violations (blocking):
- none

## T053 — Land the typed scripts and their type check in CI: pass

Landing ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69 on recorded base 1580f84eba8c4b8018f6e3e80a01bd524d964700.

- ✅ The 39 paths of the patch carry its changes; no other path changes. — carried (prior review: the landing diff equals tmp/afk-m002/tools/mjs-typing.final.patch apart from four measured `exclude` lines in tsconfig.scripts.json); measured here: 40 changed paths, the 39 `files` plus the task file, none outside.
- ✅ `npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache` exits 0, and the coverage test in it fails when a committed `.mjs` file is added outside the tsconfig's files (shown once in the Log, with the probe file removed afterwards). — carried: finish-T053.log coverage test 1/1 and "Successfully ran target typecheck"; the Log's probe (excluding tools/yeti/vendor-yeti.mjs gave pass 0, fail 1).
- ✅ The root `project.json` has `"implicitDependencies": ["*"]` and the `typecheck` target above; `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes. — carried; spot-checked: `git show ccce8dd:project.json` contains `"implicitDependencies": ["*"]`.
- ✅ `npm exec nx -- run-many -t lint typecheck` passes for every project. — carried: finish-T053.log "for 9 projects"; gate run-many at 13af1fd.
- ✅ Both control-skill test suites pass, with their counts in the Log. — carried: 9/9 and 6/6 in finish-T053.log and the Log.
- ✅ `node tools/ci-local/run-job.mjs ci e2e --dry-run` exits 0, and `npx prettier --check .` passes. — carried: the Verify chain exited 0 and ends with the Prettier clean line.

Warnings (non-blocking):
- Carried: AC2's probe excluded an existing script instead of adding one (same comparison); three JSDoc casts through `unknown` in the patch (thermos quality M2), later removed from the Storybook script by T062.

Contract violations (blocking):
- none

## T054 — Key run-job.mjs output by checkout, end a leg when the host tar fails, accept only decimal counts, and make the Playwright server test survive load: pass

Landing 1fc227674f45ae6611e7b5b0a2e4470a7046671e on recorded base ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69.

- ✅ A leg's reports and `run-job.log` land in a folder under `ngx-yeti-run-job/<checkout hash>/<label>` in the OS temp folder, and `references/ci-local.md` says so. — carried; spot-checked: `git show 1fc2276:tools/ci-local/run-job.mjs` contains `'ngx-yeti-run-job'`.
- ✅ When the host tar fails, the leg ends with exit 1 and names tar's status instead of hanging; the Log records one real run of that path with its exit code. — carried: Log "run-job: [ci-unit] tar exited with 2", exit 1 after 13 s.
- ✅ `--legs` and `--e2e-workers` accept only decimal digits: `''` and `0x3` exit 2 (tests in `tools/ci-local/run-job.test.mjs`), and the existing quoting and leg tests still pass. — carried: Verify `test $? -eq 2` checks and run-job.test.mjs 6/6 (finish-T054.log).
- ✅ `tools/playwright-server/container.test.mjs` passes three runs of `npm exec nx -- run-many -t test --skip-nx-cache`; the Log records the base measurement and the three runs. — carried: two runs in finish-T054.log plus the Log's third and the base measurement.
- ✅ `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0 natively (the `static` job's check; its coverage test needs the Git index, which a container leg does not have), the root `test` target passes inside the `unit` container through `node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test`, and `npx prettier --check` passes on the four files. — carried: finish-T054.log typecheck pass, `[ci-unit]` tests 44 pass 43 skipped 1, Prettier clean.

Warnings (non-blocking):
- Carried thermos bugs H1 (the Git-reading test in CI's `unit` container); T061 (wave 11) replaced it with a Git-free `legPaths` test and T066 (wave 12) made the dry-run check skip only on a Git refusal.

Contract violations (blocking):
- none

## T055 — Make both control scripts fail loudly on a failed listener query, prove the session close, and close sessions on a dead recorded PID: pass

Landing 2428b7859c8a2c6d30a5e0ab17c31877a2901fd9 on recorded base ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69.

- ✅ yeti-app's listener query and both test helpers use `-ErrorAction Stop`, treat only `ObjectNotFound` as no listener, and fail otherwise; the Log shows a failed query making the command fail. — carried; spot-checked: `git show 2428b78:.claude/skills/control-yeti-app/scripts/control.mjs` has one `-ErrorAction Stop` and no `SilentlyContinue`.
- ✅ Each suite opens a session before `down` and asserts the outcome `closed`; neither suite accepts `absent`. — carried: the Verify's `! rg -F "'not-open', 'absent'"` over both test files passed.
- ✅ `down` with `absent` while the run's session is listed as open exits 1 and names the session; both SKILL.md files say what `absent` means. — carried: the two "down without playwright-cli exits 1 ..." tests and both SKILL.md definitions.
- ✅ On a dead recorded PID, both `down`s close the run's sessions, Storybook's also stops the daemon, and a test in each suite shows it. — carried: the two "died on its own" tests.
- ✅ Both suites pass, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, and `npx prettier --check --ignore-unknown` passes on both skill folders. — carried: finish-T055.log 11/11, 8/8, typecheck and Prettier clean.

Warnings (non-blocking):
- Carried: the PID-only survivor match on Storybook's live path (fixed by T062 in wave 11) and the near-duplicate control scripts (deferred to M003).

Contract violations (blocking):
- none

## T056 — Record the loader's stable gate and the press-ratio departure, and bring stale docs and doc comments up to date: pass

Landing 74f94279e23cfd2b5853fbda1ed22e707a0b755d on base 1580f84eba8c4b8018f6e3e80a01bd524d964700 (its parent). Ledger line 25 (commit 74f9427, pass).

- ✅ The Departures table has a row naming `whenStable` for setup.md:201 and ADR 0060 point 4 with the reason and the never-stable consequence, a row for button.md:315's press ratio, and the hover row covers `:active`. — carried from the prior review's reading of the specs SKILL.md at 74f9427.
- ✅ `packages/ngx-yeti/README.md` states that link removal waits for the application's first stable point. — carried; spot-checked: `git show 74f9427:packages/ngx-yeti/README.md` contains "first becomes stable".
- ✅ No "accessibility stylesheet" wording remains in `provide-yeti-styles.ts`, `enter.ts`, or ledger row A11Y-33. — carried: the Verify's multiline negative rg passed.
- ✅ The `align` doc of `icon.ts` names `start`, `end`, and `stretch` as well as `center` and `baseline`. — carried.
- ✅ The nvda.ts doc examples hold no per-run token and no browser build name. — carried: the Verify's negative rg checks passed.
- ✅ `npm exec nx -- run-many -t lint typecheck -p ngx-yeti screen-reader-e2e` and `npx prettier --check` on the changed files pass. — carried: ledger line 25 / finish-T056.log.

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T057 — Make the review round 2 tests able to fail and correct their comments: pass

Landing 22cd46a9f9e4b5cba56549d51c1a4ccf60402d81 on base ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69 (its parent). Ledger line 26 (commit 22cd46a, pass).

- ✅ The table hover test reads each scheme's resting row background with the pointer away and polls for a change after hovering before it measures the ratio; the Log shows it failing on an untinted row. — carried: the Log's transparent-tint failure and restored pass.
- ✅ `story-helpers.browser.spec.ts` has `assertWithin` cases for inside, outside, and `NaN`, and `usedLength` cases for the inline and the block axis against a token and a literal; the Log shows one failing on a broken `assertWithin`. — carried.
- ✅ Every comment named in Context items 12 and 14, and the enter.spec.ts wording of item 7 read as their fix directions say, with no date, ruling, plan, or tool marker left in them. — carried: the Verify's negative rg checks passed.
- ✅ The yeti-app-e2e card JavaScript-off case compares the five named items' order after filtering to them. — carried.
- ✅ The two `text-align` lines are gone, `table--align` asserts four hosts before its loop, the button server-render test asserts the presence attribute on all eight hosts, and `assertFunctionNames` names `expectStyledFrames`. — carried; spot-checked: the landing patch of apps/yeti-app-e2e/eslint.config.mjs adds `{ assertFunctionNames: ['expectHoverLifts', 'expectStyledFrames'] }`.
- ✅ Lint and typecheck of `ngx-yeti`, `ngx-yeti-testing`, and `yeti-app-e2e`, the named layer-2, node, and Storybook tests, the table layer-2 and Storybook tests in three engines, and the yeti-app-e2e card, icon, and table specs pass. — carried: ledger line 26 / finish-T057.log.

Warnings (non-blocking):
- Carried: `createDirectiveHost` has no self-test (outside this task's files).

Contract violations (blocking):
- none

## T058 — Give the focus ring inside a painted band a colour that reads (A11Y-35) and add the plain-button usage rule for painted bands (Y17): pass

Landing 4d63e28bc5a31e951d0764918f653845fe89e07e on recorded base 0287445e264fc9160dbbd21408e3eb720521e517.

- ✅ The Log holds the ring, band, and band-text colours and the ring-to-band ratio for all 20 paint values in both schemes, measured before the rule. — carried: the Log's 40-row table.
- ✅ `packages/ngx-yeti/ngx-yeti-globals.css` holds one rule in `@layer ngx-yeti`, commented with A11Y-35, that colours the focus ring inside a painted band with the band's text colour and changes nothing else about the ring and nothing under forced colours; `sanctionedSelectors` has an `'A11Y-35'` entry for it, and the published-output and accessibility node specs pass. — carried; spot-checked: `git show 4d63e28:packages/ngx-yeti/ngx-yeti-globals.css` contains `[data-paint] :focus-visible`.
- ✅ `box--paint` asserts a ring-to-band ratio of at least 3:1 for every one of the 20 paint values in the light and the dark scheme, and passes in Chromium, Firefox, and WebKit. — carried: finish-T058.log native 8 tests and `ci unit` 24 tests over three engines.
- ✅ `NgxYetiPaint` and `YetiBox` carry usage rule 8 for buttons inside a painted band. — carried.
- ✅ Ledger row A11Y-35 names the rule and its test; row A11Y-36 records the plain button in a band with usage rule 8 and no package CSS; upstream rows Y16 and Y17 point at them; the Departures table has the box.md:207 row; the CHANGELOG names both. — carried; spot-checked: `git show 4d63e28:docs/specs/ledger.md` contains `A11Y-36`.
- ✅ Lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the changed files. — carried: finish-T058.log.

Warnings (non-blocking):
- Carried thermos bugs H2 and M1 (the ring on Yeti surfaces and toggle labels inside a band); T060 (wave 11), T065 (wave 12) and T069 (wave 13) rework them.

Contract violations (blocking):
- none

## Intent coverage

### SC8 — `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general.", narrowed by the user 2026-10-17: "We don't have to replay everything that runs in CI, in Docker containers. As long as we run CI checks that are possible natively and locally, I'm happy. Other checks may be deferred to CI." and "Correct SC8 now: native local checks only, real NVDA lane"). Locally, the checks that run natively pass: `npm run check`, the `static` and `package` jobs, the native floor jobs `chromium-141` and `firefox-145` (layer 2 in the floor engines Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36), the e2e projects `ngx-yeti-e2e` and `yeti-app-e2e` run natively, and SC9's `nvda` lane as its job runs it (`npm exec nx -- run screen-reader-e2e:nvda` without `BROWSERS`: Playwright's Chromium, then Firefox; the `BROWSERS=msedge` lane is not evidence for the job). The container jobs (`unit`, `e2e`, `webkit-26-4`, `firefox-146-e2e`) pass in CI and need no local run; `node tools/ci-local/run-job.mjs` stays available to reproduce one locally. In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").: pass
- ✅ Judged on the current (2026-10-17) text through T028 AC1 at the wave 9 tip c99718a / gate 13af1fd. Native local set: `npm run check` and the `static` job's prettier, lint and typecheck (ledger line 27; gate run-many and prettier exit 0); the `package` job (`run-many -t build pack-check`, ledger line 27); `firefox-145` natively (507 of 507) and `chromium-141` natively (Log; gate floor-chromium-141.log:280-281, 507 of 507, step exit 0); the e2e projects `ngx-yeti-e2e` and `yeti-app-e2e` ran natively inside `chromium-141` (152 passed / 1 skipped and 618 passed / 2 skipped, Log and gate); the `nvda` lane without `BROWSERS` (Playwright's Chromium, then Firefox) passed 22 in the Verify (`screen-reader-e2e:nvda` 6 m 37 s in verify.json, chain exit 0); the msedge run beside it is not counted as evidence. The container jobs, which the corrected text moves to CI, also passed locally (all 12 `ci e2e` legs, `ci unit`, both floor container jobs), which the text allows. E10 and N8 are dismissed rows; no held-out or judgment id applies. The CI half (every job on the milestone's pull request, `safari` and `voiceover` included) cannot be measured before that pull request exists; PLAN.md "Wave review gate" defers it there, as the preserved review did, so it is a warning, not a failure of T028.

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none.
- warnings worth a human eye: (1) SC8's native e2e at this tip ran in Chrome for Testing 141 (the `chromium-141` job), not in Playwright's current Chromium; the corrected project Verify runs the native e2e projects at ship, and T086 owns the narrowed set. (2) T028 criterion 1 still names the container jobs (wording drift, superset of the corrected set). (3) The CI half of SC8 waits for the milestone's pull request.
