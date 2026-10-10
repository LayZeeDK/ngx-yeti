---
id: T015
title: Ship layer and overlay with A11Y-10b's scrim contrast
wave: 3
deps: [T001, T002, T003, T009]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/layer/README.md
  - packages/ngx-yeti/layer/src/index.ts
  - packages/ngx-yeti/layer/src/layer.ts
  - packages/ngx-yeti/layer/src/layer-child.ts
  - packages/ngx-yeti/layer/src/layer-tokens.ts
  - packages/ngx-yeti/layer/src/layer.spec.ts
  - packages/ngx-yeti/layer/src/layer.ssr.spec.ts
  - packages/ngx-yeti/layer/src/layer.contract.node.spec.ts
  - packages/ngx-yeti/layer/src/layer.stories.ts
  - packages/ngx-yeti/overlay/README.md
  - packages/ngx-yeti/overlay/src/index.ts
  - packages/ngx-yeti/overlay/src/overlay.ts
  - packages/ngx-yeti/overlay/src/overlay-child.ts
  - packages/ngx-yeti/overlay/src/overlay-tokens.ts
  - packages/ngx-yeti/overlay/src/overlay.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.ssr.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.contract.node.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.stories.ts
  - apps/yeti-app/src/app/fixtures/layer-fixture.ts
  - apps/yeti-app/src/app/fixtures/overlay-fixture.ts
  - apps/yeti-app-e2e/src/layer.spec.ts
  - apps/yeti-app-e2e/src/overlay.spec.ts
  - apps/ngx-yeti-e2e/src/layer.spec.ts
  - apps/ngx-yeti-e2e/src/overlay.spec.ts
  - docs/specs/ledger.md
  - packages/ngx-yeti/accessibility.css
  - packages/ngx-yeti/src/accessibility.node.spec.ts
---

# T015 — Ship layer and overlay with A11Y-10b's scrim contrast

## Context

`layer` (docs/specs/specs/layer.md; `YetiLayer`, `YetiLayerChild`, `yetiLayerToken`) stacks children in one grid cell and owns ledger row A11Y-10b: its figure caption over an image sits on a scrim (`layer.css:24-34`, though the manifest says the layer adds none, upstream Y11), asserted by exact formula against the scrim composited on black and on white (ticket 50 decision 55). `overlay` (docs/specs/specs/overlay.md; `YetiOverlay`, `YetiOverlayChild`, `yetiOverlayToken`) places a child over another, with a veil form. A11Y-10b adds a package rule only if it fails (INTENT E7), so this task holds the accessibility stylesheet and ledger after T009 in this wave. Layer's `align` is removed-kind (T003).

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
- Shared files: do not edit `tools/package/consumer/consumer.ts`, `packages/ngx-yeti/src/name-collision.node.spec.ts`, `packages/ngx-yeti/src/item-names.node.spec.ts`, `packages/ngx-yeti/README.md`, `packages/ngx-yeti/CHANGELOG.md`, `apps/yeti-app/src/app/fixtures/fixtures.ts`, `apps/yeti-app/src/app/app.config.ts`, or `docs/specs/upstream-bugs.md`: the wave's registry task owns them and runs after this task. Write any upstream bug you find as a Log line that starts `UPSTREAM:` with its reproduction, engine, and versions; the registry task turns it into a ledger row (never filed upstream).
- Layer (layer.md:251-295): stories `layer--default` (A11Y-10b: the caption at least 4.5:1 against the scrim composited on `#000` and on `#fff`), `layer--dark-scheme`, `layer--badge` (`yetiPaint="primary"`, not `yetiBadge`), `layer--settings`. Layer 2: the standard cases for both directives; a static `align` removed per T003's verdict. Layer 3: a static `align="end"` absent. Storybook half (layer.md:283): container 600 and 400 px against Yeti's `layer.spec.js`; 320 px. Fixture half (layer.md:285-291): the standard cases; a static `align` absent in every painted frame (`recordPaintedAttributes`). card's `card--layer-caption` composite is the card task's (T025).
- Overlay (overlay.md:281-332): stories `overlay--default` (contrast in both schemes), `overlay--settings`, `overlay--veil` (an inert covered input; the scrim's contrast composited on black and white), `overlay--fixed`, `overlay--scrolls` (the scroll region passes axe's `scrollable-region-focusable`), `overlay--rtl`. No package `inert`, `aria-hidden`, or live region on overlay content (overlay.md:337). Upstream Y10: Yeti's docs write the veil as `class="cover" data-over data-fill`, and `.cover`'s `min-block-size: 100dvh` makes it viewport-tall over a small form; do not copy that snippet as written. Layer 2: the standard cases; a static `fill` on `p` and `svg` is inert; `yetiStack yetiOverlayChild fill` renders one `data-fill`. Storybook half (overlay.md:315-321): at 1280 x 800 and 320 x 640, centring, fill, fixed before and after scroll, RTL, 320 px, 200 % zoom scrolls rather than clips, and on the veil Tab never reaches a covered control. Fixture half: the standard cases.
- E7 for A11Y-10b: a failing exact-formula assertion brings one rule inside the existing `@layer ngx-yeti` block of `packages/ngx-yeti/accessibility.css` (no `--_yeti-*` token, no package class in a selector; setup.md:330), the ledger row's Package column updated, and `packages/ngx-yeti/src/accessibility.node.spec.ts` extended if needed; while it passes, add nothing. Record the ratios in the Log either way.

