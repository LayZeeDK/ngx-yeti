# Evidence — codebase

Repo root: D:\projects\github\LayZeeDK\ngx-yeti
Scanned: 2026-10-10 (revision f35b35f8d2ae07cf82272bee4665ef5e978c71f1, sidecar worktree)
Checks run: static reads only (`git log`, `ls`, `rg`, file reads). No build, test, lint, or typecheck ran: the sidecar has no `node_modules` (`ls node_modules` fails), so every Nx command is `unverifiable` there.

## Map

- **Stack**: Angular 22.2.1 (`@angular/*` pinned exactly), Nx 23.2.1, rxjs ~7.8, Express ^4.21, Analog ^2.8.0 (`@analogjs/router`, `platform`, `vite-plugin-angular`, `vitest-angular`), Vitest 4.1 with `@vitest/browser-playwright` and `-webdriverio`, Playwright ^1.63, Storybook ^10.6 (`@storybook/angular-vite`, `addon-a11y`, `addon-vitest`), `@axe-core/playwright` ~4.13. Source: `package.json`. Vendored Yeti CSS under `vendor/yeti` (`COMMIT`, `src/` with `base`, `components`, `layouts`, `guides`, `layers.css`).
- **Entry points**: library `packages/ngx-yeti` (primary entry `src/index.ts` is one line, `export type * from './yeti-types'`; secondary entry points `card`, `lift`, `styles`, each with `ng-package.json`, `README.md`, `src/index.ts`); `packages/ngx-yeti/accessibility.css` exported via the package `exports` map. Apps: `apps/yeti-app` (Angular CLI SSR Fixture app), `apps/yeti-analog` (Analog), with e2e projects `yeti-app-e2e`, `yeti-analog-e2e`, `ngx-yeti-e2e`. Helper library `packages/ngx-yeti-testing`. Tooling in `tools/` (`yeti`, `package`, `playwright`, `playwright-server`, `ci-local`).
- **Architecture**: items are attribute directives that call `injectYetiItemStyles` from `ngx-yeti/styles`, which inserts reference-counted head links to the consumer's Yeti build in rank order (`styles/src/yeti-rank.ts`, `inject-yeti-item-styles.ts`, `provide-yeti-styles.ts`). `yeti-types.ts` is generated from the vendored Yeti (`tools/yeti/generate-sources.mjs`). The Fixture app builds one client route and one `server/` route per entry in `apps/yeti-app/src/app/fixtures/fixtures.ts` (`app.routes.ts`, `app.routes.server.ts`: the plain route is prerendered, the `server/` route server-rendered). Currently registered fixtures: `card`, `lift`, `replay`, `setup`, `setup-boundaries`, `setup-defer`.
- **Conventions**: per-item folder `<item>/src/` with `<item>.ts`, `<item>.spec.ts` (browser), `<item>.ssr.spec.ts` and `<item>.contract.node.spec.ts` (node project), `<item>.stories.ts`, `index.ts`; directive doc comments hold numbered "Usage rules" (`card/src/card.ts`). Spec roots by suffix: `.ssr.spec.ts` and `.node.spec.ts` run in the node Vitest project, others in the browser project (`references/fast-compile.md:42`). Commits: Conventional Commits `type(scope): subject`, bisect-safe (AGENTS.md "Commits"); pipeline commits use `T###:`, `plan:`, `build:`, `ship:`. Instructions in AGENTS.md require `nx typecheck` beside any `fastCompile` target, and `docs/specs/` is read-only except `ledger.md` and `upstream-bugs.md`.
- **Maturity**: two items shipped (`card` with `card-link`, `lift`) plus `styles` and the contract/testing harness. 54 files in `docs/specs/specs/` (49 Yeti items plus cross-cutting specs such as `setup`, `events`, `generated-ids`, `fragment-links`, `navigation-close`, `demo`). `yeti-analog` has only `pages/(home).page.ts` (no item demo pages yet). `accessibility.css` currently holds only the Firefox viewport-length workaround (`@property --_ngx-yeti-viewport*`); no item rule yet. CI: `.github/workflows/ci.yml` (jobs include `static`, `package`, `unit`, `safari`) and `floor.yml`.
- **Recent activity**: of the commits since 2026-10-01 the subjects cluster as test (94), docs (81), build (78), refactor (30), fix (30). Last 25 commits are Playwright multi-engine and remote-server tooling, spec ledger rows, e2e hardening, then `build(gsd-path): move the project runtime to GSD Path 1.5.0` at HEAD. M001 `walking-skeleton` is shipped (ROADMAP.md); M002 `layouts-and-button` is `pending`.

## Finding: M002 starts from two items and a primary entry point that is types-only

