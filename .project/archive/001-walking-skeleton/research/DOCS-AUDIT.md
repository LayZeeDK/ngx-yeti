# Docs Audit

<!-- Written by the docs auditor (/gsd-path-docs-audit or /gsd-path-inspect).
     Every verdict carries evidence; a verdict without evidence is a defect. -->

Repo root: D:\projects\github\LayZeeDK\ngx-yeti
Audited: 2026-10-04
Audited HEAD: 5a279bdc6ed0588c03a4ee34ba64bf242dff88f9
Alignment mode: no

## Summary

| Verdict | Count |
|---------|-------|
| verified | 128 |
| stale | 4 |
| aspirational | 1 |
| unverifiable | 4 |
| descriptive docs (no testable claims) | 287 |

Worst drift: `.claude/skills/ngx-yeti-testing/SKILL.md` tells agents to "Give every fixture one `i18n` text", but the Fixture app's `replay` fixture has none, so the pattern agents copy contradicts the rule.

Method note: the verify sidecar has no `node_modules`, so no project command (build, test, lint, typecheck) was run. Command and target claims were checked statically against `package.json`, `nx.json`, `project.json`, the Vite/Vitest/Storybook configs, `eslint.config.mjs`, and the workflows. Claims that need a run are marked `unverifiable`. Two installed-tree facts (`node_modules/@analogjs/platform/AGENTS.md`, `@nx/angular` generator schema, absence of `node_modules/ngx-yeti`, `@angular/cdk`, `@angular/aria`) were read-only checks of the primary checkout's installed tree; no command ran there.

## Doc: .claude/CLAUDE.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "@../AGENTS.md" and "@../WORKFLOW.md" imports | structure | verified | `AGENTS.md` and `WORKFLOW.md` exist at the repo root (sidecar `ls -a`) |

## Doc: .claude/skills/eslint-conflict-audit/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "The root `eslint.config.mjs` exports `default`, `angularConfig` ..., and `vitestConfig`" | config | verified | `eslint.config.mjs:39` (`export const vitestConfig`), `:102` (`export const angularConfig`), `:135` (`export default`) |
| Sample files `src/lib/ngx-yeti/ngx-yeti.ts`, `packages/ngx-yeti/.storybook/main.ts`, `packages/ngx-yeti/vite.lib.config.mts` | structure | verified | all three files exist (`find packages -type f`) |

## Doc: .claude/skills/ngx-yeti-accessibility/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "`@ngx-yeti/testing` exports ... `parseColor`, `composite`, `relativeLuminance`, and `contrastRatio`"; parses `rgb()`, `oklch()`, `oklab()`, `color(srgb ...)`, hex | feature | verified | `packages/ngx-yeti-testing/src/index.ts:1-7`; `packages/ngx-yeti-testing/src/lib/contrast.ts:14-16,26,57` |
| "`expectNoAxeViolations(page)` from `apps/ngx-yeti-e2e/src/axe.ts`" | structure | verified | `apps/ngx-yeti-e2e/src/axe.ts:5` |
| "`wcag22aa` turns on axe's `target-size` rule" (wcag22aa is in the tag set) | config | verified | `packages/ngx-yeti-testing/src/lib/wcag-tags.ts` lists `wcag22aa` |

## Doc: .claude/skills/ngx-yeti-specs/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "`docs/specs/` ... Prettier and Nx ignore it" | config | verified | `.prettierignore:9` `/docs/specs`; `.nxignore:1` `/docs/specs` |
| "`docs/specs/map.md`, sections Destination and Notes" | structure | verified | `docs/specs/map.md:7` `## Destination`, `:13` `## Notes` |
| "Each spec is long (30 to 100 KB)" | structure | verified | `docs/specs/specs/` sizes 32,805 B (navigation-close) to 101,747 B (carousel, 99.4 KiB) |
| Departures table, floor row: floor.yml on every PR and push to `main`/`release/**`; Chrome for Testing 141 by `executablePath`; Firefox 146.0.1 in layer 4; WebKit 26.4; reasons in `docs/decisions/2026-10-03-test-infrastructure.tsv` | config | verified | `.github/workflows/floor.yml:6-10,17,34-36,58-63,80-85`; `packages/ngx-yeti/vitest.unit.config.mts` `executablePath: chromiumFloor`; `docs/decisions/2026-10-03-test-infrastructure.tsv` exists |
| "`openStory(page, id)` opens the story by URL with `embed=true`, without props" | feature | verified | `apps/ngx-yeti-e2e/src/open-story.ts:21,31` |
| "`@angular/cdk` and `@angular/aria` are not installed yet" | status | verified | absent from root `package.json`; no `cdk`/`aria` under primary `node_modules/@angular` |
| Scaffold `NgxYeti` component and `Highlight` directive in `packages/ngx-yeti/src/lib/`; Fixture app `highlight` fixture | status | verified | `packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.ts`, `packages/ngx-yeti/src/lib/highlight/highlight.ts`; `apps/yeti-app/src/app/fixtures/fixtures.ts` |
| "there is no `node_modules/ngx-yeti`" | status | verified | `ls node_modules/ngx-yeti` in primary checkout -> No such file or directory |
| `npx nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name=<item> --skipModule` writes the `tsconfig.lib.json` include/exclude lines | command | verified | `node_modules/@nx/angular/generators.json:72-76`; schema has `name`, `library`, `skipModule`; `lib/update-tsconfig-included-files.js:18-34` appends include and exclude patterns |
| "ADR 0080 lists the collisions at the pin" | structure | verified | `docs/specs/adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md:16` |

## Doc: .claude/skills/ngx-yeti-stories/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Preview runs axe with `parameters.a11y.test = 'error'` and `runOnly` = `wcagTags` | config | verified | `packages/ngx-yeti/.storybook/preview.ts` `a11y: { test: 'error', options: { runOnly: { type: 'tag', values: [...wcagTags] } } }` |
| "Any `console.error` during a story fails it too (`beforeEach` and `afterEach` in the preview)" | feature | verified | `packages/ngx-yeti/.storybook/preview.ts` `spyOn(console, 'error')` / `expect(consoleError).not.toHaveBeenCalled()` |
| "`staticDirs` serves only `yeti-css/`" | config | verified | `packages/ngx-yeti/.storybook/main.ts` single `staticDirs` entry `to: '/yeti-css'` |
| "`highlight.stories.ts` is the pattern" (meta `id`, `component`, `moduleMetadata`, renamed prop) | structure | verified | `packages/ngx-yeti/src/lib/highlight/highlight.stories.ts:9-20` |
| `import { withColorScheme } from '../../.storybook/decorators'` | structure | verified | `packages/ngx-yeti/.storybook/decorators.ts` exports `withColorScheme('light' \| 'dark')` |
| "An item's own CSS file loads through its directive (`injectYetiItemStyles`)" | feature | aspirational | `rg injectYetiItemStyles --glob '!docs/specs/**'` -> no hit outside this skill; the setup spec, not yet implemented, owns it |
| Commands table: Storybook on port 4400; `test-storybook` Chromium locally, three engines with `CI`; `-c fast` | command | verified | `packages/ngx-yeti/project.json` `storybook.options.port: 4400`; `packages/ngx-yeti/vitest.config.mts` instances on `CI`; `nx.json` `test-storybook.configurations.fast` |

