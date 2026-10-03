# 57. Spec: cover (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `cover` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/cover.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Each point is marked "(open: see ticket)" in the spec. Impact and confidence follow the trap-quadrant rule (map, Standing rulings, 2026-10-03). Neither point is in the trap quadrant.

1. **Does `YetiCoverChild` set a presence attribute and acquire the `cover` item file?** (spec sections 3 and Further Notes, Design decisions). Impact MEDIUM: the same question arises for every item with part directives, and ADR 0060 point 2 says "every directive and component" sets the host attribute and acquires, while ADR 0045 speaks of each "item directive". Confidence HIGH. Recommendation: no. Only `YetiCover` marks its host and acquires. Reason: the `data-center` rule is `.cover > [data-center]`, so it matches only under a `.cover` host, whose own presence attribute holds the link for as long as it is connected, in every rendering mode (ADR 0060 point 4). A part acquiring too would add one attribute per centered child to the server HTML and change nothing a reader sees. This is the same reading the breakout spec gives its parts, so the orchestrator can decide it once for every spec, as a note on ADR 0060 point 2. To overrule: add `data-ngx-yeti-item-cover` and the acquisition to `YetiCoverChild`, and turn the layer-2 case "the part carries no presence attribute and acquires no link" around.
   Decided 2026-10-03 in ticket 50, decision 6 (orchestrator, full AFK mode).
2. **Yeti's committed layouts guide lacks the `data-height` row** (spec section 1). Impact LOW, confidence HIGH. At the pin, the generated attribute table in `src/guides/layouts.md` has no `data-height` row, while the table the docs build writes from the manifests has `| data-height | sm, md, lg, xl, half, full | cover, hero |` (read in `D:/tmp/ngx-yeti-02/yeti/docs/guides/layouts.md:104`; the generator, `bin/gen-docs.js:266-294`, adds every manifest attribute). So the committed copy is stale and the published docs are right. The package follows the manifest, so the spec is not affected. Recommendation: add a Yeti row to `upstream-bugs.md` (docs only, verified "read", no reproduction needed), with no upstream report unless the user confirms one (map, Standing rulings, item 44).
   Decided 2026-10-03 in ticket 50, decision 34 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/cover.md](../specs/cover.md).

- User stories: 45.
- Open points: 2 (above), neither in the trap quadrant and neither blocking the spec.
- `YetiCover` (`[yetiCover]`, `exportAs: 'yetiCover'`) binds the class `cover`, `gap` (`YetiGap`) and `height` (`YetiHeight`, an `inert` presentational-attribute input on the cover's hosts), sets `data-ngx-yeti-item-cover` (ADR 0045), acquires the item file, and provides `yetiCoverToken`. `YetiCoverChild` (`[yetiCoverChild]`) binds `data-center` from a boolean `center` input (ADR 0070 kind C). Both are types only; Yeti has no module for the cover.
- No ledger row: the cover conforms as measured in ticket 17 (axe clean, no reflow overflow at 320 px), and the spec adds no contrast assertion beyond the Story gate.
- One cross-item order is named and tested: `.cover > *` and `.center` tie in `yeti.layouts`, and ADR 0060 point 3's insertion order keeps a center inside a cover centred (read, not measured; a layer-4 case measures it).
