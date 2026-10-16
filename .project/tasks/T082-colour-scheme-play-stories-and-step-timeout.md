---
id: T082
title: Cover the stories that set their colour scheme in play code in the static-build colour-scheme guard, and make the loop-budget gate require a per-visit step timeout
wave: 17
deps: [T075, T081]
status: pending
agent: null
base: null
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
