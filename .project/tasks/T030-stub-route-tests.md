---
id: T030
title: Make the stub-route tests fail for a missing or broken route instead of skipping
wave: 2
deps: [T002]
status: done
agent: build_T030
base: c81f317c579d5d3f5b9af71c14bd3b1e9eb5e05f
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
- 2026-10-11 — coder (build_T030). Negative control before the fix (measured): with `'no-such-fixture'` temporarily added to `stubRoutes` on the base file, `nx e2e yeti-app-e2e -- fixture-app.spec.ts --grep="no-such-fixture|breakout stub"` (Chromium, development) gave 4 skipped (both stub tests, both route kinds, for the unregistered key) and 4 passed (breakout); the temporary key was then removed.
- Implementation, only in `apps/yeti-app-e2e/src/fixture-app.spec.ts`: one helper `expectFixtureRoute(page, response, key)` asserts the document status is 200 (message "the route document has status 200") and that `main > router-outlet + *` has count 1 (message "the route renders its routed component"); when `[data-fixture-stub]` is present it then asserts the level-2 heading has text `key` (message "the stub's h2 shows its key") and returns true, else false. The JavaScript-on stub test calls it right after `page.goto`, before `waitForHydration`, then skips on false with the same reason text; the JavaScript-off test calls it before its skip. `support/hydration.ts` unchanged; no entry names any item's content, so replaced routes pass the check and skip.
- Negative control, automated: `test.describe('the stub route check', { tag: '@stub-route-control' })`, JavaScript on and off, 10 tests: unregistered key `no-such-fixture` on `/sub/` and `/sub/server/` (rejects with the status message); `breakout` document fulfilled with status 500 via `page.route` (status message); a status-200 hand-written document whose `main` holds only `h1` and `router-outlet` (routed-component message); `breakout` answered with the `button` stub's document (h2 message). Each asserts the rejection's message. Measured: the server answers 404 for `no-such-fixture` on both route kinds, JavaScript on and off (Express falls through when AngularNodeAppEngine.handle returns null). Finding: with JavaScript on, the wrong-key control first resolved instead of rejecting, because the booted client renders the breakout route over the button stub's server DOM; that control now aborts the main bundle, since the stub test runs the check on the server document before hydration (the dev-mode clean-hydration assertion covers the mismatch after it).
- Verify, run exactly as written: exit 0. `npm ci`, `npx playwright install chromium`, lint and typecheck of yeti-app-e2e passed; `--grep=@stub-route-control`: 10 passed; development (Chromium): 104 passed, 28 skipped; production (Chromium): 104 passed, 28 skipped; ci-local `ci e2e` Firefox development: 104 passed, 28 skipped; ci-local WebKit development: 104 passed, 28 skipped; daemon stopped. The 28 skips are the 7 replaced keys (box, box-markers, center, center-anti-pattern, setup-order, stack, static-attributes) x 2 tests x 2 route kinds; the other 21 stub keys run in full.
- AC5 at the working tree: `npx prettier --check .` passed; `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` passed (6 projects). No server left on 4310-4312.
- 2026-10-11 — orchestrator Verify (sidecar gsd-path-verify/task-t030-verify): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn install-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn install-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn install-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn install-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn install-scripts   ffmpeg-static@5.3.0 (install: node install.js)
  npm warn install-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn install-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn install-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn install-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn install-scripts
  npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
