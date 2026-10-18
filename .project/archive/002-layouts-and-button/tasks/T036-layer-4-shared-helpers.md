---
id: T036
title: Share the layer-4 geometry, sheet-applied, standard-route, and styled-frame helpers across both e2e apps
wave: 4
deps: [T035]
status: done
agent: build_T036
base: 2e703719aa0b3e6f0fd8df20ff64e80021886694
worktree: null
task_branch: null
files:
  - tsconfig.base.json
  - packages/ngx-yeti-testing/src/playwright.ts
  - packages/ngx-yeti-testing/README.md
  - packages/ngx-yeti-testing/eslint.config.mjs
  - packages/ngx-yeti-testing/tsconfig.lib.json
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - apps/ngx-yeti-e2e/src/item-styles.ts
  - apps/ngx-yeti-e2e/src/breakout.spec.ts
  - apps/ngx-yeti-e2e/src/card.spec.ts
  - apps/ngx-yeti-e2e/src/cluster.spec.ts
  - apps/ngx-yeti-e2e/src/columns.spec.ts
  - apps/ngx-yeti-e2e/src/cover.spec.ts
  - apps/ngx-yeti-e2e/src/enter.spec.ts
  - apps/ngx-yeti-e2e/src/grid.spec.ts
  - apps/ngx-yeti-e2e/src/layer.spec.ts
  - apps/ngx-yeti-e2e/src/lift.spec.ts
  - apps/ngx-yeti-e2e/src/masonry.spec.ts
  - apps/ngx-yeti-e2e/src/overlay.spec.ts
  - apps/ngx-yeti-e2e/src/scroller.spec.ts
  - apps/ngx-yeti-e2e/src/sidebar.spec.ts
  - apps/ngx-yeti-e2e/src/spinner.spec.ts
  - apps/ngx-yeti-e2e/src/stack.spec.ts
  - apps/ngx-yeti-e2e/src/timeline.spec.ts
  - apps/ngx-yeti-e2e/src/visually-hidden.spec.ts
  - apps/yeti-app-e2e/src/support/style-probe.ts
  - apps/yeti-app-e2e/src/support/standard-cases.ts
  - apps/yeti-app-e2e/src/box.spec.ts
  - apps/yeti-app-e2e/src/breakout.spec.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - apps/yeti-app-e2e/src/cluster.spec.ts
  - apps/yeti-app-e2e/src/columns.spec.ts
  - apps/yeti-app-e2e/src/cover.spec.ts
  - apps/yeti-app-e2e/src/enter.spec.ts
  - apps/yeti-app-e2e/src/frame.spec.ts
  - apps/yeti-app-e2e/src/grid.spec.ts
  - apps/yeti-app-e2e/src/layer.spec.ts
  - apps/yeti-app-e2e/src/lift.spec.ts
  - apps/yeti-app-e2e/src/masonry.spec.ts
  - apps/yeti-app-e2e/src/overlay.spec.ts
  - apps/yeti-app-e2e/src/scroller.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
  - apps/yeti-app-e2e/src/sidebar.spec.ts
  - apps/yeti-app-e2e/src/spinner.spec.ts
  - apps/yeti-app-e2e/src/stack.spec.ts
  - apps/yeti-app-e2e/src/static-attributes.spec.ts
  - apps/yeti-app-e2e/src/timeline.spec.ts
  - apps/yeti-app-e2e/src/visually-hidden.spec.ts
---

# T036 — Share the layer-4 geometry, sheet-applied, standard-route, and styled-frame helpers across both e2e apps

## Context

Build repair before wave 4. User ruling, verbatim (2026-10-11): "1-3: Approve." The first of the three items it approves is "1 extract shared test helpers before wave 4"; this task is its layer-4 part (T037 has the stories, T038 layers 2 and 3). The maintainability review of wave 3 (2026-10-11, read-only, counted with scripts over 4978c46..c92e1b4) found that wave 3 repeated wave 2's per-file test helpers fifteen times, about 2,250 lines against about 550 before, and that the copies have drifted apart. Wave 4 adds button, icon, container, and table, which would each copy one variant; T020 to T025 consume this task's helpers instead.

Measured repetition, as wave 3 copies and lines, then earlier copies:

