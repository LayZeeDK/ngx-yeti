---
id: T079
title: Make .browserslistrc a cache input of every Nx target that reads the browser floor, through one named input, with a standing test that lists the readers
wave: 17
deps: [T076]
status: done
agent: build_t079
base: 23b3101b03a2500226db5b6b13c4948ce106cdb0
worktree: null
task_branch: null
files:
  - nx.json
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
  - packages/ngx-yeti/project.json
  - packages/ngx-yeti-testing/project.json
---

# T079 — Make .browserslistrc a cache input of every Nx target that reads the browser floor, through one named input, with a standing test that lists the readers

## Context

Final-review patch, ship attempt 2, finding P002 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-2.md`, locator "Risk: .browserslistrc is not a cache input of the Nx targets that read it (ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti-e2e:e2e and its e2e-ci shards, ngx-yeti:build, yeti-app:build), so a browser-floor change replays results built for the old CSS target"), fixed in M002 under Lars's rulings of 2026-10-16, verbatim: "Approve, resolve in M002" and "Nx cache/inputs/outputs issues are important".

Evidence, verbatim: "Measured. All six cached targets in the risk read the browser floor at run time, directly or through a nested build, and none of them hashes `.browserslistrc`. yeti-app-e2e:e2e has the same gap. If someone raises, lowers or breaks the floor, Nx replays the cached Storybook build and test-storybook pass, the cached ngx-yeti-e2e results (color-scheme-wrappers.spec.ts included, the spec that guards T075's cssTarget fix), the cached ngx-yeti package and the cached yeti-app bundle, all built for the old CSS target. This goes against Lars's ruling of 2026-10-16, "Nx cache/inputs/outputs issues are important", and against AGENTS.md "Run CI locally", which expects every job to pass both locally and in CI. A replayed local run is not proof of the current floor. T075 AC1 still holds, because it runs with `--skip-nx-cache`, but its cached runs are not protected. Inferred, not measured: whether @angular/build:unit-test (ngx-yeti:test) also reads the floor."

Fix direction, verbatim: "In nx.json `namedInputs`, add `"browserFloor": ["{workspaceRoot}/.browserslistrc"]`. Then add `"browserFloor"` to `targetDefaults["@angular/build:application"].inputs`, `targetDefaults["@nx/angular:package"].inputs`, `targetDefaults["build-storybook"].inputs` and `targetDefaults["test-storybook"].inputs`, and to the `e2e` named input. The `e2e` entry covers `e2e` and every `e2e-ci--**/*` shard of ngx-yeti-e2e and yeti-app-e2e. Use a named input rather than `sharedGlobals`: `sharedGlobals` feeds `default`, which every lint, typecheck and unit-test target and every `^default` consumer hashes, so a floor edit would invalidate targets that never read the file. Per-target globs would repeat one path in five places, while one named input keeps a single owner. Check: before the change, a `node --test` file that runs `nx show target inputs <t> --json` for the six cached targets plus yeti-app-e2e:e2e and asserts `.browserslistrc` is in `files` fails. After the change it passes, and a negative control (ngx-yeti:lint does not list the file) still holds. tmp/gap2-inputs.mjs in this sidecar is a working start for that test."

Measured by the gap reviewer at d63e7e0 (final-gap-2.md): `browserslistrc=false` for ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti:static-storybook, ngx-yeti-e2e:e2e, ngx-yeti-e2e:e2e-ci--src/color-scheme-wrappers.spec.ts, ngx-yeti-e2e:e2e-ci, ngx-yeti:build, yeti-app:build, yeti-app-e2e:e2e and screen-reader-e2e nvda and voiceover; the positive control `nx show target inputs ngx-yeti:typecheck --json` lists `tsconfig.base.json`. Not cached, so unable to replay: static-storybook (@nx/web:file-server), nvda and voiceover (`cache=false`). The readers are packages/ngx-yeti/.storybook/main.ts:22 (and :96, `build.cssTarget`), @angular/build's `supported-browsers.js:25` (yeti-app:build) and ng-packagr's stylesheet processor (ngx-yeti:build). The gap reviewer's tmp/gap2-inputs.mjs is not in this checkout.

Planner's note (read at d63e7e0): ngx-yeti:test is `vitest run --config vitest.unit.config.mts` with inline inputs in packages/ngx-yeti/project.json, not @angular/build:unit-test; yeti-app:test is @angular/build:unit-test; ngx-yeti:build-fast (`vite build --config vite.lib.config.mts`) and ngx-yeti-testing:test (vitest) have inline inputs. Whether these read the floor is not measured.

## Approach

- One owner: the `browserFloor` named input in nx.json `namedInputs`, added where the Fix direction names. Not in `sharedGlobals` or `default`, and no per-target copy of the path.
- Settle each target the planner's note leaves open (yeti-app:test, ngx-yeti:test, ngx-yeti:build-fast, ngx-yeti-testing:test, and yeti-analog's cached targets) by evidence: read the executor or tool source in node_modules for a browserslist read, or run the target with a broken floor and see whether it fails. A target that reads the floor gets `browserFloor` (its target default or its project.json `inputs`); one that does not becomes a negative control. Record each verdict and its evidence in the Log.
- tools/nx/browser-floor-inputs.test.mjs (new, typed `.mjs` per AGENTS.md "Scripts") runs `nx show target inputs <project>:<target> --json` for every reader (one `e2e-ci--*` shard per e2e project that has them, picked from `nx show project`) and asserts `.browserslistrc` is in `files`; it asserts the file is absent for ngx-yeti:lint, ngx-yeti:typecheck and every target measured not to read it. Each assertion names the target it failed on.
- Add the test to the root project.json `test` command. Add the test file, `{workspaceRoot}/nx.json` and the project.json files that carry inline `inputs` to that target's `inputs`, so an inputs edit reruns it.
- The test runs inside the run-job `unit` leg as part of the root `test` target: it must work in a tree without `.git`, with `CI` set and no Nx daemon.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.
- Read `references/fast-compile.md` before touching a target that compiles with `fastCompile`, and the nx-workspace skill for `nx show`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. nx.json `namedInputs` has `"browserFloor": ["{workspaceRoot}/.browserslistrc"]`, and `.browserslistrc` reaches targets only through it: `rg -F '.browserslistrc' nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json` matches that one line.
2. `nx show target inputs <target> --json` lists `.browserslistrc` for ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti-e2e:e2e and an `e2e-ci--*` shard of it, ngx-yeti:build, yeti-app:build, yeti-app-e2e:e2e and an `e2e-ci--*` shard of it, and every other target the Log records as a reader; it does not list it for ngx-yeti:lint, ngx-yeti:typecheck or any target the Log records as not reading the floor.
3. tools/nx/browser-floor-inputs.test.mjs asserts criterion 2, is shown failing at d63e7e0's nx.json first (the Log records the run and the targets it named), passes after the change, and runs in the root `test` target, whose `inputs` include the test file and nx.json.
4. The test passes inside a run-job `unit` container, whose tree has no `.git`.
5. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` and `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` pass, and `npx prettier --check` passes on the task's files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F 'tools/nx/browser-floor-inputs.test.mjs' project.json && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check nx.json project.json packages/ngx-yeti/project.json packages/ngx-yeti-testing/project.json tools/nx/browser-floor-inputs.test.mjs && node tools/ci-local/run-job.mjs ci unit -- node --test tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
- 2026-10-17 — build_t079: reader verdicts. Method: read the tool source in node_modules for browserslist calls, then ran each target with `BROWSERSLIST='chrome notaversion' nx run <t> --skip-nx-cache --excludeTaskDependencies`. browserslist reads that variable in place of the config file, so an invalid query makes every reader fail.
  - Readers. yeti-app:test (@angular/build:unit-test): measured. It fails with `BrowserslistError: Unknown browser query` from getSupportedBrowsers (supported-browsers.js:25), because unit-test runs buildApplicationInternal, then execute-build.js:71. ngx-yeti:build (ng-packagr): measured, fails with the same error. ngx-yeti:test: inferred reader through its build dependency. Its node specs (published-output.node.spec.ts, name-collision.node.spec.ts) read the CSS and JS in dist/packages/ngx-yeti, which ngx-yeti:build emits for the current floor. The gap reviewer's targets (build-storybook, test-storybook, yeti-app:build, both e2e projects and their shards) stay readers as final-gap-2.md measured them.
  - Not readers. ngx-yeti-testing:test, ngx-yeti:build-fast, yeti-analog:test and yeti-analog:build: measured, each passes with the invalid query (ngx-yeti-testing:test ran 7 files and 94 tests, all passed). The source agrees: `rg -i browserslist` finds no match in @analogjs, vite/dist, vitest/dist, rolldown/dist or nitropack/dist. Analog compiles through @angular/build/private JavaScriptTransformer, which passes `browserslistConfigFile: false` (javascript-transformer-worker.js:169), and no postcss.config file exists in the workspace. yeti-css:yeti-build is not a reader: vendor/yeti/bin/lib/minify-css.js sets fixed BASELINE_2025 targets. ngx-yeti:lint and ngx-yeti:typecheck do not read the floor.
  - Not cached, so not covered: ngx-yeti:static-storybook, ngx-yeti:pack-check, screen-reader-e2e nvda and voiceover, and the continuous serve, storybook and serve-ssr targets.
  - Over-approximation, accepted under the Fix direction: yeti-analog-e2e:e2e and its shards now hash the floor too, through the shared `e2e` named input. Their web server is yeti-analog:serve (Vite), which does not read the floor. The test makes no assertion either way for this project.
- 2026-10-17 — build_t079: implementation. Added `browserFloor` to nx.json namedInputs. Referenced it from targetDefaults @angular/build:application, @angular/build:unit-test, @nx/angular:package, build-storybook and test-storybook, from the `e2e` named input (which covers e2e and every e2e-ci--* shard), and from the inline inputs of ngx-yeti:test in packages/ngx-yeti/project.json. packages/ngx-yeti-testing/project.json is unchanged because that target is not a reader. New tools/nx/browser-floor-inputs.test.mjs runs `nx show target inputs <t> --json` through node and nx/bin/nx, with no npm and no git. It checks 8 readers plus one e2e-ci--* shard each of ngx-yeti-e2e and yeti-app-e2e (shards picked from `nx show project`), and 7 non-readers. Root project.json `test` runs the new file. Its inputs add the test file, `{workspaceRoot}/nx.json`, `{workspaceRoot}/{apps,packages}/*/project.json` and externalDependencies nx. AC1: `rg -F '.browserslistrc'` over the four config files matches only the nx.json namedInputs line.
- 2026-10-17 — build_t079: red first. At base nx.json, which is unchanged from d63e7e0 (`git diff d63e7e0 HEAD` on the config files is empty), the test ran 17 tests: 10 failed, 7 passed. Failing: ngx-yeti:build, ngx-yeti:build-storybook, ngx-yeti:test-storybook, ngx-yeti:test, yeti-app:build, yeti-app:test, ngx-yeti-e2e:e2e, yeti-app-e2e:e2e, ngx-yeti-e2e:e2e-ci--src/breakout.spec.ts and yeti-app-e2e:e2e-ci--src/box.spec.ts, each "misses .browserslistrc". Passing: the 7 non-reader tests. After the change: 17 passed, 0 failed.
- 2026-10-17 — build_t079: Verify ran exactly as written through the heavy lock with HEAVY_DOCKER=1 and exited 0. npm ci passed. The node --test file passed 17 of 17. @ngx-yeti/source:test passed 94 of 94 with --skip-nx-cache. typecheck @ngx-yeti/source passed (scripts-coverage 1 of 1). prettier --check on the task files was clean. run-job ci unit ran the test with no .git and CI set: 17 of 17 passed, "pass ci-unit 1 m 21 s". The daemon was stopped. Rule 13: `npx prettier --check .` was clean. `nx affected -t lint typecheck test test-storybook --base=HEAD` ran 24 tasks. 23 passed, and ngx-yeti:test-storybook failed 4 files with Vite "Failed to fetch dynamically imported module" (card, grid, overlay, table stories) while running in parallel with the other tasks. Rerun alone through the lock, ngx-yeti:test-storybook passed: 25 of 25 files, 170 of 170 tests.
- 2026-10-17 — build_t079: code-review fixes.
  - Finding 1: removed `{ "externalDependencies": ["nx"] }` from the root `test` inputs. `nx show target inputs @ngx-yeti/source:test --json` now gives `external: ["AllExternalDependencies"]` again.
  - Finding 2: added `{workspaceRoot}/tools/yeti/nx-plugin.mjs` to the root `test` inputs. `nx show target inputs` lists it.
  - Finding 3, measured: the e2e-ci--merge-reports targets (executor @nx/playwright:merge-reports, cache true) have plugin inputs only (default, ^production, ^{projectRoot}/tsconfig*.json, @playwright/test). They have no dependsOn, so `dependentTasksOutputFiles` cannot reach the shards' outputs, and `.browserslistrc` is not an input. First try: a targetDefaults `e2e-ci--merge-reports` entry with the shards' inputs `["e2e", "^default"]`. That gave the merge task the same files (614) and env (9) as a shard, but 1691 externals against 1692: npm:@storybook/addon-a11y was missing. The cause, read in the Nx clone at 23.0.2 (packages/nx/src/native/tasks/hash_planner.rs:259-295): for an `@nx/*` executor, Nx hashes the executor package's tree and ignores the target's `externalDependencies` inputs. So inputs alone cannot make the merge task rerun with every shard. Adding dependsOn on the shards would change what the inferred target runs. Fix: targetDefaults `"e2e-ci--merge-reports": { "cache": false }`. The task always reruns, and it only merges reports that already exist. It also runs nowhere today: ci.yml and the tools never call it, and no playwright config sets a blob reporter.
  - The test now also asserts `cache === false` for e2e-ci--merge-reports of ngx-yeti-e2e, yeti-app-e2e and yeti-analog-e2e. Red first, with the entry renamed out of the way: 20 tests, 3 failed ("replays a report from the cache"), 17 passed. After the fix: 20 of 20 passed.
  - Finding 4 (cosmetic, optional): not done. Readers stay a hand-kept list.
- 2026-10-17 — build_t079: Verify re-ran exactly as written through the heavy lock with HEAVY_DOCKER=1 (12277 MB free) and exited 0. npm ci passed. The node --test file passed 20 of 20. @ngx-yeti/source:test passed 97 of 97 with --skip-nx-cache. typecheck @ngx-yeti/source passed (scripts-coverage 1 of 1). prettier --check on the task files was clean. run-job ci unit passed 20 of 20 ("pass ci-unit 0 m 33 s"). The daemon was stopped. `npx prettier --check .` was clean. The Git index is untouched.
- 2026-10-16 — orchestrator Verify (isolate gsd-path-task/T079): pass, exit 0; output tail:
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
