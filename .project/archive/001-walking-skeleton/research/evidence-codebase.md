# Evidence — codebase

<!-- Written by the codebase mapper during /gsd-path-inspect. Read by define
     (brownfield mode), researchers (fifth standard dimension), the planner
     (conventions are binding), and reviewers. -->

Repo root: D:\projects\github\LayZeeDK\ngx-yeti
Scanned: 2026-10-04 (Audited HEAD 5a279bdc6ed0588c03a4ee34ba64bf242dff88f9, in the inspect-codebase verify sidecar; first scanned at 69831457d88cf77c281e04d838e8b653f13cc0a8)
Checks run:
- At 5a279bd: `git rev-parse HEAD` -> `5a279bdc6ed0588c03a4ee34ba64bf242dff88f9`; `git status --short` empty.
- At 5a279bd: `git diff --stat 69831457d88cf77c281e04d838e8b653f13cc0a8 5a279bdc6ed0588c03a4ee34ba64bf242dff88f9` -> `.gitignore | 1 -`, 1 file changed, 1 deletion. The full diff removes only the `.project` line from the "IDEs and editors" block. So the only change since the checks below is `.gitignore`, and every other finding holds at 5a279bd.
- At 5a279bd: `git check-ignore -v .project/STATE.md` -> no output, exit 1 (not ignored).
- The checks below ran at 69831457 in an earlier sidecar. The Recent activity counts in the Map also come from 69831457, which is one commit before 5a279bd (`build(git): stop ignoring the .project directory`).
- `git rev-parse HEAD` -> `69831457d88cf77c281e04d838e8b653f13cc0a8` (matched the recorded baseline at that time); sidecar tree clean.
- `npm ci --no-audit --no-fund` -> exit 0. npm 11 `allow-scripts` withheld install scripts (`nx` postinstall, `esbuild` install, `msgpackr-extract`); later tasks still ran.
- `env NX_DAEMON=false NX_NO_CLOUD=true npx nx show projects` -> 9 projects: `ngx-yeti`, `ngx-yeti-testing`, `ngx-yeti-e2e`, `yeti-app`, `yeti-app-e2e`, `yeti-analog`, `yeti-analog-e2e`, `yeti-css`, `@ngx-yeti/source`.
- `env NX_DAEMON=false NX_NO_CLOUD=true npx nx run-many -t lint typecheck test --skip-nx-cache --outputStyle=static` -> exit 0, "Successfully ran targets lint, typecheck, test for 7 projects and 1 task they depend on" (the dependency is `yeti-css:yeti-build`). Test counts: `ngx-yeti-testing` 3 files / 50 tests pass; `ngx-yeti` (Vitest browser, Chromium + node projects) 4 files / 7 tests pass; `yeti-app` (`@angular/build:unit-test`) 1 file / 1 test passes; `yeti-analog` 1 file / 1 test passes.
- Not run: `test-storybook`, `build`, `build-fast`, `e2e` (all Playwright projects), the Firefox/WebKit/Safari engine variants. Their status is `unverifiable` here; the CI workflows are read statically below.

## Map