- Fixture e2e (`apps/yeti-app-e2e/src`): the test "hydrates with 0 skipped components ..." 15 copies and 229 lines, plus 6 earlier, in 18 shapes that differ only in the visible-host selector; the test "removes the {item} link on leaving the route ..." 15 and 320 lines, plus 4, in 18 shapes; "serves server HTML that axe passes" 15 and 127 lines, plus 6; `interface Box` 9 plus 1, in 6 shapes; `rect` 8 plus 1; a token probe 4 plus 1; `childRects` 2; an item's own filter over `itemLinks` 11 plus 3; an `expect...Styled` or `expect...SheetApplied` wrapper 13 plus 2, in 14 shapes; the client-only frame annotation 10 blocks in 9 files, in 2 formats.
- Storybook e2e (`apps/ngx-yeti-e2e/src`): `interface Box` 8 plus 1; `rect` 6 plus 1; the token probe, also named `thresholdWidth`, 6 plus 1, on the block axis in the cluster spec and the inline axis in the grid spec; `childRects` 3 plus 1; `horizontalOverflow` 5 plus 1, byte-identical; `resize` 4, in 3 shapes; an `expect...Styled` wrapper 11 plus 2, in 13 shapes.

The drift that matters:

- The leave-and-return test asserts one claim four ways. The grid spec compares the item's own links exactly (`toEqual(['grid'])`); the timeline spec uses `toContain` before leaving and an exact list after; the spinner spec uses containment only and skips the sheet-applied check after returning; the cover spec uses `toContain` once and then `.includes()` inside a poll.
- "Loaded" has two meanings. `expectItemSheetsApplied` in `apps/ngx-yeti-e2e/src/item-styles.ts` requires `cssRules.length > 0`, because a failed load leaves an empty sheet. `itemSheetsLoaded` in `apps/yeti-app-e2e/src/support/style-probe.ts` checks only `link.sheet !== null`, which passes after a failed load, and the 13 Fixture wrappers build on it.
- `resize` in the Storybook masonry spec silently does nothing on an element that is not an HTMLElement, while `arrangement()` in the columns spec throws on the same condition.
- The client-only "0 unstyled frames" check is written by hand 10 times. The cover spec always pushes an annotation (`a4-frames` in production, else `frames`, "N of M frames without the cover file") and asserts only in development; the breakout and overlay specs annotate only in production, with other text; `expectHydrationFrames` is a third format. A report reader cannot compare items across engines.

## Approach

