# 59. Spec: grid (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `grid` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/grid.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/grid.md](../specs/grid.md).

Two directives in `ngx-yeti/grid`, native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 9): the item directive `YetiGrid` on `[yetiGrid]` (static `grid` class; `min: YetiWidthOrNone`, `columns: YetiColumns`, `gap: YetiGap`, `rows: YetiRows`, `fold: boolean`, `tracks: YetiTracks`, and `threshold: YetiWidth` bound to Yeti's seven attributes, [ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 31 to 37, kind R; the presence attribute `data-ngx-yeti-item-grid` of [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); the `grid` item file as a counted link; `yetiGridToken`), and the child directive `YetiGridChild` on `[yetiGridChild]` (`start: YetiStart` and `span: YetiSpan` bound to `data-start` and `data-span`, rows 38 and 39, kind C). `min`, `rows`, and `span` are confirmed `inert` on the item's hosts; `start` is `removed` with an unconditional `'[attr.start]': 'null'`. Only the item directive marks its host and acquires the item file (the multi-part decision recorded in [ticket 50](50-decide-open-points-of-the-specs.md)). Aria's `ngGrid` is not used. The grid owns no ledger row and needs no contrast assertion. Tailwind's `grid` collision is noted as measured harmless by [ticket 24](24-prototype-ngx-yeti-with-tailwind-v4.md). Checked at the pin: neither class name is among the 46 names `yeti.d.ts` exports.

Counts: 47 user stories, 11 usage rules, 6 story ids, 2 open points (neither HIGH impact, so neither is in the trap quadrant). No ledger or upstream-bug row is written by this ticket.

### Open

1. **An `ol` cell's `start`** (spec sections 2, 4 usage rule 9, and 11). Ticket 26 row 38 makes `start` `removed` "where the child may be an `ol`", and the static-presentational-attribute decision of ticket 50 settles the static form and its hydration pass. Two small things remain unrecorded: (a) whether the `null` binding applies on every host or only on an `ol`, and (b) how a consumer sets an `ol` cell's own first number, which the input now takes over. The spec's reading: bind `'[attr.start]': 'null'` on every host, since `start` means nothing on any other element, and set the numbering with `value` on the first `li`. Options: (i) the reading above; (ii) bind the `null` only when the host is an `ol`, which needs a tag read for no visible gain. Recommendation: (i). To overrule: change the host binding and the layer-2 and layer-3 `ol` cases. Impact: LOW (an `ol` as a grid cell is rare). Confidence: HIGH. Decided 2026-10-03 in ticket 50, decision 51 (orchestrator, full AFK mode).
2. **Yeti's manifest support block for `grid`** lists "grid auto-fit" and "min() and max() inside minmax()" but not container queries (`grid.css`: `container-type: inline-size` for the fold and tracks modes) or subgrid (`grid-template-rows: subgrid` for `data-rows`), though `research/browser-baseline-vs-yeti.md` counts the grid among the users of both. Both are inside Baseline 2025, so the package does nothing either way. Recommendation: add the grid to the upstream-bugs row that [breakout](52-spec-breakout.md)'s open point 4 proposes for features left out of the manifests' support blocks (read; no minimal reproduction; not filed). Impact: LOW. Confidence: MEDIUM (Yeti may leave features inside its own target out of the list on purpose; nothing read says so). Decided 2026-10-03 in ticket 50, decision 52 (orchestrator, full AFK mode).
