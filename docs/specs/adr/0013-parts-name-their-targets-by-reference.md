---
status: accepted
---

# A part names the element it opens, describes, or labels by typed reference; the directive writes the platform's id attributes

Adapted from ADR 0013 (`triggers-target-resolution`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md). That record bound nothing here.

Foundation's Triggers addressed targets by id strings and custom jQuery events, and the old record replaced both with a typed template reference to an Openable, or the nearest Openable through an optional `skipSelf` injection, under one `NfsOpenable` interface. It foresaw this map's case: "When Invoker Commands reach the browser target, Triggers may add `commandfor`, which needs consumer-supplied ids; the reference stays the API."

Under Yeti that case is the normal one. Yeti's items link their parts by id through the platform: a dialog's opener carries `commandfor` and `command="show-modal"` and the dialog its `aria-labelledby` (`src/components/dialog/example.html`), a dropdown's button carries `popovertarget` (`src/components/dropdown/example.html`), and a tooltip's trigger carries `aria-describedby` (`src/components/tooltip/example.html`), all read at `f52d1e8b9`. [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) point 5 already decided that the directive renders these attributes with generated ids, so they work in the server HTML before any script. This record decides how a part learns which element it points at.

We decided:

1. **The API is a typed template reference** to the target's directive (`[for]="dlg"` with `#dlg="<exportAs>"`), or, for a part inside its item, the nearest owner found with `inject(<token>, {optional: true, skipSelf: true})`. Never an id string the consumer types.
2. **The directive writes the id attribute** (`commandfor`, `popovertarget`, `aria-describedby`, `aria-controls`, `aria-labelledby`) from the target's id: the consumer's static `id` where the consumer wrote one, otherwise a generated one.
3. **A link across component boundaries passes the reference through an input**, as the old record had it.

Why, carried from the old record and still true: a reference is checked by the compiler under strict templates, while a misspelt or duplicated id fails silently; it needs no registry, which would be empty for targets in dehydrated blocks; and it follows the idiom of Material (`matMenuTriggerFor`), CDK, and Aria (`AccordionTrigger.panel`). New for Yeti: the platform resolves the written id at click time anywhere in the document, so the reference is a compile-time convenience over a platform link, not a runtime dispatch.

## Considered options

- **The consumer writes `commandfor` and the target's `id`, as Yeti's docs do.** Rejected by [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) (the consumer writes no attribute the contract can manage), and because a typo goes unreported.
- **A string id input on the part, resolved by the platform.** Not adopted: the typo problem above, with nothing gained over a reference within a template. Reopened if a spec shows a link the reference cannot reach, such as an opener in a persistent shell and a target in a routed view.
- **Custom DOM events or a dispatch service between parts.** Rejected, as in the old record: untyped, and not replayed.

## Consequences

- Generated ids can differ between server and client, because CDK's `_IdGenerator` keeps its counters in module state (`src/cdk/a11y/id-generator.ts:18`, read). A part and its target therefore share one hydration boundary unless the target has a static `id` ([ADR 0011](0011-rendering-modes-contract-for-yeti.md) clause 7; the divergence is inferred, not measured).
- Whether the package keeps the old record's shared interface and Trigger role union (`NfsOpenable`, `isOpen`, `open()`, `close()`, `toggle()`, `triggerRole`), or gives each Yeti item its own opener part, is not decided here: it depends on which opening items [Decide: the spec list](../issues/11-decide-spec-list.md) keeps and on [Decide: the building-blocks map](../issues/25-decide-building-blocks-map.md). The platform may now compute part of what the role union chose: Yeti relies on the browser for a `popovertarget` invoker's expanded state ("the button's expanded state are all the browser's", `src/components/dropdown/dropdown.css:2-3`; not measured here), and HTML-AAM maps none for a `show-modal` invoker (the old ADR 0036 (`modal-dialog-trigger-role`)'s reading, which ticket 08 adapted as [ADR 0021](0021-dialog-is-a-directive-on-the-native-dialog.md) point 4: the opener renders no `aria-expanded`).
- Every spec states, for each id attribute its item uses, which part writes it and which reference or injection supplies the target.
- 2026-10-02: [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) decided the open consequence above: there is no shared opener interface or Trigger role union. Each opening item has its own opener part, and the platform's `popovertarget` and `commandfor` carry the relationship ([building-blocks.md](../building-blocks.md) 1.8 and Part 2).
- 2026-10-03 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 227; the orchestrator's, not the user's; audit 0004 M17): the consequence above that ids "can differ between server and client" no longer holds: [ADR 0044](0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) makes them equal. A part and its target still share one hydration boundary, for the behaviour reason in [ADR 0011](0011-rendering-modes-contract-for-yeti.md)'s note on clause 7 of the same date.
