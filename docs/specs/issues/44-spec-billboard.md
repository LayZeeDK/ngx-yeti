# 44. Spec: billboard (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `billboard` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/billboard.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/billboard.md](../specs/billboard.md).

38 user stories, 2 open points. `billboard` is one Item directive, `YetiBillboard` (`[yetiBillboard]`, `exportAs: 'yetiBillboard'`, entry point `ngx-yeti/billboard`), with one input, `fit: YetiFit`, unset by default so that no `data-fit` renders and Yeti's `md-3xl` applies (ADR 0070 kind R; ticket 26 row 161). It binds the static class `billboard` and `data-ngx-yeti-item`, and it acquires the `billboard` item file (ADR 0060). It has no listener, output, method, id, Module, or ledger row today (building-blocks row 44). Its usage rules: use it on a line, not on prose; put a size container above it, as an ancestor; the element sets the heading rank; never write a static `data-fit`; name it in the preload list for client-only inserts.

### Open

1. **WCAG 1.4.4 Resize Text under page zoom, in the middle of the ramp.** Impact HIGH: the package treats WCAG 2.2 AA as a requirement (ADR 0015), and a failure here would be one the package ships. Confidence MEDIUM: the evidence is arithmetic from Yeti's CSS and scale at their defaults, not a measurement. Ticket 17 lists "200 % zoom (1.4.4)" as not measured.
   - **Evidence (inferred from source, not run):** the billboard's middle size is `100cqi` times the pair's ceiling over `--yeti-fit-width`. Page zoom shrinks a fluid container in CSS pixels, and Yeti's fluid scale also steps down with the narrower CSS viewport. Take a default-pair heading in a 400 px fluid container at a 1280 px window: it sets about 44 px. At 200 % zoom it falls to its floor of about 17 CSS px, about 33 device px. That is smaller than before zooming. In a container of fixed width it grows only about 1.4 times. Body text is not affected the same way, because its fluid range is small (1 to 1.125 rem).
   - **Option A (recommended): record and measure.** Add ledger row A11Y-20 (billboard; WCAG 2.2 1.4.4; Yeti does what its `a11y` note says; the package adds nothing yet; verified *inferred*; tested by L4; owner billboard). Make the spec's layer-4 zoom case a measurement in three engines, and decide on a fix once it has run. *Approve because* it follows the ledger's rule that every gap found is a row whether or not it is closed, adds no unmeasured CSS, and keeps Yeti's look. *Dismiss if* the orchestrator treats an inferred AA failure as needing a fix in the first milestone.
   - **Option B: add a package rule now.** One `@layer ngx-yeti` rule that raises the billboard's floor under zoom (for example, a `max()` of Yeti's clamp and a `rem` term), as the Accessibility CSS ruling allows. *Approve because* it closes the gap before release. *Dismiss because* it is unmeasured, it changes Yeti's documented sizing for every consumer, and it writes against Yeti's private `--_yeti-fit-*` tokens or duplicates Yeti's clamp, which ADR 0004 and building-blocks 1.13 forbid.
   - **Option C: a usage rule only.** Document pairs with a narrow range, or fixed-width containers. *Dismiss because* the arithmetic shows a shrink even for the default pair in a fluid container, so a usage rule does not meet AA.
   - **Option D: no row.** Treat it as Yeti's design, on the strength of Yeti's "the clamp is the accessibility story". *Dismiss because* the ledger records Yeti's gaps too, and nothing has measured the claim at 200 %.
   - **To overrule A:** for B, add the rule to the package's accessibility stylesheet, set A11Y-20's "What the package adds" to that rule, and make the layer-4 zoom case assert at least 200 %. For D, remove the zoom case's pass condition and the spec's 1.4.4 risk sentence. Filing upstream with Yeti needs the user's confirmation in every case.
   Decided 2026-10-03 in ticket 50, decision 17 (orchestrator, full AFK mode).
2. **The "types only" definition against ADR 0060's loader.** Impact LOW, confidence HIGH. Building-blocks Part 2 defines "types only" as declaring "no service". ADR 0060 point 2 has every directive inject the root loader and acquire its item. Recommendation: add a note to the "Types only" definition saying that the item-file acquisition through ADR 0060's loader is the one injection every types-only directive makes. The spec reads it that way already.
   Decided 2026-10-03 in ticket 50, decision 18 (orchestrator, full AFK mode).
