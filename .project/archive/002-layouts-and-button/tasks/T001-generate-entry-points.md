---
id: T001
title: Generate the 22 M002 secondary entry points before any item task
wave: 1
deps: []
status: done
agent: build_T001
base: c289e6cec5ae081ed8fb227cb37f7951f5ca622d
worktree: null
task_branch: null
files:
  - tools/package/consumer/consumer.ts
  - tsconfig.base.json
  - packages/ngx-yeti/tsconfig.lib.json
  - packages/ngx-yeti/box/ng-package.json
  - packages/ngx-yeti/box/README.md
  - packages/ngx-yeti/box/src/index.ts
  - packages/ngx-yeti/breakout/ng-package.json
  - packages/ngx-yeti/breakout/README.md
  - packages/ngx-yeti/breakout/src/index.ts
  - packages/ngx-yeti/button/ng-package.json
  - packages/ngx-yeti/button/README.md
  - packages/ngx-yeti/button/src/index.ts
  - packages/ngx-yeti/center/ng-package.json
  - packages/ngx-yeti/center/README.md
  - packages/ngx-yeti/center/src/index.ts
  - packages/ngx-yeti/cluster/ng-package.json
  - packages/ngx-yeti/cluster/README.md
  - packages/ngx-yeti/cluster/src/index.ts
  - packages/ngx-yeti/columns/ng-package.json
  - packages/ngx-yeti/columns/README.md
  - packages/ngx-yeti/columns/src/index.ts
  - packages/ngx-yeti/container/ng-package.json
  - packages/ngx-yeti/container/README.md
  - packages/ngx-yeti/container/src/index.ts
  - packages/ngx-yeti/cover/ng-package.json
  - packages/ngx-yeti/cover/README.md
  - packages/ngx-yeti/cover/src/index.ts
  - packages/ngx-yeti/enter/ng-package.json
  - packages/ngx-yeti/enter/README.md
  - packages/ngx-yeti/enter/src/index.ts
  - packages/ngx-yeti/frame/ng-package.json
  - packages/ngx-yeti/frame/README.md
  - packages/ngx-yeti/frame/src/index.ts
  - packages/ngx-yeti/grid/ng-package.json
  - packages/ngx-yeti/grid/README.md
  - packages/ngx-yeti/grid/src/index.ts
  - packages/ngx-yeti/icon/ng-package.json
  - packages/ngx-yeti/icon/README.md
  - packages/ngx-yeti/icon/src/index.ts
  - packages/ngx-yeti/layer/ng-package.json
  - packages/ngx-yeti/layer/README.md
  - packages/ngx-yeti/layer/src/index.ts
  - packages/ngx-yeti/masonry/ng-package.json
  - packages/ngx-yeti/masonry/README.md
  - packages/ngx-yeti/masonry/src/index.ts
  - packages/ngx-yeti/overlay/ng-package.json
  - packages/ngx-yeti/overlay/README.md
  - packages/ngx-yeti/overlay/src/index.ts
  - packages/ngx-yeti/scroller/ng-package.json
  - packages/ngx-yeti/scroller/README.md
  - packages/ngx-yeti/scroller/src/index.ts
  - packages/ngx-yeti/sidebar/ng-package.json
  - packages/ngx-yeti/sidebar/README.md
  - packages/ngx-yeti/sidebar/src/index.ts
  - packages/ngx-yeti/spinner/ng-package.json
  - packages/ngx-yeti/spinner/README.md
  - packages/ngx-yeti/spinner/src/index.ts
  - packages/ngx-yeti/stack/ng-package.json
  - packages/ngx-yeti/stack/README.md
  - packages/ngx-yeti/stack/src/index.ts
  - packages/ngx-yeti/table/ng-package.json
  - packages/ngx-yeti/table/README.md
  - packages/ngx-yeti/table/src/index.ts
  - packages/ngx-yeti/timeline/ng-package.json
  - packages/ngx-yeti/timeline/README.md
  - packages/ngx-yeti/timeline/src/index.ts
  - packages/ngx-yeti/visually-hidden/ng-package.json
  - packages/ngx-yeti/visually-hidden/README.md
  - packages/ngx-yeti/visually-hidden/src/index.ts
