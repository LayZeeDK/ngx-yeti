# 64. Spec: scroller (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `scroller` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/scroller.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/scroller.md](../specs/scroller.md).

49 user stories; 4 open points, none in the trap quadrant (no point is HIGH impact). One item directive, `YetiScroller` on `[yetiScroller]`, with `gap`, `width`, `snap`, and `justify` (ticket 26 rows 52 to 55), the static host attributes `role="region"` and `tabindex="0"` (building-blocks Part 2 row 14), the presence attribute `data-ngx-yeti-item-scroller` (ADR 0045), and the name left to the consumer as a usage rule (building-blocks 1.10). Native platform, level 1, with no listener, render callback, or service; no ledger row.

Keyboard access (WCAG 2.1.1) rests on the static `tabindex` and the browser's own arrow-key scrolling, which ticket 17 measured in three engines. axe's `scrollable-region-focusable` (tags `wcag2a`, `wcag211`, `wcag213`, read in axe-core 4.11.0's source in this repository's `node_modules`) runs in the Story gate on every story whose track overflows. Layer 4 adds a control: on the keyboard story, the rule alone passes, and after the test removes `tabindex` it reports one violation. That proves the rule applied, rather than having been skipped for a track that did not overflow.

Checked: the manifest, CSS, docs, example, validator, and Yeti's own test and fixture at the pin; Angular's attribute merge order (`elements.ts:54-55`, `directives.ts:198-200`); the axe rule definition; the CDK scrolling directives' host bindings. Inferred, and marked so in the spec: ARIA in HTML's allowed roles for the host rule; that a scroll or focus made before hydration survives it (a layer-4 case measures it); right-to-left `scrollLeft` signs.

### Open

1. **Hosts limited to `div` and `section`** (usage rule 1). The static `role="region"` that Part 2 row 14 decided replaces the host's own role, so on a `ul`, `ol`, or `table` it would remove list or table semantics (an `li` would lose its list). Recommendation: keep the usage rule as written; the Story gate's `aria-allowed-role` and `listitem` report the list case. Impact MEDIUM (it narrows where the directive may go), confidence MEDIUM (ARIA in HTML's allowed-roles table, from reading, not re-checked in its source). Decided 2026-10-03 in ticket 50, decision 59 (orchestrator, full AFK mode).
2. **The `justify` type's name** (contract mapping; API). ADR 0070 rule 2 types it `Extract<YetiJustify, 'start' | 'center' | 'end'>`, and ADR 0080 point 5 names an attribute's own value list `Yeti<Item><Input>`. The spec declares `YetiScrollerJustify` as that `Extract`, exported beside the re-exported vocabulary types and checked against the 46 names (no collision). The [cluster](../specs/cluster.md) spec writes the `Extract` inline when it refers to the scroller. Recommendation: keep the named type and let the consistency review align the cluster spec's wording. Impact LOW, confidence HIGH. Decided 2026-10-03 in ticket 50, decision 60 (orchestrator, full AFK mode).
3. **No other `display`-setting layout on the scroller's element** (usage rule 5). `justify` is narrower here than on `cluster`, `columns`, and `pagination`, which building-blocks 1.4 would forbid on one element. Recommendation: the usage rule, the same reading the cluster spec made; `yetiBox` beside it stays allowed (one shared `gap`, ticket 26 Q16). Impact LOW, confidence HIGH. Decided 2026-10-03 in ticket 50, decision 61 (orchestrator, full AFK mode).
4. **A 3:1 focus-ring contrast assertion in `scroller--keyboard`** (WCAG 1.4.11). The scroller is the only layout with a Tab stop, and ticket 17 measured ring contrast on one control only. ADR 0015 point 3 puts what axe does not check in a play function. Recommendation: keep the assertion (3:1, the non-text threshold; the brief's 4.5:1 rule is for text). Impact LOW, confidence MEDIUM. Decided 2026-10-03 in ticket 50, decision 62 (orchestrator, full AFK mode).
