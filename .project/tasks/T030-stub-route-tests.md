---
id: T030
title: Make the stub-route tests fail for a missing or broken route instead of skipping
wave: 2
deps: [T002]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
---

# T030 — Make the stub-route tests fail for a missing or broken route instead of skipping

## Context

Build repair. User ruling, verbatim (2026-10-11): "Wave-1 defects: Approve recommendation." The recommendation it approves: "A patch wave through plan: one or two fix tasks appended to M002, each with its own Verify and review. This costs a plan re-gate with your approval. It fixes `doctor` before wave-3 coders rely on it to walk their routes, and the stub tests before 28 routes depend on them." This task fixes the confirmed defect in the stub-route tests T002 landed (c289e6c). It breaks no acceptance criterion of T002, so T002's contract stays as it is. The evidence, verbatim from the hand-off:

D3. The stub-route tests cannot fail for a missing or broken route

- Where: `apps/yeti-app-e2e/src/fixture-app.spec.ts:205-208` and `:228-231` (with `stubRoutes` at `:45`), and `apps/yeti-app-e2e/src/support/hydration.ts:26-38`.
- Observed: both tests `test.skip` when `[data-fixture-stub]` has count 0. That is also the state of a 404, a 500, an empty app root, or a key dropped from `fixtures.ts`; `waitForHydration` only waits for zero `[jsaction]` elements, which holds on an error page, and the JavaScript-off test does a bare `goto` with no status check.
- Fix direction: before the skip, assert the response is 200 and the route's `h2` shows the key; a replaced stub still skips. Item tasks must still never need to edit `fixture-app.spec.ts`. Note T007 landed after wave 1 (bc65532) and replaced the stack and center stubs; read its fixtures before fixing the heading contract.
- Landed by: T002 (c289e6c).

The heading rule, settled here from the landed fixtures: a stub's `h2` is its registry key (T002's stubs), but a replaced route's is not. T007's routes show "Trail notes" (`apps/yeti-app/src/app/fixtures/stack-fixture.ts`) and "Trail maps" (`apps/yeti-app/src/app/fixtures/center-fixture.ts`), and T003's shows "Static attributes" (`apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts`). So the `h2` names the key only while the stub is in place, and this task puts no rule on an item task's heading.

## Approach

- One route check, run by both stub tests of every key in `stubRoutes` and both route kinds, before the skip. It must hold for a stub and for a replaced route alike, using only what every Fixture route has, so no item task ever edits `apps/yeti-app-e2e/src/fixture-app.spec.ts`: the document response of `page.goto` has status 200, and the route rendered its routed component. The router renders that component as the element after `router-outlet` inside the `main` of `apps/yeti-app/src/app/app.html`, in the server HTML too, whatever the item task writes in it; a 404, a 500, an empty app root, and a key that has no route all lack it or the status.
- After the check: a route that still holds `[data-fixture-stub]` also asserts that its `h2` shows the key, then runs the assertions it has today (clean hydration in the development build, visible server HTML with JavaScript off, axe). A route without the marker skips as today, with the same reason text.
- Check the status before `waitForHydration` in the JavaScript-on test: that wait passes on an error page. Leave `apps/yeti-app-e2e/src/support/hydration.ts` unchanged; every spec uses `waitForHydration`, and the gap is the stub tests' missing route check.
- Negative control, automated in the same file: tests that call the same route check and expect it to reject. Give them the Playwright tag `@stub-route-control` (the Verify selects them by it). Cover a key that is not in the registry on both route kinds, with JavaScript on and off (record in the Log what the server answers for it); a registered stub route whose document the test answers with status 500 through `page.route`; a status-200 document whose `main` holds no routed component; and a stub route answered with another key's stub, so the `h2` names the wrong key. A control that passes because the page failed to load for another reason proves nothing: assert the rejection's message.
- Keep the rest of the file's behaviour: the replay tests, the style-mutation probe test, the E9 preload tests (T002 owns that held-out check in this file), and the axe fixture tests. T025 edits the style-mutation test of this file in wave 4 and now depends on this task.
- T008 replaces the `box`, `box-markers`, and `center-anti-pattern` stubs in this wave without touching this file; the check must pass whichever of the two tasks lands first.
- Engines: the stub tests run in Chromium, Firefox, and WebKit in CI, and with JavaScript off axe runs on a snapshot in Firefox (`apps/yeti-app-e2e/src/support/fixtures.ts`); run the file in Firefox and WebKit through `node tools/ci-local/run-job.mjs ci e2e` before hand-back (the Verify does).
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app, helpers, engines) and `.claude/skills/type-safety/SKILL.md`. The project lints with `max-warnings` 0, and `playwright/no-skipped-test` allows only a conditional skip.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. For every key of `stubRoutes` and both route kinds, each of the two stub tests asserts, before any skip, that the document response has status 200 and that the route rendered its routed component; a route with `[data-fixture-stub]` then asserts that its `h2` shows the key and runs its existing hydration, visibility, and axe assertions, and a route without the marker skips.
2. Negative control: tests tagged `@stub-route-control` prove that the same check rejects, with JavaScript on and off, for a key that is not in the registry on `/sub/` and `/sub/server/`, for a registered stub route answered with status 500, for a status-200 document with no routed component, and for a stub route that shows another key's `h2`. A missing or failing route therefore makes the stub test fail rather than skip. On the current file no such test exists and both stub tests skip in each of those states.
3. No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs.
4. Every other test of the file passes unchanged in the development and production configurations and in Firefox and WebKit.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/fixture-app.spec.ts && npm exec nx -- run-many -t lint typecheck -p yeti-app-e2e && npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts --grep=@stub-route-control && npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit fixture-app.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair of the wave 1 defect D3; user ruling "Wave-1 defects: Approve recommendation."). The Verify's `--grep=@stub-route-control` step exits 1 while no test carries the tag (measured on the current file with Playwright's `--list`: "No tests found", exit 1). The Verify ends by stopping the Nx daemon and keeps its own exit code, as every pending task's does; run it exactly as written and never set NX_DAEMON.
