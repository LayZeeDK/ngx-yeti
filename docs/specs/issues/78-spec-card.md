# 78. Spec: card (component)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `card` component, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/card.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Each point is marked "(open: see ticket)" in the spec. Impact and confidence follow the trap-quadrant rule (map, Standing rulings, 2026-10-03). None is HIGH impact, so none is in the trap quadrant.

1. **`NgOptimizedImage` on a card's picture** (spec section 4 usage rule 7, Testing Decisions layer 4, Further Notes). Impact: MEDIUM. Confidence: MEDIUM. Building-blocks 1.2 asks every static `img` in examples to use `NgOptimizedImage`. `fill` mode cannot be used: it positions the image absolutely with `inset: 0`, and the card is `position: relative`, so the image would cover the whole card (read, `ng_optimized_image.ts:260-263`). The `width` and `height` form renders, but `NgOptimizedImage`'s development-mode check compares the rendered box's ratio with the intrinsic one (`ng_optimized_image.ts:1080-1123`, read), so a picture whose ratio differs from the card's `ratio` by more than 0.1, and most pictures in the row form, log a distortion warning, although `object-fit: cover` crops rather than distorts. Recommendation: the usage rule as written (the `width` and `height` form with the intrinsic size, never `fill`, `ratio` matched to the picture where nothing should be cropped, and the warning documented as expected for a cropped card picture), and a layer-4 case that records the console output, as ticket 50 decision 35 did for `frame`. Not measured: whether the check fires before or after the container query applies. Decided 2026-10-03 in ticket 50, decision 118 (orchestrator, full AFK mode).
2. **Forced colours on a card** (spec section 7, layer 4). Impact: LOW. Confidence: MEDIUM. Ticket 17 did not include the card among the items that lose state under forced colours (section 2.6), and the card draws no state. A raised card loses its shadow under forced colours; whether its transparent border then shows is not measured. Recommendation: no ledger row and no package CSS, with layer 4 recording the edge and the focused link's outline under `forcedColors: 'active'`, as ticket 50 decision 30 did for `box` surfaces and decision 26 for the lift's shadow. Decided 2026-10-03 in ticket 50, decision 119 (orchestrator, full AFK mode).
3. **Text selection under the stretched link** (spec section 7). Impact: LOW. Confidence: HIGH. The stretched link's pseudo-element covers the card, so a pointer drag over the body text starts a link drag rather than a selection (inferred from `card.css`; it is the pattern's known cost). No WCAG 2.2 AA criterion covers it. Recommendation: a sentence in the docs and no ledger row; a consumer who needs selectable text leaves `stretch` off and keeps the heading link. Decided 2026-10-03 in ticket 50, decision 120 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/card.md](../specs/card.md).

Two directives in `ngx-yeti/card`. The item directive `YetiCard` on `[yetiCard]` (`exportAs: 'yetiCard'`) binds the static class `card` and the presence attribute `data-ngx-yeti-item-card` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), binds `data-variant`, `data-threshold`, `data-ratio`, and `data-raised` from `variant: YetiVariant`, `threshold: YetiWidth`, `ratio: YetiRatio`, and `raised: boolean` (ticket 26 rows 99 to 102), acquires the item file with `injectYetiItemStyles('card')`, and provides `yetiCardToken`. The part directive `YetiCardLink` on `a[yetiCardLink]` binds `data-stretch` from a boolean `stretch` input (row 103, kind C) and sets no presence attribute (ticket 50 decision 6). Both are types only; Yeti has no module for the card. Neither class name is among the 46 that `yeti.d.ts` exports, so both take `Yeti`. No input is named like an HTML attribute.

The whole-card link pattern (the link inside the heading with `yetiCardLink stretch`, named by the heading text; `tabindex="-1"` on a footer link that repeats the destination; never a card wrapped in a link; `article` or `li` hosts) is stated as usage rules and tested in play functions (computed name, the press target, Tab stops) and in an anti-pattern story. `card` with `lift` on one element carries both presence attributes, and the fixture app runs ADR 0045's shared-host case inside `hydrate never`.

Counts: 55 user stories, 11 usage rules, 10 story ids, 3 open points (none HIGH impact, so none is in the trap quadrant). No open point blocks the spec. The card owns no ledger row and adds none; it writes no upstream-bug row (Y8 already covers the manifest's undeclared `:has()`). Cross-item files acquired: none.