## Doc: .claude/skills/ngx-yeti-testing/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Layer table: files, runners, Playwright 1.63, commands `nx test-storybook ngx-yeti`, `nx test ngx-yeti`, `nx e2e ngx-yeti-e2e`, `nx e2e yeti-app-e2e` | command | verified | `package.json` `@playwright/test ^1.63.0`; `packages/ngx-yeti/project.json` `test`; `nx.json` storybook plugin `testStorybookTargetName`; `@nx/playwright/plugin` `e2e`; `apps/*-e2e/playwright.config.mts` |
| "The file suffix routes a spec to its Vitest project ..., under `src/` or an entry point's `<item>/src/`" | config | verified | `packages/ngx-yeti/vitest.unit.config.mts` `specRoots = '{src,*/src}'`, `nodeSpecs` |
| Shared helper exports `wcagTags` (six tags), contrast helpers, `replayShapedEvent` | feature | verified | `packages/ngx-yeti-testing/src/index.ts`; `wcag-tags.ts` has six tags |
| "`renderServer(rootComponent, { providers, hydrationFeatures, url, document })` ... `provideServerRendering()` and `provideClientHydration(withI18nSupport())`" | feature | verified | `packages/ngx-yeti-testing/src/lib/render-server.ts:12-50` |
| "`src/test-setup.ts` calls `setupTestBed()`"; `highlight.spec.ts` uses `TestBed.createDirective` with `inputBinding` | structure | verified | `packages/ngx-yeti/src/test-setup.ts`; `packages/ngx-yeti/src/lib/highlight/highlight.spec.ts:1,7,10` |
| "`yeti-manifest.node.spec.ts` already pins the manifest's component count" | feature | verified | `packages/ngx-yeti/src/yeti-manifest.node.spec.ts:4,8` `toHaveLength(49)` |
| `apps/ngx-yeti-e2e` opens the static build on port 4401 and never reuses a server | config | verified | `apps/ngx-yeti-e2e/playwright.config.mts:6,14,19`; `packages/ngx-yeti/project.json` `static-storybook.options.port: 4401` |
| Fixture app: `<base href="/sub/">`, `yeti-css` assets entry, global stylesheet, `provideClientHydration(withI18nSupport())`, one row per fixture served Prerender and Server | config | verified | `apps/yeti-app/src/index.html:6`; `apps/yeti-app/project.json` assets; `apps/yeti-app/src/app/app.config.ts`; `apps/yeti-app/src/app/app.routes.server.ts` |
| "Give every fixture one `i18n` text" | structure | stale | `apps/yeti-app/src/app/fixtures/highlight-fixture.ts:7` has `i18n`; `apps/yeti-app/src/app/fixtures/replay-fixture.ts` template has no `i18n` |
| `yeti-app-e2e` runs against `yeti-app:serve-ssr`, development by default, production with `FIXTURE_CONFIGURATION=production` | config | verified | `apps/yeti-app/project.json:79-82`; `apps/yeti-app-e2e/playwright.config.mts:26` |
| Helpers `test`/`expect`/`isProduction`, `axeViolations` (microtask timer; Firefox JS-off skip), `watchHydration`, `holdBackMainBundle` | feature | verified | `apps/yeti-app-e2e/src/support/fixtures.ts:4-17`; `support/axe.ts:9-30`; `support/hydration.ts:8-29`; `support/main-bundle.ts:9` |
| Engines: Chromium locally, three with `CI`; `safari` job sets `SAFARI=true` on `macos-latest`, headed via `safaridriver` | config | verified | `packages/ngx-yeti/vitest.unit.config.mts` (`SAFARI`, `headless: false`); `.github/workflows/ci.yml:30-46` |
| Floor variable table (`FLOOR_CHROMIUM_PATH`, `FLOOR_FIREFOX`, `FLOOR_FIREFOX_E2E`, `FLOOR_WEBKIT`, job names, what each runs) | config | verified | `.github/workflows/floor.yml:20-103`; `tools/playwright/browser-projects.mjs`; `packages/ngx-yeti/vitest.unit.config.mts` |
| "Each variable is a cache input of the targets it changes" | config | verified | `packages/ngx-yeti/project.json` `test.inputs` env entries; `nx.json` `namedInputs.e2e` env entries |
| Gates: `npm run check` = lint, typecheck, test, test-storybook; CI runs that plus builds, e2e, production `yeti-app-e2e` | command | verified | `package.json` `check` script; `.github/workflows/ci.yml:23-28` |

## Doc: .claude/skills/type-safety/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| `strictTypeChecked` and `stylisticTypeChecked` | config | verified | `eslint.config.mjs:139,143` |
| "`consistent-type-assertions` with `assertionStyle: 'never'`"; "`non-nullable-type-assertion-style` is off" | config | verified | `eslint.config.mjs:167,189-191` |
| `consistent-type-imports`, `consistent-type-exports`, `consistent-type-definitions: interface` | config | verified | `eslint.config.mjs:169,173,177` |
| `explicit-function-return-type` with the three allow options; "Specs are exempt" | config | verified | `eslint.config.mjs:180-187`; `:92` sets it `off` in `vitestConfig` |
| "`@eslint-community/eslint-comments/require-description`" | config | verified | `eslint.config.mjs:159` |
| "`angularConfig`: angular-eslint `tsAll` and `templateAll`" | config | verified | `eslint.config.mjs:102-106` |
| "`vitestConfig` for `**/*.spec.ts` in the Vitest projects only (`ngx-yeti`, `yeti-app`, `yeti-analog`)" | config | stale | `vitestConfig` is also spread by `packages/ngx-yeti-testing/eslint.config.mjs` (`rg -l vitestConfig`) |
| "about 40 more vitest rules at error, and `vitest/no-hooks`" | config | verified | `rg -c "'vitest/" eslint.config.mjs` -> 42; `:81` `vitest/no-hooks` |
| `tsconfig.base.json` strict flags and Angular strict template options | config | verified | `tsconfig.base.json` `compilerOptions` and `angularCompilerOptions` (`extendedDiagnostics.defaultCategory: error`) |
| Demonstration files: `highlight.spec.ts`, `ngx-yeti.spec.ts`, `app.spec.ts`, `ngx-yeti.stories.ts`, `vite.lib.config.mts` `isRecord`, `.storybook/main.ts` guard | structure | verified | files exist; `packages/ngx-yeti/vite.lib.config.mts:151`; `.storybook/main.ts` `isAnalogPlugin` |

