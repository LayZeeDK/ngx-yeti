# Spec: toc (component item)

Ticket: [91. Spec: toc (component)](../issues/91-spec-toc.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0025](../adr/0025-toc-finds-its-headings-from-its-links.md) (the toc finds its headings from its links); [building-blocks.md](../building-blocks.md) Part 2 row 41 and Part 1 (1.3, 1.4, 1.5, 1.9, 1.10, 1.11, 1.12, 1.13, 1.15); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 156 to 158; the shared specs [events](events.md) (the `current` output and `YetiCurrentDetail`), [fragment-links](fragment-links.md) (the links' same-document `href`), and [setup](setup.md) (the style loader); [ticket 40](../issues/40-spec-events.md) open point 3 and [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 4, 5, 6, 8, 10, 42, 45, and 88's pattern), which rename the toc's model away from `current`; [architecture-guide.md](../architecture-guide.md) P11 (`aria-current` bound by the toc directive from its `IntersectionObserver` state); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); the [cluster](cluster.md) spec's section 13 (`toc.css` holds the one rule that names `.cluster`). The item owns no [ledger.md](../ledger.md) row (Part 2 row 41: "none (like-for-like)") and shares A11Y-16's tests with fragment-links. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 207 to 214), and each is cited where it applies.

## Problem Statement

Yeti's `toc` is "a column of links to the headings on the page, with the one being read marked as the reader scrolls" (`Y/src/components/toc/manifest.json`). It is for "a long page a reader scrolls rather than clicks through: a guide, a reference, a post with sections" (`docs.md`). It is one **Identity class**, `toc`, on a labelled `nav` holding one `ul` of links, each pointing at the `id` of a heading on the same page, and three **Attributes**: `data-variant` (the hue of the current link and its edge bar), `data-size` (the text step and each link's inset), and `data-numbered` (a numbered contents list, nested entries reading `2.1`). The **Current link** carries `aria-current="true"`, which is both the announcement and the hook Yeti's CSS draws: the variant's colour, a strong weight, and a bar down the start edge. Its optional **Module**, `toc.js`, moves that mark: one `IntersectionObserver` watches the linked headings and marks the link of the topmost heading in view, dispatching `yeti:current` with `{ link, heading }` each time the mark moves.

An Angular developer using the package cannot use any of that as Yeti ships it:

- **The module never sees an Angular page.** `toc.js` scans the document once at load, before Angular bootstraps, so it misses the first route and every `@if`, `@for`, `@defer`, and route change after it; "Tocs added after load are not picked up" (`toc.js:9-10`; [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)). The package replaces it and loads no module beside it.
- **The links reload the application.** Yeti writes bare `href="#id"` links, and under the `<base href>` every Angular CLI application ships, a bare fragment on any route but the base reloads the document to the base URL plus the fragment ([ADR 0023](../adr/0023-fragment-links-are-same-document-links.md); [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), measured in three engines). A contents list that leaves the page is worse than none.
- **The headings are not the toc's children.** They sit anywhere on the page, often in other components, other routes, or other hydration boundaries, so dependency injection cannot connect them to the toc ([ADR 0025](../adr/0025-toc-finds-its-headings-from-its-links.md) point 1).
- **A template cannot bind `(yeti:current)`**, and with the module replaced nothing dispatches it ([events](events.md)).
- **The current mark is state that must survive hydration.** `aria-current` written statically would be written back at hydration over the observer's mark (ADR 0003 point 4), and a page that "knows its own current section can simply ship the attribute in its HTML" (`docs.md`), which the package must still allow.
- **The consumer writes no Yeti class or attribute** ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2), so the class, `data-variant="secondary"`, `data-size`, and `data-numbered` need typed inputs, and a misspelt value must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)).
- **The `toc` **Item file** must be loaded while a toc is on the page and removed when none is** ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). It also holds the page's smooth scrolling, which a nav's in-page links share.

## Solution

Two directives in the secondary entry point `ngx-yeti/toc` (Part 2 row 41; building-blocks 1.3):

- **`YetiToc`**, the **Item directive** and a **Coordinating directive**, on `nav[yetiToc]`, `exportAs: 'yetiToc'`. It binds `toc` as a static host class and `data-variant`, `data-size`, and `data-numbered` from the typed inputs `variant` (`YetiVariant`), `size` (`YetiSizeControl`), and `numbered` (`boolean`). It holds the **Current link** as a model, `currentLink`, the target id of the current link ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 207), because ticket 50 renamed the model away from `current` so that the output can keep Yeti's verb ([ticket 40](../issues/40-spec-events.md) point 3). It declares the `current` output typed `YetiCurrentDetail` ([events](events.md)). It provides `yetiTocToken`, with which its links register. In `afterNextRender` it creates one `IntersectionObserver` with the default options over the headings its links name, resolved by id from their fragments, sorted in document order, and resolved again after each application render (ADR 0025 points 1 to 3). It marks the link of the topmost heading in view, keeps the last mark while no heading is in view, and disconnects on destroy (`toc.js:29-31`, `:39-50`). It sets the static presence attribute `data-ngx-yeti-item-toc` (ADR 0045), injects the fragment-links service `YetiFragmentLinks` (Part 2 row 51), and calls `injectYetiItemStyles('toc')` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).
- **`YetiTocLink`**, a **Part directive**, on `a[yetiTocLink]`, `exportAs: 'yetiTocLink'`. It reads the consumer's static `href="#id"` once (ticket 50 decision 4), or a selector-named `yetiTocLink` input for links rendered from data ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208), the same shape as the carousel's dots (decision 126), and binds the same-document `href` from `injectSameDocumentHref` ([fragment-links](fragment-links.md); ADR 0023 point 1). It binds `aria-current` as `"true"` exactly while its target id equals the root's `currentLink`, and `null` otherwise (architecture-guide P11; building-blocks 1.10, Current page). It registers with the root through `yetiTocToken` and declares no listener.

The developer writes Yeti's markup with directive attributes where the docs write the class and the attributes:

```html
<nav yetiToc aria-label="On this page" variant="secondary" size="sm" [(currentLink)]="section" (current)="onCurrent($event)">
  <ul role="list">
    <li><a yetiTocLink href="#install">Install</a></li>
    <li><a yetiTocLink href="#usage">Usage</a></li>
  </ul>
</nav>
```

The `nav`'s name, the `ul`'s `role="list"`, the headings' `id`s, and the link text are the consumer's (manifest `a11y`; building-blocks 1.10, Names). Everything at first paint is in the server HTML: the class, the attributes, the same-document `href`s, and the mark the model holds. With JavaScript off the links still move to their headings without leaving the page, and the page scrolls smoothly unless the reader prefers reduced motion, because that is Yeti's CSS.

## User Stories

