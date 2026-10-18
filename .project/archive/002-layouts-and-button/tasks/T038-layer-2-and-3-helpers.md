---
id: T038
title: Share the directive host, the server-render readers, and Yeti's gap and width lists, and migrate the layer-2 and layer-3 specs
wave: 4
deps: [T036]
status: done
agent: build_T038
base: 45fc056579b3e0bf53cd4291c5b309738aab4793
worktree: null
task_branch: null
files:
  - tsconfig.base.json
  - packages/ngx-yeti-testing/src/test-bed.ts
  - packages/ngx-yeti-testing/src/server.ts
  - packages/ngx-yeti-testing/src/lib/vocabularies.ts
  - packages/ngx-yeti-testing/src/lib/html.ts
  - packages/ngx-yeti-testing/src/lib/html.spec.ts
  - packages/ngx-yeti-testing/README.md
  - packages/ngx-yeti-testing/tsconfig.lib.json
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - packages/ngx-yeti/box/src/box.spec.ts
  - packages/ngx-yeti/box/src/box.ssr.spec.ts
  - packages/ngx-yeti/box/src/box.contract.node.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.ssr.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.contract.node.spec.ts
  - packages/ngx-yeti/card/src/card.spec.ts
  - packages/ngx-yeti/card/src/card.ssr.spec.ts
  - packages/ngx-yeti/card/src/card.contract.node.spec.ts
  - packages/ngx-yeti/center/src/center.spec.ts
  - packages/ngx-yeti/center/src/center.ssr.spec.ts
  - packages/ngx-yeti/center/src/center.contract.node.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.ssr.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.contract.node.spec.ts
  - packages/ngx-yeti/columns/src/columns.spec.ts
  - packages/ngx-yeti/columns/src/columns.ssr.spec.ts
  - packages/ngx-yeti/columns/src/columns.contract.node.spec.ts
  - packages/ngx-yeti/cover/src/cover.spec.ts
  - packages/ngx-yeti/cover/src/cover.ssr.spec.ts
  - packages/ngx-yeti/cover/src/cover.contract.node.spec.ts
  - packages/ngx-yeti/enter/src/enter.spec.ts
  - packages/ngx-yeti/enter/src/enter.ssr.spec.ts
  - packages/ngx-yeti/enter/src/enter.contract.node.spec.ts
  - packages/ngx-yeti/frame/src/frame.spec.ts
  - packages/ngx-yeti/frame/src/frame.ssr.spec.ts
  - packages/ngx-yeti/frame/src/frame.contract.node.spec.ts
  - packages/ngx-yeti/grid/src/grid.spec.ts
  - packages/ngx-yeti/grid/src/grid.ssr.spec.ts
  - packages/ngx-yeti/grid/src/grid.contract.node.spec.ts
  - packages/ngx-yeti/layer/src/layer.spec.ts
  - packages/ngx-yeti/layer/src/layer.ssr.spec.ts
  - packages/ngx-yeti/layer/src/layer.contract.node.spec.ts
  - packages/ngx-yeti/lift/src/lift.spec.ts
  - packages/ngx-yeti/lift/src/lift.ssr.spec.ts
  - packages/ngx-yeti/lift/src/lift.contract.node.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.ssr.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.contract.node.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.ssr.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.contract.node.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.ssr.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.contract.node.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.ssr.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.contract.node.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.ssr.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.contract.node.spec.ts
  - packages/ngx-yeti/stack/src/stack.spec.ts
  - packages/ngx-yeti/stack/src/stack.ssr.spec.ts
  - packages/ngx-yeti/stack/src/stack.contract.node.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.ssr.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.contract.node.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.ssr.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.contract.node.spec.ts
---

# T038 — Share the directive host, the server-render readers, and Yeti's gap and width lists, and migrate the layer-2 and layer-3 specs

## Context

Build repair before wave 4. User ruling, verbatim (2026-10-11): "1-3: Approve." Its first item is "1 extract shared test helpers before wave 4"; this task is the part for layers 2 and 3 (T036 has layer 4, T037 the stories). From the maintainability review of wave 3 (2026-10-11, counted over 4978c46..c92e1b4):

- Layer 2: 20 specs each define a `setup` function around `TestBed.createDirective` with `whenStable()`, a narrowing of the host from `unknown` with `assert.instanceOf`, and a nested `destroy()` that narrows again. The block is 18 to 20 lines in `packages/ngx-yeti/columns/src/columns.spec.ts` (lines 47 to 66) and `packages/ngx-yeti/spinner/src/spinner.spec.ts` (lines 35 to 54); about 300 lines in all (estimated, not measured).
- Layer 3, server render: the test "writes one {item} item link into the head" has 18 copies and "puts no jsaction on any element" 17. They differ only in the item's name and the folder in the href; `packages/ngx-yeti/columns/src/columns.ssr.spec.ts`, lines 62 to 87, shows both.
- Layer 3, contract: Yeti's 29-value gap list is copied into 10 wave 3 contract specs (310 lines) and 3 earlier ones (93), and `widths` with `widthsOrNone` into 8 and 2. `packages/ngx-yeti/grid/src/grid.contract.node.spec.ts` shows them.

