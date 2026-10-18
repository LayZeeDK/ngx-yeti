---
id: T087
title: Hash every file the root test target's tests read, including floor.yml and package-lock.json, and guard those inputs
wave: 19
deps: [T085]
status: done
agent: build_t087
base: a47ee24e140e5f77e0c5b441898407079e21b913
worktree: null
task_branch: null
files:
  - project.json
  - tools/nx/browser-floor-inputs.test.mjs
---

# T087 — Hash every file the root test target's tests read, including floor.yml and package-lock.json, and guard those inputs

## Context

The wave 18 cycle 1 review passed and recorded a MAJOR inherited defect under Lars's ruling, verbatim: "Nx cache/inputs/outputs issues are important". The root `@ngx-yeti/source:test` target (project.json `targets.test`) hashes `{workspaceRoot}/.github/workflows/ci.yml` but not `.github/workflows/floor.yml`, which tools/ci-local/run-job.test.mjs:278-283 reads for every job (`['ci', 'floor']`) and asserts on (:297-306, :309-322). Measured at 8a710a8: `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists 394 files and only ci.yml among the workflows. A cached pass therefore replays after a floor.yml change that would fail those assertions. The advisory thermos reviews (tmp/afk-m002/wave18-thermos-bugs.md and wave18-thermos-quality.md, H1 in both) raise the same gap; the quality review's L3 adds that tools/ci-local/run-job.mjs:736-737 parses `package-lock.json`, which the target hashes only through package versions. T085 last changed project.json and tools/nx/browser-floor-inputs.test.mjs: its self-check loop (the `for (const file of [floor, 'package.json', ...])` block that asserts `@ngx-yeti/source:test hashes ${file}`) is the guard to extend. Lars, 2026-10-17, verbatim: "Other checks may be deferred to CI" — this task's Verify has no run-job leg.

## Approach

- First sweep every test file in `targets.test.command` (tools/playwright/engines.test.mjs, browser-projects.test.mjs, vitest-configs.test.mjs, playwright-configs.test.mjs, navigation-budget.test.mjs, tools/playwright-server/container.test.mjs, tools/ci-local/run-job.test.mjs, tools/verification/lars-verify-spec.test.mjs, tools/nx/browser-floor-inputs.test.mjs) and the modules they import for every repository file they read: `readFileSync`/`readFile`, paths built with `join`/`resolve`/`new URL`, globs, `git ls-files` or other listings, spawned scripts, and imports outside the listed inputs. Files created under `tmpdir()` and files from `node_modules` packages (hashed through external dependency versions) are not repository inputs. Record the sweep in the Log: each test file, the repository files it reads, and whether each is already an input. This is meant to be the last such gap.
- In project.json `targets.test.inputs`, add every swept file that is not yet an input; at least `{workspaceRoot}/.github/workflows/floor.yml` (or `{workspaceRoot}/.github/workflows/*.yml`) and `{workspaceRoot}/package-lock.json`. Keep every existing input; change no other target.
- Confirm with `npm exec nx -- show target inputs @ngx-yeti/source:test --json` that each added file is in `files`, and record the file count before and after in the Log.
- Extend the self-check list in tools/nx/browser-floor-inputs.test.mjs so it asserts `.github/workflows/floor.yml`, `package-lock.json`, and every other file the sweep added are in `@ngx-yeti/source:test`'s inputs. Run the extended guard on the current project.json first and record the failing run (the cases that failed) in the Log, then make it pass.
- Follow the repository's script rules (typed `.mjs`, `// @ts-check`) and the type-safety skill; no new files.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. tools/nx/browser-floor-inputs.test.mjs asserts that `@ngx-yeti/source:test` hashes `.github/workflows/floor.yml`, `package-lock.json`, and every other repository file the Log's sweep found the target's tests read and added; the Log records those cases failing on the unchanged project.json first, and the guard passes after the change.
2. project.json `targets.test.inputs` includes `{workspaceRoot}/.github/workflows/floor.yml` (or a `{workspaceRoot}/.github/workflows/*.yml` pattern) and `{workspaceRoot}/package-lock.json`, keeps every earlier input, and `npm exec nx -- show target inputs @ngx-yeti/source:test --json` lists both files; no other target changes.
3. The Log records the sweep of every test file in `targets.test.command`: the repository files each reads and whether each was already an input.
4. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache`, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache`, and `npx prettier --check` on the two files pass.

## Verify

