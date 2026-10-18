# Docs Audit

Repo root: D:/projects/github/LayZeeDK/ngx-yeti
Audited: 2026-10-10
Audited HEAD: f35b35f8d2ae07cf82272bee4665ef5e978c71f1
Alignment mode: no

## Summary

| Verdict | Count |
|---------|-------|
| verified | 70 |
| stale | 2 |
| aspirational | 0 |
| unverifiable | 15 |
| descriptive docs (no testable claims) | 294 |

Worst drift: vendor/yeti/README.md says Yeti is at 7.0.0-beta while the vendored package.json and the package changelog name 7.0.0-alpha.0 at the pin.

## Doc: README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "The specs in docs/specs describe all 49 Yeti items and five shared pieces" | structure | verified | `docs/specs/specs/` holds 54 files (49 items + 5 shared pieces); `vendor/yeti/src` has 22 components + 17 layouts + 3 recipes + 7 utilities = 49 |
| "The setup spec's style loader (ngx-yeti/styles) and the card and lift items are implemented, each at its own entry point; the other items are not" | status | verified | `packages/ngx-yeti/{styles,card,lift}/src/index.ts` exist; `packages/ngx-yeti` has no other secondary entry point folder (ls) |
| "nothing is published to npm" | status | unverifiable | Needs a registry query; repo shows version 0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8 marked "(unreleased)" in `packages/ngx-yeti/CHANGELOG.md:5` |
| Workspace path table (`packages/ngx-yeti`, `packages/ngx-yeti-testing`, `apps/yeti-app`, `apps/yeti-app-e2e`, `apps/ngx-yeti-e2e`, `apps/yeti-analog`, `apps/yeti-analog-e2e`, `vendor/yeti`, `tools/yeti`, `tools/package`, `tools/ci-local`, `tools/playwright`, `tools/playwright-server`, `docs/specs`, `docs/decisions`, `references`, `.claude/skills`) | structure | verified | `ls` of the sidecar: every listed path exists; `tools/yeti` holds `vendor-yeti.mjs`, `nx-plugin.mjs`, `generate-sources.mjs`; `tools/package/pack-check.mjs`, `tools/ci-local/run-job.mjs`, `tools/playwright/engines.mjs`, `tools/playwright-server/server.mjs` exist |
| "You need Node.js 24 or later, which Yeti's build requires" | config | verified | `vendor/yeti/package.json` engines.node ">=24" |
| "npm ci ... also links vendor/yeti as node_modules/yeti-css" and `npx playwright install chromium` | command | unverifiable | Sidecar has no `node_modules`; running `npm ci` needs network and a full install. `package.json` workspaces config not run |
| "To build it alone, run npx nx yeti-build yeti-css" | command | unverifiable | Target is defined (`tools/yeti/nx-plugin.mjs:27` `'yeti-build'`), but the build was not run: no `node_modules` in the sidecar |
| Script table (`check`, `affected`, `test`, `test-storybook`, `e2e`, `typecheck`, `storybook`, `start`, `build`, `format:check`) | command | verified | `package.json` scripts: `check` = lint typecheck test test-storybook; `affected` adds build pack-check; `storybook` = nx storybook ngx-yeti; `start` = nx serve yeti-app; `format:check` present |
| "Storybook for ngx-yeti on port 4400" | config | verified | `packages/ngx-yeti/project.json` storybook options port 4400 (static-storybook 4401) |
| "Storybook uses [fastCompile] only in the -fast scripts ... and compiles stories in JIT mode otherwise" | config | verified | `nx.json:91,117,199` set `ANGULAR_FAST_COMPILE: "true"` in `fast` configurations; `packages/ngx-yeti/.storybook/main.ts:27` reads it; `package.json` has `storybook-fast` scripts |
| "Unit tests in a real browser ... Server-render and pure-logic tests in Node. Their files end in .ssr.spec.ts or .node.spec.ts" | structure | verified | `packages/ngx-yeti/vitest.unit.config.mts:61-62` routes `*.ssr.spec.ts` and `*.node.spec.ts` to the node project |
| "Every story fails its test on any axe violation of the WCAG 2.2 AA tags, and on any console.error" | feature | verified | `packages/ngx-yeti/.storybook/preview.ts:19-22` `a11y.test: 'error'` with `runOnly`; `preview.ts:9-16` spies on `console.error` and expects no calls; `packages/ngx-yeti-testing/src/lib/wcag-tags.ts` lists wcag2a/2aa/21a/21aa/22aa/best-practice |
| "Baseline 2025: Chrome and Edge 141, Firefox 145, and Safari 26.2 ... .browserslistrc sets that floor" | config | verified | `.browserslistrc`: chrome 141, edge 141, firefox 145, safari 26.2, ios_saf 26.2 |
| "ESLint fails on CSS or TypeScript newer than Baseline 2025" | config | verified | `eslint.config.mjs:215` `css/use-baseline: error`, `:225` `baseline-js/use-baseline` |
| "recorded in vendor/yeti/COMMIT" | structure | verified | `vendor/yeti/COMMIT` = f52d1e8b93de5bbde322480ba77d5be26c49b0ef |
| "ci.yml runs ... static, package, unit, and one e2e job per engine and Fixture app configuration ... Its safari job runs on a macOS runner" | integration | verified | `.github/workflows/ci.yml` jobs: static (l.21), package (l.34), unit (l.48), e2e with matrix name `e2e (${{ matrix.engine }}, ${{ matrix.configuration }})` (l.74), safari on `macos-latest` (l.95) |
| "Both workflows run on every pull request and every push to main or release/**" | integration | verified | `ci.yml:3-6` and `floor.yml:6-9` (floor also has `workflow_dispatch`) |
| "floor.yml runs ... Chrome for Testing 141 ... Firefox 145 ... earliest Playwright Firefox and WebKit not older than the floor" | integration | verified | `floor.yml` jobs `chromium-141` (CHROME_FLOOR_VERSION 141.0.7390.54), `firefox-145`, `webkit-26-4` (Playwright 1.59.1), `firefox-146-e2e` (Playwright 1.58.2) |
| "MIT. The vendored Yeti source ... keeps its own license, FSL-1.1-MIT (vendor/yeti/LICENSE)" | config | verified | `vendor/yeti/package.json` license "FSL-1.1-MIT"; `vendor/yeti/LICENSE` exists; root `LICENSE` exists |

