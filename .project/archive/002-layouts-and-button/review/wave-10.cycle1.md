# Review — wave 10, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

Re-review after the 2026-10-17 SC8/SC9 intent correction, at review base 217b67d7e3ebe4f7c0d6a677b2a3b229382a38bd (sidecar `git rev-parse HEAD`, clean). The wave 10 PLAN section and the T059 task file are byte-identical to the reviewed set (orchestrator's `git diff 16f8ff0 HEAD`, per the brief), so each criterion carries the verdict of the preserved review .project/plan/build-recovery-16f8ff041ef0bcec0ff6bfb50cc5b0fa719afd37/review/wave-10.cycle1.md (pass) with its cited evidence. T059 owns no INTENT success criterion (PLAN.md `## Intent coverage`), so this review has no Intent coverage section. Checked by this reviewer: the task file's `base` equals the brief's base and is the landing's parent; `git diff --name-only 8d92f28^ 8d92f28` lists 7 paths, the 6 `files` plus the task file, none outside; ledger line 23 of .project/build/verify-ledger.jsonl is commit 8d92f28, result pass; `git show 8d92f28:<path>` finds `--disable-stack-profiler` once in tools/playwright/browser-projects.mjs and once in packages/ngx-yeti/vitest.unit.config.mts. Nothing was re-run.

## T059 — Start the floor Chromium without its stack profiler so the Chromium 141 floor run exits: pass

Landing 8d92f28c48846617d353ce1f79cb6dd74a57e437 on base 770eeb20235843ab1360c0f6983bdd5381d270a0 (its parent).

- ✅ `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations"). — carried on the local half from the prior review: the gate at 1ce351b (tmp/afk-m002/gate-wave4-c3/, 8 steps, each exit 0) ran run-many uncached for 9 projects, prettier, `ci unit`, every `ci e2e` leg, both floor container jobs, `firefox-145` (507) and `chromium-141` natively (507; 152/1; 618/2; exit 0 by itself). This criterion is the task's own copy of the pre-correction SC8 wording and is judged as written; it is not an owned SC (T059 is not in the Intent coverage table). The CI half waits for the milestone's pull request, as in the prior review.
- ✅ With `FLOOR_CHROMIUM_PATH` set to Chrome for Testing 141.0.7390.54, `npm exec nx -- run-many --output-style=static -t e2e -p ngx-yeti-e2e yeti-app-e2e --skip-nx-cache` exits by itself with every test passed, three runs in a row, and no `chrome.exe` of that run stays listed afterwards; the Log records each run's counts and wall time. — carried: Log runs 4 to 6 (152/1 and 618/2, about 3 m 50 s each, no `chrome.exe` left by start time), plus ledger line 23 and the gate step.
- ✅ With the same variable set, `npm exec nx -- test ngx-yeti -- --project=browser` passes. — carried: ledger line 23, 27 files / 507 tests.
- ✅ `tools/playwright/browser-projects.test.mjs` fails when the floor Chromium project lacks `--disable-stack-profiler`, and `npm exec nx -- run @ngx-yeti/source:test` passes. — carried: strict `deepEqual` on the launch options, the Log's 0 passed / 1 failed against the unflagged helper, ledger line 23 tests 41 / pass 41.
- ✅ `docs/specs/upstream-bugs.md` has the two rows and `references/ci-local.md` the line; no other launch option of any project changed. — carried (rows O18 and O19, the ci-local line); spot-checked: the argument appears only in the two floor configs named above at 8d92f28.
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — carried: ledger line 23 Prettier clean; gate run-many uncached over all 9 projects at 1ce351b.

Warnings (non-blocking):
- Criterion 1 copies the pre-correction SC8 wording (container jobs locally). Its written local half is met; under the corrected SC8 it asks for more than INTENT now does. Wording drift only.
- Carried: the Vitest copy of the argument had no standing check (fixed by T061 in wave 11 with one `chromiumFloor` export and a test); the NVDA lane's Chromium starts without the argument (inferred exposure); the CI half waits for the pull request.

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none.
- repeat offenders: none.
- warnings worth a human eye: criterion 1 restates the pre-correction SC8 and is met as written; the CI half of it waits for the milestone's pull request.
