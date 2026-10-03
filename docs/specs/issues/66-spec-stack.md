# 66. Spec: stack (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `stack` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/stack.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/stack.md](../specs/stack.md).

The spec gives `ngx-yeti/stack` two types-only directives: `YetiStack` on `[yetiStack]` (`gap`, `align`, `fill`, `rule`; `align` is `removed`, `fill` is `inert`; presence attribute `data-ngx-yeti-item-stack`; provides `yetiStackToken`) and `YetiStackChild` on `[yetiStackChild]` (`split`, `space`, `sticky`; kind C, optional `skipSelf` token, no presence attribute). Every decision cites building-blocks Part 2 row 16, ticket 26 rows 61 to 67, ADR 0070 (which names this child directive and its three inputs), ADRs 0045 and 0060, and the orchestrator's decisions of 2026-10-03 in [ticket 50](50-decide-open-points-of-the-specs.md). Two readings of Yeti at the pin shape it: `data-sticky`'s rule is in the always-loaded `attributes.css` and not scoped to a parent, so a sticky child pins without the item file; and the `stack`/`center` tie inside `yeti.layouts` (ticket 23) gets a layer-4 case.

Counts: 46 user stories, 2 open points.

### Open

1. **A pinned child and WCAG 2.4.11 Focus Not Obscured (Minimum).** Impact MEDIUM, confidence MEDIUM. A `sticky` child stops at `--yeti-sticky-offset`, and Yeti's root scroll padding defaults to that offset, which is a gap, not the child's height (`Y/src/tokens/space.css`, comments above `:61` and `:69`; `Y/src/base/typography.css:7-8`). A pinned child taller than the offset can therefore cover a control that focus pulls into view. Options: (a) a usage rule that the consumer sets `--yeti-scroll-padding` on `:root` to the pinned child's height, with a layer-4 Tab case, and no ledger row, because the package adds nothing Yeti lacks; (b) the child directive measures its height and writes the token, which breaks "types only" (building-blocks 1.2) and writes a root token from an item (ADR 0004), and needs a `ResizeObserver` (building-blocks 1.7); (c) a ledger row recording the gap as Yeti's. **Recommendation: (a)**, because Yeti's own token comment names this exact use ("a control pulled into view by focus"), the [fragment-links](../specs/fragment-links.md) spec already leaves sticky offsets to the consumer (its usage rule 4), and the offset depends on content only the consumer knows. To overrule toward (b), add the observer to `YetiStackChild` and a ledger row; toward (c), add a ledger row with "Tested by" L4. Decided 2026-10-03 in ticket 50, decision 49 (orchestrator, full AFK mode).
2. **The rule's line under WCAG 1.4.11 Non-text Contrast.** Impact LOW, confidence MEDIUM. The line is a pseudo-element with empty content that the manifest calls "Purely visual"; the spec reads it as decorative, so 1.4.11 asks no ratio and no play function asserts one. **Recommendation:** keep that reading. To overrule, add a play-function assertion of 3:1 between `--yeti-color-border` and the surface behind the stack, and a ledger row if Yeti's default fails. Decided 2026-10-03 in ticket 50, decision 58 (orchestrator, full AFK mode).