## Doc: .claude/skills/type-safety/rules/angular-components.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Turned-off rules: `component-class-suffix`, `directive-class-suffix`, `require-localize-metadata`, `runtime-localize`, `template/no-call-expression`, `template/i18n`, `template/prefer-style-binding`, `template/use-track-by-function` | config | verified | `eslint.config.mjs:108-131` |
| `host: { '[style.background-color]': 'color()' }` in `highlight.ts` | structure | verified | `packages/ngx-yeti/src/lib/highlight/highlight.ts:5-6` |
| "`tsconfig.base.json` sets every extended diagnostic to error" | config | verified | `tsconfig.base.json` `extendedDiagnostics.defaultCategory: "error"` |

## Doc: .claude/skills/type-safety/rules/satisfies-patterns.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Arrow functions assigned to a typed variable or passed as a callback are exempt from `explicit-function-return-type` | config | verified | `eslint.config.mjs:180-187` `allowExpressions`, `allowTypedFunctionExpressions` |
| "`as const` is the only permitted use of the `as` keyword" | config | verified | `eslint.config.mjs:167` `assertionStyle: 'never'` (permits `as const`) |

## Doc: .claude/skills/type-safety/rules/sifers-pattern.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "`vitest/no-hooks` is an error in every Vitest project" | config | verified | `eslint.config.mjs:81`; `vitestConfig` spread by `packages/ngx-yeti`, `packages/ngx-yeti-testing`, `apps/yeti-app`, `apps/yeti-analog` eslint configs |
| `setupTestBed()` in `src/test-setup.ts`; `yeti-app` uses `@angular/build:unit-test` | config | verified | `packages/ngx-yeti/src/test-setup.ts`; `apps/yeti-app/project.json:92-93` |
| "Source: `packages/ngx-yeti/src/lib/highlight/highlight.spec.ts`" | structure | verified | file exists; `setup({ color })` at `:5` |

## Doc: .claude/skills/type-safety/rules/storybook-stories.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Stories use `@storybook/angular-vite`" | config | verified | `packages/ngx-yeti/.storybook/main.ts:1`; `highlight.stories.ts:1-5` |
| "`vitestConfig` only matches `*.spec.ts`" | config | verified | `eslint.config.mjs:41` |
| "`storybook/no-title-property-in-meta` is an error" via `flat/csf-strict` | config | verified | `eslint.config.mjs:215-216` spreads `flat/recommended` and `flat/csf-strict` |
| "`nx typecheck ngx-yeti -c stories`" | command | verified | `nx.json` typecheck `stories` configuration for `tag:storybook`; `packages/ngx-yeti/project.json` tags `storybook` |

## Doc: .claude/skills/type-safety/rules/typed-mocks.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Specs use `vitest/unbound-method` instead of `@typescript-eslint/unbound-method`" | config | verified | `eslint.config.mjs:96-97` |
| "Source: `packages/ngx-yeti/vite.lib.config.mts`" (`isRecord` guard) | structure | verified | `packages/ngx-yeti/vite.lib.config.mts:151-152` |

## Doc: .claude/skills/yeti-pin/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "`vendor/yeti/` holds exactly the files of `git archive <pin> src bin schema package.json package-lock.json LICENSE README.md`, plus `COMMIT`" | structure | verified | `tools/yeti/vendor-yeti.mjs:14-41`; `ls vendor/yeti` -> bin COMMIT LICENSE package.json package-lock.json README.md schema src |
| npm workspace package `yeti-css` with `exports` `manifest`, `tokens`, `css/*` | config | verified | root `package.json` `workspaces: ["vendor/yeti"]`; `vendor/yeti/package.json` name and `exports` |
| "`.nxignore` hides `vendor/yeti/package.json`"; plugin defines `yeti-css` with one target | config | verified | `.nxignore:2-4`; `tools/yeti/nx-plugin.mjs` single `yeti-build` target |
| `yeti-build` runs `node bin/build.js`, writes git-ignored `dist/`, Yeti's validator runs inside | feature | verified | `tools/yeti/nx-plugin.mjs` `command`, `outputs`; `.gitignore:4` `dist`; `vendor/yeti/bin/build.js:9,34` |
| `^yeti-build` in targetDefaults; `implicitDependencies: ["yeti-css"]` on `ngx-yeti` and `yeti-app` | config | verified | `nx.json` targetDefaults; `packages/ngx-yeti/project.json:4`; `apps/yeti-app/project.json:8` |
| "`yeti-css` is a non-buildable project, so an import of it from `ngx-yeti` source fails `@nx/enforce-module-boundaries`" | config | verified | `eslint.config.mjs:22-23,236` `enforceBuildableLibDependency: true`; `:240-247` disables it for never-shipped files (static; lint not run) |
| Item folders hold `<item>.css`, `docs.md`, `example.html`, `manifest.json` | structure | verified | `ls vendor/yeti/src/components/alert` |
| "`node tools/yeti/vendor-yeti.mjs <new full sha>` replaces `vendor/yeti` and `COMMIT`" | command | verified | `tools/yeti/vendor-yeti.mjs:6-41` |
| "`node bin/frozen.js <old full sha>` ... through `surfaceAt` and `compareSurfaces`" | integration | verified | `vendor/yeti/bin/frozen.js:21,48,77` |
| "public token defaults in `src/tokens/tokens.json`" | structure | verified | `vendor/yeti/src/tokens/tokens.json` exists |
| "`packages/ngx-yeti/README.md`" names the old sha | structure | verified | `packages/ngx-yeti/README.md:20` names `f52d1e8b...`, equal to `vendor/yeti/COMMIT` |

## Doc: AGENTS.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Targets that compile with Analog `fastCompile` never type-check" | feature | verified | `packages/ngx-yeti/vitest.unit.config.mts` `angular({ fastCompile: true, jit: false })`; `apps/yeti-analog/vite.config.ts` `fastCompile: true` |
| "Run `nx typecheck-watch <project>` beside `serve` or `storybook`" | command | verified | `nx.json` `typecheck-watch` targetDefault; declared in `packages/ngx-yeti`, `apps/yeti-app`, `apps/yeti-analog` project.json |
| "add `-c src`, `-c spec`, or `-c stories` to `nx typecheck`" | config | verified | `nx.json` typecheck configurations `src`, `spec`, `stories` |
| "`npm run check` and `npm run affected` do both" | command | verified | `package.json` `check` and `affected` include `typecheck` and `test` |
| "`docs/specs/` ... Start with `docs/specs/README.md`" | structure | verified | `docs/specs/README.md` exists |
| Skills table: `ngx-yeti-specs`, `ngx-yeti-testing`, `ngx-yeti-stories`, `ngx-yeti-accessibility`, `yeti-pin`, `type-safety` in `.claude/skills/` | structure | verified | each `.claude/skills/<name>/SKILL.md` exists (frozen inventory) |