- Outcome: one home per helper, every caller migrated, every local copy deleted, no compatibility layer. After this task no spec of either app declares a box type, `rect`, `childRects`, a length probe, `horizontalOverflow`, `resize`, or its own sheet check; `apps/ngx-yeti-e2e/src/item-styles.ts` is deleted; and `itemSheetsLoaded` and `expectHydrationFrames` are gone from `apps/yeti-app-e2e/src/support/style-probe.ts`.
- Work in this order, so each step runs on the one before: the Playwright entry, the Storybook e2e specs, then the Fixture e2e specs with the standard route tests and the frame check.
- The Playwright entry is a new file of the unpublished test library, beside its `server.ts`, with its path alias written by hand in tsconfig.base.json next to `@ngx-yeti/testing/server`. The rule that entry points come from the secondary-entry generator is for the package's ng-packagr entry points and does not apply to this library. The file imports `@playwright/test`, a root devDependency, and nothing of Angular. Both apps already resolve `@ngx-yeti/testing` through the tsconfig paths, and so do the ci-local containers and the floor jobs.
- If a Vitest lint rule of the library's ESLint config misreads Playwright's `expect` in this file, scope an override to this file in `packages/ngx-yeti-testing/eslint.config.mjs` with its reason. Never switch a rule off for the folder.
- `expectItemSheetsApplied` keeps the strength of the Storybook app's version: one link per item, each with a sheet that has rules, and a sheet whose rules throw counts as not loaded. The comment about upstream O2 lives once, on the shared helper.
- Where copies differ, keep the strongest form: the exact list of the item's own links, the rules check, a `resize` that throws.
- Standard route tests: one implementation in `apps/yeti-app-e2e/src/support/standard-cases.ts` behind the call of the Interface contract. A route whose JavaScript-off axe test needs its arrivals collapsed (enter, cluster) gets an optional member for that, not a restated test. A negative-control route (the center anti-pattern) and the setup specs, which are not item routes, call it only where their tests are the standard ones. List in the Log every item route spec that keeps a standard test of its own, with the reason.
- Frames: write each of the two A4 rules once in the style-probe module, as the source of `recordedAs`. Frames sampled from first paint are recorded in production and in Firefox (upstream A4; the Departures row for setup.md:263 and setup.md:338). Frames of a client-only host are recorded in production only. The reset case of the setup-boundaries spec passes `webkit-pending-sheet-frames` in WebKit, as T035 left it. A recorded case stays recorded and an asserted case stays asserted (prohibition N2: must not turn a recorded-only case into a pass or fail assertion, or drop it).
- This is a refactor of tests. No assertion gets weaker, no test is dropped, and only a standard test may change its title. The held-out tests stay in the files PLAN.md names: E2 in `apps/yeti-app-e2e/src/sidebar.spec.ts`, E12 in `apps/ngx-yeti-e2e/src/sidebar.spec.ts`, E7 in `apps/ngx-yeti-e2e/src/spinner.spec.ts`, E8 in `apps/yeti-app-e2e/src/static-attributes.spec.ts`, and E15 in `apps/yeti-app-e2e/src/enter.spec.ts`.
- Comments in the files this task touches keep the reason the code cannot state and lose ticket, decision, and planning ids, dates, and measurement notes. Known sites: "ticket 50 decision 47" in the Storybook sidebar spec, "ticket 50 decision 191" in the Storybook spinner spec, "ticket 50 decision 119" in the Storybook card spec, "Ticket 33 row 16 (enter.md:269)" and "Ticket 50 decision 21" in the Fixture enter spec, "ticket 50 decision 30" in the Fixture box spec, and "E8 (ticket 50 decision 9)" in the static-attributes spec. A ledger row id such as upstream O2 or A4 may stay.
- Docs in this task: the Layer 4 section and the two helper tables of `.claude/skills/ngx-yeti-testing/SKILL.md`, which name item-styles.ts, `itemSheetsLoaded`, and `expectHydrationFrames`; and one line for the new entry in `packages/ngx-yeti-testing/README.md`.
- The Verify runs every e2e combination and two floor jobs in containers. The e2e servers use fixed ports (4310 to 4312 and 4401), so the orchestrator serializes heavy runs; run one at a time.
- - Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`; read `references/ci-local.md` before running a container job.

## Interface contract

- Playwright helpers (T036): the entry `@ngx-yeti/testing/playwright` (`packages/ngx-yeti-testing/src/playwright.ts`, mapped in tsconfig.base.json) is for the two e2e apps and exports `interface Box { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number; readonly width: number; readonly height: number }`; `rect(locator: Locator): Promise<Box>`; `childRects(parent: Locator): Promise<Box[]>`, the boxes of the element's children in DOM order; `usedLength(scope: Locator, length: string, axis?: 'inline' | 'block'): Promise<number>`, the used px size of a CSS length such as `var(--yeti-width-md)`, read from a probe appended to `scope`, on the inline axis unless `axis` says otherwise; `horizontalOverflow(page: Page): Promise<number>`, how far the document is wider than the viewport; `resize(element: Locator, width: number): Promise<void>`, which sets the element's inline size in px and throws when it is not an HTMLElement; and `expectItemSheetsApplied(page: Page, items: readonly string[]): Promise<void>`, which expects one item link per named item in the head and waits until each has a stylesheet with at least one rule. No e2e spec declares a copy of these, and no other helper checks that an item sheet has loaded.
- Fixture route helpers (T036), in `apps/yeti-app-e2e/src/support`: `standard-cases.ts` exports `describeStandardRouteCases(cases: { readonly item: string; readonly prefix: string; readonly route?: string; readonly liveHost: string; readonly leaveLink: string; readonly styled: { readonly property: string; readonly value: string | RegExp } }): void`, called once inside a spec's `routeKinds` loop with that kind's `prefix`; `route` is the fixture key and defaults to `item`, `liveHost` is a selector of a server-rendered host of the item, and `leaveLink` is the name of the link that leaves for a page without the item. It registers the route's standard tests, which no spec restates: the page hydrates with 0 skipped components and no NG05xx message (development build); the head holds exactly one link of the item before leaving, none on the page it leaves for, and exactly one again after going back, with the item's sheet applied and `liveHost` computing `styled`; and, with JavaScript off, `liveHost` carries the item's class and presence attribute, the head holds the item's link, and axe finds nothing on `wcagTags`. T036 may add optional members whose defaults keep this call valid. `style-probe.ts` exports `expectStyledFrames(frames: readonly string[], options: { readonly styled: (value: string) => boolean; readonly label: string; readonly recordedAs?: string }): void`, which expects at least one sampled frame, pushes one annotation `{label}: {unstyled} of {sampled} frames unstyled` typed `recordedAs`, or `frames` without it, and expects no unstyled frame unless `recordedAs` names why the frames are recorded (`a4-frames` for upstream A4). It replaces `expectHydrationFrames` and every inline copy.

## Intent coverage

- None

## Acceptance criteria

1. `@ngx-yeti/testing/playwright` exports the shapes of the Interface contract and tsconfig.base.json maps it. Both e2e apps import geometry and the sheet check from it. `apps/ngx-yeti-e2e/src/item-styles.ts` no longer exists, `itemSheetsLoaded` and `expectHydrationFrames` no longer exist, and no spec of either app declares its own box type, `rect`, `childRects`, length probe, `horizontalOverflow`, `resize`, or sheet check.
2. Every item route spec of `apps/yeti-app-e2e/src` gets its hydration, leave-and-return, and JavaScript-off tests from `describeStandardRouteCases`; the Log lists each exception with its reason. For every item the leave-and-return test compares the item's own links exactly and checks the sheet applied after returning.
3. Every count of unstyled frames goes through `expectStyledFrames`, with one annotation format, and each of the two A4 rules is written once.
4. No assertion is weaker and no test is gone: every test that existed still runs with at least the strength of its strongest copy, and the held-out tests of E2, E7, E8, E12, and E15 are in the files PLAN.md names.
5. `node tools/ci-local/run-job.mjs ci e2e` passes in all six combinations of engine and configuration, and the floor jobs `webkit-26-4` and `firefox-146-e2e` pass.
6. The comments listed in Approach state a reason and no ticket, decision, or planning id.
7. The testing skill's Layer 4 section and helper tables and the test library's README describe the entry and the helpers that exist after this task.
8. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti-testing/src/playwright.ts && test -f apps/yeti-app-e2e/src/support/standard-cases.ts && ! test -e apps/ngx-yeti-e2e/src/item-styles.ts && ! rg -q -F "async function rect(" apps/ngx-yeti-e2e/src apps/yeti-app-e2e/src && ! rg -q -F "itemSheetsLoaded" apps/yeti-app-e2e/src && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-testing ngx-yeti-e2e yeti-app-e2e && npm exec nx -- test ngx-yeti-testing && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user ruling "1-3: Approve.", item 1, layer-4 part). The counts in Context are from the wave 3 maintainability review of 2026-10-11, whose file is not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — coder (build_T036): implementation.
  - New entry `@ngx-yeti/testing/playwright` (`packages/ngx-yeti-testing/src/playwright.ts`, mapped by hand in tsconfig.base.json next to `/server`). It exports the Interface contract shapes as written: `Box`, `rect`, `childRects`, `usedLength(scope, length, axis = 'inline')`, `horizontalOverflow`, `resize` (throws a TypeError when the element is not an HTMLElement), and `expectItemSheetsApplied` (the Storybook version's strength: one link per item, a sheet with rules, a sheet whose rules throw counts as not loaded; the O2 comment lives only here). No ESLint override was needed: the library's `vitestConfig` applies to `*.spec.ts` only. So eslint.config.mjs and tsconfig.lib.json are unchanged.
  - Storybook e2e: `item-styles.ts` deleted. Every local Box/rect/childRects/token probe/thresholdWidth/blockLength/switchWidth/xsStop/rem/horizontalOverflow/pageOverflow/resize/setWidth is replaced by the shared helpers. Lengths given in rem (cluster 10rem/90rem, timeline 70rem/30rem) are resized via `usedLength(scope, 'Nrem')`. Card's xsStop and sidebar's switchWidth are now `usedLength` of a `calc()`. The per-item `expect…Styled` wrappers (and spinner's `styledRing`) are inlined as `expectItemSheetsApplied` plus the same `toHaveCSS`, so no spec has a sheet check of its own. Cover keeps a local `blockOverflow`, the vertical half of its old `pageOverflow`. Masonry's `resize` now throws as the columns spec did; card/columns/sidebar arrangement readers resize through `resize`.
  - Fixture e2e: `standard-cases.ts` exports `describeStandardRouteCases` with the contract's members plus optional `leaveUrl` (default `/\/replay$/`), `afterReturn(page)` (box's probe match, center's stack+center order and centring, stack's stack+center order, frame's 16/9 crop), and `arrivals` (enter `#plain`, cluster's arriving rows: reduced motion plus opacity wait before axe). The leave-and-return test compares the item's own links exactly (`itemLinks(page, item)` → `[item]`) before and after, and checks the sheet and `styled` after returning, for every item. Spinner, visually-hidden, enter, and the containment-only specs now get that strength. The JavaScript-off standard test checks class (`toContainClass`), presence attribute, the item's own link, and axe. It replaces each route's "serves server HTML that axe passes" (retitled, the only title change). `itemLinks(page, item?)` in style-probe.ts replaces the 13 per-item link filters. `itemSheetsLoaded` and `expectHydrationFrames` are gone; every poll and wrapper uses `expectItemSheetsApplied`. setup-serving's `itemSheetsLoaded(page)` with no names became `['card', 'lift']`, the route's two links.
  - Frames: `expectStyledFrames` in style-probe.ts. The two A4 rules are written once each: `firstPaintFramesRecordedAs(browserName)` (production or Firefox) and `productionFramesRecordedAs()` (production only). Both return `{ recordedAs? }` to spread into the options because the workspace uses `exactOptionalPropertyTypes`. Every unstyled-frame count goes through `expectStyledFrames`. Recorded cases stay recorded under their own types: `reinserted-frames` (card, spinner, setup), `no-preload-frames` (lift, setup, setup-boundaries), `client-held-frames` (overlay held child), `a4-frames` (setup-serving A4 probe), `webkit-pending-sheet-frames` (setup-boundaries reset case, WebKit only). Previously asserted-in-development cases stay asserted. Frame's photo-shift annotation reads `productionFramesRecordedAs()`.
  - Item route specs with no standard test of their own (exceptions): lift — its fixture has no link that leaves the route, so its hydration and axe tests stay its own (the leave test never existed). Non-item routes keep their own tests by design: box-markers, setup, setup-defer, setup-order, setup-boundaries, setup-serving, static-attributes, and center's anti-pattern (negative control).
  - Comments: the ids in the Approach list are replaced with their reasons (card 119, sidebar 47, spinner 191, enter "Ticket 33 row 16" and "decision 21", box 30, static-attributes "E8 (ticket 50 decision 9)", setup-boundaries "Ticket 37"). "review finding G2-02/G4-02" removed. Held-out tests E2, E7, E8, E12, E15 are in their PLAN.md files, unchanged.
  - Docs: testing skill's helper table for the new entry, Layer 4 paragraph, standard route cases paragraph, and support-helper table rows updated; README gets one line.
  - Needed outside `files` (not edited): `apps/yeti-app-e2e/eslint.config.mjs` still names `expectHydrationFrames` in `playwright/expect-expect` `assertFunctionNames`. That entry is now unused and harmless; lint passes with `--max-warnings=0`.
  - Ledger rows needed: none (test refactor).
