---
id: T053
title: Land the typed scripts and their type check in CI
wave: 9
deps: []
status: done
agent: build_T053
base: 1580f84eba8c4b8018f6e3e80a01bd524d964700
worktree: null
task_branch: null
files:
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - AGENTS.md
  - apps/ngx-yeti-e2e/eslint.config.mjs
  - apps/screen-reader-e2e/eslint.config.mjs
  - apps/yeti-analog/eslint.config.mjs
  - apps/yeti-analog-e2e/eslint.config.mjs
  - apps/yeti-app/eslint.config.mjs
  - apps/yeti-app/tailwind-forms.postcss.cjs
  - apps/yeti-app-e2e/eslint.config.mjs
  - eslint.config.mjs
  - package.json
  - package-lock.json
  - packages/ngx-yeti/eslint.config.mjs
  - packages/ngx-yeti-testing/eslint.config.mjs
  - project.json
  - README.md
  - references/fast-compile.md
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - tools/package/pack-check.mjs
  - tools/playwright/browser-projects.mjs
  - tools/playwright/browser-projects.test.mjs
  - tools/playwright/engines.mjs
  - tools/playwright/engines.test.mjs
  - tools/playwright/playwright-configs.test.mjs
  - tools/playwright/vitest-configs.test.mjs
  - tools/playwright-server/container.mjs
  - tools/playwright-server/container.test.mjs
  - tools/playwright-server/server.mjs
  - tools/typecheck/scripts-coverage.test.mjs
  - tools/yeti/generate-sources.mjs
  - tools/yeti/nx-plugin.mjs
  - tools/yeti/vendor-yeti.mjs
  - tsconfig.scripts.json
---

# T053 — Land the typed scripts and their type check in CI

## Context

Fifth build repair (2026-10-13). Lars ruled, verbatim: "Use subagents to type the .mjs scripts" and "Committed scripts must be type-checked as part of CI". This overrides the orchestrator's earlier deferral of the typing to the next milestone (STATE log of 2026-10-13). The AGENTS.md `# Scripts` section (T051) already requires every script to be "a typed `.mjs` module: `// @ts-check` with JSDoc types, checked by a `tsconfig` that includes it or by an Nx `typecheck` target".

The work is done and reviewed as a patch outside the pipeline, because product files change only through GSD Path tasks. The patch is the git-ignored local file D:/projects/github/LayZeeDK/ngx-yeti/tmp/afk-m002/tools/mjs-typing.patch (39 files, 947 insertions, 157 deletions; byte-identical to mjs-typing.final.patch beside it). It applies cleanly at c5a8a32 (measured by the planner with `git apply --check`, 2026-10-13). Its authors' notes are tmp/afk-m002/mjs-typing-a.md and tmp/afk-m002/mjs-typing-b.md, and its review is tmp/afk-m002/mjs-typing-review.md (all under D:/projects/github/LayZeeDK/ngx-yeti, git-ignored). What the patch holds:

