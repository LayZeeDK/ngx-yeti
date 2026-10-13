---
id: T057
title: Make the review round 2 tests able to fail and correct their comments
wave: 9
deps: [T053]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/table/src/table.spec.ts
  - packages/ngx-yeti/table/src/table.stories.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.ts
  - packages/ngx-yeti-testing/src/playwright.ts
  - packages/ngx-yeti/button/src/button.stories.ts
  - packages/ngx-yeti/button/src/button.spec.ts
  - packages/ngx-yeti/button/src/button.ssr.spec.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/card/src/card.ssr.spec.ts
  - packages/ngx-yeti/container/src/container.stories.ts
  - packages/ngx-yeti/enter/src/enter.spec.ts
  - packages/ngx-yeti/icon/src/icon.spec.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/icon.spec.ts
  - apps/yeti-app-e2e/src/table.spec.ts
  - apps/yeti-app-e2e/eslint.config.mjs
---

# T057 — Make the review round 2 tests able to fail and correct their comments

## Context

Fifth build repair (2026-10-13): survivors of review round 2 of M002 (range 4504b4c..7793730, which the history rewrite of 2026-10-13 maps to 0172a0a..fb1a8c6 with the same contents for these files; line numbers at 7793730; triaged by Claude on 2026-10-13 in the git-ignored local record tmp/afk-m002/lars-review/r2/triage.md, items 10 to 14 and the enter.spec.ts site of item 7, from the source reports g2-test-analyzer.md, g2-comments.md, and g3-code-reviewer.md beside it). Every finding is inlined; T052 landed after the review, so find each site by its quoted code (each was confirmed present at c5a8a32 by the planner). The comment rule the reviewers applied, verbatim from their brief: "keep only what the code cannot say and what stays true as long as the code does; no history, measurements, dates, or planning ids (T###, SC#, E#)".

Triage item 10 (minor, g2-test-analyzer F1): "`packages/ngx-yeti/table/src/table.spec.ts:412-442`, the guard at `:426-428`. Record: table.md:376, '`table--hover`: `hover` on a table; the play function hovers a body row and asserts its background changed and its text still meets 4.5:1 against the new background, in both schemes.' Evidence: the guard is `const surface = getComputedStyle(frame).backgroundColor; await expect.poll(() => getComputedStyle(hovered).backgroundColor).not.toBe(surface);` `hovered` is the `tr`. At rest its background is `rgba(0, 0, 0, 0)`, and `surface` is the frame's opaque `--yeti-color-surface`, so the two strings differ before any hover. Yeti's rule is `.table[data-hover] > tbody > tr:hover { background-color: var(--yeti-color-surface-sunken); }` (`node_modules/yeti-css/dist/css/components/table/table.css:45`). When the tint is absent, `composite(transparent, surface)` is the surface, and the text's ratio against the page surface passes 4.5:1. Claimed failure: the test stays green when the row is not hovered or not tinted in a scheme. The sibling test at `:386-408` proves the tint only in the default scheme ... Fix direction: per scheme, read the row's resting background with the pointer on `away`, hover, and poll for `not.toBe(resting)` before computing the ratio."

Triage item 11 (minor, g2-test-analyzer F2): "story-helpers.browser.spec.ts has self-tests for itemStyled only; assertWithin and usedLength carry every story's geometry assertion: add inside/outside/NaN and token cases." Source evidence, verbatim: "Record: ngx-yeti-stories SKILL.md:92, '`assertWithin(actual, expected, tolerance?)` throws unless the numbers are within `tolerance` (1). It throws, so inside `waitFor` it retries.'; the helper's own contract at story-helpers.ts:76-79, 'Throws ... when they differ by more than `tolerance` (1 unless given), or when either is not a number.' ... Claimed failure: a later edit that turns `!(Math.abs(a - e) <= t)` into `Math.abs(a - e) > t` makes every geometry assertion pass on `NaN` (a missing element's rect, a `parseFloat('auto')`), with no red test anywhere. Fix direction: add `assertWithin` (inside, outside, `NaN`), `usedLength` (inline and block against a token and a literal), `storyStates.get` (throw), and `createDirectiveHost` (throw path) cases beside the `itemStyled` ones." The triage's fix covers `assertWithin` and `usedLength`; `storyStates.get` may join them in the same spec; `createDirectiveHost` lives in `packages/ngx-yeti-testing/src/test-bed.ts`, which has no spec file and is out of this task's files.

