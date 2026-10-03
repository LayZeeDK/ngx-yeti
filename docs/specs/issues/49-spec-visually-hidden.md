# 49. Spec: visually-hidden (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `visually-hidden` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/visually-hidden.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Rated by impact and confidence (map, Standing rulings, 2026-10-03, trap quadrant). Neither point is HIGH impact, so neither is in the trap quadrant.

1. **Whether the CDK comparison becomes a ledger row** (spec, Implementation Decisions 5 and 7; Out of Scope). Impact: LOW (a documentation row; no code, no API). Confidence: MEDIUM. Yeti's recipe lacks five things CDK's `cdk-visually-hidden` sets: `margin: -1px`, `border: 0` and `padding: 0`, `outline: 0`, `appearance: none`, and `left: 0` (`right: 0` under RTL) (`NC/src/cdk/a11y/_index.scss:4-34`, read). None is a measured WCAG 2.2 AA failure (ticket 17: axe clean, name measured), and the effects of the missing properties are inferred, not measured. The ledger lists features the package adds and accessibility gaps found in Yeti; the package adds nothing here, and row 49 says "Ledger: none". Recommendation: no ledger row and no package CSS; the spec's property-by-property table is the record. If a later measurement shows a WCAG failure (for example a scroll-width change at 320 px, which the spec's layer-4 case 5 asserts), the owning spec adds a row and one rule in `@layer ngx-yeti` under the accessibility-CSS ruling.
   Decided 2026-10-03 in ticket 50, decision 27 (orchestrator, full AFK mode).
2. **No input for showing the words on a condition** (spec, API, last paragraph; Out of Scope; usage example). Impact: MEDIUM (a public API surface; adding an input later is not breaking). Confidence: HIGH. Material toggles CDK's class with a binding (`NC/src/material/datepicker/datepicker-content.html:38`), but Yeti's manifest declares no attribute for this item, row 49 is "class only", Yeti has no show-on-focus counterpart (`Y/src/guides/migrating.md:43`), and P14 requires every input to trace to Yeti, Aria, the APG, WCAG, or Material's accessibility needs. Recommendation: no input; a consumer uses `@if` to render the words inside or outside a hidden element, as the spec's usage example shows.
   Decided 2026-10-03 in ticket 50, decision 28 (orchestrator, full AFK mode).

Neither point blocks the spec. Each is written as the spec's best reading and marked "(open: see ticket)".

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/visually-hidden.md](../specs/visually-hidden.md).

The spec gives Yeti's `visually-hidden` utility one item directive, `[yetiVisuallyHidden]` (`YetiVisuallyHidden`, `exportAs: 'yetiVisuallyHidden'`, entry point `ngx-yeti/visually-hidden`): a static host class and `data-ngx-yeti-item`, the item file acquired as a counted link (ADR 0060), and no inputs, outputs, listeners, ids, or package CSS (building-blocks Part 2 row 49). It compares Yeti's recipe with CDK's `cdk-visually-hidden` property by property and with CDK's private style loader, citing `NC/` at `708d4c6e2`. It states eight usage rules from Yeti's docs (text only, one name per control, visible words first, not with `hidden`, `aria-hidden`, or `yetiPrint`, not on the skip link), covers every rendering mode with nothing lost under JavaScript off or `hydrate never`, names seven WCAG 2.2 AA criteria, adds no ledger row, and sets the four test layers with `TestBed.createDirective` in layer 2. The spec has 40 user stories and 2 open points, listed under Open above.
