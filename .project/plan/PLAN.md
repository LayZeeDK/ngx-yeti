# Plan — ngx-yeti M001 walking-skeleton

Project verify: `npm ci --no-audit --no-fund && npx prettier --check . && npx nx run-many -t lint typecheck test test-storybook build build-fast && npx nx run ngx-yeti:pack-check && npx nx run-many -t e2e && FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e`

## Config

- max_review_cycles: 3
- wave_budget: none
- review_panel: off
- finding_skeptics: off

## Wave 1 — risk burn-down

Goal: Prove the four plan-invalidating assumptions before anything builds on them: the e2e web servers start in pipeline-created linked worktrees and in the primary checkout (T001); generator-made secondary entry points are picked up by `nx build`, `nx build-fast`, `nx typecheck -c src`, the Vitest spec roots (T002), and the Storybook globs (T004); `ngx-yeti/accessibility.css` is published and resolves in Storybook and `yeti-app` (T003); and the ADR 0060 loader writes card links on the server and adopts them at hydration with 0 `link` or `style` mutations on a real card route (T002, T005). If one fails, the webServer command, the entry-point layout, the stylesheet's publication, or the loader design is revised here, before lift, the setup routes, and the placeholder move build on it.
Review depth: full

## Wave 2 — walking skeleton

Goal: Complete the end-to-end slice on real items: lift at its own entry point with every M001 story of setup, card, and lift passing the axe gate (T006); the lift, setup, and setup-boundaries Fixture routes and the card route's remaining cases passing with JavaScript on and off, including the shared host of ADR 0045, preload, boundaries, the development server, the strict-CSP nonce route, and the A4 frame counts (T007, T010, T011); the card and lift Storybook-half e2e cases (T008); and the per-spec contract check with the ADR 0080 name-collision test (T009).
Review depth: full

## Wave 3 — release readiness and cleanup

Goal: Remove the `NgxYeti` and `Highlight` placeholders in the change that moves their assertions onto card, leaving the primary entry point types-only (T012); make the package release-ready with the ADR 0017 version, a changelog, the published-output and version tests, and a consuming build against the `npm pack` tarball (T013); and document the setup and apply the remaining docs-audit rulings with `npm run check` green (T014).
Review depth: full

## Surface contract

### Storybook stories — T006

