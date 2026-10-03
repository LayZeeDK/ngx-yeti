---
status: accepted
---

# Carousel slides are never `inert` or hidden in the server HTML; the dots stay links

Adapted from ADR 0025 (`orbit-live-inert`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), once [Decide: the spec list](../issues/11-decide-spec-list.md) kept `carousel`. That record bound nothing here. The old ADR 0037 (`orbit-slide-hosts-tab-panel`), which made Orbit's slides host Aria's `TabPanel`, is abandoned (ticket 08's table).

Yeti's carousel is "slides on a scroll-snap track, and dots that are ordinary links" (`src/components/carousel/carousel.css:1`): the slides sit side by side with `scroll-snap-type: x mandatory` (`:18`), the dots are `<a href="#work-1">` fragment links (`example.html:8-10`), and neither its CSS nor `carousel.js` sets `inert` or `hidden` on a slide (searched at `f52d1e8b9`). With JavaScript off the dots follow their fragments ([ticket 18](../issues/18-prototype-yeti-rendering-modes.md), measured). So before hydration, without JavaScript, and inside `hydrate never`, the carousel is a usable scroll-snap gallery, which is the state old ADR 0025 protected: a slide that can be scrolled into view but is `inert` shows sighted users content that assistive technology and the pointer cannot reach (WCAG 1.3.1).

We decided:

1. **No slide carries `inert` or `hidden` in the server HTML.** If the `carousel` spec makes slides out of view unreachable once live (the APG's "hidden, not off-screen" rule, one of ticket 17's carousel gaps), it applies that only from the carousel's first render callback, and keeps whichever slide the user scrolled to as the current one.
2. **The dots stay fragment links**, made same-document by [ADR 0023](0023-fragment-links-are-same-document-links.md); they do not become Aria `Tab`s. Replacing a working native link with a tab pattern would change Yeti's semantics, which the map's Implementation order note forbids, and it is why old ADR 0037's `TabPanel` hosting has no successor.
3. **What the carousel adds for the APG** (current-slide marking, slide roles, previous and next controls, ticket 17) is the `carousel` spec's, each a `ledger.md` row, and its building blocks are [Decide: the building-blocks map](../issues/25-decide-building-blocks-map.md)'s.

## Considered options

- **Server-render `inert` on every slide but the first**, as Aria's `TabPanel` would. Rejected for the 1.3.1 reason above.
- **Stop native scrolling before hydration** so only the first slide is reachable. Rejected, as in the old record: it takes every other slide from no-JavaScript users.

## Consequences

- Between first paint and hydration, assistive technology can reach slides out of view; the change at hydration moves nothing on screen.
- The `carousel` spec's SSR smoke asserts that no slide carries `inert` or `hidden`.