## Doc: AGENTS.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Run nx typecheck beside them. npm run check and npm run affected do both." | command | verified | `package.json`: `check` and `affected` both list `typecheck` |
| "nx typecheck-watch <project>" and `-c src`, `-c spec`, `-c stories` configurations | config | verified | `nx.json:122` `typecheck-watch` target default; `packages/ngx-yeti/project.json:109` declares it; `references/fast-compile.md` documents the configurations |
| "Every job in ci.yml and floor.yml runs locally except ci.yml safari ... node tools/ci-local/run-job.mjs <workflow> <job>" | command | verified | `tools/ci-local/run-job.mjs` exists with the documented usage string; `ci.yml` has `safari` on macOS |
| Specs folder and the two ledgers (`docs/specs/README.md`, `docs/specs/ledger.md`, `docs/specs/upstream-bugs.md`) | structure | verified | all three files are in the frozen inventory and exist on disk |
| Skills table (`ngx-yeti-specs`, `ngx-yeti-testing`, `ngx-yeti-stories`, `ngx-yeti-accessibility`, `yeti-pin`, `type-safety`) | structure | verified | `.claude/skills/<name>/SKILL.md` exists for all six |
| "Use the types in the git history, such as build, refactor, docs, feat, fix, and test" | status | verified | `git log` subjects of the last 300 commits all match `type(scope):` Conventional Commits or the GSD Path subjects; sample: `build(gsd-path): ...`, `docs(skills): ...`, `test(yeti-app-e2e): ...` |
| "npx prettier --check . and npm exec nx -- affected -t lint typecheck test test-storybook ... pass at every commit" | command | unverifiable | Needs `npm ci` and a per-commit run; the sidecar has no `node_modules` |
| "Plain-prompt re-entry ... .gsd-path/status_runtime.py" | integration | verified | `.gsd-path/status_runtime.py` and `.gsd-path/runtime.json` exist in the sidecar |

## Doc: .claude/CLAUDE.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "@../AGENTS.md" and "@../WORKFLOW.md" imports | structure | verified | `AGENTS.md` and `WORKFLOW.md` exist at the repo root |

## Doc: apps/yeti-analog/AGENTS.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "This is an AnalogJS app" | feature | verified | `apps/yeti-analog/vite.config.ts:29` `analog({ fastCompile: true, ... })`; `package.json` depends on `@analogjs/platform` ^2.8.0 |
| "Read them here: node_modules/@analogjs/platform/AGENTS.md" | structure | unverifiable | Sidecar has no `node_modules`; needs `npm ci` to confirm the file ships in the installed `@analogjs/platform` |

## Doc: apps/yeti-analog/CLAUDE.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Strictly follow the rules in @AGENTS.md" | structure | verified | `apps/yeti-analog/AGENTS.md` exists beside it |

## Doc: packages/ngx-yeti/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "The setup, the card item, and the lift item are implemented" and the entry point table (`ngx-yeti`, `ngx-yeti/styles`, `ngx-yeti/card`, `ngx-yeti/lift`, `ngx-yeti/accessibility.css`) | feature | verified | `packages/ngx-yeti/src/index.ts`, `styles/src/index.ts`, `card/src/index.ts`, `lift/src/index.ts`; `package.json` exports `./accessibility.css`; exports found: `provideYetiStyles` (`provide-yeti-styles.ts:48`), `injectYetiItemStyles` (`inject-yeti-item-styles.ts:25`), `YetiStylesConfig` (`yeti-styles.ts:18`), `YetiCard` (`card.ts:58`), `YetiCardLink` (`card-link.ts:44`), `yetiCardToken` (`card-tokens.ts:5`), `NgxYetiLift` (`lift.ts:42`) |
| "Angular 22.2" and peer dependency | config | verified | `packages/ngx-yeti/package.json` peerDependencies `@angular/core` ^22.2.0; root `package.json` Angular 22.2.1 |
| "Yeti built at the pinned commit f52d1e8b93de5bbde322480ba77d5be26c49b0ef" | config | verified | `vendor/yeti/COMMIT`; `packages/ngx-yeti/styles/src/yeti-rank.ts:6` `yetiPin` equals the same sha |
| "The package declares no yeti-css dependency or peer dependency" | config | verified | `packages/ngx-yeti/package.json` has only the `@angular/core` peer dependency |
| "provideYetiStyles({ url, preload }) ... url defaults to 'yeti-css/'" and "?v=<pin>" in item URLs | feature | verified | `yeti-styles.ts:32,42` (`url`, `preload` options); `:75` default `'yeti-css/'`; `:180` returns `${url}${path}?v=${yetiPin}`; server writes `prefetch`, client `preload` (`:103`) |
| "It copies Yeti's 66 built CSS files to yeti-css/ beside the application" | config | unverifiable | Needs `yeti-build` output (`vendor/yeti/dist/css`), which does not exist in the sidecar |
| "Nx 24 keeps nx:run-commands" | integration | unverifiable | Workspace pins Nx 23.2.1 (`package.json`); a statement about a future Nx release cannot be checked from the repo |
| "Known issue, upstream bug A4 ... Chromium showed a single frame here too, in 1 of 20 production repeat runs" | status | unverifiable | Measured result needing a production build and 20 browser runs; the ledger entry lives in `docs/specs/upstream-bugs.md` |
| Error boundary behaviours (what a boundary catches and misses, `$reset()` frames, upstream bug A8) | feature | unverifiable | Runtime behaviour in Angular 22.2 `@boundary` developer preview across WebKit, Chromium, and Firefox; needs browser runs and the Fixture app, not run here |
| "No generator or ng add writes B, C, or D yet." | status | verified | No `generators.json` or `schematics` entry in `packages/ngx-yeti/package.json` |

