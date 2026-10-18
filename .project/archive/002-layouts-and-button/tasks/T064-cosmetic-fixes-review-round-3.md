---
id: T064
title: Start the itemStyled deadline after the load, name .js in the typed-scripts docs, clarify the icon align doc, and drop the duplicated e2e checks
wave: 11
deps: [T052, T053, T057]
status: done
agent: build_T064
base: 3ec57a6562acaf2dc706b32351aa126287336fb4
worktree: null
task_branch: null
files:
  - packages/ngx-yeti-testing/src/lib/story-helpers.ts
  - AGENTS.md
  - README.md
  - references/fast-compile.md
  - packages/ngx-yeti/icon/src/icon.ts
  - apps/yeti-app-e2e/src/support/standard-cases.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - apps/yeti-app-e2e/src/stack.spec.ts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
---

# T064 — Start the itemStyled deadline after the load, name .js in the typed-scripts docs, clarify the icon align doc, and drop the duplicated e2e checks

## Context

Sixth build repair (2026-10-14): the cosmetic survivors of review round 3 of M002 (range fb1a8c6..2cedb1b; the product files are unchanged at 58ee259, so every line number below is at 2cedb1b; triaged by Claude on 2026-10-14 in the git-ignored local record tmp/afk-m002/lars-review/r3/triage.md, group E items 16, 17, 21, and the `icon.ts` half of item 20, with the source reports g13-comments.md and g3-code-reviewer.md beside it and the advisory review tmp/afk-m002/wave8-10-thermos-quality.md). Items 18 and 19 of group E moved to T060, which owns the two skill files they change in this wave, and the `vitest.unit.config.mts` half of item 20 moved to T061 with item 7. No package behaviour changes in this task.

Triage item 16 (cosmetic): "story-helpers.ts:8-10 doc says `timeout` bounds only the computed-value wait; the load time eats it (g13-comments 1, minor). Fix: set the deadline after the load so the doc is true." g13-comments 1, verbatim: "File: packages/ngx-yeti-testing/src/lib/story-helpers.ts:8-10 (at 2cedb1b). Evidence (measured, read): the doc says '`timeout` bounds only the wait for the computed value', but the code sets `const deadline = performance.now() + timeout;` before `await itemStylesLoaded(item);`, so the time spent loading the file is subtracted from the budget. A slow load longer than `timeout` makes the first mismatching read throw at once. Failure: a reader raises `timeout` expecting extra room for the computed value only, or reads a timeout error as 'styles never applied' when the load was slow. ... Fix direction: either move the `deadline` line after `await itemStylesLoaded(item)` (makes the doc true), or reword". The triage chose the first.

Triage item 17 (cosmetic): "`.js` missing from the typed-scripts lines of AGENTS.md:259, README.md and references/fast-compile.md (g3-code-reviewer F2)." g3-code-reviewer F2, verbatim: "AGENTS.md:259 says '`tsconfig.scripts.json` includes every committed `.mjs` and `.cjs` script'. README.md's `typecheck` row says 'the committed `.mjs` and `.cjs` scripts', and references/fast-compile.md says the same. tsconfig.scripts.json `include` and the coverage test (`git ls-files -- '*.mjs' '*.cjs' '*.js'`) also cover `.js`, as T053's contract states: 'every committed `.mjs`, `.cjs`, and `.js` file'. No `.js` script is committed today, so nothing fails yet. Fix direction: add `.js` to the three doc lines". The lines today: AGENTS.md:259, README.md:60 (the `typecheck` row), references/fast-compile.md:24.

Triage item 20, the half in this task's files (cosmetic): "icon.ts:84 \"never aligns the text\" reads as broken (g13-comments 3)". g13-comments 3, verbatim: "File: packages/ngx-yeti/icon/src/icon.ts:84 ... the sentence was carried over in the T057 edit. Spec icon.md:36 and :114 say what it means: the directive removes the HTML `align` attribute a static `align=\"baseline\"` would leave, so HTML's presentational hint never changes the text alignment. Read alone, the sentence suggests the static form does not work. Fix direction: 'A static `align=\"baseline\"` leaves no HTML `align` attribute on the host, so the browser's presentational hint never aligns the text.'"

Triage item 21 (cosmetic): "Duplicated `afterLeave` bodies (center, stack e2e) and the repeated containment assertion in setup-serving.spec.ts (wave 8-10 thermos quality L1, L2)." Thermos quality L1, verbatim: "Files: `apps/yeti-app-e2e/src/support/standard-cases.ts:29-30, 53, 87`, `apps/yeti-app-e2e/src/stack.spec.ts:61-63`, `apps/yeti-app-e2e/src/center.spec.ts:95-97`. The restored check is right (the other item's link must leave too). Its form is an optional callback on the shared case builder whose only two uses are the same three lines, each calling a file-local `stackAndCenterLinks` that exists once per spec. What the two specs want to say is data: 'this route holds these links, in this order'. One option, `links?: readonly string[]` defaulting to `[item]`, lets the builder poll for `[]` after leaving and for `links` after returning. ... deletes both `afterLeave` closures ... How to show it: read only. `rg -n \"afterLeave\" apps/yeti-app-e2e/src` lists the two bodies, identical to the character." Thermos quality L2, verbatim: "File: `apps/yeti-app-e2e/src/setup-serving.spec.ts:62-65, 86-88`. `toEqual(['card', 'lift'])` used to add 'and no other link'. As `expect.arrayContaining(['card', 'lift'])` at lines 62-64 it asserts that both links exist, and line 65, `expectItemSheetsApplied(page, ['card', 'lift'])`, already expects exactly one link per named item before it waits for the sheets (`packages/ngx-yeti-testing/src/playwright.ts:101-105`, read). Lines 62-64 can go. The second site (86-88) has no such line after it and stays". INTENT E9 holds: item-link assertions use containment, not exact arrays (LESSONS.md).