Criteria: SC1
Entry: `npx nx build-storybook ngx-yeti` then `npx nx static-storybook ngx-yeti` (http://localhost:4401), or `npx nx storybook ngx-yeti` (http://localhost:4400); story ids `card--*`, `lift--*`, and `setup--shared-host`
States: empty — an unknown story id shows Storybook's missing-story error and `openStory` throws; loading — Storybook's preparing view until the story renders and its item links load; error — a play-function failure, an axe violation, or any `console.error` marks the story failed in `npx nx test-storybook ngx-yeti`; success — the story shows a styled card or lifted card, its item links are in the head, and its play function and the axe gate pass
Walkthrough:
1. In the built Storybook open `card--stretched-link`: the card is styled (border, padding, picture bleeding to the edges); click near the card's bottom-right corner and the stretched link is followed; click the footer button and its click fires without navigating.
2. Open `setup--shared-host`: the host carries `class="card lift"`, `data-ngx-yeti-item-card`, and `data-ngx-yeti-item-lift`, and the head holds both `link[data-ngx-yeti-styles="card"]` and `link[data-ngx-yeti-styles="lift"]`; use the story's control to remove the host and both links are gone in the next frame.
3. Run `npx nx test-storybook ngx-yeti`: every card, lift, and setup story passes its play function and the axe gate.

### Fixture app routes — T007

Criteria: SC2
Entry: `npx nx run yeti-app:serve-ssr` (PORT 4000), then http://localhost:4000/sub/card, /sub/lift, /sub/setup, /sub/setup-boundaries, and their /sub/server/ twins
States: empty — a route that renders no item has no item link in the head; loading — before hydration, and with JavaScript off, the server HTML is already styled from the item links in the head; error — an item that throws inside a consumer `@boundary` on /sub/setup-boundaries shows the consumer's fallback; success — items are styled, the development build logs its hydration summary with 0 skipped components and no `NG05xx`, and no `link` or `style` element changes after `DOMContentLoaded`
Walkthrough:
1. With JavaScript disabled, open /sub/card: the card is styled; click near its corner and the browser navigates to the stretched link's href.
2. With JavaScript on, open /sub/server/setup: the head holds the card and lift item links, each with `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`, and the console shows the hydration summary with 0 skipped components.
3. On /sub/lift, hover a lifted card with JavaScript off and then on: it rises both times.

### package entry points — T013

Criteria: SC3
Entry: `npx nx run ngx-yeti:pack-check` (builds the package, runs `npm pack`, and compiles a consumer against the tarball)
States: empty — a consumer that imports nothing still installs the tarball with no `yeti-css` dependency or peer; loading — `nx build ngx-yeti` runs first through the target's dependency; error — the check exits non-zero and names the import, type, file, or version claim that failed; success — the check prints the tarball name and every claim passes
Walkthrough:
1. Run `npx nx run ngx-yeti:pack-check`: the consumer compiles against the tarball, importing `YetiCard` and `YetiCardLink` from the card entry point, `NgxYetiLift` from the lift entry point, `injectYetiItemStyles` and `provideYetiStyles` from the styles entry point, and the five Yeti types from `ngx-yeti`, and resolves the package's accessibility stylesheet; a `threshold="medium"` probe fails to compile.
2. List the tarball: its `package.json` version is `0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8` with no `yeti-css` in any dependency field, and its `CHANGELOG.md` names `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`.

## Intent coverage

| Criterion | Task | Acceptance |
|-----------|------|------------|
| SC1 | T004 | AC1 |
| SC1 | T006 | AC1 |
| SC2 | T005 | AC2 |
| SC2 | T005 | AC3 |
| SC2 | T007 | AC1 |
| SC2 | T007 | AC2 |
| SC2 | T007 | AC3 |
| SC2 | T007 | AC4 |
| SC2 | T010 | AC1 |
| SC2 | T010 | AC2 |
| SC2 | T010 | AC3 |
| SC2 | T011 | AC2 |
| SC2 | T011 | AC3 |
| SC2 | T011 | AC4 |
| SC2 | T012 | AC2 |
| SC3 | T013 | AC1 |
| SC3 | T013 | AC2 |
| SC4 | T009 | AC1 |
| SC4 | T009 | AC3 |
| SC4 | T012 | AC1 |
| SC4 | T012 | AC5 |
| SC5 | T002 | AC4 |
| SC5 | T002 | AC5 |
| SC5 | T003 | AC3 |
| SC5 | T006 | AC5 |
| SC5 | T012 | AC4 |
| SC5 | T013 | AC3 |
| SC6 | T001 | AC1 |
| SC6 | T008 | AC3 |
| SC7 | T012 | AC6 |
| SC7 | T014 | AC1 |
| SC7 | T014 | AC2 |
| SC7 | T014 | AC3 |
| SC7 | T014 | AC5 |

## Dependency notes

- T004 and T005 depend on T002 (same wave, disjoint files): both consume the `YetiCard`, `YetiCardLink`, and loader contracts T002 defines; T004's stories and spec import from `ngx-yeti/card`, and T005's fixture renders the card through the loader. A reviewer sees the card entry point and the loader in T002's commit before either lands.
- T005 depends on T001 (same wave, disjoint files): its Verify runs `nx e2e yeti-app-e2e` in a pipeline linked worktree, which needs T001's landed effect, a `webServer` that starts there (T001's Log and decisions row show it).
- T006 depends on T002 and T004: it imports the loader and card contracts, and it appends `card--with-lift` to the card stories file T004 creates (file overlap across waves).
- T007 depends on T005 and T006 (T006 same wave, disjoint files): it imports `NgxYetiLift` from T006's entry point and consumes T005's style probe; T007 owns `fixtures.ts` and `app.config.ts` in wave 2, so no other wave-2 task edits them.
- T008 depends on T004 and T006 for the story ids it opens, and on T001 for an `ngx-yeti-e2e` server that starts in the pipeline worktree.
- T009 depends on T002 and T006 (T006 same wave, disjoint files): its contract specs check the card and lift directives against the manifest.
- T010 depends on T007 (same wave, disjoint files) for the `setup` route its development-server case opens, on T005 for the card route and the style probe its A4 case uses, and on T001 because it edits the Playwright config T001 changed.
- T011 depends on T007 (same wave, disjoint files) for the root preload list (`card` preloaded) its client-only `@defer` case relies on, on T006 for `NgxYetiLift`, and on T005 because it extends T005's fixture and spec files.
- T012 depends on T005 (the card route its moved assertions and readiness URL target), T004 (the card story ids its `openStory` spec opens), T002 (the primary `index.ts` and the build-fast config it may adjust), and on T001, T003, T007, and T010 for file overlap (the Playwright config, the specs skill, and `fixtures.ts`), plus T007 for the preload split its Departures row records. It runs in wave 3 because `fixtures.ts` belongs to T007 in wave 2.
- T013 depends on T012 (same wave, disjoint files): the packed consuming build asserts the primary entry point exports types only, which is true only after T012 lands. It also consumes T002's, T003's, and T006's entry points and stylesheet.
- T014 depends on T002 and T003 for the API and stylesheet it documents and for the two source files whose JSDoc it edits; it runs beside T012 and T013 with disjoint files.
- Docs-audit rulings 1, 4, and 5 land in T012 because they edit the same files as the placeholder move (the replay fixture, the type-safety skill, the stories skill); rulings 2 and 3 land in T014.