Wave 4 adds four items whose specs would copy all three; T020 to T023, T025, and T040 consume this task's helpers instead.

## Approach

- Outcome: one home per helper, every item spec migrated, every local copy deleted, no compatibility layer.
- The directive host gets an entry of its own, a new file beside the library's `server.ts`, with its path alias written by hand in tsconfig.base.json as T036 did for the Playwright entry. Do not export it from the library's browser entry: the e2e apps import that entry in Node, and it must stay free of Angular's testing module.
- Each layer-2 spec keeps its own `setup` function, in the SIFERS shape of the type-safety skill, and that function calls `createDirectiveHost`. A spec that needs more than the host (a test host component, a probe directive) keeps that part.
- The server-render readers return data and never assert, so each test keeps its own `expect` lines and its own `expect.assertions(n)` count. They join the HTML readers of `packages/ngx-yeti-testing/src/lib/html.ts`, with cases in `packages/ngx-yeti-testing/src/lib/html.spec.ts`.
- The value lists move to one module, exported from the server entry. Each contract spec passes the shared list as `values` and keeps its own `expectTypeOf` line, written against `(typeof gaps)[number]`, so the compile-time half still pins each input to the list and the run-time half still compares the manifest with it. A list only one item uses (`columns`, `rows`, `tracks`, `lines`) stays in that item's spec.
- This is a refactor of tests. No assertion gets weaker and no test is dropped. The held-out test of E13 stays in `packages/ngx-yeti/box/src/box.spec.ts`.
- Comments in the files this task touches keep the reason the code cannot state and lose ticket, decision, and planning ids. Known site: "ticket 26 row 11, kind P" in the breakout contract spec.
- Docs in this task: the Layer 2 and Layer 3 sections and the server paragraph of `.claude/skills/ngx-yeti-testing/SKILL.md`, and one line for the new entry in `packages/ngx-yeti-testing/README.md`.
- `test`, the fast targets, and Vitest never type-check: the `expectTypeOf` lines are checked only by `typecheck`, which the Verify runs.
- A load-sensitive layer-2 case sits in a spec this task migrates. In the unit job at the wave 3 cycle 2 gate (2026-10-11, at 7e0045f) the lift spec's first real-pointer test in WebKit, "raises a hovered card by --yeti-lift-distance and deepens its shadow", timed out at 15 s: it ran 20.7 s, Playwright's log stopped at "waiting for element to be stable" on the first hover, the two hover tests after it took 3.5 s each, and the job passed when run again alone. Run the uncached three-engine layer-2 job five times with nothing else running. If the timeout recurs, find what that first hover waits for and fix the wait in the spec's setup; never raise a global timeout. If it does not recur, change nothing for it. Record the five results and the finding in the Log.
- The Verify runs layer 2 in three engines in a container, so the orchestrator serializes heavy runs; run it with nothing else running.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`; read `references/ci-local.md` before running a container job.

## Interface contract

- Directive host (T038): the entry `@ngx-yeti/testing/test-bed` (`packages/ngx-yeti-testing/src/test-bed.ts`, mapped in tsconfig.base.json) exports `createDirectiveHost(type, options?: { readonly tagName?: string; readonly bindings?: Binding[] })`, which calls `TestBed.createDirective(type, options)`, awaits `whenStable()`, and resolves `{ fixture, element, destroy }`: `fixture` is what `createDirective` returned, `element` is its host narrowed to `HTMLElement`, and `destroy()` destroys the fixture and takes the host out of the document. A layer-2 spec's own `setup` function calls it and repeats none of that.
- Server-render readers and value lists (T038), exported from `@ngx-yeti/testing/server`: `itemLinkOf(html: string, item: string): { readonly count: number; readonly beastiesSkip: boolean; readonly href: string | null }` reads the head links of `html` whose `data-ngx-yeti-styles` is `item`: how many there are, and whether the first carries `data-beasties-skip` and what its `href` is; `itemHref(kind: string, item: string): RegExp` matches `yeti-css/{kind}/{item}/{item}.css?v=` followed by the 40-character pin; `jsactionTags(html: string): readonly string[]` lists the opening tags of `html` that carry `jsaction`; and `gaps`, `widths`, and `widthsOrNone` are `as const` tuples of Yeti's 29 gap values, its 7 widths from `2xs` to `2xl`, and `none` followed by those widths, which a contract spec passes as `values` and pins with its own `expectTypeOf` line. A spec asserts on what these return with its own `expect` and declares no copy of them.

## Intent coverage

- None

## Acceptance criteria

1. `@ngx-yeti/testing/test-bed` exports `createDirectiveHost` as the Interface contract states and tsconfig.base.json maps it; the library's browser entry does not export it. Every layer-2 item spec creates its directive host through it, and none repeats the narrowing or the destroy block.
2. `@ngx-yeti/testing/server` exports `itemLinkOf`, `itemHref`, `jsactionTags`, `gaps`, `widths`, and `widthsOrNone`. Every server-render item spec asserts its item link and the absence of `jsaction` on what the readers return, and no contract spec declares its own copy of the gap or width lists.
3. Each contract spec still pairs every `values` list with its own `expectTypeOf` line, and `npm exec nx -- typecheck ngx-yeti` passes.
4. `npm exec nx -- test ngx-yeti` passes, and layer 2 passes in Chromium, Firefox, and WebKit through the ci unit job.
5. The Log records five uncached three-engine runs of layer 2 and, for the lift spec's first WebKit hover test, either the cause of its timeout with the fix or that the timeout did not recur.
6. No assertion is weaker and no test is gone; the held-out test of E13 is in `packages/ngx-yeti/box/src/box.spec.ts`.
7. The comment listed in Approach states a reason and no ticket id, and the testing skill and the test library's README describe the entry and the helpers that exist after this task.
8. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti-testing/src/test-bed.ts && test -f packages/ngx-yeti-testing/src/lib/vocabularies.ts && rg -q -F "createDirectiveHost" packages/ngx-yeti/columns/src/columns.spec.ts && ! rg -q -F "2xl-3xl" packages/ngx-yeti -g "*.contract.node.spec.ts" && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-testing && npm exec nx -- test ngx-yeti-testing && npm exec nx -- test ngx-yeti && node tools/ci-local/run-job.mjs ci unit -- npx nx run-many --output-style=static -t test --skip-nx-cache; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user ruling "1-3: Approve.", item 1, layers 2 and 3). The counts in Context are from the wave 3 maintainability review of 2026-10-11, whose file is not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — coder (build_T038): implementation. New entry `@ngx-yeti/testing/test-bed` (`packages/ngx-yeti-testing/src/test-bed.ts`, alias in tsconfig.base.json, not exported from the browser entry) exports `createDirectiveHost(type, options?)` resolving `{ fixture, element, destroy }` (exported interface `DirectiveHost<T>`; `fixture` is the `DirectiveFixture<T>` `createDirective` returned; throws a TypeError when the host is not an HTMLElement). `src/lib/html.ts` gains `itemLinkOf`, `itemHref` (anchored, kind and item escaped), and `jsactionTags`, with cases in `html.spec.ts`; `src/lib/vocabularies.ts` holds `gaps`, `widths`, `widthsOrNone`, exported from `server.ts`. All 20 layer-2 item specs create their directive hosts through `createDirectiveHost` (each keeps its own setup function; the no-listener helpers too); no `TestBed.createDirective` is left in any item spec. All 20 server-render specs assert the item link through `itemLinkOf`/`itemHref` and jsaction through `jsactionTags`. 13 contract specs plus card's take the shared lists (each local copy was checked equal to the shared list before deletion by script); every `expectTypeOf` line kept. Breakout's contract comment lost "ticket 26 row 11, kind P". Testing skill (server paragraph, Layer 2, Layer 3) and README updated. Strength notes: where the old item-link test asserted the head held only one item link of any item, the new test keeps that with a `headLinks(...).filter(...)` length 1 beside `itemLinkOf(...).count` 1 (assertion counts unchanged); scroller's styles-name check was implied by its own filter and is dropped (4 to 3); `data-beasties-skip` is now asserted present (boolean) rather than equal to ''; lift's "no jsaction on the hosts" (2 article tags) became "no jsaction on any element" over the whole page (stronger); card's jsaction test asserts `jsactionTags` equals exactly the two links (implies the card has none and the plain link has one) plus the equal-value check (3 to 2 assertions); overlay checks jsaction through `jsactionTags` and inert/aria-hidden as before (1 to 2). Test names unchanged except lift's. E13's held-out marker test stays in box.spec.ts (describe.each(markers)).
- 2026-10-12 — coder: lift WebKit hover, five uncached three-engine layer-2 runs (`node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti --output-style=static --skip-nx-cache -- --project=browser`, nothing else holding the heavy lock): all five exit 0, each 69 files / 1227 tests passed. "raises a hovered card by --yeti-lift-distance and deepens its shadow" in WebKit took 2945, 3201, 3733, 3864, 4102 ms (Chromium 1857-3941, Firefox 1599-2175); the 15 s timeout did not recur, so nothing changed for it.
- 2026-10-12 — coder: Verify run exactly as written from the worktree root through the heavy lock: exit 0. lint and typecheck of ngx-yeti and ngx-yeti-testing passed; `nx test ngx-yeti-testing` 6 files / 80 tests; `nx test ngx-yeti` (local Chromium) 72 files / 554 tests; ci unit job (`run-many -t test --skip-nx-cache`, three engines) passed for 5 projects (largest run 118 files / 1372 tests; others 1/1, 1/1, 8/88). `npx prettier --check .` also passed. Ledger: no accessibility, standards, parity, or compatibility change; no row needed.
- 2026-10-12 — orchestrator Verify (isolate gsd-path-task/T038): pass, exit 0; output tail:
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
