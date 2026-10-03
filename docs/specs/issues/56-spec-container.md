# 56. Spec: container (layout)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `container` layout, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/container.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/container.md](../specs/container.md).

The spec has 42 user stories and 2 open points, marked "(open: see ticket)" where they are used. It specifies three directives in `ngx-yeti/container`:

- `YetiContainer` (`[yetiContainer]`): the static class `container`, the presence attribute `data-ngx-yeti-item-container` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and the counted item file `layouts/container/container.css` ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).
- `YetiShow` and `YetiHide` (`[yetiShow]`, `[yetiHide]`): any-element directives, each with one required `YetiWidth` input bound to `data-show` or `data-hide` ([ticket 26](26-decide-yeti-data-attributes-mapping.md) rows 25 and 26). Their rules are in the always-loaded `attributes.css`.

All three are native platform, level 1, types only, with no ledger row (building-blocks Part 2 row 6). Every rule is a container query, so the item works the same with JavaScript off and in every rendering mode. The Tailwind `.container` collision is covered by the setup's `@source not inline('container');` (ADR 0060 point 7).

### Open

1. **The marker directives set no presence attribute and acquire no item file.** Impact LOW, confidence HIGH. ADR 0060 point 2 says "every directive and component" sets the host attribute and acquires its item. [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) replaced that attribute and says "each item directive". `YetiShow` and `YetiHide` are not item directives: they bind no class (ticket 26, grilling question 10), and their rules are always loaded (building-blocks Part 2 rows 1 and 6: "no item file"). The presence attribute exists only for the item-file removal check, so they have nothing to mark. Recommendation: no presence attribute and no acquisition for any of the six any-element directives (`yetiBorder`, `yetiPaint`, `yetiText`, `yetiShow`, `yetiHide`, `yetiNumeric`). Record it as a note on ADR 0045 so that the `box` and `table` specs read the same way.
   Decided 2026-10-03 in ticket 50, decision 7 (orchestrator, full AFK mode).
2. **Class names `YetiShow` and `YetiHide`.** Impact LOW, confidence HIGH. Building-blocks 1.3 names classes for items (`Yeti` plus the item's name) and for parts (the item plus the part), and ADR 0080 point 3 says the same. Neither names a class for an any-element directive. Ticket 26 fixes only the selectors and inputs. Recommendation: `Yeti` plus the PascalCase of the selector without its prefix (`YetiShow`, `YetiHide`; and for the `box` and `table` specs `YetiBorder`, `YetiPaint`, `YetiText`, `YetiNumeric`). This mirrors 1.3's `exportAs` rule, "the class name with a lowercase first letter". Checked at the pin against the 46 names `yeti.d.ts` exports: `YetiShow`, `YetiHide`, `YetiBorder`, `YetiText`, and `YetiNumeric` are free, but `YetiPaint` is Yeti's `paint` vocabulary type (`yeti.d.ts:15`). So the `box` spec's class is `NgxYetiPaint` under ADR 0080 point 4.
   Decided 2026-10-03 in ticket 50, decision 11 (orchestrator, full AFK mode).

Neither point has HIGH impact, so neither needs the trap-quadrant record. Neither blocks the spec.