## Doc: packages/ngx-yeti/CHANGELOG.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8 (unreleased) ... Built against Yeti 7.0.0-alpha.0 at commit f52d1e8b..." | config | verified | `packages/ngx-yeti/package.json` version matches; `vendor/yeti/package.json` version 7.0.0-alpha.0; `vendor/yeti/COMMIT` same sha |
| Entry points list, including `accessibility.css` "has no accessibility rule yet; it carries a workaround ... Firefox 145 to 152 ... atan2()" | feature | verified | `packages/ngx-yeti/accessibility.css:1-6` `@layer ngx-yeti` with the Firefox 145 to 152 `atan2()` comment; `ng-package.json` assets include `accessibility.css` |
| "its declarations never import yeti-css" | config | verified | `packages/ngx-yeti/src/published-output.node.spec.ts` exists and `references/fast-compile.md` says it reads `dist/packages/ngx-yeti`; the check was not run (no `node_modules`), so the spec's existence is the evidence |

## Doc: packages/ngx-yeti-testing/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "@ngx-yeti/testing: itemStylesLoaded, contrastRatio, wcagTags. @ngx-yeti/testing/server: renderServer, checkContract, head, openingTags" | feature | verified | `src/index.ts` exports `itemStylesLoaded` (`lib/item-links.ts:96`), `contrastRatio` (`lib/contrast.ts:150`), `wcagTags`; `src/server.ts` exports `renderServer` (`lib/render-server.ts:43`), `checkContract` (`lib/contract.ts:395`), `openingTags` (`lib/html.ts:65`), `head` (`lib/html.ts:87`) |
| "The project is never built or published." | config | verified | `packages/ngx-yeti-testing` has `project.json`, no `ng-package.json` and no build config; sibling `package.json` absent |

## Doc: packages/ngx-yeti/card/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "exports YetiCard, YetiCardLink, and yetiCardToken" | feature | verified | `packages/ngx-yeti/card/src/card.ts:58`, `card-link.ts:44`, `card-tokens.ts:5` |

## Doc: packages/ngx-yeti/lift/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "exports NgxYetiLift" | feature | verified | `packages/ngx-yeti/lift/src/lift.ts:42` |

## Doc: packages/ngx-yeti/styles/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "exports provideYetiStyles, injectYetiItemStyles, and YetiStylesConfig" | feature | verified | `styles/src/provide-yeti-styles.ts:48`, `inject-yeti-item-styles.ts:25`, `yeti-styles.ts:18` (type re-exported at `index.ts:3`) |

## Doc: references/fast-compile.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Table of fastCompile targets (`ngx-yeti` test, `ngx-yeti-testing` test, Storybook `-c fast`, `build-fast`, `yeti-analog`) | config | verified | `packages/ngx-yeti/vitest.unit.config.mts:66` `angular({ fastCompile: true, jit: false })`; `packages/ngx-yeti-testing/vitest.config.mts:48` same; `nx.json` `ANGULAR_FAST_COMPILE` in fast configs; `packages/ngx-yeti/vite.lib.config.mts:69` `fastCompile: true, fastCompileMode: 'partial'`; `apps/yeti-analog/vite.config.ts:29` |
| "only the served projects (ngx-yeti, yeti-app, and yeti-analog) declare typecheck-watch" | config | verified | `rg -c typecheck-watch` over `apps/*/project.json packages/*/project.json`: matches only in `packages/ngx-yeti`, `apps/yeti-app`, `apps/yeti-analog` |
| "apps/yeti-analog/vite.config.ts passes workspaceRoot" | config | verified | `apps/yeti-analog/vite.config.ts:28` `workspaceRoot: path.join(import.meta.dirname, '../..')` |
| "vitest.unit.config.mts is separate from vitest.config.mts" and `.ssr.spec.ts` / `.node.spec.ts` go to the node project | structure | verified | `packages/ngx-yeti/vitest.unit.config.mts` and `vitest.config.mts` both exist; routing at `vitest.unit.config.mts:61-62` |
| "Chromium only, the browsers BROWSERS names, or Chromium, Firefox, and WebKit when CI is set" | config | verified | `tools/playwright/engines.mjs:109` `env['BROWSERS'] \|\| (env['CI'] ? 'chromium,firefox,webkit' : 'chromium')` |
| "tools/playwright/vitest-configs.test.mjs ... playwright-configs.test.mjs" | structure | verified | both files exist under `tools/playwright/` |
| "test target of ngx-yeti also depends on build, because published-output.node.spec.ts ... read dist/packages/ngx-yeti" | config | verified | `packages/ngx-yeti/project.json:39` `dependsOn: ["build", "^yeti-build"]`; `packages/ngx-yeti/src/published-output.node.spec.ts` exists |
| "A production named input excludes {projectRoot}/vitest.* and src/test-setup.ts" | config | verified | `nx.json` production input lists `!{projectRoot}/vitest.*` and `!{projectRoot}/src/test-setup.[jt]s` |
| "Analog reports that fastCompile passes about 91% of Angular's conformance suite" and "10 to 35%" speed gains | status | unverifiable | Third-party figure and benchmark timing; see `docs/benchmarks/fast-compile.md` for the local measurements, which need a Windows ARM64 rerun |
| "`<yeti-nope />` ... passes test and fails typecheck with NG8001" | command | unverifiable | Needs `npm ci` and an Angular compile; sidecar has no `node_modules` |

