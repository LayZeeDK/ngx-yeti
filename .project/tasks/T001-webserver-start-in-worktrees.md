---
id: T001
title: Reproduce and fix the Playwright webServer start in pipeline worktrees
wave: 1
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/ngx-yeti-e2e/playwright.config.mts
  - apps/yeti-analog-e2e/playwright.config.mts
  - docs/decisions/2026-10-03-test-infrastructure.tsv
---

# T001 — Reproduce and fix the Playwright webServer start in pipeline worktrees

## Context

The program synthesis decision "Playwright webServer failure 'nx' is not recognized" (low confidence) records that `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` could not start their web servers in a disposable worktree under the C: temp folder, under both npm installs and with both `npx nx` and `npm exec -- nx`; the cause was never found. GSD Path runs every task and review Verify in a linked worktree with a fresh `npm ci`, so a worktree-only failure would block every e2e Verify of this milestone. This task is the wave-1 spike: reproduce or rule out the failure in a pipeline-created linked worktree and in the primary checkout, fix `webServer.command` in all three e2e projects if it reproduces, and record the outcome either way. The milestone synthesis lists it as wave-1 blocker 1; INTENT.md Scope: in names the three configs and says `yeti-analog-e2e` is touched only for this fix.

## Approach

- Reproduce first, in two places, and keep the evidence: (1) a linked worktree created the way the pipeline creates task worktrees (ask the orchestrator for the path its isolation helper uses, or create one with `git worktree add` beside the primary checkout on the D: drive), after `npm ci --no-audit --no-fund`; (2) the primary checkout. In each, run `npx nx e2e ngx-yeti-e2e` and `npx nx e2e yeti-app-e2e` and capture the webServer's stderr.
- The three commands today are `npx nx run ...` strings in `apps/yeti-app-e2e/playwright.config.mts`, `apps/ngx-yeti-e2e/playwright.config.mts`, and `apps/yeti-analog-e2e/playwright.config.mts`. On Windows, Playwright spawns `webServer.command` through a shell whose PATH may not resolve the `nx` bin shim inside a nested process; the fix (if needed) must not depend on PATH resolution of `nx`, for example by invoking Nx's CLI through `node` with the resolved path of the installed `nx` package. The coder picks the mechanism; apply the same one to all three configs.
- Keep everything else in each config: `cwd: workspaceRoot`, the `env: { PORT }` and its comment (it keeps `@nx/playwright` from inferring a `serve-ssr` dependency), `reuseExistingServer`, the timeouts, the readiness `url` (the `highlight` readiness URL moves to `card` later, in the placeholder task), and `projects: browserProjects()`. Do not edit `tools/playwright/browser-projects.mjs`, the CI or floor workflows, or anything else under `apps/yeti-analog` or `apps/yeti-analog-e2e` beyond the command.
- If it does not reproduce in either place, leave the configs unchanged and record that the scratch location under the C: temp folder was the cause.
- Append one row to `docs/decisions/2026-10-03-test-infrastructure.tsv` in its column order (`ts`, `phase`, `decision`, `why`, `evidence`, `result`, tab-separated, UTC timestamp), phase `e2e`, whose text names `webServer`, both reproduction locations, the cause found, and the fix or the scratch-location ruling.
- Bisect-safe commit: `npx prettier --check .` and `npx nx run-many -t lint typecheck -p yeti-app-e2e ngx-yeti-e2e yeti-analog-e2e` pass. Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (layer 4, the e2e projects, engines).

## Interface contract

- None

## Intent coverage

- SC6

## Acceptance criteria

1. `npx nx e2e ngx-yeti-e2e` and `npx nx e2e yeti-app-e2e` start their web servers and pass on Chromium both in a pipeline-created linked worktree and in the primary checkout; the task Log records the command, location, and exit code of each of the four runs, and the stderr of any failed start before the fix.
2. If the failure reproduced, the `webServer.command` of all three e2e configs uses the same PATH-independent invocation and `npx nx e2e yeti-analog-e2e` still starts its server and passes; if it did not reproduce, the three configs are unchanged.
3. `docs/decisions/2026-10-03-test-infrastructure.tsv` has one new row, phase `e2e`, that names `webServer`, the two reproduction locations, the cause, and the fix or the scratch-location ruling.
4. `npx prettier --check .` and `npx nx run-many -t lint typecheck -p yeti-app-e2e ngx-yeti-e2e yeti-analog-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx e2e ngx-yeti-e2e && npx nx e2e yeti-app-e2e && npx nx e2e yeti-analog-e2e && rg -q webServer docs/decisions/2026-10-03-test-infrastructure.tsv
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
