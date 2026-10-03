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
| `loadYetiManifest()`                                            | Yeti's manifest at the pin, typed by Yeti's own declarations                                                                            |

`@ngx-yeti/testing/server` holds Node-only helpers: `renderServer(rootComponent, { providers, hydrationFeatures, url, document })` renders through `renderApplication` with `provideServerRendering()` and `provideClientHydration(withI18nSupport())` and resolves the page HTML. Calls started together must pass the same `hydrationFeatures`, because Angular keeps i18n hydration support in a process-wide flag.

## Layer 2

- Test a directive alone with `TestBed.createDirective(Type, { tagName, bindings: [inputBinding('name', signal)] })` (Angular 22.2). Use a small test host only for a parent, content, `exportAs`, or static attributes. `packages/ngx-yeti/src/lib/highlight/highlight.spec.ts` is the pattern.
- Tests run zoneless; `src/test-setup.ts` calls `setupTestBed()`.
- Real pointer and keyboard input comes from `import { userEvent } from 'vitest/browser'`. It drives Playwright, so `userEvent.hover()` sets CSS `:hover` (measured in Chromium, Firefox, and WebKit), unlike Storybook's `userEvent`.
- No axe here.

## Layer 3

- Every item has `<item>.ssr.spec.ts`: a fixture component with one `i18n` text (building-blocks 1.11 decision 11), rendered with `renderServer()`, asserting the server HTML. `packages/ngx-yeti/src/lib/highlight/highlight.ssr.spec.ts` is the pattern.
- The contract check (ADR 0014 point 3) reads `loadYetiManifest()` and asserts every class, attribute, marker, value, and event the spec maps has its input, union member, or output, and that no union holds a value the manifest lacks. The first item spec designs the per-item API in a `*.node.spec.ts`; later specs reuse it.

## Layer 4

`apps/ngx-yeti-e2e` opens stories of the static Storybook build (port 4401). Use Playwright's built-in `mount('<item>--<story>')` from `test` in `src/gallery.ts`: it renders the story with `embed=true`, so the play function does not run again, and it fails if Storybook ever runs it. `expectNoAxeViolations(page)` in `src/axe.ts` runs axe with `wcagTags` on the story, for states no play function reaches. `mount` takes no props yet; give the story args.

`apps/yeti-app` is the Fixture app, set up exactly as the setup spec documents for a consumer: `<base href="/sub/">`, the `yeti-css` assets entry (66 files through the workspace link, measured), the global stylesheet, and `provideClientHydration(withI18nSupport())`. Add a fixture as one row in `apps/yeti-app/src/app/fixtures/fixtures.ts`; it is served at `/sub/<item>` (`RenderMode.Prerender`) and `/sub/server/<item>` (`RenderMode.Server`). Give every fixture one `i18n` text.

`apps/yeti-app-e2e` runs against the built Node server (`yeti-app:serve-ssr`): the development build by default, for Angular's hydration messages, and the production build with `FIXTURE_CONFIGURATION=production`. Helpers in `apps/yeti-app-e2e/src/support/`:

| Helper                                                     | Use                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test` and `expect` from `fixtures.ts`                     | The test object; its `noScriptPage` fixture is a page with JavaScript disabled                                                                              |
| `watchHydration(page)` before `goto`, then `expectClean()` | Angular's summary reports 0 skipped components and no `NG05xx` was logged (development build only)                                                          |
| `holdBackMainBundle(page)`                                 | Holds the main script so the page stays server HTML; navigate with `waitUntil: 'commit'`, act, then call the returned release function to test event replay |
| `axeViolations(page)`                                      | axe with `wcagTags`; works with JavaScript off in Chromium and WebKit, not Firefox (`axeRunsWithoutJavaScript`)                                             |

`apps/yeti-app-e2e/src/fixture-app.spec.ts` shows each helper on both render modes.

## Engines

Locally, every browser layer runs Chromium only: Playwright's browsers are x64 under emulation on the Windows on Arm machine. With `CI` set (GitHub sets it), layers 1, 2, and 4 run Chromium, Firefox, and WebKit. To run the three engines locally once, prefix the command with `CI=true`. Safari runs only on a macOS runner.

## The browser floor

Ticket 93 reruns layers 2 and 4 at the Baseline 2025 floor in `.github/workflows/floor.yml` (weekly, on `release/**`, and by hand); a failure blocks a release, not a pull request. Two variables select the floor engines, and both are cache inputs:

- `FLOOR_CHROMIUM_PATH=<chrome.exe>` runs `nx test ngx-yeti` and both e2e projects in Chromium only, on that browser. Install it with `npx @puppeteer/browsers install chrome@141.0.7390.54 --path <dir>`; the command prints the path. This replaces ticket 93's Playwright 1.56.1 alias: the Storybook gallery needs `mount(storyId)`, which Playwright 1.63 ships and 1.56.1 lacks, and ticket 27 measured Chrome for Testing 141 by `executablePath` working with Playwright 1.63 (commit e3e0b20).
- `FLOOR_FIREFOX=true` runs `nx test ngx-yeti` in Firefox 145 through WebdriverIO, which downloads the browser itself.

Edge 141 is the Chromium 141 engine; Safari 26.2 has no runner and is held by the static checks: `.browserslistrc` and the `css/use-baseline` and `baseline-js/use-baseline` lint rules at Baseline 2025. Use a newer feature only with the fallback its spec names, behind a described disable comment.

## Gates

`npm run check` runs lint, typecheck, test, and test-storybook for every project; `.github/workflows/ci.yml` runs that, every build, and every e2e target. `test`, `test-storybook`, and `build-fast` compile with Analog `fastCompile` and never type-check: run `npx nx typecheck ngx-yeti` beside them (`-c spec` for specs only). Targets that read Yeti's build depend on `^yeti-build`, so Yeti builds first.