---

# T001 — Generate the 22 M002 secondary entry points before any item task

## Context

Every M002 item ships at its own secondary entry point `ngx-yeti/{item}`, created only with `nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule` (INTENT Constraints; a hand-made entry point silently skips `typecheck -c src`). The generator writes the entry point's `ng-package.json`, README.md, and src/index.ts, and adds a path alias to the shared tsconfig.base.json. If each item task ran it, every parallel item task would edit tsconfig.base.json, so this task generates all 22 now and the item tasks only fill their own folders. It also proves early that the package build, `pack-check`, and the type gate accept entry points that export nothing yet.

## Approach

- Run the generator once per item for: box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, visually-hidden.
- After each run, revert the generator's edit to `packages/ngx-yeti/tsconfig.lib.json` (it copies every pattern under the new folder prefix); the `*/src/**/*.ts` include and the `**/`-rooted excludes already cover every entry point (`.claude/skills/ngx-yeti-specs/SKILL.md`, Where code goes). At the task commit the file equals its base content.
- Each index.ts exports nothing (for example `export {};`), with no placeholder class, token, or type: the public API arrives with the item. Each `README.md` names the item and says its exports arrive with the item, in the shape of `packages/ngx-yeti/card/README.md`.
- If ng-packagr, `build-fast`, the lint rules, or the published-output tests refuse an entry point that exports nothing, stop and write `NEEDS-ORCHESTRATOR:` in the Log with the exact error; do not add a placeholder export. Every later item task depends on this layout.
- Do not touch `tools/package/consumer/consumer.ts`, `packages/ngx-yeti/README.md`, or `packages/ngx-yeti/CHANGELOG.md`: they gain an entry when each item lands.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/yeti-pin/SKILL.md`.

## Interface contract

- Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it.

## Intent coverage

- None

## Acceptance criteria

1. All 22 entry points exist with the three generated files each, and tsconfig.base.json maps each `ngx-yeti/{item}` alias to its index.ts; no entry point was written by hand.
2. `packages/ngx-yeti/tsconfig.lib.json` has the same content as at the task's base.
3. `npm exec nx -- build ngx-yeti`, `npm exec nx -- build-fast ngx-yeti`, `npm exec nx -- typecheck ngx-yeti -c src`, `npm exec nx -- run ngx-yeti:pack-check`, and `npm exec nx -- test ngx-yeti -- --project=node` pass with the new entry points, and no entry point exports a placeholder symbol.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && test -f packages/ngx-yeti/visually-hidden/src/index.ts && test -f packages/ngx-yeti/box/ng-package.json && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- typecheck ngx-yeti -c src && npm exec nx -- run-many -t build build-fast -p ngx-yeti && npm exec nx -- run ngx-yeti:pack-check && npm exec nx -- test ngx-yeti -- --project=node
```

