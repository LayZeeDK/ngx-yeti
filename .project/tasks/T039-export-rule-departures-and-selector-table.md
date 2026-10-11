---
id: T039
title: Record the entry-point export rule and the audited departures, and bound the accessibility stylesheet's Yeti selectors by ledger row
wave: 4
deps: [T035]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-accessibility/SKILL.md
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/project.json
---

# T039 — Record the entry-point export rule and the audited departures, and bound the accessibility stylesheet's Yeti selectors by ledger row

## Context

Build repair before wave 4. User rulings, verbatim (2026-10-11): "1-3: Approve.", whose third item is "3 tighten the published-output check to an allowlist"; "Something named `YetiScroller*` belongs in `ngx-yeti/scroller` only, except if it causes an issue to only have it in a secondary entry point. Consider this a general rule for all secondary entry points and exports."; and "7: Audit docs/specs/ to inform your decision.", on four places where a spec's wording and the workspace differ. The audit ran on 2026-10-11 (read-only, at 7e0045f); its conclusions are Claude's decisions under that ruling, not the user's words. docs/specs is never edited except its two ledgers, so each wording difference becomes a row in the Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md`. This task writes records and two guards and changes no product source.

The export rule. Built state: `YetiScrollerJustify` is declared in `packages/ngx-yeti/scroller/src/scroller.ts` and exported from `ngx-yeti/scroller` only, and the primary entry point `packages/ngx-yeti/src/index.ts` is `export type * from './yeti-types'`. The records say otherwise: scroller.md:153 ("declared in the item's entry point from `YetiJustify` and re-exported by name from the primary entry point beside the vocabulary types"), the example at scroller.md:403 (`import type { YetiScrollerJustify } from 'ngx-yeti';`), ticket 50 decision 60 ("exported beside the re-exported vocabulary types"), and table.md:142 for `YetiTableAlign` ("It is exported beside the re-exported vocabulary types."). The user's ruling overrules them: the built state stays, and the rule covers every item-named export. `YetiTabsEmphasis` (tabs.md:124) follows it when tabs is built.

The published-output check. `withoutPackageLayer` in `packages/ngx-yeti/src/published-output.node.spec.ts` deletes every `@layer ngx-yeti` block of the accessibility stylesheet before the spec looks for Yeti rules, so any rule on a Yeti class inside that layer passes "holds no Yeti rule in any shipped stylesheet". `packages/ngx-yeti/src/accessibility.node.spec.ts` reports only class names that start with `ngx-yeti` and checks forced-colours values, so a copy of Yeti's `.card` rule pasted into the layer passes both specs (review of wave 3, 2026-10-11). The audit found that no record asks for a selector table: setup.md:329 means no copy of Yeti's CSS, and setup.md:330 gives the three limits. A table is a second copy of the ledger's selectors. The user approved it to close the hole, so the spec ties each key to a ledger row.

The audited differences. In each the workspace is right and the record's wording is recorded:

- setup.md:329 says the published output holds "no Yeti selector or `@layer yeti` block in the FESM bundles or any shipped CSS". Its source, ticket 13, is about a copy of Yeti's CSS and names no accessibility stylesheet. setup.md:210, :306, and :330, button.md:241, spinner.md:215, ticket 50 decisions 95 and 193, and the ledger rows A11Y-1a, 1c, 1d, 1f, 6, and 32 put the accessibility rules on Yeti's classes.
- sidebar.md:272, :286, and :316 say a center inside a sidebar keeps its auto inline margins "at a wide container". T013 measured in an isolated Chromium page: side by side (width `xs`, a 1200 px container) the inner center's margins are 0 px and 0 px in either stylesheet order, because the sidebar child's `flex-grow: 1` takes all the free space; stacked (width `lg`, at 1200 px and at 700 px) they are 300 and 300 px, and 175 and 175 px, with the sidebar file first, and 0 and 0 with the center file first. The story `sidebar--holding-center` and the Fixture case assert the order on a stacked pair.
- cover.md:282 and :286 list viewports of 1280 x 800 and 320 x 640 and name none for the 200 % text-zoom growth case; hero.md:332 has the same sentence. The workspace runs that case at 640 x 360. T014 measured in Chromium that at 320 px wide with 200 % text zoom the default story's zoomed `h1` overflows by 63 px inline. 320 px at 200 % is the 160 CSS px equivalent, below the 320 CSS px that WCAG 1.4.10 covers, and 640 px at 200 % is that equivalent (W3C, Understanding Reflow).
- enter.md:86, ADR 0003 point 1, and building-blocks 1.1 say the identity class is a static host class. `NgxYetiEnter` binds it (`'[class.enter]': 'true'`). T034 measured in WebKit 26.4 that with the static class `enter--inserted-preloaded` failed 5 of 20 runs (the host was added with `class="enter"` and no `data-once`, and an `animationstart` fired before `data-once` arrived), and 0 of 180 with the binding. The server HTML is unchanged.
- Stale text in the same skill: the Departures row for setup.md:210 says M001 created the stylesheet "with no accessibility rule", and the One-time tasks bullet says it "holds no accessibility rule yet". A11Y-32's rule landed in wave 3.

## Approach

