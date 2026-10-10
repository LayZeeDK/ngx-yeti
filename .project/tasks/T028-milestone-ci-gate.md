---
id: T028
title: Run every CI and floor job locally on the milestone tip and re-time the long jobs
wave: 5
deps: [T027]
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

- On the milestone tip, run in turn (one job at a time per checkout, references/ci-local.md): `npx prettier --check .` and `npm run check`; `npm exec nx -- run-many -t build pack-check`; `node tools/ci-local/run-job.mjs ci unit`; `node tools/ci-local/run-job.mjs ci e2e` (every engine and configuration, the Tailwind ones included); `node tools/ci-local/run-job.mjs floor webkit-26-4`; `node tools/ci-local/run-job.mjs floor firefox-146-e2e`; `firefox-145` and `chromium-141` natively as references/ci-local.md's table says; `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`. Record each job's wall time and result in the Log, and the timings in `references/ci-local.md` where it lists measured runs.
- A job that passes about 15 minutes gets a `--shard` axis in its matrix, as `floor.yml`'s `firefox-146-e2e` has, in the workflow and kept runnable through `run-job.mjs`; otherwise leave the workflows unchanged.
- A failing job is a finding, not something to fix here: write `NEEDS-ORCHESTRATOR:` with the job, the failing test, and the engine, so the wave review turns it into a fix task in the owning item's files. Change `tools/ci-local/run-job.mjs` only if it refuses a workflow key the milestone added, with a test of the change if it has one.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; references/ci-local.md.

## Interface contract

- None

## Intent coverage

- SC8

## Acceptance criteria

1. On the milestone tip, `npm run check`, `npx prettier --check .`, `build` and `pack-check`, the `unit` and every `e2e` combination through `run-job.mjs`, the floor jobs `webkit-26-4`, `firefox-146-e2e`, `firefox-145`, and `chromium-141`, and the `nvda` lane all pass locally; the Log records each job's wall time and result.
2. `references/ci-local.md` records the re-timed jobs; any job past about 15 minutes has a `--shard` axis that `run-job.mjs` runs, and no other workflow change was made.
3. `npx prettier --check .` passes at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f references/ci-local.md && npx prettier --check . && npm run check && npm exec nx -- run-many -t build pack-check && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e && FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