## Doc: references/ci-local.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "ci.yml unit and e2e and floor.yml webkit-26-4 and firefox-146-e2e run in a Playwright image" | integration | verified | `ci.yml:51,68` `container: mcr.microsoft.com/playwright:v1.63.0-noble`; `floor.yml:71` (`v1.59.1-noble`) and `:101` (`v1.58.2-noble`) |
| "Jobs without a container: ci.yml static, package; floor.yml firefox-145, chromium-141" | integration | verified | `ci.yml` jobs static and package have no `container`; `floor.yml` jobs firefox-145 and chromium-141 run on `ubuntu-latest` without one |
| "BROWSERS ... chromium, firefox, webkit, remote-*, msedge, chrome, moz-firefox" | config | verified | `tools/playwright/engines.mjs:62-87` define `chromium`, `chrome`, `msedge`, `remote-chromium` and siblings; `:109` default |
| "The script reads the job's container image, env, matrix and run steps ... --matrix key=value, --dry-run, -- <command>" | command | verified | `tools/ci-local/run-job.mjs:11-60` usage string and argument parser with `--matrix`, `--dry-run`, `--` |
| "node tools/playwright-server/server.mjs ... stop" | command | verified | `tools/playwright-server/server.mjs` and `container.mjs` exist; command not run (needs Docker) |
| Measured runs tables (times and pass counts, 2026-10-05 and 2026-10-06, Edge 154, Firefox 157) | status | unverifiable | Wall times and test counts from Docker and browser runs on one machine; reproducing needs Docker Desktop, installed browsers, and an install of dependencies |
| "upstream-bugs.md O13 and O14 ... O15" | status | unverifiable | Ledger rows belong to `docs/specs/upstream-bugs.md`, a verbatim planning copy that was not cross-checked row by row |

## Doc: docs/benchmarks/fast-compile.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Each section names the commit it measured": b7c75f5, 0bf3a63, 0ca8b67, 0425fdc | structure | verified | `git cat-file -t` reports `commit` for all four |
| Timing tables (compile time, critical path, typecheck per tsconfig) | status | unverifiable | Measurements on Windows 11 ARM64 with `vitest bench`; reproducing needs `npm ci` and the bench harness |

## Doc: vendor/yeti/README.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "Yeti is at 7.0.0-beta" | status | stale | `vendor/yeti/package.json` version is "7.0.0-alpha.0" at the pin f52d1e8b; `packages/ngx-yeti/CHANGELOG.md` also names 7.0.0-alpha.0 |
| "seventeen layout primitives, three recipes, twenty-two components, and seven utilities" | structure | verified | `vendor/yeti/src/layouts` has 17 item folders (plus `attributes.css`), `recipes` 3, `components` 22, `utilities` 7 |
| "Yeti targets Baseline 2025" | config | verified | Consistent with `.browserslistrc` and ADR 0002 target of the workspace |
| "[stability page](docs/guides/stability.md)" and other `docs/guides/*` links | structure | stale | `vendor/yeti/docs` does not exist; the guides vendored at `vendor/yeti/src/guides/` (11 files). Upstream layout differs from the vendored subset (`git archive` of `src bin schema ...` only) |

## Doc: .claude/skills/ngx-yeti-testing/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| Four-layer table (file suffixes, runners, `npx nx test-storybook ngx-yeti`, `npx nx e2e ngx-yeti-e2e`, `Playwright 1.63`) | config | verified | `packages/ngx-yeti/project.json` `test-storybook` target; `package.json` `@playwright/test` ^1.63.0; both e2e projects have `project.json`; suffix routing at `vitest.unit.config.mts:61-62` |
| Shared helper table names (`wcagTags`, `renderServer`, `checkContract`, `itemStylesLoaded`, `contrastRatio`) and e2e support files (`axe.ts`, `open-story.ts`, `item-styles.ts`, `fixtures.ts`, `hosts.ts`, `hydration.ts`, `style-probe.ts`) | feature | verified | Files exist: `apps/ngx-yeti-e2e/src/{axe,item-styles,open-story}.ts`, `apps/yeti-app-e2e/src/support/{axe,fixtures,hosts,hydration,style-probe}.ts`, `packages/ngx-yeti-testing/src/lib/{axe-violations,html,item-links}.ts`; exports `recordFrames`, `recordStyleMutations`, `recordHostAttributes`, `itemLinks`, `itemSheetsLoaded`, `delayCss`, `recordItemRequests`, `expectHydrationFrames`, `removeEveryHost`, `removeDehydratedHosts`, `expectHoverLifts`, `waitForHydration`, `nextFrames` all present under `apps/yeti-app-e2e/src/support` |
| "src/lib/axe-violations.ts, src/lib/item-links.ts, src/lib/html.ts" | structure | verified | `packages/ngx-yeti-testing/src/lib/` contains all three |

