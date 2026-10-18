---
id: T045
title: Make the story and layer-2 checks the review found unable to fail assert what their specs ask
wave: 4
deps: [T020, T037]
status: done
agent: build_T045
base: d60b47984ecd00d6ee19f73a679012cd75747c11
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/box/src/box.spec.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/center/src/center.spec.ts
  - packages/ngx-yeti/columns/src/columns.spec.ts
  - packages/ngx-yeti/frame/src/frame.stories.ts
  - packages/ngx-yeti/grid/src/grid.stories.ts
  - packages/ngx-yeti/layer/src/layer.stories.ts
  - packages/ngx-yeti/masonry/src/masonry.stories.ts
  - packages/ngx-yeti/overlay/src/overlay.stories.ts
  - packages/ngx-yeti/overlay/src/overlay.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.stories.ts
  - packages/ngx-yeti/sidebar/src/sidebar.stories.ts
  - packages/ngx-yeti/breakout/src/breakout.stories.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
---

# T045 — Make the story and layer-2 checks the review found unable to fail assert what their specs ask

## Context

Third build repair, review round 1 of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12; the triage accepts each finding below as reported and batches the cosmetics). The triage and reviewer files are git-ignored local records, so every finding is inlined. Line numbers are at 1747fe0; T037 migrates every story here onto the shared story helpers and T020 adds the button to `box--paint`, both before this task, so lines will have moved. The round's box major (box.md:281, the button's focus ring in the `primary` band) is not here: T020 owns it (its Approach and criterion 1).

Findings, verbatim from the g2 test analyzer unless marked (criterion first, then the observation):

- box, minor. box.md:282: "Asserts `data-text` and the computed colour against a probe". Observed: "box.stories.ts:450 and :481-485 (`Text`). Half of box.md:282 is uncovered ... The in-band override `<p yetiPaint="primary" yetiText="grey-0">` gets only attribute checks and `expectReadableOn`. If the override stopped applying, the text would fall back to on-primary, which still passes 4.5:1."
- box, center, overlay, cosmetic. box.md:283, center.md:261. Observed: "box.stories.ts:519-521, box.spec.ts:208-210, center.stories.ts:278-280 and center.spec.ts:170-172. `getAttributeNames().filter((name) => name === 'data-gap')` with `toHaveLength(1)` can never fail, because an element cannot carry the same attribute twice. The `toHaveAttribute('data-gap','lg')` beside it is the real check." And "overlay.spec.ts:251-253. The same duplicate-attribute length check that cannot fail, here for `data-fill`."
- columns, cosmetic. columns.md:281: "a changed binding updates it". Observed: "packages/ngx-yeti/columns/src/columns.spec.ts:153 ... Only `columns` is changed in place. `threshold`, `gap`, `align` and `justify` are only set and then unset."
- frame, minor. frame.md:247. Observed: "packages/ngx-yeti/frame/src/frame.stories.ts:238-263 (`frame--ratios`). The play function never waits for the portrait images to decode, while the other stories call `imageLoaded()` first. A regression where the frame grows to fit its image instead of cropping it can pass if the story measures before the images decode. This race is inferred from the code, not measured."
- grid, minor. grid.md:279: "at most three cells per row". Observed: "packages/ngx-yeti/grid/src/grid.stories.ts:206 ... `expect(perRow(grid)).toBeLessThanOrEqual(3)` cannot fail at layer 1: The story never sizes its container, and the storybook Vitest project sets no viewport, so it runs at Vitest's default 414 px width ... At that width `min="2xs"` (12rem) fits at most two cells, whatever the cap. Layer 4 (apps/ngx-yeti-e2e/src/grid.spec.ts:62, 1000 px) does catch a lost cap."
- layer, minor; overlay, cosmetic. layer.md:259 and overlay.md:289: "accessibility tree order equals the DOM order". Observed: "packages/ngx-yeti/layer/src/layer.stories.ts:158-168 and :249 ... The story checks a stand-in instead: computed `order` is 0 and no `aria-owns` or `aria-flowto`. Adding `aria-hidden` to a child would pass. The lift and scroller stories read the real tree with `getAllByRole`." And "overlay.stories.ts:143-153 and :245 (overlay.md:289). The same accessibility-order stand-in as the layer story. Its role filter does include `aria-hidden` and `inert`, which lowers the risk."
- masonry, minor. masonry.md:285: "`columns="2"` in a container wide enough for more"; masonry.md:275: sizes come from probes. Observed: "packages/ngx-yeti/masonry/src/masonry.stories.ts:240-254 ... The stage is a fixed 1000 px, and the story never probes that more than two columns would fit. If a pin move widened `--yeti-width-2xs` past about 330 px, a regression that ignores `data-columns` would pass."
- overlay, minor. overlay.md:291: "section 8's veil", the `yetiCover` veil of overlay.md:231-238 (`<div yetiCover yetiOverlayChild over fill class="veil">` holding `<p yetiCoverChild center role="status">`, with `.veil { --yeti-cover-height: auto; ... }`). Observed: "packages/ngx-yeti/overlay/src/overlay.stories.ts:370 and :410 ... The story writes an inline `display:grid; place-items:center` child instead, and no Departures row covers that (I checked). The centring check passes because of the story's own CSS, not the package. The cover-veil height composition (usage rule 8 at overlay.md:163, upstream-bugs row Y10) is tested nowhere at layers 1 to 3."
- timeline, minor. timeline.md:217 and :288, the A11Y-10a precondition "no entry dot's box intersects its entry's time box". Observed: "packages/ngx-yeti/timeline/src/timeline.stories.ts:101-124 and :189-200 ... `beforeBox` reads the dot's box with `parseFloat` of the `::before` left, top, width and height. If those resolve to `auto`, the box is NaN, `intersects()` returns false, and the guard passes without checking anything ... The fix is to assert `Number.isFinite` on it."
- sidebar and timeline, cosmetic. sidebar.md:287. Observed: "packages/ngx-yeti/sidebar/src/sidebar.stories.ts:549-552 ... Storybook's `userEvent.tab()` builds its own DOM-order list of focusable elements (see the Departures row for frame.md:248). It cannot catch a browser focus-order regression; it only catches a positive `tabindex` from the package." And "timeline.stories.ts:487 and :545. The same `userEvent.tab()` limitation. Only the Tab half of `timeline--rtl` is weak, because layer 4 repeats `timeline--links` with real Tab." The triage notes that layer 4 covers it.
- Stale comments (triage item 6, comment analyzer), minor: "packages/ngx-yeti/breakout/src/breakout.stories.ts:142-143 ... 'The bleeding child stands in for a `yetiFrame` until frame lands; it holds the picture.' This is stale: `frame` has shipped ... Either use `yetiFrame` in the story or say why a plain child is kept." And "packages/ngx-yeti/stack/src/stack.stories.ts:374-375 ... 'Until `cluster` lands, each row of the list is a plain `div`.' This is stale: packages/ngx-yeti/cluster exists."