- The rule goes under "Where code goes" in the specs skill: an export named after an item is declared in and exported from that item's secondary entry point only; the primary entry point exports Yeti's own types and nothing the package declares; an exception needs a measured issue (a build failure, a consumer that cannot import it), stated in a Departures row. Quote the user's ruling with its date.
- Departures rows, in the table's five columns (the record, what it says, what the workspace does, why, the owning skill), one per difference in Context: setup.md:329; sidebar.md:272, :286, and :316; cover.md:282 and :286 with hero.md:332; enter.md:86 with ADR 0003 point 1 and building-blocks 1.1; and scroller.md:153, scroller.md:403, ticket 50 decision 60, and table.md:142 for the export rule, with the user's words as the reason. Put the measurements in the Why column. Correct the row for setup.md:210. The row for enter's package rule (enter.md:27, :174, :307, and :322) is T040's and lands with that rule. Prettier formats the table.
- One-time tasks: delete the stale bullet. Keep its facts that stay true (the stylesheet is published through the `assets` entry and the `exports` map, where it is imported, and how the two builds resolve it) as plain text under "Where code goes", and repair the pointer to the one-time tasks in "Where a fix goes" of `.claude/skills/ngx-yeti-accessibility/SKILL.md`. Keep the heading "One-time tasks" only if a bullet remains.
- Selector table: replace `withoutPackageLayer` with the table and the checks of the Interface contract, on the lightningcss visitor the file already uses. Today's one entry is A11Y-32, with `.spinner` and `.button[aria-busy='true']::after`. The FESM check and the check of every other shipped stylesheet stay as strong as they are.
- Update the file's own self-tests so each check is shown to fail: a Yeti rule pasted inside the layer (a `.card` rule, for example) is reported; a sanctioned selector outside the layer is reported; a table entry that matches no selector is reported.
- The comment above the old function cites a planning id ("INTENT E7"). The new comment cites ledger rows only.
- Ledger keys: the spec reads `docs/specs/ledger.md` and expects each key of the table to be a row id there. That file is outside the project, so add it to the inputs of the `test` target in `packages/ngx-yeti/project.json`; otherwise a ledger edit could replay a cached pass.
- Primary entry check: one more test in `packages/ngx-yeti/src/name-collision.node.spec.ts`, built from that file's `exportedNames` and `yetiExportedNames`. The names the built primary entry point's declaration file exports are exactly the 46 names Yeti exports. Show that it can fail: export a package-declared type from the primary entry in the working tree, see the test fail, revert, and record the run in the Log.
- No product source changes. `YetiScrollerJustify` stays where it is, and the package README and changelog already name it under `ngx-yeti/scroller`.
- Never edit a spec under docs/specs, and neither ledger changes in this task.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`.

## Interface contract

- Sanctioned selectors (T039): `packages/ngx-yeti/src/published-output.node.spec.ts` holds the table `sanctionedSelectors`, which maps a row id of `docs/specs/ledger.md` to every selector of that row's rule in `packages/ngx-yeti/accessibility.css`, one string per comma-separated selector. The spec fails when a selector of that stylesheet names a Yeti class and is outside `@layer ngx-yeti` or absent from the table, when a table entry matches no selector of the stylesheet, and when a key is not a row id of the ledger. A task that adds, changes, or removes such a rule changes its entry in the same commit.
- Item-named exports (T039; user ruling 2026-10-11): an export named after an item, such as `YetiScrollerJustify` or `YetiTableAlign`, is declared in and exported from that item's secondary entry point only. `packages/ngx-yeti/src/name-collision.node.spec.ts` asserts that the names the built primary entry point exports are exactly the names Yeti's typings export at the pin, so a package-declared name there fails it.

## Intent coverage

- None

## Acceptance criteria

1. The specs skill states the export rule under "Where code goes", with the user's ruling quoted and dated and the condition for an exception.
2. The Departures table has a row for each of: setup.md:329; sidebar.md:272, :286, and :316; cover.md:282 and :286 with hero.md:332; enter.md:86 with ADR 0003 point 1 and building-blocks 1.1; and scroller.md:153, scroller.md:403, ticket 50 decision 60, and table.md:142. Each says what the record says, what the workspace does, and why, with the measurement or the user's words.
3. The row for setup.md:210 no longer says the stylesheet has no accessibility rule; the stale one-time bullet is gone, its facts that stay true are kept in the skill, and the accessibility skill's pointer to it leads somewhere that exists.
4. `packages/ngx-yeti/src/published-output.node.spec.ts` holds `sanctionedSelectors` with A11Y-32's two selectors and passes on the built package. Its self-tests show it reporting a Yeti rule pasted inside `@layer ngx-yeti`, a sanctioned selector outside the layer, and a table entry with no matching selector; it also fails for a key that is not a row id of `docs/specs/ledger.md`, which is an input of the `test` target.
5. `packages/ngx-yeti/src/name-collision.node.spec.ts` asserts that the built primary entry point exports exactly Yeti's names, and the Log records the run in which a package-declared export there made it fail.
6. No file under docs/specs and no product source file changes.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "sanctionedSelectors" packages/ngx-yeti/src/published-output.node.spec.ts && rg -q -F "scroller.md:153" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "table.md:142" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "setup.md:329" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "sidebar.md:286" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "cover.md:286" .claude/skills/ngx-yeti-specs/SKILL.md && rg -q -F "enter.md:86" .claude/skills/ngx-yeti-specs/SKILL.md && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/published-output src/name-collision src/accessibility.node; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user rulings "1-3: Approve." item 3, the entry-point export ruling, and "7: Audit docs/specs/ to inform your decision."). The audit's findings in Context are from two read-only audits of 2026-10-11, whose files are not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
