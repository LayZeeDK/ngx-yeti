# Spec: accordion (component item)

Ticket: [71. Spec: accordion (component)](../issues/71-spec-accordion.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 21, its "Aria decisions (2026-10-03)" row 21 (the user's choice "Heading in summary (Recommended)", quoted in the map's Standing rulings), its "Hydration constraints (2026-10-03)" section, and Part 1; the map's Standing rulings on open state ("Never bind; read once (Recommended)"), Aria composition, hydration constraints, JavaScript off, zoneless, package CSS for accessibility ("Accessibility CSS: Yes."), and directive testing ([map.md](../map.md)); [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md), [Prototype: fitting Angular Aria to Yeti by directive composition](../issues/30-prototype-fitting-aria-by-directive-composition.md), [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md), [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md), and [Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../issues/34-prototype-subclassing-aria-and-open-binding-forms.md); [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 18, 42, 45, and 68); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md) (its open-state note), [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns [ledger.md](../ledger.md) row A11Y-11. Shared specs: [events](events.md), [fragment-links](fragment-links.md), [setup](setup.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 95 to 99), and each is cited where it applies.

## Problem Statement

Yeti's `accordion` is "a column of disclosures built on details and summary, each opening to show its panel, with the browser doing the opening, the keyboard, and the announcing" (`Y/src/components/accordion/manifest.json`). It is one **Identity class**, `accordion`, on an element whose direct children are two or more `details`, each with a `summary` first. It has no **Attribute**, no **Marker**, no **Module** (`"js": null`), and no **Event**. One at a time is the browser's own exclusive accordion: every `details` of the set carries the same `name`, and Yeti deliberately offers no attribute for it, "because CSS cannot set an attribute on an element — only the markup or a script can — and here the markup already can" (`Y/src/guides/components.md:212`). The look of a single disclosure (the strong summary, the turning chevron, the panel that grows open on a grid row) is already in Yeti's always-loaded base layer (`Y/src/base/media.css:58-123`); `accordion.css` adds only the border around the set, the line between rows, the summary's own surface, and the padding.

An application developer using the package cannot write `class="accordion"` (ADR 0003 points 1 and 2), and needs the `accordion` **Item file** loaded while an accordion is on the page and removed when none is (ADR 0060). Without it the rows still open and close, but the set loses its border, separators, summary surface, and panel padding, with no error.

Three more things make this item more than a class:

- **Open state is Pre-hydration state.** A visitor can open or close a `details` before hydration, with JavaScript off, or inside a `hydrate never` block, and a find-in-page match or a fragment link can open one too. Ticket 18 measured that a static `open` reopens a `details` the visitor closed before hydration, and tickets 30 and 34 measured that a bound `open`, as a property or as an attribute, undoes a toggle made before hydration in all three engines. An application that wants to know which row is open needs that state as a signal without ever binding `open`.
- **The APG accordion asks for more than `details` gives.** Its header is "a button inside a heading", with `aria-controls` and an optional `region` (ledger row A11Y-11). Angular Aria's Accordion supplies the button, the `aria-controls`, and the region, but tickets 29 and 30 measured that it either breaks 13 of Yeti's 14 selectors, or keeps them only by binding `open`, puts `inert` on opened content with JavaScript off and before hydration, hides closed text from find-in-page in Chromium and Firefox, and still exposes no heading. A heading inside `summary`, which WHATWG permits and Yeti's own docs advise ("if the rows are section titles, put a heading element inside each one", `Y/src/components/accordion/docs.md`), exposes a heading inside the still-expandable summary in Chromium and Firefox (ticket 30, measured), but it takes Yeti's base heading size: 29.17 px at weight 700 against the summary's 17.42 px at 600, and each row grows by 7.4 px (ticket 30, measured).
- **Same-document behaviour.** A fragment link to an `id` inside a closed `details` opens it in all three engines on a loaded page, and before hydration only once `main.js` has run in Chromium and WebKit (ticket 30, measured). Under `<base href>` a bare `#id` reloads the document (ticket 20).

## Solution

Two directives in the secondary entry point `ngx-yeti/accordion` (building-blocks Part 2 row 21; 1.3):

- **`YetiAccordion`**, the **Item directive**, on `[yetiAccordion]`, `exportAs: 'yetiAccordion'`. It binds `accordion` as a static host class and sets the static presence attribute `data-ngx-yeti-item-accordion` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). Its constructor ends with `injectYetiItemStyles('accordion')` ([setup](setup.md); ticket 50 decisions 42 and 45), so the item file is acquired on the server too and released on destroy. It provides `yetiAccordionToken`. It has no input, output, or listener.
- **`YetiAccordionItem`**, a **Part directive**, on `details[yetiAccordionItem]`, `exportAs: 'yetiAccordionItem'`. It reads its host's `open` once, when it is created, then follows the native `toggle` event from a `host` listener, and exposes the result as the read-only signal `isOpen` with an `isOpenChange` output ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96). It never binds `open`, as a property or an attribute, and binds nothing else. It sets no presence attribute and acquires no item file (ticket 50 decision 6). A `details` whose state the application never reads needs no directive.

The developer writes `<div yetiAccordion>` where Yeti's docs write `<div class="accordion">`, keeps Yeti's `details`, `summary`, and `name` as written, and puts a heading inside each `summary` (building-blocks "Aria decisions" row 21). Opening, closing, the keyboard, the announced state, exclusivity by `name`, find-in-page, fragment opening, and the open animation stay the platform's and Yeti's CSS. Everything works before hydration, with JavaScript off, and inside any `@defer` or hydrate block, because nothing the package renders is needed for any of it.

The heading inside `summary` keeps the summary's look through one rule in the package's accessibility stylesheet (`@layer ngx-yeti`, `ngx-yeti/accessibility.css`; ticket 50 decision 68), which sets a heading that is a summary's child to inherit the summary's font, letter spacing, and text wrapping, and which closes ledger row A11Y-11 together with the heading usage rule ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95). No Aria and no CDK piece is used.

## User Stories