GSD Path operating rules, the Nx MCP/skill guidance, and the distribution layout in this file describe installed dependencies, not this product; they were not audited.

## Doc: README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "no item is implemented yet" | status | verified | `packages/ngx-yeti/src/lib/` holds only the `highlight` and `ngx-yeti` scaffolds; no `packages/ngx-yeti/<item>/` entry points |
| "all 49 Yeti items and five shared pieces" | structure | verified | `docs/specs/specs/` holds 54 specs; `vendor/yeti/src/{components,layouts,recipes,utilities}` holds 49 item folders |
| Workspace table paths (`packages/ngx-yeti`, `packages/ngx-yeti-testing`, `apps/yeti-app`, `apps/yeti-app-e2e`, `apps/ngx-yeti-e2e`, `apps/yeti-analog`, `vendor/yeti`, `tools/yeti`, `docs/specs`, `docs/decisions`, `references`, `.claude/skills`) | structure | verified | all paths exist (`ls apps packages tools docs references`) |
| "What the workspace holds" table covers the workspace's apps | structure | stale | `apps/yeti-analog-e2e` (a Playwright project with `project.json`) exists and is not listed |
| Fixture app "serves one prerendered and one server-rendered route per item" | feature | verified | `apps/yeti-app/src/app/app.routes.server.ts` (`RenderMode.Prerender` and `server/<path>` `RenderMode.Server` per fixture) |
| `packages/ngx-yeti-testing` "imported as `@ngx-yeti/testing`; never published" | config | verified | `tsconfig.base.json` paths; `packages/ngx-yeti-testing/project.json` has no build or publish target |
| "You need Node.js 24 or later, which Yeti's build requires" | config | verified | `vendor/yeti/package.json` `engines.node: ">=24"` |
| "`npm ci` ... also links `vendor/yeti` as `node_modules/yeti-css`" | config | verified | root `package.json` `workspaces: ["vendor/yeti"]`; `vendor/yeti/package.json` name `yeti-css` |
| "Local runs use Chromium only"; `CI=true` runs all three engines | config | verified | `packages/ngx-yeti/vitest.unit.config.mts`; `packages/ngx-yeti/vitest.config.mts`; `tools/playwright/browser-projects.mjs` |
| "Nx builds Yeti before any task that needs it"; "`npx nx yeti-build yeti-css`" | command | verified | `nx.json` `^yeti-build` dependsOn; `tools/yeti/nx-plugin.mjs` |
| Scripts table (`check`, `affected`, `test`, `test-storybook`, `e2e`, `typecheck`, `storybook` on port 4400, `start`, `build`, `format:check`) | command | verified | `package.json` scripts; `packages/ngx-yeti/project.json` `storybook.options.port: 4400` |
| Storybook uses `fastCompile` only in the `-fast` scripts and compiles stories in JIT mode otherwise | config | verified | `package.json` `storybook-fast` etc. use `-c fast`; `nx.json` `fast` sets `ANGULAR_FAST_COMPILE`; `packages/ngx-yeti/.storybook/main.ts` `viteFinal` |
| Four test layers; node files end in `.ssr.spec.ts` or `.node.spec.ts` | config | verified | `packages/ngx-yeti/vitest.unit.config.mts` `nodeSpecs` |
| "Every story fails its test on any axe violation of the WCAG 2.2 AA tags, and on any `console.error`" | feature | verified | `packages/ngx-yeti/.storybook/preview.ts` |
| Baseline 2025 floor in `.browserslistrc`; "ESLint fails on CSS or TypeScript newer than Baseline 2025" | config | verified | `.browserslistrc` (chrome 141, edge 141, firefox 145, safari 26.2, ios_saf 26.2); `eslint.config.mjs:13,198,205-208` |
| Pin recorded in `vendor/yeti/COMMIT` | structure | verified | `vendor/yeti/COMMIT` = `f52d1e8b93de5bbde322480ba77d5be26c49b0ef` |
| `ci.yml`: prettier, lint, typecheck, tests, builds, e2e in three engines, production Fixture e2e, `safari` job | config | verified | `.github/workflows/ci.yml:3-46` |
| `floor.yml`: Chrome for Testing 141 runs both, Firefox 145 unit tests, earliest Playwright Firefox and WebKit not below the floor run the rest | config | verified | `.github/workflows/floor.yml:20-103` |
| Vendored Yeti license FSL-1.1-MIT (`vendor/yeti/LICENSE`) | config | verified | `vendor/yeti/package.json` `license`; `vendor/yeti/LICENSE` exists |

## Doc: apps/yeti-analog/AGENTS.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "This is an AnalogJS app" | structure | verified | `apps/yeti-analog/vite.config.ts` uses `@analogjs/platform` |
| Conventions are installed at `node_modules/@analogjs/platform/AGENTS.md` | integration | verified | file exists in the primary checkout's installed tree |

## Doc: docs/benchmarks/fast-compile.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Measured at `b7c75f5`", "`0bf3a63`", "`0ca8b67`" | status | verified | `git log -1` resolves each: b7c75f5 docs: explain the fastCompile and typecheck split; 0bf3a63 build(ngx-yeti): add a JavaScript-only build-fast configuration; 0ca8b67 fix(nx): define the typecheck spec configuration only where specs exist |
| "`0425fdc` split the `ngx-yeti` unit tests into browser and node projects" | status | verified | `git log -1 0425fdc` -> test(ngx-yeti): split unit tests into browser and node projects |
| "Story tests now run in three browsers only when `CI` is set and in Chromium otherwise" | config | verified | `packages/ngx-yeti/vitest.config.mts` `instances: process.env['CI'] ? [...] : [chromium]` |
| Timing tables (compile time, critical path, typecheck per tsconfig) | status | unverifiable | measurements on one machine at named commits; reproducing needs `vitest bench` on the same hardware |