Heavy: no

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — coder: ran `nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule` for all 22 items; restored `packages/ngx-yeti/tsconfig.lib.json` to its base bytes after each run (git diff empty); replaced each generated `export const greeting = 'Hello World!';` with `export {};` and each README with card's shape ("Yeti's `{item}` item. Its exports arrive with the item; ..."). tsconfig.base.json maps all 22 aliases (generator output).
- 2026-10-10 — coder: Verify FAILED at `nx run ngx-yeti:pack-check`. Passed before it: npm ci, both `test -f`, `run-many -t lint typecheck -p ngx-yeti`, `typecheck ngx-yeti -c src`, `run-many -t build build-fast -p ngx-yeti` (ng-packagr built all 22 empty entry points). Also ran `nx test ngx-yeti -- --project=node` separately: 12 files, 37 tests passed. Exact error: `pack-check failed: consumer.ts imports every entry point` / `ngx-yeti/box, ngx-yeti/breakout, ngx-yeti/button, ngx-yeti/center, ngx-yeti/cluster, ngx-yeti/columns, ngx-yeti/container, ngx-yeti/cover, ngx-yeti/enter, ngx-yeti/frame, ngx-yeti/grid, ngx-yeti/icon, ngx-yeti/layer, ngx-yeti/masonry, ngx-yeti/overlay, ngx-yeti/scroller, ngx-yeti/sidebar, ngx-yeti/spinner, ngx-yeti/stack, ngx-yeti/table, ngx-yeti/timeline, ngx-yeti/visually-hidden`. Cause: tools/package/pack-check.mjs:133-140 requires `tools/package/consumer/consumer.ts` to contain `from '<specifier>';` for every entry point under packages/ngx-yeti. AC3 needs that file changed, but it is not in `files` and the Approach says not to touch it. BLOCKED (plan defect: completion needs an unlisted path, and an Approach constraint contradicts AC3). Possible fix for the plan: add tools/package/consumer/consumer.ts to T001 `files` with one `export {} from 'ngx-yeti/{item}';` (or equivalent) line per entry point, which item tasks later replace with real imports; that is a placeholder-free change but conflicts with the current "do not touch consumer.ts" line.
- 2026-10-10 — orchestrator: block accepted as a plan defect; no product commit. Rejected isolate diff against base 0632a4324daa1a6c0d20aa12732b1c64fb203568: 68 paths (tsconfig.base.json, the 66 generated entry-point files, this task file), `git diff --binary` sha256 f2922de70477615203f5b95ec2d5cfb5fa13e463a4aa55a3f3da6bd91431825b; every path is task-owned.
- 2026-10-10 — orchestrator: plan-defect repair (files only). Orchestrator answer: AC3 requires `nx run ngx-yeti:pack-check` to pass, and pack-check (tools/package/pack-check.mjs:133-140) requires `tools/package/consumer/consumer.ts` to contain `from '<specifier>';` for every entry point; the coder role makes acceptance criteria outrank Approach, so AC3 overrides the Approach line "Do not touch `tools/package/consumer/consumer.ts`" for this one need. consumer.ts is added to `files`. Change it only by adding one placeholder-free side-effect line per new entry point, `export {} from 'ngx-yeti/{item}';`, and nothing else in that file; each item's registry task (T007, T008, T019, T026) later replaces its line with a real import. `packages/ngx-yeti/README.md` and `packages/ngx-yeti/CHANGELOG.md` stay untouched — coder.md (Treat ... Acceptance criteria, and Verify as the implementation contract; Approach constrains the how), T001 AC3, tools/package/pack-check.mjs:133-140.
- 2026-10-10 — coder (redispatch): ran `npm exec nx -- g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule --no-interactive` for all 22 items; after each run restored `packages/ngx-yeti/tsconfig.lib.json` to its base bytes (absent from `git status`). tsconfig.base.json holds the 22 generated aliases. Replaced each generated `export const greeting = 'Hello World!';` with `export {};` and each README with card's shape ("Yeti's `{item}` item. Its exports arrive with the item; the setup is in the [package README](../README.md)."). `tools/package/consumer/consumer.ts`: added only 22 lines `export {} from 'ngx-yeti/{item}';` after the `ngx-yeti/styles` import, nothing else changed.
- 2026-10-10 — coder (redispatch): Verify PASSED. `npm ci` ok; both `test -f` ok; then every nx step rerun with `--skip-nx-cache` and pipefail (first pass hit the shared cache from the first attempt's identical inputs): `run-many -t lint typecheck -p ngx-yeti` ok, `typecheck ngx-yeti -c src` ok, `run-many -t build build-fast -p ngx-yeti` ok, `run ngx-yeti:pack-check` ok (packed ngx-yeti-0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8.tgz), `test ngx-yeti -- --project=node` 12 files / 37 tests passed; exit 0. Also `npx prettier --check .` clean. Not run: AC4's `affected --base=HEAD~1` (needs the task commit).
- 2026-10-10 — orchestrator Verify (isolate gsd-path-task/T001): pass, exit 0; output tail:
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