1. As an application developer, I want to turn a column of `details` into Yeti's accordion with one directive attribute, so that I never write Yeti's `accordion` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="accordion"`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to keep Yeti's `details` and `summary` markup as written, so that the browser opens, closes, and announces each row with no script.
4. As an application developer, I want rows to open and close with a click, Enter, and Space with no package code, so that the accordion works before my application hydrates.
5. As an application developer, I want to give every `details` in a set the same `name` to get one row open at a time, so that I use the browser's own exclusive accordion as Yeti documents.
6. As an application developer, I want no package input for one-at-a-time, so that I learn one way to do it, Yeti's.
7. As an application developer, I want to ship a row open with the `details`' own `open` attribute, so that the server HTML shows it open at first paint.
8. As an application developer, I want to know that a visitor who closes a row I shipped open before hydration sees it reopen at hydration, so that I can decide whether to ship rows open at all.
9. As an application developer, I want `isOpen` on a row to tell me whether it is open, so that I can show related UI or store which row the visitor opened.
10. As an application developer, I want `isOpen` to be right after a visitor opened the row before hydration, so that my state matches what is on screen.
11. As an application developer, I want `isOpenChange` to fire when the visitor opens or closes a row, so that I can react to it.
12. As an application developer, I want `isOpenChange` to fire for a row that the browser closed because another row with the same `name` opened, so that my state for every row stays right.
13. As an application developer, I want no `isOpenChange` for the state a row already had when its directive was created, so that a page does not fire change events on load.
14. As an application developer, I want to open or close a row from my own code by setting the element's `open` property in a handler, so that the platform does the work and `isOpen` follows.
15. As an application developer, I want the package never to bind `open`, so that hydration never undoes what a visitor did.
16. As an application developer, I want a `details` that needs no state to need no directive, so that only the rows I read carry a second attribute.
17. As an application developer, I want a heading inside each `summary` to look like Yeti's plain summary, so that accessible structure costs no visual change.
18. As an application developer, I want to choose the heading level that fits my page outline, so that the accordion fits any document.
19. As an application developer, I want a fragment link to an `id` inside a closed row to open that row, so that deep links into answers work.
20. As an application developer, I want find-in-page to reach text inside a closed row, so that visitors can search a long FAQ.
21. As an application developer, I want `isOpen` to follow a row opened by find-in-page or by a fragment link, so that my state never drifts from the DOM.
22. As an application developer, I want the panel to grow open with Yeti's transition and to appear at once under reduced motion, so that motion follows the visitor's setting with no package code.
23. As an application developer, I want to set the accordion's colours, padding, and border through Yeti's tokens in my stylesheet, so that I theme it the way Yeti documents.
24. As an application developer, I want the accordion item file loaded when the first accordion renders and removed after the last leaves, so that I do not import `accordion.css` globally.
25. As an application developer, I want the item file in the server HTML when a server-rendered page has an accordion, so that the first paint is already styled.
26. As an application developer, I want the accordion readable and working with JavaScript off under SSR and prerendering, so that the package's no-JavaScript guarantee holds.
27. As an application developer, I want hydration to change nothing on an accordion, so that I get no `NG05xx` error and no lost toggle.
28. As an application developer, I want an accordion inside a `@defer (hydrate on ...)` block to work natively before it hydrates and to report the right `isOpen` once it has, so that incremental hydration costs nothing.
29. As an application developer, I want an accordion inside a `hydrate never` block to keep opening and closing and to stay styled, so that a dehydrated accordion still works.
30. As an application developer, I want to know that an accordion inside a client-only `@defer` block needs `accordion` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
31. As an application developer using `withI18nSupport()`, I want translated summaries and panels to hydrate without being re-rendered, so that localised pages keep the server's DOM.
32. As an application developer, I want `isOpen` to refresh my view under zoneless change detection, so that I need no zone.js.
33. As an application developer, I want template references (`#a="yetiAccordion"`, `#q="yetiAccordionItem"`), so that both directives follow the package's `exportAs` rule.
34. As an application developer, I want to import both directives from `ngx-yeti/accordion`, so that a `@defer` block can split them with the rest of the item.
35. As an application developer, I want the usage rules stated (direct `details` children, `summary` first, a heading in each summary, a unique `name` per set, no bound `open`), so that I use the accordion as Yeti and the package intend.
36. As a keyboard user, I want Tab and Shift+Tab to reach every summary in order, so that I can move through the rows.
37. As a keyboard user, I want Enter and Space on a summary to open and close its row, so that I can operate the accordion without a pointer.
38. As a keyboard user, I want a visible focus ring on each summary that the set's rounded corners do not clip, so that I always see where focus is.
39. As a screen-reader user, I want each summary announced as an expandable control with its expanded state, so that I know whether its panel is open.
40. As a screen-reader user, I want each summary to contain a heading at the page's level, so that heading navigation reaches every row, as the APG accordion asks.
41. As a screen-reader user in Firefox, I want the heading kept on a row I opened, so that heading navigation still finds it.
42. As a screen-reader user, I want the open panel's content read after its summary, so that the answer follows its question.
43. As a low-vision user, I want each summary to stand apart from its panel and from the row under the pointer, so that the rows read as rows.
44. As a low-vision user, I want the accordion to fit a 320 px wide viewport with no horizontal scroll, so that I can read it zoomed in.
45. As a forced-colours user, I want to see which rows are open, so that the chevron still tells me the state.
46. As a package maintainer, I want the contract check to cover the class and the absence of attributes, markers, and events, so that a pin move that adds one fails before release.
47. As a package maintainer, I want the SSR smoke to assert the server HTML of a closed and an open row, the heading, the item link, and the `toggle` replay attribute, so that the first paint and replay are proven.
48. As a package maintainer, I want the fixture app to render the accordion on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
49. As a package maintainer, I want a recorded engine-tree check that Firefox keeps the heading on an opened row, so that the measured loss with `role="heading"` never returns with the chosen form.
50. As a package maintainer, I want the class names `YetiAccordion` and `YetiAccordionItem` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.
51. As an accessibility reviewer, I want ledger row A11Y-11 to say what the package adds, its building block, and its tests, so that the heading's compliance is traceable to ngx-yeti rather than to Yeti.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/accordion/manifest.json`, `accordion.css`, `docs.md`, and `example.html`, in `Y/src/base/media.css`, `Y/src/base/typography.css`, `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, and `Y/src/guides/components.md`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `accordion`, `component`, `Content` |
| `class` | `accordion` |
| `attributes`, `classes`, `markers` | empty |
| `children` | `> details` (min 2, max none): "One disclosure each. Give them all the same name attribute to have the browser close the others when one opens." `summary` (min 2, max none): "The row that opens its panel; one per details, first inside it." |
| `tokens` | public: `--yeti-accordion-border`, `--yeti-accordion-padding`, `--yeti-accordion-surface`, `--yeti-accordion-summary`, `--yeti-accordion-summary-hover`, `--yeti-border-width`, `--yeti-radius-md` |
| `a11y` | `requiredAttributes` empty; keyboard: Tab "Moves to the next summary.", Enter / Space "Opens or closes the panel under the focused summary."; notes: "This is native: details is a disclosure, summary is its button, and the open state is the open attribute, all announced without help. Put a heading inside the summary if the row is a section title, since summary is not a heading by itself. To open one at a time, give every details the same name attribute, which is the browser's own exclusive accordion; Yeti adds no attribute for it, because CSS cannot set one and script should not be needed." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `details name attribute`, `individual transform properties`, `overflow: clip`, `animating a grid row between 0fr and 1fr`, `discrete transition of content-visibility (where missing, the panel still grows open and shuts at once rather than shrinking)`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`accordion.css`): `.accordion` draws the border, the `--yeti-radius-md` corner, the set's surface, and `overflow: clip`; `.accordion > details + details` draws the line between rows; `.accordion > details > summary` takes the accordion padding and the summary surface, a further step under `:hover`, and `outline-offset: -2px` under `:focus-visible` so the clip does not crop the ring; `.accordion > details[open] > summary` rules the open summary off from its panel; `.accordion > details > :not(summary)` pads the panel, with the block-end padding on its last child.