## Doc: docs/specs/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "one spec for each of the 49 items in Yeti's manifest, and five shared specs" | structure | verified | 54 files in `docs/specs/specs/`; `packages/ngx-yeti/src/yeti-manifest.node.spec.ts:8` asserts 49 components |
| `Y/` pin `f52d1e8b93de5bbde322480ba77d5be26c49b0ef` | config | verified | equals `vendor/yeti/COMMIT` |
| Cross-cutting documents (`building-blocks.md`, `ledger.md`, `upstream-bugs.md`, `architecture-guide.md`, `CONTEXT.md`, `adr/`, ticket 50) | structure | verified | all exist (frozen inventory) |
| "[ingest-manifest.yaml](ingest-manifest.yaml)" | structure | verified | `docs/specs/ingest-manifest.yaml` exists |

## Doc: packages/ngx-yeti-testing/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Import them as `@ngx-yeti/testing`" | config | verified | `tsconfig.base.json` paths `@ngx-yeti/testing` |
| "The project is never built or published" | config | verified | `packages/ngx-yeti-testing/project.json` targets are `test` and `typecheck` only; no package.json |

## Doc: packages/ngx-yeti/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "no Yeti item is implemented" | status | verified | only scaffolds under `packages/ngx-yeti/src/lib/`; `package.json` version 0.0.1 |
| Requires "Angular 22.2" | config | verified | `packages/ngx-yeti/package.json` peer `@angular/core: ^22.2.0` |
| "pinned commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`" | config | verified | `vendor/yeti/COMMIT` |
| "building it needs Node.js 24 or later" | config | verified | `vendor/yeti/package.json` `engines.node: ">=24"` |
| Browsers "Chrome and Edge 141, Firefox 145, and Safari 26.2" | config | verified | `.browserslistrc` |
| "The setup spec lists all 16 imports in their required order" | structure | verified | `docs/specs/specs/setup.md:28,147`; `apps/yeti-app/src/styles.css` has 16 `@import`s |
| "The package ships none of Yeti's CSS" | config | verified | `packages/ngx-yeti/package.json` declares no `yeti-css` dependency |

The "What the package will give you" and "Planned setup" sections are explicitly labelled as plans that "do not work yet"; they were not scored as current claims.

## Doc: references/fast-compile.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| `ngx-yeti` `test`: `vitest.unit.config.mts`, AOT (`jit: false`), `browser` and `node` projects | config | verified | `packages/ngx-yeti/vitest.unit.config.mts`; `packages/ngx-yeti/project.json` `test.command` |
| `ngx-yeti-testing` `test`: `vitest.config.mts`, AOT, Node environment | config | verified | `packages/ngx-yeti-testing/vitest.config.mts`; `project.json` `test.command` |
| Storybook `-c fast` sets `ANGULAR_FAST_COMPILE=true` and `viteFinal` swaps the Analog plugins | config | verified | `nx.json` `storybook`/`build-storybook`/`test-storybook` `fast` configurations, `static-storybook.fast.buildTarget`; `packages/ngx-yeti/.storybook/main.ts` `viteFinal` |
| `build-fast` and `build-fast -c js` use `vite.lib.config.mts` | config | verified | `packages/ngx-yeti/project.json` `build-fast` and `configurations.js` |
| `yeti-analog` `analog({ fastCompile: true })` | config | verified | `apps/yeti-analog/vite.config.ts` |
| `ngx-yeti:build` uses ng-packagr; `yeti-app` uses `@angular/build` | config | verified | `packages/ngx-yeti/project.json` `@nx/angular:package`; `apps/yeti-app/project.json` `@angular/build:application` |
| `typecheck` runs `angular-typechecker` over the solution `tsconfig.json`, defined once in `nx.json` keyed on tags; opt in with `"typecheck": {}` | config | verified | `nx.json` `targetDefaults.typecheck`; every project.json declares `typecheck` |
| "`\"typecheck-watch\": {}` for the watcher; every project that holds TypeScript has one, the e2e projects included" | config | stale | `typecheck-watch` is declared only by `packages/ngx-yeti`, `apps/yeti-app`, `apps/yeti-analog`; `packages/ngx-yeti-testing`, `apps/ngx-yeti-e2e`, `apps/yeti-app-e2e`, `apps/yeti-analog-e2e` declare only `typecheck` |
| `-c src`, `-c spec`, `-c stories`; plain `typecheck` is the gate for `check`, `affected`, and CI | config | verified | `nx.json` configurations; `package.json` `check`/`affected`; `.github/workflows/ci.yml:24` |
| `typecheck-watch` reruns `typecheck` through `nx watch` | config | verified | `nx.json` `targetDefaults.typecheck-watch.command` |
| "`<yeti-nope />` in a template passes `test` and fails `typecheck` with `NG8001`" | feature | unverifiable | needs a probe template and both targets run; sidecar has no `node_modules` |
| "`build-fast` ... file tree, `package.json`, typings, and README match the ng-packagr output byte for byte" | feature | unverifiable | needs both builds run and diffed |
| `build-fast` typings from `ngc` with `_experimentalAllowEmitDeclarationOnly` | config | verified | `packages/ngx-yeti/vite.lib.config.mts:2,106` |
| `apps/yeti-analog/vite.config.ts` passes `workspaceRoot` | config | verified | `apps/yeti-analog/vite.config.ts` `analog({ workspaceRoot: ... })` |
| "`yeti-analog` names the `typecheck` executor in its `project.json`" | config | verified | `apps/yeti-analog/project.json` `typecheck.executor: angular-typechecker:typecheck` |
| `vitest.unit.config.mts` is separate from `vitest.config.mts` | structure | verified | both files exist in `packages/ngx-yeti/` |
| `test` runs no jsdom; `src/` and `<item>/src/` specs to `browser`; floor and `SAFARI` variables; `.ssr`/`.node` to `node`; `test`, `typecheck`, `lint` depend on `^yeti-build` | config | verified | `packages/ngx-yeti/vitest.unit.config.mts`; `nx.json` targetDefaults |
| `server.deps.inline` for `@angular/*`; `renderServer()` in `@ngx-yeti/testing/server`; `resolve.tsconfigPaths` | config | verified | `packages/ngx-yeti/vitest.unit.config.mts`; `packages/ngx-yeti-testing/vitest.config.mts`; `tsconfig.base.json` paths; `packages/ngx-yeti-testing/src/server.ts` |
| `production` excludes `vitest.*` and `src/test-setup.ts`; `@nx/dependency-checks` ignores `vite.lib.config.mts` | config | verified | `nx.json` `namedInputs.production`; `packages/ngx-yeti/eslint.config.mjs:16-22` |
| "fastCompile shortens dev server starts, builds, and test runs by about 10 to 35%" | status | unverifiable | summary of `docs/benchmarks/fast-compile.md` measurements; reproducing needs the benchmark run on the same hardware |

## Descriptive docs

