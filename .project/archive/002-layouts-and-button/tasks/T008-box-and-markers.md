---
id: T008
title: Ship box with its three markers and complete the box compositions of stack and center
wave: 2
deps: [T001, T002, T007]
status: done
agent: build_T008
base: 6e7a7b2ac47d3c9f2b81f49cb0f3e30cdca5dfe0
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/box/README.md
  - packages/ngx-yeti/box/src/index.ts
  - packages/ngx-yeti/box/src/box.ts
  - packages/ngx-yeti/box/src/box-border.ts
  - packages/ngx-yeti/box/src/box-paint.ts
  - packages/ngx-yeti/box/src/box-text.ts
  - packages/ngx-yeti/box/src/box.spec.ts
  - packages/ngx-yeti/box/src/box.ssr.spec.ts
  - packages/ngx-yeti/box/src/box.contract.node.spec.ts
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/center/src/center.spec.ts
  - apps/yeti-app/src/app/fixtures/box-fixture.ts
  - apps/yeti-app/src/app/fixtures/center-fixture.ts
  - apps/yeti-app-e2e/src/box.spec.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - tools/package/consumer/consumer.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
---

# T008 — Ship box with its three markers and complete the box compositions of stack and center

## Context

`box` (docs/specs/specs/box.md) is the padded surface most layouts compose, with three any-element markers: `yetiBorder` (`YetiBorder`), `yetiPaint` (`NgxYetiPaint`, an ADR 0080 rename), and `yetiText` (`YetiText`). It owns ledger row A11Y-21 (contrast on painted bands). Stack's and center's specs compose it: `stack--default` puts `yetiBox` on every child, `center--with-box` and `center--default` hold boxes, and center's ledger row A11Y-9 (a 2 px overflow at 320 px) is shown on Yeti's bordered composition, so this task completes those cases in T007's files. INTENT Constraints: box's `yetiText` stories split by a measured contrast pass (box.md:282, ticket 50 decision 31), measured before the stories are written.

## Approach