The disclosure itself is in the **Always-loaded group**, `@layer yeti.base` (`Y/src/base/media.css:58-123`): `details > summary` is a flex row with `font-weight: var(--yeti-weight-strong)`, `cursor: pointer`, and no native marker; `details > summary::after` is the chevron, two `currentColor` borders on a turned square, rotated under `details[open]`; `details` is a two-row grid whose second row transitions from `0fr` to `1fr` over `--yeti-duration-base`, with `::details-content` clipped and `content-visibility` transitioned discretely. Base headings (`Y/src/base/typography.css:25-37`) set `font-weight: var(--yeti-weight-bold)`, `line-height: var(--yeti-leading-tight)`, `font-stretch`, `letter-spacing`, `text-wrap: balance`, and a size per level (`h3` at `--yeti-text-xl`).

Attributes left to the consumer: `name` on `details` (building-blocks 1.1; ticket 26 lists no row for the accordion, which has no `data-*` attribute), `open` on a `details` the page ships open (ADR 0003 point 3), and every element and its text.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `accordion` | static host class on `[yetiAccordion]` (`YetiAccordion`) | always | ADR 0003 point 1; Part 2 row 21 |
| Attributes, markers | none | none | not applicable | manifest; ticket 26 |
| Children `> details` | one disclosure each | the consumer's `details`; `details[yetiAccordionItem]` where the state is read | not applicable | Part 2 row 21 |
| `name` on `details` | the browser's exclusive accordion | the consumer's; the package binds and generates none | not applicable | building-blocks 1.1, 1.5 (a value addressed across the document is consumer-supplied) |
| `open` on `details` | the open state | **never bound**; the consumer's static `open` ships a row open; `YetiAccordionItem` reads it once at creation, then follows `toggle` | absent unless the consumer writes it | map, Standing rulings, open state; ADR 0003 points 3 and 4; building-blocks "Aria decisions" row 21 |
| `summary` | the row that opens its panel | the consumer's, with a heading inside it | not applicable | "Aria decisions" row 21; manifest `a11y.notes` |
| Events | none | no `yeti:*` event to map; `isOpenChange` on `YetiAccordionItem` maps the platform's `toggle` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96) | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-accordion-*`, `--yeti-border-width`, `--yeti-radius-md` | the set's lines, padding, surfaces, corner | the consumer's; the package writes none | not applicable | ADR 0004 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-accordion=""` on `[yetiAccordion]` only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiAccordionToken`, provided by `YetiAccordion` | not applicable | building-blocks 1.9 |
| Package CSS | not Yeti's | one rule in `@layer ngx-yeti`: a heading that is a direct child of `.accordion > details > summary` inherits the summary's font, letter spacing, and text wrapping ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95) | applies once the consumer imports `ngx-yeti/accessibility.css` | map, Standing rulings, package CSS for accessibility; ADR 0060 point 8; ticket 50 decision 68 |

**Module replaced:** none. Yeti's `accordion` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 21, "Yeti module: none"), and Aria would replace no Yeti JavaScript (ticket 29). Every behaviour the item has is the platform's, and the table maps each to what the package does:

