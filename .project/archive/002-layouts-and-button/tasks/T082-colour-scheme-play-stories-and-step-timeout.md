---
id: T082
title: Cover the stories that set their colour scheme in play code in the static-build colour-scheme guard, and make the loop-budget gate require a per-visit step timeout
wave: 17
deps: [T075, T081]
status: done
agent: build_t082
base: b299706a9fde275a6ad0e7e45cc31c2389ef3e34
worktree: null
task_branch: null
files:
  - apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts
  - tools/playwright/navigation-budget.test.mjs
---

# T082 — Cover the stories that set their colour scheme in play code in the static-build colour-scheme guard, and make the loop-budget gate require a per-visit step timeout

## Context

Final-review patch, ship attempt 2, finding P005 of `.project/review/PATCH-FINDINGS.md` (reviewed HEAD d63e7e0, source `.project/review/final-gap-6.md`, locator "Risk: the new guards miss cases they exist for: apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts does not cover stories that set the colour scheme in play code (table, card), and navigation-budget.test.mjs still passes when a per-visit timeout is dropped"), fixed in M002 under Lars's ruling of 2026-10-16, verbatim: "Approve, resolve in M002".

Evidence, verbatim: "Blocked on the colour-scheme half. T075's written coverage rule says the list covers every story whose source sets an inline `color-scheme` directly, and the source test fails when such a file is unlisted. card.stories.ts, table.stories.ts and scroller.stories.ts set `style.colorScheme` inline in play code. The discovery regex (`color-scheme:|withColorScheme\(`) does not match them, so the coverage test passes with them unlisted (measured). Their dark-scheme assertions never run against the static build: e2e suppresses play, and no e2e spec checks their dark scheme (measured). A static-build-only lowering that touches only their CSS would therefore go unseen (inferred; today's global `build.cssTarget` fix also covers them, and the 16 listed stories would catch a global regression). The per-visit half passes against the written contract: T071 defines the check as exempting a loop when `test.setTimeout` scales with the list's length, and the mutant without the step timeout keeps that scaling, so the check passing it matches its contract (measured). Warning: T071 AC1's per-visit `test.step` timeout is now held only by review. Nothing in the repository fails if it is dropped."

Fix direction, verbatim: "Smallest change, in apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts only. (1) Widen the discovery regex to also match `\.colorScheme\s*=`, so the coverage test fails red on card, table and scroller first; record that failing run. (2) Add a static-build check for those stories, one test per story and page scheme. Each test opens the story with openStory and sets `style.colorScheme` on the play code's element (`[data-testid="frame"]` for card and table, the scroller's surface) through `locator.evaluate`, for `light` and then `dark`. It then asserts the same dark-surface and dark-text luminance split as the wrapper tests on the computed colours of the elements the play function measures. Then add the ids to the list, or to a second list read by the same coverage test. Check: the coverage test fails before step 2 and passes after it, and `nx run ngx-yeti-e2e:e2e -- --project=chromium color-scheme-wrappers` passes on a build with `build.cssTarget`. Optional, not required by the written T071 contract: have navigation-budget.test.mjs also require a `timeout` option on a `test.step` that wraps the navigation in a scaled loop, with an inline case that fails without it."

The orchestrator's brief for this patch names the per-visit timeout check as part of P005, so the optional half is in scope. Measured by the gap reviewer at d63e7e0 (final-gap-6.md): the play-code sites are card.stories.ts:183 (`frame.style.colorScheme = scheme`), table.stories.ts:117 (the same) and scroller.stories.ts:195 (`surface.style.colorScheme = scheme`); card's and table's play functions measure text contrast on the card or frame surface, and scroller's measures the focus ring's `outlineColor` against `surface`'s background. With `{ timeout: perVisit },` removed from apps/yeti-app-e2e/src/fixture-app.spec.ts:236 the gate passes 5 of 5; with `test.setTimeout(keys.length * perVisit);` removed instead it fails, naming fixture-app.spec.ts:220.

