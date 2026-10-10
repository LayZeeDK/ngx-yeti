---
id: T002
title: Register every M002 Fixture route, grow the preload list, and make preload assertions containment checks
wave: 1
deps: []
status: done
agent: build_T002
base: 0632a4324daa1a6c0d20aa12732b1c64fb203568
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/app/fixtures/fixtures.ts
  - apps/yeti-app/src/app/app.config.ts
  - apps/yeti-app/src/app/fixtures/box-fixture.ts
  - apps/yeti-app/src/app/fixtures/breakout-fixture.ts
  - apps/yeti-app/src/app/fixtures/button-fixture.ts
  - apps/yeti-app/src/app/fixtures/center-fixture.ts
  - apps/yeti-app/src/app/fixtures/cluster-fixture.ts
  - apps/yeti-app/src/app/fixtures/columns-fixture.ts
  - apps/yeti-app/src/app/fixtures/container-fixture.ts
  - apps/yeti-app/src/app/fixtures/cover-fixture.ts
  - apps/yeti-app/src/app/fixtures/enter-fixture.ts
  - apps/yeti-app/src/app/fixtures/frame-fixture.ts
  - apps/yeti-app/src/app/fixtures/grid-fixture.ts
  - apps/yeti-app/src/app/fixtures/icon-fixture.ts
  - apps/yeti-app/src/app/fixtures/layer-fixture.ts
  - apps/yeti-app/src/app/fixtures/masonry-fixture.ts
  - apps/yeti-app/src/app/fixtures/overlay-fixture.ts
  - apps/yeti-app/src/app/fixtures/scroller-fixture.ts
  - apps/yeti-app/src/app/fixtures/sidebar-fixture.ts
  - apps/yeti-app/src/app/fixtures/spinner-fixture.ts
  - apps/yeti-app/src/app/fixtures/stack-fixture.ts
  - apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts
  - apps/yeti-app/src/app/fixtures/table-fixture.ts
  - apps/yeti-app/src/app/fixtures/timeline-fixture.ts
  - apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-fixture.ts
  - apps/yeti-app-e2e/src/support/fixtures.ts
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/lift.spec.ts
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
  - .claude/skills/ngx-yeti-specs/SKILL.md
---

# T002 — Register every M002 Fixture route, grow the preload list, and make preload assertions containment checks

## Context

The Fixture app `apps/yeti-app` derives a prerendered `/sub/{key}` and a server-rendered `/sub/server/{key}` route from one registry, `apps/yeti-app/src/app/fixtures/fixtures.ts`, and has one preload list in `apps/yeti-app/src/app/app.config.ts` holding only `card`. Every M002 item needs its routes, and its client-only `@defer` case needs the item in that one list (INTENT E9). Registering every route now, behind stub components, lets the item tasks of later waves run in parallel without sharing the registry (LESSONS: same-wave tasks sharing a Fixture registry fail together). Growing the list adds one server `rel="prefetch"` and one client style preload per item to every page (Departures row, ngx-yeti-specs SKILL.md:48), which breaks today's exact-array preload assertions; this task makes them containment checks. It also settles INTENT E15 by a Departures row.

## Approach