| Behaviour (platform or Yeti CSS) | Source | Package |
| --- | --- | --- |
| Open and close on click, Enter, Space | `details`/`summary` | nothing; `YetiAccordionItem` follows `toggle` |
| Announce the expanded state | `summary`'s native mapping | nothing |
| One at a time | `details name` | nothing; usage rule 4 |
| Ship a row open | the consumer's static `open` | nothing; read once at creation |
| Open a closed row on a find-in-page match | the user agent (measured with `window.find()` only in Firefox, ticket 29) | nothing; `isOpen` follows the `toggle` |
| Open a closed row that holds a fragment's target | the browser (measured in three engines, ticket 30) | nothing; [fragment-links](fragment-links.md) keeps consumer links same-document |
| Panel grows open; reduced motion collapses it | Yeti's base layer | nothing |
| Heading look inside `summary` | not Yeti's: Yeti's base heading rule applies | one rule in `@layer ngx-yeti` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95) |
| Open state as Angular state | not Yeti's | `isOpen` and `isOpenChange` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96) |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-accordion-border` (default `var(--yeti-color-border)`), `--yeti-accordion-padding` (`var(--yeti-space-md)`), `--yeti-accordion-surface` (`var(--yeti-color-surface)`), `--yeti-accordion-summary` and `--yeti-accordion-summary-hover` (the surface mixed 88 % and 80 % toward `--yeti-color-text` in oklch), `--yeti-border-width`, and `--yeti-radius-md` (`Y/src/tokens/components.css:55-66`; `tokens.json:174-178`); the base layer's disclosure reads `--yeti-space-sm`, `--yeti-weight-strong`, `--yeti-duration-fast`, `--yeti-duration-base`, and `--yeti-ease`. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`. The accordion tokens are declared on `:root`, so `--yeti-accordion-summary` is mixed there: setting `--yeti-accordion-surface` on one accordion changes that set's background but not its summary mix, which the consumer then sets on the same element (inferred from how a custom property's `var()` resolves where it is declared; Yeti's docs say derived tokens work on any element, `Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiAccordion` provides `yetiAccordionToken` (`InjectionToken<YetiAccordion>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiAccordionItem` injects it with `{ optional: true, skipSelf: true }`. Nothing in this milestone reads it: the part's behaviour does not depend on the parent, and the **In-item check** that would use it belongs to a later milestone (map, Milestones). A `details[yetiAccordionItem]` outside an accordion is a lone disclosure, which Yeti's base layer already draws ("A single disclosure needs no accordion at all", `Y/src/guides/components.md:212`), and its `isOpen` works the same. This is building-blocks 1.9's optional case.
- No host directives and no Aria: the user decided native `details`/`summary` with a heading inside `summary` and no Aria ("Aria decisions" row 21). No Yeti item always sits on the accordion's element (Part 2, "Two findings that hold across the matrix").
- The only other injection is the ADR 0060 styles service, through `injectYetiItemStyles('accordion')` ([setup](setup.md)).
- Generated ids and the platform's relationship attributes: none. `details` relates its `summary` and panel by structure, so there is no `aria-controls` to render; `name` and fragment-target ids are addressed across the document, so they are consumer-supplied (building-blocks 1.5), and the item does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiAccordion` | `YetiAccordionItem` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiAccordion]` (Part 2 row 21) | `details[yetiAccordionItem]` (Part 2 row 21; architecture-guide's rule that a selector names the native element Yeti depends on) |
| `exportAs` | `yetiAccordion` | `yetiAccordionItem` |
| Entry point | `ngx-yeti/accordion` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | none | none |
| State | none | `isOpen: Signal<boolean>`, read-only ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96) |
| Outputs | none | `isOpenChange: boolean`, emitted from the `toggle` listener only when the host's live `open` differs from `isOpen()` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 96 and 97) |
| Methods | none | none: a consumer sets the element's own `open` property (usage rule 6) |
| Host | static `class: 'accordion'`; static `data-ngx-yeti-item-accordion: ''` | `'(toggle)'` listener; no attribute or property binding |
| Providers | `yetiAccordionToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('accordion')` | `yetiAccordionToken`, `{ optional: true, skipSelf: true }`; its own `ElementRef` |
| Lifecycle | `injectYetiItemStyles('accordion')` is the last statement of its constructor, after anything there that can throw (nothing does today); the release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 18 and 42) | the constructor reads `ElementRef.nativeElement.open` once into a private writable signal that `isOpen` exposes; nothing else |

**The open state, step by step** (map, Standing rulings, open state; ADR 0021's 2026-10-03 note; ticket 30 section C.2):

1. When `YetiAccordionItem` is created, it reads its host's `open` property once. On the client this read comes after hydration has written the element's static attributes back, because Angular writes them before it creates the element's directives (ticket 33's audit, row 2, read at `shared.ts:596-599`). On the server Angular's DOM implementation reflects `open` from the attribute (ticket 34, read in domino). So the read is what the visitor sees, on both sides.
2. The `toggle` listener reads the host's live `open`, not the event's `newState`. Ticket 30 measured that a queued `toggle` can arrive after a later change, and that reading the live value is what kept a click made before hydration in all three engines (run 2).
3. No binding writes `open`. Nothing writes `open` except the platform and the consumer's own code.
4. A change found by the listener sets the signal, then emits `isOpenChange`. The handler calls no `preventDefault()`.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiAccordion` on an element that holds flow content (a `div` in Yeti's examples, or `section`), with two or more `details` as its direct children (manifest `children`). `@if`, `@for`, and `ng-container` add no element, so the `details` they render are direct children.
2. Make `summary` the first child of each `details`, and put the panel content in elements after it (`p`, `div`, a list). Yeti pads the panel through `.accordion > details > :not(summary)`, which does not match bare text.
3. Put one heading inside each `summary` as its only content, at the level that fits the page outline (`h2` to `h6`), and keep its text meaningful on its own (Yeti's docs). This is the form the user's decision names ("Aria decisions" row 21), and it is what closes A11Y-11 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95). Put no link, button, or form control inside a `summary`.
4. For one row open at a time, give every `details` of the set the same `name`. A `name` groups `details` across the whole document, not per accordion, so each set needs a name no other set on the page uses; inside `@for`, derive it from the item's own data. The package generates no `name`: a value shared across elements and boundaries is the consumer's (building-blocks 1.5). Write `open` on at most one `details` of a named set; the browser closes the others when it inserts them (WHATWG's details exclusivity steps, read, not measured here).
5. Ship a row open with the static `open` attribute on its `details`, and never bind `open` (`[open]`, `[attr.open]`) on a `details`, with or without the package (map, Standing rulings, open state). A row shipped open that the visitor closes before hydration opens again at hydration, because hydration writes the static attribute back (ticket 33; building-blocks "Hydration constraints (2026-10-03)"; ticket 18, measured). Ship a row open only when the page is useless without it.
6. To open or close a row from code, set the `details` element's own `open` property in an event handler, through a template reference to the element (`#row` without a value) or the consumer's own `viewChild`; `isOpen` follows the `toggle` that this fires. Never set it during rendering or in a constructor (building-blocks 1.11 decision 3).
7. Give every fragment target inside a panel a consumer `id` (building-blocks 1.5). A consumer's own bare `#id` link to it works under `<base href>` only once the application is live, through [fragment-links](fragment-links.md)' `provideYetiFragmentLinks()`; the accordion does not start that service, because Part 2 row 51 lists only the toc, carousel, and tabs. Where the link must work before hydration or with JavaScript off, write the current path into its `href` ([fragment-links](fragment-links.md) usage rule 3).
8. Do not write `class="accordion"` or `data-ngx-yeti-item-accordion` statically. The directive binds them (ADR 0003 points 1 and 2; ADR 0045 consequences).
9. Import `YetiAccordion`, and `YetiAccordionItem` where a template writes it, in every component whose template writes the attribute. A **Forgotten import** of `YetiAccordion` renders an unstyled column of disclosures; of `YetiAccordionItem`, a row whose `isOpen` nothing tracks. Only a bound `(isOpenChange)` (NG8002) or a template reference naming the `exportAs` (NG8003) makes the compiler report it (building-blocks 1.9).
10. Do not hide content everyone needs in a closed row (Yeti's docs, "When to use it").

### 5. Material comparison

| Aspect | ngx-yeti `accordion` | Angular Material `MatAccordion` and `MatExpansionPanel` |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, a part directive on the consumer's native `details` | components `mat-accordion`, `mat-expansion-panel`, `mat-expansion-panel-header` (`NC/src/material/expansion/accordion.ts:34`, `expansion-panel.ts:75`) |
| Header | native `summary` with a heading inside it | `role="button"` with `aria-controls`, `aria-expanded`, `aria-disabled` (`expansion-panel-header.ts:45-50`) |
| Panel | the `details`' own content, in the DOM and searchable while closed | `role="region"` labelled by the header (`expansion-panel.html:4-5`) |
| One at a time | the consumer's `name` | `multi` input, default `false` (`NC/src/cdk/accordion/accordion.ts:48`) |
| Open state | `isOpen` read-only signal and `isOpenChange` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96) | `expanded` input and `expandedChange` output (`NC/src/cdk/accordion/accordion-item.ts:58`, `:64`) |
| Events | `isOpenChange` only | `opened`, `closed` (`accordion-item.ts:47`, `:49`); `afterExpand`, `afterCollapse` (`expansion-panel.ts:124`, `:127`) |
| Methods | none; the element's `open` property | `toggle()`, `open()`, `close()` (`accordion-item.ts:137-151`); `openAll()`, `closeAll()` (`accordion.ts:51`, `:58`) |
| Toggle icon | Yeti's chevron | `hideToggle`, `togglePosition` (`expansion-panel.ts:104-121`) |
| `exportAs` | `yetiAccordion`, `yetiAccordionItem` | `matAccordion`, `matExpansionPanel` |

Material's header pattern is Aria's, which the user decided against for this item ("Aria decisions" row 21). Its methods and `openAll()` are not added: no record asks for them, and the element's own `open` does the job (usage rule 6). No completion output is added either: `afterExpand` and `afterCollapse` have no Yeti counterpart, and the [events](events.md) spec names completion outputs only for the dialog, dropdown, and nav. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1 (Part 2 row 21; building-blocks 1.2): `details` and `summary` open, close, take the keyboard, announce their state, and group by `name` with no script, which ticket 18 measured with JavaScript off. `<details name>` is inside Baseline 2025 (building-blocks 1.2's table). The package adds only the class, the item file, the open state as a signal, and one rule of accessibility CSS.

- **Aria not used.** Aria Accordion (`NC/src/aria/accordion/accordion-trigger.ts:47-51`, `accordion-group.ts:93`, `:102`, `accordion-panel.ts:52-55`) was prototyped twice. By its own markup it left 13 of 14 Yeti selectors unmatched and rendered empty panels on the server (ticket 29). Composed onto `summary` it kept the selectors, but it needed `open` bound to stay in sync with its keydown handling, wrote `inert` on closed panels so content opened with JavaScript off or before hydration stayed inert, hid closed text from `window.find()` in Chromium and Firefox, lost a fragment reveal made before hydration in Chromium and WebKit, put a `role` on `summary` that ARIA in HTML does not permit, rewrote its ids at hydration (upstream-bugs A6), and exposed no heading (tickets 30 and 32, measured). The user's rule for Aria, "only reach for Angular Aria when it addresses an accesibility feature that Yeti is missing", and the decision "Heading in summary (Recommended)" leave it out (map, Standing rulings).
- **CDK not used.** CDK Accordion is listed as not used in building-blocks 1.2, because `details` is the platform's and a CDK container would move the element out of Yeti's markup.
- **Custom Angular** is limited to the `toggle` listener and the signal, the "state mirror of `details.open` through the `toggle` event" that ticket 17 named as the only gap the platform leaves (section 4.1).

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** the APG accordion does not govern `details` (building-blocks 1.10); the spec states the platform's behaviour. The heading inside `summary` is the part of the APG's "button inside a heading" that the user chose to add.
- **Roles and states:** each `summary` keeps its native mapping, an expandable control with its expanded state (Chromium `DisclosureTriangleGrouped` with `expanded`, Firefox `Button` with `expand`), with the consumer's heading as its child; each `details` is a `group` (ticket 30, measured over CDP and UIA). The package adds no role, no ARIA attribute, no `tabindex`, and no `inert`.
- **Keyboard:**

| Key | Action | Source |
| --- | --- | --- |
| Tab, Shift+Tab | moves to the next or previous summary, and into an open panel's focusable content | native (ticket 29, measured in three engines) |
| Enter, Space | opens or closes the focused summary's panel; with a shared `name`, opening one closes the open sibling | native (ticket 17 section 4.1, measured) |
| Arrow keys, Home, End | nothing | the APG at the revision ticket 17 read lists no arrow keys for the accordion (`APG/accordion/accordion-pattern.html:47-63`) |

- **Focus:** Yeti's ring on `summary:focus-visible`, drawn 2 px inside the summary so the set's `overflow: clip` does not crop it (`accordion.css`); ticket 17 found a ring at every Tab stop. No focus moves when a row opens or closes.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | `details` and `summary` carry the disclosure's structure natively; the heading in each `summary` (usage rule 3) carries the section structure. Layer 1 asserts a heading of the written level inside each summary. |
| 1.3.2 Meaningful Sequence | each panel follows its summary in the DOM and on screen. |
| 1.4.3 Contrast (Minimum) | summary text on `--yeti-accordion-summary` and panel text on `--yeti-accordion-surface` are plain colours, which axe computes; the **Story gate** covers them in light and dark, and axe found no violation on Yeti's example (ticket 17). |
| 1.4.10 Reflow | the set is a block of full-width rows; layer 4 asserts no horizontal overflow at a 320 px viewport. |
| 1.4.11 Non-text Contrast | the open state is the chevron, drawn in `currentColor`; layer 4 records it under forced colours ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 99). |
| 1.4.12 Text Spacing | no height is set; summaries and panels grow with their content (read). |
| 2.1.1 Keyboard | Tab, Enter, and Space, natively (table above). |
| 2.4.3 Focus Order | DOM order; opening a row adds its panel's focusable content after its summary. |
| 2.4.6 Headings and Labels | usage rule 3: a heading whose text names the section. |
| 2.4.7 Focus Visible | Yeti's ring, inset so it is not clipped (read; ticket 17 measured a ring at every stop). |
| 2.5.8 Target Size (Minimum) | each summary is a full-width row padded by `--yeti-accordion-padding`; layer 1 asserts a summary box at least 24 by 24 CSS pixels. |
| 4.1.2 Name, Role, Value | the summary's name is its content (the heading's text), its role and expanded state are native, and the state changes are announced by the platform. |

