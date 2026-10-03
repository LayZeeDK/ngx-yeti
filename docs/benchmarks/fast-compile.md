# fastCompile and typecheck benchmarks

Measured on 2026-10-03 with `vitest bench` on Windows 11 on ARM64 (Snapdragon X Elite), on an otherwise idle machine. Every command ran with the `VITEST*` and `NODE_ENV` variables removed. With them, Analog runs in test mode: the dev server crashes with `window is not defined` and builds take a different path.

The projects are fresh scaffolds with almost no code, so process startup dominates every number. The scale test adds 150 generated components to the library. Each section names the commit it measured.

## Compile time

Measured at `b7c75f5`. Means over two interleaved rounds that alternate which variant runs first.

"Without fastCompile" is the Angular compiler for `nx test` and `nx build`, and the default Analog compiler, which type-checks, for the Analog app. For Storybook it is the default JIT compile, which does not type-check, and "with fastCompile" matches today's `-c fast` configuration.

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

Two rows describe setups that changed later. Story tests now run in three browsers only when `CI` is set and in Chromium otherwise. `0425fdc` split the `ngx-yeti` unit tests into browser and node projects.

## Critical path: regular task vs fastCompile beside a leaf typecheck

Measured at `0bf3a63`. Means over two interleaved rounds.

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

Measured at `0ca8b67`. Means over three rounds of `angular-typechecker --max-warnings 0 --strict` on one tsconfig, compared with the solution `tsconfig.json` of the project:

| Project            | Whole  | `src`  | `spec` | `stories` |
| ------------------ | ------ | ------ | ------ | --------- |
| `ngx-yeti`         | 4.28 s | 1.60 s | 2.85 s | 2.74 s    |
| `ngx-yeti-testing` | 2.64 s | 1.60 s | 2.35 s |           |
| `ngx-yeti-e2e`     | 2.04 s |        |        |           |
| `yeti-app`         | 2.87 s | 2.05 s | 2.17 s |           |
| `yeti-analog`      | 4.29 s | 2.39 s | 1.99 s |           |

The `ngx-yeti` spec leaf excludes stories, which the `stories` leaf checks. In the same rounds, a copy of `tsconfig.spec.json` that still includes stories took 3.25 s, so the exclusion saves 0.4 s per spec check.