`WORKFLOW.md` is the GSD Path pipeline SOP, an installed dependency; `apps/yeti-analog/CLAUDE.md` only points at its AGENTS.md. `docs/specs/**` other than its README is the verbatim planning bundle (never edited): its specs, ADRs, tickets, research, prototypes, and audits record decisions and measurements for items not yet built, or claims about upstreams (Yeti, Angular, APG) at cited commits; where the workspace departs from a record, `.claude/skills/ngx-yeti-specs/SKILL.md` lists it, and that table was audited. `vendor/yeti/**` is Yeti's own documentation, vendored verbatim by `git archive` at the pin; it describes the dependency, not this product.

- WORKFLOW.md
- apps/yeti-analog/CLAUDE.md
- docs/specs/CONTEXT.md
- docs/specs/adr/0001-yeti-licence-compatible-with-mit-package.md
- docs/specs/adr/0002-browser-target-baseline-2025.md
- docs/specs/adr/0003-directives-set-yetis-class-attributes-and-markers.md
- docs/specs/adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md
- docs/specs/adr/0005-closed-unions-from-yetis-vocabularies.md
- docs/specs/adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md
- docs/specs/adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md
- docs/specs/adr/0011-rendering-modes-contract-for-yeti.md
- docs/specs/adr/0012-class-prefix-and-token-naming.md
- docs/specs/adr/0013-parts-name-their-targets-by-reference.md
- docs/specs/adr/0014-testing-stack-for-yeti.md
- docs/specs/adr/0015-wcag-2-2-aa-enforcement-over-yeti.md
- docs/specs/adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md
- docs/specs/adr/0017-release-policy-with-a-pinned-yeti.md
- docs/specs/adr/0018-no-import-arrays-and-later-milestone-import-checks.md
- docs/specs/adr/0019-nav-and-dropdown-are-disclosure-navigation.md
- docs/specs/adr/0020-field-validity-comes-from-angular-forms.md
- docs/specs/adr/0021-dialog-is-a-directive-on-the-native-dialog.md
- docs/specs/adr/0022-button-declares-no-listeners.md
- docs/specs/adr/0023-fragment-links-are-same-document-links.md
- docs/specs/adr/0024-carousel-slides-are-not-inert-before-live.md
- docs/specs/adr/0025-toc-finds-its-headings-from-its-links.md
- docs/specs/adr/0040-package-replaces-yetis-optional-modules.md
- docs/specs/adr/0041-closing-on-navigation-is-a-per-instance-subscription.md
- docs/specs/adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md
- docs/specs/adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md
- docs/specs/adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md
- docs/specs/adr/0045-each-item-marks-its-host-with-its-own-attribute.md
- docs/specs/adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md
- docs/specs/adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md
- docs/specs/adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md
- docs/specs/architecture-guide.md
- docs/specs/audits/0001-research-wave.md
- docs/specs/audits/0002-second-wave.md
- docs/specs/audits/0003-third-wave.md
- docs/specs/audits/0004-final-consistency-review.md
- docs/specs/audits/0005-portability.md
- docs/specs/building-blocks.md
- docs/specs/issues/01-research-browser-baseline-vs-yeti.md
- docs/specs/issues/02-research-yeti-inventory.md
- docs/specs/issues/03-research-yeti-javascript-and-angular.md
- docs/specs/issues/04-research-yeti-styles-and-lazy-loading.md
- docs/specs/issues/05-task-carry-yeti-findings-from-old-map.md
- docs/specs/issues/06-decide-browser-target.md
- docs/specs/issues/07-decide-inherited-preferences-and-rulings.md
- docs/specs/issues/08-decide-inherited-adrs.md
- docs/specs/issues/09-decide-inherited-principles-and-building-blocks.md
- docs/specs/issues/10-decide-glossary.md
- docs/specs/issues/11-decide-spec-list.md
- docs/specs/issues/12-decide-yeti-version-policy.md
- docs/specs/issues/13-decide-style-loading.md
- docs/specs/issues/14-research-foundationcss-llms-txt.md
- docs/specs/issues/15-decide-yeti-licence-and-readiness.md
- docs/specs/issues/16-research-yeti-events-in-angular-templates.md
- docs/specs/issues/17-research-yeti-accessibility-and-standards.md
- docs/specs/issues/18-prototype-yeti-rendering-modes.md
- docs/specs/issues/19-research-yeti-validate-and-signal-forms.md
- docs/specs/issues/20-prototype-yeti-in-single-page-apps.md
- docs/specs/issues/21-prototype-yeti-as-github-dependency.md
- docs/specs/issues/22-prototype-building-and-consuming-yeti-with-nx.md
- docs/specs/issues/23-research-yeti-layers-and-import-order.md
- docs/specs/issues/24-prototype-ngx-yeti-with-tailwind-v4.md
- docs/specs/issues/25-decide-building-blocks-map.md
- docs/specs/issues/26-decide-yeti-data-attributes-mapping.md
- docs/specs/issues/27-research-testing-at-the-browser-floor.md
- docs/specs/issues/28-research-npm-build-metadata.md
- docs/specs/issues/29-prototype-aria-for-the-native-pattern-items.md
- docs/specs/issues/30-prototype-fitting-aria-by-directive-composition.md
- docs/specs/issues/31-research-yetis-removed-planning-documents.md
- docs/specs/issues/32-research-aria-directives-on-yetis-own-markup.md
- docs/specs/issues/33-research-decided-records-against-hydration-constraints.md
- docs/specs/issues/34-prototype-subclassing-aria-and-open-binding-forms.md
- docs/specs/issues/35-decide-hydration-safe-generated-ids.md
- docs/specs/issues/36-research-boundary-and-error-blocks.md
- docs/specs/issues/37-prototype-consumer-boundaries-around-ngx-yeti.md
- docs/specs/issues/38-spec-setup.md
- docs/specs/issues/39-spec-generated-ids.md
- docs/specs/issues/40-spec-events.md
- docs/specs/issues/41-spec-fragment-links.md
- docs/specs/issues/42-spec-navigation-close.md
- docs/specs/issues/43-spec-attention.md
- docs/specs/issues/44-spec-billboard.md
- docs/specs/issues/45-spec-enter.md
- docs/specs/issues/46-spec-lede.md
- docs/specs/issues/47-spec-lift.md
- docs/specs/issues/48-spec-print.md
- docs/specs/issues/49-spec-visually-hidden.md
- docs/specs/issues/50-decide-open-points-of-the-specs.md
- docs/specs/issues/51-spec-box.md
- docs/specs/issues/52-spec-breakout.md
- docs/specs/issues/53-spec-center.md
- docs/specs/issues/54-spec-cluster.md
- docs/specs/issues/55-spec-columns.md
- docs/specs/issues/56-spec-container.md
- docs/specs/issues/57-spec-cover.md
- docs/specs/issues/58-spec-frame.md
- docs/specs/issues/59-spec-grid.md
- docs/specs/issues/60-spec-icon.md
- docs/specs/issues/61-spec-layer.md
- docs/specs/issues/62-spec-masonry.md
- docs/specs/issues/63-spec-overlay.md
- docs/specs/issues/64-spec-scroller.md
- docs/specs/issues/65-spec-sidebar.md
- docs/specs/issues/66-spec-stack.md
- docs/specs/issues/67-spec-timeline.md
- docs/specs/issues/68-spec-hero.md
- docs/specs/issues/69-spec-media.md
- docs/specs/issues/70-spec-shell.md
- docs/specs/issues/71-spec-accordion.md
- docs/specs/issues/72-spec-affix.md
- docs/specs/issues/73-spec-alert.md
- docs/specs/issues/74-spec-badge.md
- docs/specs/issues/75-spec-breadcrumbs.md
- docs/specs/issues/76-spec-button.md
- docs/specs/issues/77-spec-buttons.md
- docs/specs/issues/78-spec-card.md
- docs/specs/issues/79-spec-carousel.md
- docs/specs/issues/80-spec-demo.md
- docs/specs/issues/81-spec-dialog.md
- docs/specs/issues/82-spec-dropdown.md
- docs/specs/issues/83-spec-field.md
- docs/specs/issues/84-spec-nav.md
- docs/specs/issues/85-spec-pagination.md
- docs/specs/issues/86-spec-progress.md
- docs/specs/issues/87-spec-seam.md
- docs/specs/issues/88-spec-spinner.md
- docs/specs/issues/89-spec-table.md
- docs/specs/issues/90-spec-tabs.md
- docs/specs/issues/91-spec-toc.md
- docs/specs/issues/92-spec-tooltip.md
- docs/specs/issues/93-decide-testing-at-the-browser-floor.md
- docs/specs/ledger.md
- docs/specs/map.md
- docs/specs/prototypes/aria-accordion/README.md
- docs/specs/prototypes/aria-buttons/README.md
- docs/specs/prototypes/aria-carousel/README.md
- docs/specs/prototypes/aria-composition-accordion/README.md
- docs/specs/prototypes/aria-composition-roving/README.md
- docs/specs/prototypes/aria-nav-dropdown/README.md
- docs/specs/prototypes/aria-subclass-and-open/README.md
- docs/specs/prototypes/consumer-boundaries/README.md
- docs/specs/prototypes/hydration-safe-ids/README.md
- docs/specs/prototypes/style-loading/README.md
- docs/specs/prototypes/style-loading/results/summary-0.md
- docs/specs/prototypes/style-loading/results/summary-300.md
- docs/specs/prototypes/yeti-github-dependency/README.md
- docs/specs/prototypes/yeti-nx-build/README.md
- docs/specs/prototypes/yeti-rendering-modes/README.md
- docs/specs/prototypes/yeti-rendering-modes/results/report.md
- docs/specs/prototypes/yeti-spa/README.md
- docs/specs/prototypes/yeti-tailwind/README.md
- docs/specs/research/aria-on-yeti-markup.md
- docs/specs/research/boundary-and-error-blocks.md
- docs/specs/research/browser-baseline-vs-yeti.md
- docs/specs/research/foundationcss-llms-txt.md
- docs/specs/research/hydration-constraints-audit.md
- docs/specs/research/npm-build-metadata.md
- docs/specs/research/old-forgotten-import-checks-spec.md
- docs/specs/research/testing-at-the-browser-floor.md
- docs/specs/research/yeti-accessibility-and-standards.md
- docs/specs/research/yeti-events-in-angular-templates.md
- docs/specs/research/yeti-foundation-7.md
- docs/specs/research/yeti-inventory.md
- docs/specs/research/yeti-javascript-and-angular.md
- docs/specs/research/yeti-layers-and-import-order.md
- docs/specs/research/yeti-planning-documents.md
- docs/specs/research/yeti-styles-and-lazy-loading.md
- docs/specs/research/yeti-validate-and-signal-forms.md
- docs/specs/specs/accordion.md
- docs/specs/specs/affix.md
- docs/specs/specs/alert.md
- docs/specs/specs/attention.md
- docs/specs/specs/badge.md
- docs/specs/specs/billboard.md
- docs/specs/specs/box.md
- docs/specs/specs/breadcrumbs.md
- docs/specs/specs/breakout.md
- docs/specs/specs/button.md
- docs/specs/specs/buttons.md
- docs/specs/specs/card.md
- docs/specs/specs/carousel.md
- docs/specs/specs/center.md
- docs/specs/specs/cluster.md
- docs/specs/specs/columns.md
- docs/specs/specs/container.md
- docs/specs/specs/cover.md
- docs/specs/specs/demo.md
- docs/specs/specs/dialog.md
- docs/specs/specs/dropdown.md
- docs/specs/specs/enter.md
- docs/specs/specs/events.md
- docs/specs/specs/field.md
- docs/specs/specs/fragment-links.md
- docs/specs/specs/frame.md
- docs/specs/specs/generated-ids.md
- docs/specs/specs/grid.md
- docs/specs/specs/hero.md
- docs/specs/specs/icon.md
- docs/specs/specs/layer.md
- docs/specs/specs/lede.md
- docs/specs/specs/lift.md
- docs/specs/specs/masonry.md
- docs/specs/specs/media.md
- docs/specs/specs/nav.md
- docs/specs/specs/navigation-close.md
- docs/specs/specs/overlay.md
- docs/specs/specs/pagination.md
- docs/specs/specs/print.md
- docs/specs/specs/progress.md
- docs/specs/specs/scroller.md
- docs/specs/specs/seam.md
- docs/specs/specs/setup.md
- docs/specs/specs/shell.md
- docs/specs/specs/sidebar.md
- docs/specs/specs/spinner.md
- docs/specs/specs/stack.md
- docs/specs/specs/table.md
- docs/specs/specs/tabs.md
- docs/specs/specs/timeline.md
- docs/specs/specs/toc.md
- docs/specs/specs/tooltip.md
- docs/specs/specs/visually-hidden.md
- docs/specs/upstream-bugs.md
- vendor/yeti/README.md
- vendor/yeti/src/components/accordion/docs.md
- vendor/yeti/src/components/affix/docs.md
- vendor/yeti/src/components/alert/docs.md
- vendor/yeti/src/components/badge/docs.md
- vendor/yeti/src/components/breadcrumbs/docs.md
- vendor/yeti/src/components/button/docs.md
- vendor/yeti/src/components/buttons/docs.md
- vendor/yeti/src/components/card/docs.md
- vendor/yeti/src/components/carousel/docs.md
- vendor/yeti/src/components/demo/docs.md
- vendor/yeti/src/components/dialog/docs.md
- vendor/yeti/src/components/dropdown/docs.md
- vendor/yeti/src/components/field/docs.md
- vendor/yeti/src/components/nav/docs.md
- vendor/yeti/src/components/pagination/docs.md
- vendor/yeti/src/components/progress/docs.md
- vendor/yeti/src/components/seam/docs.md
- vendor/yeti/src/components/spinner/docs.md
- vendor/yeti/src/components/table/docs.md
- vendor/yeti/src/components/tabs/docs.md
- vendor/yeti/src/components/toc/docs.md
- vendor/yeti/src/components/tooltip/docs.md
- vendor/yeti/src/guides/animations.md
- vendor/yeti/src/guides/base.md
- vendor/yeti/src/guides/color.md
- vendor/yeti/src/guides/components.md
- vendor/yeti/src/guides/install.md
- vendor/yeti/src/guides/layouts.md
- vendor/yeti/src/guides/migrating.md
- vendor/yeti/src/guides/responsive.md
- vendor/yeti/src/guides/stability.md
- vendor/yeti/src/guides/theming.md
- vendor/yeti/src/guides/visibility.md
- vendor/yeti/src/layouts/box/docs.md
- vendor/yeti/src/layouts/breakout/docs.md
- vendor/yeti/src/layouts/center/docs.md
- vendor/yeti/src/layouts/cluster/docs.md
- vendor/yeti/src/layouts/columns/docs.md
- vendor/yeti/src/layouts/container/docs.md
- vendor/yeti/src/layouts/cover/docs.md
- vendor/yeti/src/layouts/frame/docs.md
- vendor/yeti/src/layouts/grid/docs.md
- vendor/yeti/src/layouts/icon/docs.md
- vendor/yeti/src/layouts/layer/docs.md
- vendor/yeti/src/layouts/masonry/docs.md
- vendor/yeti/src/layouts/overlay/docs.md
- vendor/yeti/src/layouts/scroller/docs.md
- vendor/yeti/src/layouts/sidebar/docs.md
- vendor/yeti/src/layouts/stack/docs.md
- vendor/yeti/src/layouts/timeline/docs.md
- vendor/yeti/src/recipes/hero/docs.md
- vendor/yeti/src/recipes/media/docs.md
- vendor/yeti/src/recipes/shell/docs.md
- vendor/yeti/src/utilities/attention/docs.md
- vendor/yeti/src/utilities/billboard/docs.md
- vendor/yeti/src/utilities/enter/docs.md
- vendor/yeti/src/utilities/lede/docs.md
- vendor/yeti/src/utilities/lift/docs.md
- vendor/yeti/src/utilities/print/docs.md
- vendor/yeti/src/utilities/visually-hidden/docs.md

