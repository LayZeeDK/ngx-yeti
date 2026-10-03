# 65. Spec: sidebar (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `sidebar` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/sidebar.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

The point is marked "(open: see ticket)" in the spec. Impact and confidence follow the trap-quadrant rule (map, Standing rulings, 2026-10-03).

1. **A sticky child over stacked content: what the package does about it** (spec sections 4 usage rule 4, 7, Testing Decisions layer 4, Further Notes). Impact: HIGH, because it decides whether the package's WCAG 2.2 AA claim for `sticky` rests on a usage rule, a ledger row, or the package's own CSS, and the same question reaches `stack`'s and `shell`'s `sticky` (ticket 26 rows 67 and 86). Confidence: MEDIUM. So it is in the trap quadrant.
   - **Question.** Side by side, a sticky child covers nothing. Once the pair has stacked, a sticky child that comes first in the stacked order sits above the content scrolling under it (`[data-sticky]` has `z-index: 2`, `Y/src/layouts/attributes.css:333-342`). A control that focus scrolls into view stops at `--yeti-scroll-padding` from the top, which defaults to the sticky offset (`Y/src/tokens/space.css:56-69`), so Shift+Tab can put a focused link entirely behind the stuck child (WCAG 2.2 2.4.11). A sticky child taller than the viewport also keeps its own lower content out of reach until the container ends (1.4.10 at 320 x 256). Ticket 17 measured the sidebar example clean, but that example has no sticky child. What does the package do?
   - **Option A (recommended): a usage rule, a ledger row, and a layer-4 measurement; no package CSS.** Usage rule 4: stick only a child that fits the smallest supported viewport, and where a stuck first child sits above stacked content, set `--yeti-scroll-padding` on the root to at least its height, or stick only a child that comes last. A new ledger row, owned by `sidebar` (WCAG 2.2 2.4.11 and 1.4.10; Yeti does what its CSS says; the package adds the usage rule; verified *inferred*; tested by L4), which `stack` and `shell` can share. Layer 4 asserts the Shift+Tab walk with the rule followed and records the walk with Yeti's defaults. Approve because it follows [ticket 50](50-decide-open-points-of-the-specs.md) decision 32 (a usage rule where the package cannot fix Yeti's CSS without its private tokens) and decision 17 (every gap found is a row, with no unmeasured CSS), and uses Yeti's own tokens for this exact purpose (`Y/src/tokens/tokens.json:125-126`, `Y/src/guides/layouts.md:115`).
   - **Option B: a package rule in `@layer ngx-yeti`** under the user's ruling "Accessibility CSS: Yes." (map, Standing rulings). Dismiss for now: CSS cannot tell when the sidebar has stacked, because the switch is flex-basis arithmetic with no container query, and a rule that unsticks children everywhere removes the feature side by side. A scroll-state container query (`@container scroll-state(stuck: top)`) could react to the stuck state, but it is not in the Baseline 2025 target (inferred, not checked against web-features data).
   - **Option C: remove the `sticky` input from `YetiSidebarChild`.** Dismiss: it breaks ticket 26 row 60 and ADR 0003 point 2 (every marker set from a typed input), and leaves the consumer no way to write the marker.
   - **Option D: no row and no rule, treating it as Yeti's design.** Dismiss: decision 32 dismissed the same option ("the package's AA requirement is never a recommendation"), and decision 17 dismissed "no row" because the ledger records Yeti's gaps too.
   - **Evidence and confidence.** The stacking geometry and the z-index: read in `sidebar.css` and `attributes.css` (HIGH). That focus scrolling honours the root scroll padding and so leaves a focused link under the stuck child: inferred from the CSS scroll-padding model, not measured (MEDIUM). Whether a usage rule meets the map's accessibility line: a reading of the records, with decision 32 as precedent (MEDIUM).
   - **To overrule.** For B, add the rule to the package's accessibility stylesheet, set the row's "What the package adds" to it, and turn layer 4's recorded walk into an assertion. For D, remove usage rule 4's second sentence, the row, and the layer-4 walk. If the recorded walk shows a focused link fully hidden even with the usage rule followed, A fails and B (or a new decision) is needed. Decided 2026-10-03 in ticket 50, decision 47 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/sidebar.md](../specs/sidebar.md).

Two directives in `ngx-yeti/sidebar`. The item directive `YetiSidebar` on `[yetiSidebar]` (`exportAs: 'yetiSidebar'`) binds the static class `sidebar` and the presence attribute `data-ngx-yeti-item-sidebar` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), binds `data-side`, `data-width`, `data-gap`, and `data-align` from `side: YetiSide`, `width: YetiWidth` (`inert`), `gap: YetiGap`, and `align: YetiAlign` (`removed`), acquires the item file, and provides `yetiSidebarToken`. The part directive `YetiSidebarChild` on `[yetiSidebarChild]` binds `data-sticky` from a boolean `sticky` input (ticket 26 rows 56 to 60). Both are types only; Yeti has no module for the sidebar. Neither class name is among the 46 that `yeti.d.ts` exports, so both take `Yeti`.

Counts: 49 user stories, 8 usage rules, 6 story ids, 1 open point (HIGH impact, MEDIUM confidence, so it is in the trap quadrant and is recorded with its options above). The open point does not block the spec: the spec carries option A, and option B would add a rule without changing the API. The spec writes no ledger or upstream-bug row itself; option A proposes one ledger row for the orchestrator to add. It names one cross-item order (`.sidebar > *` against `.center`, kept by ADR 0060 point 3's insertion order; read, not measured; a layer-4 case measures it).
