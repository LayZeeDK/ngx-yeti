# 48. Spec: print (utility)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `print` utility, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/print.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/print.md](../specs/print.md).

The spec has 39 user stories and 1 open point. It maps Yeti's `print` utility to one item directive, `[yetiPrint]`, with the class `NgxYetiPrint` (ADR 0080 point 4: `YetiPrint` is Yeti's vocabulary type) and `exportAs: 'yetiPrint'`. Its one selector-named input is `yetiPrint: YetiPrint | ''` (ADR 0070 rule U). Unset or `''` renders no `data-print`, so Yeti's default `only` applies. The directive has no part, token, listener, output, or ledger row (building-blocks Part 2 row 48). It acquires the `utilities/print/print.css` item file under ADR 0060. The spec names eight usage rules: Yeti's four accessibility notes, plus later-layer or inline `display`, no static `data-print`, markup outside templates, and `$any` for newer values. It also names the preload list for a client-rendered first instance, because without the item file a paper-only line shows on screen.

Checked: Yeti's manifest, CSS, docs, example, and browser test at `f52d1e8b9`; the records cited in the spec; and Angular's `mergeHostAttribute` (read, not run). Inferred: usage rule 5 (cascade order against a later layer, unlayered CSS, or inline `display`), the Tailwind name check, and applying ADR 0060 point 6's preload rule to routed views and `@if`. Each is marked in the spec.

### Open

1. **The host attribute `data-ngx-yeti-item` when two item directives share one element** (spec sections 3, 8, and 10). Impact: HIGH. It touches every spec whose item can share an element with another item (`button print`, `center box`, `media enter`). ADR 0060's consequences have every spec state this attribute, and a wrong removal shows a visible break: for `print`, a screen-only button prints, or a paper-only line shows on screen. Confidence: MEDIUM. The overwrite is read in Angular's source and not run, and the failure needs a dehydrated or leaving host whose other item has no live instance on the page.
   - **Evidence.** ADR 0060 point 2 has every directive write a static `data-ngx-yeti-item="<item>"`. Point 4 keeps an item's link while a connected element carries that value. Angular merges the host attributes of the directives matched on one element, and a later value for the same name overwrites the earlier one (`mergeHostAttribute`, `packages/core/src/render3/util/attrs_utils.ts:191-197` at `5db6fc4453`, read). Yeti's own `print` example puts `print` on a `.button` (`src/utilities/print/example.html:3`). Live instances are counted by construction, so the loss bites only in `hydrate never`, `hydrate on ...` before the trigger, and class-form `animate.leave`. ADR 0060's prototype measured one item per host only (inferred from its README).
   - **Option A (recommended): one presence attribute per item, `data-ngx-yeti-item-<item>`** (for example `data-ngx-yeti-item-print`). The loader's sweep queries `[data-ngx-yeti-item-print]`. Approve: each directive owns a distinct name, so static host attributes never collide; it needs no DOM write and so meets the hydration constraints; the change is small (one name pattern in ADR 0060 points 2 and 4, plus the glossary). Dismiss if: the attribute count per element grows noisy, or the sweep's selector cost matters. The cost is one attribute per item on the host, the same as today for a host with one item.
   - **Option B: keep one attribute, and let its value carry a space-separated list** matched with `~=`. Approve: one name, and it reads like `class`. Dismiss: two directives cannot merge static host attribute values (the overwrite above). Building the list needs a shared helper that reads the host and writes the DOM, which breaks "no direct DOM manipulation" under the hydration constraints and the server-equals-client rule.
   - **Option C: keep ADR 0060 as written and accept the loss.** Approve: it touches no record, and the failure needs a dehydrated or leaving shared host with no live instance of the losing item elsewhere. Dismiss: `hydrate never` is a supported mode (ADR 0011), and the user requires lazy styles that hold for every instance on the page (ADR 0060 point 4's stated purpose).
   - **Option D: a usage rule that forbids two item directives on one element.** Dismiss: it contradicts Yeti's documented markup (`button print`) and building-blocks 1.9, which writes `center box` beside each other.
   - **To overrule A**, an implementer would keep `data-ngx-yeti-item` (C), or put a shared host-marker directive in `hostDirectives` of every item directive. Angular 22 creates a directive reached several times through host directives once, so the marker would be written once, though still with one value (building-blocks 1.9). Any change is a note on ADR 0060 points 2 and 4 and on the glossary's host-attribute term, owned by the `setup` spec. The `print` spec then changes only its sections 2, 3, 8, and 10 and layer 2's test 4.

   Decided 2026-10-03 in ticket 50, decision 12 (orchestrator, full AFK mode).
