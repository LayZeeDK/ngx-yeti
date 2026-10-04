---
id: T014
title: Document the setup in the package README, cite the usage rules in JSDoc, and apply docs-audit rulings 2 and 3
wave: 3
deps: [T002, T003]
status: done
agent: build_T014
base: c560d1670f278937879715aba770fb72caa67919
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/styles/src/provide-yeti-styles.ts
  - packages/ngx-yeti/styles/src/inject-yeti-item-styles.ts
  - README.md
  - references/fast-compile.md
  - AGENTS.md
---

# T014 — Document the setup in the package README, cite the usage rules in JSDoc, and apply docs-audit rulings 2 and 3

## Context

INTENT.md SC7 requires `npm run check` to pass, docs-audit rulings 1 to 5 to be applied (1, 4, and 5 land with the placeholder task, which edits those files), and the package README to document the setup spec's parts A to E, usage rules 1 to 11, and the `@boundary` section (setup.md:137-187, :214-226, :276-285), with `provideYetiStyles` and `injectYetiItemStyles` JSDoc citing the rule numbers; the `provideYetiFragmentLinks()` line waits for M003, when that API exists (INTENT.md Scope: in). The package README today says no item is implemented and calls the setup "planned"; the root README says the same, and its workspace table misses `apps/yeti-analog-e2e` (ruling 3). `references/fast-compile.md` claims every project with TypeScript declares `typecheck-watch`, the e2e projects included, while only the served projects do (ruling 2). The charter's Commits constraint ("Accept Path subjects, keep bisect-safe (recommended)") asks that AGENTS.md "Commits" say pipeline commits use GSD Path's subjects and every task commit is bisect-safe.

## Approach

- `packages/ngx-yeti/README.md`: replace "Planned setup" with the real setup, in setup.md's order: A (Yeti at the pin, in an Nx workspace and outside one; the version format and exact installs), B (the `assets` entry), C (the global stylesheet with the layer statement, the 16 imports, and the package stylesheet last; the Tailwind v4 forms C2 and C1 with C1's measured losses), D (`provideClientHydration(withI18nSupport())` and `provideYetiStyles({ url, preload })`; no fragment-links line yet), E (the package at an exact version, Angular peers, no `yeti-css` dependency); the numbered usage rules 1 to 11; and the consumer `@boundary` and `@error` section of setup.md section 11, including that the boundary belongs inside a `@defer`. Update the status note: setup, card, and lift are implemented, nothing is published. Use the package's real import specifiers; no placeholder class names (the placeholder task's check greps for the removed class names).
- JSDoc in `packages/ngx-yeti/styles/src/provide-yeti-styles.ts` and `packages/ngx-yeti/styles/src/inject-yeti-item-styles.ts`: cite by number the setup usage rules each function serves (for example rules 5, 8, and 10 for `provideYetiStyles`; rules 3 and 7 for `injectYetiItemStyles`), with no behaviour change.
- `README.md` (root): add the `apps/yeti-analog-e2e` row to the workspace table (ruling 3) and replace "no item is implemented yet" with what this milestone ships.
- `references/fast-compile.md` (ruling 2): say that only the served projects (`ngx-yeti`, `yeti-app`, `yeti-analog`) declare `typecheck-watch`, and keep the rest of the paragraph.
- `AGENTS.md` "Commits": pipeline commits use GSD Path's subjects (`T###: <title>`, `plan:`, `roadmap:`, `build:`, `ship:`, `integrate:`); Conventional Commits govern work outside the pipeline; every task commit stays bisect-safe (`npx prettier --check .` and `nx run-many -t lint typecheck test` for the projects it touches). Edit only that section.
- Re-run the docs-audit claim checks of remediation rows 2 and 3 (`.project/research/DOCS-AUDIT.md`) and log the results. Never edit `docs/specs/`. Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- ngx-yeti/styles exports `injectYetiItemStyles(item: YetiComponentName): void`, called in an injection context as the last statement of an item root directive's constructor, and `provideYetiStyles(config?: YetiStylesConfig): EnvironmentProviders`, with `interface YetiStylesConfig { readonly url?: string; readonly preload?: readonly YetiComponentName[] }`, called at most once in the root providers; the loader service, the rank table, and the pin constant are not exported.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- The package accessibility stylesheet is the source file packages/ngx-yeti/accessibility.css, every rule inside `@layer ngx-yeti` (empty in M001); ng-packagr copies it to the root of the built package, whose package.json `exports` maps `"./accessibility.css"` to it; a consumer imports it with `@import 'ngx-yeti/accessibility.css';` as the last line of the global stylesheet.

