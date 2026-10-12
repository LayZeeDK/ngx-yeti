---
id: T042
title: Run the ci unit job's tasks one at a time with two Vitest pages per engine
wave: 4
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .github/workflows/ci.yml
  - references/ci-local.md
---

# T042 — Run the ci unit job's tasks one at a time with two Vitest pages per engine

## Context

Build repair before wave 4, second repair. User rulings, verbatim (2026-10-12): "Approve both changes: Faster and narrower" then "Unless you don't think we should land Verify-narrowing". The orchestrator declined the narrowing with evidence (the pending Verify commands already pass narrowed commands to `run-job.mjs`), so nothing is narrowed here. This task is the unit-job fix that the plan repair puts first; T043 is the faster local runs.

The defect (root-cause spike of 2026-10-12, sidecar at 2e70371; its files are git-ignored and not in this worktree, so the numbers are inlined here). `.github/workflows/ci.yml` job `unit` runs `npx nx run-many --output-style=static -t test test-storybook`. Measured: one run saturates its own 8-vCPU, 16 GB Docker VM, CPU at 760 to 930 % and memory at 13.9 to 14.7 GiB, with 1.3 to 2 GiB swapped out. Nx runs 3 tasks at a time by default, so `ngx-yeti:test` and `ngx-yeti:test-storybook` overlap. Each runs Vitest browser mode in three engines (under `CI`), and each engine opens `min(12, availableParallelism - 1)` pages: 7 on 8 vCPUs, about 45 pages in all. With no slack, any host load pushes a run past a fixed timeout. These timeouts fired in the runs: the 60 s browser connect timeout (always Firefox: "Failed to connect to the browser session ... within the timeout"; "Browser connection was closed" and "JavaScriptTransformer closed" follow from it), the 15 s browser test timeout (the `lift.spec.ts` hover tests in all three engines), the 5 s Node test timeout (`yeti-rank.node.spec.ts`, which starts a child process), and testing-library's 1 s `waitFor` (`frame--default` in Firefox). T037's attempt 1 was rejected on exactly these signatures (its Log).

Measured results, all through `node tools/ci-local/run-job.mjs ci unit`:

- Base as found (lock held, 2.7 to 11.8 GB free on the host): 8 of 9 passed, warm wall 105 to 156 s, peak memory 13.9 to 14.7 GiB.
- Base under a CPU quota (`--cpus=4`, while Vitest still sizes for 8 CPUs; stands in for a busy host): 1 of 4.
- Base on an emulated 4-vCPU runner (`--cpuset-cpus=0-3`): 0 of 1.
- `--parallel=1` alone, as CI runs it: 2 of 4. `VITEST_MAX_WORKERS=2` alone, under the quota: 3 of 4.
- Both together (fix C4), as CI runs it, host as found (2.8 to 13.4 GB free): 8 of 8, wall 120 to 155 s (no wall-clock cost), peak memory 8.3 to 9.2 GiB (about 14.4 down to about 8.7). Per task, `test` took 21 to 35 s and `test-storybook` 47 to 60 s, against 50 to 69 s and 85 to 119 s when they overlapped.

Mechanism of the fix: `--parallel=1` is Nx's own task-concurrency setting, and `VITEST_MAX_WORKERS` overrides Vitest's per-project `maxWorkers` in every project (vitest 4.1.11 `resolveConfig.ts`), the tool's own setting for several Vitest processes on one machine. Both are scoped to this CI job, so local `nx test` runs, which use Chromium only, keep their defaults. `run-job.mjs` reads the job's `env` and steps, so local runs of the job get both settings. A longer timeout was rejected because it hides the contention.

## Approach