**Ledger rows owned:** A11Y-11 ([ledger.md](../ledger.md); Part 2 row 21). The user's decision closes it with a heading inside `summary` and no Aria (ledger note of 2026-10-03). [Ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 98 rewrote the row as this spec proposed. "What the package adds": usage rule 3 (a heading in each summary) and one rule in `@layer ngx-yeti` that keeps the summary's look; "Building block": the platform's `details` and `summary`, WHATWG's `summary` content model; "Verified": measured (Chromium CDP and Firefox UIA expose a level-3 heading inside the expandable summary, ticket 30); "Tested by": L1, L3, L4, and the engine-tree check below. The row's other two gaps, no `aria-controls` and no `region`, are accepted: `details` relates its summary and panel by structure, and the APG makes `region` optional (ticket 17 section 4.1). No new ledger row is added.

### 8. Rendered HTML

Consumer markup, after Yeti's example with a heading in each summary:

```html
<div yetiAccordion>
  <details name="faq" yetiAccordionItem #js="yetiAccordionItem">
    <summary><h3 i18n>Does Yeti need JavaScript?</h3></summary>
    <p i18n>Almost never. A handful of optional modules exist and nothing depends on them.</p>
  </details>
  <details name="faq" open>
    <summary><h3 i18n>Can I use my own class names?</h3></summary>
    <p id="own-classes" i18n>Yes. Anything Yeti does not declare is ignored.</p>
  </details>
</div>
```

Server HTML, closed and open: the parent carries `yetiaccordion=""`, `class="accordion"`, and `data-ngx-yeti-item-accordion=""`. The first `details` carries `name="faq"`, `yetiaccordionitem=""`, and Angular's replay attribute for its `toggle` listener, and no `open`; its panel content is in the HTML, with no `hidden` or `inert`. The second carries `name="faq"` and `open=""` as the consumer wrote it, and no package attribute. Each `summary` carries nothing from the package, and its `h3` is its child. The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/accordion/accordion.css?v=<pin>`, `data-ngx-yeti-styles="accordion"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5; [setup](setup.md)).

Hydrated DOM: the same. Opening the first row adds `open=""` to it and, through `name`, removes `open` from the second; both changes are the platform's, and the first row's `isOpen` becomes `true`.