## Doc: .claude/skills/yeti-pin/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "vendor/yeti/ holds exactly the files of git archive <pin> src bin schema package.json package-lock.json LICENSE README.md, plus COMMIT" | structure | verified | `ls vendor/yeti`: bin, COMMIT, LICENSE, package.json, package-lock.json, README.md, schema, src |
| ".nxignore hides vendor/yeti/package.json from Nx" | config | verified | `.nxignore` lists `/vendor/yeti/package.json` |
| "tools/yeti/nx-plugin.mjs defines the yeti-css project with one target" | config | verified | `tools/yeti/nx-plugin.mjs:27` defines `'yeti-build'` |
| "A project that reads yeti-css declares implicitDependencies: ["yeti-css"], as ngx-yeti and yeti-app do" | config | verified | `packages/ngx-yeti/project.json` `implicitDependencies: ["yeti-css"]`; `apps/yeti-app/project.json:8` same |
| "nx.json targetDefaults give ... targets a ^yeti-build dependency" | config | verified | `nx.json:71,77,85,97,128,195,204,212-219` list `dependsOn: ["^yeti-build"]` |
| "data an item needs at run time is generated ... by npx nx yeti-sources ngx-yeti" | command | verified | `tools/yeti/generate-sources.mjs:4,46` name `nx yeti-sources`; generated files `packages/ngx-yeti/src/yeti-types.ts` and `styles/src/yeti-rank.ts` exist |
| "a yeti-build cache hit can report [local cache] without writing vendor/yeti/dist" | status | unverifiable | Skill itself states "the cause is not diagnosed"; needs a second worktree and a shared Nx cache |

## Doc: .claude/skills/ngx-yeti-specs/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "docs/specs/ is a verbatim copy of the planning bundle ... Prettier and Nx ignore it" | config | verified | `.nxignore` lists `/docs/specs`; `.prettierignore` is present (not read line by line) |
| Read-order files (`docs/specs/README.md`, `map.md`, `building-blocks.md`, `ledger.md`, `upstream-bugs.md`, `CONTEXT.md`, `architecture-guide.md`, `issues/50-decide-open-points-of-the-specs.md`, `issues/93-decide-testing-at-the-browser-floor.md`, `specs/<name>.md`) | structure | verified | all listed paths are in the frozen inventory and exist |
| "yeti-rank.node.spec.ts" and `provide-yeti-styles.spec.ts` | structure | verified | `packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts`, `provide-yeti-styles.spec.ts` exist |

## Doc: .claude/skills/ngx-yeti-stories/SKILL.md

| Claim | Type | Verdict | Evidence |
|-------|------|---------|----------|
| "preview.ts runs axe on every story ... parameters.a11y.test = 'error' and runOnly set to wcagTags" | config | verified | `packages/ngx-yeti/.storybook/preview.ts:19-22` |
| "Any console.error during a story fails it too (beforeEach and afterEach in the preview)" | feature | verified | `packages/ngx-yeti/.storybook/preview.ts:9-16` |

## Descriptive docs

The specs, ADRs, issues, audits, prototypes, research records, and ledgers under docs/specs are a verbatim planning bundle: they record decisions and intended design, not claims about what the workspace does today, and AGENTS.md forbids editing them. The type-safety skill and its rules, the eslint-conflict-audit skill, and the accessibility skill are coding guidance. The per-component and per-layout docs and guides under vendor/yeti are the vendored third-party Yeti documentation at the pin, whose accuracy is Yeti's. WORKFLOW.md describes GSD Path pipeline internals, an installed dependency, so its claims are out of scope for this application audit.