## Intent coverage

- SC7

## Acceptance criteria

1. `packages/ngx-yeti/README.md` documents setup.md's parts A to E, usage rules 1 to 11 by number, and the `@boundary` section, matches the shipped API and specifiers, and no longer calls the setup planned.
2. The JSDoc of `provideYetiStyles` and `injectYetiItemStyles` cites the setup usage-rule numbers each serves.
3. Docs-audit rulings 2 and 3 are applied (the `typecheck-watch` sentence names only the served projects; the root README lists `apps/yeti-analog-e2e`), the root README's status line is current, and the task Log records the re-run claim checks.
4. AGENTS.md "Commits" states GSD Path subjects for pipeline commits and the bisect-safe rule.
5. `npm run check` passes at the task commit, and so does `npx prettier --check .`.

## Verify

```bash
npm ci --no-audit --no-fund && rg -q 'apps/yeti-analog-e2e' README.md && ! rg -q 'the e2e projects included' references/fast-compile.md && rg -q -F 'T###' AGENTS.md && rg -q -F '@boundary' packages/ngx-yeti/README.md && rg -q withI18nSupport packages/ngx-yeti/README.md && rg -q -i 'usage rule' packages/ngx-yeti/styles/src/provide-yeti-styles.ts && rg -q -i 'usage rule' packages/ngx-yeti/styles/src/inject-yeti-item-styles.ts && npx prettier --check . && npm run check
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
- 2026-10-04 — coder: packages/ngx-yeti/README.md rewritten: status note (setup, card, lift implemented; nothing published), entry-point table (ngx-yeti, ngx-yeti/styles, ngx-yeti/card, ngx-yeti/lift, ngx-yeti/accessibility.css), setup parts A to E in setup.md order (version format, Nx and non-Nx Yeti builds, assets entry, global stylesheet with layer statement + 16 imports + accessibility.css last, Tailwind C2 led and C1 with its two measured losses, provideClientHydration(withI18nSupport()) and provideYetiStyles({ url, preload }) with no fragment-links line, exact-version install with no yeti-css dependency), usage rules 1 to 11, and the @boundary/@error section with the boundary inside @defer. provide-yeti-styles.ts JSDoc already cited rules 1-11 (unchanged); inject-yeti-item-styles.ts JSDoc now also cites rule 3 (comment only). README.md: apps/yeti-analog-e2e row, status line updated. references/fast-compile.md: only ngx-yeti, yeti-app, yeti-analog declare typecheck-watch. AGENTS.md Commits: GSD Path subjects for pipeline commits, Conventional Commits for others, bisect-safe rule for task commits.
- 2026-10-04 — docs-audit claim re-checks: row 2 — rg over project.json finds typecheck-watch only in packages/ngx-yeti, apps/yeti-app, apps/yeti-analog, matching the new sentence; row 3 — ls apps lists ngx-yeti-e2e, yeti-analog, yeti-analog-e2e, yeti-app, yeti-app-e2e, all now in the README table. Banned-word rg over edited files: 0 hits.
- 2026-10-04 — Verify (full command, in worktree): exit 0 (npm ci, rg checks, npx prettier --check ., npm run check). Extra: npx nx run-many -t lint typecheck test test-storybook --skip-nx-cache: exit 0.
- 2026-10-04 — orchestrator Verify (isolate gsd-path-task/T014): pass, exit 0; output tail:
  ```
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  ```
