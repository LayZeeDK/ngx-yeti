# 62. Spec: masonry (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `masonry` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/masonry.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/masonry.md](../specs/masonry.md).

One item directive in `ngx-yeti/masonry`: `YetiMasonry` on `[yetiMasonry]`, `exportAs: 'yetiMasonry'`. It binds a static `masonry` class and the presence attribute `data-ngx-yeti-item-masonry` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and binds `data-min`, `data-columns`, and `data-gap` from `min: YetiWidthOrNone` (`inert`), `columns: YetiColumns`, and `gap: YetiGap` ([ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 45 to 47). It acquires the `masonry` item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). No part directive and no injection token, because the manifest has no marker. Native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 12). Checked at the pin: `YetiMasonry` is not among the 46 names `yeti.d.ts` exports, and all three input types are.

Browser target and modules, read at the pin: the item has no Module (`js: null`). The fallback path uses multi-column layout and `break-inside`, both Baseline high and inside the target. The only feature outside the target is native masonry (`grid-template-rows: masonry`). Yeti guards it with `@supports` and falls back to multi-column, so the package adds no guard. Which target engines pass the guard is not confirmed (it has no compat key; upstream-bugs Y6).

Reading order: the layout never changes the DOM, so focus and the accessibility tree follow source order. The multi-column path draws items down each column, then across, and Tab follows that. The native path draws them roughly across, and Tab can step between tracks. Usage rules 3 and 4 leave the risk with the author, as Part 2 row 12 records (WCAG 1.3.2, 2.4.3). Tests branch on `CSS.supports` in test code, as Yeti's own test does.

Counts: 45 user stories, 8 usage rules, 7 story ids, 2 open points. Neither has HIGH impact, so neither is in the trap quadrant. The spec writes no ledger or upstream-bug row.

### Open

1. **Whether masonry's reading-order risk is also a ledger row** (spec section 7 and the Design decisions table). Part 2 row 12 says "Ledger: none" and makes the risk a usage rule. The [ledger](../ledger.md)'s header asks for "every accessibility gap found in Yeti, whether or not the package closes it", and it already holds author-owned rows (A11Y-10b: "the author owns it"). Ticket 17 named this risk ("a 1.3.2 risk the author owns (read)"). The building-blocks row also covers only the fallback's column-first order (1.3.2). It does not cover the native path, where Tab can step between tracks (2.4.3, inferred from the CSS Grid Level 3 placement model, not measured).
   - Recommendation: add one row, `A11Y-<next>`, item `masonry`, source WCAG 2.2 1.3.2 and 2.4.3, "What Yeti does": the manifest's `a11y.notes`, "What the package adds": "none; usage rules 3 and 4 state the author's responsibility", verified "read", Tested by L1 and L4 (`masonry--order`), owner `masonry`. Also widen Part 2 row 12's usage-rule wording to both paths. If the orchestrator agrees, the spec's "Ledger rows owned" line names the row. Nothing else changes.
   - Alternative: keep "Ledger: none", because the package adds nothing. Dismiss it: the ledger's own scope sentence covers gaps the package does not close, and lede and layer set the precedent.
   - Impact: MEDIUM (documentation, plus one test cited as the row's evidence; no API change). Confidence: MEDIUM. Decided 2026-10-03 in ticket 50, decision 53 (orchestrator, full AFK mode).
2. **building-blocks 1.2's table omits native masonry** from the column "Yeti guards it in CSS with a stated fallback". Its "Not usable" column also does not name it. Recommendation: add "native masonry (`grid-template-rows: masonry`, `Y/src/layouts/masonry/masonry.css:29`; fallback: multi-column layout, items read down each column)" to the middle column. Impact: LOW (wording). Confidence: HIGH (read in `masonry.css` and `research/browser-baseline-vs-yeti.md` section 5.2). Decided 2026-10-03 in ticket 50, decision 54 (orchestrator, full AFK mode).