- Records and skills: read the item spec's API, Implementation Decisions, and Testing Decisions sections in full (under `docs/specs/specs/`), the records its header names, and its rows in `docs/specs/ledger.md`. Follow `.claude/skills/ngx-yeti-specs/SKILL.md` (its Departures table wins over the records), `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`. The card item is the pattern for every file: `packages/ngx-yeti/card/src/card.ts`, `packages/ngx-yeti/card/src/card.spec.ts`, `packages/ngx-yeti/card/src/card.ssr.spec.ts`, `packages/ngx-yeti/card/src/card.contract.node.spec.ts`, `packages/ngx-yeti/card/src/card.stories.ts`, `apps/yeti-app/src/app/fixtures/card-fixture.ts`, `apps/yeti-app-e2e/src/card.spec.ts`, and `apps/ngx-yeti-e2e/src/card.spec.ts`.
- Entry point: T001 generated it. Fill its index.ts (classes, tokens, and package types; no import array, ADR 0018) and rewrite its README.md as `packages/ngx-yeti/card/README.md` reads. Never run the generator again and never edit tsconfig.base.json. Import another entry point by its package path (`ngx-yeti/box`), never by a relative path.
- Directive rules (binding records): only the item's root directive sets `data-ngx-yeti-item-{item}` and calls `injectYetiItemStyles('{item}')`, as the last statement of its constructor (ticket 50 decisions 6, 7, and 42); part, child, and any-element marker directives set no presence attribute and acquire no item file (E13). An unset input renders nothing: no directive writes Yeti's default value (ADR 0070:20). No host listener, ResizeObserver, JavaScript size read, breakpoint or viewport input, feature detection, or role beyond Yeti's (N4); the only package-written roles are scroller's static `role="region"` with `tabindex="0"` and `YetiButtonDisabledLink`'s `role="link"` with `aria-disabled`. No `@defer` in package templates, no `ngSkipHydration`, no Shadow DOM (ADR 0011 points 10 and 11), and no `animate.enter` (ADR 0010). An input name another package directive also declares (`gap` on 21 items, `align` on 8, `sticky` on three parts) uses the same exported type, such as `YetiGap` and `YetiAlign` from `ngx-yeti` (E14, building-blocks.md:53). No package CSS for a layout beyond a failing ledger assertion (each spec's Out of Scope).
- Usage rules: number them in the directive's JSDoc exactly as the spec's API section numbers them (CONTEXT.md:308; `packages/ngx-yeti/card/src/card.ts` line 10 is the pattern). Every rule that states package behaviour gets a test in this task (LESSONS.md).
- Stories (layer 1): `meta.id` is the item name and the story ids are the spec's; every story passes its play function and the axe gate. Prohibition N1 (judgment): must not reach a green axe gate by switching off rules or hiding content from assistive technology; no story disables an axe rule except a documented anti-pattern exception under the ngx-yeti-stories skill, and no fix adds aria-hidden, role=presentation, inert, or visually-hidden to content a user needs. A CSS `:hover` assertion the spec puts in a play function goes in layer 2 (pattern: `packages/ngx-yeti/lift/src/lift.spec.ts` lines 100 to 128, `userEvent.hover` from `vitest/browser`) or layer 4 (Departures row, ngx-yeti-specs SKILL.md:37). Contrast uses `contrastRatio` and `composite` from `@ngx-yeti/testing`, unrounded, 4.5:1 for text and 3:1 for a non-text part, in the light and the dark scheme (`withColorScheme('dark')`; ticket 50 decision 8), and never a token's text or default (ADR 0006:25): compare with probe elements that read the public token. A size-dependent change resizes the container, not only the viewport (building-blocks.md:96). Every static `img` uses `NgOptimizedImage` (building-blocks.md:35). No story or fixture writes a Yeti class, a Yeti `data-*` attribute, a presence attribute, or a static attribute on an attribute a directive binds (building-blocks.md:347; ADR 0003).
- Layers 2 and 3: the standard cases of every spec — class and presence attribute; inputs set through `bindings` render their `data-*` attribute and `undefined` removes it after `whenStable()`; one `link[data-ngx-yeti-styles]` for the item while a fixture lives, gone one frame after destroy, and two fixtures share one link until both are destroyed (E3); parts and markers acquire nothing (E13); no listener on the host; a small test host for template references, the consumer's own `class`, static forms, and same-element compositions. `{item}.ssr.spec.ts` renders through `renderServer()` with one `i18n` text and asserts the class, presence attribute, bound attributes, exactly one item link with `data-beasties-skip` and an `href` ending `{kind}/{item}/{item}.css?v=` and the pin, and no package `jsaction`. `{item}.contract.node.spec.ts` calls `checkContract` and pairs each `values` list with an `expectTypeOf` line, which only `nx typecheck` checks.
- Fixture route (layer 4): replace the T002 stub component(s) the Interface contract names; keep one `i18n` text and a server-rendered `routerLink`, so `waitForHydration` has a marker. Loop `routeKinds` so every case runs on `/sub/{key}` and `/sub/server/{key}`, with JavaScript on and off: `watchHydration` (no `NG05xx`, 0 skipped components, development build); with JavaScript off the item is styled and the `axeViolations` fixture finds nothing on `wcagTags`; a client-only `@defer` holding the item, which is in the preload list, paints 0 unstyled frames in the development run, while the production run records A4-affected frames as annotations (LESSONS.md; Departures row SKILL.md:40); a `hydrate never` host stays styled after `removeEveryHost`; leaving for `/replay` removes the item link and returning re-inserts it; no horizontal overflow at 320 px where the spec says so. Assert item links and preload hrefs by containment (`expect.arrayContaining`), never as an exact array, unless the order itself is the claim (E9, LESSONS.md). Prohibition N3 (judgment): must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable.
- Recorded cases: Prohibition N2 (judgment): must not turn a recorded-only case into a pass or fail assertion, or drop it; every case the spec marks "record" is measured and written down as a Playwright annotation (`test.info().annotations`), not asserted, and a recorded result that crosses its record's threshold triggers the follow-up of E7.
- Engines and upstream bugs: wait for the item sheet before any geometry or colour read (`expectItemSheetsApplied` in `apps/ngx-yeti-e2e/src/item-styles.ts`, `itemSheetsLoaded` in `apps/yeti-app-e2e/src/support/style-probe.ts`), because of upstream O2's stale computed style after a stylesheet insertion; a layer-2 size read must also hold in stock Firefox 145, which needs the global stylesheet with the A11Y-30 workaround (upstream O3; `packages/ngx-yeti/lift/src/lift.spec.ts` lines 43 to 59 load it); real Safari in the `safari` job reports reduced motion, so no layer-2 test asserts an animation; forced-colours e2e checks run in Chromium and Firefox and skip in WebKit with the Departures reason (SKILL.md:43); Tab-to-link tests skip WebKit outside Linux with `skipUnlessTabReachesLinks` from `apps/ngx-yeti-e2e/src/tab-to-links.ts`; 200 % text zoom sets the root font size to 200 % (`apps/ngx-yeti-e2e/src/card.spec.ts` line 137).
- Cross-milestone stand-ins: where a case composes an item of a later milestone, build its M002 part with plain HTML in the partner's place (no partner directive, no hand-written Yeti class) and assert every M002 assertion of it; the partner-dependent assertions are not written (INTENT Scope out). Where a case composes an M002 item that lands in a later task, leave it to the task named in Approach.
- Cross-engine before hand-back: run this task's e2e specs in Firefox and WebKit through `node tools/ci-local/run-job.mjs ci e2e` (the Verify does). M001 landed on main with a Firefox focus failure and a real-Safari hover failure that a Chromium-only run missed.
- Box (box.md:269-319): `YetiBox` in `box.ts` (`gap`, `gapInline`, `gapBlock`, `surface`), the markers in `box-border.ts`, `box-paint.ts`, and `box-text.ts`. Markers set no class, no presence attribute, and acquire no link (E13; ADR 0045:35); `yetiBorder` takes a static bare attribute as `true` through `booleanAttribute`.
- Measure first: before writing `box--text`, measure with the play function's formula which `yetiText` values clear 4.5:1 on the page surface in both schemes, and write the values and ratios into the Log; passing values go in `box--text`, failing ones in `box--anti-pattern-low-contrast` (only axe's `color-contrast` switched off, labelled as what not to write). The spec states no list.
- Stories: `box--default`, `box--gaps`, `box--surfaces` (light and dark wrapper), `box--border-anywhere` (no `box.css` link while only markers are on the story), `box--paint` (exact ratio of each band's words at least 4.5:1 in both schemes; A11Y-21; a plain link in the `primary` band takes the band's colour; the band's button focus-ring case waits for `yetiButton`, which the button task adds), `box--text`, `box--composed` (`yetiCenter yetiBox gap="lg"` and Yeti's docs panel holding a `yetiStack`: one `data-gap`), `box--anti-pattern-low-contrast`. Values come from probes reading public tokens (box.md:271).
- Layer 2 (box.md:286-297): the standard cases, the markers' attribute and no-acquisition cases, and `yetiBox` beside `yetiCenter` with one `gap` binding rendering one `data-gap` with one exported type (E14). Layer 3: a markers-only fixture writes no item link.
- Fixture half (box.md:305-315): the standard cases; JavaScript off the padding, fill, border, and a band's colours match their probes; at 320 px a box with `gap="3xl"` causes no overflow; `/sub/box-markers` (fill `BoxMarkersFixture`) "loads no `box.css`", asserted as no `box` item link and no applied `box.css` sheet (box stays in the preload list for its `@defer` case, and a preload hint is not a loaded stylesheet); under `emulateMedia({ forcedColors: 'active' })` a `yetiBorder` box keeps a visible border, recorded in Chromium and Firefox (WebKit skipped by the Departures row); printed with `page.pdf()` in Chromium only, a painted band keeps `print-color-adjust: exact`. Box's spec names no Storybook-half case.
- Compositions of earlier specs, completed here: `stack--default` gets `yetiBox` on each child (stack.md:286) in `packages/ngx-yeti/stack/src/stack.stories.ts`; in `packages/ngx-yeti/center/src/center.stories.ts`, `center--default` gets its inner bordered box, `center--with-box` is added (one `data-gap="lg"` set by both directives), and A11Y-9's anti-pattern story `center--anti-pattern-bordered` is added: Yeti's composition with the border on the center's own element, labelled as what not to write, which switches off no axe rule unless axe flags the overflow, and then only under the ngx-yeti-stories anti-pattern exception (ledger.md:40); `packages/ngx-yeti/center/src/center.spec.ts` gains the `section yetiCenter yetiBox gap="lg"` test host with one `data-gap`. In `apps/yeti-app-e2e/src/center.spec.ts`, at 320 px `scrollWidth` equals the viewport width for center alone, with `intrinsic`, with `yetiBox`, and with section 8's bordered box inside (A11Y-9, asserted), and fill `CenterAntiPatternFixture` with Yeti's bordered composition: label it as what not to write, record its `scrollWidth` against the viewport (center.md:288), and keep it out of the axe and no-mismatch checks (INTENT SC3 negative-control exemption).
- Registries, owned by this task after T007 in this wave: the consumer imports `YetiBox` from `ngx-yeti/box`; the name-collision positive list gains every box export; `packages/ngx-yeti/src/item-names.node.spec.ts` gains `packages/ngx-yeti/box/src/box.ts`; the README table and status line and the changelog name box.

