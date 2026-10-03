---
status: accepted
---

# The toc finds its headings from its links' fragments; there is no heading directive

Adapted from ADR 0029 (`magellan-targets-from-links`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), once [Decide: the spec list](../issues/11-decide-spec-list.md) kept `toc`, whose `toc.js` covers what Foundation's Magellan did. That record bound nothing here.

Yeti's `toc.js` already works the old record's way: it takes the toc's `a[href^="#"]` links, resolves each fragment with `getElementById(decodeURIComponent(...))`, sorts the headings in document order, watches them with one `IntersectionObserver`, and marks the link of the topmost heading in view with `aria-current="true"` and a `yeti:current` event (`src/components/toc/toc.js:3-6`, `:12-19`, `:33-36`, `:43`, read at `f52d1e8b9`). It runs once at load, so "Tocs added after load are not picked up" (`toc.js:9-10`), which [ADR 0040](0040-package-replaces-yetis-optional-modules.md) answers by replacing it.

We decided, carrying the old record's decision onto Yeti's toc:

1. **No heading directive.** The toc's links name its headings by fragment, and the directive resolves each by id, as `toc.js` does. Headings are siblings of the toc, not its descendants, so dependency injection cannot connect them, and a heading inside a `@defer (hydrate on ...)` or `hydrate never` block has no directive that could register (the old record's reasons).
2. **Headings are observed from their server-rendered elements**, before and without their hydration, since the directive only observes them and never writes to them.
3. **Missing or disconnected headings are resolved again after each application render**, so a heading a later `@defer` or `@if` renders is picked up, at the cost of one query of the toc's links and one lookup per unresolved fragment.
4. **Which links count** is [ADR 0023](0023-fragment-links-are-same-document-links.md)'s: the toc's links are same-document links rendered by the directive.
5. **The current link takes `aria-current="true"`** as Yeti's does, and `yeti:current` becomes an output under the events shared spec.

## Considered options

- **A heading directive linked by typed reference or by an id registry.** Rejected, as in the old record: an attribute and a reference on every heading, failure across component boundaries, and no registration from dehydrated blocks.
- **A document-wide `MutationObserver`.** Rejected, as in the old record: it watches every DOM change for the few unresolved fragments.

## Consequences

- The consumer writes only an `id` on each heading.
- The toc and its links share one hydration boundary; its headings are exempt.