- **Stack**: TypeScript `~6.0.3`, Angular `22.2.1` (core, common, compiler, forms, localize, platform-browser, platform-server, router, ssr), Nx `23.2.1` with `@nx/angular`, `@nx/vite`, `@nx/playwright`, `@nx/storybook`, `@nx/eslint`; Vitest `^4.1.11` in browser mode through `@vitest/browser-playwright` and `@vitest/browser-webdriverio`; Analog `^2.8.0` (`@analogjs/vite-plugin-angular` with `fastCompile`, `@analogjs/platform`, `@analogjs/router`); Storybook `^10.6.1` (`@storybook/angular-vite`, addon-a11y, addon-vitest); Playwright `^1.63.0`, `axe-core ~4.13.0`; ESLint 9 flat config with `angular-eslint ^22.1.0`, `typescript-eslint`, `eslint-plugin-baseline-js`, `@eslint/css`; Prettier `~3.9.9`; `ng-packagr ~22.2.0`; `angular-typechecker ~0.2.4` for the `typecheck` executor; Vite `^8.3.2`, rolldown. npm workspaces with one member, `vendor/yeti` (package `yeti-css` 7.0.0-alpha.0, FSL-1.1-MIT, `engines.node >=24`). CI uses Node 24. (package.json; vendor/yeti/package.json; .github/workflows/ci.yml:19)
- **Entry points**: Published library `packages/ngx-yeti` -> `src/index.ts` (single ng-packagr entry, `ng-package.json` `lib.entryFile`), exports `Highlight` and `NgxYeti`. Internal helper library `packages/ngx-yeti-testing` with two entry points, `@ngx-yeti/testing` (`src/index.ts`: contrast maths, `replayShapedEvent`, `wcagTags`) and `@ngx-yeti/testing/server` (`src/server.ts`: `renderServer`), mapped in `tsconfig.base.json:17-21`. Apps: `apps/yeti-app` (Angular SSR "Fixture app", `main.ts`, `main.server.ts`, Express `server.ts`, dev server under `/sub/`), `apps/yeti-analog` (Analog demo, `pages/(home).page.ts`, `server/routes/api/v1/hello.ts`). E2E: `apps/ngx-yeti-e2e` (Playwright against static Storybook on port 4401), `apps/yeti-app-e2e` (Playwright against the Fixture app), `apps/yeti-analog-e2e`. Tooling: `tools/yeti/nx-plugin.mjs` (inferred `yeti-css` project with `yeti-build` = `node bin/build.js`), `tools/yeti/vendor-yeti.mjs` (re-vendors Yeti at a full SHA), `tools/playwright/browser-projects.mjs`.
- **Architecture**: Nx monorepo whose product is one Angular library that is still a generator scaffold; nearly all built code is test, build, and CI infrastructure around it. Yeti's CSS source is vendored at `vendor/yeti` (pin in `vendor/yeti/COMMIT` = `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`), linked as `node_modules/yeti-css` by npm workspaces, and built by the inferred `yeti-css:yeti-build` target, which `nx.json` targetDefaults make a `^yeti-build` dependency of build, test, lint, typecheck, storybook, and dev-server targets. The Fixture app maps each entry in `fixtures.ts` to a prerendered route `/<item>` and a server-rendered route `/server/<item>` (`app.routes.ts`, `app.routes.server.ts`), copies Yeti's `dist/css` as an `assets` glob, and imports Yeti's always-loaded CSS in `@layer yeti, ngx-yeti` order (`apps/yeti-app/src/styles.css`). Tests follow four layers: story play functions with axe (`test-storybook`), Vitest browser unit tests (`test`), Node `*.ssr.spec.ts` / `*.node.spec.ts` via `renderServer`, and Playwright e2e with JavaScript on and off.
- **Conventions**: Conventional Commits `type(scope): subject` with Nx project or tool as scope (git log: `build(nx)`, `docs(skills)`, `test(ngx-yeti-e2e)`, `ci:` ...). Angular prefix `yeti` (`packages/ngx-yeti/project.json:6`; selectors `[yetiHighlight]`, `yeti-ngx-yeti`), signal `input()`s, standalone, `host` metadata instead of decorators, class names without `Component`/`Directive` suffix (`Highlight`, `NgxYeti`). Fixtures use `ChangeDetectionStrategy.OnPush` and `i18n` attributes. Very strict TS (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `checkJs`, `isolatedModules`) and Angular (`strictTemplates`, `typeCheckHostBindings`, `extendedDiagnostics` default error) in `tsconfig.base.json`. ESLint: `assertionStyle: 'never'` (no `as` casts), Baseline 2025 for both CSS (`css/use-baseline`) and JS (`baseline-js/use-baseline`), module boundaries forbid `type:lib` -> `type:testing` (`eslint.config.mjs:22-35`). Spec files: `describe(Class, ...)`, `expect.assertions(n)` in async tests, no hooks (per the `type-safety` skill). Prettier `singleQuote`. Node specs named `*.ssr.spec.ts` / `*.node.spec.ts` are routed to a Node Vitest project; all other `*.spec.ts` run in the browser (`packages/ngx-yeti/vitest.unit.config.mts:56-100`). Each commit must pass `npx prettier --check .` and `nx run-many -t lint typecheck test` (AGENTS.md "Commits").
- **Maturity**: Runs: lint, typecheck, and unit/SSR tests for 7 projects pass uncached (checks above). Product code is placeholder: `NgxYeti` renders `<p>{{ packageName() }} works!</p>` and `Highlight` sets `background-color`; neither is one of the 49 Yeti items specified under `docs/specs/specs/` (54 spec files, no `highlight.md`). Test infrastructure is the mature part: `ngx-yeti-testing` has 50 passing tests; Fixture-app e2e covers hydration diagnostics, JS-off rendering with Yeti styles, axe with JS on/off, and event replay before hydration (`apps/yeti-app-e2e/src/fixture-app.spec.ts`); a build-output test pins 66 copied Yeti CSS files (`build-output.spec.ts:9-16`). CI: `ci.yml` runs prettier, `lint typecheck test test-storybook build`, all e2e, and a production Fixture e2e on Ubuntu with Chromium/Firefox/WebKit, plus `nx test ngx-yeti` on real Safari (macOS); `floor.yml` runs test/e2e at Chrome 141, Firefox 145, WebKit 26.4. `yeti-analog` is untouched generator output with no `ngx-yeti` or `yeti-css` dependency.
- **Recent activity**: 141 commits, all dated 2026-10-02 (9) and 2026-10-03 (132). Scope clusters: `docs(skills)` 14, `build(nx)` 12, `ci` 11, `docs` 8, `build(storybook)` 8, `build(eslint)` 7, `test(storybook)` 6, then `test(yeti-app-e2e|ngx-yeti-testing|ngx-yeti-e2e)` 5 each. The last ~40 commits harden test infrastructure (e2e helpers, browser floor CI, Nx cache keys, Yeti pin hashing) and align agent skills/docs with it; the latest is `build(ngx-yeti): require Angular 22.2 as a peer`. A decision trail of the infrastructure work is in `docs/decisions/2026-10-03-test-infrastructure.tsv` (98 rows). `fbd51f5` added the GSD Path contracts and guard hook.