## Alignment (alignment mode only)

Not applicable: alignment mode is no (no prior `.project/` artifacts audited).

## User rulings

| Queue # | Ruling | User's words | Planned |
|---------|--------|--------------|---------|
| 1 | fix-code | "Accept all as recommended (recommended)" (2026-10-04; recommendation accepted: give the replay fixture an `i18n` text) | T012 |
| 2 | fix-doc | "Accept all as recommended (recommended)" (2026-10-04; recommendation accepted: say only served projects declare `typecheck-watch`) | T014 |
| 3 | fix-doc | "Accept all as recommended (recommended)" (2026-10-04; recommendation accepted: add the `apps/yeti-analog-e2e` row) | T014 |
| 4 | fix-doc | "Accept all as recommended (recommended)" (2026-10-04; recommendation accepted: add `ngx-yeti-testing` to the `vitestConfig` project list) | T012 |
| 5 | fix-doc | "Accept all as recommended (recommended)" (2026-10-04; recommendation accepted: mark `injectYetiItemStyles` as arriving with the setup spec) | T012 |
| 6 | accept-drift | "Accept all as recommended (recommended)" (2026-10-04; dated benchmark measurements) | n/a (accept-drift) |
| 7 | accept-drift | "Accept all as recommended (recommended)" (2026-10-04; recorded probe) | n/a (accept-drift) |
| 8 | accept-drift | "Accept all as recommended (recommended)" (2026-10-04; recorded comparison) | n/a (accept-drift) |
| 9 | accept-drift | "Accept all as recommended (recommended)" (2026-10-04; benchmark summary) | n/a (accept-drift) |

