---
id: T009
title: Ship breakout and timeline with the A11Y-10c and A11Y-10a contrast assertions
wave: 3
deps: [T001, T002]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/breakout/README.md
  - packages/ngx-yeti/breakout/src/index.ts
  - packages/ngx-yeti/breakout/src/breakout.ts
  - packages/ngx-yeti/breakout/src/breakout-child.ts
  - packages/ngx-yeti/breakout/src/breakout-note.ts
  - packages/ngx-yeti/breakout/src/breakout-tokens.ts
  - packages/ngx-yeti/breakout/src/breakout.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.ssr.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.contract.node.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.stories.ts
  - packages/ngx-yeti/timeline/README.md
  - packages/ngx-yeti/timeline/src/index.ts
  - packages/ngx-yeti/timeline/src/timeline.ts
  - packages/ngx-yeti/timeline/src/timeline.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.ssr.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.contract.node.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.stories.ts
  - apps/yeti-app/src/app/fixtures/breakout-fixture.ts
  - apps/yeti-app/src/app/fixtures/timeline-fixture.ts
  - apps/yeti-app-e2e/src/breakout.spec.ts
  - apps/yeti-app-e2e/src/timeline.spec.ts
  - apps/ngx-yeti-e2e/src/breakout.spec.ts
  - apps/ngx-yeti-e2e/src/timeline.spec.ts
  - docs/specs/ledger.md
  - packages/ngx-yeti/accessibility.css
  - packages/ngx-yeti/src/accessibility.node.spec.ts
---

# T009 — Ship breakout and timeline with the A11Y-10c and A11Y-10a contrast assertions

## Context

Two layouts whose ledger rows are exact-formula contrast assertions axe leaves incomplete: `breakout` (docs/specs/specs/breakout.md; `YetiBreakout`, `YetiBreakoutChild` with `bleed`, `YetiBreakoutNote`; A11Y-10c) and `timeline` (docs/specs/specs/timeline.md; `YetiTimeline` on an `ol` only; A11Y-10a). Both rows add a package rule only if the assertion fails (ledger.md:41, :43; INTENT E7), so this task also holds `packages/ngx-yeti/accessibility.css` and `docs/specs/ledger.md` for that case. Timeline's screen-reader claim (timeline.md:326) is SC9's and lands in T027; the timeline-inside-a-cluster measurement (timeline.md:316) lands with cluster (T012).

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
- Breakout (breakout.md:254-299): stories `breakout--default` (A11Y-10c: the heading, paragraph, and note at least 4.5:1, exact formula; tree order equals DOM order), `breakout--dark-scheme` (the same in the dark scheme), `breakout--settings`, `breakout--note` (the container resized past and below 64rem), `breakout--heading-rhythm`. Layer 2: a static `max="lg"` keeps the inert `max` beside `data-max`; parts acquire nothing. Contract: `data-max`, `data-gap`, markers `data-bleed` and `data-note`. Storybook half (breakout.md:288): container widths 1000, 600, and 400 px against Yeti's `breakout.spec.js`; 320 px with no overflow. Fixture half: the standard cases.
- Timeline (timeline.md:280-330): stories `timeline--default` (role `list` of three entries; A11Y-10a contrast of the `time` text after the dot-overlap check), `timeline--single`, `timeline--narrow`, `timeline--dark-scheme`, `timeline--inputs`, `timeline--links` (Tab order), `timeline--rtl`. Layer 2: `alternate` as `''` through `booleanAttribute`; a `ul yetiTimeline` gets nothing (the selector is `ol` only); the package writes no role (timeline.md:336, N4). Layer 3: the consumer's `role="list"` kept, `li` children with `time[datetime]`. Storybook half (timeline.md:316): `timeline--narrow` resizes the container, not the viewport, across the threshold in three engines and asserts single-sided and alternate geometry; `timeline--links` presses Tab in each engine and asserts source order. Fixture half: the standard cases; JavaScript off the rail and dots land where they do with JavaScript on; 320 px single-sided with no overflow.
- E7 for this task's rows: a failing exact-formula assertion of A11Y-10a or A11Y-10c brings one package rule inside the existing `@layer ngx-yeti` block of `packages/ngx-yeti/accessibility.css` (system colours or Yeti's public tokens only, no `--_yeti-*` token, no package class in a selector; setup.md:330), the ledger row's Package column updated to name it, and `packages/ngx-yeti/src/accessibility.node.spec.ts` extended if the rule needs a check; while the assertions pass, add nothing and leave those files untouched. Record the measured ratios in the Log either way.

## Interface contract

- Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it.
- Fixture key `breakout` → `BreakoutFixture` in `apps/yeti-app/src/app/fixtures/breakout-fixture.ts`.
- Fixture key `timeline` → `TimelineFixture` in `apps/yeti-app/src/app/fixtures/timeline-fixture.ts`.

## Intent coverage

- SC1
- SC2
- SC3
- SC4

## Acceptance criteria

1. Every breakout and timeline story passes its play function and the axe gate, including A11Y-10c's and A11Y-10a's exact-formula contrast assertions in the light and dark schemes; E7: a failing assertion brought one `@layer ngx-yeti` rule and a ledger update, or (while passing) nothing was added, with the measured ratios in the Log.
2. `apps/ngx-yeti-e2e/src/breakout.spec.ts` and `apps/ngx-yeti-e2e/src/timeline.spec.ts` pass in Chromium, Firefox, and WebKit, with the container resized and each spec's engine limits.
3. `/sub/breakout`, `/sub/server/breakout`, `/sub/timeline`, and `/sub/server/timeline` pass the standard Fixture cases with JavaScript on and off, in development and production.
4. The layer-2, layer-3, and contract specs of both items pass, including parts that acquire nothing (E13), the `ol`-only timeline selector, and no package-written role.
5. Each directive's JSDoc carries the spec's numbered usage rules.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/breakout/src/breakout.spec.ts && test -f packages/ngx-yeti/timeline/src/timeline.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- breakout/src timeline/src src/accessibility && npm exec nx -- test-storybook ngx-yeti -- breakout/src timeline/src && npm exec nx -- e2e ngx-yeti-e2e -- breakout.spec.ts timeline.spec.ts && npm exec nx -- e2e yeti-app-e2e -- breakout.spec.ts timeline.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- breakout.spec.ts timeline.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox breakout.spec.ts timeline.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox breakout.spec.ts timeline.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit breakout.spec.ts timeline.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit breakout.spec.ts timeline.spec.ts
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