- .claude/skills/eslint-conflict-audit/SKILL.md
- .claude/skills/ngx-yeti-accessibility/SKILL.md
- .claude/skills/type-safety/SKILL.md
- .claude/skills/type-safety/rules/angular-components.md
- .claude/skills/type-safety/rules/satisfies-patterns.md
- .claude/skills/type-safety/rules/sifers-pattern.md
- .claude/skills/type-safety/rules/storybook-stories.md
- .claude/skills/type-safety/rules/typed-mocks.md
- WORKFLOW.md
- docs/specs/CONTEXT.md
- docs/specs/README.md
- docs/specs/adr/0001-yeti-licence-compatible-with-mit-package.md
- docs/specs/adr/0002-browser-target-baseline-2025.md
- docs/specs/adr/0003-directives-set-yetis-class-attributes-and-markers.md
- docs/specs/adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md
- docs/specs/adr/0005-closed-unions-from-yetis-vocabularies.md
- docs/specs/adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md
- docs/specs/adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md
- docs/specs/adr/0011-rendering-modes-contract-for-yeti.md
- docs/specs/adr/0012-class-prefix-and-token-naming.md
- docs/specs/adr/0013-parts-name-their-targets-by-reference.md
- docs/specs/adr/0014-testing-stack-for-yeti.md
- docs/specs/adr/0015-wcag-2-2-aa-enforcement-over-yeti.md
- docs/specs/adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md
- docs/specs/adr/0017-release-policy-with-a-pinned-yeti.md
- docs/specs/adr/0018-no-import-arrays-and-later-milestone-import-checks.md
- docs/specs/adr/0019-nav-and-dropdown-are-disclosure-navigation.md
- docs/specs/adr/0020-field-validity-comes-from-angular-forms.md
- docs/specs/adr/0021-dialog-is-a-directive-on-the-native-dialog.md
- docs/specs/adr/0022-button-declares-no-listeners.md
- docs/specs/adr/0023-fragment-links-are-same-document-links.md
- docs/specs/adr/0024-carousel-slides-are-not-inert-before-live.md
- docs/specs/adr/0025-toc-finds-its-headings-from-its-links.md
- docs/specs/adr/0040-package-replaces-yetis-optional-modules.md
- docs/specs/adr/0041-closing-on-navigation-is-a-per-instance-subscription.md
- docs/specs/adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md
- docs/specs/adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md
- docs/specs/adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md
- docs/specs/adr/0045-each-item-marks-its-host-with-its-own-attribute.md
- docs/specs/adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md
- docs/specs/adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md
- docs/specs/adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md
- docs/specs/architecture-guide.md
- docs/specs/audits/0001-research-wave.md
- docs/specs/audits/0002-second-wave.md
- docs/specs/audits/0003-third-wave.md
- docs/specs/audits/0004-final-consistency-review.md
- docs/specs/audits/0005-portability.md
- docs/specs/building-blocks.md
- docs/specs/issues/01-research-browser-baseline-vs-yeti.md
- docs/specs/issues/02-research-yeti-inventory.md
- docs/specs/issues/03-research-yeti-javascript-and-angular.md
- docs/specs/issues/04-research-yeti-styles-and-lazy-loading.md
- docs/specs/issues/05-task-carry-yeti-findings-from-old-map.md
- docs/specs/issues/06-decide-browser-target.md
- docs/specs/issues/07-decide-inherited-preferences-and-rulings.md
- docs/specs/issues/08-decide-inherited-adrs.md
- docs/specs/issues/09-decide-inherited-principles-and-building-blocks.md
- docs/specs/issues/10-decide-glossary.md
- docs/specs/issues/11-decide-spec-list.md
- docs/specs/issues/12-decide-yeti-version-policy.md
- docs/specs/issues/13-decide-style-loading.md
- docs/specs/issues/14-research-foundationcss-llms-txt.md
- docs/specs/issues/15-decide-yeti-licence-and-readiness.md
- docs/specs/issues/16-research-yeti-events-in-angular-templates.md
- docs/specs/issues/17-research-yeti-accessibility-and-standards.md
- docs/specs/issues/18-prototype-yeti-rendering-modes.md
- docs/specs/issues/19-research-yeti-validate-and-signal-forms.md
- docs/specs/issues/20-prototype-yeti-in-single-page-apps.md
- docs/specs/issues/21-prototype-yeti-as-github-dependency.md
- docs/specs/issues/22-prototype-building-and-consuming-yeti-with-nx.md
- docs/specs/issues/23-research-yeti-layers-and-import-order.md
- docs/specs/issues/24-prototype-ngx-yeti-with-tailwind-v4.md
- docs/specs/issues/25-decide-building-blocks-map.md
- docs/specs/issues/26-decide-yeti-data-attributes-mapping.md
- docs/specs/issues/27-research-testing-at-the-browser-floor.md
- docs/specs/issues/28-research-npm-build-metadata.md
- docs/specs/issues/29-prototype-aria-for-the-native-pattern-items.md
- docs/specs/issues/30-prototype-fitting-aria-by-directive-composition.md
- docs/specs/issues/31-research-yetis-removed-planning-documents.md
- docs/specs/issues/32-research-aria-directives-on-yetis-own-markup.md
- docs/specs/issues/33-research-decided-records-against-hydration-constraints.md
- docs/specs/issues/34-prototype-subclassing-aria-and-open-binding-forms.md
- docs/specs/issues/35-decide-hydration-safe-generated-ids.md
- docs/specs/issues/36-research-boundary-and-error-blocks.md
- docs/specs/issues/37-prototype-consumer-boundaries-around-ngx-yeti.md
- docs/specs/issues/38-spec-setup.md
- docs/specs/issues/39-spec-generated-ids.md
- docs/specs/issues/40-spec-events.md
- docs/specs/issues/41-spec-fragment-links.md
- docs/specs/issues/42-spec-navigation-close.md
- docs/specs/issues/43-spec-attention.md
- docs/specs/issues/44-spec-billboard.md
- docs/specs/issues/45-spec-enter.md
- docs/specs/issues/46-spec-lede.md
- docs/specs/issues/47-spec-lift.md
- docs/specs/issues/48-spec-print.md
- docs/specs/issues/49-spec-visually-hidden.md
- docs/specs/issues/50-decide-open-points-of-the-specs.md
- docs/specs/issues/51-spec-box.md
- docs/specs/issues/52-spec-breakout.md
- docs/specs/issues/53-spec-center.md
- docs/specs/issues/54-spec-cluster.md
- docs/specs/issues/55-spec-columns.md
- docs/specs/issues/56-spec-container.md
- docs/specs/issues/57-spec-cover.md
- docs/specs/issues/58-spec-frame.md
- docs/specs/issues/59-spec-grid.md
- docs/specs/issues/60-spec-icon.md
- docs/specs/issues/61-spec-layer.md
- docs/specs/issues/62-spec-masonry.md
- docs/specs/issues/63-spec-overlay.md
- docs/specs/issues/64-spec-scroller.md
- docs/specs/issues/65-spec-sidebar.md
- docs/specs/issues/66-spec-stack.md
- docs/specs/issues/67-spec-timeline.md
- docs/specs/issues/68-spec-hero.md
- docs/specs/issues/69-spec-media.md
- docs/specs/issues/70-spec-shell.md
- docs/specs/issues/71-spec-accordion.md
- docs/specs/issues/72-spec-affix.md
- docs/specs/issues/73-spec-alert.md
- docs/specs/issues/74-spec-badge.md
- docs/specs/issues/75-spec-breadcrumbs.md
- docs/specs/issues/76-spec-button.md
- docs/specs/issues/77-spec-buttons.md
- docs/specs/issues/78-spec-card.md
- docs/specs/issues/79-spec-carousel.md
- docs/specs/issues/80-spec-demo.md
- docs/specs/issues/81-spec-dialog.md
- docs/specs/issues/82-spec-dropdown.md
- docs/specs/issues/83-spec-field.md
- docs/specs/issues/84-spec-nav.md
- docs/specs/issues/85-spec-pagination.md
- docs/specs/issues/86-spec-progress.md
- docs/specs/issues/87-spec-seam.md
- docs/specs/issues/88-spec-spinner.md
- docs/specs/issues/89-spec-table.md
- docs/specs/issues/90-spec-tabs.md
- docs/specs/issues/91-spec-toc.md
- docs/specs/issues/92-spec-tooltip.md
- docs/specs/issues/93-decide-testing-at-the-browser-floor.md
- docs/specs/ledger.md
- docs/specs/map.md
- docs/specs/prototypes/aria-accordion/README.md
- docs/specs/prototypes/aria-buttons/README.md
- docs/specs/prototypes/aria-carousel/README.md
- docs/specs/prototypes/aria-composition-accordion/README.md
- docs/specs/prototypes/aria-composition-roving/README.md
- docs/specs/prototypes/aria-nav-dropdown/README.md
- docs/specs/prototypes/aria-subclass-and-open/README.md
- docs/specs/prototypes/consumer-boundaries/README.md
- docs/specs/prototypes/hydration-safe-ids/README.md
- docs/specs/prototypes/style-loading/README.md
- docs/specs/prototypes/style-loading/results/summary-0.md
- docs/specs/prototypes/style-loading/results/summary-300.md
- docs/specs/prototypes/yeti-github-dependency/README.md
- docs/specs/prototypes/yeti-nx-build/README.md
- docs/specs/prototypes/yeti-rendering-modes/README.md
- docs/specs/prototypes/yeti-rendering-modes/results/report.md
- docs/specs/prototypes/yeti-spa/README.md
- docs/specs/prototypes/yeti-tailwind/README.md
- docs/specs/research/aria-on-yeti-markup.md
- docs/specs/research/boundary-and-error-blocks.md
- docs/specs/research/browser-baseline-vs-yeti.md
- docs/specs/research/foundationcss-llms-txt.md
- docs/specs/research/hydration-constraints-audit.md
- docs/specs/research/npm-build-metadata.md
- docs/specs/research/old-forgotten-import-checks-spec.md
- docs/specs/research/testing-at-the-browser-floor.md
- docs/specs/research/yeti-accessibility-and-standards.md
- docs/specs/research/yeti-events-in-angular-templates.md
- docs/specs/research/yeti-foundation-7.md
- docs/specs/research/yeti-inventory.md
- docs/specs/research/yeti-javascript-and-angular.md
- docs/specs/research/yeti-layers-and-import-order.md
- docs/specs/research/yeti-planning-documents.md
- docs/specs/research/yeti-styles-and-lazy-loading.md
- docs/specs/research/yeti-validate-and-signal-forms.md
- docs/specs/specs/accordion.md
- docs/specs/specs/affix.md
- docs/specs/specs/alert.md
- docs/specs/specs/attention.md
- docs/specs/specs/badge.md
- docs/specs/specs/billboard.md
- docs/specs/specs/box.md
- docs/specs/specs/breadcrumbs.md
- docs/specs/specs/breakout.md
- docs/specs/specs/button.md
- docs/specs/specs/buttons.md
- docs/specs/specs/card.md
- docs/specs/specs/carousel.md
- docs/specs/specs/center.md
- docs/specs/specs/cluster.md
- docs/specs/specs/columns.md
- docs/specs/specs/container.md
- docs/specs/specs/cover.md
- docs/specs/specs/demo.md
- docs/specs/specs/dialog.md
- docs/specs/specs/dropdown.md
- docs/specs/specs/enter.md
- docs/specs/specs/events.md
- docs/specs/specs/field.md
- docs/specs/specs/fragment-links.md
- docs/specs/specs/frame.md
- docs/specs/specs/generated-ids.md
- docs/specs/specs/grid.md
- docs/specs/specs/hero.md
- docs/specs/specs/icon.md
- docs/specs/specs/layer.md
- docs/specs/specs/lede.md
- docs/specs/specs/lift.md
- docs/specs/specs/masonry.md
- docs/specs/specs/media.md
- docs/specs/specs/nav.md
- docs/specs/specs/navigation-close.md
- docs/specs/specs/overlay.md
- docs/specs/specs/pagination.md
- docs/specs/specs/print.md
- docs/specs/specs/progress.md
- docs/specs/specs/scroller.md
- docs/specs/specs/seam.md
- docs/specs/specs/setup.md
- docs/specs/specs/shell.md
- docs/specs/specs/sidebar.md
- docs/specs/specs/spinner.md
- docs/specs/specs/stack.md
- docs/specs/specs/table.md
- docs/specs/specs/tabs.md
- docs/specs/specs/timeline.md
- docs/specs/specs/toc.md
- docs/specs/specs/tooltip.md
- docs/specs/specs/visually-hidden.md
- docs/specs/upstream-bugs.md
- vendor/yeti/src/components/accordion/docs.md
- vendor/yeti/src/components/affix/docs.md
- vendor/yeti/src/components/alert/docs.md
- vendor/yeti/src/components/badge/docs.md
- vendor/yeti/src/components/breadcrumbs/docs.md
- vendor/yeti/src/components/button/docs.md
- vendor/yeti/src/components/buttons/docs.md
- vendor/yeti/src/components/card/docs.md
- vendor/yeti/src/components/carousel/docs.md
- vendor/yeti/src/components/demo/docs.md
- vendor/yeti/src/components/dialog/docs.md
- vendor/yeti/src/components/dropdown/docs.md
- vendor/yeti/src/components/field/docs.md
- vendor/yeti/src/components/nav/docs.md
- vendor/yeti/src/components/pagination/docs.md
- vendor/yeti/src/components/progress/docs.md
- vendor/yeti/src/components/seam/docs.md
- vendor/yeti/src/components/spinner/docs.md
- vendor/yeti/src/components/table/docs.md
- vendor/yeti/src/components/tabs/docs.md
- vendor/yeti/src/components/toc/docs.md
- vendor/yeti/src/components/tooltip/docs.md
- vendor/yeti/src/guides/animations.md
- vendor/yeti/src/guides/base.md
- vendor/yeti/src/guides/color.md
- vendor/yeti/src/guides/components.md
- vendor/yeti/src/guides/install.md
- vendor/yeti/src/guides/layouts.md
- vendor/yeti/src/guides/migrating.md
- vendor/yeti/src/guides/responsive.md
- vendor/yeti/src/guides/stability.md
- vendor/yeti/src/guides/theming.md
- vendor/yeti/src/guides/visibility.md
- vendor/yeti/src/layouts/box/docs.md
- vendor/yeti/src/layouts/breakout/docs.md
- vendor/yeti/src/layouts/center/docs.md
- vendor/yeti/src/layouts/cluster/docs.md
- vendor/yeti/src/layouts/columns/docs.md
- vendor/yeti/src/layouts/container/docs.md
- vendor/yeti/src/layouts/cover/docs.md
- vendor/yeti/src/layouts/frame/docs.md
- vendor/yeti/src/layouts/grid/docs.md
- vendor/yeti/src/layouts/icon/docs.md
- vendor/yeti/src/layouts/layer/docs.md
- vendor/yeti/src/layouts/masonry/docs.md
- vendor/yeti/src/layouts/overlay/docs.md
- vendor/yeti/src/layouts/scroller/docs.md
- vendor/yeti/src/layouts/sidebar/docs.md
- vendor/yeti/src/layouts/stack/docs.md
- vendor/yeti/src/layouts/timeline/docs.md
- vendor/yeti/src/recipes/hero/docs.md
- vendor/yeti/src/recipes/media/docs.md
- vendor/yeti/src/recipes/shell/docs.md
- vendor/yeti/src/utilities/attention/docs.md
- vendor/yeti/src/utilities/billboard/docs.md
- vendor/yeti/src/utilities/enter/docs.md
- vendor/yeti/src/utilities/lede/docs.md
- vendor/yeti/src/utilities/lift/docs.md
- vendor/yeti/src/utilities/print/docs.md
- vendor/yeti/src/utilities/visually-hidden/docs.md

