---
id: T028
title: Run every CI and floor job locally on the milestone tip and re-time the long jobs
wave: 9
deps: [T027, T053, T054, T055, T056, T057, T058]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - references/ci-local.md
  - .github/workflows/ci.yml
  - .github/workflows/floor.yml
  - tools/ci-local/run-job.mjs
---

# T028 — Run every CI and floor job locally on the milestone tip and re-time the long jobs

## Context

SC8 (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."): `npm run check` passes and every job of `.github/workflows/ci.yml` and `floor.yml` passes locally (container jobs through `node tools/ci-local/run-job.mjs`, the others natively, the `nvda` lane included), the macOS-only `safari` and `voiceover` jobs excepted, which pass in CI on the milestone's pull request before the user merges it (integration `pull-request`). M002 roughly triples the stories and e2e tests: measured on 2026-10-10 (runs 38057092891 and 38050819430) `unit` took 1 to 2 minutes, each `e2e` leg 2 to 3, and `safari` 1, under 20-minute caps; this task re-times the jobs after the item waves and adds a Playwright `--shard` axis only to a job that passes about 15 minutes.

## Approach

- On the milestone tip, run in turn (one job at a time per checkout, references/ci-local.md): `npx prettier --check .` and `npm run check`; `npm exec nx -- run-many -t build pack-check`; `node tools/ci-local/run-job.mjs ci unit`; `node tools/ci-local/run-job.mjs ci e2e` (every engine and configuration, the Tailwind ones included); `node tools/ci-local/run-job.mjs floor webkit-26-4`; `node tools/ci-local/run-job.mjs floor firefox-146-e2e`; `firefox-145` and `chromium-141` natively as references/ci-local.md's table says; `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`, and the same target once with no `BROWSERS` (Playwright's Chromium and then Firefox, the job's own browsers; T041). For `chromium-141`, give `@puppeteer/browsers` an absolute `--path`, such as `--path "$(pwd)/tmp/floor-chrome"`: with a relative one the printed browser path is relative and Vitest does not find the browser (measured at the wave 3 gate, 2026-10-11: 409 of 409 passed with the absolute path). Say so in the `chromium-141` row of references/ci-local.md. Record each job's wall time and result in the Log, and the timings in `references/ci-local.md` where it lists measured runs.
- Since T043, `run-job.mjs` can run a job's legs concurrently, and locally with more e2e workers than CI. GitHub runs each leg on its own runner with the workflow's settings, so the 15-minute decision below uses one leg's time measured as CI runs it: run the longest leg alone with `--matrix` and the local worker count and build cache off (references/ci-local.md says how), not the job's concurrent wall clock.
- A job that passes about 15 minutes gets a `--shard` axis in its matrix, as `floor.yml`'s `firefox-146-e2e` has, in the workflow and kept runnable through `run-job.mjs`; otherwise leave the workflows unchanged, apart from the guidepup version steps below.
- The guidepup version steps of `.github/workflows/ci.yml` (the `voiceover` and `nvda` jobs' `id` steps, lines 129-130 and 161-163 at 1747fe0) must fail when the version lookup fails or prints nothing. Review round 1 and the security review (triaged by the orchestrator on 2026-10-12) found, verbatim: "a failed version lookup in the guidepup `id` steps does not fail the step ... `run: echo "version=$(node -p "require('@guidepup/guidepup/package.json').version")" >> "$GITHUB_OUTPUT"` ... under `bash -e`, a failing command substitution inside `echo`'s argument does not stop the step. The cache key would become `guidepup-<reader>-<os>-` and restore or save a cache that does not match any guidepup version." and "[A08] the `guidepup` step output can be empty, which collapses the cache key across versions and gives a stale reader binary, not a poisoned one. Use `set -o pipefail` and fail the step on an empty version." Triage fix: compute the version into a variable, test it is not empty, then write the output. The `guidepup setup --ci` step stays (declined by the triage: it documents the lane's setup parity with voiceover). Show the step failing on an empty version once locally, for example by running its `run` text in Git Bash with the package path swapped for a missing one, and record it in the Log; the `voiceover` job's step first runs in CI on the milestone's pull request.
- A failing job is a finding, not something to fix here: write `NEEDS-ORCHESTRATOR:` with the job, the failing test, and the engine, so the wave review turns it into a fix task in the owning item's files. Change `tools/ci-local/run-job.mjs` only if it refuses a workflow key the milestone added, with a test of the change if it has one.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; references/ci-local.md.

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- SC8

## Acceptance criteria

1. On the milestone tip, `npm run check`, `npx prettier --check .`, `build` and `pack-check`, the `unit` and every `e2e` combination through `run-job.mjs`, the floor jobs `webkit-26-4`, `firefox-146-e2e`, `firefox-145`, and `chromium-141`, and the `nvda` lane all pass locally; the Log records each job's wall time and result.
2. `references/ci-local.md` records the re-timed jobs; any job past about 15 minutes has a `--shard` axis that `run-job.mjs` runs, and no other workflow change was made besides criterion 4.
3. `npx prettier --check .` passes at the task commit.
4. Both guidepup version steps of `.github/workflows/ci.yml` exit non-zero when the version is empty or its lookup fails, and the Log records one such failing run.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f references/ci-local.md && ! rg -q -F 'echo "version=$(node -p' .github/workflows/ci.yml && npx prettier --check . && npm run check && npm exec nx -- run-many -t build pack-check && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e && FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser && npm exec nx -- run screen-reader-e2e:nvda && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — planner: build repair before wave 4 (user rulings of 2026-10-11, quoted in T035 to T041). Approach names the absolute Chrome 141 path (user ruling "5: Approve.") and the lane run with no BROWSERS, which the Verify now also runs after T041 (reached through T027). Acceptance criteria, deps, files, and wave are unchanged.
- 2026-10-12 — planner: build repair #2. T042 changes the `unit` job in `ci.yml` (`VITEST_MAX_WORKERS: 2`, `--parallel=1`) and T043 changes `run-job.mjs` and `references/ci-local.md`, both in wave 4. This task comes in wave 5, after them, so it needs no dependency edge on either. Approach gains one bullet: the shard decision uses one leg's time as CI runs it, not the concurrent local wall clock. Acceptance criteria, deps, files, and Verify are unchanged.
- 2026-10-12 — planner (build repair #3, review round 1 and the security review): the orchestrator's triage routes item 18b and security finding 2 (the guidepup version steps) to this task, which owns `.github/workflows/ci.yml` in wave 5. Approach gains one bullet with the findings verbatim; criterion 4 is new and criterion 2 allows it; the Verify first checks that the bare `echo "version=$(node -p` form is gone. Files, deps, and wave are unchanged.
- 2026-10-13 — planner (build repair 5): moved from wave 5 to wave 9, after the new tasks T053 to T058, with an edge to each. Build runs the lowest unfinished wave first (`build_state.py ready`), so in wave 5 this gate would have run before the typed scripts (T053), the review round 2 fixes (T054 to T057), and the painted-band rules (T058), and its "milestone tip" would not be the tip; T053 and T054 also edit `tools/ci-local/run-job.mjs` and T054 edits `references/ci-local.md`, which this task edits. The Interface contract gains the typed-scripts contract, because `run-job.mjs` is a typed script by then. Acceptance criteria, files, and Verify are unchanged; `npm run check` now also runs the root `typecheck` target T053 adds.