1. As an application developer, I want to turn a labelled `nav` of heading links into Yeti's toc with one directive attribute, so that I never write Yeti's `toc` class by hand.
2. As an application developer, I want the directives to render Yeti's exact `class="toc"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a toc with no inputs to be Yeti's default, a primary column at the medium text step, so that the common case needs no configuration.
4. As an application developer, I want a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="secundary"` fails to compile.
5. As an application developer, I want a `size` input typed by Yeti's `size-control` vocabulary, so that a sidebar toc can use the small step.
6. As an application developer, I want a `numbered` input that turns the list into a numbered contents list, so that a book's contents page reads `1`, `2`, `2.1`.
7. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
8. As an application developer, I want a static `variant="secondary"` to type-check, so that I need no property binding for a constant.
9. As an application developer, I want to keep writing Yeti's `href="#install"` on each link, so that my markup reads like Yeti's docs.
10. As an application developer, I want each toc link to render a same-document `href` on the current route under my `<base href>`, so that following it never reloads my application.
11. As an application developer, I want toc links rendered with `@for` from my headings' data to work, so that a generated contents list needs no hand-written `href`.
12. As an application developer, I want the links' `href` to follow the URL when the Router reuses my component for another route, so that a link never points at the previous page.
13. As a reader, I want the link of the section I am reading marked as I scroll, so that I know how far through the page I am.
14. As a reader, I want the mark to stay on the last section while I scroll between two headings, so that the list does not flicker.
15. As a reader, I want the mark to follow the headings' order on the page, even when the list is written in another order, so that the topmost heading in view is always the one marked.
16. As a reader, I want a nested entry to be marked when its sub-heading is the topmost in view, so that the mark is as precise as the list.
17. As an application developer, I want a heading rendered later by `@if`, `@defer`, or a route change to be picked up, so that the toc stays correct on a page that builds itself.
18. As an application developer, I want headings to need nothing but an `id`, so that I add no directive, attribute, or reference to them.
19. As an application developer, I want headings in other components, other routes, and other hydration boundaries to work, so that the toc can sit in my shell's sidebar.
20. As an application developer, I want a `[(currentLink)]` two-way binding, so that my own UI (a heading in a sticky bar, a progress line) can follow the toc.
21. As an application developer, I want to set `currentLink` from my route or my data on the server, so that the server HTML already marks the section the page opens at.
22. As an application developer, I want writing `currentLink` from my component not to fire `current` back at me, so that I get no feedback loop.
23. As an application developer, I want a `(current)` output with the link and the heading, so that I can react to the reader's position with typed elements.
24. As an application developer, I want `(current)` to fire only when the mark moves, so that my handler is not called on every scroll frame.
25. As an application developer, I want `(current)` to fire after hydration when the page opens at a section other than the server's mark, so that my UI is told where the reader is, as Yeti's module tells its listeners at load.
26. As an application developer, I want no observer, listener, or timer on the server, so that SSR and prerendering never touch the DOM or the window.
27. As an application developer, I want hydration to change nothing on the toc, so that I get no `NG05xx` error and no mark that jumps at hydration because of the package.
28. As an application developer, I want a toc inside `@defer (hydrate on ...)` to keep working links before it hydrates and to start marking after, so that deferring the sidebar costs the reader nothing but the mark.
29. As an application developer, I want a toc inside `hydrate never` to keep its links, its styles, and its server-rendered mark, so that a static page still has a working contents list.
30. As an application developer, I want to know that a toc inside a client-only `@defer` block needs `toc` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
31. As an application developer using `withI18nSupport()`, I want translated link text and labels to hydrate without being re-rendered, so that localised pages keep the server's DOM.
32. As an application developer using zoneless change detection, I want the mark and my bindings to refresh as I scroll, so that the toc works without zone.js.
33. As a reader with JavaScript off, I want every toc link to move to its heading on SSR and prerendered pages, so that the contents list works before and without any script.
34. As a reader who prefers reduced motion, I want following a toc link to jump rather than scroll smoothly, so that the page does not animate against my setting.
35. As an application developer, I want the list to become a wrapping row when I put `yetiCluster` on it, so that a settings page's section list can sit beside a narrow rail, as Yeti's docs show.
36. As an application developer, I want the toc item file loaded when the first toc renders and removed after the last leaves, so that I do not import `toc.css` globally.
37. As an application developer, I want to know that my nav's in-page links scroll smoothly only while a toc is on the page, so that I am not surprised when they jump elsewhere.
38. As an application developer, I want a template reference (`#toc="yetiToc"`), so that I can read the current link from my template.
39. As an application developer, I want to import both directives from `ngx-yeti/toc`, so that a `@defer` block can split them with the rest of the item.
40. As an application developer, I want the usage rules stated (the `nav` host, its name, `role="list"`, one `yetiTocLink` per link, heading ids, no static `aria-current`, no static Yeti attributes), so that I use the toc as Yeti intends.
41. As a screen-reader user, I want the toc announced as a navigation landmark with its own name, so that I can tell it from the site's main navigation.
42. As a screen-reader user, I want the toc's links announced as a list with a count, so that I know how many sections the page has.
43. As a screen-reader user, I want the current link announced as current, so that the mark is not only visual.
44. As a screen-reader user, I want a numbered toc's links named by their text only, so that the number does not stutter before every title.
45. As a keyboard user, I want every toc link in the Tab order with a visible focus ring, so that I can jump to any section without a pointer.
46. As a sighted user, I want the current link to differ by weight and an edge bar as well as by colour, so that I can find it without telling hues apart.
47. As a low-vision user, I want every link, current or not, to meet 4.5:1 contrast in the light and the dark scheme, so that I can read the list.
48. As a forced-colours user, I want the current link still told apart from the others, so that I keep my place in Windows High Contrast.
49. As a package maintainer, I want the contract check to cover the three attributes, every value of their vocabularies, and the `yeti:current` event's keys, so that a pin move that adds one fails before release.
50. As a package maintainer, I want the fixture app to serve the toc on a prerendered and a server route under a non-root `<base href>`, with JavaScript on and off, so that both rendering paths and the fragment-link fix are tested.
51. As a package maintainer, I want the play functions to follow Yeti's own `toc.spec.js` cases, so that the package proves what Yeti proves.
52. As a package maintainer, I want the observer disconnected and the links unregistered on destroy, so that a toc that leaves a route leaves nothing behind.
53. As a package maintainer, I want the class names `YetiToc` and `YetiTocLink` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/toc/manifest.json`, `toc.css`, `toc.js`, `docs.md`, and `example.html`, in `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, `Y/src/layouts/attributes.css`, `Y/src/yeti.css`, and `Y/schema/vocabulary.json`, and in Yeti's test `Y/test/browser/components/toc.spec.js` with its fixture `Y/test/browser/fixtures/components/toc.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `toc`, `component`, `Navigation` |
| `class` | `toc` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "The hue of the current link and its edge bar." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The text step, and the inset of each link with it." `data-numbered`: boolean, "Number the entries before their links, nested ones as 2.1, in the muted color." |
| `classes`, `markers` | empty, none |
| `children` | `> ul` (exactly one, "The links, one per li, with role=\"list\""); `li` (one or more, "One entry, holding a link whose href is the id of a heading on this page") |
| `tokens` | public: `--yeti-toc-scroll`, `--yeti-toc-padding`, `--yeti-toc-hover`, `--yeti-color-text-muted`, `--yeti-color-text`, `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-text-md`, `--yeti-border-width`, `--yeti-weight-strong`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-color-primary`, `--yeti-color-primary-subtle`, `--yeti-color-primary-text`; private: `--_yeti-variant`, `--_yeti-variant-subtle`, `--_yeti-variant-text`, `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby`; `keyboard` empty; notes: "Give the nav an aria-label such as \"On this page\", since a page with a toc has at least two navs. Put role=\"list\" on the ul, because the reset only removes list markers where that role says the list is decorative. The link for the section being read carries aria-current=\"true\"; toc.js moves it, and a page that ships the mark in its HTML is correct without the module. The module owns aria-current on these links: it sets and clears the value \"true\" and strips any other aria-current an author puts on a toc link. Every link points at an id on this page, so the list works with no script at all." |
| `js` | `toc.js`, optional; event `yeti:current`, `detail` `{ link, heading }`, "Dispatched on the .toc when the mark moves to another link." |
| `support` | `unguarded`: `IntersectionObserver`, `:has()`, `scroll-behavior`; `guarded`: none |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`toc.css`):

- **Smooth scrolling.** `html:has(.toc, .nav a[href^="#"]:not([href="#"])) { scroll-behavior: var(--yeti-toc-scroll); }` (`toc.css:6-9`). The token is `smooth` and collapses to `auto` under `prefers-reduced-motion: reduce` (`Y/src/tokens/components.css:102`, `:178-182`), "which a plain `scroll-behavior` in this layer could not, since it would outrank the reset's own rule" (`docs.md`).
- **Defaults.** `.toc:not([data-variant])` supplies the primary ladder and `.toc:not([data-size])` the `md` text and `sm` space step (`:11-16`). The value rules for set attributes are in the **Always-loaded group** (`Y/src/layouts/attributes.css`), as for every item that reads those vocabularies.
- **The list.** `.toc > ul` is a flex box with no margin, padding, or markers (`:17-23`); `.toc > ul:not(.cluster)` makes it a column with an `xs` gap (`:31-34`). The `:not(.cluster)` is there because `yeti.components` outranks `yeti.layouts`, so "a plain `.toc > ul` would outrank the cluster's own row and gap" (`:24-30`). `.toc > ul > li` has no margin (`:37`).
- **Links.** `.toc a` is a block with `--yeti-toc-padding` block padding, the size step's inline padding, a start-edge border three `--yeti-border-width` wide that is transparent until current, the muted text colour, no underline, and a `--yeti-duration-fast` transition on colour and border colour (`:38-48`). Hover fills with `var(--yeti-toc-hover, var(--_yeti-variant-subtle))` and the full text colour (`:49-54`). `.toc a[aria-current]` takes the variant's bar, the variant's text colour, and `--yeti-weight-strong` (`:55-59`).
- **Numbered.** `.toc[data-numbered] ul` resets a `toc` counter and each `li` counts, so a nested list reads `2.1` (`:66-67`); each link hangs from a `4ch` number box, and `a::before` draws `counters(toc, ".") "."` with empty alternative text (`/ ""`), muted, with tabular figures (`:72-86`).

How `toc.js` works (all of it is replaced; section 2 maps each behaviour): for each `.toc` at load it takes `a[href^="#"]`, resolves each with `getElementById(decodeURIComponent(...))`, keeps a heading-to-link map, skips a toc with no resolved heading, sorts the headings in document order with `compareDocumentPosition`, keeps the set of headings the observer reports intersecting, and on each callback marks the first heading of that order that is visible. With none visible, it returns and the mark stays. If that link already has `aria-current="true"`, it returns; otherwise it removes `aria-current` from every link of the toc, sets `"true"` on the new one, and dispatches `yeti:current` (bubbling, composed) with `{ link, heading }`. The observer has the default options on purpose: "threshold 0 with no root margin is what makes 'topmost in view' mean 'any part of the heading visible'" (`toc.js:39-43`).

Attributes left to the consumer (ticket 26 rows 156 to 158 map only the three `data-*` attributes; everything else is the consumer's): the `nav`'s `aria-label` or `aria-labelledby`, the `ul`'s `role="list"` (manifest `children[0]`), the headings and their `id`s, and the link text. The links' `href` is the consumer's fragment, rendered in its same-document form by the part directive (ADR 0023 point 1), and `aria-current` on the links is the package's (Part 2 row 41).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `toc` | static host class on `nav[yetiToc]` (`YetiToc`) | always | ADR 0003 point 1; Part 2 row 41 |
| Attribute `data-variant` | the hue of the current link and its bar | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. `variant` is not an HTML attribute | ticket 26 row 156 (R) |
| Attribute `data-size` | the text step and the inset | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 157 (R); building-blocks 1.4 |
| Attribute `data-numbered` | a numbered contents list | input `numbered`: `boolean` with `booleanAttribute`, `[attr.data-numbered]` as `''` when true and `null` when false | unset renders nothing. `numbered` is not an HTML attribute | ticket 26 row 158 (R) |
| `aria-current` on the links | `"true"` on the current link, set by `toc.js` | bound on each `a[yetiTocLink]` as `"true"` while its target id equals the root's `currentLink()`, else `null` | no link is marked while `currentLink` is unset | Part 2 row 41; architecture-guide P11; building-blocks 1.10, Current page |
| The current link as state | `aria-current` plus `yeti:current` | model `currentLink`: `string \| undefined`, the current link's target id ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 207) | `undefined` | building-blocks 1.4 (`model()` for state Yeti exposes as an attribute and an event); ticket 40 point 3 and ticket 50 decision 5 (renamed away from `current`) |
| Event `yeti:current` on `.toc` | `{ link, heading }`, when the mark moves | output `current`: `YetiCurrentDetail` (`link: HTMLAnchorElement`; `heading: HTMLElement`), from `ngx-yeti/events` | fires only when the mark moves | [events](events.md) section 2; ADR 0025 point 5 |
| A link's `href` | `#<heading id>` | the consumer's static `href="#id"`, read once through `HostAttributeToken('href')`, or the selector-named input `yetiTocLink` for a link rendered from data ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208); `[attr.href]` bound to `injectSameDocumentHref(fragment)` | the current path and query plus the fragment, under `<base href>` | ADR 0023 point 1 and its 2026-10-03 note; ticket 50 decision 4; [fragment-links](fragment-links.md) section 4 |
| `> ul`, `li` children | styled by position | no directive; `role="list"` is the consumer's | not applicable | manifest `children`; building-blocks 1.1 (a child Yeti styles by position gets no directive) |
| `aria-label`, `aria-labelledby` on the `nav` | `a11y.requiredAttributes` | the consumer's; no name input | usage rule 2 | building-blocks 1.10, Names |
| Token `--yeti-toc-scroll` | how the page scrolls to a heading | the consumer's; the package writes it nowhere | not applicable | ADR 0004; [fragment-links](fragment-links.md) section 2 |
| Tokens `--yeti-toc-padding`, `--yeti-toc-hover` | the rows' padding; the hover fill | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-color-text-muted`, `--yeti-color-text`, `--yeti-color-<hue>*`, `--yeti-space-*`, `--yeti-text-*`, `--yeti-border-width`, `--yeti-weight-strong`, `--yeti-duration-fast`, `--yeti-ease` | colours, steps, the bar's width, the weight, the transition | the consumer's | not applicable | ADR 0004 |
| Private tokens `--_yeti-variant*`, `--_yeti-size-*` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-toc=""` on the `YetiToc` host only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiTocToken`, provided by `YetiToc`, injected by `YetiTocLink` | not applicable | building-blocks 1.3, 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 157, "HTML `size` (form controls): `inert` on Yeti's hosts"): HTML's `size` acts on `input` and `select`, not on `nav`. A static `size="sm"` stays on the host beside `data-size="sm"`, does nothing, and the directive binds nothing for it.

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). `YetiCurrentDetail` is the events spec's, from `ngx-yeti/events`, and is not redeclared here.

