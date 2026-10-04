---
id: T005
title: Serve the card Fixture route and prove the loader adopts the server's links at hydration
wave: 1
deps: [T001, T002]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/app/fixtures/card-fixture.ts
  - apps/yeti-app/src/app/fixtures/fixtures.ts
  - apps/yeti-app/public/trail.svg
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/support/style-probe.ts
---

# T005 — Serve the card Fixture route and prove the loader adopts the server's links at hydration

## Context

Wave-1 blocker 4 of the milestone synthesis is the ADR 0060 loader adopting server-inserted links at hydration: the server writes each item link into the head in Yeti's order, and the client takes them over by `data-ngx-yeti-styles` and `data-ngx-yeti-app` so that no `link` or `style` element is added or removed after `DOMContentLoaded` (ADR 0060 point 5; setup.md:338). INTENT.md SC2 asks for exactly that on the Fixture app's prerendered and server-rendered routes, with JavaScript on and off. This task adds the `card` fixture (card.md section 8's markup with M001's stand-ins), the shared e2e probe that later Fixture-app tasks reuse, and the card route's core layer-4 cases from card.md:332-335. The `highlight` fixture and its assertions stay until the placeholder task moves them onto this route in wave 3; this task does not touch them, the Playwright configs, or `apps/yeti-app/src/app/app.config.ts`.

## Approach

- `apps/yeti-app/src/app/fixtures/card-fixture.ts`: a standalone `CardFixture` (OnPush) rendering card.md section 8's markup: `article yetiCard threshold="xs"`, an `NgOptimizedImage` picture (`apps/yeti-app/public/trail.svg`, `width` and `height` form, alternative text), an `h3` link with `yetiCardLink stretch` and a `routerLink` to a route that exists in the Fixture app, the `i18n` paragraph, and a footer with a plain `span` and a plain link with `tabindex="-1"` to the same destination (stand-ins for `yetiBadge` and `yetiButton`). Add the `card` row to `apps/yeti-app/src/app/fixtures/fixtures.ts`; the existing route builders serve it at `/sub/card` (prerendered) and `/sub/server/card` (server-rendered). Import from `'ngx-yeti/card'`; never write `class="card"` or a `data-*` attribute by hand (setup.md usage rule 7).
- `apps/yeti-app-e2e/src/support/style-probe.ts`: the probe of the contract below, after the style-loading prototype's probe (`docs/specs/prototypes/style-loading/measure/probe.mjs`): an init script installed before the page's scripts that logs every `link` and `style` element added or removed and samples a computed property in each `requestAnimationFrame`.
- `apps/yeti-app-e2e/src/card.spec.ts`, for both route kinds (the `routeKinds` loop of `apps/yeti-app-e2e/src/fixture-app.spec.ts` is the pattern), using `test`, `expect`, `isProduction`, and the `axeViolations` fixture from the support folder and `watchHydration`:
  - JavaScript on: `watchHydration` clean (development build only); 0 `link` or `style` mutations after `DOMContentLoaded`; the head's card link has `rel="stylesheet"`, an `href` ending `components/card/card.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef` relative to `/sub/`, `data-ngx-yeti-styles="card"`, a non-empty `data-ngx-yeti-app`, and `data-beasties-skip`; 0 attribute mutations on the card hosts at hydration; the sampled card padding is never Yeti-less after first paint in Chromium.
  - JavaScript off (`test.use({ javaScriptEnabled: false })`): the card's geometry equals that with JavaScript on at the same viewport width; a real mouse click near the card's bottom-right corner navigates to the stretched link's `href`; `axeViolations()` returns `[]`.
- Pitfalls: upstream bug O2 (wait for the card stylesheet before reading geometry); Angular logs hydration diagnostics in development builds only; a local green run is Chromium only. Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app, helpers, JavaScript-off pattern), `.claude/skills/type-safety/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`.

## Interface contract

- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- Fixture key `card` in apps/yeti-app/src/app/fixtures/fixtures.ts maps to `CardFixture` in apps/yeti-app/src/app/fixtures/card-fixture.ts, served prerendered at `/sub/card` and server-rendered at `/sub/server/card`; it renders card.md section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton`, an `h3` whose link carries `yetiCardLink stretch` and the text `Weekend in the hills`, and the `i18n` paragraph `Six miles, one summit, and a view worth the early start.`
- apps/yeti-app-e2e/src/support/style-probe.ts exports `recordStyleMutations(page: Page): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists one entry per `link` or `style` element added to or removed from the document after `DOMContentLoaded`; `recordFrames(page: Page, selector: string, property: string): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists the computed value of `property` on the first element matching `selector` in every animation frame from the first one, `''` while nothing matches; and `itemLinks(page: Page): Promise<readonly string[]>`, the `data-ngx-yeti-styles` values of the item links in the head in document order.

## Intent coverage

- SC2

## Acceptance criteria

1. The `card` fixture matches the contract and is served at `/sub/card` and `/sub/server/card`; its server HTML carries `class="card"`, `data-threshold="xs"`, and `data-ngx-yeti-item-card` on the `article`, `data-stretch` on the heading link, and the card item link in the head.
2. On both routes with JavaScript on, `apps/yeti-app-e2e/src/card.spec.ts` proves a clean hydration (no `NG05xx`, `componentsSkippedHydration === 0`, development build), 0 `link` or `style` mutations after `DOMContentLoaded`, 0 attribute mutations on the card hosts at hydration, and the card link's `href`, `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`.
3. On both routes with JavaScript off, the card is styled with the same geometry as with JavaScript on, a click near its corner navigates to the stretched link's `href`, and axe on the `wcagTags` rule set reports no violation.
4. `apps/yeti-app-e2e/src/support/style-probe.ts` exports the three functions of the contract, and `card.spec.ts` uses them.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && test -f apps/yeti-app-e2e/src/card.spec.ts && npx nx e2e yeti-app-e2e -- card.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
