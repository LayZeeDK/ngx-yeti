---
id: T077
title: Fix wave 15 cycle 1 review findings in T071
wave: 16
deps: [T071]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - project.json
  - tools/playwright/navigation-budget.test.mjs
---

# T077 — Fix wave 15 cycle 1 review findings in T071

## Context

Repair task created from the wave 15 cycle 1 review of T071.
The failed criteria and every reviewer observation are recorded verbatim under Review findings.
The source task contracts are unchanged; read them and .project/intent/INTENT.md before editing.

## Approach

- Fix only what the Review findings name, inside the listed files; do not change the source
  tasks' acceptance criteria or interface contracts.
- Re-run the source tasks' Verify commands after the fix and record the result in the Log.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files.

## Verify

```bash
set -e
(
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/playwright/navigation-budget.test.mjs' project.json && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npm exec nx -- run-many -t lint typecheck -p yeti-app-e2e && npx prettier --check apps/yeti-app-e2e/src/fixture-app.spec.ts tools/playwright/navigation-budget.test.mjs project.json && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development; status=$?; npx --no-install nx daemon --stop; exit $status
)
```

Heavy: yes

## Review findings

### t071_ac5
Criterion: `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files.
- `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files. — found: the root `test` target passes only in a checkout with no git-ignored Vitest screenshot folder. `globSync('{apps,packages}/**/*.{ts,mts,mjs,tsx}', ...)` at tools/playwright/navigation-budget.test.mjs:285 also returns directories, and the `exclude` at :287 prunes only the `buildOutput` basenames, so `readFileSync` at :344 meets `__screenshots__/<name>.spec.ts/` (git-ignored, .gitignore:52) and throws EISDIR. Measured here: the clean sidecar gives 4/4; after `mkdir -p packages/ngx-yeti/lift/src/__screenshots__/lift.spec.ts` (ignored, `git status` clean) the same command gives 3 pass, 1 fail, `Error: EISDIR: illegal operation on a directory, read`. The primary checkout holds three such folders (lift.spec.ts, ua-probe.spec.ts, item-links.browser.spec.ts), so `@ngx-yeti/source:test` fails there today: the orchestrator measured it (RUN.md 2026-10-16), both thermos reports measured it (wave15-thermos-bugs.md H1, wave15-thermos-quality.md H1), and the defect has already been inherited: T076's and T074's per-commit `nx affected -t ... test` checks failed on it (both Logs, NEEDS-ORCHESTRATOR). The isolated Verify passed only because a fresh worktree has no ignored folders. It also contradicts the task's Approach, which asks the scan to parse files and skip build output. A Vitest browser failure anywhere leaves such a folder, after which every local per-commit gate (AGENTS.md "Commits") and the wave review gate's `run-many -t test` fail for work that did nothing wrong. fix: in tools/playwright/navigation-budget.test.mjs, build `files` from Git instead of the glob: `git ls-files -co --exclude-standard -z -- apps packages` (execFileSync with an argv array, as tools/typecheck/scripts-coverage.test.mjs and control-yeti-app's `newestSource` already do), keep the four extensions, and drop `buildOutput`, the `basename` import and `exclude`. This returns only regular files, leaves ignored output out (matching what Nx hashes for the target's inputs), and also covers the tracked dot folder `packages/ngx-yeti/.storybook/`. Add a test that plants an ignored directory named like a spec file (for example under a temp `__screenshots__/x.spec.ts/`) or asserts every listed path is a file, and show it failing against the current glob.

## Log

- 2026-10-16 — created by dispatch_driver.py fix-tasks from wave 15 cycle 1
