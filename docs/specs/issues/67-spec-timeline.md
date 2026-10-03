# 67. Spec: timeline (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `timeline` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/timeline.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/timeline.md](../specs/timeline.md).

One item directive in `ngx-yeti/timeline`: `YetiTimeline` on `ol[yetiTimeline]`, `exportAs: 'yetiTimeline'`. It binds a static `timeline` class and the presence attribute `data-ngx-yeti-item-timeline` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It binds `data-gap` from `gap: YetiGap` and `data-alternate` from `alternate: boolean` with `booleanAttribute` ([ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 68 and 69). It acquires the `timeline` item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). There is no part directive and no injection token, because the manifest has no marker. Neither input is named like an HTML attribute. Native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 17). Checked at the pin: `YetiTimeline` is not among the 46 names `yeti.d.ts` exports, and `YetiGap` is.

Browser target, read at the pin: the item file uses container size queries, logical insets, and Baseline-high features only. Nothing is guarded and nothing is outside the target. No Module (`js: null`).

List semantics: the selector enforces the `ol`. `role="list"` (WebKit), `li`-only children, and a `time` with `datetime` in each entry are usage rules, from the manifest's `a11y.notes` and Part 2 row 17. The rail and the entry dots are empty-content pseudo-elements, so they add nothing to the accessibility tree. Visual, reading, and focus order equal source order in both modes. VoiceOver in Safari is a manual release test, because the automated layers compute roles from the DOM.

Contrast (ledger A11Y-10a, owned): the play functions assert that no entry dot overlaps its `time`. They then assert 4.5:1 with the exact formula for every `time`, heading, and paragraph, in light and dark, single-sided and alternating. The row's "What the package adds" column is confirmed as written.

Counts: 47 user stories, 10 usage rules, 7 story ids, 4 open points. None has HIGH impact, so none is in the trap quadrant. No ledger or upstream-bug row is written by this ticket.

### Open

1. **The architecture guide's example `li[yetiTimelineEntry]`** (spec section 3). [architecture-guide.md](../architecture-guide.md)'s glossary row for a part directive lists `li[yetiTimelineEntry]` "where the entry carries a marker". At the pin no timeline entry carries a marker (manifest `markers` empty; ticket 26 has only rows 68 and 69), so the directive does not exist. Recommendation: remove the example from that row, or mark it hypothetical. Impact: LOW (wording; the guide ranks below the records). Confidence: HIGH (read). Decided 2026-10-03 in ticket 50, decision 63 (orchestrator, full AFK mode).
2. **WCAG 1.4.11 for the rail and the entry dots** (spec section 7 and usage rule 7). The manifest calls them decorative, so the spec does not apply 1.4.11 and writes no assertion. Yeti's hex comments put `--yeti-color-border-strong` at about 2.1:1 against `--yeti-color-surface` in the light scheme (computed from the comments; not measured). Recommendation: keep the reading. Add no ledger row, since no criterion fails while the dots carry no meaning. Keep usage rule 7, which keeps status or meaning out of the dots. Alternative: a ledger row recording the low ratio as a gap. Dismiss it: 1.4.11 does not cover decorative graphics, and the ledger records gaps against a source. Impact: LOW. Confidence: MEDIUM (whether the rail helps someone understand the sequence is a judgement; the `ol` and `time` carry the sequence on their own). Decided 2026-10-03 in ticket 50, decision 64 (orchestrator, full AFK mode).
3. **Another item on an entry or inside it** (spec section 3, usage rule 6). `.timeline > *` sets the entry's `margin` and `padding-inline-start`. An item directive on the same `li` (`yetiBox`, `yetiCard`) brings its own padding rules in `yeti.layouts` or `yeti.components`, and which one wins was not measured. Recommendation: keep the usage rule ("put another item inside the `li`, not on it"). Add one layer-1 case later only if the composition is wanted. Impact: LOW. Confidence: MEDIUM (inferred from layer order; not measured). Decided 2026-10-03 in ticket 50, decision 65 (orchestrator, full AFK mode).
4. **Usage rule 8, a timeline in a shrink-to-fit parent.** `container-type: inline-size` gives the list inline-size containment, so inside a flex item with no basis, an inline-block, or a float it sizes as if empty and collapses (inferred from CSS containment; not measured; no record covers it). Recommendation: keep the rule, and add one layer-4 measurement, a timeline inside a `cluster`, in three engines, to confirm it. Impact: LOW. Confidence: MEDIUM. Decided 2026-10-03 in ticket 50, decision 66 (orchestrator, full AFK mode).