**Module replaced: `toc.js`** (ADR 0040; Part 2 row 41, "`toc.js` replaced"; ADR 0025):

| `toc.js` behaviour (`Y/src/components/toc/toc.js`) | Package | Kept, changed, or removed |
| --- | --- | --- |
| Runs once at load for every `.toc` in the document (`:11`) | each `YetiToc` sets itself up in its first render callback, in any rendering mode, and tears down on destroy (building-blocks 1.15) | changed: works for Angular-rendered tocs (ADR 0040) |
| Takes the toc's `a[href^="#"]` links (`:12`) | the links are the `YetiTocLink` parts registered with the root; their `href` is same-document, so it no longer starts with `#` (ADR 0023 point 1) | changed (ADR 0025 point 4) |
| Resolves each with `getElementById(decodeURIComponent(fragment))` (`:17`) | the same lookup on `DOCUMENT`, from the link's fragment; a fragment that fails to decode counts as unresolved ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 211) | kept |
| One link per heading; a later link for the same heading replaces the earlier (`:13-19`, a `Map`) | the link last in document order wins (usage rule 4) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 212) | kept |
| Skips a toc with no resolved heading (`:20`) | observes nothing until a heading resolves | kept |
| Unresolved links stay unresolved for good | missing or disconnected headings are resolved again after each application render, observing new ones and unobserving disconnected ones (ADR 0025 point 3) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 210, for the render callback) | changed |
| Sorts headings in document order (`:22-24`) | the same `compareDocumentPosition` order, recomputed when the set of resolved headings changes | kept |
| One `IntersectionObserver`, default options (`:39-50`) | one per toc, default options, created in `afterNextRender`, disconnected on destroy (Part 2 row 41) | kept, with a lifecycle |
| Topmost visible heading wins; between headings the mark stays (`:27-31`) | the same rule writes `currentLink` | kept |
| No change if the link is already current (`:33`) | no write and no emit when the target id equals `currentLink()` | kept |
| Removes `aria-current` from every link, sets `"true"` on the new one (`:34-35`) | each link binds `aria-current` from `currentLink()`; the binding owns the attribute, so no other value can stay on a toc link | changed: bound, not written (P11) |
| Dispatches `yeti:current` on the `.toc`, bubbling and composed (`:36`) | `current` output with `YetiCurrentDetail`; no DOM event | changed ([events](events.md) rules 5 and 6) |
| A page "that ships the mark in its HTML is correct without the module" (manifest `a11y`) | the consumer sets `currentLink` (statically, or bound from data), which renders the mark in the server HTML | changed: through the model, because a static `aria-current` would be written back at hydration (ADR 0003 point 4) |

Nothing of `toc.js` is removed. The model is an addition Part 2 row 41 names (building-blocks 1.4).

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the tokens in section 1's list; with no `variant`, the primary stops; with no `size`, `--yeti-text-md` and `--yeti-space-sm`; and through the always-loaded value rules whichever hue and step a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, with a runtime `setProperty`, or on one element where Yeti says so: `--yeti-toc-padding` "smaller on one `.toc` for a book's own contents page", and `--yeti-toc-hover: transparent` on one toc to turn the hover fill off (`docs.md`), as a static `style` attribute or a `[style.--yeti-toc-padding]` binding, neither of which the directive binds. `--yeti-toc-scroll` is the page's, set on `:root`, and its reduced-motion collapse is Yeti's. Building-blocks 1.9's restore rule mentions a `--yeti-toc-scroll` a directive set on an ancestor; `YetiToc` sets none, so it has nothing to restore. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- **`YetiToc`** is the coordinating root. It provides `yetiTocToken` (`InjectionToken<YetiToc>` in `toc-tokens.ts` with `import type`, `useExisting: YetiToc`; building-blocks 1.9) and keeps the registered links in a signal of a set. Order does not matter: headings are sorted by document position, not links (`toc.js:22-24`), so the registration needs no `MutationObserver` sorting.
- **`YetiTocLink`** injects `yetiTocToken` required: a toc link outside a toc has no meaning (1.9, "required when the part cannot exist alone"). It registers in `ngOnInit` and unregisters on destroy (1.9, Ordered parts). Dependency injection follows the declaration site, so the links are declared in the same template as the `nav` or inside its content (usage rule 3).
- **No heading directive.** Headings are resolved by id from the links' fragments; they are siblings of the toc, not its descendants, and a heading in a dehydrated block has no directive that could register (ADR 0025 point 1). The consumer writes only an `id` on each heading (ADR 0025 consequences).
- **Fragment links.** `YetiTocLink` calls `injectSameDocumentHref(fragment)` with its fragment as a signal ([fragment-links](fragment-links.md) section 4). `YetiToc` injects `YetiFragmentLinks` eagerly, so bare links elsewhere on a page with a toc are handled too (Part 2 row 51; fragment-links section 3). The toc's own links do not need that listener: their `href` is already same-document.
- **Router.** Not injected. `ActivatedRoute.fragment` is not used (Part 2 row 41: "optional"); the mark comes from the observer, not from the URL (fragment-links section 11).
- **No host directives.** No Yeti item always sits on another's element (Part 2, "Two findings"). A list that is a cluster carries `yetiCluster` beside `role="list"` on the `ul` ([cluster](cluster.md)), which shares no input name with the toc.
- **Generated ids:** none. Fragment targets are addressed from outside the application, so heading ids are consumer-supplied (building-blocks 1.5; ADR 0011 clause 8), and the `nav`'s `aria-labelledby` target, if used, is the consumer's static id.
- **Shared input names** (building-blocks 1.4): `variant` is `YetiVariant` and `size` is `YetiSizeControl` on every item that declares them (ticket 26).
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('toc')` ([setup](setup.md); ticket 50 decisions 18 and 45).

### 4. API

| Member | `YetiToc` | `YetiTocLink` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10), so it takes `Yeti` (ADR 0080 point 4) | as `YetiToc` |
| Selector | `nav[yetiToc]` (Part 2 row 41) | `a[yetiTocLink]` (Part 2 row 41) |
| `exportAs` | `yetiToc` | `yetiTocLink` (building-blocks 1.3) |
| Entry point | `ngx-yeti/toc` (building-blocks 1.3; ADR 0011 clause 10) | `ngx-yeti/toc` |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `size: YetiSizeControl \| undefined` (`md`); `numbered: boolean` with `booleanAttribute` (default `false`). No input default differs from Yeti's (ADR 0070 rule 1) | `yetiTocLink: string \| undefined`, the target id without `#`, for a link rendered from data ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208) |
| Models | `currentLink: string \| undefined` (default `undefined`), the target id of the current link ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 207) | none |
| Outputs | `current: YetiCurrentDetail` | none (a part-level output would be `void`, building-blocks 1.4; the root carries the part) |
| Methods | none | none |
| Host | static `class: 'toc'`; static `data-ngx-yeti-item-toc: ''`; `[attr.data-variant]`, `[attr.data-size]` from the inputs, `null` when unset; `[attr.data-numbered]` as `''` or `null`. No binding for HTML `size` (`inert`), `role`, or any ARIA attribute | `[attr.href]` from `injectSameDocumentHref`; `[attr.aria-current]` as `'true'` or `null`. No listener |
| Providers | `yetiTocToken` | none |
| Injection | `DOCUMENT`; `YetiFragmentLinks`; the ADR 0060 styles service through `injectYetiItemStyles` | `yetiTocToken` (required); `HostAttributeToken('href')` (optional); `injectSameDocumentHref` |
| Lifecycle | constructor: `afterNextRender` creates the observer and resolves the headings; an `afterEveryRender` callback resolves missing or disconnected ones after each application render (`NGP/core/src/render3/after_render/hooks.ts:136`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 210); `DestroyRef` disconnects; `injectYetiItemStyles('toc')` last, after anything that can throw | `ngOnInit` registers; `DestroyRef` unregisters |