- Registry: add the 28 keys listed in the Interface contract, each mapped to a stub standalone component in the named file. A stub renders one `i18n` paragraph naming the route and a `routerLink` to `/replay`, so it prerenders, hydrates, and passes axe. Extra keys of one item live in that item's file, as `SetupDeferFixture` lives in `apps/yeti-app/src/app/fixtures/setup-fixture.ts`.
- Preload list: `card` plus every M002 item except `enter` (box, breakout, button, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, visually-hidden). `lift` stays out: the setup and lift tests use it as the "without" control (`apps/yeti-app-e2e/src/setup-boundaries.spec.ts` near line 139, `apps/yeti-app-e2e/src/lift.spec.ts` near line 94). Update the comment in app.config.ts to say why each is in or out. Keep the server prefetch and client preload split of A11Y-31 untouched (upstream O4 and O7: a server style preload stalls WebKit's first paint).
- E15, decided here: enter stays out of the list, so the Fixture app measures enter.md:272's client `@defer (on interaction)`, `@if`, and route-change insertions without the preload; "with" is measured in the Storybook half on a story `enter--inserted-preloaded`, which renders `enter--inserted` under `provideYetiStyles({ preload: ['enter'] })` through Storybook's `applicationConfig` (setup.md:304 names the same pattern, `setup--client-defer-preload`). Record this as one new row of the Departures table in `.claude/skills/ngx-yeti-specs/SKILL.md`, beside the card and lift row at line 39, with the record (enter.md:272), what it says, what the workspace does, why (one build has one preload list, `provideYetiStyles` is root-only), and the `ngx-yeti-testing` skill. Prettier formats that table; run it.
- Containment: replace every exact-array preload assertion with containment, keeping each test's meaning. Known spots: `toEqual([clientCardPreload])` at `apps/yeti-app-e2e/src/card.spec.ts` line 143, `apps/yeti-app-e2e/src/setup.spec.ts` lines 65, 122, and 396, `apps/yeti-app-e2e/src/lift.spec.ts` line 60; the style-mutation list at `apps/yeti-app-e2e/src/fixture-app.spec.ts` lines 63 to 69, which gains one client preload per listed item; and "the app preloads the card file only" at `apps/yeti-app-e2e/src/setup.spec.ts` line 207. Search the e2e sources with rg for any other exact preload list. Leave the `itemLinks` exact arrays on the card route to the card task of wave 4 (T025), which changes that route.
- In `apps/yeti-app-e2e/src/support/fixtures.ts`, keep `clientCardPreload` and add `clientItemPreload(item: string)`, the same matcher for any item, so later specs assert preloads by containment.
- E9 test in `apps/yeti-app-e2e/src/fixture-app.spec.ts`: on a prerendered and a server-rendered route, the head holds a server prefetch (server HTML) and, after bootstrap, a client style preload for every listed item, asserted with `expect.arrayContaining`, and none for `lift` or `enter`.
- WebKit: the larger prefetch list can meet upstream O4 and O7, so the Verify runs the whole Fixture suite in Playwright's WebKit through `node tools/ci-local/run-job.mjs`.
- Prohibition N3 (judgment): must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable. The stubs render plain visible text.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app, helpers, engines), `.claude/skills/ngx-yeti-specs/SKILL.md` (Departures), `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Fixture key `box` → `BoxFixture` and key `box-markers` → `BoxMarkersFixture`, both in `apps/yeti-app/src/app/fixtures/box-fixture.ts`.
- Fixture key `breakout` → `BreakoutFixture` in `apps/yeti-app/src/app/fixtures/breakout-fixture.ts`.
- Fixture key `button` → `ButtonFixture` in `apps/yeti-app/src/app/fixtures/button-fixture.ts`.
- Fixture key `center` → `CenterFixture` and key `center-anti-pattern` → `CenterAntiPatternFixture`, both in `apps/yeti-app/src/app/fixtures/center-fixture.ts`.
- Fixture key `cluster` → `ClusterFixture` in `apps/yeti-app/src/app/fixtures/cluster-fixture.ts`.
- Fixture key `columns` → `ColumnsFixture` in `apps/yeti-app/src/app/fixtures/columns-fixture.ts`.
- Fixture key `container` → `ContainerFixture` in `apps/yeti-app/src/app/fixtures/container-fixture.ts`.
- Fixture key `cover` → `CoverFixture` in `apps/yeti-app/src/app/fixtures/cover-fixture.ts`.
- Fixture key `enter` → `EnterFixture` in `apps/yeti-app/src/app/fixtures/enter-fixture.ts`.
- Fixture key `frame` → `FrameFixture` in `apps/yeti-app/src/app/fixtures/frame-fixture.ts`.
- Fixture key `grid` → `GridFixture` in `apps/yeti-app/src/app/fixtures/grid-fixture.ts`.
- Fixture key `icon` → `IconFixture` in `apps/yeti-app/src/app/fixtures/icon-fixture.ts`.
- Fixture key `layer` → `LayerFixture` in `apps/yeti-app/src/app/fixtures/layer-fixture.ts`.
- Fixture key `masonry` → `MasonryFixture` in `apps/yeti-app/src/app/fixtures/masonry-fixture.ts`.
- Fixture key `overlay` → `OverlayFixture` in `apps/yeti-app/src/app/fixtures/overlay-fixture.ts`.
- Fixture key `scroller` → `ScrollerFixture` in `apps/yeti-app/src/app/fixtures/scroller-fixture.ts`.
- Fixture key `setup-order` → `SetupOrderFixture` in `apps/yeti-app/src/app/fixtures/setup-fixture.ts`.
- Fixture key `sidebar` → `SidebarFixture` in `apps/yeti-app/src/app/fixtures/sidebar-fixture.ts`.
- Fixture key `spinner` → `SpinnerFixture` in `apps/yeti-app/src/app/fixtures/spinner-fixture.ts`.
- Fixture key `stack` → `StackFixture` in `apps/yeti-app/src/app/fixtures/stack-fixture.ts`.
- Fixture key `static-attributes` → `StaticAttributesFixture` in `apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts`.
- Fixture key `table` → `TableFixture`, key `table-numeric` → `TableNumericFixture`, and key `table-without-tbody` → `TableWithoutTbodyFixture`, all in `apps/yeti-app/src/app/fixtures/table-fixture.ts`.
- Fixture key `timeline` → `TimelineFixture` in `apps/yeti-app/src/app/fixtures/timeline-fixture.ts`.
- Fixture key `visually-hidden` → `VisuallyHiddenFixture` in `apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts`.
- Preload list (T002): `provideYetiStyles({ preload })` in apps/yeti-app/src/app/app.config.ts lists `card` and every M002 item except `enter`; `lift` and `enter` stay out.
- Preload departure (T002): a row in `.claude/skills/ngx-yeti-specs/SKILL.md`'s Departures table records that enter.md:272's with-and-without-preload cases run without the preload on the Fixture app (enter stays out of the one preload list) and with it in the Storybook half on the story `enter--inserted-preloaded`, which renders `enter--inserted` under `provideYetiStyles({ preload: ['enter'] })` through Storybook's `applicationConfig`.

## Intent coverage

- SC3

## Acceptance criteria

1. The 28 registry keys of the Interface contract are served at `/sub/{key}` (prerendered) and `/sub/server/{key}` (server-rendered); each stub passes `watchHydration` and the axe fixture, and the existing card, lift, replay, setup, setup-boundaries, and setup-defer routes keep their behaviour.
2. E9: the preload list holds `card` and every M002 item except `enter`; `lift` and `enter` are absent; every assertion on preload hrefs and preload style mutations in `apps/yeti-app-e2e/src` uses containment, and `apps/yeti-app-e2e/src/fixture-app.spec.ts` asserts the prefetch (server) and preload (client) of each listed item with `expect.arrayContaining`, so a later addition to the list breaks no assertion.
3. The Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md` has the E15 row naming enter.md:272, the Fixture app's "without" measurement, and the `enter--inserted-preloaded` story's "with" measurement.
4. `npm exec nx -- e2e yeti-app-e2e` passes in the development and production configurations, and the development run passes in Playwright's WebKit through `node tools/ci-local/run-job.mjs`.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/fixture-app.spec.ts && test -f apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts && npm exec nx -- run-many -t lint typecheck -p yeti-app yeti-app-e2e && npm exec nx -- e2e yeti-app-e2e && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — coder (build_T002): Registry holds the 28 new keys of the Interface contract, each mapped to a stub standalone component in its named file (setup-order's `SetupOrderFixture` in setup-fixture.ts). Each stub renders an `h2`, one `i18n` paragraph carrying `data-fixture-stub`, and a `routerLink` to `/replay`. Preload list in app.config.ts: `card` plus the 21 M002 items other than `enter`. `lift` and `enter` stay out, and the comment says why. The A11Y-31 server-prefetch / client-preload split is untouched. support/fixtures.ts: `clientItemPreload(item)` (and `clientCardPreload` built from it), `withoutClientPreloads(mutations)`, `expectOnlyClientPreloads(mutations)`. Each exact `toEqual([clientCardPreload])` in card, lift, and setup specs (5 sites) now asserts containment of the card preload and that only client preloads were added. The fixture-app style-mutation test keeps its exact item-link sequence through `withoutClientPreloads` and checks every listed item's preload with `expect.arrayContaining`. setup.spec's single-locator preload/prefetch assertions now filter by href (card count 1, lift count 0), and its preload `load` probe now matches the card href only. New fixture-app.spec tests: E9 on prerendered and server-rendered `/replay`. With JS off, the server prefetches contain every listed item, none for lift or enter, and there is no server style preload. After bootstrap, the client style preloads contain every listed item, none for lift or enter. Each of the 28 stub routes in both render modes gets `watchHydration` (development) plus axe with JS on, and visible stub plus axe with JS off. Each stub test skips itself once the route no longer renders the `data-fixture-stub` marker, so the item tasks that replace stubs (including the negative controls) do not have to edit this spec. Departures row for enter.md:272 (E15) added below the card/lift row of ngx-yeti-specs SKILL.md. Prettier was run. The `itemLinks` exact arrays on the card route are left to T025.
- 2026-10-10 — Verify (run in the worktree): `npm ci` ok; `npx playwright install chromium` ok; both `test -f` ok; `nx run-many -t lint typecheck -p yeti-app yeti-app-e2e` passed; `nx e2e yeti-app-e2e` (development, Chromium) 200 passed / 2 skipped; `FIXTURE_CONFIGURATION=production nx e2e yeti-app-e2e` 191 passed / 11 skipped (development-only hydration diagnostics); `node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit` exit 0, 200 passed / 2 skipped. Also: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` (uncommitted tree) passed. VERIFY: PASS.
- 2026-10-10 — orchestrator Verify (isolate gsd-path-task/T002): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
