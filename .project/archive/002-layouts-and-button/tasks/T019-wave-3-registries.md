---
id: T019
title: Add the wave-3 items to the consumer build, name-collision list, README, and changelog
wave: 3
deps: [T009, T010, T011, T012, T013, T014, T015, T016, T017, T018]
status: done
agent: build_T019
base: 76afeecea955413289f6a31f38ea939d1ded3144
worktree: null
task_branch: null
files:
  - tools/package/consumer/consumer.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
  - docs/specs/upstream-bugs.md
---

# T019 — Add the wave-3 items to the consumer build, name-collision list, README, and changelog

## Context

Wave 3 lands fifteen items in parallel tasks that may not share files, so the package-wide registries are updated here, after all of them: the packed consuming build (SC5), the ADR 0080 name-collision test's positive list, the item-names test, the package README's Entry points table and status line, the changelog, and any upstream bug the wave's tasks reported. Items: breakout, timeline, grid, masonry, enter, visually-hidden, cluster, sidebar, cover, columns, layer, overlay, spinner, scroller, frame.

## Approach

- `tools/package/consumer/consumer.ts`: import and use at least one public symbol from each of the fifteen entry points (for example each item's root directive in the component's `imports` and template), so `pack-check` proves every entry point resolves through the tarball's `exports`.
- `packages/ngx-yeti/src/name-collision.node.spec.ts`: add every new export of the fifteen entry points to the `arrayContaining` positive list (lines 57 to 67), so a missing entry point fails the test; the collision check itself stays as is (ADR 0080). `packages/ngx-yeti/src/item-names.node.spec.ts`: add each new root directive file to its positive list.
- `packages/ngx-yeti/README.md`: one Entry points row per item, and the status line (line 5) naming what is implemented now. `packages/ngx-yeti/CHANGELOG.md`: one Entry points line per item under the unreleased version, whose header names the Yeti commit (ADR 0017). Write for the package's readers, without planning ids.
- `docs/specs/upstream-bugs.md`: turn every `UPSTREAM:` Log line of T009 to T018 into a row in the file's own format; frame's row (T018) is already there; file nothing upstream.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- SC5

## Acceptance criteria

1. `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports a public symbol from each of the fifteen wave-3 entry points against the `npm pack` tarball, and the contract checks of those items pass over the built manifest.
2. The name-collision positive list holds every export of the fifteen entry points and the item-names list every new root directive file; both tests pass.
3. The README's Entry points table and status line and the changelog name the fifteen items; every `UPSTREAM:` line of the wave has its row.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && test -f tools/package/consumer/consumer.ts && test -f packages/ngx-yeti/src/name-collision.node.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/name-collision src/item-names contract.node && npm exec nx -- run ngx-yeti:pack-check; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — coder: consumer.ts imports and uses every public class of the fifteen wave-3 entry points (children nested in their parents, `YetiScrollerJustify` bound to `[justify]`); `export {}` stays only for button, container, icon, and table, which have no exports yet. name-collision positive list gains all 31 exports of the fifteen entry points (`YetiSpinner` and `YetiScrollerJustify` included); item-names gains the fifteen root directive files. README: status line and one Entry points row per item. CHANGELOG: one Entry points line per item, and the stale accessibility.css sentence ("no accessibility rule yet") replaced with the spinner/busy-button forced-colours rule (A11Y-32). upstream-bugs.md: Y14 (T011's Yeti enter.css `[data-once]` specificity) and O16 (T009's GSD Path 1.5.0 verify-sidecar cleanup vs a live Nx daemon); A10 (frame, T018) untouched. No other `UPSTREAM:` lines in T009 to T018.
- 2026-10-11 — coder: open items outside my files: (a) `YetiScrollerJustify` re-export from the primary entry point `packages/ngx-yeti/src/index.ts` (scroller.md:153, ticket 50 decision 60; T017 Log); (b) the one-time-task bullet in `.claude/skills/ngx-yeti-specs/SKILL.md` is stale now that the first item rule landed (T016 Log); (c) T017's Departures row for scroller's real-key arrow cases in the same SKILL.md.
- 2026-10-11 — coder: Verify (as written, under the lock, primary checkout at base 76afeec plus this diff): exit 0. `npm ci` ok; `run-many -t lint typecheck -p ngx-yeti` ok; `nx test ngx-yeti -- src/name-collision src/item-names contract.node`: 22 test files, 24 tests passed; `ngx-yeti:pack-check` passed (packed tarball, consumer compiled under strictTemplates). `npx prettier --check .` passed.
- 2026-10-11 — orchestrator Verify (sidecar gsd-path-verify/task-t019-verify): pass, exit 0; output tail:
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
