---
id: T085
title: Fix wave 17 cycle 1 review findings in T079
wave: 18
deps: [T079]
status: done
agent: build_t085
base: 568663d7e69d67708a4d1ccb3cc613d532d045b1
worktree: null
task_branch: null
files:
  - nx.json
  - packages/ngx-yeti-testing/project.json
  - packages/ngx-yeti/project.json
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T085 — Fix wave 17 cycle 1 review findings in T079

## Context

Repair task created from the wave 17 cycle 1 review of T079.
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

1. tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.

## Verify

```bash
set -e
(
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/nx/browser-floor-inputs.test.mjs' project.json && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
)
```

Heavy: yes

## Review findings

### t079_ac3
Criterion: tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.
- tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json. — found: the assertion, the red run and the inclusion in the target all hold. The red run is in the Log: 17 tests, 10 failed, each target named; `git diff d63e7e0 23b3101` on the four config files is empty, so the base nx.json is d63e7e0's. project.json `test.command` names the file, and `inputs` list the file, `{workspaceRoot}/nx.json`, `{workspaceRoot}/{apps,packages}/*/project.json` and `tools/yeti/nx-plugin.mjs`. But the cache key the test runs under misses files whose change flips its result, so a cached pass of this standing guard replays after the change it exists to catch. This is an Nx inputs gap, which T079's own Context ruling ("Nx cache/inputs/outputs issues are important") rates as major. Measured at e6a870e: T081 and T082 do not touch project.json or nx.json (`git log 69323b6..e6a870e` on both is empty). In that state, `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists 389 files without `.browserslistrc`, `package.json`, `packages/ngx-yeti/package.json`, `apps/yeti-analog/package.json` or `vendor/yeti/COMMIT`. It does list `nx.json`, `.nxignore` and `.gitignore`, so the thermos claim about those two ignore files does not hold. Nx lists only files that exist. If `.browserslistrc` is deleted, or the floor moves into package.json's `browserslist` key, the 10 reader assertions fail, and so does the e2e shard assertion: `browserFloor` matches nothing. The root target's hash does not change, so `nx run @ngx-yeti/source:test`, `npm run check` and `nx affected` replay the earlier pass (that replay is inferred from Nx's hash rules, not run). The package.json files feed the project graph through their `nx` key and the workspaces list. `vendor/yeti/COMMIT` creates the yeti-css project (tools/yeti/nx-plugin.mjs:11), whose `yeti-css:yeti-build` the test asserts. The thermos bug and quality reviews (tmp/afk-m002/wave17-thermos-bugs.md H1, wave17-thermos-quality.md) raise the same gap. fix: in root project.json `targets.test.inputs`, add `"browserFloor"`, `"{workspaceRoot}/package.json"`, `"{workspaceRoot}/{apps,packages}/*/package.json"` and `"{workspaceRoot}/vendor/yeti/COMMIT"`. Run `npm exec nx -- show target inputs @ngx-yeti/source:test --json` and confirm all of them are in `files`. Then add one case to tools/nx/browser-floor-inputs.test.mjs that asserts `@ngx-yeti/source:test` lists `.browserslistrc` and package.json, so the guard covers its own inputs. Show that case failing on the current project.json first. Every path is in T079's `files`.

## Log

- 2026-10-17 — created by dispatch_driver.py fix-tasks from wave 17 cycle 1
- 2026-10-17 — orchestrator: plan-defect repair of Verify under Lars's ruling of 2026-10-17, verbatim: "We don't have to replay everything that runs in CI, in Docker containers. As long as we run CI checks that are possible natively and locally, I'm happy. Other checks may be deferred to CI." The `run-job ci unit` leg was removed from Verify; the PLAN.md project Verify still runs `ci unit`, and CI runs it on the pull request. The fix is also to add the four inputs the review names and a guard case asserting `@ngx-yeti/source:test` lists .browserslistrc and package.json, shown failing first.
- 2026-10-17 — build_T085: added one guard case group to tools/nx/browser-floor-inputs.test.mjs asserting `@ngx-yeti/source:test` hashes .browserslistrc, package.json, packages/ngx-yeti/package.json, apps/yeti-analog/package.json and vendor/yeti/COMMIT. Red run on the base project.json (568663d): `node --test tools/nx/browser-floor-inputs.test.mjs` 25 tests, 20 pass, 5 fail, each failing case naming `@ngx-yeti/source:test misses <file>` for the five files above. Fix: root project.json `targets.test.inputs` gains `"browserFloor"`, `"{workspaceRoot}/package.json"`, `"{workspaceRoot}/{apps,packages}/*/package.json"` and `"{workspaceRoot}/vendor/yeti/COMMIT"`. `npm exec nx -- show target inputs @ngx-yeti/source:test --json`: `files` 389 -> 394, all five present (packages/ngx-yeti-testing has no package.json, so the glob matches two). Green run: 25 tests, 25 pass, 0 fail. nx.json, packages/ngx-yeti/project.json and packages/ngx-yeti-testing/project.json unchanged.
- 2026-10-17 — build_T085: Verify ran exactly as written through heavy-lock: exit 0. npm ci ok; playwright chromium ok; rg ok; guard 25/25 pass; `nx run @ngx-yeti/source:test --skip-nx-cache` 112 tests, 112 pass, 0 fail; `nx typecheck @ngx-yeti/source --skip-nx-cache` ok (scripts-coverage 1/1 pass); prettier on the five files clean; daemon stopped. `npx prettier --check .` clean. `nx affected -t lint typecheck test test-storybook --base=HEAD`: affected project @ngx-yeti/source only, typecheck and test succeeded (2 tasks).
- 2026-10-17 — orchestrator Verify (sidecar gsd-path-verify/task-t085-verify): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
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
  ```
