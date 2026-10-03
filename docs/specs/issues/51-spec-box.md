# 51. Spec: box (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `box` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/box.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/box.md](../specs/box.md).

47 user stories, 4 open points. The spec maps the box's class, four attributes, and three any-element markers to `YetiBox` (`gap`, `gapInline`, `gapBlock`, `surface`) and the class-free marker directives `YetiBorder`, `NgxYetiPaint`, and `YetiText` in `ngx-yeti/box`, all native platform, level 1, types only. Only `YetiBox` sets the presence attribute `data-ngx-yeti-item-box` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) and acquires `box.css`.

How the any-element markers relate to their own records: [building-blocks.md](../building-blocks.md) Part 2 row 1, [ticket 11](11-decide-spec-list.md) row 1 and Q9, and [ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 5 to 7 agree. The markers live in the box's spec, bind no class, are selector-named, and load no item file, because their rules are in the always-loaded `attributes.css` (checked at `Y/src/layouts/attributes.css:403-466`). Ticket 11 row 1 still says "part file", the glossary's old name for **Item file**. ADR 0045 gives the presence attribute to "each item directive", so the spec reads that the marker directives set none. Neither point is open.

### Open

1. **A ledger row for the box's contrast gap.** Impact MEDIUM, confidence HIGH. Yeti documents that no text colour reaches full contrast on `data-paint="grey-40"` to `"grey-60"` (`Y/src/guides/color.md:80`, read). `data-text` can also put any colour of the list on any background, and a link with a class inside a painted band keeps its own colour, because Yeti's inheritance rule matches only `a:not([class])` (`attributes.css:450-451`, read). `ledger.md` lists "every accessibility gap found in Yeti, whether or not the package closes it", but Part 2 row 1 gives the box no ledger row. **Recommendation:** add one row `A11Y-<next>` for `box` with these columns:
   - Source: WCAG 2.2 1.4.3.
   - What Yeti does: documents it in `color.md:80`.
   - What the package adds: usage rules 4 to 6, the anti-pattern story, and play-function ratio assertions on every shown pair. No package CSS, because no text colour reaches 4.5:1 on those fills.
   - Verified: read.
   - Tested by: L1.
   - Owner: box.

   Then change Part 2 row 1's Ledger column to that row. Not a trap-quadrant point.

   Decided 2026-10-03 in ticket 50, decision 29 (orchestrator, full AFK mode).
2. **`NgxYetiPaint` in ADR 0080's list.** Impact MEDIUM, confidence HIGH. `yeti.d.ts` at the Pin exports `type YetiPaint` (`:15`, checked), so ADR 0080 point 4's rule ("applies to every TypeScript name the package exports") makes the `[yetiPaint]` class `NgxYetiPaint`. ADR 0080 counts item names only, and its list of five does not include it. **Recommendation:** add a dated note to ADR 0080 and building-blocks 1.3 that names `NgxYetiPaint` as a sixth collision, from a marker directive, not an item. The spec already uses that name.

   Decided 2026-10-03 in ticket 50, decision 10 (orchestrator, full AFK mode).
3. **Forced colours on surfaces and paint.** Impact LOW, confidence MEDIUM. Under forced colours, a `surface` fill or a `yetiPaint` band loses its tone, and a `yetiBorder` edge stays (inferred, not measured). Neither draws a state, forced colours is not an AA criterion (ticket 17; ADR 0015 consequences), and Part 2 row 1 has no ledger row. **Recommendation:** add no ledger row and no package CSS. Keep the e2e case that records the border surviving `forcedColors: 'active'`. Revisit if the ledger is read as covering every forced-colours difference, not only lost states.

   Decided 2026-10-03 in ticket 50, decision 30 (orchestrator, full AFK mode).
4. **Which `yetiText` values the `box--text` story shows.** Impact LOW, confidence MEDIUM. No record says which of the 20 values clear 4.5:1 on the page surface in both schemes. **Recommendation:** the implementer measures them with the play function's formula. Passing values go in `box--text` and failing ones in `box--anti-pattern-low-contrast`. The spec states no list. No decision needed beyond accepting that.

   Decided 2026-10-03 in ticket 50, decision 31 (orchestrator, full AFK mode).

No open point has HIGH impact with confidence below HIGH, so none needs a trap-quadrant record. None blocks the spec.
