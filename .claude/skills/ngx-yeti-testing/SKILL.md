---
name: ngx-yeti-testing
description: 'This skill should be used when writing, placing, or running tests for ngx-yeti, or when a spec''s Testing Decisions name layer 1, 2, 3, or 4: "write the tests for the dialog", "where does this test go", "add an SSR smoke test", "test hydration", "test with JavaScript disabled", "add the contract check", "run the e2e tests", "test in Firefox and WebKit", "the floor job". Covers the four test layers of ADR 0014, which file and runner each uses, the shared helpers in @ngx-yeti/testing, the e2e projects and their helpers, browser engines locally and in CI, and the commands.'
---

# The four test layers

ADR 0014 (`docs/specs/adr/0014-testing-stack-for-yeti.md`) fixes four layers; each spec's Testing Decisions say what each layer asserts for its item. Assertions are DOM-first at every layer (class, `data-*` attributes and values, roles, ARIA, `hidden`, `open`, `inert`), never instance fields. Nothing is tested twice. Follow the `type-safety` skill for every spec file (SIFERS `setup()`, no hooks, `expect.assertions(n)` first in async tests).

| Layer | What                                                  | File                                                                 | Runner                                 | Command                                              |
| ----- | ----------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| 1     | Story play functions and the axe gate                 | `<item>.stories.ts`                                                  | `@storybook/addon-vitest`              | `npx nx test-storybook ngx-yeti`                     |
| 2     | Directive behaviour in a real browser                 | `<item>.spec.ts`                                                     | Vitest browser mode, `browser` project | `npx nx test ngx-yeti`                               |
| 3     | Server render, pure logic, contract check             | `<item>.ssr.spec.ts`, `<name>.node.spec.ts`                          | Vitest in Node, `node` project         | `npx nx test ngx-yeti`                               |
| 4     | Real input, media, hydration, routing, JavaScript off | `apps/ngx-yeti-e2e/src/*.spec.ts`, `apps/yeti-app-e2e/src/*.spec.ts` | Playwright 1.63                        | `npx nx e2e ngx-yeti-e2e`, `npx nx e2e yeti-app-e2e` |

The file suffix routes a spec to its Vitest project (`packages/ngx-yeti/vitest.unit.config.mts`), under `src/` or an entry point's `<item>/src/`. A spec named `demo-geometry.spec.ts` in `docs/specs` becomes `demo-geometry.node.spec.ts`.

## Shared helpers

`@ngx-yeti/testing` (`packages/ngx-yeti-testing`, never published) works in the browser and in Node. Specs, stories, and e2e import it; package source cannot (lint).

| Export                                                          | Use                                                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `wcagTags`                                                      | The six axe tags of every accessibility check                                                                                           |
| `parseColor`, `composite`, `relativeLuminance`, `contrastRatio` | Exact WCAG contrast from computed styles (`ngx-yeti-accessibility` skill)                                                               |
| `replayShapedEvent(event)`                                      | Patches an event as Angular's replay does (`preventDefault()` throws after running), to prove a handler changes state before calling it |
| `itemLinks`, `preloadHrefs`, `removeItemLinks`                  | Read or remove the item stylesheet links and preload hints in `<head>` (`src/lib/item-links.ts`)                                        |
| `stylesheetLoaded`, `itemStylesLoaded`, `nextFrame`             | Wait until a link's sheet has loaded, until the item files have loaded, or for the next animation frame (`src/lib/item-links.ts`)       |

`@ngx-yeti/testing/server` holds Node-only helpers: `renderServer(rootComponent, { providers, hydrationFeatures, url, document })` renders through `renderApplication` with `provideServerRendering()` and `provideClientHydration(withI18nSupport())` and resolves the page HTML. It also exports the HTML helpers of `src/lib/html.ts` (`openingTags`, `allOpeningTags`, `attributeValue`, `head`, `headLinks`) and `checkContract`. Calls started together must pass the same `hydrationFeatures`, because Angular keeps i18n hydration support in a process-wide flag.

## Layer 2

- Test a directive alone with `TestBed.createDirective(Type, { tagName, bindings: [inputBinding('name', signal)] })` (Angular 22.2). Use a small test host only for a parent, content, `exportAs`, or static attributes. `packages/ngx-yeti/card/src/card.spec.ts` is the pattern.
- Tests run zoneless; `src/test-setup.ts` calls `setupTestBed()`.
- Real pointer and keyboard input comes from `import { userEvent } from 'vitest/browser'`. It drives Playwright, so `userEvent.hover()` sets CSS `:hover` (measured in Chromium, Firefox, and WebKit), unlike Storybook's `userEvent`.
- No axe here.

## Layer 3

