# Review — wave 11, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 5

Re-review after the 2026-10-17 SC8/SC9 intent correction, at review base 217b67d7e3ebe4f7c0d6a677b2a3b229382a38bd (sidecar `git rev-parse HEAD`, clean). The wave 11 PLAN section and the task files T060 to T064 are byte-identical to the reviewed set (orchestrator's `git diff 16f8ff0 HEAD`, per the brief), so each criterion carries the verdict of the preserved review .project/plan/build-recovery-16f8ff041ef0bcec0ff6bfb50cc5b0fa719afd37/review/wave-11.cycle1.md (pass) with its cited evidence. No wave 11 task owns an INTENT success criterion (PLAN.md `## Intent coverage`), so this review has no Intent coverage section. Checked by this reviewer: every task file's `base` equals the brief's base 3ec57a6; `git diff --name-only <landing>^ <landing>` lists only `files` plus the task file for each landing (T060 10 paths, T061 9, T062 8, T063 5, T064 10; zero outside); the five tasks landed in one parallel round on that base and share no file, so each task's declared files at its landing equal the base plus only its own patch; ledger line 28 of .project/build/verify-ledger.jsonl is commit 94717e2 (T063), result pass; one fact per task read with `git show <landing>:<path>` (listed under each task). Nothing was re-run.

## T060 — Keep the painted-band focus ring readable on Yeti surfaces and toggle labels inside a band, and make box--paint able to catch both: pass

Landing d2fc096d7da7885ccad86078494ec5bf00d56850 on base 3ec57a6562acaf2dc706b32351aa126287336fb4.

- ✅ `packages/ngx-yeti/ngx-yeti-globals.css` resets the band ink to `var(--yeti-color-focus)` on every surface the Context lists, a painted surface keeps its paint's ink, and the ring rule also reaches `.button:has(> input:focus-visible)`; nothing else about the ring changes and nothing under forced colours. — carried; spot-checked: `git show d2fc096:packages/ngx-yeti/ngx-yeti-globals.css` contains `[data-paint] .button:has(> input:focus-visible)`.
- ✅ The `'A11Y-35'` entry of `sanctionedSelectors` names each new selector, and `accessibility.node.spec.ts` fails when the reset's surface list differs from the listed surfaces; both node specs pass. — carried: `toStrictEqual` over the pinned surface list; recorded Verify 6 files / 57 tests.
- ✅ `box--paint` asserts, in the light and the dark scheme, a ring of at least 3:1 for a link in a `yetiCard` inside a `primary` band (against the card's fill), for a toggle label in a band (against the band), and for the `button-band` button (against its band); its ring bands are padded by at least 4px; it passes in Chromium, Firefox, and WebKit. — carried: native test-storybook 8/8 and `ci unit` 8/8 per engine.
- ✅ The Log records the story failing with `outline-color: currentColor` and failing with the surface reset removed, each at the named case. — carried: the Log's two failure demonstrations at box.stories.ts:477 and :518.
- ✅ Ledger row A11Y-35, the `box.md:207` Departures row and the globals paragraph of the specs skill, line 48 and the spinner row of the accessibility skill, step 5 of the yeti-pin skill, and the CHANGELOG say what the Approach names; the spinner row names Playwright's Chromium and Firefox lanes. — carried.
- ✅ Lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the changed files. — carried: finish-T060.log `"exit_code": 0`.

Warnings (non-blocking):
- Carried round 4 item 1: the whole-`.alert` reset regressed a low-emphasis alert in a `primary` band to about 1.00:1; T065 (wave 12) and T069 (wave 13) rework it.

Contract violations (blocking):
- none

## T061 — Test the run-job output folder without Git, record the unit job's skipped count, and give the floor Chromium one launch-options value: pass

Landing e753cd76069646c6e52d2919370cfbdcf9c95f8b on base 3ec57a6562acaf2dc706b32351aa126287336fb4.

- ✅ `tools/ci-local/run-job.test.mjs` asserts the per-leg output folder without Git and without a skip, and it passes natively and inside the `unit` container leg, where the checkout has no `.git`. — carried; spot-checked: `git show e753cd7:tools/ci-local/run-job.test.mjs` uses `legPaths` (3 occurrences).
- ✅ The `ci.yml` `unit` row of `references/ci-local.md` gives passed/skipped counts and says why the earlier run skipped one test; the Log records the run the counts come from. — carried.
- ✅ Both floor Chromium configs take the launch options from one export of `tools/playwright/engines.mjs`, the argument and its reason appear once, and a standing test fails when that export lacks `--disable-stack-profiler`. — carried; spot-checked: `git show e753cd7:tools/playwright/engines.mjs` defines `chromiumFloor`.
- ✅ With `FLOOR_CHROMIUM_PATH` set to Chrome for Testing 141.0.7390.54, `npm exec nx -- test ngx-yeti -- --project=browser` passes. — carried: recorded Verify 27 files / 507 tests.
- ✅ `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the task's files. — carried: finish-T061.log `"exit_code": 0`.

Warnings (non-blocking):
- Carried round 4 item 2: the `legPaths` test pinned the function, not `run()`'s use of it; T066 (wave 12) added the dry-run cross-check.

Contract violations (blocking):
- none

## T062 — Make Storybook down check the port on a dead recorded PID, survive a malformed session file, and give a left-open session its own outcome in both control scripts: pass

Landing b1a3897de43ca00657ee8a0219234ef074127832 on base 3ec57a6562acaf2dc706b32351aa126287336fb4.

- ✅ Storybook `down` on a dead recorded PID exits 1 with "teardown incomplete", naming the survivors and the busy port, when a tree member survives or the port still answers (the state file is removed on that path, as today), and both paths match survivors by PID and start time; its test asserts the port is free after `down`. — carried.
- ✅ In both scripts, an unreadable or malformed `.session` entry does not throw: `down` kills the tree, prints its JSON result, and reports the entry; a test in each suite shows it against a temporary registry folder. — carried.
- ✅ Both scripts declare their session outcomes as one JSDoc union with `left-open` and decide a failed close with one function; no `listedOpen` field or compound predicate remains, and both SKILL.md outcome tables name `left-open`. — carried; spot-checked: at b1a3897 neither control.mjs contains `listedOpen`, and the Storybook script contains `'left-open'`.
- ✅ The Storybook script has no JSDoc cast through `unknown`; yeti-app's listener query survives a failed spawn and has a timeout; Storybook's teardown result has one typed shape with a measured `portFree`. — carried.
- ✅ Both suites pass, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, and `npx prettier --check --ignore-unknown` passes on both skill folders and `tsconfig.scripts.json`. — carried: finish-T062.log `"exit_code": 0`, 12/12 per suite.

Warnings (non-blocking):
- Carried round 4 items 3 to 7. Item 3 is an Nx inputs gap (the root `typecheck` target did not hash `.d.ts`); T066 (wave 12) added `{workspaceRoot}/**/*.d.ts`, and project.json at the review base still has it (read).

Contract violations (blocking):
- none

## T063 — Make the spinner screen-reader check able to fail, guard the VoiceOver foreground, assert the decorative icon's role words, and share inOrder with card: pass

Landing 94717e2329be8d3f142a9592b50ccf26f18f4f35 on base 3ec57a6562acaf2dc706b32351aa126287336fb4 (its parent). Ledger line 28.

- ✅ The spinner check has no assertion that cannot fail, counts the status name on its own, records it in the annotation, and fails when the status name is spoken more than once; it still asserts the end of the wait is spoken once. — carried: the recorded Verify's `nvda` lane, 22 passed with no `BROWSERS`.
- ✅ VoiceOver's `change` throws when Safari is not the frontmost application after the settle. — carried (static reading; runs on macOS in CI only).
- ✅ The VoiceOver decorative-icon row asserts `link` and `button` with `Download` and `Save` in spoken order. — carried (static reading).
- ✅ `card.screen-reader.ts` imports the shared `inOrder`, has no copy of its own, and its comment names no reader or browser version. — carried; spot-checked: `git show 94717e2:apps/screen-reader-e2e/src/card.screen-reader.ts` mentions `inOrder` and holds no `function inOrder`.
- ✅ Lint and typecheck of `screen-reader-e2e` pass, the `nvda` lane passes locally with no `BROWSERS`, and `npx prettier --check` passes on the four files. — carried: ledger line 28, finish-T063.log `"exit_code": 0`. The no-`BROWSERS` lane is the run the corrected SC9 counts.

Warnings (non-blocking):
- Carried: the VoiceOver halves are proven only by the macOS CI job on the milestone's pull request.

Contract violations (blocking):
- none

## T064 — Start the itemStyled deadline after the load, name .js in the typed-scripts docs, clarify the icon align doc, and drop the duplicated e2e checks: pass

Landing 3775a39b15e0a7eb32a127a895e580f4832c6718 on base 3ec57a6562acaf2dc706b32351aa126287336fb4.

- ✅ `itemStyled` starts its timeout after the item's file has loaded. — carried; spot-checked: the landing patch of packages/ngx-yeti-testing/src/lib/story-helpers.ts removes `const deadline = performance.now() + timeout;` before `await itemStylesLoaded(item);` and adds it after.
- ✅ The typed-scripts lines of `AGENTS.md`, `README.md`, and `references/fast-compile.md` name `.js` with `.mjs` and `.cjs`. — carried.
- ✅ The `align` doc of `icon.ts` says the static form leaves no HTML `align` attribute, so the presentational hint never aligns the text. — carried.
- ✅ The stack and center specs share one body for the other-link check, which still fails when that link stays; the setup-serving dev-server test has no assertion that its next line repeats. — carried (the "still fails" half is read from the shared poll, not run with a mutant).
- ✅ Lint and typecheck of `ngx-yeti`, `ngx-yeti-testing`, and `yeti-app-e2e`, the `ngx-yeti-testing` tests, and the yeti-app-e2e center, stack, and setup-serving specs pass, and `npx prettier --check` passes on the task's files. — carried: finish-T064.log `"exit_code": 0`.

Warnings (non-blocking):
- none new.

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none in this record; the A11Y-35 surface list was reworked after this wave (T065, T069).
- warnings worth a human eye: the wave 11 gate's floor-chromium-141 and floor-webkit failures (prior review warning 4) touched no wave 11 file; the corrected SC8 moves floor-webkit to CI, and `chromium-141` stays in the native set the ship Verify runs.