The delta from Yeti's docs markup: the consumer writes `yetiAccordion` where the docs write `class="accordion"`, adds `yetiAccordionItem` on a `details` whose state it reads, and puts a heading inside each `summary`, which Yeti's docs advise for section titles.

### 9. Animation

Yeti's base layer animates the panel: the `details` grid row transitions from `0fr` to `1fr` over `--yeti-duration-base`, the chevron rotates over `--yeti-duration-fast`, and `content-visibility` transitions discretely (`Y/src/base/media.css:78-123`). Closing animates in Chromium and Firefox; WebKit shuts the panel at once (Yeti's docs). Under `prefers-reduced-motion` the durations collapse and the panel appears at once (ticket 17, measured for the accordion). The directives add no class, no inline style, no `animate.enter`, and no `animate.leave` (building-blocks 1.6 rule 1). There is no completion output, so nothing awaits `transitionend`; `isOpenChange` fires on the `toggle`, the choice, not the arrival ([events](events.md) rule 7). A server-rendered accordion never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the item link in `<head>`, the consumer's `details`, `summary`, headings, `name`, and static `open` (section 8). The open state at first paint is the consumer's static `open` (ADR 0003 point 3); nothing the package binds is visible state (ADR 0011 clause 1).
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). A click opens a row at once natively. A fragment to a closed row opens it at once in Firefox, and in Chromium and WebKit once `main.js` has run (tickets 29 and 30, measured).
- **Full hydration:** the hosts are claimed as they are; `YetiAccordionItem` reads `open` after the static attributes are written back, so a row the visitor opened stays open and `isOpen` is `true` (ticket 29 (A), measured: "click opens at once. After hydration it stays open"). A row shipped open and closed by the visitor before hydration opens again, the documented loss of usage rule 5 (ticket 33).
- **Event replay:** the `toggle` host listener is on Angular's replay list, so a `toggle` made before hydration reaches the handler once the boundary hydrates (ticket 29, measured: "the replayed `toggle` sets the model"). It finds `isOpen()` already equal to the live `open` and emits nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 97). The handler calls no `preventDefault()`, so replay cannot throw in it.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the accordion and its link; until the block hydrates the rows open and close natively, and the dehydrated host holds the link (ADR 0060 point 4). With `hydrate on interaction`, the click that triggers hydration has already toggled the row natively; the package has no `click` listener for a replayed click to reach, so the row toggles once (inferred; layer 4 measures it).
- **`hydrate never`:** the accordion is its server HTML and keeps working as far as the platform does: rows open and close, `name` closes siblings, fragments and find-in-page open rows, and the item link stays while the host is connected (ADR 0060 point 4; ADR 0045). `isOpen` and `isOpenChange` do not exist there, because the directives are never created on the client (building-blocks 1.11 decision 7).
- **Client-only `@defer`:** the item file is fetched when `YetiAccordion` is constructed, which can show unstyled frames (the rows without the set's border, separators, and surfaces); the consumer closes the gap with `provideYetiStyles({ preload: ['accordion'] })` (ADR 0060 point 6; [setup](setup.md)). A `details` created on the client takes its static `open` at creation, before its directive reads it.
- **`withI18nSupport()`:** summaries and panels are usually translated with `i18n` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directives add no `i18n` block and render no string (building-blocks 1.10).
- **Zoneless:** `isOpen` is a signal written from the `toggle` listener, so a view that reads it refreshes with no zone (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, JavaScript off; ADR 0011 consequences): every row is readable and opens and closes, one at a time by `name`, fragments open closed rows, and the set is styled, because the class and the item link are in the server HTML (ticket 29, measured: "opens, closes, one at a time by `name`"). Lost: `isOpen` and `isOpenChange`, which need Angular. A client-only application gets no such promise.
- **Hydration boundary:** the accordion and its rows may sit in different boundaries. There are no ids or references between them, and `name` groups `details` natively across the document.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, item 54; ticket 33):

