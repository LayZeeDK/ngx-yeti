---
id: T006
title: Ship the lift item with the setup shared-host story and the setup SSR smoke
wave: 2
deps: [T002, T004]
status: done
agent: build_T006
base: 764ecb4c7d25e80ad2ef5adbff2796f29c9c1f52
worktree: null
task_branch: null
files:
  - tsconfig.base.json
  - packages/ngx-yeti/tsconfig.lib.json
  - packages/ngx-yeti/lift/ng-package.json
  - packages/ngx-yeti/lift/README.md
  - packages/ngx-yeti/lift/src/index.ts
  - packages/ngx-yeti/lift/src/lift.ts
  - packages/ngx-yeti/lift/src/lift.spec.ts
  - packages/ngx-yeti/lift/src/lift.ssr.spec.ts
  - packages/ngx-yeti/lift/src/lift.stories.ts
  - packages/ngx-yeti/styles/src/setup.stories.ts
  - packages/ngx-yeti/styles/src/setup.ssr.spec.ts
  - packages/ngx-yeti/card/src/card.stories.ts
---

# T006 — Ship the lift item with the setup shared-host story and the setup SSR smoke

## Context

`docs/specs/specs/lift.md` defines one types-only directive, `NgxYetiLift` (its class takes `NgxYeti` because Yeti's `yeti.d.ts` exports `YetiLift`, ADR 0080 point 4), at its own entry point; INTENT.md brings it into M001 because the setup spec's `setup--shared-host` story and lift's own tests compose it with `card` (ADR 0045: each item marks its host with its own presence attribute). This task lands the lift entry point, lift's four layers except the Fixture-app half, the card story that needs lift (`card--with-lift`), the setup spec's only M001 story (`setup--shared-host`; `setup--item-links`, `setup--client-defer-preload`, and `setup--accessibility-layer` move to M002 and M006), and the setup spec's layer-3 SSR smoke as INTENT.md SC5 restates it for M001 (card and lift with a lift preload, in place of setup.md's card, badge, center, and alert). It owns the Storybook stories surface: when it lands, every M001 story of setup, card, and lift passes.

## Approach

- Create the entry point only with `npx nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name=lift --skipModule`, keeping the lines it writes in `tsconfig.base.json` and `packages/ngx-yeti/tsconfig.lib.json`; replace its `greeting` placeholder. `build-fast` already discovers entry points (built in wave 1), so `packages/ngx-yeti/vite.lib.config.mts` is not edited here.
- `packages/ngx-yeti/lift/src/lift.ts` per lift.md sections 2 to 4: selector-named input `yetiLift` typed `YetiLift | ''` (from `'ngx-yeti'`), `[attr.data-lift]` null for `''` and unset, static class `lift`, static `data-ngx-yeti-item-lift`, `injectYetiItemStyles('lift')` (from `'ngx-yeti/styles'`) as the last constructor statement, no listener, token, or output; JSDoc numbers lift.md usage rules 1 to 6.
- Stories in `packages/ngx-yeti/lift/src/lift.stories.ts` (`meta.id: 'lift'`), lift.md:224-227. `lift--default`'s three cards sit in a plain container (its `yetiCluster` arrives in M002). Storybook's `userEvent.hover` does not set CSS `:hover` (Departures table hover row of `.claude/skills/ngx-yeti-specs/SKILL.md`), so the hover assertions of `lift--default` (top decreased, `box-shadow` changed, `scale` equal to the computed `--yeti-lift-scale`, `translate` none) and `lift--without` (no movement) go to layer 2 with `userEvent.hover` from `'vitest/browser'`; the play functions keep the DOM, accessibility-tree, and keyboard assertions. Never hard-code a token default (ADR 0015 point 3).
- `card--with-lift` (card.md:306) appended to `packages/ngx-yeti/card/src/card.stories.ts` without changing the existing card stories.
- `setup--shared-host` in `packages/ngx-yeti/styles/src/setup.stories.ts` (`meta.id: 'setup'`), setup.md:304: an element with `yetiCard` and `yetiLift`; the play function asserts both presence attributes and both item links in the head, removes the host through a control the story renders, and asserts both links are gone in the frame after.
- Layer 2, `packages/ngx-yeti/lift/src/lift.spec.ts`: lift.md:233-237, plus the hover cases moved from the two stories, plus the two-directive host (`article[yetiCard][yetiLift][raised]`: `class` holds `card` and `lift`, one `data-raised=""`, both presence attributes, both links acquired and both released on destroy), which also covers card.md's test-host bullet for it.
- Layer 3: `packages/ngx-yeti/lift/src/lift.ssr.spec.ts` (lift.md:241: a rise card and a scale card, `class="card lift"`, `data-lift` absent then `scale`, presence attributes, the card and lift links in Yeti's order, no `jsaction` on the hosts, one `i18n` text, `whenStable()` resolves) and `packages/ngx-yeti/styles/src/setup.ssr.spec.ts` (setup.md:326-327 as SC5 restates it: a fixture with card and lift and `provideYetiStyles({ preload: ['lift'] })` gives both links in Yeti's order with every attribute, each host's presence attribute, and the lift preload link; an item not rendered has no link; `CSP_NONCE` puts the nonce on every link; two concurrent renders give the same head). Use `renderServer()` from `'@ngx-yeti/testing/server'`; calls started together pass the same `hydrationFeatures`.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`. Never edit `docs/specs/` or `vendor/yeti/`.

## Interface contract

- ngx-yeti/styles exports `injectYetiItemStyles(item: YetiComponentName): void`, called in an injection context as the last statement of an item root directive's constructor, and `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders`, with `interface YetiStylesConfig { readonly url?: string; readonly preload?: readonly YetiComponentName[] }`, called at most once in the root providers; the loader service, the rank table, and the pin constant are not exported.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- The primary entry point ngx-yeti re-exports with `export type *` every type of the generated file packages/ngx-yeti/src/yeti-types.ts, a copy of Yeti's built yeti.d.ts at the pin, including `YetiComponentName`, `YetiKind`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`; item entry points import these types with `import type { ... } from 'ngx-yeti'` and never from `'yeti-css'`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- ngx-yeti/lift exports `NgxYetiLift`: selector `[yetiLift]`, exportAs `yetiLift`, input `yetiLift: YetiLift | ''` where unset and `''` render no `data-lift`; host: static class `lift`, static `data-ngx-yeti-item-lift=""`, `data-lift` from the input; acquires the `lift` item file.
- Card stories live in packages/ngx-yeti/card/src/card.stories.ts with `meta.id: 'card'` and the ids `card--default`, `card--stretched-link`, `card--inputs`, `card--figure`, `card--list`, `card--rtl`, and `card--anti-pattern-wrapped-link`.
- Lift and setup stories: `lift--default`, `lift--keyboard`, `lift--bound`, and `lift--without` in packages/ngx-yeti/lift/src/lift.stories.ts (`meta.id: 'lift'`), `setup--shared-host` in packages/ngx-yeti/styles/src/setup.stories.ts (`meta.id: 'setup'`), and `card--with-lift` added to the card stories file.

## Intent coverage

- SC1
- SC5

## Acceptance criteria

1. Under `npx nx test-storybook ngx-yeti`, every M001 story of the setup, card, and lift specs passes its play function and the axe gate: the seven card stories, `card--with-lift`, the four lift stories, and `setup--shared-host`; `setup--shared-host` shows both presence attributes and the card and lift links in the head while its host is connected, and neither link in the frame after the host leaves.
2. The lift entry point is generator-made (its `ng-package.json`, `src/index.ts`, the `ngx-yeti/lift` path alias, and the `tsconfig.lib.json` lines), and `npx nx build ngx-yeti` and `npx nx build-fast ngx-yeti` each emit `fesm2022/ngx-yeti-lift.mjs` with no edit to `vite.lib.config.mts`.
3. `NgxYetiLift` matches the contract, and its JSDoc numbers lift.md usage rules 1 to 6.
4. `packages/ngx-yeti/lift/src/lift.spec.ts` passes lift.md:233-237, the `:hover` assertions of `lift--default` and `lift--without` with Vitest's `userEvent.hover`, and the `card` plus `lift` host case.
5. Under `npx nx test ngx-yeti`, `lift.ssr.spec.ts` and `setup.ssr.spec.ts` pass the layer-3 cases the Approach lists, including no package `jsaction` on lift hosts, the lift preload link, the nonce on every link, and equal heads from two concurrent renders.
6. `npx prettier --check .` and `npx nx run-many -t lint typecheck test test-storybook -p ngx-yeti` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && test -f packages/ngx-yeti/lift/src/lift.stories.ts && test -f packages/ngx-yeti/styles/src/setup.stories.ts && npx nx run-many -t build build-fast -p ngx-yeti && find dist -name ngx-yeti-lift.mjs | rg -c . | rg -q '^2$' && npx nx typecheck ngx-yeti -c src && npx nx typecheck ngx-yeti && npx nx test ngx-yeti -- lift.spec lift.ssr.spec setup.ssr.spec && npx nx test-storybook ngx-yeti
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
- 2026-10-04 — build_T006: entry point made with `npx nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name=lift --skipModule`; its `tsconfig.base.json` alias and `tsconfig.lib.json` lines kept as written (including the generator's extra `lift/styles`, `lift/card` patterns); `README.md` left as generated; `greeting` replaced by `export { NgxYetiLift }`. `lift.ts`: `NgxYetiLift` per contract (`[attr.data-lift]` = `yetiLift() || null`, static `lift` class and `data-ngx-yeti-item-lift`, `injectYetiItemStyles('lift')` last; JSDoc numbers usage rules 1 to 6). Stories: `lift--default` (three cards in a plain `div`; DOM plus role/name tree compared with a lift-stripped copy), `lift--keyboard`, `lift--bound` (three buttons drive a signal), `lift--without`; `card--with-lift` appended (story-level `moduleMetadata` imports `NgxYetiLift`, existing stories unchanged); `setup--shared-host` (button removes the `@if` host; asserts both presence attributes, links `card, lift` in head, then none two frames after disconnect). Layer 2 `lift.spec.ts`: lift.md:233-237, the card+lift host, and the hover cases moved from the stories, using `page.elementLocator(el).hover()` from `vitest/browser` (the same Playwright hover; `userEvent` is flagged by `@angular-eslint/no-experimental`), with Yeti's always-loaded files and item files served through `provideYetiStyles({ url: '/@fs/<root>/../../node_modules/yeti-css/dist/css/' })`. Layer 3: `lift.ssr.spec.ts` and `setup.ssr.spec.ts` (custom `APP_ID`, `lift` preload, nonce on all three links, two concurrent renders with equal heads).
- 2026-10-04 — build_T006: Verify passed (exit 0): build and build-fast emit `dist/packages/ngx-yeti/fesm2022/ngx-yeti-lift.mjs` and `dist/fast/packages/ngx-yeti/fesm2022/ngx-yeti-lift.mjs`; `typecheck -c src` and `typecheck` pass; `nx test ngx-yeti -- lift.spec lift.ssr.spec setup.ssr.spec` 3 files, 20 tests passed; `nx test-storybook ngx-yeti` 5 files, 16 tests passed. Also run: `npx prettier --check .` clean, `nx lint ngx-yeti` clean, full `nx test ngx-yeti` 12 files, 178 tests passed. Chromium only (local).
- 2026-10-04 — orchestrator Verify (sidecar gsd-path-verify/task-t006-verify): pass, exit 0; output tail:
  ```
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  ```