- Every item has `<item>.ssr.spec.ts`: a fixture component with one `i18n` text (building-blocks 1.11 decision 11), rendered with `renderServer()`, asserting the server HTML. `packages/ngx-yeti/card/src/card.ssr.spec.ts` is the pattern.
- The contract check (ADR 0014 point 3) reads `yeti-css/manifest` (its types come from `yeti-css`; the mapping's `classes` field is optional for an item without modifier classes) and asserts every class, attribute, marker, value, and event the spec maps has its input, union member, or output, and that no union holds a value the manifest lacks. The first item spec designs the per-item API in a `*.node.spec.ts`; later specs reuse it. `packages/ngx-yeti/src/yeti-manifest.node.spec.ts` already pins the manifest's component count.

## Layer 4

`apps/ngx-yeti-e2e` opens stories of the static Storybook build on port 4401. Playwright always starts that server itself and fails if the port is taken, so stop a running `npm run static-storybook` first. Open a story with `await openStory(page, '<item>--<story>')` from `src/open-story.ts`, which returns the story root. It navigates to the story with `embed=true`, so the play function does not run again, and fails if Storybook ever runs it or the id is unknown. It waits until Storybook has finished rendering the story, the preview's `console.error` check included, and fails if Storybook then shows an error. It uses only `page.goto` and DOM reads, so the floor jobs run it under older Playwright releases too. `expectNoAxeViolations(page)` in `src/axe.ts` runs axe with `wcagTags` on the story, for states no play function reaches. `openStory(page, id, { args })` sets Storybook's `args` URL parameter, so a story opens with the state a test needs (`{ raised: true }` becomes `args=raised:!true`). `expectItemSheetsApplied(page, items)` in `src/item-styles.ts` waits until each named item's stylesheet has loaded and applied before a test reads geometry.

`apps/yeti-app` is the Fixture app, set up exactly as the setup spec documents for a consumer: `<base href="/sub/">`, the `yeti-css` assets entry (through the workspace link), the global stylesheet, and `provideClientHydration(withI18nSupport())`. Add a fixture as one row in `apps/yeti-app/src/app/fixtures/fixtures.ts`; it is served at `/sub/<item>` (`RenderMode.Prerender`) and `/sub/server/<item>` (`RenderMode.Server`). Give every fixture one `i18n` text.

`apps/yeti-app-e2e` runs against the built Node server (`yeti-app:serve-ssr`): the development build by default, for Angular's hydration messages, and the production build with `FIXTURE_CONFIGURATION=production`. Helpers in `apps/yeti-app-e2e/src/support/`:

| Helper                                                  | Use                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`, `expect`, and `isProduction` from `fixtures.ts` | The test object with the `axeViolations` fixture; `isProduction` is true under `FIXTURE_CONFIGURATION=production`                                                                                                                                                      |
| `axeViolations` fixture                                 | A function that runs axe with `wcagTags` and returns one `id: help (targets)` line per violation, so assert `toEqual([])`. On a JavaScript-off page it runs axe with a microtask timer; in Firefox with JavaScript off it skips the test, because axe cannot run there |
| `watchHydration(page)` before `goto`                    | Returns a check function; await it after the page loads. It expects Angular's summary to report 0 skipped components and no `NG05xx` message (development build only)                                                                                                  |
| `holdBackMainBundle(page)`                              | Holds the main script so the page stays server HTML; navigate with `waitUntil: 'commit'`, act, then call the returned release function to test event replay                                                                                                            |

Test the JavaScript-off page with Playwright's own option: put the tests in a `describe` that calls `test.use({ javaScriptEnabled: false })` and use the built-in `page`. `apps/yeti-app-e2e/src/card.spec.ts` holds the card route's JavaScript-off checks.

The other helpers in `apps/yeti-app-e2e/src/support/`:

| Helper                                                                                                         | Use                                                                                |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `waitForHydration`, `nextFrames` from `hydration.ts`                                                           | Wait until the page has hydrated; wait for animation frames                        |
| `recordFrames` (with its `start` option), `recordStyleMutations`, `recordHostAttributes` from `style-probe.ts` | Record frames, style changes, and host attributes while the page loads or hydrates |
| `itemLinks`, `itemSheetsLoaded`, `delayCss` from `style-probe.ts`                                              | Read the item links, check their sheets have loaded, and delay CSS responses       |
| `expectHydrationFrames` from `style-probe.ts`                                                                  | Assert the unstyled-frame count of a hydration run                                 |
| `removeEveryHost`, `removeDehydratedHosts`, `expectHoverLifts` from `hosts.ts`                                 | Remove item hosts from the page; check that hovering lifts an item                 |

## Engines

Locally, every browser layer runs Chromium only: Playwright's browsers are x64 under emulation on the Windows on Arm machine. With `CI` set (GitHub sets it), layers 1, 2, and 4 run Chromium, Firefox, and WebKit. To run the three engines locally once, prefix the command with `CI=true`. The `safari` job of `.github/workflows/ci.yml` sets `SAFARI=true` and runs `nx test ngx-yeti` in the real Safari of the `macos-latest` image, through WebdriverIO and `safaridriver`, headed because `safaridriver` has no headless mode. The Safari version moves with the image. Playwright cannot drive branded Safari, so stories and e2e run in Playwright's WebKit only.

## The browser floor

`.github/workflows/floor.yml` reruns layers 2 and 4 at the Baseline 2025 floor on every pull request and every push to `main` or `release/**`. Its jobs report on every pull request, and nothing requires them to pass before merging. The departures table of the `ngx-yeti-specs` skill lists where this differs from ticket 93. The workflow owns the browser versions, container images, and Playwright releases, with the reason for each in its comments. Each job sets one variable:

| Variable                     | Job               | Runs                                                                                                    |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `FLOOR_CHROMIUM_PATH=<path>` | `chromium-141`    | `nx test ngx-yeti` and both e2e projects in Chromium only, on the Chrome for Testing build at that path |
| `FLOOR_FIREFOX=true`         | `firefox-145`     | `nx test ngx-yeti` in Firefox through WebdriverIO, which downloads the browser                          |
| `FLOOR_FIREFOX_E2E=true`     | `firefox-146-e2e` | Both e2e projects in Firefox only, with the Playwright release of the job's image                       |
| `FLOOR_WEBKIT=true`          | `webkit-26-4`     | `nx test ngx-yeti` and both e2e projects in WebKit only, with the Playwright release of the job's image |

`FLOOR_FIREFOX`, `FLOOR_FIREFOX_E2E`, and `FLOOR_WEBKIT` act only when set to `true`, in `packages/ngx-yeti/vitest.unit.config.mts` and in `tools/playwright/browser-projects.mjs`, which both e2e configs share; any other value leaves the default engines. Each variable is a cache input of the targets it changes. The jobs that start e2e servers run `nx run yeti-css:yeti-build` first, so the servers' nested Nx processes reuse that build instead of each rebuilding `dist/`.

To reproduce a job locally, install its browser the way the job does. `npx --no-install @puppeteer/browsers install chrome@<version> --path <dir>` prints `chrome@<version> <path>`; the path is the second field. For the container jobs, run the job's image with Docker and install the job's Playwright release in it, as the job does. `firefox-146-e2e` runs as two shards; run one with `npx nx run-many -t e2e -p ngx-yeti-e2e yeti-app-e2e -- --shard=1/2 --workers=2`, and on more cores raise `--workers` or leave out `--shard`. `act` runs both shards at once on its default host network, where they collide on the e2e ports; give it a user-defined Docker network (`--network <name>`), and the memory of two jobs, or run one shard at a time.

Firefox 145 to 152 cannot render Yeti's sizes: they reject `atan2()` with a relative length, and Yeti's scale divides `100vw - 320px` through `tan(atan2(...))`, so with Yeti alone every Yeti size token is invalid and a card has no padding (measured 2026-10-04 on stock 145 to 156 through WebdriverIO and on Playwright's 146; 153 is the first that accepts it). `ngx-yeti/accessibility.css` redefines `--_yeti-t` from registered `<length>` properties, which compute to px, so every e2e test reads Yeti's sizes in every engine. `packages/ngx-yeti/src/accessibility.spec.ts` fails in the `firefox-145` job without it.

Edge 141 is the Chromium 141 engine. No GitHub runner ships Safari 26.2, so Playwright's WebKit stands in for it at the floor and the `safari` job covers current real Safari, beside the static checks: `.browserslistrc` and the `css/use-baseline` and `baseline-js/use-baseline` lint rules at Baseline 2025. Use a newer feature only with the fallback its spec names, behind a described disable comment.

## Gates

`npm run check` runs lint, typecheck, test, and test-storybook for every project; `.github/workflows/ci.yml` runs that, every build, and every e2e target, then `yeti-app-e2e` again with `FIXTURE_CONFIGURATION=production`, on every pull request and every push to `main` or `release/**`, as parallel jobs: `static`, `package`, `unit`, and an `e2e` matrix of engine by configuration that selects the engine with Playwright's `--project`. When an e2e job grows long, add a `--shard` axis to its matrix, as `firefox-146-e2e` in `floor.yml` has. `test`, `test-storybook`, and `build-fast` never type-check (`references/fast-compile.md` says which targets use Analog `fastCompile`): run `npx nx typecheck ngx-yeti` beside them (`-c spec` for specs only). Targets that read Yeti's build depend on `^yeti-build`, so Yeti builds first.