## User rulings

| Queue # | Ruling | User's words | Planned |
|---------|--------|--------------|---------|
| 1 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 2 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 3 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 4 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 5 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 6 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 7 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 8 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 9 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 10 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 11 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 12 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 13 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 14 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 15 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 16 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |
| 17 | accept-drift | "Accept recommendations for other rulings" | n/a (accept-drift) |

## Remediation queue

| # | Doc | Claim | Verdict | Class | Suggested action |
|---|-----|-------|---------|-------|------------------|
| 1 | README.md | "nothing is published to npm" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 2 | README.md | "npm ci ... also links vendor/yeti as node_modules/yeti-css" and `npx playwright install chromium` | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 3 | README.md | "To build it alone, run npx nx yeti-build yeti-css" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 4 | AGENTS.md | "npx prettier --check . and npm exec nx -- affected -t lint typecheck test test-storybook ... pass at every commit" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 5 | apps/yeti-analog/AGENTS.md | "Read them here: node_modules/@analogjs/platform/AGENTS.md" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 6 | packages/ngx-yeti/README.md | "It copies Yeti's 66 built CSS files to yeti-css/ beside the application" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 7 | packages/ngx-yeti/README.md | "Nx 24 keeps nx:run-commands" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 8 | packages/ngx-yeti/README.md | "Known issue, upstream bug A4 ... Chromium showed a single frame here too, in 1 of 20 production repeat runs" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 9 | packages/ngx-yeti/README.md | Error boundary behaviours (what a boundary catches and misses, `$reset()` frames, upstream bug A8) | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 10 | references/fast-compile.md | "Analog reports that fastCompile passes about 91% of Angular's conformance suite" and "10 to 35%" speed gains | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 11 | references/fast-compile.md | "`<yeti-nope />` ... passes test and fails typecheck with NG8001" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 12 | references/ci-local.md | Measured runs tables (times and pass counts, 2026-10-05 and 2026-10-06, Edge 154, Firefox 157) | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 13 | references/ci-local.md | "upstream-bugs.md O13 and O14 ... O15" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 14 | docs/benchmarks/fast-compile.md | Timing tables (compile time, critical path, typecheck per tsconfig) | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
| 15 | vendor/yeti/README.md | "Yeti is at 7.0.0-beta" | stale | NEEDS-USER | Vendored upstream file, never edited here; user decides whether to note the drift (accept-drift) or move the pin |
| 16 | vendor/yeti/README.md | "[stability page](docs/guides/stability.md)" and other `docs/guides/*` links | stale | NEEDS-USER | Vendored upstream file, never edited here; user decides whether to note the drift (accept-drift) or move the pin |
| 17 | .claude/skills/yeti-pin/SKILL.md | "a yeti-build cache hit can report [local cache] without writing vendor/yeti/dist" | unverifiable | NEEDS-USER | Cannot be checked from the repo in the sidecar; user decides accept-drift or a measured rerun with dependencies installed |
