# 74. Spec: badge (component)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `badge` component, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/badge.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Two points no record settles. Neither is HIGH impact, so neither is a trap-quadrant decision.

1. **Which elements may host `yetiBadge`, and so where HTML `size` is `inert`** (LOW impact, MEDIUM confidence). Ticket 26 row 92 marks `size` as `inert` "on Yeti's hosts" without naming them, and building-blocks 1.4 asks each spec to state the kind on the hosts it allows. The spec's reading (usage rule 1): a non-interactive inline element, `span` as every Yeti example writes it (`Y/src/components/badge/example.html`, `docs.md`, `card/example.html:6`), or `strong`, `em`, `small`, `mark`, `data`, or `time`; never a link, a button, or a form control, from the manifest's "A badge is text". HTML `size` does nothing on any of them. **Recommendation:** accept the reading as written. A badge may sit inside a link or a control; a badge-styled link or control is out of scope. To overrule: widen the host list in usage rule 1 and section 2, and check that HTML `size` stays inert on each added host (it is not inert on `input` or `select`). Decided 2026-10-03 in ticket 50, decision 77 (orchestrator, full AFK mode).
2. **Forced colours** (LOW impact, MEDIUM confidence). Yeti has no `forced-colors` rule (ticket 17 section 2.6), and ticket 17 did not screenshot the badge under forced colours. The badge's word stays readable in system colours and its hue is decoration (usage rule 3), so no AA criterion depends on the tint. Its `solid transparent` border may be drawn in a system colour, giving the boundary Material's badge draws with an outline (`NC/src/material/badge/badge.scss:102-105`); that is inferred, not measured. **Recommendation:** no ledger row and no package CSS, after the `lift` and `box` precedents (ticket 50 decisions 26 and 30: the item draws no state); the spec's layer-4 case asserts the text's contrast under `forcedColors: 'active'` and records the border's computed colour and a screenshot in three engines. To overrule: add a ledger row owned by `badge` and one `@layer ngx-yeti` rule after Material's outline, and turn the recorded case into an assertion. Decided 2026-10-03 in ticket 50, decision 78 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/badge.md](../specs/badge.md).

One item directive, `[yetiBadge]` (`YetiBadge`, `exportAs: 'yetiBadge'`, entry point `ngx-yeti/badge`), binding the static class `badge`, the presence attribute `data-ngx-yeti-item-badge`, and `data-variant`, `data-emphasis`, and `data-size` from `variant: YetiVariant`, `emphasis: YetiEmphasis`, and `size: YetiSizeControl` (ticket 26 rows 90 to 92; `size` is `inert`). Native platform, level 1, types only; no Module, no Aria, no CDK, no ledger row (Part 2 row 24). It loads `components/badge/badge.css` as a counted link (ADR 0060), which closes the `hydrate never` loss ticket 18 measured for the badge; layer 4 keeps that as a regression case. The manifest's accessibility notes become usage rules asserted in every story (ADR 0015 point 4), and the play functions assert 4.5:1 text contrast for every hue and emphasis shown, in both schemes (ticket 50 decision 8).

Counts: 44 user stories, 2 open points (both LOW impact; neither blocks the spec).
