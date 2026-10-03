---
status: accepted
---

# Each item marks its host with its own presence attribute

Status: accepted, 2026-10-03. Decided by the orchestrator under the user's full-AFK ruling (map, Standing rulings), as a trap-quadrant decision (HIGH impact, MEDIUM confidence). It is recorded with its options so that an implementer can overrule it. It is not the user's ruling.

## Context

[ADR 0060](0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) has every item directive set `data-ngx-yeti-item="<item>"` on its host (point 2). Its loader removes an item's link only when no element with that attribute is connected (point 4). That DOM check covers the hosts the live count cannot see: a host in a `hydrate never` block or not yet hydrated, and a host leaving under `animate.leave`.

Yeti puts more than one item on one element: `.card.lift` in Yeti's own example, `center` with `box`, `enter` on a `cluster`, and `button` with `print`. Two directives that declare the same static host attribute leave one value in the DOM. This was read in Angular's `mergeHostAttribute` and is inferred, not measured. So the losing item is invisible to the DOM check, and its link can be removed while its element is still on the page. For `print`, that would put a screen-only button on paper.

The point was raised by [Spec: lift (utility)](../issues/47-spec-lift.md) and [Spec: print (utility)](../issues/48-spec-print.md), whose `### Open` sections hold the full analysis.

## Decision

Each item directive sets a presence attribute named after its item, `data-ngx-yeti-item-<item>` (for example `data-ngx-yeti-item-card` and `data-ngx-yeti-item-lift`), as a static host attribute with an empty value. ADR 0060's removal check queries `[data-ngx-yeti-item-<item>]`. This replaces ADR 0060 point 2's single `data-ngx-yeti-item="<item>"`. The attribute stays in the `data-ngx-yeti-*` runtime namespace ([ADR 0080](0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 2).

## Considered options

- **A. One presence attribute per item (chosen).** Each directive owns its own attribute name, so no two directives on one element collide. The attribute is static and never changes, so hydration writes back the same value, which [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) rates safe. The loader's change is one selector. The cost is one attribute per item on a shared element in the server HTML, and amendments to ADR 0060, the glossary, and ticket 13's probe.
- **B. One attribute holding a space-separated list** (`data-ngx-yeti-item="card lift"`). Dismissed. Host bindings cannot combine values from independent directives without a per-element coordinator and ordering, which is more code. A bound value also gets written twice at hydration, and building it in the DOM would be a DOM write against the hydration constraints.
- **C. Keep ADR 0060 as written and document the gap.** Dismissed. `hydrate never` is a supported rendering mode (ADR 0011), and the gap is the one ADR 0060 exists to close.
- **D. Forbid two items on one element.** Dismissed. It contradicts Yeti's own markup and building-blocks 1.9.
- **E. Never remove a utility's link once loaded.** Dismissed. It breaks the per-item lazy-styles requirement the user kept on 2026-10-02.

## Consequences

- Every item spec names its presence attribute in its contract mapping.
- The `setup` spec documents that the attribute belongs to the package. Consumers do not write it.
- One fixture-app e2e case covers the shared host: a `card` with `lift` inside `hydrate never`, after every live lift has left, asserting that both links remain.
- **To overrule:** an implementer who prefers B adds the per-element coordinator and states its ordering here. One who prefers C adds a usage rule to the `lift`, `enter`, `attention`, and `print` specs: no utility inside a `hydrate never` block unless a live instance exists elsewhere or the item is preloaded. Either way, the e2e case above decides.
- 2026-10-03, scope ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md), decisions 6 and 7; the orchestrator's, not the user's): the presence attribute belongs to an item's root directive only.
  - Part and child directives (`YetiBreakoutChild`, `YetiBreakoutNote`, `YetiColumnsChild`, `YetiCoverChild`, and every part of a later spec) set no presence attribute and acquire no item file. Yeti's rules for parts apply only under the root's class, and the root's own attribute keeps the link while it is connected.
  - The six any-element marker directives (`yetiBorder`, `yetiPaint`, `yetiText`, `yetiShow`, `yetiHide`, `yetiNumeric`) set no presence attribute and acquire no item file, because their rules are in the always-loaded `layouts/attributes.css`.
