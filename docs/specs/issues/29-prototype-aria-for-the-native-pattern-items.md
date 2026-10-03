# 29. Prototype: Angular Aria for the four items that keep a native pattern

Type: prototype
Status: resolved
Blocked by: 25
Labels: wayfinder:prototype
Map: ../map.md

## Question

[Decide: the building-blocks map for every ngx-yeti item](25-decide-building-blocks-map.md) keeps a native pattern for four items, although an Angular Aria pattern could fit each one:

| Item | Ticket 25's row | Aria candidate |
| --- | --- | --- |
| `accordion` | `<details>` and `<summary>`, Yeti's markup (row 21, ledger A11Y-11) | Aria Accordion (`ngAccordionGroup`, `ngAccordionTrigger`, `ngAccordionPanel`) |
| `buttons` | `role="group"`, with Aria Toolbar as the consumer's opt-in (row 27, A11Y-12) | Aria Toolbar (`ngToolbar`, `ngToolbarWidget`) |
| `nav` and `dropdown` | disclosure navigation ([ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md), rows 32 and 34) | Aria Menu, Menubar, or Tree |
| `carousel`'s picker | fragment links ([ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md), row 29) | Aria Tabs |

For each item: does building it on the Aria pattern keep Yeti's styles working, unchanged and with no package CSS, and does Aria fully replace the Yeti JavaScript module that applies? (Corrected by the `nav`/`dropdown` prototype: at the pin, `accordion`, `buttons`, and `nav` have no module, `dropdown` has only the optional `hover.js`, and the carousel has `carousel.js`.) Then, what does the Aria version cost against ticket 25's row in the rendering-modes contract ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md): JavaScript off, before hydration, `hydrate never`) and in accessibility (axe, the APG pattern, keyboard)?

## User instruction, 2026-10-02

Asked which of the four should stay native, the user answered, verbatim:

> For each item, prototype and analyze whether using Angular Aria would keep Yeti's styles and whether it would fully replace any Yeti JavaScript where applicable.

## How to work it