## Finding: `.gitignore` no longer ignores the pipeline's `.project/` directory

- **Claim**: At 69831457, line 13 of `.gitignore` was `.project`, an Eclipse leftover in the "IDEs and editors" block, and it ignored every GSD Path artifact path. Commit 5a279bd (`build(git): stop ignoring the .project directory`) deleted that line. At 5a279bd, `git check-ignore -v .project/STATE.md` prints nothing and exits 1, so the path is not ignored. No `.project/` file is tracked yet.
- **Source**: `git diff 69831457d88cf77c281e04d838e8b653f13cc0a8 5a279bdc6ed0588c03a4ee34ba64bf242dff88f9 -- .gitignore` (one line removed: `-.project`); `git check-ignore -v .project/STATE.md` at 5a279bd (exit 1).
- **Confidence**: high
- **Why it matters here**: The pipeline's checkpoint commits contain only `.project/` paths: roadmap and plan approval, build transitions, and the ship commit. They can now stage `.project/` with a plain `git add`, without `-f`. Re-adding a broad `.project` pattern to `.gitignore` would block those commits again.

## Finding: The published library is a generator scaffold; no Yeti item exists

- **Claim**: `packages/ngx-yeti/src/index.ts` exports only `Highlight` (`[yetiHighlight]` -> `style.background-color`) and `NgxYeti` (`<p>ngx-yeti works!</p>`). Neither maps to any of the 49 items in Yeti's manifest; both exist as targets for the test layers (story, browser unit, SSR, Fixture app, e2e).
- **Source**: `packages/ngx-yeti/src/index.ts:1-2`; `src/lib/highlight/highlight.ts:3-11`; `src/lib/ngx-yeti/ngx-yeti.ts:3-11`, `ngx-yeti.html:1`; `ls docs/specs/specs` (no highlight/ngx-yeti spec); `apps/ngx-yeti-e2e/src/ngx-yeti.spec.ts:7-9`; `apps/yeti-app/src/app/fixtures/fixtures.ts:5-8`.
- **Confidence**: high
- **Why it matters here**: Implementing an item means replacing or deleting these placeholders, and several e2e and story tests (`openStory(page, 'src-lib-ngx-yeti--heading')`, the `highlight` fixture route, the SSR spec) currently assert against them. A plan that removes them must move those infrastructure tests onto a real item in the same change.

