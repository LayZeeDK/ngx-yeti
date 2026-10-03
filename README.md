# ngx-yeti

`ngx-yeti` is an Angular package that wraps [Yeti](https://github.com/foundation/yeti), version 7 of Foundation (`yeti-css`), in typed directives. This repository is the Nx workspace that builds, tests, and documents it.

The package is pre-release. The specs in [`docs/specs/`](docs/specs/README.md) describe all 49 Yeti items and five shared pieces. The tooling, Storybook, and test infrastructure are in place, and no item is implemented yet.

## What the workspace holds

| Path                        | What it is                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/ngx-yeti`         | The published package, with its stories and its unit and server-render tests                           |
| `packages/ngx-yeti-testing` | Test helpers shared by specs, stories, and e2e tests, imported as `@ngx-yeti/testing`; never published |
| `apps/yeti-app`             | The Fixture app: an Angular SSR app that serves one prerendered and one server-rendered route per item |
| `apps/yeti-app-e2e`         | Playwright tests against the Fixture app's Node server                                                 |
| `apps/ngx-yeti-e2e`         | Playwright tests against the static Storybook build                                                    |
| `apps/yeti-analog`          | A demo app built with Analog                                                                           |
| `vendor/yeti`               | Yeti's source at the pinned commit, as the npm workspace package `yeti-css`                            |
| `tools/yeti`                | The script that vendors Yeti and the Nx plugin that builds it                                          |
| `docs/specs`                | The specs, ADRs, and records the package is built from; a verbatim copy, never edited                  |
| `docs/decisions`            | Decision trails of larger changes                                                                      |
| `references`                | Notes for contributors, such as [`fast-compile.md`](references/fast-compile.md)                        |
| `.claude/skills`            | Instructions for coding agents, one skill per area                                                     |

## Set up

You need Node.js 24 or later, which Yeti's build requires.

1. Install the dependencies. This also links `vendor/yeti` as `node_modules/yeti-css`:

   ```sh
   npm ci
   ```

2. Install the browsers the tests use. Local runs use Chromium only:

   ```sh
   npx playwright install chromium
   ```

   To run all three engines the way CI does, install `firefox` and `webkit` too and set `CI=true`.

Nx builds Yeti before any task that needs it, so you never run its build by hand. To build it alone, run `npx nx yeti-build yeti-css`.

## Run common tasks

Every script runs an Nx target. Run them with `npm run <script>`.

| Script           | What it does                                                    |
| ---------------- | --------------------------------------------------------------- |
| `check`          | Lint, type-check, unit tests, and story tests for every project |
| `affected`       | The same plus builds, for the projects your changes affect      |
| `test`           | Unit and server-render tests                                    |
| `test-storybook` | Every story's play function and its accessibility check         |
| `e2e`            | All Playwright projects                                         |
| `typecheck`      | The full Angular compiler without emitting                      |
| `storybook`      | Storybook for `ngx-yeti` on port 4400                           |
| `start`          | The Fixture app's dev server                                    |
| `build`          | Every build                                                     |
| `format:check`   | Prettier over the workspace                                     |

Most compiles use Analog `fastCompile`, which never type-checks. A green `test`, `test-storybook`, or `build-fast` says nothing about types, so run `typecheck` beside them. [`references/fast-compile.md`](references/fast-compile.md) explains the split. The Storybook scripts have `-fast` twins, such as `npm run storybook-fast`, and `build-fast` builds the library with `fastCompile`.

## How the tests are organized

The tests follow the four layers of [ADR 0014](docs/specs/adr/0014-testing-stack-for-yeti.md):

1. Story play functions, run by `test-storybook`. Axe checks every story against WCAG 2.2 AA.
2. Unit tests in a real browser, run by `test` in Vitest browser mode.
3. Server-render and pure-logic tests in Node. Their files end in `.ssr.spec.ts` or `.node.spec.ts`.
4. Playwright tests against the static Storybook build and the Fixture app, with JavaScript on and off.

The [`ngx-yeti-testing` skill](.claude/skills/ngx-yeti-testing/SKILL.md) says which layer a test belongs to and which helpers exist.

## Accessibility

Every story fails its test on any axe violation of the WCAG 2.2 AA tags, and on any `console.error`. `npm run check`, `npm run affected`, and CI all run that check. A story may switch off an axe rule only to show an anti-pattern, and only the rule it shows. The [`ngx-yeti-stories`](.claude/skills/ngx-yeti-stories/SKILL.md) and [`ngx-yeti-accessibility`](.claude/skills/ngx-yeti-accessibility/SKILL.md) skills have the details.

## Browser support

The package targets Baseline 2025: Chrome and Edge 141, Firefox 145, and Safari 26.2 ([ADR 0002](docs/specs/adr/0002-browser-target-baseline-2025.md)). Two checks hold that floor:

- `.browserslistrc` sets it for the Angular builds, and ESLint fails on CSS or TypeScript newer than Baseline 2025.
- `.github/workflows/floor.yml` reruns the browser tests at the floor for every pull request and every push to `main`: Chromium 141 (Chrome for Testing), Firefox 145 (through WebdriverIO), and WebKit 26.4 (Playwright 1.59.1 in its container image, the earliest WebKit not below Safari 26.2). No CI runner offers Safari 26.2 itself, and Edge 141 is the Chromium 141 engine.

## Yeti

Yeti has no npm release. The workspace vendors its source at one `develop` commit, recorded in `vendor/yeti/COMMIT` ([ADR 0006](docs/specs/adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md)). Never edit `vendor/yeti`. To move the pin, follow the [`yeti-pin` skill](.claude/skills/yeti-pin/SKILL.md).

## Continuous integration

`.github/workflows/ci.yml` runs `prettier --check`, lint, typecheck, unit and story tests, every build, and every e2e project in Chromium, Firefox, and WebKit. `.github/workflows/floor.yml` runs the browser-floor tests.

## Contribute

Read [`AGENTS.md`](AGENTS.md) first. Commits follow Conventional Commits, and every commit must pass `npx prettier --check .` and `npm exec nx -- run-many -t lint typecheck test` on its own. To implement a spec, start with the [`ngx-yeti-specs` skill](.claude/skills/ngx-yeti-specs/SKILL.md).

## License

MIT. The vendored Yeti source in `vendor/yeti` keeps its own license, FSL-1.1-MIT (`vendor/yeti/LICENSE`).