A static attribute type-checks as a string literal under `strictTemplates`, so `variant="secondary"` compiles and `variant="secundary"` does not (ADR 0070 rule 2).

**The current link.** The observer callback updates the set of intersecting headings and takes the first heading in document order that is in it. If there is none, nothing changes (`toc.js:29-31`). If that heading's link's target id equals `currentLink()`, nothing changes (`:33`). Otherwise the directive sets `currentLink` to that id, which emits `currentLinkChange`, and emits `current` with the link's host element and the heading. Each link's `aria-current` binding reads `currentLink()`, so the look and the announcement come from that one attribute (P11).

**When `current` and `currentLinkChange` fire** ([events](events.md) rules 7 and 9):

- Not for the state found at creation: the model's initial value, bound by the consumer, emits nothing, and it is what the server HTML marks.
- A write through the model's binding (`[(currentLink)]` or `[currentLink]` from the parent) emits nothing, as `model()` emits no change for a parent write (events rule 9, decided in ticket 50). The written link is marked at once and stays marked until the observer next reports a change of what is in view.
- The observer's first report after the observer starts is a change the directive makes: when its topmost visible heading is not the server's mark, the mark moves and both fire, as `toc.js` dispatches at load whenever it moves the mark; when it is the same, nothing fires ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 209).
- Every later move fires both once. A smooth scroll that passes several headings fires once per heading it marks on the way, as `toc.js` does.
- Never on the server, never from a replayed event (the toc has no listener), and never inside `hydrate never`.