Triage item 12 (minor, g2-comments 1 to 7), each verbatim from the source:

1. `packages/ngx-yeti/button/src/button.stories.ts:111-112`, "A flex item's `display` computes to `flex` whatever the file says, so this reads the centring." Evidence: "Yeti's button file sets `display: inline-flex` (`vendor/yeti/dist/css/components/button/button.css:7`). A `button` with no button file is `inline-block`, which a flex container turns into `block`, not `flex`. ... `buttonStyled` is called on elements that are not flex items ... there `display` computes to `inline-flex`." Fix: "state the real reason: the computed `display` of a styled button depends on its parent (`inline-flex` in flow, `flex` as a flex item), so one expected value does not fit every story; `justify-content: center` is the same everywhere."
2. `packages/ngx-yeti-testing/src/playwright.ts:91-93` (`expectItemSheetsApplied`), "read geometry only once the item files of `items` have loaded and applied." Evidence: "the body checks one link per item and `sheet.cssRules.length > 0`, which is 'loaded with rules'. ... `story-helpers.ts:10` 'A loaded file is not an applied one'". Fix: "say 'have loaded with rules', and say what the caller still owes when a read depends on a computed value (a poll on a property the file sets). Renaming the helper is a code change outside a comment review."
3. `packages/ngx-yeti-testing/src/lib/story-helpers.ts:5-8`, "Rejects after `timeout` ms (5000 unless given) with an Error naming the item, the property, and the last value read." Evidence: "line 31 awaits `itemStylesLoaded(item)` first. That rejects at once with other errors (`No <item> item link in <head>`, `<href> did not load a stylesheet with rules`, `<href> was removed before it loaded`; `item-links.ts`), and its wait for `load` or `error` is not bounded by `timeout`". Fix: "add one sentence: it rejects at once when the item has no link or its file fails to load, and `timeout` bounds only the wait for the computed value."
4. `packages/ngx-yeti/src/accessibility.node.spec.ts:229-230`, "(the departures table of the ngx-yeti-specs skill, user ruling 2026-10-04)". Fix: "keep '(ngx-yeti-specs, Departures)' as `button.spec.ts:627` and `table.spec.ts:411` write it, and drop 'user ruling 2026-10-04'."
5. `packages/ngx-yeti/card/src/card.ssr.spec.ts:20-21`, "Until `badge` lands, a plain `span` stands in for `yetiBadge`, so the place of its head link is asserted with it." Fix: "say what the code does: a plain `span` stands in for the badge, and the test asserts the card link after the button link only. The owed badge-order case belongs in the milestone record, not here."
6. `packages/ngx-yeti/container/src/container.stories.ts:427-428`, "with a plain `nav` in the nav item's place, which a later milestone lands". Fix: "drop 'which a later milestone lands'; keep 'a plain `nav` stands in for `yetiNav`' and the sentence on what is not asserted."
7. `packages/ngx-yeti/enter/src/enter.spec.ts:582-583`, "Real Safari reports reduced motion, where the arrival lasts 0.01 ms, so no duration or play state is asserted." Fix: "'A browser may report reduced motion, as the Safari of the CI runner does; Yeti then collapses the arrival's duration, so no duration or play state is asserted.'"

Triage item 7, the site in this task's files (cosmetic): `packages/ngx-yeti/enter/src/enter.spec.ts:72-73`, "Adds the global stylesheet, which ends with the package's accessibility stylesheet, once per test file". Fix: "the package's global stylesheet (\"ngx-yeti/ngx-yeti-globals.css\")". T056 fixes the other sites.

