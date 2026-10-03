# 54. Spec: cluster (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `cluster` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/cluster.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **Does the hydration usage rule cover the static form of a `removed` input (`align="baseline"`)?** Impact MEDIUM, confidence MEDIUM.
   - **The point.** Building-blocks 1.4 lets a consumer write `align="end"` as the input's static form and has the directive bind `'[attr.align]': 'null'` (the `removed` kind, ticket 26 row 16). The hydration section of building-blocks and ticket 33 row 5 say a consumer writes no static attribute that a directive binds, because hydration writes the static value back for one pass. Ticket 33 row 6 reads that the static `align` is written back and removed again in the same hydration pass, and infers that no frame is painted between the two. No record says which rule wins for a `removed` input. The case recurs on every item with an `align` input (cluster, columns, hero, icon, layer, media, sidebar, stack, and the table cell) and on the other `removed` inputs.
   - **Options.** (a) Keep the static form allowed, as building-blocks 1.4 and architecture-guide P9 write it, and add a layer-4 measurement that records whether a frame is painted with the attribute present. (b) Extend usage rule 2 to `removed` inputs: the consumer writes `[align]="'end'"`, never `align="end"`, so no static `align` exists to rewrite.
   - **Why.** (a) keeps the records as decided and the markup as short as Yeti's; on a flex container a one-pass `text-align` hint changes no layout of the container itself, and the rewrite and removal run in one synchronous hydration pass (read in ticket 33's sources). (b) is safe by construction but contradicts 1.4's premise that the static form is valid and needs a note on 1.4, P9, and every `align` spec.
   - **Recommendation:** (a). The spec marks it (open: see ticket) in sections 4, 8, 10, 11, and the e2e case. To overrule: change usage rule 5 to (b)'s wording, remove the static-form cases from layers 2 and 3, and amend building-blocks 1.4.

   Decided 2026-10-03 in ticket 50, decision 9 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/cluster.md](../specs/cluster.md).

One item directive, `YetiCluster` (`[yetiCluster]`, `exportAs: 'yetiCluster'`, entry point `ngx-yeti/cluster`), types only: the static class `cluster`, the presence attribute `data-ngx-yeti-item-cluster` (ADR 0045), and the inputs `gap` (`YetiGap`), `align` (`YetiAlign`, HTML `align` `removed`), `justify` (`YetiJustify`), and `threshold` (`YetiWidth`), each unset by default (ticket 26 rows 15 to 18; ADR 0070). No module, no events, no ledger row. `YetiCluster` does not collide with Yeti's typings at the pin (checked).

Counts: 47 user stories, 1 open point (above).
