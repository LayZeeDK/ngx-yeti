---
id: T001
title: Generate the 22 M002 secondary entry points before any item task
wave: 1
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
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