Triage item 13 (minor, g3-code-reviewer M1): "`apps/yeti-app-e2e/src/card.spec.ts:391-394` ... `expect(await itemLinks(page), ...).toEqual(['grid', 'button', 'card', 'spinner', 'lift']);`. Every other item route filters first (`itemLinks(page, 'grid')`, `coverAndCenterLinks`, `buttonLinks`), and the same file uses `expect.arrayContaining(['card', 'lift'])` at line 35. Record: INTENT.md:51 (E9) 'assertions on item links and preload hrefs use containment, not exact arrays, so later additions do not break them (LESSONS.md)'. Claimed failure: ... When badge lands, its link joins the list and this test fails for a reason unrelated to the order it asserts. ... Fix direction: filter the list to the five named items before comparing, as `buttonLinks` does, so the order claim stays exact and a sixth link does not break it."

Triage item 14 (cosmetic batch), the parts in this task's files:

- `packages/ngx-yeti/icon/src/icon.spec.ts:187`, `expect(getComputedStyle(host).textAlign).toBe('start');` (g2-test-analyzer F3): "The host is a `span` ... HTML gives the `align` attribute no presentational meaning on a `span` ... so `text-align` computes to `start` whether or not the directive removes the attribute." Triage: delete.
- `apps/yeti-app-e2e/src/icon.spec.ts:100`, `await expect(aligned).toHaveCSS('text-align', 'start');` (g3-code-reviewer C3): "the line holds whether or not the attribute was removed. Lines 97-99 carry the real checks." Triage: delete.
- `packages/ngx-yeti/table/src/table.stories.ts:442-445` (g2-test-analyzer F7): "`all(table, '[yetitablecell]')` feeds the loop; no `toHaveLength(4)` precedes it. ... if the selector matched nothing, the header cells' `data-align` and absent `align` would go unasserted while the story stays green. Fix direction: `await expect(hosts).toHaveLength(4)` before the loop, as `table--default` does for its numeric cells (`:198`)."
- `packages/ngx-yeti/button/src/button.ssr.spec.ts:101-106` (g2-test-analyzer F6): the presence attribute is asserted on four of eight hosts (ids `save`, `bold`, `saving`, `offline`); "Record: button.md:340, 'each host renders `class=\"button\"`, `data-ngx-yeti-item-button`, and its bound `data-*` attributes'. ... Fix direction: loop the first test over all eight ids."
- `apps/yeti-app-e2e/eslint.config.mjs:13` (g3-code-reviewer C2): "`assertFunctionNames: ['expectHoverLifts', 'expectHydrationFrames']`. This range replaced `expectHydrationFrames` with `expectStyledFrames`; `rg expectHydrationFrames apps` finds only this line. ... A later test whose only assertion is `expectStyledFrames` or `expectItemSheetsApplied` would fail `playwright/expect-expect`. Fix direction: replace the stale name with `expectStyledFrames`."
- `apps/yeti-app-e2e/src/table.spec.ts:593` (g3-code-reviewer C1): "`// ponytail: a bounded wait of up to 60 frame pairs, not an assertion;` ... Fix direction: keep the sentence and drop the `ponytail:` prefix."
- g2-comments 8: `packages/ngx-yeti/button/src/button.stories.ts:823-825`, "Yeti means `progress` here (button.css:131), but its disabled rule is the more specific one and wins the cursor." Fix: "cite 'upstream Y15' in place of the line number."
- g2-comments 9: `packages/ngx-yeti/table/src/table.stories.ts:146`, "Rows of a long or a narrow table." Fix: "'`count` rows, each a row header and a numeric cell.'"
- g2-comments 10: `packages/ngx-yeti/src/accessibility.node.spec.ts:209-210`, "Each declaration inside an `@media (forced-colors: active)` block". Fix: "'inside a forced-colours block' in both" (the file's own comment at `:147-148` says "whose query asks for forced colours, whatever its spelling or added conditions").
- g2-comments 11: `packages/ngx-yeti/button/src/button.spec.ts:62`, "`black` sits on Yeti's white paint and `white` on its black paint." Fix: "move the sentence to `VariantsHost`, or delete it; the template says it."

Not in this task, by the triage: the disabled-link key presses in `apps/ngx-yeti-e2e/src/button.spec.ts` (g3-code-reviewer M3, "the known thermos L1 item; fixed with it") and the two layer-2 cases in the partner item's spec file (g2-test-analyzer F4, "leave").

## Approach

- Each fixed test must be able to fail: for items 10 and 11, show the new assertion failing once against a broken input (for item 10, a row with no hover or no tint in one scheme; for item 11, an `assertWithin` written as `Math.abs(a - e) > t`, or a `NaN` input), then restore it, and record both runs in the Log. Delete a line only where the finding says it cannot fail.
- Item 10 is a hover case: it runs in layer 2 under a real pointer (Departures row "Any spec | A CSS `:hover` assertion in a play function"), and its Verify runs it in Chromium, Firefox, and WebKit through the `ci unit` container job.
- Item 13 keeps the order claim exact over the five named items and lets a sixth link pass, as `buttonLinks` does; other link assertions in the file stay as they are.
- `apps/yeti-app-e2e/eslint.config.mjs` is a typed script after T053 (Interface contract); keep its `// @ts-check` and JSDoc.
- Comments follow the rule quoted in Context and the type-safety rules for any code change in tests (no `as`, no `!`, SIFERS `setup()`).
- Heavy: the Verify runs layer-2 tests, Storybook tests, a container job, and the Fixture e2e on fixed ports; the orchestrator runs it alone.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md` (the contrast helper).

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. The table hover test reads each scheme's resting row background with the pointer away and polls for a change after hovering before it measures the ratio; the Log shows it failing on an untinted row.
2. `story-helpers.browser.spec.ts` has `assertWithin` cases for inside, outside, and `NaN`, and `usedLength` cases for the inline and the block axis against a token and a literal; the Log shows one failing on a broken `assertWithin`.
3. Every comment named in Context items 12 and 14, and the enter.spec.ts wording of item 7 read as their fix directions say, with no date, ruling, plan, or tool marker left in them.
4. The yeti-app-e2e card JavaScript-off case compares the five named items' order after filtering to them.
5. The two `text-align` lines are gone, `table--align` asserts four hosts before its loop, the button server-render test asserts the presence attribute on all eight hosts, and `assertFunctionNames` names `expectStyledFrames`.
6. Lint and typecheck of `ngx-yeti`, `ngx-yeti-testing`, and `yeti-app-e2e`, the named layer-2, node, and Storybook tests, the table layer-2 and Storybook tests in three engines, and the yeti-app-e2e card, icon, and table specs pass.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "expectHydrationFrames" apps/yeti-app-e2e/eslint.config.mjs && ! rg -q -F "ponytail:" apps/yeti-app-e2e/src/table.spec.ts && ! rg -q -F "toHaveCSS('text-align', 'start')" apps/yeti-app-e2e/src/icon.spec.ts && ! rg -q -F "textAlign).toBe('start')" packages/ngx-yeti/icon/src/icon.spec.ts && ! rg -q -F "user ruling 2026-10-04" packages/ngx-yeti/src/accessibility.node.spec.ts && ! rg -q -F "later milestone lands" packages/ngx-yeti/container/src/container.stories.ts && rg -q -F "assertWithin" packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts && rg -q -F "usedLength" packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-testing yeti-app-e2e && npm exec nx -- test ngx-yeti-testing --skip-nx-cache && npm exec nx -- test ngx-yeti --skip-nx-cache -- table/src icon/src button/src card/src container/src enter/src src/accessibility && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache -- button/src table/src container/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti -- --project=browser table/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test-storybook ngx-yeti --skip-nx-cache -- table/src && npm exec nx -- e2e yeti-app-e2e -- card.spec.ts icon.spec.ts table.spec.ts && npx prettier --check packages/ngx-yeti packages/ngx-yeti-testing apps/yeti-app-e2e; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from review round 2 triage items 10 to 14 and the enter.spec.ts site of item 7 (tmp/afk-m002/lars-review/r2/triage.md).
