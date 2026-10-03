# About the fastCompile and typecheck split

Most Angular compiles in this workspace use Analog `fastCompile`. It compiles in one pass and never type-checks TypeScript or templates. The `typecheck` target runs the full Angular compiler without emitting and catches what `fastCompile` skips. Neither target depends on the other, so Nx runs them in parallel and caches them separately.

## Which targets compile with fastCompile

| Project       | Targets                                                                                 | Config                                                                                                                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ngx-yeti`    | `test`                                                                                  | `packages/ngx-yeti/vitest.unit.config.mts`, AOT (`jit: false`)                                                                                                                                                                                                                                                                                   |
| `ngx-yeti`    | `storybook`, `build-storybook`, `test-storybook`, and `static-storybook` with `-c fast` | The `fast` configurations in `nx.json` set `ANGULAR_FAST_COMPILE=true`, and `viteFinal` in `packages/ngx-yeti/.storybook/main.ts` then swaps the Analog plugins that `@storybook/angular-vite` adds, because the framework has no `fastCompile` option. Without `-c fast`, Storybook compiles stories in JIT mode with the default Analog plugin |
| `ngx-yeti`    | `build-fast` (experimental), `build-fast -c js` (JavaScript only)                       | `packages/ngx-yeti/vite.lib.config.mts`                                                                                                                                                                                                                                                                                                          |
| `yeti-analog` | `build`, `serve`, `test`                                                                | `analog({ fastCompile: true })` in `apps/yeti-analog/vite.config.ts`                                                                                                                                                                                                                                                                             |

These targets use the Angular compiler with type checking:

- `ngx-yeti:build` uses ng-packagr. It produces the published package.
- `yeti-app` uses `@angular/build`. It is the reference Angular CLI app for server-side rendering, hydration, and `@defer`. Neither `@angular/build:application` nor `@nx/angular:application` accepts a Vite config, so the Analog plugin cannot run there.

## What typecheck covers

`typecheck` runs `angular-typechecker` over the solution `tsconfig.json` of each Angular project. It follows the references to the source, spec, and Storybook configs, so one run checks sources, templates, extended diagnostics, specs, stories, and the Vite and Vitest configs. `nx.json` defines the target once for every project, keyed on the `type:lib`, `type:app`, and `storybook` tags.

Configurations check one tsconfig: `-c src` for the library or application source, `-c spec` for specs, and `-c stories` for stories. The names are the same in every project, so `npm run typecheck -- -c spec` checks the specs of all projects. A project without the requested configuration runs its whole check. `typecheck` without a configuration is the gate for `check`, `affected`, and CI.

`typecheck-watch` reruns `typecheck` through `nx watch` whenever the project or a project it depends on changes. Run it beside `serve` or `storybook`. It takes a configuration as `--args=--configuration=<name>`, and `npm run typecheck:watch` starts it for every project.

Template errors appear only in `typecheck`. For example, `<yeti-nope />` in a template passes `test` and fails `typecheck` with `NG8001`. Angular skips its runtime unknown-element and unknown-property checks for AOT-compiled components, so `errorOnUnknownElements` in `setupTestBed` cannot replace `typecheck`.

## What fastCompile does not do

Analog reports that `fastCompile` passes about 91% of Angular's conformance suite. The gaps that show up here:

- `build-fast` output has no signal `debugName` and no `propDecorators` in class metadata. Its file tree, `package.json`, typings, and README match the ng-packagr output byte for byte.
- `build-fast` gets typings from `ngc` with `angularCompilerOptions._experimentalAllowEmitDeclarationOnly`. The underscore marks an unsupported flag that can change in any Angular release. Publish from `build`.

## Gotchas no config file explains

- Nx runs inferred targets from the project root. Analog resolves its server dependencies and Nitro output from `process.cwd()`, so `apps/yeti-analog/vite.config.ts` passes `workspaceRoot`. Without it, prerendering fails with `window is not defined` and Nitro writes inside the app folder.
- `yeti-analog` names the `typecheck` executor in its `project.json`. Without it, the `tsc` typecheck that `@nx/vite/plugin` infers keeps its executor and ignores the `nx.json` defaults.
- `vitest.unit.config.mts` is separate from `vitest.config.mts` because Vitest loads every project's plugins, even with `--project`. Sharing the file loads Storybook into each unit test run and costs about one second.
- The `production` named input excludes `{projectRoot}/vitest.*` and `src/test-setup.ts`, and `@nx/dependency-checks` ignores `vite.lib.config.mts`. Otherwise the lint rule demands test and build tools as peer dependencies of `ngx-yeti`.

## What the split costs and gains

On these scaffolds, fastCompile shortens dev server starts, builds, and test runs by about 10 to 35%. Running a fastCompile task beside its `typecheck` configuration finishes about as fast as the regular type-checking task, or up to 20% slower for the smallest tasks, because both processes pay startup. The split grows more slowly with code size and reaches parity for the library build at 150 components. Storybook gains type checking for stories at no extra wall-clock time. [The benchmarks](../docs/benchmarks/fast-compile.md) have the numbers and the method.

To benchmark a tool from `vitest bench`, remove the `VITEST*` and `NODE_ENV` variables from the environment of the spawned command. Otherwise Analog runs in test mode: the dev server crashes with `window is not defined`, and builds take a different path.
