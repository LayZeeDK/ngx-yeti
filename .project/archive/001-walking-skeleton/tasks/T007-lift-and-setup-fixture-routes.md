---
id: T007
title: Serve the lift, setup, and setup-boundaries Fixture routes with their e2e cases
wave: 2
deps: [T005, T006]
status: done
agent: build_T007
base: 45394edf71cb8ab113ec3818717741fe8db3af64
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/app/fixtures/fixtures.ts
  - apps/yeti-app/src/app/fixtures/lift-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-boundaries-fixture.ts
  - apps/yeti-app/src/app/app.config.ts
  - apps/yeti-app-e2e/src/lift.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
---

# T007 — Serve the lift, setup, and setup-boundaries Fixture routes with their e2e cases

## Context

INTENT.md SC2 asks that the prerendered `/lift` and `/setup` routes and their server-rendered `/server/` twins pass `yeti-app-e2e` with JavaScript on and off (styled from the server's head links, axe-clean on `wcagTags`, no `NG05xx`, `componentsSkippedHydration === 0`, 0 `link` or `style` mutations after `DOMContentLoaded`), and that the setup spec's layer-4 cases that need no later item pass (setup.md:335-343: hydrate never and hydrate on interaction, the shared host of ADR 0045, leave under a class-form `animate.leave`, client-only `@defer` with and without preload, and the ticket-37 boundary cases). lift.md:249 adds the lift route's own cases. The setup spec's order case and Tailwind C1 and C2 move to M002 (INTENT.md Scope: out). `provideYetiStyles` is a root-only provider (setup.md section 4), so one build has one preload list: this milestone preloads `card` and leaves `lift` out, so the "with preload" measurements use `card` and the "without preload" recordings use `lift`; the placeholder task records that split as a Departures row. This task owns the Fixture app routes surface.

## Approach

- Register `lift`, `setup`, and `setup-boundaries` rows in `apps/yeti-app/src/app/fixtures/fixtures.ts` (the route builders serve each prerendered and under `/sub/server/`). Each fixture component is OnPush with one `i18n` text, imports items from their entry points, and writes no Yeti class, Yeti `data-*`, or `data-ngx-yeti-*` attribute by hand.
- `apps/yeti-app/src/app/app.config.ts`: add `provideYetiStyles({ preload: ['card'] })` once in the root providers, beside the existing `provideClientHydration(withI18nSupport())`.
- `lift-fixture.ts` (lift.md:249): lifted cards (`article yetiCard yetiLift raised` with a stretched heading link) including a `yetiLift="scale"` one; a lifted card inside `@defer (hydrate never)`; a control that removes the live lifted cards; a client-only `@defer (on interaction)` block holding a lifted card.
- `setup-fixture.ts` (setup.md:337-341): a shared `card` plus `lift` host; a `@defer (hydrate never)` block and a `@defer (hydrate on interaction)` block, each holding a `card` plus `lift` host; a control that removes every live host; a host under a class-form `animate.leave` toggled by `@if`, with a function-form `(animate.leave)` listener elsewhere on the page; a client-only `@defer (on interaction)` block holding a card (preloaded) and a lifted element (not preloaded). No host of any item other than card and lift.
- `setup-boundaries-fixture.ts` (setup.md:343, ticket 37): consumer `@boundary` and `@error` blocks around card hosts with fixture-only probe directives: a constructor error on the server only; a constructor error in client-only `@defer` content with the boundary outside the `@defer` and another with it inside; replaced markup for the pre-hydration click case; an update error recovered by `$reset()`. Keep each case in its own component so upstream bug A8 (a constructor error on a template's first creation poisons that template for the server process) cannot spill into another case. Prior art: `docs/specs/prototypes/consumer-boundaries/src/boundary-probe.ts`, `docs/specs/prototypes/consumer-boundaries/src/page.ts`, `docs/specs/prototypes/consumer-boundaries/README.md`.
- E2e specs reuse `test`, `expect`, `isProduction`, `axeViolations`, `watchHydration`, `holdBackMainBundle` from the support folder and the style probe of the contract, for both route kinds and with JavaScript on and off where a case applies:
  - `apps/yeti-app-e2e/src/lift.spec.ts`: clean hydration; 0 attribute mutations on the hosts at hydration; with JavaScript off a real hover lifts the card (its top decreases) and axe passes; the `hydrate never` lifted card keeps the lift link and still lifts on hover after the live lifted cards were removed; the client-only `@defer` lifted card's unstyled frames recorded without preload (annotation, not assertion).
  - `apps/yeti-app-e2e/src/setup.spec.ts`: JavaScript off, the route's card computes the same padding as under Yeti's full `yeti.css` (the assets glob copies it beside the item files) and the global stylesheet's `noscript` copy applies, axe passes; hydration clean with 0 `link` or `style` mutations after `DOMContentLoaded` and 0 unstyled frames in Chromium (recorded per engine in CI); after every live host leaves, the `hydrate never` and `hydrate on interaction` hosts keep the card and lift links, and hydrating the interaction block keeps them; the leaving host stays styled while it leaves and loses its link after; with item CSS delayed 300 ms, the preloaded card shows 0 unstyled frames and the lift's frames are recorded.
  - `apps/yeti-app-e2e/src/setup-boundaries.spec.ts`: the server-only constructor error shows the fallback with JavaScript off and the item after hydration; the boundary outside the `@defer` leaves the region empty and the one inside shows the fallback; a click on replaced markup made before hydration (`holdBackMainBundle`) is lost; after `$reset()` with item CSS delayed and the HTTP cache off, WebKit's unstyled frames are recorded with and without preload (skipped with a reason in other engines).
- Pitfalls: hydration diagnostics exist in development builds only (`isProduction` skip); with JavaScript off, timers never fire, so axe goes through the `axeViolations` fixture; upstream bug O2 (wait for the stylesheet before geometry); local runs are Chromium only. Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- ngx-yeti/styles exports `injectYetiItemStyles(item: YetiComponentName): void`, called in an injection context as the last statement of an item root directive's constructor, and `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders`, with `interface YetiStylesConfig { readonly url?: string; readonly preload?: readonly YetiComponentName[] }`, called at most once in the root providers; the loader service, the rank table, and the pin constant are not exported.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- ngx-yeti/lift exports `NgxYetiLift`: selector `[yetiLift]`, exportAs `yetiLift`, input `yetiLift: YetiLift | ''` where unset and `''` render no `data-lift`; host: static class `lift`, static `data-ngx-yeti-item-lift=""`, `data-lift` from the input; acquires the `lift` item file.
- apps/yeti-app-e2e/src/support/style-probe.ts exports `recordStyleMutations(page: Page): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists one entry per `link` or `style` element added to or removed from the document after `DOMContentLoaded`; `recordFrames(page: Page, selector: string, property: string): Promise<() => Promise<readonly string[]>>`, called before `goto`, whose returned function lists the computed value of `property` on the first element matching `selector` in every animation frame from the first one, `''` while nothing matches; and `itemLinks(page: Page): Promise<readonly string[]>`, the `data-ngx-yeti-styles` values of the item links in the head in document order.
- Fixture keys `lift`, `setup`, and `setup-boundaries` in apps/yeti-app/src/app/fixtures/fixtures.ts, each served prerendered at `/sub/{key}` and server-rendered at `/sub/server/{key}`; the `setup` route renders at least one host carrying both `yetiCard` and `yetiLift` and no host of any other item.
- apps/yeti-app/src/app/app.config.ts calls `provideYetiStyles({ preload: ['card'] })` once in the root providers: `card` is the preloaded item and `lift` is left out of the preload list.

## Intent coverage

- SC2

## Acceptance criteria

1. `/sub/lift`, `/sub/setup`, `/sub/setup-boundaries` and their `/sub/server/` twins are served, and on each lift and setup route with JavaScript on: no `NG05xx`, `componentsSkippedHydration === 0` (development build), 0 `link` or `style` mutations after `DOMContentLoaded`, and item links carrying `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`.
2. With JavaScript off, the lift and setup routes are styled from the server's head links (the setup card's padding equals that under Yeti's full stylesheet), a hovered lifted card lifts, and axe on `wcagTags` reports no violation.
3. The `hydrate never` and `hydrate on interaction` hosts keep their card and lift links after every live host has left, the leaving host stays styled until removed and then loses its link, and the client-only `@defer` with the preloaded card shows 0 unstyled frames with item CSS delayed 300 ms while the not-preloaded lift's frames are recorded.
4. `apps/yeti-app-e2e/src/setup-boundaries.spec.ts` passes the ticket-37 cases of setup.md:343 that run locally and records WebKit's `$reset()` frames where WebKit runs.
5. `app.config.ts` preloads exactly `card`, as the contract states.
6. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && test -f apps/yeti-app-e2e/src/setup-boundaries.spec.ts && npx nx e2e yeti-app-e2e -- lift.spec.ts setup.spec.ts setup-boundaries.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
- 2026-10-04 — build_T007: implemented fixtures (lift, setup, setup-boundaries rows; `provideYetiStyles({ preload: ['card'] })` in app.config.ts) and the three e2e specs. Chromium, development build, `npx playwright test lift.spec.ts setup.spec.ts setup-boundaries.spec.ts`: lift.spec 14/14 pass; setup-boundaries.spec 8 pass + 2 WebKit-only skipped (the `$reset()` flow also passed when temporarily run in Chromium); setup.spec 14 pass, 2 skipped (noscript copy: production build only), 2 fail — the client-only `@defer` card's 0-unstyled-frames assertion (see question). `npx prettier --check .` passes; `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` passes (warnings only). Full Verify not yet run.
- Measured: Angular keeps a dehydrated `@defer (hydrate never)` block's server DOM when its parent `@if` is destroyed, so no control can remove a dehydrated host; the specs remove those hosts with `element.remove()` where a case needs an empty `<head>`. The `hydrate on interaction` block keeps its `jsaction` markers until it hydrates, so the setup spec's hydration wait excludes it.
- Measured: `@boundary` templates fail the yeti-app template linter (its compiler does not parse `@boundary`, as wave-1 recorded for ngx-yeti); the boundary cases' templates sit in module constants, which the linter does not extract and the Angular compiler resolves. eslint.config.mjs is outside `files`.
- Measured (Chromium, cache off through `page.route`, 300 ms delay): on `/sub/setup` the card file is already loaded at page start by the server's shared host, so the client-only `@defer` card can only be a re-insertion after every host is removed; the re-inserted `card` link refetches through the delay and paints about 20 unstyled frames although `card` is preloaded (the preload was consumed at load). Without emptying `<head>`, the card link is already present and 0 frames is trivially true.
- NEEDS-ORCHESTRATOR: How should AC3's "the client-only `@defer` with the preloaded card shows 0 unstyled frames with item CSS delayed 300 ms" be asserted, given the setup route must server-render a card (Interface contract) so the card file is never first loaded by the client there? — readings: (a) assert 0 after emptying `<head>` (fails in Chromium, ~20 frames, measured); (b) assert 0 without emptying `<head>` (passes trivially, the link is already there); (c) record the preloaded card's frames as an annotation like the lift's and carry the 0-frame assertion to a route whose card first renders on the client (needs a fixture key or file outside `files`, e.g. M006's `setup--client-defer-preload`).
- Orchestrator answer: reading (c), without any file outside `files`. The preload's 0-frame claim is for an item whose first instance is a client-only `@defer` block (setup.md:341; ADR 0060 point 6, measured on `alert`, which the page does not server-render), and Playwright's `page.route` disables the HTTP cache, so a re-inserted card link on `/setup` refetches by construction. On `/setup`, record the re-inserted client-only card's unstyled frames as a test annotation, as the lift's are recorded. Add a second fixture component in `apps/yeti-app/src/app/fixtures/setup-fixture.ts`, registered in `apps/yeti-app/src/app/fixtures/fixtures.ts` under the route key `setup-defer` (prerendered and server-rendered like every fixture), whose only card is inside a client-only `@defer (on interaction)` block, so the server renders no card host and the root `preload: ['card']` link is the only card request before the interaction; in `apps/yeti-app-e2e/src/setup.spec.ts`, assert 0 unstyled frames there with item CSS delayed 300 ms, plus the route's standard checks (JavaScript on and off, axe on `wcagTags`, clean hydration). That route carries AC3's 0-frame assertion. — Citations: T007 AC3 and `files`; INTENT.md SC2; setup.md:341; ADR 0060 point 6.
- 2026-10-04 — build_T007, after the orchestrator answer: added `SetupDeferFixture` in setup-fixture.ts, registered as `setup-defer` in fixtures.ts (only card in a client-only `@defer (on interaction)`; the server writes no card link, only the root `card` preload). setup.spec.ts: on `/setup` the re-inserted client-only card's and the lift's frames are annotations; on `/setup-defer` (both route kinds) clean hydration, 0 link/style mutations after DOMContentLoaded, no item link before the interaction, the card preload in `<head>`, 0 unstyled frames for the deferred card with item CSS delayed 300 ms from the start (cache off through routing), JavaScript off placeholder plus preload, and axe on `wcagTags`. Production build (`FIXTURE_CONFIGURATION=production`), the three specs: 42 passed, 8 skipped (development-only hydration diagnostics and WebKit-only `$reset()`), noscript-copy test included and passing.
- 2026-10-04 — Verify (verbatim task command): exit 0. `npm ci` ok; `nx run-many -t typecheck -p yeti-app yeti-app-e2e` ok; setup-boundaries.spec.ts exists; `nx e2e yeti-app-e2e -- lift.spec.ts setup.spec.ts setup-boundaries.spec.ts`: 46 passed, 4 skipped (Chromium; skips are the noscript-copy test in development and the WebKit-only `$reset()` frames test). Also `npx prettier --check .` passes and `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` passes (0 errors, 7 warnings of the `playwright/no-conditional-*` and `expect-expect` kinds).
- 2026-10-04 — orchestrator Verify (isolate gsd-path-task/T007): pass, exit 0; output tail:
  ```
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
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  ```