T081 lands first and edits navigation-budget.test.mjs; find each site by its code, not its line.

## Approach

- color-scheme-wrappers.spec.ts: the discovery regex also matches `\.colorScheme\s*=`, so the coverage test names card, table and scroller until they are covered; record that red run. Then one static-build test per story and page scheme for a story of each of those files, through `openStory`, setting `style.colorScheme` on the element the play code sets it on (through `locator.evaluate`), for `light` and then `dark`, and asserting the wrapper tests' dark-surface and dark-text split on the computed colours of the elements the play function measures. For scroller, whose play function measures a focus ring, the coder states in the Log which computed colours carry the split and why. The coverage test reads the new ids from the same list or a second list.
- Stories stay unchanged; the static build stays as T075 left it (`build.cssTarget` from `.browserslistrc`).
- navigation-budget.test.mjs: a loop that the scaled `test.setTimeout` exempts still fails the check when a navigation inside it sits in a `test.step` without a `timeout` option. An inline case fails without the option and passes with it. The repository scan still passes on apps/yeti-app-e2e/src/fixture-app.spec.ts as it is, and fails with `{ timeout: perVisit },` removed from it (a mutant run, restored after, recorded in the Log). The check stays syntax-tree only, as its header comment says.
- E2e runs go through the repository's container jobs (`references/ci-local.md`), in Chromium, Firefox and WebKit as T075's did, filtered to this spec.
- Read `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md` and `.claude/skills/type-safety/SKILL.md` first. Typed scripts: navigation-budget.test.mjs keeps `// @ts-check` and its JSDoc types.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. The coverage test's discovery matches `\.colorScheme\s*=`, and the Log records its red run naming card.stories.ts, table.stories.ts and scroller.stories.ts before the new tests were listed.
2. For a story of each of card, table and scroller, a static-build test per page scheme sets the play code's element to `light` and then `dark` and asserts the dark-surface and dark-text split on the measured elements' computed colours; it passes in Chromium, Firefox and WebKit through `node tools/ci-local/run-job.mjs ci e2e`.
3. navigation-budget.test.mjs flags a navigation inside a scaled loop whose `test.step` has no `timeout` option (an inline case proves it), passes the repository as it is, and the Log records the mutant run of fixture-app.spec.ts without `{ timeout: perVisit },` failing it.
4. `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes, lint and typecheck of ngx-yeti-e2e pass, and `npx prettier --check` passes on the two files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && rg -q -F '\.colorScheme' apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts && rg -q 'card--|table--|scroller--' apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts && node --test tools/playwright/navigation-budget.test.mjs && npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-e2e && node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=chromium color-scheme-wrappers && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=firefox color-scheme-wrappers && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=webkit color-scheme-wrappers && npx prettier --check apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts tools/playwright/navigation-budget.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
- 2026-10-17 — build_t082: implementation. color-scheme-wrappers.spec.ts: discovery regex widened to `color-scheme:|withColorScheme\(|\.colorScheme\s*=`; a second list `playSchemeStories` (card--default, table--default, scroller--keyboard) that the coverage test reads beside `wrapperStories`; one test per story and page scheme that opens the story with openStory, sets `style.colorScheme` to `light` then `dark` on the play code's element through `locator.evaluate`, and asserts surface luminance < 0.18 only for dark and text luminance < 0.18 only for light. Measured elements: card = `article` background, texts `article h3 a` and `article > p` (the play function's link and summary on the card); table = the frame's background, texts `thead th`, `tbody td`, `caption` (the play function's header, body cell and caption; the frame is the opaque layer its backdrop() composites to). Scroller: the split is carried by the surface's background (the one colour the play function measures besides the ring) and the surface's and the scroller items' text colour; the focus ring's `outlineColor` is not used because it shows only under keyboard focus and is a focus hue, not a scheme text colour, so a luminance split on it is not a property Yeti promises. Passing on both page schemes with both inline schemes shows the inline scheme, not the page, decides the colours. Stories and the static build unchanged.
- 2026-10-17 — build_t082: red run (regex widened, list not yet extended): `npx nx run ngx-yeti-e2e:e2e -- --project=chromium color-scheme-wrappers -g "list a story"` failed 1 of 1, unlisted files received: ./card/src/card.stories.ts, ./scroller/src/scroller.stories.ts, ./table/src/table.stories.ts. After the change, chromium native: 39 passed.
- 2026-10-17 — build_t082: navigation-budget.test.mjs: a loop exempted by a scaled `test.setTimeout` still fails when a navigation in it sits outside a `test.step` whose options object has `timeout` (new isTimedStep, navigatesOutsideTimedStep; fix message names the step timeout). New inline case "flags a scaled loop whose visits have no step timeout of their own" (step without options, and a scaled loop with no step) was red first (actual lines [] vs expected [2, 14]), green after: 9 of 9. Mutant: `{ timeout: perVisit },` deleted from apps/yeti-app-e2e/src/fixture-app.spec.ts → repository scan failed, naming apps/yeti-app-e2e/src/fixture-app.spec.ts:220 (8 pass, 1 fail); file restored from a copy, git status shows it unchanged.
- 2026-10-17 — build_t082: Verify ran exactly as written through the heavy lock (HEAVY_DOCKER=1): exit 0. navigation-budget 9/9; @ngx-yeti/source:test --skip-nx-cache passed (node --test 106/106); lint+typecheck ngx-yeti-e2e passed; run-job ci e2e color-scheme-wrappers chromium 39 passed, firefox 39 passed, webkit 39 passed; prettier --check on both files clean; daemon stopped.
- 2026-10-17 — build_t082: rule 13: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` passed, 25 tasks over 9 projects (vitest 94, 705, 170, 1, 1 passed; node --test 106 passed; test-storybook passed). Git index untouched.
- 2026-10-17 — build_t082: review fixes (review-T082.md). (1) The coverage test is now one test per setter kind: files matching `color-scheme:|withColorScheme\(` need an id in `wrapperStories`, files matching `\.colorScheme\s*=` need one in `playSchemeStories`. Red first with button--toggle absent (chromium, `-g "list a story"`): "by wrapper" passed, "by play code" failed, naming ./button/src/button.stories.ts as unlisted. Then button--toggle was added: the surface is `[data-testid="surface"]`, the texts are the surface and the resting toggles `[data-pair] [aria-pressed="false"]`. A pressed toggle's text sits on its own emphasis fill: light text in the light scheme, measured as oklch(0.99 0 0) on a pressed fill. So that text is not a scheme-surface text and is left out. The first run also read a mid-transition colour, oklab(0.61 0 0). The setter now finishes `document.getAnimations()` after setting the scheme, as the story's own settledStyle does. Result: 42 passed in chromium natively. (2) isTimedStep rejects a `timeout` whose initializer is the literal `0`, `null` or `undefined`; a variable, an expression or the shorthand form is still accepted. The new inline case "flags a scaled loop whose step timeout sets no limit" (0, undefined, null, perVisit) failed first: actual lines [] where [2, 11, 20] was expected. It passes now: 10 of 10.
- 2026-10-17 — build_t082: the Verify re-ran exactly as written through the heavy lock (HEAVY_DOCKER=1, 14228 MB free at start): exit 0. Results: navigation-budget 10/10; @ngx-yeti/source:test --skip-nx-cache passed, with node --test 107/107; lint and typecheck of ngx-yeti-e2e passed; run-job ci e2e color-scheme-wrappers passed 42 of 42 in chromium, 42 in firefox and 42 in webkit; prettier --check on both files was clean; the daemon was stopped. `npx prettier --check .` was clean. The Git index is untouched.
- 2026-10-16 — orchestrator Verify (isolate gsd-path-task/T082): pass, exit 0; output tail:
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