## Interface contract

- Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it.
- Fixture key `box` → `BoxFixture` and key `box-markers` → `BoxMarkersFixture`, both in `apps/yeti-app/src/app/fixtures/box-fixture.ts`.
- Fixture key `center` → `CenterFixture` and key `center-anti-pattern` → `CenterAntiPatternFixture`, both in `apps/yeti-app/src/app/fixtures/center-fixture.ts`.

## Intent coverage

- SC1
- SC3
- SC4
- SC5

## Acceptance criteria

1. Every box story passes its play function and the axe gate, with A11Y-21's exact-formula ratios at least 4.5:1 in both schemes, `box--text` and `box--anti-pattern-low-contrast` split by the measured pass recorded in the Log; `stack--default` with its boxes, `center--default`, `center--with-box`, and `center--anti-pattern-bordered` (A11Y-9's anti-pattern story) pass too.
2. `/sub/box`, `/sub/server/box`, and `/sub/box-markers` pass the standard Fixture cases and box.md's layer-4 cases (markers-only route has no `box` item link and no applied `box.css`; forced-colours border and print case recorded), and the center route's A11Y-9 case passes at 320 px while `/sub/center-anti-pattern` records its overflow, labelled and exempt from the axe and no-mismatch checks.
3. E13: `packages/ngx-yeti/box/src/box.spec.ts` asserts that `YetiBorder`, `NgxYetiPaint`, and `YetiText` set no class, no presence attribute, and no item link (only the root `YetiBox` marks its host and acquires `box`); the other box layer-2, layer-3, and contract cases pass, and `yetiBox` beside `yetiCenter` renders one `data-gap` with one exported type.
4. `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports `YetiBox` from `ngx-yeti/box`, and box's contract check passes over the built manifest.
5. The README and changelog name box, and every box directive's JSDoc carries the spec's numbered usage rules.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/box/src/box.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- box/src center/src src/name-collision src/item-names && npm exec nx -- test-storybook ngx-yeti -- box/src stack/src center/src && npm exec nx -- e2e yeti-app-e2e -- box.spec.ts center.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- box.spec.ts center.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox box.spec.ts center.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit box.spec.ts center.spec.ts && npm exec nx -- run ngx-yeti:pack-check; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — coder: preflight clean (every named path exists or is declared; SC1, SC3, SC4, SC5 exist; the Interface contract lines match T001, T002, and T007). Resumed after the session limit; no earlier product edit existed.
- 2026-10-11 — coder: measured before writing `box--text`, with the stories' formula (`contrastRatio`, computed colours, page surface of a `color-scheme` wrapper), Chromium, light / dark: primary 5.323 / 7.556, secondary 5.693 / 7.131, success 4.997 / 7.972, warning 5.390 / 7.404, alert 5.749 / 7.046, neutral 5.314 / 7.543, grey-60 6.146 / 5.317, grey-70 8.811 / 7.265, grey-80 12.334 / 9.721, grey-90 16.144 / 12.744, grey-100 19.012 / 16.392 (pass, in `box--text`); white 1.034 / 20.111, black 20.304 / 1.044, grey 4.407 / 4.412, grey-0 1.000 / 1.000, grey-10 1.277 / 1.136, grey-20 1.674 / 1.427, grey-30 2.242 / 1.932, grey-40 3.072 / 2.709, grey-50 4.307 / 3.818 (fail, in `box--anti-pattern-low-contrast`). Band override in `box--text`: `yetiPaint="primary" yetiText="grey-0"` 5.323 / 7.556.
- 2026-10-11 — coder: implemented `YetiBox`, `YetiBorder`, `NgxYetiPaint`, `YetiText` (usage rules 1 to 7 in `YetiBox`'s JSDoc; each marker carries the rules that concern it, same numbers), index and README; `box.spec.ts` (standard cases, E13 for all three markers, static bare `yetiBorder`, four template refs, consumer class, `yetiBox` beside `yetiCenter` with one `data-gap` and an `expectTypeOf` that both `gap` inputs share one type), `box.ssr.spec.ts` (markers-only fixture writes no link), `box.contract.node.spec.ts`; stories `box--default|gaps|surfaces|border-anywhere|paint|text|composed|anti-pattern-low-contrast` (only `color-contrast` off in the anti-pattern). `stack--default` boxes on every child; `center--default` inner bordered box, `center--with-box`, `center--anti-pattern-bordered` (axe flags nothing, so no rule off); `center.spec.ts` `section yetiCenter yetiBox gap="lg"` host. Fixtures `BoxFixture`, `BoxMarkersFixture`, `CenterAntiPatternFixture` (labelled, visible heading "What not to write"), center route gains `#box-center` and `#bordered-center`; `box.spec.ts` e2e and `center.spec.ts` additions (320 px waits for the box sheet too; anti-pattern route out of axe and hydration checks). Registries: consumer imports all four box exports, name-collision and item-names lists, README table and status, CHANGELOG.
- 2026-10-11 — coder: recorded cases (annotations, Chromium dev): forced-colours border on `#live-box` `solid 1px rgb(0, 0, 0)`; A11Y-9 anti-pattern `scrollWidth 322` at a 320 px viewport (prerendered and server-rendered), as ledger.md:40 states. Print `print-color-adjust: exact` is asserted (box.md:315 says asserted). Choices: the client-only `@defer` box asserts 0 unpadded frames in development and records them as `a4-frames` in production (Approach); usage rules 3 (no table yet), 6 (Yeti's CSS on classed links), and 7 (forgotten import, Angular's behaviour) have no test: no `table` exists, a classed link in a band would fail the axe gate, and no compile-fixture path is in `files`. Paint band's button focus-ring case waits for `yetiButton` (Approach).
- 2026-10-11 — coder: Verify run as written, exit 0 (`VERIFY EXIT 0`). lint and typecheck 4 projects pass; `nx test` 8 files, 41 tests; `test-storybook` 3 files, 21 stories; `yeti-app-e2e` box and center: development Chromium 54 passed; production Chromium 48 passed, 6 skipped (hydration diagnostics are development-only); Firefox container 52 passed, 2 skipped; WebKit container 50 passed, 4 skipped (forced colours and print); `pack-check` passes. Also green before Verify: `npx prettier --check .`. One `npm warn cleanup EPERM` during `npm ci` (a leftover nested `@types/node` folder), not a failure.
- 2026-10-10 — orchestrator Verify (isolate gsd-path-task/T008): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
