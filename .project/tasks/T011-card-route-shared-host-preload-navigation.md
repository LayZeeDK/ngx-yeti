---
id: T011
title: Extend the card Fixture route with lifted cards, the hydrate-never shared host, the preload case, and route navigation
wave: 2
deps: [T005, T006, T007]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/app/fixtures/card-fixture.ts
  - apps/yeti-app-e2e/src/card.spec.ts
---

# T011 — Extend the card Fixture route with lifted cards, the hydrate-never shared host, the preload case, and route navigation

## Context

card.md:332-339 asks the card Fixture route to render section 8's markup and a grid of cards with `yetiLift`, and lists cases the wave-1 route does not cover yet: the shared-host case of ADR 0045 (a `card` with `lift` inside `@defer (hydrate never)` keeps both item links after every live card and lift has left, still lifts on hover, and keeps its border); a card inside a client-only `@defer` with `card` in the preload list shows no unstyled frame; the `NgOptimizedImage` development-mode console output for a cropped picture and for the row form is recorded; and navigating from the card route to a route without a card removes the card link while navigating back re-inserts it. INTENT.md SC2 names the shared host, the preloaded client-only `@defer`, and the leave-and-return navigation. In M001 the grid of cards is a plain `ul role="list"` (its `yetiGrid` arrives in M002). The Fixture app preloads `card` and leaves `lift` out (wave-2 Fixture task), so "without preload" frames for the card itself cannot be measured in this build and are not part of this task.

## Approach

- Extend `apps/yeti-app/src/app/fixtures/card-fixture.ts` without changing what the wave-1 route asserts (section 8's card, its heading text, its `i18n` paragraph, its stretched link): add a plain `ul role="list"` of `li` cards with `yetiCard`, `yetiLift`, and `raised`, each with a stretched heading link; a `card` plus `lift` host inside `@defer (hydrate never)`; a control that removes every live card and lifted card; a client-only `@defer (on interaction)` block holding a card; and a stretched-link or plain `routerLink` to a Fixture route that renders no card (for example `/sub/replay`). Import `NgxYetiLift` from `'ngx-yeti/lift'`.
- Extend `apps/yeti-app-e2e/src/card.spec.ts` (keep its wave-1 tests) with, on both route kinds where they apply: the shared host keeps the card and lift links after the removal, lifts on hover (real mouse), and keeps its border; with item CSS delayed 300 ms the preloaded client-only card as AC3 states (style probe `recordFrames`); the `NgOptimizedImage` console messages for the cropped picture and the row form are recorded as annotations in the development build; client navigation to the card-less route removes the card link in the frame after the last host leaves, and navigating back re-inserts it once.
- Wait for the item links before reading geometry (upstream bug O2); hydration diagnostics only in the development build (`isProduction`). Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`.

## Interface contract

- Fixture key `card` in apps/yeti-app/src/app/fixtures/fixtures.ts maps to `CardFixture` in apps/yeti-app/src/app/fixtures/card-fixture.ts, served prerendered at `/sub/card` and server-rendered at `/sub/server/card`; it renders card.md section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton`, an `h3` whose link carries `yetiCardLink stretch` and the text `Weekend in the hills`, and the `i18n` paragraph `Six miles, one summit, and a view worth the early start.`
- apps/yeti-app-e2e/src/support/style-probe.ts exports `recordStyleMutations(page: Page): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists one entry per `link` or `style` element added to or removed from the document after `DOMContentLoaded`; `recordFrames(page: Page, selector: string, property: string): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists the computed value of `property` on the first element matching `selector` in every animation frame from the first one, `''` while nothing matches; and `itemLinks(page: Page): Promise<readonly string[]>`, the `data-ngx-yeti-styles` values of the item links in the head in document order.
- apps/yeti-app/src/app/app.config.ts calls `provideYetiStyles({ preload: ['card'] })` once in the root providers: `card` is the preloaded item and `lift` is left out of the preload list.
- ngx-yeti/lift exports `NgxYetiLift`: selector `[yetiLift]`, exportAs `yetiLift`, input `yetiLift: YetiLift | ''` where unset and `''` render no `data-lift`; host: static class `lift`, static `data-ngx-yeti-item-lift=""`, `data-lift` from the input; acquires the `lift` item file.

## Intent coverage

- SC2

## Acceptance criteria

1. The card route still meets every wave-1 assertion and now also renders a `ul role="list"` of lifted cards, a `card` plus `lift` host inside `@defer (hydrate never)`, a client-only `@defer` card, and a link to a card-less route.
2. After every live card and lifted card is removed, the `hydrate never` host keeps both the card and the lift item links, lifts on a real hover, and keeps its border.
3. With item CSS delayed 300 ms, the client-only `@defer` card (preloaded) shows 0 unstyled frames while the route's server-rendered card hosts are still connected, and, after every live and dehydrated card host has left, its re-inserted card link's unstyled frames are recorded as a test annotation (Playwright's `page.route` disables the HTTP cache, so a re-inserted link refetches; the 0-frame preload assertion for an item first rendered by the client is T007's `setup-defer` route, setup.md:341, ADR 0060 point 6).
4. Navigating to the card-less route removes the card item link, and navigating back re-inserts it once; the `NgOptimizedImage` development-mode messages are recorded.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && rg -q 'hydrate never' apps/yeti-app/src/app/fixtures/card-fixture.ts && rg -q -i 'preload' apps/yeti-app-e2e/src/card.spec.ts && npx nx e2e yeti-app-e2e -- card.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
- 2026-10-04 — orchestrator plan-defect repair (AC3 and its Approach bullet): T007's measurement showed that with `page.route` disabling the HTTP cache, a client-only card re-inserted after a route's server-rendered card hosts have left refetches its file and paints about 20 unstyled frames although `card` is preloaded, because the server's link consumed the preload at load. The 0-frame preload assertion applies to an item first rendered by the client (setup.md:341; ADR 0060 point 6) and lives on T007's `setup-defer` route; AC3 here asserts 0 frames while the server hosts are connected and records the re-insertion frames.