## Remediation queue

| # | Doc | Claim | Verdict | Class | Suggested action |
|---|-----|-------|---------|-------|------------------|
| 1 | .claude/skills/ngx-yeti-testing/SKILL.md | "Give every fixture one `i18n` text" | stale | NEEDS-USER | Add an `i18n` text to `apps/yeti-app/src/app/fixtures/replay-fixture.ts`, or exempt the replay fixture in the skill |
| 2 | references/fast-compile.md | "`\"typecheck-watch\": {}` for the watcher; every project that holds TypeScript has one, the e2e projects included" | stale | NEEDS-USER | Declare `typecheck-watch` in `ngx-yeti-testing` and the three e2e projects, or say only served projects declare it |
| 3 | README.md | "What the workspace holds" table covers the workspace's apps | stale | fix-doc | Add an `apps/yeti-analog-e2e` row |
| 4 | .claude/skills/type-safety/SKILL.md | "`vitestConfig` for `**/*.spec.ts` in the Vitest projects only (`ngx-yeti`, `yeti-app`, `yeti-analog`)" | stale | fix-doc | Add `ngx-yeti-testing` to the project list |
| 5 | .claude/skills/ngx-yeti-stories/SKILL.md | "An item's own CSS file loads through its directive (`injectYetiItemStyles`)" | aspirational | fix-doc | Mark `injectYetiItemStyles` as arriving with the setup spec |
| 6 | docs/benchmarks/fast-compile.md | Timing tables (compile time, critical path, typecheck per tsconfig) | unverifiable | NEEDS-USER | Accept as dated measurements, or rerun `vitest bench` to confirm |
| 7 | references/fast-compile.md | "`<yeti-nope />` in a template passes `test` and fails `typecheck` with `NG8001`" | unverifiable | NEEDS-USER | Confirm with a probe template in an installed checkout, or accept as recorded |
| 8 | references/fast-compile.md | "`build-fast` ... file tree, `package.json`, typings, and README match the ng-packagr output byte for byte" | unverifiable | NEEDS-USER | Run `build` and `build-fast` and diff the outputs, or accept as recorded |
| 9 | references/fast-compile.md | "fastCompile shortens dev server starts, builds, and test runs by about 10 to 35%" | unverifiable | NEEDS-USER | Accept as the benchmark summary, or rerun the benchmarks |
