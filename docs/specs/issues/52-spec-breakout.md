# 52. Spec: breakout (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `breakout` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/breakout.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/breakout.md](../specs/breakout.md).

Three directives in `ngx-yeti/breakout`, native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 2): the item directive `YetiBreakout` on `[yetiBreakout]` (static `breakout` class, `max: YetiWidth` and `gap: YetiGap` bound to `data-max` and `data-gap`, the presence attribute `data-ngx-yeti-item-breakout` of [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), the `breakout` item file as a counted link, `yetiBreakoutToken`); the part directive `YetiBreakoutChild` on `[yetiBreakoutChild]` (`bleed` with `booleanAttribute`, ticket 26 row 10, kind C); and the part directive `YetiBreakoutNote` on `[yetiBreakoutNote]` (static `data-note`, ticket 26 row 11, kind P). `max` is confirmed `inert` on the breakout's hosts. The spec owns ledger row A11Y-10c and meets it with exact-formula contrast assertions on the heading, a paragraph, and a note in both schemes ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3). Checked at the pin: none of the three class names is among the 46 names `yeti.d.ts` exports.

Counts: 43 user stories, 6 usage rules, 5 story ids, 4 open points (none HIGH impact, so none is in the trap quadrant). No ledger or upstream-bug row is written by this ticket; open points 3 and 4 ask the orchestrator for one correction and one row.

### Open

1. **Whether the part directives also mark their hosts and acquire the item file** (spec sections 3, 4, and the layer-2 cases). [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2 says "Every directive and component sets" the host attribute and acquires its item; [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) says "Each item directive". The spec reads it as the item directive only. Options: (a) only `YetiBreakout` marks and acquires; (b) all three do. Recommendation: (a). The parts' rules are `.breakout > [data-bleed]` and `.breakout > [data-note]`, so they style nothing without a connected `.breakout`, whose own presence attribute already keeps the link; (b) adds an attribute per marked child to the server HTML and a counter per part for no visible effect. To overrule: give both parts the static `data-ngx-yeti-item-breakout` host attribute and the acquire and release calls, and flip the layer-2 case. The same reading applies to every multi-part item, so the decision should be stated once for all of them. Impact: MEDIUM (consistency across the multi-part specs; no visible behaviour changes either way). Confidence: MEDIUM.

   Decided 2026-10-03 in ticket 50, decision 6 (orchestrator, full AFK mode).
2. **The contrast threshold** (spec section 7 and layer 1). No record says whether the heading, which is large text at Yeti's default size, is held to 3:1 or 4.5:1. Recommendation: 4.5:1 for every text checked (heading, paragraph, note), as [lede](46-spec-lede.md)'s open point 1 recommends, because the stricter threshold holds for any size a theme sets; the note is small text, so 4.5:1 is required for it anyway. Decide both tickets the same way. Impact: MEDIUM (a 3:1-only pass would need a package rule under A11Y-10a). Confidence: HIGH.

   Decided 2026-10-03 in ticket 50, decision 8 (orchestrator, full AFK mode).
3. **Ledger A11Y-10c's "What Yeti does" cell** reads "as A11Y-10b" (text over an image; the author owns it). Yeti's example has a bleeding image, but no text sits over it, and ticket 17's incomplete result names the example's heading as "partially obscured" (Chromium and Firefox; cause not traced). Recommendation: the orchestrator edits the cell to "Plain text on the page surface; axe left `color-contrast` incomplete on the example's heading as partially obscured, cause not traced", as lede's open point 2 asks for A11Y-10e, and leaves the other columns. Impact: LOW (documentation only). Confidence: HIGH that the current cell does not describe the breakout; MEDIUM on the cause.

   Decided 2026-10-03 in ticket 50, decision 24 (orchestrator, full AFK mode).
4. **Yeti's manifest support block for `breakout`** lists "grid named lines" and "min() in track sizes" but not `:has()` (`breakout.css:18`) or container queries (`breakout.css:18`, `:45`), which `research/browser-baseline-vs-yeti.md` already notes for this and four other manifests. Both are inside Baseline 2025, so the package does nothing either way. Recommendation: one upstream-bugs row for the omitted `:has()` declarations across the five manifests the research names (read; no minimal reproduction; not filed), merged with lede's proposed Y8 if the orchestrator adds it. Impact: LOW. Confidence: MEDIUM (Yeti may leave features inside its own target out of the list on purpose; nothing read says so).

   Decided 2026-10-03 in ticket 50, decision 25 (orchestrator, full AFK mode).