- **Claim**: Only `card`, `lift`, `styles` exist as secondary entry points; none of M002's 22 items (17 layouts, `table`, `button`, `spinner`, `enter`, `visually-hidden`) exists in `packages/ngx-yeti/`.
- **Source**: `ls packages/ngx-yeti` (directories `card`, `lift`, `styles`); `.project/ROADMAP.md` M002 "Scope: in".
- **Confidence**: high
- **Why it matters here**: all 22 are new entry points, each made with the Nx generator (next finding).

## Finding: Entry points come from Nx's own secondary-entry-point generator

- **Claim**: "The generator" in ROADMAP.md is the upstream `@nx/angular:library-secondary-entry-point`, run as `nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule`, never by hand. `tools/yeti/nx-plugin.mjs` is not a generator: it exports `createNodes` (inferred targets).
- **Source**: `.project/ROADMAP.md:8`; `.project/SYNTHESIS.md:9` (settled "Entry points" decision); `.claude/skills/ngx-yeti-specs/SKILL.md:71`; `.project/archive/001-walking-skeleton/tasks/T006-lift-item-and-setup-stories.md:34` (used for `lift`); `tools/yeti/nx-plugin.mjs:8`.
- **Confidence**: high
- **Why it matters here**: the 22 new entry points are 22 runs of this generator, keeping the lines it writes in `tsconfig.base.json` and `packages/ngx-yeti/tsconfig.lib.json`.

## Finding: The specs already fix the test layers for a types-only layout

- **Claim**: `stack.md`, `grid.md`, and `box.md` each have a Testing Decisions section with all four layers: layer 1 stories with axe, layer 2 `<item>.spec.ts`, layer 3 `<item>.ssr.spec.ts`, layer 4 Playwright e2e. `stack.md:335` calls the stack a types-only item.
- **Source**: `docs/specs/specs/stack.md:284-311`, `grid.md:275-304`, `box.md:273-305`; ROADMAP M002 scope ("the four test layers" per `.project/ROADMAP.md:8`).
- **Confidence**: high
- **Why it matters here**: types-only does not drop a layer; the planner takes each spec's own story ids and layer cases.

## Finding: Fixture routes are a single registry

- **Claim**: Adding a Fixture route is one entry in `fixtures.ts`; both `app.routes.ts` and `app.routes.server.ts` derive the plain and `server/` routes from it, so each of the 22 items needs one fixture component and one registry line.
- **Source**: `apps/yeti-app/src/app/app.routes.ts`, `app.routes.server.ts`, `fixtures/fixtures.ts`.
- **Confidence**: high
- **Why it matters here**: M002 success criterion 2 (prerendered and server-rendered route per item) maps to this registry.

## Finding: Cases M001 left for M002 are not yet in the code

- **Claim**: `card.stories.ts` and the card fixture exist, but the carried-over cases (`setup--item-links` story, layer-4 order case, `lift--default` with a `yetiCluster`, card grid fixture, Tailwind C1/C2 Fixture configs) depend on layouts that do not exist; `setup.stories.ts` and `item-links.ts` exist in `styles/src` and `ngx-yeti-testing/src/lib`.
- **Source**: `ls packages/ngx-yeti/card/src`, `ls packages/ngx-yeti/styles/src`, `.project/ROADMAP.md` M002 "Cases carried over from M001". Story contents were not read case by case.
- **Confidence**: medium
- **Why it matters here**: the planner must confirm which of these names already exist as partial stories before treating them as new.

## Finding: Pinned Yeti is an alpha with a version string tied to it

- **Claim**: the package version is `0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8` and `yeti-types.ts` is generated from the vendored Yeti ("Generated by bin/gen-types.js ... Do not edit"); setup spec lists 49 items in `YetiComponentName`.
- **Source**: `packages/ngx-yeti/package.json`, `packages/ngx-yeti/src/yeti-types.ts:1`, `docs/specs/specs/setup.md:130`.
- **Confidence**: high
- **Why it matters here**: any M002 change that touches the pin or generated sources goes through the gated pin move of the `yeti-pin` skill.

## Apparent intent

- The project is building a typed Angular directive wrapper for each of Yeti's 49 items, one secondary entry point each, with SSR-safe, reference-counted CSS loading as the base — based on `setup.md`, `ROADMAP.md`, and the card/lift/styles layout.
- The Fixture app and the Analog app serve different roles (per-item Fixture routes versus later Examples) — based on ROADMAP.md notes on M008 and M009.

## Open questions for define

- None.

## Blocked areas

- Build, test, lint, typecheck, and Storybook behaviour — the sidecar has no `node_modules`, so no Nx command ran; results of `npm run check` are `unverifiable` here.
- Story and e2e file contents were not read in depth; counts of existing stories per item were not taken.