Four independent prototypes, one per item, each in its own workspace under `D:/tmp/ngx-yeti-29-<item>/`. The Angular 22.2 SSR workspace of [Prototype: Yeti in Angular's rendering modes](18-prototype-yeti-rendering-modes.md) (`D:/tmp/ngx-yeti-18/ws`) is the starting point, plus `@angular/aria` at the version matching Angular 22.2. Load Yeti's CSS the way [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) does, or link Yeti's built CSS globally where the loading mechanism does not affect the answer. For each item, build both ticket 25's row and the Aria version on Yeti's markup. Then compare in Chromium, Firefox, and WebKit:

- computed styles against Yeti's own `example.html`;
- each behaviour of the Yeti module the item replaces;
- the server HTML with JavaScript off;
- axe and the keyboard against the APG pattern.

Each prototype writes `prototypes/aria-<item>/README.md`, and the orchestrator appends the `## Answer`. Decide nothing: the user decides each row from the findings.

## Answer

Resolved 2026-10-02 by four Claude Opus 5.5 prototypes. Findings: [aria-accordion](../prototypes/aria-accordion/README.md), [aria-buttons](../prototypes/aria-buttons/README.md), [aria-nav-dropdown](../prototypes/aria-nav-dropdown/README.md), [aria-carousel](../prototypes/aria-carousel/README.md). They used Angular and `@angular/aria` 22.2.1, Playwright 1.63.0 (Chromium 153, Firefox 155, WebKit 26.6), and axe 4.13.0, on Yeti at `f52d1e8b9`. Workspaces are under `D:/tmp/ngx-yeti-29-<item>/`. (A) is ticket 25's row, and (B) is the Aria version. All results are measured unless marked. Decides nothing.

| Item | Yeti's styles under (B) | Yeti JavaScript under (B) | (B) in rendering modes (JavaScript off, before hydration, `hydrate never`) | Accessibility |
| --- | --- | --- | --- | --- |
| `accordion`, Aria Accordion | Aria's documented markup (heading, button, region) leaves 13 of 14 `accordion.css` selectors unmatched, so package CSS would be needed. A hybrid with Aria's trigger on Yeti's `summary` keeps every selector, but only if `[open]` is bound, because Aria's keydown `preventDefault` stops the summary's Enter and Space | no module. Aria toggles fully and gives one-at-a-time like `name`, but find-in-page and fragment links cannot open a closed item, because closed content is not in the DOM (read, `deferred-content.ts:56-67`) | fails: no panel content in the server HTML, even for a panel that starts expanded. Nothing works without script, and a click before hydration takes effect only when replayed | axe 0 for both. (B) adds the full APG structure and Arrow, Home, and End keys |
| `buttons`, Aria Toolbar | match, except that a busy button loses Yeti's disabled rule, because `ngToolbarWidget` writes `aria-disabled="false"` (fixed by routing busy through Aria's `[disabled]`) | no module. Aria adds one Tab stop, arrow keys, and Home and End. `aria-pressed` toggling is still the package's | fails: every server-rendered widget has `tabindex="-1"`, so no button can be reached by Tab. The active item is set in `afterRenderEffect` (read, `toolbar.ts:103`) | (A) axe 0. (B) has `color-contrast` (busy buttons) and `aria-allowed-attr` (a static `role="group"` beats `toolbar`). A Shift+Tab race after an arrow key occurs in Chromium and WebKit |
| `nav` and `dropdown`, Aria Menu and Menubar | match (61 selectors, 0 differences), but only through a 40-line bridge that keeps Yeti's `popover` and `popovertarget` (Aria's `Menu` writes only `data-visible`), and only after removing Yeti's `role="list"` | `hover.js` is not replaced (Aria has no hover opening). Aria fully provides click toggling, Escape with focus return, and dropdown focus-out (A11Y-3a). It does not close the nav sheet on focus-out (A11Y-3b), on a `routerLink`, or on back, and it cancels Enter on link items | fails: panels open natively, but every link and item has `tabindex="-1"` and `aria-expanded` stays `false`. In Chromium a click before hydration is undone at hydration (cause not investigated) | (A) axe 0. (B) has 3 violations, 2 critical, because of the `li` between menubar and menuitem. `role="none"` on each `li` clears them. Links become menu items, against Yeti's docs (`nav/docs.md:3`), the APG (`disclosure-navigation.html:35-37`), and Angular's Aria guide (`menu.md:53`). Aria Tree was not built (inferred to fit less well) |
| `carousel` picker, Aria Tabs | match (7 selectors, 29 properties). The markup changes to a tablist with `role="none"` on each `li`. Neither variant has a Yeti rule for a current dot | partial: a click adds a history entry and does not scroll, keys select without moving the track, `yeti:slide` carries only a value, and `aria-selected` does not follow a swipe, so the slide on screen is `inert`. About 95 lines of glue close these gaps, except that the tab stop stays on the old dot after a swipe | fails ADR 0024 point 1: `inert="true"` on slides 2 and 3 and `tabindex="-1"` on every tab in the server HTML, so a dot click scrolls an inert slide into view. With `ngTabContent`, every server panel is empty | one minor axe finding each (`aria-allowed-role`). (B) follows the APG Tabs keys, with an extra Tab stop on the panel. WebKit's Tab skips links, so (A)'s dots are not reached by Tab there |

**Across the four (measured, read):** every Aria pattern prototyped here sets its roving `tabindex` and its initial state in `afterRenderEffect`, which never runs on the server. So its server HTML is unreachable by keyboard until hydration (toolbar, menu, tabs; read in `toolbar.ts:103`, `menu.ts:166-182`, `tab-list.ts:137-153`). That is upstream bug candidate A5. It also bears on [Decide: the building-blocks map](25-decide-building-blocks-map.md) row 40, `tabs`, which hosts Aria Tabs and lists "server-rendered selection" among Aria's gains. The carousel probe's Aria Tabs server HTML had every tab at `tabindex="-1"` and non-selected panels `inert`, which the rendering-modes contract ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md)) has to judge for `tabs` too (inferred to apply to `tabs`; not measured on the `tabs` item).

Note, 2026-10-03 (orchestrator): the user decided the four rows after tickets 30 to 34 ([map](../map.md), Standing rulings, "The Aria rows, one by one (2026-10-03)"); [ticket 25](25-decide-building-blocks-map.md)'s `### Triage` note gives each outcome.