- Apply the spike's recommendation (C4) to job `unit` in `.github/workflows/ci.yml`, and nothing else in the workflow. Add `VITEST_MAX_WORKERS: 2` to the job's `env`, after `HOME: /root`, with a short comment: Vitest's default is one page per CPU less one, for each of the three engines, which leaves the runner no slack for its 15 s test and 60 s connect timeouts. Change the check step to `npx nx run-many --output-style=static -t test test-storybook --parallel=1`, with a comment: test and test-storybook each open pages in all three engines, and together they overload the runner. Comments state the reason only, with no dates, run counts, or task ids.
- INTENT's "Do not break" line covers the CI and floor workflows: no other job, matrix, timeout, or step changes. `run-job.mjs` must still accept the job: a number in `env` is passed as a string, and the step stays a plain `run`.
- `references/ci-local.md`: the "Container jobs without Docker" bullet gives the unit job's native equivalent (`BROWSERS=chromium,firefox,webkit npm exec nx -- run-many -t test test-storybook`). Give it the job's two settings. Replace the Pitfalls line "Under heavy CPU load ... `--parallel=1` lightens the load" with the measured cause and the two settings, stated as facts with the numbers above (8 of 8 against 8 of 9 as found and 1 of 4 under a CPU quota; peak memory about 14.4 to 8.7 GiB; no wall-clock cost). Leave the other sections to T043 and T041.
- How many runs prove it. The deterministic part of the Verify is the setting checks: the workflow text and the `--dry-run` output of `run-job.mjs` (the env the container gets) fail at once if the fix is reverted. The Verify then runs the job 5 times in a row. Why 5: with C4 the spike measured 8 of 8. At base, a mostly quiet host passes 5 in a row with probability about (8/9)^5, or 0.55, and a loaded host almost never does (1 of 4 under the quota). So 5 runs catch a revert about half the time even on a quiet host, and nearly always on a loaded one, at about 12 minutes. Catching it reliably on a quiet host would take about 20 runs, about 45 minutes.
- Record in the Log the result and wall time of each of the five runs, plus one run's peak container memory from `docker stats`. Expect about 8 to 9 GiB; about 14 GiB means a setting did not reach the container.
- The job takes the whole machine, so the orchestrator serializes heavy runs. Read `references/ci-local.md` before running a container job.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `.github/workflows/ci.yml` job `unit` has `VITEST_MAX_WORKERS: 2` in its `env`, and its check step is `npx nx run-many --output-style=static -t test test-storybook --parallel=1`. Each change has one reason comment. No other job, step, or key of either workflow changed.
2. `node tools/ci-local/run-job.mjs ci unit --dry-run` passes `VITEST_MAX_WORKERS=2` to the container and runs the step with `--parallel=1`.
3. `node tools/ci-local/run-job.mjs ci unit` passes 5 times in a row. The Log records each run's result and wall time, and one run's peak container memory.
4. `references/ci-local.md` gives the unit job's native equivalent with both settings, and states the measured cause and effect in place of the old `--parallel=1` pitfall.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && rg -q -F "VITEST_MAX_WORKERS: 2" .github/workflows/ci.yml && rg -q -F -e "-t test test-storybook --parallel=1" .github/workflows/ci.yml && node tools/ci-local/run-job.mjs ci unit --dry-run | rg -q -F "VITEST_MAX_WORKERS=2" && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #2; user rulings "Approve both changes: Faster and narrower" and "Unless you don't think we should land Verify-narrowing"). The evidence in Context is from the spike of 2026-10-12 (sidecar spike-ci-unit at 2e70371). Its files are git-ignored and not in the repository. The spike's `SPIKE_DOCKER_ARGS` passthrough in `run-job.mjs` was spike-only and does not land. GitHub-hosted CI is not measured by this task: a push is a human-only gate (PLAN.md Risks). The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — coder: implemented. `.github/workflows/ci.yml` job `unit` gains `VITEST_MAX_WORKERS: 2` in `env` and `--parallel=1` on the check step, each with a reason comment. `references/ci-local.md` gives the native equivalent with both settings and replaces the old `--parallel=1` pitfall with the measured cause and effect. `npx prettier --check` passes on both files.
- 2026-10-12 — coder: Verify run once through the heavy lock, as written except that the five runs sat in a loop that prints each run's wall time. Result: exit 0. Setting checks and `--dry-run` passed. Pass count 5 of 5; wall times 167 s, 108 s, 109 s, 111 s, 114 s. Peak container memory was not captured (no `docker stats` sample was taken during the runs), so the 8 to 9 GiB expectation is unverified here.