## Finding: The package has one entry point; the specs require one per item

- **Claim**: `ng-package.json` declares only the primary entry (`lib.entryFile: src/index.ts`) and there is no secondary entry-point folder. ADR 0011 point 10 requires each item to be its own entry point (`ngx-yeti/<item>`) and rejects one entry point for the whole package; `tsconfig.base.json` maps only `ngx-yeti` to `src/index.ts`.
- **Source**: `packages/ngx-yeti/ng-package.json:1-7`; `tsconfig.base.json:18`; `docs/specs/adr/0011-rendering-modes-contract-for-yeti.md:22,31`.
- **Confidence**: high
- **Why it matters here**: The first real item also has to establish the secondary entry-point layout (ng-packagr sub-package, path mapping, `build-fast` vite lib config, Storybook globs). That structural work is not done and is not visible from the README.

## Finding: Angular CDK and Angular Aria are not dependencies

- **Claim**: `package.json` and `node_modules/@angular` contain no `@angular/cdk` or `@angular/aria`; `packages/ngx-yeti/package.json` peers only `@angular/core ^22.2.0`. The specs build on both, for example ADR 0042 takes generated ids from CDK's `_IdGenerator` and cites Aria directives.
- **Source**: `package.json` dependencies; `ls node_modules/@angular` (animations build cli common compiler compiler-cli core forms language-service localize platform-browser platform-browser-dynamic platform-server router ssr); `packages/ngx-yeti/package.json:4-6`; `docs/specs/adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md:9`.
- **Confidence**: high
- **Why it matters here**: The shared `generated-ids` spec and any Aria-hosted item need new dependencies and peer dependencies; a planner reading the spec alone would assume they are installed.

## Finding: `yeti-analog` is unrelated generator output

- **Claim**: `apps/yeti-analog` renders `<h1>Welcome yeti-analog</h1>` and a `hello` API route, imports nothing from `ngx-yeti`, has no `yeti-css` implicit dependency, and its e2e asserts only that the heading contains "Welcome". It is nevertheless part of `run-many` lint/typecheck/test (passes) and the CI e2e run.
- **Source**: `apps/yeti-analog/project.json:1-17`; `apps/yeti-analog/src/app/pages/(home).page.ts:3-7`; `apps/yeti-analog/src/server/routes/api/v1/hello.ts:3`; `apps/yeti-analog-e2e/src/example.spec.ts:3-7`; `.github/workflows/ci.yml:25`.
- **Confidence**: high
- **Why it matters here**: It costs CI time and appears in every `run-many`. Its role (future demo or docs site, fastCompile benchmark, or removable) is not stated in code.

## Finding: Yeti is vendored source, built in-workspace, hidden from Nx and Prettier

- **Claim**: `vendor/yeti` holds Yeti's `src`, `bin`, `schema`, manifests, and license at the SHA in `vendor/yeti/COMMIT`, written by `tools/yeti/vendor-yeti.mjs`. `.nxignore` hides `vendor/yeti/package.json` so Yeti's own scripts do not become Nx targets; the custom plugin keys `yeti-css` on `vendor/yeti/COMMIT` so a pin move changes the cache hash; `.prettierignore` excludes `/vendor` and `/docs/specs`. Yeti's build output (`dist/`) is not committed and is produced by `yeti-css:yeti-build` before dependent tasks.
- **Source**: `tools/yeti/vendor-yeti.mjs:14-44`; `tools/yeti/nx-plugin.mjs:5-45`; `.nxignore`; `.prettierignore`; `nx.json:58,64,72,84,117,183,203,206,209`; 277 tracked files under `vendor/`.
- **Confidence**: high
- **Why it matters here**: Never edit `vendor/yeti` by hand; moving the pin is a scripted operation (the `yeti-pin` skill). Any new target that reads Yeti's CSS or manifest needs `^yeti-build` (via targetDefaults) or it races or reads a missing `dist/`.

## Finding: `fastCompile` targets do not type-check

