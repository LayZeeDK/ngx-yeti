---
id: T013
title: Make the package release-ready with the ADR 0017 version, a changelog, and a packed consuming build
wave: 3
deps: [T002, T003, T006, T012]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/package.json
  - packages/ngx-yeti/ng-package.json
  - packages/ngx-yeti/project.json
  - packages/ngx-yeti/CHANGELOG.md
  - packages/ngx-yeti/src/version.node.spec.ts
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - tools/package/pack-check.mjs
  - tools/package/consumer/consumer.ts
  - tools/package/consumer/tsconfig.json
  - tools/package/consumer/styles.css
  - eslint.config.mjs
---

# T013 — Make the package release-ready with the ADR 0017 version, a changelog, and a packed consuming build

## Context

INTENT.md SC3 is the package entry points surface: a consuming build against the `npm pack` tarball imports `YetiCard` and `YetiCardLink` from the card entry point, `NgxYetiLift` from the lift entry point, `injectYetiItemStyles` and `provideYetiStyles` from the styles entry point, and the types `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift` from `ngx-yeti`, and resolves the specifier `'ngx-yeti/accessibility.css'`; the primary entry point exports types only, no published `.d.ts` imports `yeti-css`, the package declares no `yeti-css` dependency or peer, the version matches ADR 0017's format, and the changelog names the full Yeti commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. The format, after ADR 0017's 2026-10-02 notes and setup.md section 4 E, is `0.{Angular major}{Angular minor, 2 digits}{breaking counter, 2 digits}.{patch}-yeti.{Yeti version}.g{Yeti commit SHA}`, here `0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8` (Yeti `7.0.0-alpha.0` from `vendor/yeti/package.json`). SC5 adds two layer-3 tests under `nx test ngx-yeti`: the version test (setup.md:331) and "no Yeti rule in the published output" (setup.md:329). Publishing to npm is vetoed (the user runs `npm publish`); this is the release-readiness skeleton each later milestone extends.

## Approach

- `packages/ngx-yeti/package.json`: version `0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8`; keep the peers (`@angular/core` `^22.2.0`, plus any Angular package the shipped code imports, as `@nx/dependency-checks` asks) and no `yeti-css` entry anywhere; keep the `exports` entry for the accessibility stylesheet.
- `packages/ngx-yeti/CHANGELOG.md`: an entry for that version that names the full Yeti commit, the entry points shipped (`ngx-yeti` types, styles, card, lift), and the accessibility stylesheet; ship it in the tarball through an `assets` entry in `packages/ngx-yeti/ng-package.json`.
- `packages/ngx-yeti/src/version.node.spec.ts` (setup.md:331): the version matches the format, its Angular part matches the `@angular/core` peer's minor, its Yeti version equals `vendor/yeti/package.json`'s, and its SHA is a prefix of `vendor/yeti/COMMIT`.
- `packages/ngx-yeti/src/published-output.node.spec.ts` (setup.md:329): the built package under the workspace's dist folder holds no Yeti rule: no `@layer yeti` block and no selector of a Yeti class from the manifest in any FESM bundle or shipped CSS. Make the `test` target of `packages/ngx-yeti/project.json` depend on `build` (beside `^yeti-build`), so the spec always reads a current build.
- `tools/package/pack-check.mjs` (Node ESM) behind an Nx target `pack-check` in `packages/ngx-yeti/project.json` that depends on `build`: run `npm pack` on the built package into the git-ignored `tmp` folder; install or extract the tarball for a consumer under `tmp` so that every `ngx-yeti` import resolves through the tarball's own `package.json` `exports` (never through workspace tsconfig paths) while Angular resolves from the workspace's installed packages; compile `tools/package/consumer/consumer.ts` (a standalone component whose template uses `yetiCard`, `yetiCardLink stretch`, and `yetiLift`, and whose providers call `provideYetiStyles`) with the Angular compiler under `strictTemplates`, using `tools/package/consumer/tsconfig.json`; resolve `tools/package/consumer/styles.css`, whose last line imports the accessibility stylesheet by its package specifier, through the package `exports`; and prove the typed inputs are not `any` with a negative compile (a template with `threshold="medium"` must fail). Then check the tarball: the primary entry point has no runtime export, no `.d.ts` imports `yeti-css`, `package.json` has no `yeti-css` in any dependency field, the version matches the format, and the shipped changelog names the full commit. Exit non-zero naming the first failed claim; print the tarball name on success. Never run `npm publish`.
- Lint: add an ignore to the root `eslint.config.mjs` only if the consumer fixture or the script needs one. Skills: `.claude/skills/ngx-yeti-specs/SKILL.md` (Done for a spec), `.claude/skills/yeti-pin/SKILL.md` (what may read Yeti's build), `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- ngx-yeti/styles exports `injectYetiItemStyles(item: YetiComponentName): void`, called in an injection context as the last statement of an item root directive's constructor, and `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders`, with `interface YetiStylesConfig { readonly url?: string; readonly preload?: readonly YetiComponentName[] }`, called at most once in the root providers; the loader service, the rank table, and the pin constant are not exported.
- The primary entry point ngx-yeti re-exports with `export type *` every type of the generated file packages/ngx-yeti/src/yeti-types.ts, a copy of Yeti's built yeti.d.ts at the pin, including `YetiComponentName`, `YetiKind`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`; item entry points import these types with `import type { ... } from 'ngx-yeti'` and never from `'yeti-css'`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- ngx-yeti/lift exports `NgxYetiLift`: selector `[yetiLift]`, exportAs `yetiLift`, input `yetiLift: YetiLift | ''` where unset and `''` render no `data-lift`; host: static class `lift`, static `data-ngx-yeti-item-lift=""`, `data-lift` from the input; acquires the `lift` item file.
- The package accessibility stylesheet is the source file packages/ngx-yeti/accessibility.css, every rule inside `@layer ngx-yeti` (empty in M001); ng-packagr copies it to the root of the built package, whose package.json `exports` maps `"./accessibility.css"` to it; a consumer imports it with `@import 'ngx-yeti/accessibility.css';` as the last line of the global stylesheet.

## Intent coverage

- SC3
- SC5

## Acceptance criteria

1. `npx nx run ngx-yeti:pack-check` packs the built package and compiles the consumer against the tarball with the Angular compiler under `strictTemplates`, importing `YetiCard` and `YetiCardLink` from the card entry point, `NgxYetiLift` from the lift entry point, `injectYetiItemStyles` and `provideYetiStyles` from the styles entry point, and `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift` from `ngx-yeti`, all resolved through the tarball's `exports`, and resolves the accessibility stylesheet's package specifier; a `threshold="medium"` probe fails to compile.
2. The same check proves the primary entry point exports types only, no published `.d.ts` imports `yeti-css`, the packed `package.json` declares no `yeti-css` dependency or peer, its version is `0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8`, and the packed `CHANGELOG.md` names `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`.
3. Under `npx nx test ngx-yeti`, `version.node.spec.ts` passes setup.md:331 and `published-output.node.spec.ts` proves no Yeti rule in the built FESM bundles or shipped CSS, with `test` depending on `build`.
4. Nothing is published; `pack-check` never calls `npm publish`.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && test -f tools/package/pack-check.mjs && npx nx run ngx-yeti:pack-check && npx nx test ngx-yeti -- version.node.spec published-output.node.spec && npx nx typecheck ngx-yeti
```

Heavy: no

## Log

- 2026-10-04 — created by planner
