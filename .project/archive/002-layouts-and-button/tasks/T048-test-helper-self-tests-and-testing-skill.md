---
id: T048
title: Prove the html and Playwright test helpers can fail, and bring the testing skill up to date
wave: 4
deps: [T024, T049]
status: done
agent: build_T048
base: 348447a4369a24fcb0a4e0ca16332b7cab33c71f
worktree: null
task_branch: null
files:
  - packages/ngx-yeti-testing/src/lib/html.spec.ts
  - apps/yeti-app-e2e/src/playwright-helpers.spec.ts
  - .claude/skills/ngx-yeti-testing/SKILL.md
---

# T048 — Prove the html and Playwright test helpers can fail, and bring the testing skill up to date

## Context

Third build repair, review round 1 of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12). The triage and reviewer files are git-ignored local records, so every finding is inlined. Line numbers are at 1747fe0; T041 and T024 edit `.claude/skills/ngx-yeti-testing/SKILL.md` before this task (T041 the NVDA lane line, T024 the Tailwind configurations), so its lines will have moved.

Findings, verbatim:

- Minor (g2 test analyzer): "packages/ngx-yeti-testing/src/lib/html.ts:77. html.spec.ts never exercises the path where `attributeValue` throws, for example on `<td>` outside a table or a tag after leading text. That throw is what stops every layer-3 `toBeNull()` absence check from passing on a mis-sliced tag." Code: `if (parsed === undefined) { throw new Error(`Not an opening tag the HTML parser keeps: ${tag}`); }`.
- Minor (g2 test analyzer): "packages/ngx-yeti-testing/src/playwright.ts:68 and :97. `expectItemSheetsApplied` and `horizontalOverflow` have no self-test that shows they can fail, unlike `item-links.browser.spec.ts` for the browser helpers. `horizontalOverflow` is the only oracle for every 1.4.10 reflow assertion."
- Triage item 17, cosmetic (g4 code reviewer): "a new shared e2e helper is missing from the testing skill's helper table ... .claude/skills/ngx-yeti-testing/SKILL.md:80-87 (the `support/` helper table) ... apps/yeti-app-e2e/src/support/style-probe.ts:151 adds `export async function recordPaintedAttributes(`, used by 7 specs (stack, columns, sidebar, cluster, layer, grid, static-attributes). The table lists `recordFrames`, `recordStyleMutations`, `recordHostAttributes`, `itemLinks`, `delayCss`, `recordItemRequests`, `expectStyledFrames`, `firstPaintFramesRecordedAs` and `productionFramesRecordedAs`, but not this one."
- Triage item 17, cosmetic (g4 code reviewer): ".claude/skills/ngx-yeti-testing/SKILL.md:131 ... ci.yml runs 'as parallel jobs: `static`, `package`, `unit`, and an `e2e` matrix'. The same diff adds the `voiceover` and `nvda` jobs to ci.yml, beside the existing `safari` job. The Gates paragraph's list of ci.yml jobs leaves out three jobs, two of them added in this range."
- Cosmetic (g3 code reviewer, full): ".claude/skills/ngx-yeti-testing/SKILL.md:68 says the `axeViolations` fixture 'in Firefox with JavaScript off ... skips the test'. apps/yeti-app-e2e/src/support/fixtures.ts:64-68 runs `axeViolationsOfSnapshot` there instead."

## Approach

- `html.spec.ts`: cases where `attributeValue` throws, at least a `<td>` tag passed alone (the parser drops it outside a table) and a tag after leading text, each asserting the error message names the tag.
- `apps/yeti-app-e2e/src/playwright-helpers.spec.ts`: self-tests of `horizontalOverflow` and `expectItemSheetsApplied` from `@ngx-yeti/testing/playwright`, on pages the test builds itself (`page.setContent`, routes it fulfils), not on a Fixture route. `horizontalOverflow` returns a positive number for content wider than a 320 px viewport and 0 for content that fits. `expectItemSheetsApplied` passes when each named item has one link with a sheet holding a rule, and rejects when an item's link is missing and when its sheet has no rules (use a short timeout so the rejecting cases stay fast). Use the helpers as exported; do not copy them. This spec runs in every engine and configuration of the `e2e` job like the other yeti-app-e2e specs, so keep it independent of the Fixture build configuration.
- Testing skill: add `recordPaintedAttributes` to the `support/` helper table with what it records and when a spec uses it (read `apps/yeti-app-e2e/src/support/style-probe.ts`), list every `ci.yml` job in the Gates paragraph as the workflow has them at this task's base, and correct the `axeViolations` row to what `fixtures.ts` does in Firefox with JavaScript off. Keep T041's NVDA lane wording and T024's Tailwind rows as they land.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Playwright helpers (T036): the entry `@ngx-yeti/testing/playwright` (`packages/ngx-yeti-testing/src/playwright.ts`, mapped in tsconfig.base.json) is for the two e2e apps and exports `interface Box { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number; readonly width: number; readonly height: number }`; `rect(locator: Locator): Promise<Box>`; `childRects(parent: Locator): Promise<Box[]>`, the boxes of the element's children in DOM order; `usedLength(scope: Locator, length: string, axis?: 'inline' | 'block'): Promise<number>`, the used px size of a CSS length such as `var(--yeti-width-md)`, read from a probe appended to `scope`, on the inline axis unless `axis` says otherwise; `horizontalOverflow(page: Page): Promise<number>`, how far the document is wider than the viewport; `resize(element: Locator, width: number): Promise<void>`, which sets the element's inline size in px and throws when it is not an HTMLElement; and `expectItemSheetsApplied(page: Page, items: readonly string[]): Promise<void>`, which expects one item link per named item in the head and waits until each has a stylesheet with at least one rule. No e2e spec declares a copy of these, and no other helper checks that an item sheet has loaded.

