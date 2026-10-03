# 47. Spec: lift (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `lift` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/lift.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/lift.md](../specs/lift.md).

The spec is 301 lines: 42 user stories, 13 Implementation Decisions subsections (with Module replaced), four test layers, and 2 open points. `lift` is one types-only item directive, `[yetiLift]`, class `NgxYetiLift` (ADR 0080 point 4), with the selector-named input `yetiLift: YetiLift | ''` (ADR 0070 U; ticket 26 row 167), no outputs, no listeners, no ledger rows (building-blocks row 47), and the `lift` item file as a counted link (ADR 0060).

Checked: Yeti's `lift` manifest, CSS, docs, example, and browser test at `f52d1e8b9`; the component tokens and reduced-motion overrides in Yeti's token files; `bin/gen-types.js` (so `yeti.d.ts` exports `YetiLift` as the vocabulary type); Material's elevation classes and the card's styles at `708d4c6e2` (no hover lift). Inferred, not measured: forced-colours behaviour, an `enter` or `attention` animation overriding the lift on one element, and the A4 token-gap effect on a hover.

### Open

1. **Two item directives on one element both claim the `data-ngx-yeti-item` host attribute.** Impact HIGH, confidence MEDIUM. This is the trap quadrant.
   - **The problem.** ADR 0060 point 2 has every directive set `data-ngx-yeti-item="<item>"` on its host, and point 4 removes an item link only when no element with `data-ngx-yeti-item="<item>"` is connected. `lift` almost always shares its element with another item (`.card.lift` in Yeti's example; building-blocks 1.9's `center box`; `enter` on a `cluster`). When two directives declare the same static host attribute, one value reaches the DOM. So `<article yetiCard yetiLift>` carries either `card` or `lift`, and the other item is invisible to point 4's DOM check. Live instances are still covered, because the live count holds the link. The loss is in the two cases point 4 exists for: a `hydrate never` or not-yet-hydrated host, and a host leaving under `animate.leave`. In those cases the hidden item's link is removed while its element is still on the page.
   - **Evidence.** Read: ADR 0060 points 2 and 4, and ticket 13 line 29. No record or prototype considers two items on one host. The style-loading prototype used one item per host. Inferred, not measured: that Angular keeps exactly one value when two directives on one element declare the same static host attribute, from Angular's merging of host attributes. This affects every spec where a utility or a second item shares an element: `lift`, `enter`, `attention`, `print`, `box` with `center`, and the any-element directives if they ever acquire a file. So one cross-cutting decision is needed, not a per-spec one.
   - **Option A (recommended): one presence attribute per item**, `data-ngx-yeti-item-<item>` (for example `data-ngx-yeti-item-lift`, `data-ngx-yeti-item-card`). Point 4's sweep queries `[data-ngx-yeti-item-<item>]`. Approve because:
     - each directive owns its own attribute name, so no two bindings on one element can collide;
     - it stays a static host attribute, which hydration writes back with the same value (ticket 33 row 5 rates static attributes the package never changes as safe);
     - it stays in the `data-ngx-yeti-*` runtime namespace (ADR 0080 point 2);
     - it is one selector change in the sweep.

     Against it: it amends ADR 0060 points 2 and 4, the glossary's host-attribute entry, and the style-loading prototype's probe. The server HTML carries one attribute per item on a shared element.
   - **Option B: one shared attribute holding a space-separated list** (`data-ngx-yeti-item="card lift"`), with the sweep querying `[data-ngx-yeti-item~="lift"]`. Dismiss: host bindings cannot assemble a value from two independent directives. It needs a per-element coordinator, an injection token found through `self`, plus ordering logic. That is more code, and a single bound value is again open to the static-rewrite flip at hydration.
   - **Option C: keep ADR 0060 as written and document the gap.** A utility on a shared element holds its link only through the live count. Dismiss: a lifted card in a `hydrate never` block loses its lift styles once the last live lift leaves, which is the A2 gap ADR 0060 was chosen to close. A card leaving under `animate.leave` loses them for its exit frames too.
   - **Option D: utilities skip the DOM sweep, and their links are never removed once loaded.** Dismiss: it breaks the per-item lazy-styles requirement the user kept on 2026-10-02.
   - **To overrule A:** an implementer who picks B adds the per-element coordinator and states its ordering in ADR 0060. One who picks C adds a usage rule to the lift, enter, attention, and print specs: no utility inside a `hydrate never` block without a live instance elsewhere, or `preload`. Any choice needs a fixture-app e2e case: a `card` plus `lift` host in `hydrate never` after all live lifts have left, asserting both links remain. That case is already in this spec's layer 4.
   - **Effect on this spec.** Contract mapping row 3, Implementation Decisions 3, 4, and 10, and the layer-2 shared-host test say "(open: see ticket)" and follow the decision. Nothing else changes.

   Decided 2026-10-03 in ticket 50, decision 12 (orchestrator, full AFK mode).

2. **Forced colours: the lift's shadow is not drawn, and no ledger row is added.** Impact LOW, confidence MEDIUM. Under forced colours `box-shadow` is not rendered, so with reduced motion as well a hover shows no change. This is inferred from the CSS Color Adjust rule and not measured. The focus ring stays. Recommendation: no package CSS and no ledger row, because the lift is decoration. The focus ring carries 2.4.7, no AA criterion depends on a hover cue, and building-blocks row 47 lists no ledger row. The reading is recorded in the spec, and the layer-4 forced-colours case measures that the ring remains. To overrule: add a ledger row `A11Y-<n>` owned by `lift`, with "What the package adds: none", if the orchestrator reads the ledger's "every accessibility gap found in Yeti" to cover decorative cues.

   Decided 2026-10-03 in ticket 50, decision 26 (orchestrator, full AFK mode).
