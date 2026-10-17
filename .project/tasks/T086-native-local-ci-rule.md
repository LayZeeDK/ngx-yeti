---
id: T086
title: Make the local-CI rule in AGENTS.md, references/ci-local.md, and the testing skill say that container jobs pass in CI and need no local run, while the native jobs and the real NVDA lane pass locally
wave: 18
deps: [T064, T070, T048]
status: done
agent: build_t086
base: 8c17b7b9ba02e410c3ff454c8885ba9f9bd27615
worktree: null
task_branch: null
files:
  - AGENTS.md
  - references/ci-local.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
---

# T086 — Make the local-CI rule in AGENTS.md, references/ci-local.md, and the testing skill say that container jobs pass in CI and need no local run, while the native jobs and the real NVDA lane pass locally

## Context

INTENT SC8 was corrected on 2026-10-17 (Lars, verbatim: "We don't have to replay everything that runs in CI, in Docker containers. As long as we run CI checks that are possible natively and locally, I'm happy. Other checks may be deferred to CI." and "Correct SC8 now: native local checks only, real NVDA lane"). Read SC8, SC9, and `## Corrections` in .project/intent/INTENT.md. Every job of `.github/workflows/ci.yml` and `floor.yml` passes in CI. Locally, the checks that run natively pass: `npm run check`, the `static` and `package` jobs, the floor jobs `chromium-141` and `firefox-145`, the e2e projects `ngx-yeti-e2e` and `yeti-app-e2e` run natively, and the `nvda` lane as its job runs it (`npm exec nx -- run screen-reader-e2e:nvda` with no `BROWSERS`: Playwright's Chromium, then Firefox). The container jobs `unit`, `e2e`, `webkit-26-4`, and `firefox-146-e2e` need no local run; `node tools/ci-local/run-job.mjs` stays available to reproduce one. The macOS-only `safari` and `voiceover` jobs pass in CI only. The `BROWSERS=msedge` NVDA lane is faster but not evidence for the job.

Three files still state the old rule, that every job but the macOS ones passes both locally and in CI:

- AGENTS.md, section "Run CI locally", first paragraph: "Every job in ... passes locally and in CI before a push, except `ci.yml` `safari` and `voiceover` ... Run a job that has a `container` with `node tools/ci-local/run-job.mjs <workflow> <job>`, and every other job natively."
- references/ci-local.md, the paragraph under the title: "Every job ... runs locally except ... Every other job passes both locally and in CI before a push."
- .claude/skills/ngx-yeti-testing/SKILL.md, section "Engines", the paragraph that starts "A local Chromium run is not the whole gate.": "every job of `ci.yml` and `floor.yml` passes locally as well as in CI: each container job through `node tools/ci-local/run-job.mjs` ...", ending with a dated quote of the 2026-10-10 ruling that the correction narrowed.

README.md only says where to read how to run a CI job locally and states no rule, so it is not in scope.

## Approach

- Rewrite only those three passages. Keep everything else in the three files, including AGENTS.md's NVDA sentence, the `npm install --no-save playwright@<release>` note and the pointer to references/ci-local.md, ci-local.md's run-job.mjs reference, native-jobs table, NVDA lane section, pitfalls and measured runs, and the rest of the testing skill.
- Each rewritten passage says, in the reader's words: every job of `ci.yml` and `floor.yml` passes in CI; locally, the checks that run natively pass (name them: `npm run check`, `static`, `package`, `firefox-145`, `chromium-141`, the e2e projects run natively, and the `nvda` lane without `BROWSERS`); the container jobs (`unit`, `e2e`, `webkit-26-4`, `firefox-146-e2e`) need no local run, and `node tools/ci-local/run-job.mjs <workflow> <job>` reproduces one on demand; `safari` and `voiceover` need macOS and pass in CI only; `BROWSERS=msedge` is a faster NVDA lane that is not evidence for the job. Each of the three passages contains the exact words `need no local run`.
- Plain English, no planning ids, task ids, dates, or measurements in the new text. Drop the testing skill's dated 2026-10-10 quote together with the rule it states; do not replace it with the 2026-10-17 quote.
- No passage may still say that a job passes locally and in CI, locally as well as in CI, or both locally and in CI.
- references/ci-local.md's heading "Container jobs: run them from the workflow" and its body describe how to reproduce a container job; they may stay as they are, or gain one sentence that a local run is optional.

## Interface contract

- None

## Intent coverage

- SC8

## Acceptance criteria

1. SC8: AGENTS.md "Run CI locally", the opening paragraph of references/ci-local.md, and the local-gate paragraph of .claude/skills/ngx-yeti-testing/SKILL.md's "Engines" section each say that every job passes in CI, that locally the native checks pass (`npm run check`, `static`, `package`, `firefox-145`, `chromium-141`, the e2e projects run natively, and the `nvda` lane without `BROWSERS`), that the container jobs `unit`, `e2e`, `webkit-26-4`, and `firefox-146-e2e` need no local run and `tools/ci-local/run-job.mjs` reproduces one on demand, and that `safari` and `voiceover` pass in CI only; AGENTS.md and references/ci-local.md also say that the `BROWSERS=msedge` NVDA lane is not evidence for the job. Each of the three files contains `need no local run`, and none says that a job passes "locally and in CI", "locally as well as in CI", or "both locally and in CI".
2. Nothing else in the three files changes, and the new text carries no planning id, task id, date, or measurement.
3. `npx prettier --check` passes on the three files, and `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
set -o pipefail && npm ci && ! rg -q -i 'pass(es)? (both )?locally (and|as well as) in CI' AGENTS.md references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'need no local run' AGENTS.md && rg -q -F 'need no local run' references/ci-local.md && rg -q -F 'need no local run' .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'tools/ci-local/run-job.mjs' AGENTS.md && rg -q -F 'tools/ci-local/run-job.mjs' .claude/skills/ngx-yeti-testing/SKILL.md && rg -q -F 'not evidence for the job' AGENTS.md && rg -q -F 'not evidence for the job' references/ci-local.md && rg -q -F 'webkit-26-4' AGENTS.md && rg -q -F 'firefox-146-e2e' AGENTS.md && npx prettier --check AGENTS.md references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-17 — created by planner (build repair after the SC8 intent correction)
- 2026-10-17 — build_T086: Verify run as written on the unchanged files (base 8c17b7b): exit 1 (the `pass(es)? locally and in CI` guard and the `need no local run` checks fail), as expected.
- 2026-10-17 — build_T086: rewrote only the three named passages: AGENTS.md "Run CI locally" first paragraph (its NVDA and `BROWSERS=msedge` sentences kept), the paragraph under the title of references/ci-local.md, and the "A local Chromium run is not the whole gate." paragraph of .claude/skills/ngx-yeti-testing/SKILL.md (the dated 2026-10-10 quote dropped, no new quote). Each now says: every job passes in CI; locally the native checks pass (`npm run check`, `static`, `package`, `firefox-145`, `chromium-141`, `ngx-yeti-e2e` and `yeti-app-e2e` run natively, the `nvda` lane without `BROWSERS`); the container jobs `unit`, `e2e`, `webkit-26-4`, `firefox-146-e2e` need no local run and run-job.mjs reproduces one on demand; `safari` and `voiceover` pass in CI only; the `BROWSERS=msedge` lane is not evidence for the job. ci-local.md's "Container jobs" section left as it is. One line changed per file (`git diff --stat`: 3 files, 3 insertions, 3 deletions).
- 2026-10-17 — build_T086: Verify run exactly as written after the change: exit 0 (npm ci ok, all 11 rg checks pass, prettier clean on the 3 files, daemon stopped). `npx prettier --check .`: all files clean. `nx affected -t lint typecheck test test-storybook --base=HEAD` (through the heavy lock): affected project @ngx-yeti/source only; typecheck and test 2/2 succeeded (cache hits). Git index untouched.
- 2026-10-17 — orchestrator Verify (sidecar gsd-path-verify/task-t086-verify): pass, exit 0; output tail:
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