- **Same DOM on the server and the client:** the class and presence attribute are static; the open state is never bound (map, Standing rulings, open state), so hydration writes nothing on a `details` that the consumer did not write statically. The prototype's directives had the same server and client element tree in three engines (ticket 30, measured for (A) and (D)).
- **Server HTML not altered:** a row the visitor opened before hydration stays open, because no binding writes `open` (ticket 29 (A), measured). The one alteration is the consumer's static `open` written back over a close made before hydration, which no template form avoids; it is documented (usage rule 5; building-blocks "Hydration constraints (2026-10-03)"; ticket 33).
- **No direct DOM manipulation:** `YetiAccordionItem` reads its own host's `open` once and on `toggle`; it writes nothing, queries nothing, and never touches `document` (ticket 30's reading of `hydration.md:105`). The item link is the ADR 0060 service's.
- **Valid HTML:** a heading inside `summary` is conforming (WHATWG's `summary` content model, phrasing "optionally intermixed with heading content", ticket 17 section 2.2), and the browser's parse of such server HTML matched the hydrated tree in three engines (ticket 30, measured). An accordion inside a `p`, or a `summary` that is not the first child, is invalid or differently parsed (usage rules 1 and 2).
- **`preserveWhitespaces`:** the directives have no template. White space between `details` is not matched by `details + details` or by `> :not(summary)`, which match elements only.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** none on `details`; usage rule 8 keeps the consumer from writing the class and presence attribute.

### 12. Single-page application

- **Navigation:** none. A `details` is not a top-layer panel, so the item does not use [navigation-close](navigation-close.md), and a row's open state survives a navigation that keeps the component, as the element does. A route's accordions leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-accordion]` host is connected (ADR 0060 point 4; ADR 0045).
- **Fragment links:** the browser opens a closed `details` that holds a fragment's target, and `isOpen` follows the `toggle` ([fragment-links](fragment-links.md) section 11, which also states the cold-load timing in Chromium and WebKit). The accordion owns no link, so it does not call `injectSameDocumentHref` or inject `YetiFragmentLinks`; a consumer's bare link follows usage rule 7. With `name`, the fragment's row opening closes its open sibling (platform behaviour).

### 13. Item file

`yeti-css/css/components/accordion/accordion.css`, one of Yeti's 49, loaded as a counted `<link>` by the ADR 0060 styles service: acquired when the first `[yetiAccordion]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:55`, after `spinner` and before `tabs`, through ADR 0060 point 3's rank table), and removed after the last host carrying `data-ngx-yeti-item-accordion` has left the DOM. `YetiAccordionItem` acquires nothing (ticket 50 decision 6). The consumer's part is the [setup](setup.md) spec's one-time configuration: Yeti's build at the Pin, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the disclosure's look in `base/media.css` and the tokens), the package's `ngx-yeti/accessibility.css` (which holds the heading rule), and optionally `provideYetiStyles({ preload: ['accordion'] })`. Cross-item files acquired: none; `accordion.css` names no other item (ADR 0060 point 9). Items inside a panel load their own files through their own directives.

## Testing Decisions

A good test asserts what a reader, a keyboard user, or a consumer observes: the class and the item link, `open` on each `details`, the heading's role, level, and computed font, focus, `isOpen` and `isOpenChange` as a consumer reads them, and what survives hydration. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the heading-look assertion compares the heading's computed font with a heading-less summary's in the same story, not with a number. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s. Prior art: Yeti's `Y/test/browser/components/accordion.spec.js` with its fixture `Y/test/browser/fixtures/components/accordion.html` (shut and open rows, the chevron, the grid row, reduced motion, the summary surfaces in both schemes, the open summary's rule, Enter, `name` exclusivity, axe); the prototypes of tickets 29, 30, and 34 for the rendering-mode states, the hydration traces, and the Firefox UIA walk.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and `ngx-yeti/accessibility.css` globally and the `accordion` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), in light and dark. Story ids:

- `accordion--default`: section 8's markup without `open`, plus a control row whose `summary` holds plain text. Asserts the parent's `class` is `accordion` and it carries `data-ngx-yeti-item-accordion`; no `summary` has a `role`, `tabindex`, or `aria-*` from the package; each heading has the role `heading` at level 3 inside its summary; the heading's computed `font-size`, `font-weight`, `line-height`, and `letter-spacing` equal the control summary's, and both summaries have the same height within 1 px ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95); each summary's box is at least 24 by 24 CSS pixels; Tab reaches each summary in order; Enter opens the first, Space closes it, and `open` follows.
- `accordion--exclusive`: two sets on one page with different `name`s. Opening the second row of a set closes its first, and the other set is untouched; with `#q` on each `details`, both rows' `isOpen` are right after each step, and `isOpenChange` fired once on each changed row, the closed sibling included (an action in `argTypes`).
- `accordion--open-state`: one `details[yetiAccordionItem]` shipped with static `open` and one without, with `isOpen` rendered as text and `isOpenChange` as an action. Asserts the initial texts are `true` and `false` with no action fired (events rule 9); a click on each summary flips its text and fires one action; setting the element's `open` property from a story button flips the text the same way (usage rule 6).
- `accordion--fragment`: a row whose panel holds `id="own-classes"`; the play function sets the story frame's `location.hash` to it and asserts the row opens and its `isOpen` becomes `true`. The subpath cases are in layer 4.
- `accordion--rtl`: `accordion--default` inside `dir="rtl"`. Asserts the chevron sits at the inline end (the summary's left side) and Tab order is DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `accordion.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiAccordion, { tagName: 'div' })`: the host has class `accordion` and `data-ngx-yeti-item-accordion`; while the fixture lives one `<link data-ngx-yeti-styles="accordion">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiAccordionItem, { tagName: 'details' })`: `isOpen()` is `false`; the host has no presence attribute and no `open`, and no link is acquired; setting the host's `open` property to `true` and awaiting the `toggle` makes `isOpen()` `true` and emits `isOpenChange` once with `true`; a `toggle` event dispatched while `open` is unchanged emits nothing; created alone, it injects no parent and throws nothing.
- No binding writes `open`: after `whenStable()` with `isOpen()` `true`, removing `open` on the host by hand is not undone by a later change-detection pass.

A small test host covers what `createDirective` cannot: a `details` with a static `open` reads `isOpen()` as `true` at creation and emits nothing; a part declared inside a `yetiAccordion` host resolves `yetiAccordionToken` to the parent; template references `#a="yetiAccordion"` and `#q="yetiAccordionItem"` resolve; two `details` with one `name` emit `isOpenChange` on both when the second opens; the consumer's own `class` on the parent is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `accordion.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup, whose headings and panels carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the parent renders `class="accordion"` and `data-ngx-yeti-item-accordion`; the first `details` has no `open` and carries Angular's replay attribute for `toggle`; the second has `open=""`; both panels' text is in the HTML, with no `hidden` or `inert`; no `summary` has a `role`; each `h3` is a child of its `summary`; `<head>` holds one item link with `data-ngx-yeti-styles="accordion"`, `data-beasties-skip`, and an `href` ending `components/accordion/accordion.css?v=<pin>`; a component that reads `isOpen()` of the second row renders `true` in the server HTML.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `accordion` has `YetiAccordion`; the manifest declares no attribute, marker, or event for the item, and the package renders none; the presence attribute is the package's. A pin move that adds an attribute, a marker, or a module fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own spec: real Enter and Space presses toggle rows; the panel's height grows over the transition and, under `emulateMedia({ reducedMotion: 'reduce' })`, opens in one frame; at a 320 px viewport the page has no horizontal overflow (1.4.10); under `emulateMedia({ forcedColors: 'active' })` the chevron's computed border colour and a screenshot of a shut and an open row are recorded, not asserted ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 99); in Firefox, `window.find()` on a closed row's text opens it and `isOpen` becomes `true`, and in Chromium and WebKit the result is recorded, because Playwright cannot drive the browser's find bar (ticket 29).

Fixture-app half, built with `outputMode: 'server'`, with an `/accordion` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences), under `<base href="/sub/">`. The route renders section 8's markup with `isOpen` of each row rendered as text:

- hydration logs no `NG05xx` (development build) and `componentsSkippedHydration === 0`;
- with JavaScript disabled: rows open and close by click and Enter, a shared `name` closes the open sibling, loading `#own-classes` opens a closed row holding it, and `@axe-core/playwright` with the six tags reports no violation;
- with `main.js` held back: a click opens a closed row at once; after release the row stays open, its `isOpen` text is `true`, and no `isOpenChange` was logged ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 97);
- with `main.js` held back, closing the row shipped open: after release it is open again. This is asserted as the documented residue of usage rule 5 (ticket 33), so a change in it is noticed;
- a cold load of `/sub/accordion#own-classes` ends with the row open and `isOpen` `true` in all three engines (ticket 30 measured Chromium and WebKit holding the reveal until `main.js` has run);
- a consumer skip-style link `href="#own-classes"` with `provideYetiFragmentLinks()`, after hydration: no reload, the row opens (the shared half of [fragment-links](fragment-links.md) layer-4 case 9);
- an accordion inside `@defer (hydrate on interaction)`: one click toggles the row once, and after hydration `isOpen` matches `open`; inside `hydrate never`: rows toggle and the item link stays after every live accordion on the page is removed;
- an accordion inside a client-only `@defer` block with `accordion` in the preload list shows no unstyled frame;
- navigating from the accordion route to one without it removes the item link, and navigating back re-inserts it.