- 2026-10-12 — coder: Verify run exactly as written from the worktree root through the heavy lock: exit 0. Lint and typecheck of ngx-yeti-testing, ngx-yeti-e2e, yeti-app-e2e: pass. `nx test ngx-yeti-testing`: 6 files, 75 tests passed. `run-job ci e2e`, all six combinations pass:
  - chromium/dev: analog 1 passed; Storybook 129 passed, 1 skipped; Fixture 511 passed, 90 skipped.
  - chromium/prod: Fixture 460 passed, 141 skipped.
  - firefox/dev: 1; 129 passed, 1 skipped; 509 passed, 92 skipped.
  - firefox/prod: 458 passed, 143 skipped.
  - webkit/dev: 1; 126 passed, 4 skipped; 507 passed, 94 skipped.
  - webkit/prod: 456 passed, 145 skipped.

  `floor webkit-26-4` pass: layer 2 409 tests passed; Storybook 118 passed, 12 skipped; Fixture 507 passed, 94 skipped. `floor firefox-146-e2e` pass: shard 1 Storybook 64 passed, 1 skipped, Fixture 211 passed, 90 skipped; shard 2 Storybook 65 passed, Fixture 298 passed, 2 skipped. Earlier local runs: Storybook Chromium 129 passed, 1 skipped; Fixture Chromium dev 511 passed, 90 skipped; prod 460 passed, 141 skipped. `npx prettier --check .` clean.
- 2026-10-11 — orchestrator Verify (isolate gsd-path-task/T036): pass, exit 0; output tail:
  ```
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/spinner
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/stack
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/table
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/timeline
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/visually-hidden
  ```
