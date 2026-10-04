---
id: T002
title: Build the ngx-yeti/styles loader and the card directives at generator-made entry points
wave: 1
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tsconfig.base.json
  - packages/ngx-yeti/tsconfig.lib.json
  - packages/ngx-yeti/vite.lib.config.mts
  - packages/ngx-yeti/project.json
  - packages/ngx-yeti/eslint.config.mjs
  - .prettierignore
  - packages/ngx-yeti/src/index.ts
  - packages/ngx-yeti/src/yeti-types.ts
  - packages/ngx-yeti/src/yeti-types.node.spec.ts
  - packages/ngx-yeti/styles/ng-package.json
  - packages/ngx-yeti/styles/README.md
  - packages/ngx-yeti/styles/src/index.ts
  - packages/ngx-yeti/styles/src/yeti-styles.ts
  - packages/ngx-yeti/styles/src/inject-yeti-item-styles.ts
  - packages/ngx-yeti/styles/src/provide-yeti-styles.ts
  - packages/ngx-yeti/styles/src/yeti-rank.ts
  - packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts
  - packages/ngx-yeti/styles/src/yeti-styles.spec.ts
  - packages/ngx-yeti/card/ng-package.json
  - packages/ngx-yeti/card/README.md
  - packages/ngx-yeti/card/src/index.ts
  - packages/ngx-yeti/card/src/card.ts
  - packages/ngx-yeti/card/src/card-link.ts
  - packages/ngx-yeti/card/src/card-tokens.ts
  - tools/yeti/generate-sources.mjs
  - .claude/skills/yeti-pin/SKILL.md
---

# T002 — Build the ngx-yeti/styles loader and the card directives at generator-made entry points

## Context

The setup spec (`docs/specs/specs/setup.md`) owns the ADR 0060 loader every item directive calls: a root service that keeps one reference-counted stylesheet link per item file of the consumer's Yeti build, writes it on the server, adopts it at hydration, inserts it in Yeti's order, and removes it only in the frame after its count is zero and no host carrying the item's presence attribute (ADR 0045) is connected. Program and milestone synthesis settle that each item gets its own secondary entry point made only with `npx nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule`, that input types come from a generated `yeti-types.ts` copy of Yeti's `yeti.d.ts` (published declarations never import `yeti-css`), and that the rank table and pin constant are generated from Yeti's build at the pin `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. This task burns down wave-1 blocker 2: the generator-made layout must be picked up by `nx build`, `nx build-fast`, `nx typecheck -c src`, and the Vitest `{src,*/src}` spec roots, proven on the `styles` entry and on `card`, the first real item (`docs/specs/specs/card.md`), whose two directives are written here so later tasks can test and serve them. The primary entry point keeps the placeholder exports until the placeholder task removes them; here it only gains the type re-export.

## Approach

