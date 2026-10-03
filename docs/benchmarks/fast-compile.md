# fastCompile and typecheck benchmarks

Measured on 2026-10-03 with `vitest bench` on Windows 11 on ARM64 (Snapdragon X Elite), on an otherwise idle machine. Each table shows means over two interleaved rounds that alternate which variant runs first. Every command ran with the `VITEST*` and `NODE_ENV` variables removed. With them, Analog runs in test mode: the dev server crashes with `window is not defined` and builds take a different path.

The projects are fresh scaffolds with almost no code, so process startup dominates every number. The scale test at the end adds 150 generated components to the library.

## Compile time

"Without fastCompile" is the Angular compiler for `nx test` and `nx build`, and the default Analog compiler, which type-checks, for the Analog app. Storybook previously compiled stories in JIT mode without type checking.

| Task                                                  | Without fastCompile | With fastCompile |
| ----------------------------------------------------- | ------------------- | ---------------- |
| `yeti-analog` dev server, first rendered page         | 4.3 s               | 3.3 s            |
| `ngx-yeti` Storybook dev server, first compiled story | 4.6 s               | 3.6 s            |
| `yeti-analog` `vite build` with prerendering          | 17.9 s              | 15.3 s           |
| `yeti-analog` `vitest run`                            | 3.4 s               | 2.5 s            |
| `ngx-yeti` Storybook build                            | 5.6 s               | 4.5 s            |
| `ngx-yeti` story tests in three browsers              | 10.4 s              | 9.4 s            |
| `nx test ngx-yeti`                                    | 4.9 s               | 3.9 s            |
| `nx build ngx-yeti` vs `nx build-fast ngx-yeti`       | 3.3 s               | 3.3 s            |

## Critical path: regular task vs fastCompile beside a leaf typecheck

"Regular" is one Nx task that compiles with type checking. "Split" runs the fastCompile task and `nx typecheck <project> -c <leaf>` as two concurrent Nx processes and stops the clock when both finish.

| Work                                                                   | Regular | Split   |
| ---------------------------------------------------------------------- | ------- | ------- |
| `ngx-yeti` library: `build` vs `build-fast -c js` + `typecheck -c src` | 3.48 s  | 4.34 s  |
| `ngx-yeti` unit tests: `test` vs `test` + `typecheck -c spec`          | 5.22 s  | 5.78 s  |
| `ngx-yeti` Storybook build: without vs with `typecheck -c stories`     | 7.11 s  | 7.01 s  |
| `yeti-analog` build: default vs fastCompile + `typecheck -c src`       | 18.53 s | 18.10 s |
| `yeti-analog` unit tests: default vs fastCompile + `typecheck -c spec` | 5.35 s  | 5.97 s  |

With 150 generated components in the library, the library row becomes 5.06 s regular and 5.05 s split. From the scaffold to 150 components, the regular build grew by 1.6 s and the split by 0.7 s.

## typecheck per tsconfig

`angular-typechecker` on one tsconfig, compared with the project's solution `tsconfig.json`:

| Project       | Whole  | `src`  | `spec` | `stories` |
| ------------- | ------ | ------ | ------ | --------- |
| `ngx-yeti`    | 4.73 s | 1.57 s | 2.75 s | 2.30 s    |
| `yeti-app`    | 2.49 s | 1.90 s | 2.00 s |           |
| `yeti-analog` | 3.91 s | 2.25 s | 1.84 s |           |

The spec measurement of `ngx-yeti` predates the exclusion of stories from `tsconfig.spec.json`.
