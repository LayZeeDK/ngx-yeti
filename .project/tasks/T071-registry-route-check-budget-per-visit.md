---
id: T071
title: Give each route visit of the registry route check its own budget, and fail the root test target on any test that loops over page loads under a fixed budget
wave: 15
deps: [T053, T066]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - tools/playwright/navigation-budget.test.mjs
  - project.json
---

# T071 — Give each route visit of the registry route check its own budget, and fail the root test target on any test that loops over page loads under a fixed budget

## Context

Final-review patch of M002 (2026-10-15), finding P001 of .project/review/PATCH-FINDINGS.md (reviewed HEAD f8aa2eacac8aabf1099271b52466cc8605b65aeb), source .project/review/final-gap-1.md, Risk: project Verify. The finding comes from a failing project Verify, so the patch-mode pattern rule applies: this task covers every site in the codebase with the same pattern and proves the pattern absent codebase-wide.

P001, verbatim:

- **Evidence**: Project Verify failed at the reviewed commit.
- **Fix direction**: Resolve the recorded command failure before shipping.

Measured by the orchestrator (the recorded output in .project/build/verify-ledger.jsonl, entry for f8aa2eac, result fail; the failing leg's error section saved ANSI-stripped):

- Failing leg: `node tools/ci-local/run-job.mjs ci e2e`, leg ci-e2e-firefox-development (15 m 31 s); 2 failed, 4 skipped, 614 passed. Every other leg of that job passed.
- Both failures are apps/yeti-app-e2e/src/fixture-app.spec.ts:220 "serves its fixture, not a stub", in "every prerendered route of the registry" and "every server-rendered route of the registry". The test loads all 34 keys of the build's prerendered-routes.json (under dist/apps/yeti-app) one after another (JavaScript off) inside one test, under the default 30 s test timeout.
- All three attempts of each hit "Test timeout of 30000ms exceeded", each at a different route (table-numeric, replay, layer, sidebar). Retry 2's "the route renders its fixture, not a stub ... Received: undefined" is the test timeout landing mid-expect, not a rendered stub.
- During the run another repository's gate (about 23 node processes) and an unrelated control.test.mjs run were on the machine. The test passed in every earlier local gate; its budget does not scale with the route count, so it passes only with headroom.

Searched by the planner at f8aa2ea (measured: a one-off TypeScript AST scan of every .ts, .mts, .mjs and .tsx file under apps/ and packages/, outside node_modules and dist, for a call to `test` or `it` whose callback holds a loop or an array-iteration callback that calls `goto`, `reload`, `goBack`, `goForward`, `setContent`, `newPage`, `openStory`, `axeViolations` or a lane's `open`): the only match is fixture-app.spec.ts:220 (loop at :225, `page.goto` at :227), which runs twice, once per route kind. Every other loop over stories, viewports, widths or route kinds in the e2e, screen-reader and story files generates one test per entry, so each visit already has its own test budget. The NVDA lane's reload loop in apps/screen-reader-e2e/src/support/nvda.ts has its own 60 s deadline and does not grow with a list.

## Approach

- The fix in fixture-app.spec.ts: keep one test per route kind, set its timeout to the route count times a per-visit budget (`test.setTimeout`), and give each visit's `test.step` that same per-visit budget through the step's `timeout` option (Playwright 1.50 and later; the repository runs 1.63, and the floor jobs 1.58.2 and 1.59.1). The per-visit budget is the configured per-test timeout read from `test.info().timeout` before it is changed, so every route gets what a one-route test gets, and a route that hangs fails at its own step, named by its key, instead of eating the budget of the rest. Why not one test per key: the keys are read from the build's list of prerendered routes, which the Fixture app build writes; in a fresh checkout that build runs in Playwright's webServer (`nx run yeti-app:serve-ssr`, apps/yeti-app-e2e/playwright.config.mts), after the spec files are collected, so generating tests from the list at collection would read a file that does not exist yet (inferred from the config and ci.yml's e2e comment, not run).
- Keep `registeredKeys`, the `card` containment check, `expectFixtureRoute`, the negative-control describe (`@stub-route-control`), and every other test of the file as they are. Do not change a timeout in a Playwright config, the preset, or `tools/playwright/browser-projects.mjs`: a wider global budget would hide a slow route everywhere else.
- The codebase-wide check, tools/playwright/navigation-budget.test.mjs, a typed `node:test` file (Interface contract): parse every .ts, .mts, .mjs and .tsx file under apps/ and packages/ (skip node_modules, dist, storybook-static and other build output) with the `typescript` package, and fail, naming file:line and the fix ("give each visit its own budget: a test timeout scaled by the count, or one test per entry"), for every `test` or `it` call (including `.only`, `.fixme`, `.fail`; not `describe`, `step` or hooks) whose callback contains, inside a `for`, `for...of`, `for...in`, `while` or `do` loop or a `forEach`, `map` or `flatMap` callback, a navigation call: `goto`, `reload`, `goBack`, `goForward`, `setContent`, `openStory`, `axeViolations`, or a screen-reader lane's `open`. A test passes the check when its body sets `test.setTimeout` (or `testInfo.setTimeout`) with an argument that reads the loop's count (`.length` of the iterated list). A loop that generates tests (`for (...) { test(...) }`) is not flagged. Show the rule can fail: the check also runs its rule on inline source text, flagging a fixed-budget loop of `goto` in one test, passing the scaled one and a test-generating loop, and asserts it parsed a nonzero number of test calls in the real tree.
- Add the check to the root `@ngx-yeti/source` `test` target in project.json (its `command`), and give the target inputs that make an edit to any scanned file miss the cache. Keep the target's other files and inputs.
- Pitfall: the check reads only the syntax tree, so a helper that navigates in a loop on a caller's behalf is not seen; the planner's scan found none (no support helper loops over navigations), and the check need not follow calls.
- Code comments: only what the code cannot say; no planning IDs, dates, or measurements.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; `references/ci-local.md` for one e2e job and leg; AGENTS.md "Scripts" and "Run CI locally".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. In apps/yeti-app-e2e/src/fixture-app.spec.ts, both "serves its fixture, not a stub" tests set a test timeout of the key count times the per-visit budget read from `test.info().timeout`, and each key's `test.step` has that per-visit budget as its `timeout`; the rest of the file is unchanged.
2. tools/playwright/navigation-budget.test.mjs fails on the base fixture-app.spec.ts (f8aa2ea), naming fixture-app.spec.ts and the line of the test, and passes after criterion 1; the Log records the failing run on its assertion.
3. The check flags a fixed-budget loop of `goto` in one test given as inline source, does not flag the scaled form or a loop that generates tests, and asserts it parsed more than zero test calls under apps/ and packages/.
4. The root `test` target's command in project.json runs tools/playwright/navigation-budget.test.mjs, and an edit to a scanned spec file misses that target's cache.
5. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, lint and typecheck of yeti-app-e2e pass, and prettier passes on the three files.
6. The failing leg passes through run-job: `node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development` exits 0, with both registry route tests passing.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/playwright/navigation-budget.test.mjs' project.json && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npm exec nx -- run-many -t lint typecheck -p yeti-app-e2e && npx prettier --check apps/yeti-app-e2e/src/fixture-app.spec.ts tools/playwright/navigation-budget.test.mjs project.json && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (final-review patch), from .project/review/PATCH-FINDINGS.md P001 (source .project/review/final-gap-1.md) with the orchestrator's measurements of the failing leg.