**Which links count** (ADR 0025 point 4): only links carrying `YetiTocLink` inside the root. A link's target id is its fragment, decoded with `decodeURIComponent` as `toc.js` does, because "a heading id with a non-ASCII character arrives percent-encoded in the href" (`toc.js:15-16`). A link whose fragment is empty or names no element in the document is a working link the observer ignores until a later render resolves it.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiToc` on a `nav`, as Yeti's markup does; the selector admits no other element. Its one direct child is a `ul` with `role="list"`, holding one `li` per entry; a nested `ul` with `role="list"` inside an `li` makes sub-entries (manifest `children`; `docs.md`). Put `role="list"` on every such `ul`, because Yeti's reset removes the markers and WebKit then removes the list role without it (manifest `a11y.notes`).
2. Name the `nav` with `aria-label` (such as "On this page") or `aria-labelledby` pointing at a visible heading, because a page with a toc has at least two navigation landmarks (manifest `a11y.requiredAttributes`; building-blocks 1.10, Names). Translate it with `i18n-aria-label`.
3. Put `yetiTocLink` on every link of the toc, declared in the same template as the `nav[yetiToc]` or inside its projected content. A link without it is not marked and keeps a bare `href`, which reloads the page under a non-root `<base href>` (ADR 0023). A `yetiTocLink` outside a toc throws a missing-provider error (section 3).
4. Point each link at exactly one heading on the same page by its `id`, and give each heading at most one toc link. Where two links in one toc name one heading, only the one last in document order is marked, as `toc.js` keeps the later link ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 212). Every heading id is consumer-supplied and stable on the server and the client (building-blocks 1.5; ADR 0011 clause 8).
5. Write the link's target as Yeti's static `href="#id"`. For links rendered from data, bind the target id to the selector-named input, `<a [yetiTocLink]="h.id">`, and write no `href` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208). Never bind `[href]`, `[attr.href]`, or `routerLink` on a toc link: the directive binds `href` itself, and a `routerLink` fragment fires no `hashchange` (fragment-links usage rule 3).
6. Never write `aria-current` on a toc link: the directive binds it, and a static one would be written back at hydration (ADR 0003 point 4; building-blocks, "Hydration constraints (2026-10-03)"). To ship the mark in the server HTML, set `currentLink` (`currentLink="install"` or `[currentLink]="routeSection()"`) from a value that is the same on the server and the client.
7. Do not write `class="toc"`, `data-variant`, `data-size`, `data-numbered`, or `data-ngx-yeti-item-toc` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[variant]="$any('info')"`, ADR 0070).
8. For a row of contents rather than a column, put `yetiCluster` on the `ul` beside `role="list"` ([cluster](cluster.md); `docs.md`). Do not put another layout on the `ul`: `toc.css` exempts only `.cluster` from its column rule (`toc.css:31-34`).
9. Offset headings under a sticky header with `scroll-margin-top` on the headings or `--yeti-scroll-padding` on `:root`, never with an input (fragment-links usage rule 4; [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md) point 3). A toc in a sticky sidebar follows the [sidebar](sidebar.md) spec's usage rule on sticky children (ledger A11Y-22).
10. Bind every input and `currentLink` from values that are the same on the server and the client, never from a browser-only read (hydration constraints).
11. Import `YetiToc` and `YetiTocLink` in every component whose template writes their attributes. A **Forgotten import** with only static inputs renders a plain `nav` of bare links with no class and no error; only a bound input, a bound `currentLink`, or a template reference naming an `exportAs` makes the compiler report it (NG8002, NG8003) (building-blocks 1.9).
12. Use the default path location strategy; no fragment link works beside `HashLocationStrategy` (fragment-links usage rule 5).

### 5. Material comparison

Material ships no table of contents or scroll-spy component. The nearest pieces are the navigation list's current item and the Router's current-link directive:

| Aspect | ngx-yeti `toc` | `MatListItem` in `mat-nav-list` (`NC/src/material/list/list.ts:44-85`) | `RouterLinkActive` (`NGP/router/src/directives/router_link_active.ts:148`) |
| --- | --- | --- | --- |
| Shape | an item directive on the consumer's `nav` and a part directive per link | a component on each `a` in a list component | a directive per link |
| What "current" means | the heading topmost in view, from an `IntersectionObserver` | the consumer's `activated` input | the Router's URL match |
| Current marker | `aria-current="true"` bound from the root's model | `aria-current="page"` from `activated` on an anchor (`:57`, `:81-86`) | `aria-current` from `ariaCurrentWhenActive` |
| Two-way state | `currentLink` model, plus the `current` output | none | `isActiveChange` output |
| Styling hook | `aria-current`, read by Yeti's CSS | a class, `mdc-list-item--activated` (`:49`) | a class list |
| `exportAs` | `yetiToc`, `yetiTocLink` | none on the item | `routerLinkActive` |

Borrowed: the anchor-only `aria-current` from a bound state, as Material's list does. Not borrowed: a state class (Yeti styles `aria-current`, P11), `aria-current="page"` (the toc marks a position within one page, so Yeti's value is `"true"`; `page` is for the nav, breadcrumbs, and pagination, building-blocks 1.10), and URL-based activation (`RouterLinkActive` and `ActivatedRoute.fragment` track the URL, not the reading position; Part 2 row 41).

### 6. Implementation level and primitives

Native platform, level 1: `IntersectionObserver` (Part 2 row 41; building-blocks 1.2, inside Baseline 2025), plus native same-document fragment navigation for the links. "The module is one observer; the package gives it a lifecycle" (row 41). No Aria pattern applies: a toc is a navigation landmark of links, and Aria's `Tree` or `Menu` would replace the links' roles, which ADR 0019 rejects for navigation (Part 2 row 41, "none"; building-blocks 1.10). No CDK piece is used: there is no id, focus, keyboard, or direction read, and `ScrollDispatcher` would listen to scroll events, which `toc.js` avoids on purpose ("a scroll handler would run on every frame of every scroll", `toc.js:3-6`). The links' `href` is the [fragment-links](fragment-links.md) shared-utility spec's, which is custom Angular over the platform's fragment navigation. Smooth scrolling and its reduced-motion collapse are Yeti's CSS (`scroll-behavior` with a token, building-blocks 1.6 rule 4).

The three features the manifest lists as unguarded, `IntersectionObserver`, `:has()`, and `scroll-behavior`, are inside Baseline 2025 (building-blocks 1.2's first column), so the package adds no guard and no feature detection. RTL is Yeti's: the bar is a logical start-edge border and the number box a logical padding (`toc.css`), so the package reads no `Directionality`.

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** none as a widget. A toc is a `nav` landmark (WAI-ARIA landmark regions) holding a list of links; the APG's landmark guidance asks that a page with more than one `navigation` landmark name each one, which usage rule 2 states.
- **Roles and states:**

| Element | Role (native or consumer's) | Name | State bound by the package |
| --- | --- | --- | --- |
| `nav[yetiToc]` | `navigation` (native) | the consumer's `aria-label` or `aria-labelledby` | none |
| `ul` | `list`, kept by the consumer's `role="list"` | none | none |
| `li` | `listitem` (native) | none | none |
| `a[yetiTocLink]` | `link` (native, because it has an `href`) | its text; a numbered toc's number is excluded by Yeti's empty alternative text (`toc.css:79`) | `aria-current="true"` on the current link only |

- **Keyboard and focus:** the browser's. Each link is one Tab stop in document order, and Enter follows it with no script; the directives add no `tabindex`, no key handler, and no focus move. Following a link moves the sequential focus starting point to the heading, which is the platform's fragment navigation ([fragment-links](fragment-links.md) section 7). The focus ring is Yeti's base `:focus-visible` rule.
- **Announcements:** `aria-current="true"` is read as "current" when the reader reaches the link. Mark moves are not announced as they happen, as in Yeti; the toc is a navigation aid, not a status message.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The landmark, the list with its nesting, and the current state are native roles plus one ARIA state. `toc--default` and `toc--numbered` assert the computed roles, the list's item count, and the nesting. |
| 1.4.1 Use of Color | The current link differs by weight and a start-edge bar as well as by hue (`toc.css:55-59`). `toc--default` asserts that the current link's `font-weight` and `border-inline-start-color` differ from a sibling's, as Yeti's test does. |
| 1.4.3 Contrast (Minimum) | Non-current links are `--yeti-color-text-muted`; the current link is the variant's text colour. Play functions assert at least 4.5:1 for both, and for a hovered link over its fill, with the exact WCAG formula on computed colours, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8), for the default and for each variant `toc--variants` shows. |
| 1.4.10 Reflow | A column of block links; layer 4 asserts no horizontal overflow at 320 CSS pixels for the column, the numbered list, and the cluster row. |
| 1.4.11 Non-text Contrast | Not asserted for the bar: the state is not drawn by colour alone (1.4.1), so building-blocks 1.10's ratio assertion for colour-only states does not apply. The focus ring is Yeti's base rule. |
| 1.4.12 Text Spacing | The links are block boxes with padding, not fixed heights; layer 4 applies the 1.4.12 spacing and asserts no clipped link text. |
| 2.4.1 Bypass Blocks | The links reach the page's sections without a reload under any `<base href>`, in every rendering mode, through the same-document `href` (ledger A11Y-16, owned by fragment-links). |
| 2.4.3 Focus Order | Links follow document order; following one moves the focus starting point to the heading (fragment-links section 7). |
| 2.4.5 Multiple Ways | A toc is one of the ways; the item adds no requirement. |
| 2.4.6 Headings and Labels | The `nav` has a descriptive name (usage rule 2); each link names its section with the heading's own words, which the examples show. |
| 2.4.7 Focus Visible | Yeti's base focus ring on each link; `toc--keyboard` asserts a non-`none` outline on the focused link. |
| 2.4.11 Focus Not Obscured (Minimum) | A heading under a sticky header is the consumer's to offset (usage rule 9); a toc in a sticky sidebar shares A11Y-22's usage rule ([sidebar](sidebar.md)). |
| 2.5.8 Target Size (Minimum) | Each link is a full-width block with `--yeti-toc-padding` above and below. `toc--default` and `toc--sizes` assert a link box at least 24 CSS pixels tall at each size. A consumer who sets `--yeti-toc-padding` smaller keeps the `xs` gap between rows, so the spacing exception applies (inferred from the column's gap, `toc.css:33`). |
| 3.2.3 Consistent Navigation | The toc does not reorder its links: the observer only marks. |
| 4.1.2 Name, Role, Value | Roles are native; the name is the consumer's (usage rule 2); the current state is `aria-current`, bound from one signal, so the look and the announcement never disagree (P11). |

2.3.3 Animation from Interactions is AAA and outside the target; Yeti's token already turns smooth scrolling off under reduced motion, and layer 4 asserts it.

**Forced colours** (not an AA criterion of its own; the package's accessibility CSS is allowed by the user's ruling "Accessibility CSS: Yes.", map, Standing rulings). Under forced colours the hue difference of the current link is replaced by the system text colour; its weight survives, and whether the start-edge bar stays visible is not known: transparent borders on the other links and the current link's coloured border may both be forced to one system colour (inferred, not measured). Following ticket 50 decision 88's pattern for the breadcrumbs' current step: no ledger row and no package CSS now; layer 4 asserts that the weight difference survives `forcedColors: 'active'` in three engines and records the bar's computed colour and a screenshot. If the weight difference fails, a ledger row owned by `toc` and one `@layer ngx-yeti` rule follow, after A11Y-1f ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 213).

**Ledger rows owned:** none (Part 2 row 41: "none (like-for-like)"). The replacement of `toc.js` is like-for-like (ADR 0040 consequences), and the `aria-current` mark is Yeti's own. The same-document `href` is A11Y-16, owned by [fragment-links](fragment-links.md); this spec's layer 4 runs that row's toc case ("under `/sub/`: toc link ... reload is a failure").

### 8. Rendered HTML

Consumer markup, after Yeti's docs and fixture, on a route `/guide` under `<base href="/docs/">`, with the server's mark set from data:

```html
<nav yetiToc aria-label="On this page" i18n-aria-label numbered [currentLink]="opening()" (currentLinkChange)="opening.set($event)">
  <ul role="list">
    <li><a yetiTocLink href="#one" i18n>Getting the files</a></li>
    <li>
      <a yetiTocLink href="#two" i18n>The stylesheet</a>
      <ul role="list">
        <li><a yetiTocLink href="#linking" i18n>Linking it</a></li>
      </ul>
    </li>
    <li><a yetiTocLink href="#three" i18n>A module</a></li>
  </ul>
</nav>
```

With `opening()` equal to `'two'`, the server HTML is:

- the `nav`: `yetitoc=""`, `aria-label` (translated), `numbered=""`, `class="toc"`, `data-ngx-yeti-item-toc=""`, `data-numbered=""`, and no `data-variant` or `data-size`, so Yeti's primary hue and `md` step apply;
- each link: `yetitoclink=""`, `href="/docs/guide#one"` (and `#two`, `#linking`, `#three`), the current path and query under the base href plus the fragment (fragment-links section 8); the second link also carries `aria-current="true"`;
- no `id`, `role`, `tabindex`, or `jsaction` from the package on any element.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/toc/toc.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="toc"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). Its rank is `Y/src/yeti.css:51`, after `pagination` and before `alert`. The client adopts the link at bootstrap.

After hydration the DOM equals the server HTML. In the first render callback the observer starts; its first report marks the topmost heading in view. If that is `#one`, the second link loses `aria-current`, the first gains it, and `currentLinkChange` and `current` fire once; if it is `#two`, nothing changes and nothing fires. After a Router navigation to `/guide?lang=da` that reuses the component, every `href` becomes `/docs/guide?lang=da#...` (fragment-links section 8).

The delta from Yeti's docs markup: the consumer writes `yetiToc` and input names where the docs write `class="toc"` and `data-*` names, `yetiTocLink` on each link, and `currentLink` where a page would ship `aria-current` in its HTML; the `href`s gain the current path.

### 9. Animation

Yeti's own, all CSS, with no package code (building-blocks 1.6; [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md)):