- `// @ts-check` and JSDoc types on all 29 committed `.mjs` and `.cjs` scripts outside `vendor/` and `docs/specs/` (the nine ESLint configs, `tools/`, both control skills' scripts and tests, `apps/yeti-app/tailwind-forms.postcss.cjs`).
- `tsconfig.scripts.json` at the root (extends `tsconfig.base.json`; `allowJs`, `checkJs`, `noEmit`, `nodenext`, `lib: ["es2025"]`, `types: ["node"]`; includes `**/*.{mjs,cjs,js}` and the same under `.claude/`; excludes `**/node_modules`, `**/dist`, `**/tmp`, `vendor`, `docs/specs`, `.claude/worktrees`, `.nx`, `.angular`).
- The root `project.json` gains `"implicitDependencies": ["*"]` (so `nx affected` marks the root project when any project's script changes; review finding M1) and a cached `typecheck` target, `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs`. The coverage test fails when a committed script is outside the tsconfig's files (review finding M2). CI's `static` job runs `nx run-many -t lint typecheck`, so the check runs in CI with no workflow change, and `npm run check` and `npm run affected` run it locally.
- The devDependency `@types/js-yaml` in `package.json` and `package-lock.json`.
- Docs: the Scripts section of `AGENTS.md`, the `typecheck` row of `README.md`, "What typecheck covers" in `references/fast-compile.md`, and the state-file refusal sentences of both control-skill SKILL.md files (review finding M5).
- Runtime edits the authors listed and the review checked: two state-file guards (`isState`) that also require the string fields `up` has always written, `run-job.mjs` stopping on a non-mapping `matrix` or `env` (review finding M3), and the token guard in `tools/playwright-server/container.mjs`.

Review verdict (verbatim): "no blocker, no major. 5 minor, 3 cosmetic. The typing itself is sound: both state-file guards check what their predicates claim, and every listed runtime edit behaves as the authors describe for input the scripts handle today." Measured by the reviewer: `tsc -p tsconfig.scripts.json` exit 0 with TypeScript 6.0.3; a positive control with `--lib es2015` gave 10 errors; the six tool tests of the root `test` target 40 pass, 0 fail; `npx prettier --check` on the changed files passes. Not run by anyone yet: the two control-skill test suites, because they build and launch the apps.

Landing note from the review (finding M4, verbatim in substance): `tools/playwright-server/server.mjs` hashes the forwarder file `container.mjs` into the container's setup label, so "the first `node tools/playwright-server/server.mjs` from a checkout that has this change force-removes `ngx-yeti-playwright-server` and creates it again with a new token. The container name and `127.0.0.1:3000` are shared by every checkout and worktree on the machine, so a `remote-*` browser run that is live in another session loses its browsers." Also, `tools/playwright/*.mjs`, `tools/yeti/nx-plugin.mjs`, and `eslint.config.mjs` are Nx inputs of `lint`, `typecheck`, `e2e`, `test-storybook`, and `yeti-build`, so the first run of each after this lands is a cold run.

## Approach

- Apply the patch with `git apply` from the worktree root, then read the result. If a later landing moved a hunk so the patch no longer applies, apply it with `git apply --3way` or by hand, keeping each hunk's intent, and record every hand-merged hunk in the Log. Change nothing outside the patch's 39 paths; a needed change elsewhere is a `NEEDS-ORCHESTRATOR:` block.
- Keep the review's cosmetic findings as they are (C1 to C3: unchecked JSDoc assertions in a few `JSON.parse` sites, `String()` in `server.mjs`); the review says "Fix direction: none needed for this change".
- Run both control-skill suites (`node --test .claude/skills/control-yeti-app/scripts/control.test.mjs` and `node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs`). They build and launch the Fixture app and Storybook on fixed ports (4000, 4200, 4310 to 4312, 4400, 4401), so the orchestrator runs this task with no other heavy command, coder, or NVDA run. Record each suite's pass and fail counts in the Log. A failure that the patch's typing edits cause is fixed in the script, inside these files; a failure that is present without the patch is a `NEEDS-ORCHESTRATOR:` block with the measurement.
- Start no remote-browser run and do not stop another session's Docker containers. The first `server.mjs` start after landing recreates the shared `ngx-yeti-playwright-server` container (see Context); say so in the landing Log line.
- Never set `NX_DAEMON`; the Verify stops the daemon itself.
- Skills: `type-safety` (the JSDoc forms of its approved patterns), `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/control-ngx-yeti-storybook/SKILL.md`; AGENTS.md "Scripts" and "Commits".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. The 39 paths of the patch carry its changes; no other path changes.
2. `npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache` exits 0, and the coverage test in it fails when a committed `.mjs` file is added outside the tsconfig's files (shown once in the Log, with the probe file removed afterwards).
3. The root `project.json` has `"implicitDependencies": ["*"]` and the `typecheck` target above; `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes.
4. `npm exec nx -- run-many -t lint typecheck` passes for every project.
5. Both control-skill test suites pass, with their counts in the Log.
6. `node tools/ci-local/run-job.mjs ci e2e --dry-run` exits 0, and `npx prettier --check .` passes.

## Verify

```bash
npm ci && npx playwright install chromium && test -f tsconfig.scripts.json && test -f tools/typecheck/scripts-coverage.test.mjs && rg -q -F '"implicitDependencies": ["*"]' project.json && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- run-many -t lint typecheck && node tools/ci-local/run-job.mjs ci e2e --dry-run && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check .; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from the patch tmp/afk-m002/tools/mjs-typing.patch and its review tmp/afk-m002/mjs-typing-review.md.
- 2026-10-14 — coder build_T053: applied tmp/afk-m002/tools/mjs-typing.final.patch at base 1580f84 with plain `git apply` (check and apply clean, no 3-way, no hand-merged hunk; index untouched). T059's `args: ['--disable-stack-profiler']` in tools/playwright/browser-projects.mjs, its test case in browser-projects.test.mjs, and the `args?: string[]` LaunchOptions field in engines.mjs all survive; the patch only adds `// @ts-check` to those files. 39 paths changed, all from the patch (38 tracked + tsconfig.scripts.json and tools/typecheck/scripts-coverage.test.mjs untracked new files).
- 2026-10-14 — coder build_T053: one edit beyond the patch, inside a patch path: tsconfig.scripts.json `exclude` gains `**/out-tsc`, `**/storybook-static`, `**/vitest.config.*.timestamp*`, `coverage` (git-ignored output folders). Measured cause: the first full Verify exited 134 because the control-ngx-yeti-storybook suite builds packages/ngx-yeti/storybook-static/, and the later `nx run @ngx-yeti/source:typecheck` then type-checked its bundled assets (thousands of TS errors, e.g. storybook-static/assets/angular-platform-*.js). With the exclude, the typecheck passes with storybook-static present. The patch's review missed this because nobody had run the control suites before the typecheck.
- 2026-10-14 — coder build_T053: AC2 coverage probe. The guard refuses `GIT_INDEX_FILE` and rule 12 forbids `git add -N`, so the probe put a committed script outside the tsconfig instead of adding a new one: temporarily excluded `tools/yeti/vendor-yeti.mjs` in tsconfig.scripts.json -> `node --test tools/typecheck/scripts-coverage.test.mjs` pass 0, fail 1, `actual: [ 'tools/yeti/vendor-yeti.mjs' ]`; restored the file from a backup -> pass 1, fail 0.
- 2026-10-14 — coder build_T053: control-skill suites through the heavy lock: control-yeti-app 9 tests, 9 pass, 0 fail; control-ngx-yeti-storybook 6 tests, 6 pass, 0 fail. No remote-browser run started; tools/playwright-server/server.mjs not run. Landing note (review M4): the first `node tools/playwright-server/server.mjs` after this lands force-recreates the shared `ngx-yeti-playwright-server` container with a new token, dropping any live `remote-*` run in another checkout; the first lint, typecheck, e2e, test-storybook and yeti-build run after landing are cold.
- 2026-10-14 — coder build_T053: rule 13 check through the heavy lock: `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` exit 0 (9 projects, 25 tasks, incl. ngx-yeti:test-storybook); `npx prettier --check .` passes.
- 2026-10-14 — coder build_T053: Verify run exactly as written through the heavy lock, exit 0: @ngx-yeti/source:typecheck (coverage test 1 pass, 0 fail); @ngx-yeti/source:test 41 tests, 41 pass, 0 fail; run-many lint typecheck succeeded for 9 projects + 1 dependency task; run-job ci e2e --dry-run exit 0; control-yeti-app 9/9 pass; control-ngx-yeti-storybook 6/6 pass; prettier clean; Nx daemon stopped.
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T053): pass, exit 0; output tail:
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
