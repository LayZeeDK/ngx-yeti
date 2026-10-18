---
id: T033
title: Fix wave 2 cycle 1 review findings in T030
wave: 6
deps: [T030]
status: done
agent: build_T033
base: 7dc237d9053268726cd9c37d88a75605e5abfcea
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
- 2026-10-11 — coder: the wrong-key control ("rejects a stub route that shows another key's h2") now fulfils `**/sub/breakout` with a synthetic status-200 document whose `main` holds `router-outlet` followed by `<section data-fixture-stub><h2>button</h2></section>`, as the empty-document control does; it no longer fetches the live `button` route or aborts the main bundle (the synthetic document has no script). It still asserts `stubHeadingMessage`. Only apps/yeti-app-e2e/src/fixture-app.spec.ts changed; the `mainBundle` import stays (still used at line 111). Prettier check passes on the file.
- 2026-10-11 — Verify (run under the orchestrator's heavy-lock, second attempt; the first attempt failed in `npm ci` with EPERM rmdir and an esbuild install 0xC0000142 after an aborted earlier `npm ci` in this worktree, before any check ran): exit 0. lint + typecheck yeti-app-e2e passed. `@stub-route-control`: 10 passed. fixture-app.spec.ts development (Chromium): 104 passed, 28 skipped. Production (Chromium): 104 passed, 28 skipped. ci-local Firefox development: 104 passed, 28 skipped. ci-local WebKit development: 104 passed, 28 skipped.
- 2026-10-11 — orchestrator Verify (isolate gsd-path-task/T033): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
- 2026-10-11 — orchestrator: attempt 1 rejected without a product fault. The Verify-only repair checkpoint d25ff7b changed the task body after dispatch, so `finish` refused the isolate (recover: "retained task body does not extend the current task"; after syncing the line: "task file body is not append-only"). Rejected diff: apps/yeti-app-e2e/src/fixture-app.spec.ts plus this task file's Log; product patch sha256 827214c3f7f2179e5f36b4150e14db58580fd41862361f2fd45b850edd216085, kept for the retry. Retry from d25ff7b.
- 2026-10-11 — coder attempt 2: applied the attempt-1 patch (sha256 827214c3…, `git apply` only) at base 7dc237d; re-reviewed against t030_ac3: the wrong-key control serves a synthetic stub document and keeps `stubHeadingMessage`. Verify as written (current two-tail form), under heavy-lock: exit 0. lint + typecheck yeti-app-e2e passed. `@stub-route-control`: 10 passed. fixture-app.spec.ts development (Chromium): 104 passed, 28 skipped. Production (Chromium): 104 passed, 28 skipped. ci-local Firefox development: 104 passed, 28 skipped. ci-local WebKit development: 104 passed, 28 skipped. The three Chromium runs show the same durations as attempt 1 (27.8s, 38.9s, 29.3s), so Nx probably replayed them from cache for the same inputs (inferred, not checked).
- 2026-10-11 — orchestrator Verify (sidecar gsd-path-verify/task-t033-verify): pass, exit 0; output tail:
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