- Create both entry points with the generator (`--name=styles` and `--name=card`, `--skipModule`); keep the `tsconfig.base.json` path aliases and the `packages/ngx-yeti/tsconfig.lib.json` include and exclude lines it writes, and replace its `greeting` placeholder in each entry point's `index.ts`. Never make or edit an entry point by hand beyond its source files. Read `.claude/skills/ngx-yeti-specs/SKILL.md` ("Where code goes", naming) first.
- Generated sources: write `tools/yeti/generate-sources.mjs` (Node ESM) that reads Yeti's built output at the pin (the `yeti.d.ts` and the `yeti.css` entry stylesheet that `yeti-css:yeti-build` writes under vendor/yeti/dist) and `vendor/yeti/COMMIT`, and writes `packages/ngx-yeti/src/yeti-types.ts` (a copy of `yeti.d.ts`) and `packages/ngx-yeti/styles/src/yeti-rank.ts` (the 49 items in `yeti.css` import order with name, kind, and file path, plus the full pin). Give it an Nx target in `packages/ngx-yeti/project.json` that depends on `^yeti-build` (any target reading Yeti's output does). The outputs are committed so typecheck and tests need no extra step; a pin move reruns the target. Update step 5 of `.claude/skills/yeti-pin/SKILL.md` to name the exact command. Keep the generated files byte-faithful to their sources: exclude them from Prettier and lint only as far as needed (`.prettierignore`, `packages/ngx-yeti/eslint.config.mjs`), or emit Prettier-clean output and compare ignoring formatting in the test.
- `packages/ngx-yeti/src/index.ts` gains `export type * from './yeti-types';` beside the placeholder exports, which stay until the placeholder task.
- Loader, per setup.md sections 3 and 4 ("The loader's behaviour" rules 1 to 7) and ADR 0060 points 2 to 6: a root service, not exported, injecting `DOCUMENT`, `APP_ID`, `CSP_NONCE` (optional), and the `provideYetiStyles` configuration (optional); acquire inserts before the first existing item link of later rank; release schedules a `requestAnimationFrame` check that removes a link only when its count is zero and no `[data-ngx-yeti-item-{name}]` element is connected; a `MutationObserver` on the document, created in `afterNextRender` and disconnected on the root injector's `DestroyRef`, schedules the same check; the server never removes; on client creation it adopts head links carrying `data-ngx-yeti-styles` and its own `APP_ID` with a count of zero and never touches another application's links; `provideYetiStyles` returns `EnvironmentProviders` and writes the preload links through an environment initializer, never duplicating an `href` already in the head. No `isPlatformBrowser`: render callbacks are the only platform split. Prior art: `docs/specs/prototypes/style-loading/workspace/lib/yeti-styles.ts` and `docs/specs/prototypes/style-loading/README.md` ("For the package").
- `injectYetiItemStyles` registers its release on the caller's `DestroyRef` first, then acquires (setup.md section 3; ticket 50 decision 42).
- Card, per card.md sections 2 to 4, 11, and 13: `card.ts` (`YetiCard`), `card-link.ts` (`YetiCardLink`), `card-tokens.ts` (`yetiCardToken`, importing the parent class with `import type`), host bindings in `host` metadata, `booleanAttribute` for `raised` and `stretch`, `injectYetiItemStyles('card')` as the last constructor statement, `YetiCardLink` injecting the token with `{ optional: true, skipSelf: true }` and using nothing from it. JSDoc on the classes carries card.md usage rules 1 to 11 by number; the `threshold` input's JSDoc states upstream bug Y12 (`threshold="2xs"` matches no rule in `card.css`; `docs/specs/upstream-bugs.md`).
- Another entry point is imported by its package path (`'ngx-yeti/styles'`, `'ngx-yeti'`), never by a relative path. Pitfall: `@nx/enforce-module-boundaries` and `@nx/dependency-checks` may flag self-references across secondary entry points; fix the configuration, not the import style. No `@defer` and no `@boundary` in package code.
- `build-fast` (`packages/ngx-yeti/vite.lib.config.mts`): build every secondary entry point it finds by discovering each `ng-package.json` one folder below the project root, so a later entry point (lift) needs no edit here; emit ng-packagr's file names (`fesm2022/ngx-yeti-{entry}.mjs` and one typings file per entry), an `exports` entry per entry point in the emitted package manifest, and keep any `exports` entries the source `package.json` declares (the accessibility-stylesheet task adds one). Bare specifiers stay external.
- Layer 2, `packages/ngx-yeti/styles/src/yeti-styles.spec.ts`: every case of setup.md:314-322 (counting; a connected host with count zero; ordered insertion for every arrival order of `stack`, `center`, `cover`, `shell`, and `card`; two directives on one host; link attributes with a non-default `APP_ID` and with and without `CSP_NONCE`; `url` and `preload`; adoption, including two loaders in two environment injectors; the throwing probe inside a test host's `@boundary`; no observer before the first render callback), with probe directives created through `TestBed.createDirective` and a test host only for two directives or a `@boundary`. Assert the DOM, never the loader's fields.
- Layer 3: `packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts` (49 items in `yeti.css` order, each path present in Yeti's build, pin constant equal to `vendor/yeti/COMMIT`) and `packages/ngx-yeti/src/yeti-types.node.spec.ts` (the generated file equals Yeti's built `yeti.d.ts`).
- Follow `.claude/skills/type-safety/SKILL.md` for every file (SIFERS `setup()`, no hooks, no `as`, `expect.assertions(n)` first in async tests) and `.claude/skills/ngx-yeti-testing/SKILL.md` for test placement. Every Verify that runs `test` or `build-fast` also runs `nx typecheck ngx-yeti`.

## Interface contract

- ngx-yeti/styles exports `injectYetiItemStyles(item: YetiComponentName): void`, called in an injection context as the last statement of an item root directive's constructor, and `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders`, with `interface YetiStylesConfig { readonly url?: string; readonly preload?: readonly YetiComponentName[] }`, called at most once in the root providers; the loader service, the rank table, and the pin constant are not exported.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- The primary entry point ngx-yeti re-exports with `export type *` every type of the generated file packages/ngx-yeti/src/yeti-types.ts, a copy of Yeti's built yeti.d.ts at the pin, including `YetiComponentName`, `YetiKind`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`; item entry points import these types with `import type { ... } from 'ngx-yeti'` and never from `'yeti-css'`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.

## Intent coverage

- SC5

## Acceptance criteria

1. The `styles` and `card` entry points exist as the generator writes them (their `ng-package.json`, `src/index.ts`, the `ngx-yeti/styles` and `ngx-yeti/card` path aliases in `tsconfig.base.json`, and their include and exclude lines in `packages/ngx-yeti/tsconfig.lib.json`), and `npx nx typecheck ngx-yeti -c src` checks their sources.
2. `npx nx build ngx-yeti` and `npx nx build-fast ngx-yeti` each emit `fesm2022/ngx-yeti-styles.mjs` and `fesm2022/ngx-yeti-card.mjs`, and `build-fast` finds secondary entry points without a per-entry setting.
3. `packages/ngx-yeti/src/yeti-types.ts` and `packages/ngx-yeti/styles/src/yeti-rank.ts` are written by the generator's Nx target, which depends on `^yeti-build` and which the yeti-pin skill names; the primary entry point re-exports the types as the contract states; no non-spec file under `packages/ngx-yeti` imports `'yeti-css'`.
4. The loader, `injectYetiItemStyles`, and `provideYetiStyles` behave as the contract and setup.md rules 1 to 7 state, and every layer-2 case of setup.md:314-322 passes in `packages/ngx-yeti/styles/src/yeti-styles.spec.ts` under `npx nx test ngx-yeti`.
5. Under `npx nx test ngx-yeti`, the node specs prove the rank table lists the 49 items in the order of Yeti's built `yeti.css` with every path present in the build, the pin constant equals `vendor/yeti/COMMIT`, and `yeti-types.ts` equals Yeti's built `yeti.d.ts`.
6. `YetiCard`, `YetiCardLink`, and `yetiCardToken` match the contract; their JSDoc numbers card.md usage rules 1 to 11, and the `threshold` JSDoc states the Y12 `2xs` behaviour.
7. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx run-many -t build build-fast -p ngx-yeti && find dist -name ngx-yeti-styles.mjs | rg -c . | rg -q '^2$' && find dist -name ngx-yeti-card.mjs | rg -c . | rg -q '^2$' && npx nx typecheck ngx-yeti -c src && npx nx typecheck ngx-yeti && test -f packages/ngx-yeti/styles/src/yeti-styles.spec.ts && npx nx test ngx-yeti -- yeti-styles.spec yeti-rank.node.spec yeti-types.node.spec
```

Heavy: no

## Log

- 2026-10-04 — created by planner