## Intent coverage

- None

## Acceptance criteria

1. `packages/ngx-yeti-testing/src/lib/html.spec.ts` has cases for both throw paths of `attributeValue`, and `npm exec nx -- test ngx-yeti-testing` passes.
2. `apps/yeti-app-e2e/src/playwright-helpers.spec.ts` shows `horizontalOverflow` positive and zero, and `expectItemSheetsApplied` passing and rejecting for a missing link and an empty sheet, in Chromium locally and in the Firefox and WebKit containers.
3. The testing skill's helper table lists `recordPaintedAttributes`, its Gates paragraph lists every `ci.yml` job, and its `axeViolations` row matches `fixtures.ts`.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at each task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/playwright-helpers.spec.ts && rg -q -F "recordPaintedAttributes" .claude/skills/ngx-yeti-testing/SKILL.md && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-testing yeti-app-e2e && npm exec nx -- test ngx-yeti-testing && npm exec nx -- e2e yeti-app-e2e -- playwright-helpers.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox playwright-helpers.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit playwright-helpers.spec.ts && npx prettier --check .claude/skills/ngx-yeti-testing; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes; the g2 helper self-test minors, triage item 17's two testing-skill lines, and the g3 full re-run's testing-skill cosmetic). At 1747fe0 the self-test file does not exist and the skill does not name `recordPaintedAttributes`, so the Verify fails if this task is skipped. deps: T024 (file overlap, `.claude/skills/ngx-yeti-testing/SKILL.md`; T024 already follows T041, which edits the same file). The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — planner (build repair #3, the user's ruling to rename the package stylesheet, T049): deps gains T049 for file overlap (.claude/skills/ngx-yeti-testing/SKILL.md). Nothing else changes.
- 2026-10-13 — coder (build_T048): html.spec.ts gains two `attributeValue` throw cases (`<td data-x="1">` alone, which parse5 drops outside a table, and `x<a data-x="1">` after leading text), each asserting the full error message with the tag. New apps/yeti-app-e2e/src/playwright-helpers.spec.ts (5 tests): `horizontalOverflow` on `page.setContent` at 320 x 640 is > 0 for a 500 px div and 0 for a 100 px one; `expectItemSheetsApplied` runs on a page served from a fulfilled route (`http://playwright-helpers.test/`, page plus `/item.css`), resolves for a sheet with a rule, rejects with `toHaveCount` when a named item has no link, and with `item sheets loaded with rules` for an empty sheet. The helper takes no timeout, so each rejecting case waits the default 5 s expect timeout (the only way shorter would be changing the helper, outside `files`). Testing skill: `recordPaintedAttributes` row added to the support helper table; Gates lists every ci.yml job (static, package, unit, e2e matrix, safari, voiceover, nvda); the `axeViolations` row now says Firefox with JavaScript off runs axe on a script-free snapshot (`axeViolationsOfSnapshot`). T041's NVDA and T024's Tailwind text unchanged.
- 2026-10-13 — coder (build_T048): Verify run exactly as written through heavy-lock: exit 0. Counts: ngx-yeti-testing tests 85 passed (7 files); playwright-helpers.spec.ts 5 passed in local Chromium, 5 passed in the ci e2e firefox/development container, 5 passed in the ci e2e webkit/development container; prettier check of the skill folder clean. Rule-13 gate: `npx prettier --check .` clean, and `nx affected -t lint typecheck test test-storybook --base=HEAD` passed for 7 projects (test files/tests: 7/85, 81/645, 24/153), exit 0.
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T048): pass, exit 0; output tail:
  ```
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
  [ci-e2e-firefox-development] [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  [ci-e2e-webkit-development] [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