## Approach

- Each fix makes its check able to fail, then shows it: for every changed assertion except the comment and cosmetic-label fixes, break the thing it guards once (for example drop the `yetiText` override, remove the decode wait and shrink the image, remove the cap, add `aria-hidden` to a child, ignore `data-columns`, swap the veil back to inline centring, make the dot box `auto`), see the story or spec fail, restore, and record each control run in the Log. No control code is committed.
- box `Text`: assert the computed colour of the in-band `yetiText` override against a probe that carries the same `yetiText` value, as the story's other `yetiText` cases do.
- Duplicate-attribute checks (box, center, overlay): delete the length checks that cannot fail; the `toHaveAttribute` beside each stays the check.
- columns: change `threshold`, `gap`, `align`, and `justify` in place, each asserting the attribute or computed value updates, as `columns` already is.
- frame `frame--ratios`: wait for every image to decode (the shared image-load helper the other frame stories use) before measuring.
- grid: give the stage a measured width where more than three cells of `min="2xs"` fit (read the cell minimum from a probe, never from Yeti's token default, ADR 0006), assert that more than three would fit without the cap, then assert at most three per row.
- masonry: probe that the stage fits more than two columns at the `2xs` width before asserting two.
- layer and overlay: read the accessibility tree order with Testing Library's role queries (`getAllByRole`, as the lift and scroller stories do) and compare it with the DOM order; drop the computed-`order` stand-in only if the role query covers what it checked.
- overlay: build section 8's veil as overlay.md:231-238 writes it, `yetiCover` with `yetiOverlayChild over fill` and a `yetiCoverChild center` status child, with the consumer's `--yeti-cover-height: auto` on the veil, and assert the veil is the overlay's height (not the viewport's) and the status child is centred. If the composition cannot pass for a reason in the package or Yeti, stop and write `NEEDS-ORCHESTRATOR:` with the measurement rather than keeping inline CSS.
- timeline: assert every value `beforeBox` reads is finite before the intersection check.
- sidebar and timeline Tab walks: keep them, and make each assertion message say what it proves (no positive `tabindex`, focus in DOM order through Storybook's list), so no reader takes it for a browser Tab-order check; the real Tab cases stay at layer 4.
- breakout and stack: compose the built item the comment waits for (`yetiFrame`, `yetiCluster`) if the story's claim and axe still hold with it; otherwise replace the comment with the reason the plain element stays. No comment names a task, milestone, or date.
- Never edit `docs/specs/specs/*.md`. No assertion gets weaker; a migrated helper from T037 is used, not copied.
- Skills: `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/yeti-pin/SKILL.md` (tokens).

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `box--text` asserts the in-band override's computed colour against a probe; the Log records the story failing with the override removed.
2. No `getAttributeNames().filter((name) => name === ...)` length check remains in the box, center, and overlay stories and specs, and the columns spec changes `threshold`, `gap`, `align`, and `justify` in place with an assertion each.
3. `frame--ratios` waits for its images to decode; `grid--settings` (or the story holding the cap check) runs where more than three cells would fit and fails with the cap removed; the masonry two-column story probes room for more than two columns; each control run is in the Log.
4. The layer and overlay stories compare the accessibility tree order from role queries with the DOM order, and fail when a child gets `aria-hidden` (Log).
5. The overlay story's veil is `yetiCover` as overlay.md section 8 writes it, the veil's height equals the overlay's, and its status child is centred; with inline centring and no `yetiCover` the check fails (Log).
6. The timeline dot-box guard fails on a non-finite box (Log).
7. The sidebar and timeline Tab-walk assertions name what they prove; the breakout and stack comments no longer wait for an item that exists.
8. `npm exec nx -- test-storybook ngx-yeti` for the touched items passes locally and in the `ci unit` container in Chromium, Firefox, and WebKit, with every story's axe gate.
9. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at each task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "yetiCover" packages/ngx-yeti/overlay/src/overlay.stories.ts && rg -q -F "isFinite" packages/ngx-yeti/timeline/src/timeline.stories.ts && ! rg -q -F "getAttributeNames().filter((name) => name ===" packages/ngx-yeti/box/src packages/ngx-yeti/center/src packages/ngx-yeti/overlay/src && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- box/src center/src columns/src overlay/src && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache -- box/src center/src frame/src grid/src layer/src masonry/src overlay/src timeline/src sidebar/src breakout/src stack/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test-storybook ngx-yeti --skip-nx-cache -- box/src center/src frame/src grid/src layer/src masonry/src overlay/src timeline/src sidebar/src breakout/src stack/src && node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti -- --project=browser box/src center/src columns/src overlay/src; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes; triage item 6 for breakout and stack and the g2 test analyzer's story and layer-2 minors and cosmetics). At 1747fe0 the overlay story has no `yetiCover`, the timeline story no `isFinite`, and the five length checks exist, so the Verify fails if this task is skipped. deps: T020 (file overlap, `packages/ngx-yeti/box/src/box.stories.ts`, where T020 adds the focus-ring button) and T037 (file overlap, every story file here, which T037 migrates). The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-13 — coder build_T045: implementation. box--text: the in-band `yetiText="grey-0"` override's computed colour is now asserted against an `override-probe` reading the same token. The five duplicate-attribute length checks are deleted (box story and spec, center story and spec, overlay spec); the `toHaveAttribute`/`getAttribute` beside each stays, and `expect.assertions` counts are lowered to match. columns spec: the bound-input test splits in two (vitest/max-expects caps a test at 10), and the second test changes threshold, gap, align, justify, and columns in place, asserting each attribute and no `align`. frame--ratios: `imageLoaded()` on every image before measuring. grid--default: the list sits in a stage resized to five times (the probe's `2xs` width + the grid's column gap); the story asserts more than three columns would fit uncapped, then exactly three per row (stronger than <=3). masonry--capped: the stage is resized to four times (probe `2xs` + column gap); the story asserts more than two would fit, then two columns. layer--default: the tree check is role queries, `getAllByRole('img')` equal to [picture], plus every child not `isInaccessible` (Testing Library), beside the kept `order`/aria-owns check; a role-name query on the figure was tried and dropped because Chromium's `figcaption` gives no name in dom-testing-library. overlay--default: `[...getAllByRole('img'), ...getAllByRole('paragraph')]` equals the overlay's DOM children. overlay--veil: the veil is `yetiCover yetiOverlayChild over fill class="veil"` holding `yetiCoverChild center role="status"`, with the story style `.veil { --yeti-cover-height: auto; background: var(--yeti-color-scrim); }`; the story asserts the cover class, presence attribute, and `data-center`, that the form is shorter than the viewport, that the veil's height equals the form's within 1 px, every edge, and a centred message. The forms are 24rem wide: at full width Yeti's prose measure capped the message at 336 px inside a 600 px veil, which failed the centring. timeline: `beforeBox` throws, naming the values, unless left, top, width, and height parse to finite numbers. The sidebar--rtl and timeline Tab walks pass the message "No positive tabindex: Storybook's Tab moves focus through its own DOM-order list, not the browser's Tab order" to each `toHaveFocus`. breakout: the bleeding child is `yetiFrame ratio="21/9" yetiBreakoutChild bleed` (spec section 8), with the stale comment rewritten. stack--rule: each row is `yetiCluster justify="between"` (stack.md section 8, without yetiNumeric, since table is not this task's), with the comment rewritten. Axe and every assertion stay green with both compositions.
- 2026-10-13 — coder build_T045: control runs, each a scripted edit to one story file run with `nx test-storybook ngx-yeti --skip-nx-cache -- <item>/src` through the heavy lock, then restored (nothing kept). Every one failed, Chromium, 1 test each: (1) box Text with `yetiText="grey-0"` removed from the override: "expected 'oklch(0.99 0 0)' to be 'oklch(0.99 0.02 250)'" at the new probe assertion (the 4.5:1 check alone would have passed). (2) frame Ratios with `.frame { aspect-ratio: auto } .frame > img { block-size: auto }` (the frame grows to its image): "Expected 288 to be within 1 of 192" in assertRatio; (2b) the same with the decode wait removed: the same failure (Chromium decoded the data: SVGs in time here; the race stays inferred). (3) grid Default with `columns="3"` removed: "expected 5 to be 3". (4) masonry Capped with `columns="2"` removed: "expected [0, 214, 429, 643] to have a length of 2 but got 4". (5) layer Default with `aria-hidden="true"` on the caption: the not-isInaccessible list lost the caption (toStrictEqual); (5b) aria-hidden on the picture: "Unable to find an accessible element with the role img". (6) overlay Default with `aria-hidden="true"` on the held child (and the story's own aria-hidden filter dropped, so the role query is what fails): "Unable to find an accessible element with the role paragraph". (7) overlay Veil with inline `display:grid; place-items:center` and no `yetiCover`/`yetiCoverChild`: fails at `toHaveClass('cover', 'veil')`; (7b) yetiCover kept but `--yeti-cover-height: auto` dropped: "Expected 900 to be within 1 of 75.90625", meaning the veil is the viewport's height (upstream-bugs Y10, reproduced). (8) timeline Default with `.timeline > li::before { position: static }` (left and top resolve to `auto`): beforeBox throws the non-finite error from expectDotsClearOfDates.
- 2026-10-13 — coder build_T045: Verify run exactly as written, through the heavy lock: exit 0. lint and typecheck ngx-yeti passed; `nx test ngx-yeti -- box/src center/src columns/src overlay/src`: 12 files, 83 tests passed; test-storybook (Chromium, local): 11 files, 71 tests passed; `ci unit` container test-storybook (Chromium, Firefox, WebKit): 33 files, 213 tests passed, each story's axe gate included; `ci unit` container browser tests: 12 files, 183 tests passed; Nx daemon stopped. Rule 13: `npx prettier --check .` passed. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD`: 15 tasks; every lint, typecheck, and test-storybook task passed (ngx-yeti:test-storybook included). ngx-yeti:test failed 1 of 626 (77 of 78 files passed): `src/item-names.node.spec.ts` "load the item file their presence attribute names" reports `button/src/button.ts` (presence [button], styles [button, spinner]). That is the known failure from the landed button directive, which sibling T021 fixes, not caused by this task. I did not touch the file.
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T045): pass, exit 0; output tail:
  ```
  [ci-unit] - Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Generating FESM and DTS bundles
  [ci-unit] [32m✔[39m Built ngx-yeti/spinner
  [ci-unit] - Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Generating FESM and DTS bundles
  [ci-unit] [32m✔[39m Built ngx-yeti/stack
  [ci-unit] - Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Generating FESM and DTS bundles
  [ci-unit] [32m✔[39m Built ngx-yeti/table
  [ci-unit] - Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Generating FESM and DTS bundles
  [ci-unit] [32m✔[39m Built ngx-yeti/timeline
  [ci-unit] - Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [ci-unit] [32m✔[39m Generating FESM and DTS bundles
  [ci-unit] [32m✔[39m Built ngx-yeti/visually-hidden
  ```
