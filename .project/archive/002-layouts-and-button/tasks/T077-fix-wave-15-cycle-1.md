---
id: T077
title: Fix wave 15 cycle 1 review findings in T071
wave: 16
deps: [T071]
status: done
agent: build_t077
base: be4fd37b9d6f6c162e162568f3aa20ad4e1988d3
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
- 2026-10-16 — build_t077 red: added test `scans only regular files` (every scanned path must be a regular file) and ran `node --test tools/playwright/navigation-budget.test.mjs` against the old glob in the primary checkout, which holds three git-ignored `__screenshots__/<name>.spec.ts/` folders: tests 5, pass 3, fail 2. The new test listed exactly `packages/ngx-yeti-testing/src/lib/__screenshots__/item-links.browser.spec.ts`, `packages/ngx-yeti/src/lib/__screenshots__/ua-probe.spec.ts`, `packages/ngx-yeti/lift/src/__screenshots__/lift.spec.ts`; the repo scan failed with `EISDIR: illegal operation on a directory, read`. The three folders were left in place.
- 2026-10-16 — build_t077 implementation: tools/playwright/navigation-budget.test.mjs now builds `files` from `execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages'])`, keeps the four extensions by regex, and drops `globSync`, `buildOutput`, the `basename` import and `exclude`. It also filters with `existsSync`, so a tracked file deleted from the working tree without `git rm` (`-c` still lists it) does not make the scan throw ENOENT; directories still exist and are caught by the new test. Green after the fix: tests 5, pass 5, fail 0, in the same checkout with the three folders present. apps/yeti-app-e2e/src/fixture-app.spec.ts and project.json needed no change (project.json already runs the test file).
- 2026-10-16 — build_t077 Verify (exactly as written, through heavy-lock with HEAVY_DOCKER=1): exit 0. npm ci added 1942 packages; @ngx-yeti/source:test --skip-nx-cache passed (last node --test batch tests 77, pass 77, fail 0); typecheck @ngx-yeti/source --skip-nx-cache passed (tests 1, pass 1, fail 0); run-many lint typecheck -p yeti-app-e2e passed; prettier on the three files clean; run-job ci e2e engine=firefox configuration=development passed 1 + 186 + 616 Playwright tests across 3 e2e projects; nx daemon stopped.
- 2026-10-16 — build_t077 rule 13: `npx prettier --check .` clean; `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through heavy-lock) exit 0, 25 tasks over 9 affected projects plus 2 dependencies (9 from cache). Git index untouched; changed paths: tools/playwright/navigation-budget.test.mjs and this Log.
- 2026-10-16 — orchestrator Verify (sidecar gsd-path-verify/task-t077-verify): pass, exit 0; output tail:
  ```
  [ci-e2e-firefox-development] npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  [ci-e2e-firefox-development] npm warn deprecated @yuku-parser/binding-linux-arm64-gnu@0.10.2: yuku-parser runs on yuku-core since 0.14
  [ci-e2e-firefox-development] npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  [ci-e2e-firefox-development] npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  [ci-e2e-firefox-development] npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  [ci-e2e-firefox-development] npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  [ci-e2e-firefox-development] npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  [ci-e2e-firefox-development] npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  [ci-e2e-firefox-development] npm warn install-scripts 9 packages have install scripts not yet covered by allowScripts:
  [ci-e2e-firefox-development] npm warn install-scripts   esbuild@0.27.7 (postinstall: node install.js)
  [ci-e2e-firefox-development] npm warn install-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  [ci-e2e-firefox-development] npm warn install-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  [ci-e2e-firefox-development] npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
  [ci-e2e-firefox-development] npm warn install-scripts   ffmpeg-static@5.3.0 (install: node install.js)
  [ci-e2e-firefox-development] npm warn install-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  [ci-e2e-firefox-development] npm warn install-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  [ci-e2e-firefox-development] npm warn install-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  [ci-e2e-firefox-development] npm warn install-scripts   esbuild@0.25.12 (postinstall: node install.js)
  [ci-e2e-firefox-development] npm warn install-scripts
  [ci-e2e-firefox-development] npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
  ```
