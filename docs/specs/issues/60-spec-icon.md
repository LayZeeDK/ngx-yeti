# 60. Spec: icon (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `icon` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/icon.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/icon.md](../specs/icon.md).

One directive in `ngx-yeti/icon`, native platform, level 1, types only ([building-blocks.md](../building-blocks.md) Part 2 row 10): the item directive `YetiIcon` on `[yetiIcon]`, `exportAs: 'yetiIcon'`. It binds the static `icon` class and the presence attribute `data-ngx-yeti-item-icon` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), binds `data-gap` and `data-align` from `gap: YetiGap` and `align: YetiAlign` ([ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 40 and 41), removes the HTML `align` attribute (kind `removed`, building-blocks 1.4), and acquires the `icon` item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). No token, no part directive, no listener. Checked at the pin: `YetiIcon` is not among the 46 names `yeti.d.ts` exports.

The accessible name follows Yeti's manifest note and stays the consumer's (Part 2 row 10; building-blocks 1.10, Names): a decorative SVG beside text gets `aria-hidden="true"`, a meaningful SVG that stands alone gets `role="img"` and an `aria-label`, and a meaningful SVG beside text gets the same so its information joins the text. The directive writes no ARIA and declares no name input. Every story asserts the rule ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4), and the standalone story asserts 3:1 non-text contrast for the meaningful SVGs (point 3). The spec owns no ledger row.

Counts: 46 user stories, 8 usage rules, 4 story ids, 4 open points (one in the trap quadrant, shared with [ticket 55](55-spec-columns.md)'s point 1).

### Open

1. **A static `align="baseline"` against the hydration rule** (spec sections 2, 10, 11, usage rule 4, and the SSR smoke). Impact: HIGH (it applies to every `removed`-kind input: `align` on 8 items, `border`, `start`). Confidence: MEDIUM. This is the same point as [ticket 55](55-spec-columns.md) open point 1, which holds the full record; decide both together.
   - Option A (recommended): accept the static form. The server HTML has no `align`; hydration writes it back and the constant `null` binding removes it in the same pass, so the final DOM equals the server's. Approve because building-blocks 1.4 asks the SSR smoke to write the static form, and `align="baseline"` then works like every other static input. Evidence: ticket 33's reading (read, not run); that no frame paints the hint is inferred. The spec's fixture-app e2e checks no `NG05xx` and no `align` after hydration.
   - Option B: a usage rule that `align` is bound only (`[align]="'baseline'"`). Dismiss because it breaks the uniform static-input form and contradicts building-blocks 1.4's SSR-smoke instruction, while the forbidden form fails silently with the same final DOM.
   - To overrule: replace the static `align` in the spec's examples, usage rule 4, the layer-2 test host, the SSR smoke, and the `icon--settings` story with a bound `[align]`, and state "never write `align` statically". If the e2e case finds an `NG05xx` or a painted hint, B wins.
   Decided 2026-10-03 in ticket 50, decision 9 (orchestrator, full AFK mode).
2. **Target size of an icon-only control** (usage rule 6; section 7, 2.5.8; the `icon--standalone` story). No record covers it. An icon-only `yetiIcon` host with no `yetiButton` is one em square, about 16 by 16 CSS pixels at Yeti's default text size, below WCAG 2.2 2.5.8's 24 by 24 unless the spacing exception holds. Recommendation: a usage rule, an icon-only `yetiButton` in the standalone story, and a play-function assertion that its box is at least 24 by 24; no package CSS, because Yeti's CSS does not fail here, the consumer's choice of host does (the user's "Accessibility CSS: Yes." covers gaps in Yeti's CSS), and no ledger row. Alternative dismissed: a package rule giving `.icon` a 24 px minimum when it holds only an SVG, which would change Yeti's layout for icons in running text, where 2.5.8's inline exception applies. Impact: MEDIUM. Confidence: MEDIUM (the button's computed size at the pin is read from `--yeti-control-size`, not measured).
   Decided 2026-10-03 in ticket 50, decision 38 (orchestrator, full AFK mode).
3. **`yetiIcon` on a table cell** (usage rule 5; section 3). `yetiTableCell` declares `align` typed `Extract<YetiAlign, 'start' | 'center' | 'end'>` (ticket 26 row 151), so both directives on one `td` would declare one input with different types, which building-blocks 1.4 forbids; Yeti's table docs already wrap the SVG in an icon inside the cell. Recommendation: keep the usage rule, and have the table spec (ticket 89) state the same rule from its side. Impact: LOW. Confidence: HIGH.
   Decided 2026-10-03 in ticket 50, decision 39 (orchestrator, full AFK mode).
4. **Where an icon-only button's name sits** (usage rule 3; the examples). Yeti's icon manifest puts `role="img"` and `aria-label` on the SVG; Yeti's button docs say "An icon-only button needs an `aria-label`" (`Y/src/components/button/docs.md:40`). Both give the same computed name. Recommendation: the icon spec's examples use the icon manifest's form, the usage rule accepts both, and the tests assert the control's computed name, not where the label sits; the button spec (ticket 76) should say the same. Impact: LOW. Confidence: HIGH.
   Decided 2026-10-03 in ticket 50, decision 40 (orchestrator, full AFK mode).