**Engine accessibility tree, outside the four layers.** Playwright 1.63 has no engine accessibility API, and `ariaSnapshot` is Playwright's own computation (ticket 30). So the check that the heading survives on an opened row in the engines' own trees is a recorded check run on each **Pin move** and on each Angular or browser-floor change, after ticket 30's method: Chromium's tree over CDP and Firefox's over Windows UI Automation (headed), on `accordion--default` with the first row opened by a click. It passes when every summary, the opened one included, exposes an expandable control with a heading child. Ticket 30 measured this for `h3` (Firefox UIA: "overskrift" on the opened row) and measured the loss for `span[role=heading]` (Firefox UIA: "tekst" on the clicked-open row, two runs). WebKit's tree could not be inspected on Windows and no screen reader was run; both stay recorded gaps.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

## Out of Scope

- Angular Aria's Accordion, by composition or by subclassing, and CDK Accordion ("Aria decisions" row 21; building-blocks 1.2).
- `aria-controls`, a `region` role on panels, and arrow, Home, and End keys (A11Y-11's remaining items, accepted; the APG at the read revision lists no arrow keys).
- A package input for one at a time, a generated `name`, or an `openAll()`/`closeAll()` (Yeti's design, `Y/src/guides/components.md:212`; building-blocks 1.5).
- Binding `open` in any form, and any `isOpen` input that writes `open` (map, Standing rulings, open state; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96).
- Completion outputs (`opened`, `closed`) and Material's `afterExpand` and `afterCollapse` ([events](events.md) names completion outputs only for the dialog, dropdown, and nav).
- Rendering the heading for the consumer, or a part directive on `summary`. The heading is consumer markup (usage rule 3).
- Lazy panel content. `details` content is always in the DOM, which is what makes find-in-page and fragments work.
- Any check that the host holds `details`, that each `summary` holds a heading, or that a `name` is unique. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS beyond the one heading rule, including a forced-colours rule ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 95 and 99).
- How the styles service counts, inserts, and removes links (ADR 0060; [setup](setup.md)).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiAccordion]` (class only); part directive `details[yetiAccordionItem]` | building-blocks Part 2 row 21 |
| Native `details`/`summary`, no Aria, a heading inside `summary` | building-blocks "Aria decisions" row 21 (the user's "Heading in summary (Recommended)"); tickets 29, 30, 32 |
| `open` never bound; read once at creation; then `toggle`, read live | map, Standing rulings, open state; ADR 0021's 2026-10-03 note; tickets 30 (run 2) and 34 |
| A row shipped open is the consumer's static `open`, and its close before hydration is lost; documented | ADR 0003 point 3; ticket 33; building-blocks "Hydration constraints (2026-10-03)" |
| `name` is the consumer's, never generated | building-blocks 1.1, 1.5; Yeti's `components.md:212` |
| `isOpen` read-only with `isOpenChange`, no model input, no methods | ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 96); building-blocks 1.3 (`isX` beside a colliding verb); ADR 0021 point 1 |
| `isOpenChange` only on a change against `isOpen()`, so a replayed `toggle` after a creation read emits nothing | ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 97); [events](events.md) rule 9 |
| A heading inside `summary` keeps the summary's look through one rule in `@layer ngx-yeti` | ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 95); map, Standing rulings, package CSS for accessibility; ADR 0060 point 8; ticket 50 decision 68 |
| Only `YetiAccordion` marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('accordion')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| The part injects `yetiAccordionToken` optionally with `skipSelf` | building-blocks 1.9 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/accordion` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 21 |
| Tokens are the consumer's | ADR 0004 |
| Fragment targets are consumer ids; consumer links go through fragment-links | building-blocks 1.5; ADR 0023; [fragment-links](fragment-links.md) |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

An FAQ, one answer open at a time, with the open row stored:

```html
<section yetiAccordion>
  @for (q of questions(); track q.id) {
    <details name="faq" yetiAccordionItem (isOpenChange)="$event && openId.set(q.id)">
      <summary><h2>{{ q.title }}</h2></summary>
      <p>{{ q.answer }}</p>
    </details>
  }
</section>
```

```ts
import { YetiAccordion, YetiAccordionItem } from 'ngx-yeti/accordion';

@Component({
  selector: 'app-faq',
  imports: [YetiAccordion, YetiAccordionItem],
  templateUrl: './faq.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  readonly questions = input.required<readonly FaqEntry[]>();
  protected readonly openId = signal<string | null>(null);
}
```

A form split into stages, every row free to open, with the first shipped open and a button that opens the next stage from code (usage rule 6):

```html
<div yetiAccordion>
  <details open>
    <summary><h3 i18n>Contact details</h3></summary>
    <div>
      <!-- fields -->
      <button type="button" (click)="payment.open = true" i18n>Continue</button>
    </div>
  </details>
  <details #payment yetiAccordionItem #paymentRow="yetiAccordionItem">
    <summary><h3 i18n>Payment</h3></summary>
    <div><!-- fields --></div>
  </details>
</div>
```

`#payment` without a value is the `details` element; `#paymentRow="yetiAccordionItem"` is the directive, whose `paymentRow.isOpen()` follows. A theme that tightens the rows, in the consumer's stylesheet after Yeti: `:root { --yeti-accordion-padding: var(--yeti-space-sm); }`. A page whose accordion renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['accordion'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/accordion/accordion.css`, loaded by `YetiAccordion` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `base/media.css:58-123` (the summary row, the chevron, the grid-row animation), `base/typography.css:25-37` (the heading rule that the package rule neutralises inside a summary), `base/reset.css` (heading margins zeroed), `tokens/components.css:55-66` (the accordion tokens), and the reduced-motion durations.
3. **Cross-item rules:** none in `accordion.css`. The package's heading rule lives in `ngx-yeti/accessibility.css`, which the consumer imports once after the always-loaded group ([setup](setup.md)).
4. **Tokens:** reads the seven manifest tokens and the base disclosure's spacing, weight, and duration tokens; writes none (section 2).
5. **What breaks without the item file:** the rows still open, close, and animate with their chevrons, but the set has no border, no line between rows, no summary surface, and no panel padding, so it reads as loose disclosures, with no error. Without `ngx-yeti/accessibility.css`, each heading in a summary renders at Yeti's heading size, which makes each row taller (ticket 30, measured: 29.17 px text, rows 7.4 px taller) but keeps every behaviour and the heading role.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` produced a utility (measured).

### Platform features to adopt when the browser target moves

None needed for the behaviour: `<details name>` and the discrete `content-visibility` transition are what the manifest lists, and Yeti states its fallback for the second. `interpolate-size` would let Yeti animate the panel to `auto` without the grid row; that is Yeti's CSS to change, not the package's. Not checked against web-features data for this spec.

### Single-page-application pieces relied on

[fragment-links](fragment-links.md) for a consumer's bare links to a fragment inside a panel (usage rule 7), and ADR 0060's styles service for route changes (section 12). The item uses neither [navigation-close](navigation-close.md) nor [generated-ids](generated-ids.md), and maps no Yeti event from [events](events.md), whose naming and emission rules `isOpenChange` follows.
