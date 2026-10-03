# 43. Spec: attention (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `attention` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/attention.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

None of the four points has HIGH impact, so none is in the trap quadrant (map, Standing rulings, 2026-10-03).

1. **The shake's transient overflow at 320 px (WCAG 1.4.10): ledger row or not?** Impact LOW, confidence MEDIUM. Ticket 17 measured a page `scrollWidth` of 329 at 200 ms and 320 at 2.5 s (Chromium). Recommendation: no ledger row. The spec reads it as no 1.4.10 failure, because no content needs two-dimensional scrolling to be read and the throw ends within the 600 ms gesture; test layer 4 asserts that the overflow is gone after the gesture.
   Decided 2026-10-03 in ticket 50, decision 13 (orchestrator, full AFK mode).
2. **Does hydration restart the gesture?** Impact MEDIUM, confidence MEDIUM. Inferred no: hydration writes the same class and attribute values again, which changes no computed style, and a CSS animation restarts only when `animation-name` changes or the element is re-created. Recommendation: accept the reading, and keep the spec's test layer 4 assertion of exactly one `animationstart` per host across load and hydration. If it fails, record an upstream bug and revisit.
   Decided 2026-10-03 in ticket 50, decision 14 (orchestrator, full AFK mode).
3. **A consumer's `--yeti-attention-duration` replaces Yeti's reduced-motion collapse.** Impact MEDIUM, confidence HIGH. An unlayered consumer value beats Yeti's layered token (ticket 04 4.2, measured), and Yeti collapses the token only on `:root` inside `prefers-reduced-motion: reduce`. Recommendation: a documented usage rule: a consumer who sets the duration also sets it to `0.01ms` inside `@media (prefers-reduced-motion: reduce)`. No package code and no input (ADR 0004).
   Decided 2026-10-03 in ticket 50, decision 15 (orchestrator, full AFK mode).
4. **`yetiAttention` beside `yetiEnter` on one element.** Impact LOW, confidence MEDIUM (read in Yeti's CSS, not measured). Both declare `animation` in `yeti.utilities`, and `enter.css` comes later, so the entrance replaces the bare pulse, while `[data-attention="shake"]` sets only the animation name over the entrance's timing. Recommendation: a usage rule that puts the two on different elements (the gesture on a child of the entering element). No check, because checks belong to a later milestone (map, Milestones).
   Decided 2026-10-03 in ticket 50, decision 16 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/attention.md](../specs/attention.md).

The spec has 33 user stories and 4 open points, and none of the open points blocks it. It specifies one item directive, `[yetiAttention]`, with class `NgxYetiAttention` (ADR 0080 point 4) and `exportAs: 'yetiAttention'`. The directive takes the selector-named input `yetiAttention: YetiAttention | ''` (ADR 0070 kind U; ticket 26 row 160). It binds the static class `attention` and `data-ngx-yeti-item`, and it acquires the `attention` item file (ADR 0060). It has no listener, output, method, id, or ledger row (building-blocks row 43).