```bash
set -o pipefail && npm ci && node --test tools/nx/browser-floor-inputs.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check project.json tools/nx/browser-floor-inputs.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-17 — created by planner (build repair after the wave 18 cycle 1 review)
- 2026-10-17 — build_T087 (serial round, primary checkout, base a47ee24). Sweep method: static reading of every test file in `targets.test.command`, the local modules they import, and the configs they import or spawn; plus one traced run of the whole target command (a scratchpad `--import` hook passed through NODE_OPTIONS that logged every repo path given to fs read/stat/exists/readdir/open calls and every resolved import, in the test processes, their node children that inherit env, and the `nx show` client with its plugin workers, which computed the project graph in-process). Not traced: native Rust reads (Nx WorkspaceContext glob, file hashing; static: they apply .gitignore and .nxignore, both already inputs) and the playwright-configs children (spawned with a fixed env; static: they import only the config, browser-projects.mjs, engines.mjs and @nx packages). Inputs before: 394 files (`nx show target inputs @ngx-yeti/source:test --json`).
  Sweep (file read -> already an input?):
  - tools/playwright/engines.test.mjs: engines.mjs (yes); tmp/playwright-server through localEnv() (gitignored runtime state the Playwright server script writes; Nx cannot hash ignored files, and the asserted values do not depend on it unless BROWSERS names a remote-* engine, which these tests pass explicitly; not added).
  - tools/playwright/browser-projects.test.mjs: browser-projects.mjs, engines.mjs (yes).
  - tools/playwright/vitest-configs.test.mjs: globs and reads {apps,packages}/**/{vitest*,vite}.config.* (yes, via the config and `{apps,packages}/**/*.{ts,mts,mjs,tsx}` patterns) and imports them, which imports engines.mjs (yes); readdir of apps/ and packages/ trees (listing; new matches are covered by the same globs).
  - tools/playwright/playwright-configs.test.mjs: globs and loads {apps,packages}/**/playwright.config.* (yes), browser-projects.mjs, engines.mjs (yes); @nx/playwright preset reads package.json and tsconfig.base.json (yes).
  - tools/playwright/navigation-budget.test.mjs: every {apps,packages}/**/*.{ts,mts,mjs,tsx} through the Nx walker (yes), .gitignore and .nxignore (yes); the rest are tmpdir() trees.
  - tools/playwright-server/container.test.mjs: container.mjs (yes); playwright-core CLI from node_modules (external).
  - tools/ci-local/run-job.test.mjs: run-job.mjs (yes); .github/workflows/ci.yml (yes); .github/workflows/floor.yml (NO, added); package.json (yes) and package-lock.json (NO, added) through run(), whose setupKey hashes both and whose modulesFolders parses package-lock.json; the git ls-files test uses a tmpdir() repository.
  - tools/verification/lars-verify-spec.test.mjs: lars-verify-spec.mjs (yes); everything else is a tmpdir() checkout and HOME.
  - tools/nx/browser-floor-inputs.test.mjs (`nx show` reads the project graph): nx.json (yes), package.json and {apps,packages}/*/package.json (yes), {apps,packages}/*/project.json (yes), root project.json (NO, added: it defines @ngx-yeti/source:test, whose inputs the guard asserts), tools/yeti/nx-plugin.mjs (yes), vendor/yeti/COMMIT (yes), playwright configs and e2e spec files for the e2e-ci shards (yes), packages/ngx-yeti/.storybook/main.ts (yes), project eslint.config.mjs files (yes), tsconfig.base.json (yes), .browserslistrc (yes); {apps,packages}/*/tsconfig.json, 8 files (NO, added: the graph computation reads each project's tsconfig.json); vendor/yeti/package.json (read by the graph but .nxignore hides it, so Nx cannot hash it; vendor/yeti/COMMIT, rewritten on every pin move, stands for it; not added).
  - Probed but absent, so no file to hash (not added): root and project .env, .env.*, .*.env and nx-cloud.env files (Nx's dotenv loading), angular.json, lerna.json, tsconfig.json, apps/tsconfig.json, vendor/yeti/tsconfig.{app,lib}.json, bun/pnpm/yarn lockfiles and pnpm-workspace.yaml (package-manager detection). The root eslint.config.mjs was not read.
  Change: project.json `targets.test.inputs` gains `{workspaceRoot}/.github/workflows/floor.yml`, `{workspaceRoot}/package-lock.json`, `{workspaceRoot}/project.json`, `{workspaceRoot}/{apps,packages}/*/tsconfig.json`; every earlier input kept, no other target changed. Inputs after: 405 files; the 11 new ones are exactly floor.yml, package-lock.json, project.json and the 8 tsconfig.json files, none dropped. tools/nx/browser-floor-inputs.test.mjs self-check list extends with .github/workflows/ci.yml, .github/workflows/floor.yml, package-lock.json, project.json and the 8 tsconfig.json files.
  Red first (unchanged project.json, extended guard, through heavy-lock): `node --test tools/nx/browser-floor-inputs.test.mjs` -> tests 37, pass 26, fail 11; failing: hashes .github/workflows/floor.yml, package-lock.json, project.json, apps/ngx-yeti-e2e/tsconfig.json, apps/screen-reader-e2e/tsconfig.json, apps/yeti-analog/tsconfig.json, apps/yeti-analog-e2e/tsconfig.json, apps/yeti-app/tsconfig.json, apps/yeti-app-e2e/tsconfig.json, packages/ngx-yeti/tsconfig.json, packages/ngx-yeti-testing/tsconfig.json (ci.yml passed, already an input).
  Verify, exactly as written, through heavy-lock: exit 0. npm ci added 1942 packages; guard tests 37 pass 37 fail 0; `nx run @ngx-yeti/source:test --skip-nx-cache` tests 124 pass 124 fail 0; `nx typecheck @ngx-yeti/source --skip-nx-cache` succeeded (scripts-coverage tests 1 pass 1); prettier on the two files clean; daemon stopped. Also: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` -> only @ngx-yeti/source affected, typecheck and test succeeded, exit 0. Git index untouched.
- 2026-10-17 — orchestrator Verify (sidecar gsd-path-verify/task-t087-verify): pass, exit 0; output tail:
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