## Interface contract

- Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it.
- Fixture key `layer` → `LayerFixture` in `apps/yeti-app/src/app/fixtures/layer-fixture.ts`.
- Fixture key `overlay` → `OverlayFixture` in `apps/yeti-app/src/app/fixtures/overlay-fixture.ts`.
- Static attributes (T003): a removed-kind static attribute (ticket 50 decision 9) is a signal input named as the attribute, rendered on its `data-*` attribute, and removed from the host by the host binding `'[attr.{name}]': 'null'`. T003's Log holds one line `E8 verdict: pass` or `E8 verdict: fail`. On pass, the static form stays as the specs write it; on fail, every removed-kind input becomes bound-only as cluster.md:309 and icon.md:302 state, and the static-form story and test cases are dropped.
- `apps/yeti-app-e2e/src/support/style-probe.ts` exports `recordPaintedAttributes(page: Page, selector: string, attributes: readonly string[]): Promise<() => Promise<readonly string[]>>`, called before `goto`: an init-script MutationObserver plus a requestAnimationFrame probe; the returned function lists one entry `{element} {attribute}` for each animation frame in which an element matching `selector` carried one of `attributes`, so an empty list means no painted frame showed them.

## Intent coverage

- SC1
- SC2
- SC3
- SC4

## Acceptance criteria

1. Every layer and overlay story passes its play function and the axe gate, including A11Y-10b's exact-formula caption contrast against the scrim composited on black and on white in both schemes; E7 handled as stated (a rule and ledger update only if the assertion fails), with the ratios in the Log.
2. `apps/ngx-yeti-e2e/src/layer.spec.ts` and `apps/ngx-yeti-e2e/src/overlay.spec.ts` pass in Chromium, Firefox, and WebKit, including the 200 % zoom and the veil's Tab case.
3. `/sub/layer`, `/sub/server/layer`, `/sub/overlay`, and `/sub/server/overlay` pass the standard Fixture cases and the layer `align` frame check (or the bound-only form after an `E8 verdict: fail`).
4. The layer-2, layer-3, and contract specs of both items pass, with no package `inert`, `aria-hidden`, or live region on overlay content.
5. Each directive's JSDoc carries the spec's numbered usage rules.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/layer/src/layer.spec.ts && test -f packages/ngx-yeti/overlay/src/overlay.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- layer/src overlay/src src/accessibility && npm exec nx -- test-storybook ngx-yeti -- layer/src overlay/src && npm exec nx -- e2e ngx-yeti-e2e -- layer.spec.ts overlay.spec.ts && npm exec nx -- e2e yeti-app-e2e -- layer.spec.ts overlay.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- layer.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox layer.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox layer.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit layer.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit layer.spec.ts overlay.spec.ts
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
