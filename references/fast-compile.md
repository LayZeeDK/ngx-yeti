# About the fastCompile and typecheck split

Most Angular compiles in this workspace use Analog `fastCompile`. It compiles in one pass and never type-checks TypeScript or templates. The `typecheck` target runs the full Angular compiler without emitting and catches what `fastCompile` skips. Neither target depends on the other, so Nx runs them in parallel and caches them separately.

## Which targets compile with fastCompile

| Project       | Targets                                          | Config                                                                                                                                                                |
| ------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ngx-yeti`    | `test`                                           | `packages/ngx-yeti/vitest.unit.config.mts`, AOT (`jit: false`)                                                                                                        |
| `ngx-yeti`    | `storybook`, `build-storybook`, `test-storybook` | `viteFinal` in `packages/ngx-yeti/.storybook/main.ts` swaps the Analog plugins that `@storybook/angular-vite` adds, because the framework has no `fastCompile` option |
| `ngx-yeti`    | `build-fast` (experimental)                      | `packages/ngx-yeti/vite.lib.config.mts`                                                                                                                               |
| `yeti-analog` | `build`, `serve`, `test`                         | `analog({ fastCompile: true })` in `apps/yeti-analog/vite.config.ts`                                                                                                  |

These targets use the Angular compiler with type checking:

- `ngx-yeti:build` uses ng-packagr. It produces the published package.
- `yeti-app` uses `@angular/build`. It is the reference Angular CLI app for server-side rendering, hydration, and `@defer`. Neither `@angular/build:application` nor `@nx/angular:application` accepts a Vite config, so the Analog plugin cannot run there.

## What typecheck covers

`typecheck` runs `angular-typechecker` over each Angular project's solution `tsconfig.json`. It follows the references to the library, spec, and Storybook configs, so one run checks sources, templates, extended diagnostics, specs, stories, and the Vite and Vitest configs.

Template errors appear only in `typecheck`. For example, `<yeti-nope />` in a template passes `test` and fails `typecheck` with `NG8001`. Angular skips its runtime unknown-element and unknown-property checks for AOT-compiled components, so `errorOnUnknownElements` in `setupTestBed` cannot replace `typecheck`.

## What fastCompile does not do

Analog reports that `fastCompile` passes about 91% of Angular's conformance suite. The gaps that show up here:

- `build-fast` output has no signal `debugName` and no `propDecorators` in class metadata. Its file tree, `package.json`, typings, and README match the ng-packagr output byte for byte.
- `build-fast` gets typings from `ngc` with `angularCompilerOptions._experimentalAllowEmitDeclarationOnly`. The underscore marks an unsupported flag that can change in any Angular release. Publish from `build`.

## Gotchas no config file explains

- Nx runs inferred targets from the project root. Analog resolves its server dependencies and Nitro output from `process.cwd()`, so `apps/yeti-analog/vite.config.ts` passes `workspaceRoot`. Without it, prerendering fails with `window is not defined` and Nitro writes inside the app folder.
- `vitest.unit.config.mts` is separate from `vitest.config.mts` because Vitest loads every project's plugins, even with `--project`. Sharing the file loads Storybook into each unit test run and costs about one second.
- The `production` named input excludes `{projectRoot}/vitest.*` and `src/test-setup.ts`, and `@nx/dependency-checks` ignores `vite.lib.config.mts`. Otherwise the lint rule demands test and build tools as peer dependencies of `ngx-yeti`.

## Measurements

Measured on 2026-10-03 with `vitest bench`, interleaved rounds, on scaffolded projects with almost no code. Startup dominates at this size, so the gaps are small.

| Task                                            | Without fastCompile | With fastCompile |
| ----------------------------------------------- | ------------------- | ---------------- |
| `yeti-analog` `vite build`                      | 7.7 s               | 5.6 s            |
| `yeti-analog` `vitest run`                      | 5.1 s               | 3.5 s            |
| `ngx-yeti` Storybook build                      | 6.5 s               | 5.5 s            |
| `nx test ngx-yeti`                              | 6.0 s               | 5.0 s            |
| `nx build ngx-yeti` vs `nx build-fast ngx-yeti` | 4.4 s               | 4.2 s            |

`typecheck` takes 4 to 6 s per project and runs beside these targets. `build-fast` gains little because the `ngc` declaration pass takes most of its time.