- **The mark:** colour and border colour transition over `--yeti-duration-fast` with `--yeti-ease` when `aria-current` moves (`toc.css:47`). The bar is on every link, transparent until current, "so the text never shifts sideways as the mark moves" (`:41-43`). No completion output: the toc has none.
- **Scrolling to a heading:** `scroll-behavior: var(--yeti-toc-scroll)` on `html` while a `.toc` (or a nav with in-page links) is on the page (`toc.css:6-9`); the browser's smooth scroll, never a script.
- **Reduced motion:** `--yeti-toc-scroll` collapses to `auto` and the motion tokens to near zero (`Y/src/tokens/components.css:178-182`; `motion.css`), so a link jumps and the mark switches at once.
- **Enter and leave:** a toc the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered toc never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the same-document `href`s, `aria-current` on the link the model names, and the item link in `<head>` (section 8). Everything at first paint is a host binding or the consumer's template (ADR 0011 clause 1). The mark is **Pre-hydration state** only through the model: no person and no Yeti module changes it before hydration, because no module is loaded (ADR 0040).
- **Before hydration:** the directives create no node, start no observer, read no layout, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition and the `Location` read inside `injectSameDocumentHref`, which run on the server too. The links work natively, and the page scrolls smoothly by CSS.
- **Full hydration:** the hosts are claimed as they are; the `href`s and `aria-current` are computed from the same URL and the same model value, so hydration rewrites nothing (0 style mutations, ADR 0060 point 5, measured for the mechanism). The observer starts in the first `afterNextRender`, and its first report may move the mark (section 4).
- **Event replay:** nothing to replay. Neither directive declares a listener, so the links carry no `jsaction` and ADR 0011 clause 3 cannot cancel their navigation; a click before hydration has already moved to the heading natively (fragment-links section 10). No `current` output is replayed (events section 10).
- **Incremental hydration (`@defer (hydrate on ...)`):** a toc inside such a block is its server HTML until the block hydrates: working links, the server's mark, and its item link held by the presence attribute (ADR 0060 point 4). After hydration it starts marking. A toc and its links share one hydration boundary (ADR 0025 consequences; building-blocks 1.11 decision 6).
- **Headings in other boundaries:** headings are exempt from the shared-boundary rule; they are observed from their server-rendered elements before and without their hydration, because the directive only observes them and never writes to them (ADR 0025 point 2; building-blocks 1.11 decision 6).
- **`hydrate never`:** the toc is its server HTML: styled, with working same-document links and the server's mark, which never moves, because moving it needs Angular. ADR 0060 point 4 and ADR 0045's presence attribute keep its item link, and with it the page's smooth scrolling, while live tocs elsewhere leave; layer 4 asserts it. Its `href`s are never updated, so they go stale only if the Router reuses the route's component for another path (fragment-links section 10, stated residue).
- **Client-only `@defer`, `@if`, routed views:** a toc rendered on the client sets itself up when created (ADR 0040). Its item file is fetched when `YetiToc` is constructed, which can show unstyled frames (a bulleted list of underlined links); the consumer closes the gap with `provideYetiStyles({ preload: ['toc'] })` (ADR 0060 point 6; [setup](setup.md)). Headings that such a block renders later are picked up by the resolution after each render (ADR 0025 point 3).
- **`withI18nSupport()`:** link text and the `nav`'s name are usually translated with `i18n` and `i18n-aria-label`. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). Translated text does not change any `href` or id.
- **Zoneless:** inputs and `currentLink` are signals read by host bindings; the observer callback writes `currentLink` and the registered-link set are signals, so the view refreshes with no zone (map, Standing rulings, item 43; building-blocks 1.5; ticket 18, measured for the mechanism).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the toc is styled, named, and listed; every link moves to its heading without leaving the page, because its `href` is same-document in the server HTML; the page scrolls smoothly unless the reader prefers reduced motion. What is lost: the mark never moves from the server's, and `current` never fires. A client-only application gets no such promise.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-variant`, `data-size`, and `data-numbered` come from inputs; `href` comes from the URL through `Location`, equal on both ends (fragment-links section 10); `aria-current` comes from the model's initial value, which usage rule 10 keeps equal on both ends. The observer changes `aria-current` only after hydration, through the binding.
- **No direct DOM manipulation:** the directives write nothing outside host bindings. The observer reads intersections and writes a signal. The item link is the ADR 0060 service's, written on the server and adopted on the client.
- **Valid HTML:** `nav > ul > li > a`, with nested `ul` inside `li`, as Yeti writes it. The directives change no element.
- **`preserveWhitespaces`:** the directives have no template; white space in the list is the consumer's and is the same on both ends.
- **No output branched on the platform:** none. The only platform-dependent work is in render callbacks (building-blocks 1.11 decision 3).
- **Static attributes the directives bind:** usage rules 5 to 7 keep the consumer from writing them. The one documented exception is the link's static `href="#id"`, which the directive reads once and replaces with its same-document form in the same hydration pass (ADR 0023's 2026-10-03 note; ticket 50 decision 4). The static `size` is `inert` and never bound, so hydration writes back the value the server rendered.

### 12. Single-page application

- **Fragment links:** every toc link is a package-owned link with a same-document `href`, so following it never reloads the application, before or after hydration, with JavaScript off, and on modified clicks or "open in new tab" ([fragment-links](fragment-links.md) section 4 and usage rule 2; ADR 0023 point 1; ledger A11Y-16). Following one fires `hashchange` and `popstate` natively, which [fragment-links](fragment-links.md) section 11 describes, including its interaction with [navigation-close](navigation-close.md). The mark comes from the observer, not from the fragment (fragment-links section 11).
- **Route changes:** a toc in a route leaves with it, its observer disconnected and its links unregistered, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-toc]` host is connected (ADR 0060 point 4; ADR 0045). A toc in the persistent shell outside the `router-outlet` keeps its item link; its `href`s follow the new URL through `Location.onUrlChange`; headings of the old route disconnect and are unobserved, and the new route's headings with the same ids are resolved after the next render (ADR 0025 point 3). Between the two, the last mark stays (`toc.js:29-31`).
- **Smooth scrolling for the nav:** while any toc is on the page, `toc.css`'s `html:has()` rule also gives a nav's bare in-page links smooth scrolling; when the last toc leaves, they jump ([nav](nav.md) usage rule 15; ADR 0060 point 9; ticket 23's X3, "Accept and document").

### 13. Item file

`yeti-css/css/components/toc/toc.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiToc` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:51`, after `pagination` and before `alert`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-toc` has left the DOM. `YetiTocLink` acquires nothing and sets no presence attribute: Yeti's rules for links apply only under `.toc`, and the root's attribute keeps the file loaded (ticket 50 decision 6). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]` and `[data-size]` value rules and the tokens, `--yeti-toc-scroll` among them), and optionally `provideYetiStyles({ preload: ['toc'] })`. Cross-item files acquired: none. `toc.css` names `.cluster` in `.toc > ul:not(.cluster)` (`toc.css:31-34`), and that rule is the toc item's; a `yetiCluster` on the list acquires the cluster's own item file ([cluster](cluster.md) section 13). `toc.css` also holds the `html:has()` scrolling rule that a nav's in-page links share; it is documented, not loaded by the nav (ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, which link carries `aria-current` after a scroll, the `href` in server and hydrated HTML, the `current` output's elements, the item link, the computed roles and names, and the contrast of each link state. It never asserts a private field, how many headings the observer holds, or how the styles service counts. No test depends on a public token's default value or a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the padding test compares a link's padding with the resolved `--yeti-space-xs`, as Yeti's `toc.spec.js` does, and contrast asserts the criterion's ratio, never a colour value. Scroll-driven cases wait for the observer with polling, as Yeti's test does (`expect.poll`), never with a fixed sleep. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s and building-blocks 1.12's.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the `toc` item file through the directive, as a consumer would (ADR 0014 point 1). Each story renders Yeti's fixture shape: a toc and tall sections with `h2` and `h3` headings whose ids the links name, so the story's own document scrolls. Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every play function asserts a `navigation` landmark with a non-empty name, a `list` with the expected item count, and that no toc link carries a `jsaction` or a `tabindex` from the package. `current` and `currentLinkChange` are declared as actions in `argTypes` ([events](events.md) layer 1). Story ids:

