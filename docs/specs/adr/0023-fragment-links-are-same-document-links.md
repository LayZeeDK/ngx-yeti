---
status: accepted
---

# Fragment links: the package's own links are same-document in the server HTML, and other bare `#id` links are intercepted after hydration

Adapted from old map ADR 0017 (`smooth-scroll-click-handling`) and ADR 0038 (`smooth-scroll-same-document-links`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), for the fragment-links shared-utility spec that [Decide: the spec list](../issues/11-decide-spec-list.md) kept. Those records bound nothing here.

Every Angular CLI application ships `<base href>`, so on any route but the base URL a bare `href="#id"` resolves to another document. [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) measured it with Yeti in three engines: on `/sub/tabs` a bare `#id` reloads the document to `/sub/#id`. Yeti writes bare fragments in its toc and in its carousel's dots (`src/components/carousel/example.html:8-10`, read at `f52d1e8b9`). The same prototype measured a fix: a bubble-phase document `click` listener on `a[href^="#"]` that sets `location.hash` keeps the route, scrolls, and fires `hashchange` (its R3a), while `router.navigate([], {fragment})` fires none (R3b).

The old records had settled two rules that still hold. ADR 0038: a link counts as in-page exactly when the browser would treat a click on it as a same-document navigation, because the earlier "handle every `#` after hydration" default changed the outcome of a bare link only after hydration, while the same link still left the page before hydration, without JavaScript, in `hydrate never`, and on modified clicks, copy link, and open in a new tab (measured there in three engines). ADR 0017: the stopping point stays in CSS (`scroll-padding-top`, `scroll-margin-top`), and smooth scrolling is CSS under a reduced-motion gate; Yeti's `toc.css` already sets smooth scrolling for nav fragment links ([ticket 23](../issues/23-research-yeti-layers-and-import-order.md)).

We decided:

1. **A link the package's directive sits on renders a same-document `href`** in the server HTML: the current path plus the fragment, kept current when the URL changes, so it is in-page for the browser in every rendering mode, which meets ADR 0038's rule and ticket 11's goal at once. This covers the toc's links, the carousel's dots, and any other part link a spec owns. The old record measured that a path read once goes stale when the Router reuses a component, so the `href` follows `Location.onUrlChange` or the Router's URL. The mechanism is inferred, not measured; the fragment-links spec measures it.
2. **Other bare `#id` links in the consumer's markup** (skip links, CMS content) are handled after hydration by one document-level `click` listener, not a listener on each `<a>` ([ADR 0011](0011-rendering-modes-contract-for-yeti.md) clause 3), which sets `location.hash` as ticket 20's R3a did. Before hydration, without JavaScript, and inside `hydrate never` such a link still leaves the page, and the spec says so with the current-path `href` as the fix (ADR 0038's finding).
3. **Smoothness and offset stay CSS** (ADR 0017): Yeti's own rules plus `scroll-margin-top` or `scroll-padding-top`; no offset input, so native and intercepted jumps land in the same place.
4. **The URL changes to the fragment**, unlike old ADR 0017, which left it unchanged: `location.hash` is what keeps `hashchange` and `:target` working for the parts that read them (ticket 20). Whether the Router's `scrollPositionRestoration` then fights the jump, which old ADR 0017 found for `popstate`, is measured by the spec.

## Considered options

- **Leave bare links to the browser and document the current-path `href`**, old ADR 0038's decision. Kept for links the package does not own (point 2's pre-hydration case), not for its own, where point 1 costs the consumer nothing.
- **Intercept every bare link, the package's included**, ticket 20's R3a alone. Rejected for the package's own links: it fails in every state before hydration, which is ADR 0038's measured objection.
- **`router.navigate` with `fragment`.** Rejected: no `hashchange` (ticket 20, R3b).
- **A host listener on each link**, old ADR 0017's link-host form. Rejected by ADR 0011 clause 3.

## Consequences

- The consumer writes Yeti's `href="#id"`; the directive turns it into a same-document `href`, so the server HTML differs from Yeti's docs markup in that one attribute.
- A link whose `href` is not in-page is never handled; in the first milestone nothing reports it ([ADR 0018](0018-no-import-arrays-and-later-milestone-import-checks.md)).
- [ADR 0025](0025-toc-finds-its-headings-from-its-links.md) and [ADR 0024](0024-carousel-slides-are-not-inert-before-live.md) rely on point 1 for which links count.
- 2026-10-03 (orchestrator, full AFK mode; [ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 4): the directive on a package-owned fragment link reads the consumer's static `href` once through `HostAttributeToken('href')` and never binds `href`. The hydration rule forbids a static attribute that a directive also binds; this one is never bound, never state, and equal on server and client. It is the one documented case of a consumer's static attribute that a directive reads.
- 2026-10-03 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 135; the orchestrator's): a correction to the note above. "Never binds `href`" means the directive never binds the consumer's `href` as state. It does bind `[attr.href]` to the same-document form that `injectSameDocumentHref` computes after reading the static `href` once, as the [fragment-links](../specs/fragment-links.md) spec's section 4 says. The carousel's data-driven dots take their fragment from a selector-named input instead of a static `href` (decision 126).
