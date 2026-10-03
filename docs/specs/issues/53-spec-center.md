# 53. Spec: center (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `center` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/center.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **What the package does about ledger row A11Y-9, the 2 px overflow at 320 px** (spec sections 4, 7, and 8, and layer 4). Impact HIGH (a WCAG 2.2 1.4.10 failure on Yeti's own documented composition, and the package must meet AA). Confidence MEDIUM. Recorded with options under the trap-quadrant ruling.

   **Question.** The spec traced the cause (read, and it matches ticket 17's measured 322 px exactly): a center's content box is its container's width less two gutters, `content-box`, so its padding brings it back to exactly 100 %. `[data-border]` (always-loaded `layouts/attributes.css:465`, `--yeti-border-width` 1px) adds 2 x 1 px on top. A second path, inferred and not measured: `.box[data-gap-inline]` outranks `.center` in specificity, so on a `center box` element a `gapInline` larger than the gap overflows by the difference. `intrinsic` is not affected (inferred). It is Yeti's CSS, so the ledger's branch applies: "one rule in `@layer ngx-yeti` or an upstream fix (the user's confirmation to file)". Which one?

   **Options.**
   - **A1. Package rule recomputing the width with the border.** `.center[data-border]:not([data-intrinsic])` with an inline size of 100 % less two gutters less two border widths. Dismiss: the gutter is a **Private token**, which the package never reads, writes, or names (ADR 0004; CONTEXT.md), and the user's "Accessibility CSS: Yes." ruling as recorded has rules "written against state hooks, not Yeti's internals". It also misses the `gapInline` path.
   - **A2. Package rule with a sizing keyword that fills the space left after padding and border** (`inline-size: stretch` on `.center[data-border]:not([data-intrinsic])`, or on every `.center`). Touches no private token and fixes both paths. Not approved now: unprefixed support in Firefox 145 and Safari 26.2 was not checked (confidence LOW), and whether it behaves inside a `stack` flex column, the reason Yeti set an explicit width, was not measured. Approve if a layer-4 measurement in the three engines shows it fills a center in block flow and in a stack with no overflow.
   - **B. Upstream fix in Yeti's `center.css`.** The right home for the fix, since Yeti's own example fails. It cannot be completed here: filing stays behind the user's confirmation (map, AFK override and Out of scope), and a fix arrives only with a pin move. Approve as a draft in `upstream-bugs.md` or the ledger row's reproduction column, with filing left to the user.
   - **C. Usage rule: no inline border and no `gapInline` on the center's own element; put them on a `yetiBox` inside it** (spec usage rule 3), plus an **Anti-pattern story** for Yeti's composition and a layer-4 `scrollWidth` assertion on the documented forms. Costs no CSS and no private token, keeps `yetiCenter yetiBox` (architecture-guide P6) valid, and meets 1.4.10 for every form the package documents. Its weakness: nothing stops a consumer from writing the overflowing form, because checks are a later milestone (map, Milestones).
   - **D. Accept and document the gap as Yeti's.** Dismiss: the package's AA requirement is never a recommendation (map, Inherited preferences, Accessibility).

   **Recommendation.** C now, with B drafted for the user's confirmation; adopt A2 later only if the layer-4 measurement passes in all three engines, and then relax usage rule 3. The ledger row's **What the package adds** becomes "usage rule 3 (border and inline padding on an inner box); an upstream report drafted, not filed", **Verified** "measured (Chromium); cause read", **Tested by** L1 anti-pattern story and L4.

   **Evidence and confidence.** Cause: HIGH (read in `center.css:5`, `:12`, `:15`, `attributes.css:465`, `surface.css:5`; arithmetic equals ticket 17's 322 px; not re-run). `gapInline` path: MEDIUM (specificity read, not measured). A2's engine support: LOW (not checked).

   **To overrule.** An implementer who prefers a package rule writes A2 into the package's accessibility stylesheet in `@layer ngx-yeti`, removes usage rule 3 and the anti-pattern story, and turns the layer-4 case on Yeti's own composition into a pass assertion. One who prefers D removes usage rule 3 and records the gap as accepted in the ledger.

   Decided 2026-10-03 in ticket 50, decision 32 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/center.md](../specs/center.md).

- User stories: 44.
- Open points: 1 (A11Y-9's remedy, HIGH impact, MEDIUM confidence, recorded above with options). It does not block the spec: the spec carries the recommended reading (usage rule 3) and marks it "(open: see ticket)".
- The spec traces A11Y-9's cause to Yeti's CSS (the center's width leaves room for its gutters only; `[data-border]` adds 2 x `--yeti-border-width`), which ticket 17 had only inferred. The ledger row is the orchestrator's to update.
- The presence attribute is `data-ngx-yeti-item-center` (ADR 0045).
