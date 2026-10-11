---
id: T033
title: Fix wave 2 cycle 1 review findings in T030
wave: 6
deps: [T030]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
---

# T033 — Fix wave 2 cycle 1 review findings in T030

## Context

Repair task created from the wave 2 cycle 1 review of T030.
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

1. No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs.

## Verify

```bash
set -e
(
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/fixture-app.spec.ts && npm exec nx -- run-many -t lint typecheck -p yeti-app-e2e && npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts --grep=@stub-route-control && npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit fixture-app.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
); status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Review findings

### t030_ac3
Criterion: No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs.
- No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs. — found: the wrong-key control (fixture-app.spec.ts:318-342) serves the live `button` route's document. `expectFixtureRoute` returns `false` without checking the h2 when `[data-fixture-stub]` is absent (:214-216), so once the button task replaces its stub the promise resolves instead of rejecting and the control fails; that item task (button, T020) must then edit this file. Confirmed by reading the code; not run (button stub still present). fix: serve a synthetic stub document from `page.route` (as the empty-document control at :298-313 does) whose `main` holds `router-outlet` followed by an element with `data-fixture-stub` and `<h2>button</h2>`, so no control depends on a real route staying a stub; keep the asserted `stubHeadingMessage`.

## Log

- 2026-10-11 — created by dispatch_driver.py fix-tasks from wave 2 cycle 1