- `toc--default`: Yeti's three-link toc. Asserts `class="toc"`, `data-ngx-yeti-item-toc`, and no `data-variant`, `data-size`, or `data-numbered`; each link's `href` ends with its fragment and is not a bare `#` form; after load, the first link is current (polling); scrolling `#two` into view moves `aria-current` to the second link, removes it from the first, and fires `current` once with that link and heading (after Yeti's "moves the mark and announces it"); the current link's colour, `border-inline-start-color`, and `font-weight` differ from a sibling's; the muted link, the current link, and a hovered link meet 4.5:1 in a light and a dark `color-scheme` wrapper (ticket 50 decision 8); each link box is at least 24 CSS pixels tall; padding-top equals the resolved `--yeti-space-xs` within 1 px; no document listener received a `yeti:current` event.
- `toc--between-headings`: sections taller than the viewport. Scrolling to a point where no heading is in view keeps the last mark and fires nothing (`toc.js:29-31`).
- `toc--out-of-order`: links written in another order than their headings, as Yeti's numbered fixture does. Scrolling to the top marks the link of the first heading in document order.
- `toc--numbered`: Yeti's numbered fixture with a nested list and a wrapping title. Asserts `data-numbered`, that the nested link's `::before` content uses `counters(toc, ".")`, that the wrapping title's lines start at the same edge (after Yeti's test), that the nested link's text lines up with its parent's, and that `getByRole('link', { name: 'The stylesheet', exact: true })` finds the link with no number in its name.
- `toc--variants`: the hued variants on suitable paints, each with one link current. Asserts each `data-variant` value and 4.5:1 for the current and the muted link in both scheme wrappers.
- `toc--sizes`: `sm`, `md`, `lg`, and a toc with `--yeti-toc-padding: 2px` set on itself beside one without. Asserts each `data-size`, the 2 px padding on that toc alone (after Yeti's test), and a static `size="sm"` rendering both `size="sm"` and `data-size="sm"` (the `inert` kind).
- `toc--hover`: hovering a link fills it; with `--yeti-toc-hover: transparent` set on the toc, the fill is transparent (after Yeti's test).
- `toc--cluster`: a toc whose `ul` carries `yetiCluster`. Asserts the list's `flex-direction` is `row`, two links share a top edge, and a plain toc beside it is still a column (after Yeti's test).
- `toc--model`: a toc with `[(currentLink)]` bound to a signal shown in the story and a Storybook control. Setting the control to `'three'` marks the third link with no `current` and no `currentLinkChange`; scrolling then moves the mark, fires both once, and updates the signal.
- `toc--dynamic`: links rendered with `@for` from a list through the `yetiTocLink` input, and a fourth section with its heading rendered by an `@if` toggled from a control ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208, for the input). Asserts each link's `href` from its input; after the fourth section renders and is scrolled into view, its link is marked (ADR 0025 point 3); after it is removed, the mark stays where it was until another heading comes into view.
- `toc--keyboard`: Tab reaches each link in document order with a non-`none` outline; Enter on the third link moves the URL fragment to `#three` and keeps the document (a reload marker on `window` survives).

### Layer 2: browser-level (`npx nx test <lib>`, `toc.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiToc, { tagName: 'nav' })`: the host has class `toc` and `data-ngx-yeti-item-toc`, and no `data-variant`, `data-size`, `data-numbered`, `size`, `role`, or ARIA attribute; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` or `false` removes them.
- While a `YetiToc` fixture lives, one `<link data-ngx-yeti-styles="toc">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.

A small test host covers what `createDirective` cannot (a parent with parts, and headings outside the toc), with tall sections in the test iframe and polling for the observer:

- Registration: three `a[yetiTocLink]` inside the `nav[yetiToc]`; an `a[yetiTocLink]` with no toc around it throws a missing-provider error for `yetiTocToken`.
- `href`: with `provideLocationMocks()` and `APP_BASE_HREF` `/sub/`, each link renders `/sub/<path>#<fragment>`; a link with a `yetiTocLink` input and no `href` renders the same form; changing the input updates the `href`.
- The mark: scrolling the second heading to the top marks its link and emits `current` once with `{ link, heading }` equal to the host elements, and `currentLinkChange` once with `'two'`; scrolling back emits again; a scroll that leaves no heading in view emits nothing.
- First report: with `currentLink` bound to `'one'` and the first heading in view at start, nothing emits; with it bound to `'three'` and the first heading in view, the first report moves the mark and emits once ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 209).
- A parent write to `currentLink` marks that link and emits nothing (events rule 9).
- Resolution after render: a heading rendered later by `@if` is observed after the next render and marked when scrolled into view; a heading removed and rendered again with the same id is observed again; a link whose fragment names no element emits nothing and throws nothing; a link with a malformed percent-encoding (`#%E0%A4%A`) throws nothing and is never marked ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 211); a percent-encoded non-ASCII fragment resolves its heading.
- Two links to one heading: only the one last in document order is marked ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 212).
- Destroy: after `fixture.destroy()`, scrolling emits nothing (the observer is disconnected), and a destroyed link no longer receives the mark.
- No `CustomEvent` is dispatched on the host or the document ([events](events.md) layer 2); neither host has a listener.
- The template reference `#t="yetiToc"` resolves and exposes `currentLink()`.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `toc.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()`, the URL `/sub/guide?lang=da`, `APP_BASE_HREF` `/sub/`, and a fixture of section 8's markup whose link texts and `aria-label` carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the `nav` renders `class="toc"`, `data-ngx-yeti-item-toc`, `data-numbered=""`, the inert static `size` where the fixture writes one, and no `data-*` for an unset input; every link renders `href="/sub/guide?lang=da#<fragment>"`; the link the bound `currentLink` names renders `aria-current="true"` and no other link does; with `currentLink` unbound, no link carries `aria-current`; no element carries a `jsaction`, an `id`, or a `role` from the package; `<head>` holds one item link with `data-ngx-yeti-styles="toc"`, `data-beasties-skip`, and an `href` ending `components/toc/toc.css?v=<pin>`; no error is thrown from a `document`, `window`, or `IntersectionObserver` access on the server.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `toc` has `YetiToc`; `data-variant` and `data-size` have inputs whose unions equal the manifest's vocabularies `variant` and `size-control`, and `data-numbered` a boolean input; the item has no markers; the event `yeti:current` has the output `current` on `YetiToc`, whose payload type's keys equal the event's `detail` keys `link` and `heading` ([events](events.md) layer 3). A pin move that adds an attribute, a value, or a key fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids:

- **Smooth scrolling and reduced motion:** on `toc--default`, `html`'s computed `scroll-behavior` is `smooth`; with `emulateMedia({ reducedMotion: 'reduce' })` and a reload it is `auto`, and following a link reaches the heading in one frame (after Yeti's test).
- **Forced colours:** on `toc--default` under `emulateMedia({ forcedColors: 'active' })`, the current link's `font-weight` still differs from a sibling's in Chromium, Firefox, and WebKit; the bar's computed `border-inline-start-color` on the current and a non-current link and a screenshot are recorded, not asserted (ticket 50 decision 88's pattern) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 213).
- **Reflow, spacing, and contrast:** at a 320 px viewport, `toc--default`, `toc--numbered`, and `toc--cluster` do not overflow horizontally (1.4.10); with the 1.4.12 text-spacing stylesheet applied, no link's text is clipped; `toc--variants` repeats the contrast assertions with `emulateMedia({ colorScheme: 'light' })` and `'dark'`.
- **Modified clicks:** Ctrl-click and middle click on a toc link open a new page at the same route plus fragment and leave the first page unchanged (fragment-links case 4).