- **Claim**: `packages/ngx-yeti/vitest.unit.config.mts:63` uses `angular({ fastCompile: true, jit: false })`; Storybook `-c fast` configurations set `ANGULAR_FAST_COMPILE=true` (`nx.json:76-80,104-108,185-189`). Type checking comes only from the separate `typecheck` target (`angular-typechecker:typecheck`, `strict: true`, `maxWarnings: 0`, with `src`/`spec`/`stories` configurations by tag).
- **Source**: files and lines above; `nx.json:115-181`.
- **Confidence**: high
- **Why it matters here**: A task Verify that runs only `test` or `build-fast` can pass with template or type errors; Verify commands should pair them with `nx typecheck <project>`.

## Finding: Browser test matrix depends on environment variables

- **Claim**: `ngx-yeti`'s `test` target selects engines from env: default Chromium only; `CI` adds Firefox and WebKit; `FLOOR_FIREFOX`, `SAFARI`, `FLOOR_WEBKIT`, `FLOOR_CHROMIUM_PATH` switch providers to WebdriverIO or a pinned binary. These env vars are declared as Nx inputs so cached results differ per engine.
- **Source**: `packages/ngx-yeti/vitest.unit.config.mts:8-54`; `packages/ngx-yeti/project.json:43-61`; `nx.json:31-53`; `.github/workflows/floor.yml`.
- **Confidence**: high
- **Why it matters here**: A local green run proves Chromium only. Cross-engine claims need CI evidence or an explicit `CI=true` run with browsers installed.

## Finding: npm install scripts are withheld by npm 11 `allow-scripts`

- **Claim**: `npm ci` under npm 11.16.0 skipped install scripts for `nx`, `esbuild`, and `msgpackr-extract` and suggested `npm approve-scripts`; lint, typecheck, unit tests, and `yeti-build` still succeeded afterwards. The repo has no committed approval configuration for these scripts.
- **Source**: `npm ci` log tail in the sidecar (`npm warn allow-scripts ... Run npm approve-scripts ...`); `npm --version` -> 11.16.0.
- **Confidence**: medium (only lint/typecheck/test were exercised; build, Storybook, and e2e were not run with the withheld scripts)
- **Why it matters here**: If a later build or Playwright path depends on one of those postinstalls, fresh clones on npm 11 could fail in ways CI (setup-node's bundled npm) does not show.

## Apparent intent

- The repository is the infrastructure-first start of `ngx-yeti`, an Angular 22.2 directive library for all 49 Yeti items plus five shared pieces (setup, generated-ids, events, fragment-links, navigation-close), each item a separate entry point, WCAG 2.2 AA, SSR/hydration/event replay, Baseline 2025 browsers — based on `README.md`, `packages/ngx-yeti/README.md`, `docs/specs/README.md`, and the shape of the test infrastructure (inference).
- The next milestone(s) likely begin implementing items, starting with shared pieces (setup/accessibility CSS, generated ids) that items depend on — based on the specs' shared section and the absence of any item code (inference).
- The Fixture app is designed to grow one prerendered and one server-rendered route per item through the `fixtures` record — based on `app.routes.ts` / `app.routes.server.ts` and the README table (inference, consistent with code).

## Open questions for define

- Which items or shared specs does this milestone deliver, and in what order (for example setup + generated-ids before any component)?
- Should the placeholder `NgxYeti` component and `Highlight` directive be deleted once a real item exists, and which real item takes over their role as the test-infrastructure target?
- Is `apps/yeti-analog` meant to stay (demo/docs site, fastCompile benchmark) or be removed from the workspace?
- Are `@angular/cdk` and `@angular/aria` to be added now as dependencies and peer dependencies, at which versions?
- Does the first item need to establish the per-item secondary entry-point layout, or is that a separate setup task?
- Should npm 11 `allow-scripts` approvals be committed for `nx` / `esbuild`, or is the current behaviour accepted?

## Blocked areas

- `test-storybook`, `build`, `build-fast`, and all `e2e` targets — not run in this sidecar (time and browser setup); recorded as unverifiable, CI config read statically.
- Firefox, WebKit, Safari, and browser-floor variants — require CI runners or extra browser installs; not exercised.
- `docs/specs/` (523 files) — read only for README, map excerpts, the spec file list, and ADRs 0011/0012/0042; individual specs were not audited (the docs auditor owns that, and the bundle is never edited).
- `vendor/yeti/` internals — not inspected beyond `package.json` and `COMMIT`; vendored upstream code.