## Approach

- `packages/ngx-yeti-testing/src/lib/story-helpers.ts`: compute `itemStyled`'s deadline after `itemStylesLoaded(item)` resolves, so its doc ("`timeout` bounds only the wait for the computed value") is true; no other behaviour changes.
- `AGENTS.md`, `README.md`, and `references/fast-compile.md`: the typed-scripts lines name `.mjs`, `.cjs`, and `.js`, as `tsconfig.scripts.json` and its coverage test do.
- `packages/ngx-yeti/icon/src/icon.ts`: the last sentence of the `align` doc says that a static `align="baseline"` leaves no HTML `align` attribute on the host, so the browser's presentational hint never aligns the text. Doc only; the sentence ships in the published `.d.ts`, so use consumer words.
- `apps/yeti-app-e2e`: the "other item's link leaves too" check of the stack and center routes is written once (a `links` list on the shared case builder in `apps/yeti-app-e2e/src/support/standard-cases.ts`, or one shared helper; the coder picks), and both specs still fail when the other item's link outlives the route. In `apps/yeti-app-e2e/src/setup-serving.spec.ts`, drop the containment assertion that `expectItemSheetsApplied` already covers (the dev-server test); keep the strict-CSP route's one. No other route changes its checks.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `itemStyled` starts its timeout after the item's file has loaded.
2. The typed-scripts lines of `AGENTS.md`, `README.md`, and `references/fast-compile.md` name `.js` with `.mjs` and `.cjs`.
3. The `align` doc of `icon.ts` says the static form leaves no HTML `align` attribute, so the presentational hint never aligns the text.
4. The stack and center specs share one body for the other-link check, which still fails when that link stays; the setup-serving dev-server test has no assertion that its next line repeats.
5. Lint and typecheck of `ngx-yeti`, `ngx-yeti-testing`, and `yeti-app-e2e`, the `ngx-yeti-testing` tests, and the yeti-app-e2e center, stack, and setup-serving specs pass, and `npx prettier --check` passes on the task's files.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -U "await itemStylesLoaded\(item\);[\s\S]*performance\.now\(\) \+ timeout" packages/ngx-yeti-testing/src/lib/story-helpers.ts && ! rg -q "mjs. and ..cjs. script" AGENTS.md README.md references/fast-compile.md && ! rg -q -F "never aligns the text" packages/ngx-yeti/icon/src/icon.ts && test "$(rg -c -F "afterLeave: async" apps/yeti-app-e2e/src/center.spec.ts apps/yeti-app-e2e/src/stack.spec.ts | wc -l)" -lt 2 && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-testing yeti-app-e2e && npm exec nx -- test ngx-yeti-testing --skip-nx-cache && npm exec nx -- e2e yeti-app-e2e -- center.spec.ts stack.spec.ts setup-serving.spec.ts && npx prettier --check packages/ngx-yeti-testing/src/lib/story-helpers.ts AGENTS.md README.md references/fast-compile.md packages/ngx-yeti/icon/src/icon.ts apps/yeti-app-e2e/src; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 6), from tmp/afk-m002/lars-review/r3/triage.md group E items 16, 17, 21, and the icon half of item 20; items 18 and 19 moved to T060 and the Vitest half of item 20 to T061 for single file owners.
- 2026-10-15 — build_T064: itemStyled deadline now set after itemStylesLoaded; `.js` added to the typed-scripts lines of AGENTS.md, README.md (prettier reflowed the table columns), references/fast-compile.md; icon.ts align doc reworded ("cannot align the text", since Verify forbids the old phrase); standard-cases.ts gets `links?: readonly string[]` (default `[item]`, filtered from itemLinks, checked on enter, leave, return) replacing `afterLeave`; stack and center pass `links: [stack, center]`, center keeps its afterReturn for expectCentred; setup-serving dev-server test drops the arrayContaining assertion. Verify (exact command, via heavy lock): exit 0; nx e2e 50 passed (chromium); lint/typecheck/test ngx-yeti-testing green; prettier clean. Rule 13: `prettier --check .` clean; `nx affected -t lint typecheck test --base=HEAD` green (7 projects, 19 tasks); `nx affected -t test-storybook` green (2 tasks). Did not mutation-test that the stack/center specs fail when the other link stays (inferred from the shared filter over both names).
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T064): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
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
  ```