Fixture-app half, built with `outputMode: 'server'`, served under `<base href="/sub/">`, with a `/sub/toc` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each with a query string and each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences; ledger A11Y-16's "under `/sub/`: toc link"). The route renders section 8's markup with `currentLink` bound to the second section:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; every element's attributes after hydration equal the server HTML's until the observer's first report; after it, the link of the topmost heading in view is the only current link;
- following a toc link with JavaScript disabled, before hydration (`main.js` held back), and after hydration keeps the document (the reload marker survives) and ends at `/sub/toc?<query>#<fragment>` with the heading at the scroll padding's offset (fragment-links case 1);
- with JavaScript disabled, the toc is styled, the second link carries `aria-current="true"`, every link works, and `@axe-core/playwright` with the six tags reports no violation;
- a toc inside `@defer (hydrate on interaction)` works natively before its trigger and marks after it; a toc inside `hydrate never` keeps its item link, its server mark, its working links, and the page's smooth scrolling after every live toc on the page is removed (ADR 0060 point 4; ADR 0045);
- headings inside a `@defer (hydrate on viewport)` block that has not hydrated are marked by a live toc outside it (ADR 0025 point 2); headings inside a client-only `@defer (on timer(500ms))` block are marked once rendered (ADR 0025 point 3);
- a toc inside a client-only `@defer` block with `toc` in the preload list shows no unstyled frame;
- a toc in the persistent shell outside the `router-outlet`: after a `routerLink` to another route with the same heading ids, every `href` names the new route and scrolling the new route marks its headings; navigating to a route without a toc and back removes and re-inserts the item link;
- a nav of bare in-page links on a route without a toc: `html`'s `scroll-behavior` is `auto`, recorded as ADR 0060 point 9's documented residue.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/toc.spec.js` with the fixture `test/browser/fixtures/components/toc.html` for the topmost-heading mark, the move and its event, the drawn difference, smooth scrolling and reduced motion, links without the module, the per-element padding token, the hover token, the cluster row, the numbered list, and axe; [Prototype: Yeti's modules in a single-page Angular app](../prototypes/yeti-spa/README.md) for the reload table under `<base href>`; ticket 18's fixture app for the `hydrate never` and `@defer` cases; the [carousel](carousel.md) spec's data-driven dots for the `@for` case; the [fragment-links](fragment-links.md) spec's layer 4 for the reload marker.

## Out of Scope

- A heading directive, a registry of headings, or a typed reference from link to heading (ADR 0025 point 1 and its considered options).
- A document-wide `MutationObserver` to find headings (ADR 0025 considered options).
- Generating the list from the page's headings. The consumer writes the links, as Yeti's markup does; a list built from data uses `@for` (usage rule 5).
- Observer options as inputs (`rootMargin`, `threshold`, a scroll root other than the viewport). Yeti uses the default options on purpose (`toc.js:39-43`; Part 2 row 41).
- Scrolling to the heading when `currentLink` is written. The model moves the mark only; following a link is the platform's.
- Marking from the URL fragment or the Router (`ActivatedRoute.fragment`, `RouterLinkActive`); the mark is the reading position (Part 2 row 41).
- `aria-current` values other than `"true"`; announcing mark moves as a live region.
- A DOM `yeti:current` event for non-Angular code ([events](events.md) Out of Scope).
- An input per token, a scroll-behaviour input, or an offset input (ADR 0004; ADR 0023 point 3).
- Loading `toc.css` for a nav's smooth scrolling when no toc is on the page (ADR 0060 point 9).
- A forced-colours rule now (section 7) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 213).
- Any check that the host is a `nav`, that it is named, that every link carries `yetiTocLink`, or that each fragment resolves. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `nav[yetiToc]` with `variant`, `size`, `numbered`; part directive `a[yetiTocLink]`; no directive on `ul` or `li` | building-blocks Part 2 row 41; ticket 26 rows 156 to 158; building-blocks 1.1 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant`, `YetiSizeControl`, and `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert` on the `nav` | building-blocks 1.4; ticket 26 row 157 |
| The current link is a model, named `currentLink` and not `current`, holding the target id | building-blocks 1.4; ticket 40 point 3; ticket 50 decision 5 (name and value type: ticket 50 decision 207) |
| `current` output with `YetiCurrentDetail`; no DOM event; fires when the mark moves, not for a parent write | [events](events.md) rules 2, 5, 8, and 9; ADR 0025 point 5 |
| `aria-current="true"` bound on each link from the root's model; never a class | architecture-guide P11; building-blocks 1.10, Current page; ADR 0025 point 5 |
| Headings resolved by id from the links' fragments; no heading directive; resolved again after each render | ADR 0025 points 1 to 3 |
| One `IntersectionObserver` per toc, default options, created in `afterNextRender`, disconnected on destroy; the last mark stays between headings | Part 2 row 41; building-blocks 1.5 and 1.15; `toc.js:29-31`, `:39-50` |
| Links render a same-document `href`, read from the static `href` or the `yetiTocLink` input | ADR 0023 point 1 and note; ticket 50 decision 4; [fragment-links](fragment-links.md) (input: ticket 50 decision 208) |
| `YetiToc` injects `YetiFragmentLinks` eagerly | Part 2 row 51; fragment-links section 3 |
| Root provides `yetiTocToken`; links inject it required and register | building-blocks 1.3, 1.9 |
| `YetiToc` marks its host with `data-ngx-yeti-item-toc` and calls `injectYetiItemStyles('toc')` last; the link part does neither | ADR 0045; ADR 0060 point 2; ticket 50 decisions 6, 42, and 45 |
| `exportAs`; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/toc` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1; `toc.js` replaced like-for-like; no Aria or CDK piece; no ledger row | Part 2 row 41; ADR 0040; building-blocks 1.2 |
| Smooth scrolling is Yeti's CSS under its reduced-motion token; no package code | ADR 0023 point 3; building-blocks 1.6 rule 4; `toc.css:6-9` |
| `toc.css` holds the rule that names `.cluster`; the cluster's own file comes with `yetiCluster` | ADR 0060 point 9; [cluster](cluster.md) section 13 |
| The nav's smooth scrolling depends on a loaded toc and is documented, not loaded | ADR 0060 point 9; ticket 23 X3; [nav](nav.md) usage rule 15 |
| Forced colours: assert the weight, record the bar, no rule now | ticket 50 decision 88's pattern (ticket 50 decision 213) |
| 4.5:1 text contrast asserted for each link state, in both schemes | ADR 0015 point 3; ticket 50 decision 8 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes under `/sub/` | ticket 50 decision 2; ledger A11Y-16 |

### Usage examples

A guide's contents in a sticky sidebar, after Yeti's docs:

```html
<div yetiSidebar side="end" width="sm">
  <article>
    <h2 id="install" i18n>Install</h2>
    ...
    <h2 id="usage" i18n>Usage</h2>
    ...
  </article>
  <aside yetiSidebarChild sticky>
    <nav yetiToc aria-label="On this page" i18n-aria-label variant="secondary" size="sm">
      <ul role="list">
        <li><a yetiTocLink href="#install" i18n>Install</a></li>
        <li><a yetiTocLink href="#usage" i18n>Usage</a></li>
      </ul>
    </nav>
  </aside>
</div>
```

```ts
import { YetiToc, YetiTocLink } from 'ngx-yeti/toc';
import { YetiSidebar, YetiSidebarChild } from 'ngx-yeti/sidebar';

@Component({
  selector: 'app-guide',
  imports: [YetiToc, YetiTocLink, YetiSidebar, YetiSidebarChild],
  templateUrl: './guide.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Guide {}
```

A contents list from data, with the reader's position mirrored in a sticky title ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 208, for the `yetiTocLink` input):

```html
<nav yetiToc aria-label="Contents" i18n-aria-label numbered [(currentLink)]="section" (current)="onCurrent($event)">
  <ul role="list">
    @for (h of headings(); track h.id) {
      <li><a [yetiTocLink]="h.id">{{ h.title }}</a></li>
    }
  </ul>
</nav>
<p class="app-reading">{{ titleOf(section()) }}</p>
```

```ts
export class Book {
  readonly headings = input.required<readonly { id: string; title: string }[]>();
  readonly section = signal<string | undefined>(undefined);

  titleOf(id: string | undefined): string {
    return this.headings().find((h) => h.id === id)?.title ?? '';
  }

  onCurrent({ heading }: YetiCurrentDetail): void {
    console.debug('now reading', heading.id);
  }
}
```

`YetiCurrentDetail` is imported by type from `ngx-yeti/events`. A row of contents beside a settings rail: `<nav yetiToc aria-label="Settings sections"><ul yetiCluster role="list">...</ul></nav>`, importing `YetiCluster` as well. A book's own contents page with tighter rows, in the consumer's stylesheet: `.app-book-contents { --yeti-toc-padding: 2px; }` on an **Application class** on the `nav`. No hover fill on one toc: `style="--yeti-toc-hover: transparent"`. A page whose toc renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['toc'] })`.

What no longer works as in Yeti's docs: `class="toc"` and `data-*` written by hand (usage rule 7), a static `aria-current` on a link (usage rule 6; use `currentLink`), `(yeti:current)` (compile error) and `document.addEventListener('yeti:current', ...)` (nothing dispatches it; use `(current)`).

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/toc/toc.css`, loaded by `YetiToc` as a counted link (section 13). The consumer writes nothing for the toc beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-variant` to a hue's ladder and `data-size` to a text and space step; `tokens/components.css` declares `--yeti-toc-scroll` and `--yeti-toc-padding` and collapses the scroll token under reduced motion (`:102`, `:106`, `:178-182`); `base/typography.css:8` sets `scroll-padding-block-start` from `--yeti-scroll-padding`, where a followed link's heading stops; the base reset removes list markers and the base focus ring draws `:focus-visible`.
3. **Cross-item rules:** `toc.css` names `.cluster` (`.toc > ul:not(.cluster)`) and `.nav a[href^="#"]` (the `html:has()` scrolling rule). The first is the toc's own rule, and a `yetiCluster` on the list brings the cluster's file. The second gives a nav's in-page links smooth scrolling only while a toc is on the page, documented and not loaded by the nav (ADR 0060 point 9; [nav](nav.md)).
4. **Tokens:** reads section 1's tokens; writes none (section 2).
5. **What breaks without the item file:** the toc renders as a plain `nav` with a bulleted, indented list of underlined links in the body colour; the current link is not drawn differently, although `aria-current` is still announced; a numbered toc shows no numbers; and in-page links on the page jump instead of scrolling smoothly. No error is raised. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `toc` produced none.

### Platform features to adopt when the browser target moves

- **Scroll-state container queries** or a CSS scroll-marker group could let the browser mark the current link itself. Neither is in Baseline 2025 (inferred, not checked against web-features data), and Yeti does not use them at the pin; the package changes only when Yeti does, because the mark's look is Yeti's CSS.
- **The Navigation API** would let [fragment-links](fragment-links.md) see every navigation; the toc gains nothing of its own from it.
- No other: `IntersectionObserver`, `:has()`, and `scroll-behavior` are inside Baseline 2025 (section 6).

### Single-page-application pieces relied on

- [fragment-links](fragment-links.md): `injectSameDocumentHref` for every toc link, and `YetiFragmentLinks`, injected eagerly by `YetiToc` (section 3).
- [events](events.md): the `current` output's rules and `YetiCurrentDetail`.
- Not used: [navigation-close](navigation-close.md) (the toc opens nothing) and [generated-ids](generated-ids.md) (heading ids are the consumer's).
- ADR 0060's styles service for route changes (section 12).
