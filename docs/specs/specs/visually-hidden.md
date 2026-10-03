# Spec: visually-hidden

Ticket: [Spec: visually-hidden (utility)](../issues/49-spec-visually-hidden.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 1 and Part 2 row 49; [Decide: the spec list](../issues/11-decide-spec-list.md) row 49 and question 7; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); the map's Standing rulings on hydration constraints, JavaScript off, zoneless, and directive testing ([map.md](../map.md)); [CONTEXT.md](../CONTEXT.md) (**Visually hidden**, **Skip link**, **Utility**, **Item file**). [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) has no row for this item, because it declares no attribute and no marker. The points no record settled were listed under `### Open` in this spec's ticket and are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 27 and 28).

Source short forms, as in [building-blocks.md](../building-blocks.md): `Y/` is Yeti at `f52d1e8b9`; `NC/` is Angular components at `708d4c6e2` (`v22.2.0-15`). Every `file:line` below was read at that commit on 2026-10-03 unless marked otherwise.

## Problem Statement

An Angular developer building with **ngx-yeti** often needs words that a screen reader announces and the page has no room to show: the name of an icon-only button, the number on a carousel dot, the subject of the third "Read more" link on a page. Yeti ships one **Utility** for this, `visually-hidden`. It takes the element out of sight and leaves it in the accessibility tree, so its text is announced in source order and becomes part of the accessible name of whatever contains it (`Y/src/utilities/visually-hidden/manifest.json:16`; `docs.md:3`, `:21`).

Under the package's contract a developer cannot use it as Yeti documents it:

- The package's rule is that a consumer writes no Yeti class ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1). `class="visually-hidden"` written by hand is exactly what that rule forbids, and without a directive there is nothing else to write.
- The package loads each **Item file** only while a directive of that item is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2). A hand-written class acquires nothing, so the rule that hides the text is never loaded, and the words show on screen.
- Angular developers reach first for CDK's `cdk-visually-hidden`, which Material uses in its own templates. CDK's class needs its own Sass mixin or prebuilt stylesheet, is a second copy of the same recipe, and is not part of Yeti's **Contract** ([building-blocks.md](../building-blocks.md) Part 2 row 49).
- The difference between Yeti's class and the `hidden` attribute is the whole point of the item (`Y/src/utilities/visually-hidden/docs.md:5`): `hidden` removes the text from the accessibility tree, and this class keeps it. A developer who confuses the two, or who also puts an `aria-label` on the control, silently loses the words.

## Solution

The package ships one **Item directive**, `[yetiVisuallyHidden]` (class `YetiVisuallyHidden`, `exportAs: 'yetiVisuallyHidden'`), in its own entry point `ngx-yeti/visually-hidden`. A developer writes it where Yeti's docs write the class:

`<a href="/trail-map.pdf">Read more<span yetiVisuallyHidden> about the trail map</span></a>`

The directive binds Yeti's **Identity class** `visually-hidden` as a static host class and sets the presence attribute `data-ngx-yeti-item-visually-hidden` on its host ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It acquires the item file `utilities/visually-hidden/visually-hidden.css` from the consumer's own Yeti build when created, on the server too, and releases it on destroy ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2). It has no inputs, no outputs, no listeners, no render callbacks, and no DI of its own: the item declares no attribute, no marker, no token, no module, and no event (`Y/src/utilities/visually-hidden/manifest.json:8-12`, `:18`). It is "Native platform, 1; types only" ([building-blocks.md](../building-blocks.md) Part 2 row 49). Being CSS-only does not exclude it: it gets a static host class and an `exportAs` like every item ([Decide: the spec list](../issues/11-decide-spec-list.md) question 7).

Yeti's CSS does the whole job. The package uses Yeti's class, not CDK's `cdk-visually-hidden`, and adds no CSS and no ledger row (row 49). This spec compares the two recipes for parity in Implementation Decisions 5 and lists the usage rules that Yeti's docs state and the compiler cannot check (P23 of [architecture-guide.md](../architecture-guide.md)).

## User Stories

1. As an Angular developer, I want to write `yetiVisuallyHidden` on a `span`, so that its words are announced but not shown, without writing Yeti's class by hand.
2. As an Angular developer, I want the directive to bind Yeti's own `visually-hidden` class, so that the package's markup is Yeti's documented markup and Yeti's CSS styles it.
3. As an Angular developer, I want the item's CSS to load when the first hidden span renders and unload after the last one leaves, so that a page without one does not pay for its rule.
4. As an Angular developer, I want the server HTML to carry the class and the item's stylesheet link, so that the words are hidden at first paint with no flash of visible text.
5. As a visitor using a screen reader, I want "Read more about the trail map" announced for a link that shows "Read more", so that I can tell the page's "Read more" links apart (WCAG 2.2 2.4.4).
6. As a visitor using voice control, I want the visible words of a control to start its accessible name, so that saying what I see activates it (WCAG 2.2 2.5.3).
7. As a visitor using a screen reader, I want an icon-only button to have a name from hidden text inside it, so that I know what it does (WCAG 2.2 1.1.1, 4.1.2).
8. As a visitor using a screen reader, I want each carousel dot named "Slide 1", "Slide 2", and so on, so that I can choose a slide.
9. As a sighted visitor, I want hidden words to take no space and not change the width of the link they sit in, so that the layout matches the design.
10. As a sighted visitor, I want a long hidden phrase not to change the page's scroll width at 320 CSS pixels, so that the page still reflows (WCAG 2.2 1.4.10).
11. As a keyboard user, I want no Tab stop inside hidden text, so that focus never lands on something I cannot see (WCAG 2.2 2.4.7, 2.4.11).
12. As an Angular developer, I want the spec to tell me to put only text inside the hidden element, so that I do not create a Tab stop with nothing on screen.
13. As an Angular developer, I want the spec to tell me that an `aria-label` on the control replaces the hidden text in its name, so that I pick one or the other.
14. As an Angular developer, I want the spec to tell me that `hidden` and `aria-hidden` do the opposite of this directive, so that I use the right tool.
15. As an Angular developer, I want the spec to tell me not to combine it with `yetiPrint` on one element, so that I do not lose the words on screen or print a blank pixel.
16. As an Angular developer, I want the spec to tell me not to use it on the page's **Skip link**, because Yeti's base rule already hides that link until it takes focus, and this class never shows it.
17. As an Angular developer, I want an `exportAs` name, so that I can take a template reference to the directive like any other package directive.
18. As an Angular developer, I want a forgotten import to show up in the story gate, so that hidden words never appear on screen unnoticed.
19. As an Angular developer, I want it in its own entry point, so that a `@defer` block can split it per item and nothing unused reaches my bundle.
20. As an Angular developer using `@defer` without server rendering, I want to know that the item file is fetched when the first instance is created, and how to preload it, so that I can avoid one frame of visible text.
21. As an Angular developer using `hydrate never`, I want the hidden text to stay hidden for as long as the block is on the page, so that a dehydrated block never shows it.
22. As an Angular developer using incremental hydration, I want hidden text inside a block that has not hydrated yet to be hidden and announced like any other, so that hydration timing does not change the page.
23. As an Angular developer using event replay, I want the directive to add nothing to replay, so that it adds no `jsaction` and no listener.
24. As an Angular developer with an `i18n` application, I want hidden words inside an `i18n` message to translate and hydrate with `withI18nSupport()`, so that hidden text is localised like visible text.
25. As an Angular developer with a zoneless application, I want the directive to work with no zone.js, so that I can use it in a zoneless application.
26. As a visitor with JavaScript off on a server-rendered or prerendered page, I want the words hidden and announced exactly as with JavaScript on, so that nothing depends on the client.
27. As an Angular developer, I want hydration to rewrite nothing on the hidden element, so that the server and client DOM match under Angular's hydration constraints.
28. As an Angular developer who knows CDK, I want the spec to compare Yeti's recipe with `cdk-visually-hidden` property by property, so that I know what differs and why the package keeps Yeti's.
29. As an Angular developer, I want CDK's class and Yeti's class never to be required together, so that my page carries one recipe, not two.
30. As an Angular developer with Tailwind v4, I want to know whether Tailwind generates a class with this name, so that I know whether the class names collide.
31. As an Angular developer, I want to keep my own **Application class** on the same element, so that I can add spacing or a hook of my own beside Yeti's class.
32. As a package maintainer, I want the contract check to cover this item's class and its empty attribute list, so that a **Pin move** that adds an attribute fails a test before the spec is out of date.
33. As a package maintainer, I want the accessible name asserted in a play function and in e2e in three engines, so that a regression in Yeti's recipe or in an engine is caught.
34. As a package maintainer, I want the hidden box's size asserted from computed geometry, as Yeti's own test does, so that a change to the recipe is noticed.
35. As a package maintainer, I want the item file's acquisition and release tested through `TestBed.createDirective`, so that the counted link is shown to follow the directive's life.
36. As an accessibility auditor, I want the spec to name the WCAG 2.2 AA criteria this item touches and how each is met, so that I can audit it.
37. As an accessibility auditor, I want to know that the package adds no ledger row for this item and why, so that the ledger's completeness can be checked.
38. As a translator, I want the visible and the hidden words of one control in one `i18n` message, so that I can change their order for my language.
39. As an Angular developer, I want a usage example for a carousel dot, an icon-only button, and a "Read more" link, so that I can copy Yeti's three documented uses.
40. As an Angular developer, I want to know what shows on screen if the item file is missing, so that I can recognise a loading fault.

## Implementation Decisions

### 1. Yeti contract

The manifest entry (`Y/src/utilities/visually-hidden/manifest.json`):

- `name` and `class`: `visually-hidden` (`:3`, `:7`); `kind`: `utility` (`:4`); docs `group`: Visibility (`:5`).
- `attributes`, `classes`, `children`, `markers`, `tokens`: all empty (`:8-12`). `js`: `null` (`:18`), so there is no **Module** and no **Event**.
- `a11y.requiredAttributes` and `a11y.keyboard`: empty (`:14-15`). `a11y.notes` (`:16`): the text is announced in source order and becomes part of the accessible name of whatever contains it; an `aria-label` on the control wins over the text inside; put only text inside, because anything focusable stays focusable.
- `support`: `clip-path` unguarded, nothing guarded (`:19`). `clip-path` is inside Baseline 2025 ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), `clip-path` row).
- `since`: `7.0.0` (`:20`).

The rule (`Y/src/utilities/visually-hidden/visually-hidden.css:17-26`), in cascade layer `yeti.utilities`: `position: absolute`, `inline-size: 1px`, `block-size: 1px`, `overflow: hidden`, `clip-path: inset(50%)`, `white-space: nowrap`. Yeti's reasons (`visually-hidden.css:1-16`; `docs.md:13-15`): absolute keeps the box out of the line it sits in; one pixel because some engines discard a zero-size box, and with it the announcement; overflow and the clip leave nothing to paint; `nowrap` stops a long string wrapping into a one-character column that some screen readers read letter by letter; `display: none` and `visibility: hidden` would remove the text from the accessibility tree.

Related rules Yeti keeps outside this item, which the directive does not touch:

- The **Skip link**: the first link in the body that points at a fragment is hidden by the same recipe until it has `:focus-visible` (`Y/src/base/typography.css:62-90`), in the **Always-loaded group**. Yeti has no class for it and no `.show-on-focus` counterpart (`Y/src/guides/migrating.md:43`; `Y/src/guides/visibility.md:113-115`).
- The button item's toggle input uses its own copy of the recipe, plus `margin: 0` (`Y/src/components/button/button.css:107-117`). It does not use the class, so the button item does not acquire this item file.

Attributes left to the consumer: none; there are none (ticket 26 has no row for this item).

### 2. Contract mapping

| Contract entry | Angular side | Notes |
| --- | --- | --- |
| Identity class `visually-hidden` | static host class on `[yetiVisuallyHidden]` (`YetiVisuallyHidden`) | [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1; row 49 |
| Attributes | none | the manifest declares none (`manifest.json:8`); ADR 0070 leaves nothing to map |
| Markers | none | `manifest.json:11` |
| Events | none | `js: null` (`manifest.json:18`) |
| Tokens | none named | the manifest reads none (`manifest.json:12`); the rule uses no `--yeti-*` token |
| Host presence attribute `data-ngx-yeti-item-visually-hidden` | static, empty value | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) |
| Item file | `utilities/visually-hidden/visually-hidden.css`, acquired in the constructor and released on destroy | ADR 0060 points 1 and 2; section 13 below |

Module replaced: none. Yeti has no module for this item ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md)).

### 3. Hierarchy and DI shape

One directive, no **Part directive**, no **Injection token**, no parent discovery, no generated id, and no platform relationship attribute. The directive is written on its own element, never hosted through `hostDirectives` by another item ([building-blocks.md](../building-blocks.md) Part 2, "Two findings that hold across the matrix"). Its only injection is the item-file acquisition of [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2, through the root service the [setup](setup.md) spec owns, reached by `injectYetiItemStyles('visually-hidden')` from `ngx-yeti/styles` as the last statement of the constructor (ticket 50 decisions 42 and 45), which acquires the item file on the server too and releases it through `DestroyRef`. That is the same for every item directive and is not a dependency of this item's own design.

An item that uses hidden text in its markup does not host this directive and does not acquire its item file for the consumer: the consumer writes `yetiVisuallyHidden` on the span, and that directive acquires it. This covers the carousel's dots (`Y/src/components/carousel/manifest.json:16`, `:42`) and any table header cell or scroller label (`Y/src/layouts/scroller/docs.md:7`). No cross-item rule ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 9) names this item.

### 4. API

`YetiVisuallyHidden`, selector `[yetiVisuallyHidden]`, `exportAs: 'yetiVisuallyHidden'`, entry point `ngx-yeti/visually-hidden`. The class name does not collide with any name Yeti's `yeti.d.ts` exports, so it keeps `Yeti` ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 4 lists the five item classes that collide, and [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 10 adds `NgxYetiPaint` as the sixth; `Y/bin/gen-types.js:31-32` names exported types after vocabularies, and this item has none).

- Host: `class: 'visually-hidden'` and `'data-ngx-yeti-item-visually-hidden': ''`, both static.
- Inputs: none. Models: none. Outputs: none. Public methods: none.
- Host element: any element whose content is text. The selector names no element, because Yeti's manifest names none and its docs write it on a `span` inside a link or a button (`docs.md:8`; `Y/src/components/carousel/docs.md:21-23`).
- `OnPush` does not apply (it is a directive); it holds no state, so it is zoneless-safe by construction.

Usage rules (P23), stated in the directive's JSDoc and in Further Notes:

1. **Text only.** Put only text inside the host. A link, a button, or any other focusable element inside stays focusable and takes Tab focus with nothing on screen (`manifest.json:16`; `docs.md:17`). The directive never goes on a focusable element itself, for the same reason.
2. **One name per control.** Where the control carries an `aria-label`, the browser uses it and ignores the hidden text (`manifest.json:16`; `docs.md:23`). Use the label when the name rewords the content, and the hidden text when the name is the content.
3. **Visible words first.** Keep the control's visible words at the start of its accessible name, with the hidden words after them, as Yeti's examples do (`docs.md:8`), so the name contains the visible label (WCAG 2.2 2.5.3). [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4: a requirement on content the directive cannot read is stated, shown in every example, and asserted by every story.
4. **Not `hidden`, not `aria-hidden`.** Do not put `hidden` or `aria-hidden` on the host or an ancestor of it; either removes the words from the accessibility tree, which is the opposite of this directive (`Y/src/guides/visibility.md:18-24`).
5. **Not with `yetiPrint`.** Do not write `yetiPrint` on the same element. On screen `print` removes the element outright, and on paper the clip leaves a blank pixel where the printed content should be (`Y/src/utilities/print/docs.md:33`).
6. **Not on the skip link.** The page's skip link is hidden and shown by Yeti's base rule (`Y/src/base/typography.css:70-90`). This class would keep it hidden when it takes focus.
7. **No static `class="visually-hidden"`.** The consumer writes the directive attribute, never Yeti's class ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1). An **Application class** of the consumer's own on the same element is allowed.
8. **Last resort.** A control with room for a word should show the word (`docs.md:25`).

Showing hidden words on a condition (Material's `[class.cdk-visually-hidden]="!_closeButtonFocused"`, `NC/src/material/datepicker/datepicker-content.html:38`) has no input: the manifest declares no attribute, and row 49 is "class only". A consumer who needs it renders the words inside or outside the hidden element with `@if`; adding an input later is not breaking ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 28).

### 5. Material comparison

Material has no visually-hidden directive or component. It uses CDK's class in its own templates and code: `NC/src/material/stepper/step-header.html:19-21`, `NC/src/material/datepicker/month-view.html:6`, `NC/src/material/core/option/option.html:29`, `NC/src/material/badge/badge.ts:341`, and conditionally in `NC/src/material/datepicker/datepicker-content.html:38`. CDK itself uses it in `LiveAnnouncer` (`NC/src/cdk/a11y/live-announcer/live-announcer.ts:187`), `FocusTrap`'s anchors (`NC/src/cdk/a11y/focus-trap/focus-trap.ts:344`), and `AriaDescriber`'s message container (`NC/src/cdk/a11y/aria-describer/aria-describer.ts:189-192`). The package uses none of those three services ([building-blocks.md](../building-blocks.md) 1.2).

API and loading:

| Aspect | CDK `cdk-visually-hidden` | ngx-yeti `yetiVisuallyHidden` |
| --- | --- | --- |
| Public form | a CSS class, from the Sass mixin `a11y-visually-hidden` (`NC/src/cdk/a11y/_index.scss:1-36`) or the prebuilt global `@angular/cdk/a11y-prebuilt.css` (`NC/src/cdk/a11y/a11y-prebuilt.scss:1-3`); documented in `NC/src/cdk/a11y/a11y.md:202-221` | an attribute directive with `exportAs`; the consumer writes no class |
| How its CSS loads | once per application by the private `_CdkPrivateStyleLoader` (`NC/src/cdk/private/style-loader.ts:36-68`), which creates `_VisuallyHiddenLoader`, a `styleUrl` component with `ViewEncapsulation.None` (`NC/src/cdk/private/visually-hidden/visually-hidden.ts:15-21`), when a CDK or Material piece that needs it is created; never unloaded until the application is destroyed | a counted `<link>` to the consumer's Yeti build, written on the server, adopted at hydration, removed after the last host leaves the DOM ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 2 to 5) |
| A consumer's own use | must include the mixin or the prebuilt file itself, unless Material's theme already does (`a11y.md:208-210`) | the directive acquires the item file; nothing else to include |
| Cascade layer | unlayered | `yeti.utilities` |

The recipe, property by property:

| Property | Yeti (`visually-hidden.css:18-25`) | CDK (`_index.scss:4-34`) | Effect of the difference |
| --- | --- | --- | --- |
| `position` | `absolute` | `absolute` | same |
| Size | `inline-size: 1px; block-size: 1px` | `width: 1px; height: 1px` | same box in horizontal writing; Yeti's follows the writing mode |
| `overflow` | `hidden` | `hidden` | same |
| Clipping | `clip-path: inset(50%)` | `clip: rect(0 0 0 0)` | both paint nothing; `clip` is deprecated, Yeti's comment says it replaces it (`visually-hidden.css:8-9`); `clip-path` is inside the browser target |
| `white-space` | `nowrap` | `nowrap` | same; CDK cites a Chromium crash with large wrapped non-English text (`_index.scss:14-16`), Yeti cites letter-by-letter reading (`visually-hidden.css:13-15`) |
| `margin` | not set | `-1px` | CDK pulls the 1 px box back over its static position; Yeti's box keeps its static position (inferred: no layout effect, because the box is out of flow) |
| `border`, `padding` | not set | `0`, `0` | a host with its own padding or border keeps a larger layout box under Yeti's rule; nothing paints, because `inset(50%)` clips the whole border box (inferred, not measured) |
| `outline` | not set | `0` | CDK suppresses a focus ring on a hidden focusable control; Yeti forbids focusable content (usage rule 1), and its own hidden toggle input moves the ring to the label (`Y/src/components/button/button.css:107-123`) |
| `appearance` | not set | `none` (prefixed, `_index.scss:21-23`) | CDK stops native control chrome showing on a hidden control (its issue #9049); not applicable to text-only content |
| Inset | not set | `left: 0`, and `right: 0` under `[dir='rtl']` (`_index.scss:25-34`) | CDK pins the box so an absolutely positioned element pushed down cannot extend scrolling (its issue #24597); Yeti relies on the static position and on a positioned ancestor where it matters, as the `scroller` layout is (`Y/src/layouts/scroller/docs.md:7`; `Y/src/layouts/scroller/scroller.css:11`) |

The package adds none of CDK's extra properties: row 49 keeps Yeti's class, no measured WCAG 2.2 AA failure exists for it ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md): axe clean, name measured), and the user's ruling on package CSS covers rules that close a WCAG gap (map, Standing rulings, Package CSS for accessibility). The comparison is not a ledger row: the property-by-property table here is the record, and a later measured WCAG failure adds a row and one rule in `@layer ngx-yeti` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 27).

### 6. Implementation level and primitives

Native platform, level 1; types only ([building-blocks.md](../building-blocks.md) Part 2 row 49 and 1.2). The platform's CSS and the accessibility tree do the work; Yeti's rule is the whole behaviour. Not used: CDK's `cdk-visually-hidden` class, mixin, and `_VisuallyHiddenLoader` (row 49: "CDK's `a11y-prebuilt.scss` class not used, Yeti ships its own"; `NC/src/cdk/a11y/_index.scss:3`, `NC/src/cdk/private/visually-hidden/visually-hidden.ts:21`). No Aria pattern applies.

### 7. ARIA, keyboard, and the ledger

- APG pattern: none. The item adds no role, state, or property, and no key.
- Accessible name: the host's text joins the name of its container in source order, by accessible-name computation from content. An `aria-label` or `aria-labelledby` on the container replaces it (usage rule 2).
- Focus: the host is never focusable and contains nothing focusable (usage rule 1).
- Hidden content: this is the one hiding tool that keeps content in the tree; `hidden` and `aria-hidden` are not used with it ([building-blocks.md](../building-blocks.md) 1.10; usage rule 4).
- Ledger rows: none (row 49). The item has no gap the package closes and the package adds no feature over Yeti here; the CDK comparison is not a row either ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 27).

### 8. Rendered HTML

Consumer markup:

`<a href="/trail-map.pdf">Read more<span yetiVisuallyHidden> about the trail map</span></a>`

Server HTML and hydrated DOM, identical:

`<a href="/trail-map.pdf">Read more<span yetivisuallyhidden="" class="visually-hidden" data-ngx-yeti-item-visually-hidden=""> about the trail map</span></a>`

plus, in `<head>` on the server and adopted at hydration, the item link of [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2: `rel="stylesheet"`, `href` `<url>utilities/visually-hidden/visually-hidden.css?v=<pin>`, `data-ngx-yeti-styles="visually-hidden"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`. No `jsaction`, no id, no ARIA attribute. There is no open or closed state.

### 9. Animation

None. The item has no state and no transition. Reduced motion does not apply.

### 10. Rendering modes

Per [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and [building-blocks.md](../building-blocks.md) 1.11:

- **SSR and prerendering.** The class, the host attribute, and the item link are in the server HTML, so the words are hidden at first paint and announced from the first byte. Prerendering is SSR at build time and behaves the same; nothing reads request tokens.
- **Before hydration.** The directive touches nothing: no DOM write, no listener, no render callback. Its constructor acquires the item file on the server and the client, which is the loader's work, not a DOM write by the directive (ADR 0060 point 5 measured 0 style mutations at hydration).
- **Full hydration.** Nothing changes: the static class and attribute are written again with the same values, and the link is adopted by `data-ngx-yeti-styles` and `data-ngx-yeti-app`.
- **Event replay.** Nothing to replay; the directive declares no listener.
- **Incremental hydration.** Inside `@defer (hydrate on ...)` the host is server-rendered and its link is in `<head>`; a dehydrated host holds the link for as long as it is in the DOM (ADR 0060 point 4, measured).
- **Client `@defer`.** A client-only instance acquires the item file when created; without a server render or a preload the words can show for a frame or more until the stylesheet arrives (ADR 0060 point 6: 18 to 20 unstyled frames with a 300 ms delay, 1 to 2 with none, measured for the mechanism). The consumer closes the gap with `provideYetiStyles({ preload: ['visually-hidden'] })`.
- **`hydrate never`.** The words stay hidden and announced: Yeti's CSS does the whole job, and the dehydrated host keeps its link (ADR 0060 point 4). Nothing is lost.
- **`withI18nSupport()`.** Hidden words are often translated text. A component with `i18n` blocks needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11); the fixture puts the hidden words in an `i18n` message (1.11 decision 11).
- **Zoneless.** Required (map, Standing rulings, item 43). The directive holds no state and schedules nothing.
- **JavaScript off.** With SSR and with prerendering, nothing is lost: the words are hidden and announced exactly as with JavaScript on (map, Standing rulings, JavaScript off; ADR 0011 consequences). A client-only application renders nothing without JavaScript, and the package promises nothing there.
- **Hydration boundary.** No constraint of its own; the directive can sit in any boundary, and a hidden span inside a composite widget's markup (a carousel dot) goes with that widget's boundary.

### 11. Hydration constraints

The directive complies with every constraint the user required (map, Standing rulings, Hydration constraints): the server and the client render the same DOM; it does no direct DOM manipulation; the markup it supports is valid HTML (a `span` of phrasing content inside `a` or `button`); it is unaffected by `preserveWhitespaces`, which the application keeps consistent; and it branches on no platform. The consumer writes no static attribute the directive binds (usage rule 7; [building-blocks.md](../building-blocks.md) "Hydration constraints (2026-10-03)").

### 12. Single-page application

None. The item does nothing on navigation and has no fragment links ([building-blocks.md](../building-blocks.md) 1.15). Hidden words inside a fragment link (a carousel dot) are the carousel spec's and the [fragment-links spec](fragment-links.md)'s concern, not this item's.

### 13. Item file

`yeti-css/css/utilities/visually-hidden/visually-hidden.css`, in cascade layer `yeti.utilities`, the last import of Yeti's own stylesheet (`Y/src/yeti.css:71`), so its rank in the generated insertion table is last ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 3). It loads alone beside the always-loaded group ([Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md), measured for all 49 item files). The consumer's one line is the global stylesheet and `assets` entry the `setup` spec owns; nothing per item.

### 14. Accessibility (WCAG 2.2 AA)

Criteria the item touches, and how each is met ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 1):

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | hidden text names an icon-only control; Yeti's CSS keeps it in the accessibility tree (`manifest.json:16`) |
| 1.3.1 Info and Relationships | the words stay in the DOM in source order and are announced there |
| 2.4.4 Link Purpose (In Context) | "Read more about the trail map", measured as the link's name on a Tab walk ([ticket 17](../issues/17-research-yeti-accessibility-and-standards.md), Utilities row) and in Yeti's own test (`Y/test/browser/utilities/visually-hidden.spec.js:31-36`) |
| 2.5.3 Label in Name | usage rule 3: visible words first; asserted in every story |
| 4.1.2 Name, Role, Value | the container's name includes the hidden words; usage rule 2 for `aria-label` |
| 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum) | usage rule 1: no focusable content, so no focus is ever on something unseen |
| 1.4.10 Reflow | the 1 px box is out of flow and does not widen its container (`visually-hidden.spec.js:25-29`); asserted at 320 CSS pixels in layer 4 |

Ledger rows: none (row 49).

## Testing Decisions

A good test asserts what a visitor and the browser observe: the accessible name of the control, the computed geometry and styles of the hidden element, the class and host attribute in server and hydrated HTML, and the item link in `<head>`. It never asserts on the directive instance's fields. All tests run zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s and [building-blocks.md](../building-blocks.md) 1.12's. Prior art: Yeti's own test, `Y/test/browser/utilities/visually-hidden.spec.js` and its fixture `Y/test/browser/fixtures/utilities/visually-hidden.html` (geometry, unchanged link width, accessible names with the class and with `hidden`, axe); and the [style-loading prototype](../prototypes/style-loading/README.md) for acquisition and release.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Stories under the title `visually-hidden`, ids pinned by `meta.id` ([building-blocks.md](../building-blocks.md) 1.3). Every story loads the always-loaded group globally and lets the directive acquire its item file as a consumer would (ADR 0014 point 1), and runs axe with the six tags and `parameters.a11y.test = 'error'`.

- `visually-hidden--read-more`: Yeti's example, two "Read more" links in a list. Asserts each link's name ("Read more about the trail map", "Read more about the field guide"), the host's class and `data-ngx-yeti-item-visually-hidden`, the computed `position: absolute`, `overflow: hidden`, `white-space: nowrap`, `clip-path` beginning `inset(50%`, a box no larger than 1.5 by 1.5 pixels, and each link's width equal to a link with the visible words only.
- `visually-hidden--icon-button`: a `button` whose face is an image or an SVG with `aria-hidden="true"` on the image and hidden text beside it. Asserts the button's name equals the hidden text.
- `visually-hidden--carousel-dots`: a list of fragment links whose only content is hidden text ("Slide 1" to "Slide 3"), as Yeti's carousel docs write them. Asserts each link's name and that each link is still a Tab stop with its focus ring visible on the link, not on the hidden span.
- `visually-hidden--compared-with-hidden`: Yeti's fixture pair, "Save" plus hidden " changes" against "Save" plus a `hidden` span. Asserts "Save changes" and "Save".
- `visually-hidden--aria-label-wins`: a button with hidden text and an `aria-label`. Asserts the name is the label's, which shows usage rule 2.

Each play function asserts that the visible label starts the accessible name (usage rule 3; ADR 0015 point 4). No story is an **Anti-pattern story**: focusable content inside the hidden element is shown in no story.

### Layer 2: browser-level (Vitest browser mode, `npx nx test <lib>`)

Through `TestBed.createDirective(YetiVisuallyHidden, { tagName: 'span' })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note), with no test host, because the directive needs no parent and no content:

- The host carries `class="visually-hidden"` and `data-ngx-yeti-item-visually-hidden`.
- After creation, `<head>` holds exactly one link with `data-ngx-yeti-styles="visually-hidden"`; a second fixture adds no second link; after both are destroyed and the hosts leave the DOM, the link is removed in a later animation frame (ADR 0060 point 4).
- The `exportAs` name resolves: a small test host template takes `#v="yetiVisuallyHidden"` and reads it. This is the one case with a test host.
- An application class written statically on the host is kept beside Yeti's class.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `visually-hidden.ssr.spec.ts`)

`renderApplication` through the shared `renderServer()` helper over a fixture with the read-more link, the hidden words inside an `i18n` message, and `withI18nSupport()` (1.11 decision 11). Asserts: `whenStable()` resolves; the span has the class and `data-ngx-yeti-item-visually-hidden`; `<head>` has the item link with `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`, and an `href` ending in `utilities/visually-hidden/visually-hidden.css?v=<pin>`; no `jsaction` on the span; the translated words are present.

The contract check over the built manifest (ADR 0014 point 3) covers the item: the directive's class equals `visually-hidden`, and the manifest's `attributes`, `markers`, and `js` are empty, so a **Pin move** that adds any of them fails here first. The manifest attribute-and-value check over the stories ([building-blocks.md](../building-blocks.md) 1.12) finds only the class.

### Layer 4: Playwright e2e (three engines in CI)

On the **Fixture app**, one route for this item rendered both with `RenderMode.Prerender` and with `RenderMode.Server` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0014's 2026-10-03 note):

1. With JavaScript disabled, on both kinds of route: the link's accessible name includes the hidden words, the hidden box is no larger than 1.5 by 1.5 pixels, and axe with the six tags finds nothing.
2. Hydration without NG05xx and `componentsSkippedHydration === 0`; zero attribute or style mutations on the span and zero item links added or removed at hydration.
3. A `@defer (hydrate never)` block holding a hidden span, with the only live instance elsewhere destroyed: the link stays, and the words stay hidden.
4. A client-only `@defer` block with `provideYetiStyles({ preload: ['visually-hidden'] })`: the span's box never exceeds 1.5 by 1.5 pixels in any frame after insertion.
5. At a 320 CSS pixel viewport, a link with a long hidden phrase leaves the page's `scrollWidth` at the viewport width (WCAG 2.2 1.4.10).
6. A route change that removes the last host: the item link is gone after the next frame.

On the Storybook half, the `visually-hidden--carousel-dots` story under Tab in three engines: each dot takes focus and shows the page's focus ring on the link.

The item names the floor of [ADR 0002](../adr/0002-browser-target-baseline-2025.md). Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

## Out of Scope

- Any CSS of the package's own for this item, including CDK's `margin`, `border`, `padding`, `outline`, `appearance`, and inset properties (row 49; no ledger row, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 27).
- CDK's `cdk-visually-hidden` class, its mixin, its prebuilt stylesheet, and `_VisuallyHiddenLoader`.
- An input that shows or hides the words on a condition, and a show-on-focus mode (Yeti has none, `Y/src/guides/migrating.md:43`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 28).
- The **Skip link**: Yeti's base rule owns it, and the [fragment-links spec](fragment-links.md) owns its same-document behaviour under `<base href>`.
- Live announcements (`LiveAnnouncer`, `aria-live` regions): an item spec that needs one owns it.
- `hidden`, `aria-hidden`, `inert`, `data-show`, `data-hide`, and `print`: other tools in Yeti's visibility guide, owned by the platform or their item specs.
- A check that reports focusable content inside the host or an `aria-label` beside hidden text. Checks are a later milestone (map, Milestones); the usage rules state them.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive, class only, no inputs, outputs, or listeners | [building-blocks.md](../building-blocks.md) Part 2 row 49; [Decide: the spec list](../issues/11-decide-spec-list.md) row 49 |
| CSS-only items still get a directive with a static host class and `exportAs` | ticket 11 question 7; map, Scope shape; building-blocks 1.3 |
| Yeti's class, not CDK's `cdk-visually-hidden` | row 49 |
| The consumer writes no Yeti class | [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1 |
| Item file as a counted link, acquired in the constructor, `data-ngx-yeti-item-visually-hidden` on the host | [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 1 to 6; [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) |
| `Yeti` prefix, no collision | [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) points 3 and 4 |
| Native platform, level 1 | building-blocks 1.2; map, Implementation order |
| Usage rules from Yeti's docs, not checks | architecture-guide P23; map, Milestones |
| Visible words first, asserted in every story | [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4 |
| No ledger row, the CDK comparison included | row 49; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 27 |
| Layer 2 through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Every example imports the directive class it uses (P24):

```ts
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';
// imports: [YetiVisuallyHidden]
```

A "Read more" link, Yeti's own example:

```html
<a href="/trail-map.pdf">Read more<span yetiVisuallyHidden> about the trail map</span></a>
```

An icon-only button:

```html
<button type="button" yetiButton>
  <svg aria-hidden="true" focusable="false"><use href="#icon-close" /></svg>
  <span yetiVisuallyHidden>Close</span>
</button>
```

Carousel dots, as Yeti's carousel docs write them (the dot directives are the carousel spec's):

```html
<li><a href="#quote-1"><span yetiVisuallyHidden>Quote 1</span></a></li>
```

Translated words, with the visible and hidden words in one `i18n` message so a translator can reorder them:

```html
<a href="/trail-map.pdf" i18n>Read more<span yetiVisuallyHidden> about the trail map</span></a>
```

Words shown only on a condition, without an input ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 28):

```html
@if (compact()) {
  <span yetiVisuallyHidden>Download</span>
} @else {
  <span>Download</span>
}
```

### Styles

1. **Item file:** `utilities/visually-hidden/visually-hidden.css`, acquired by the directive; the consumer's setup is the `setup` spec's global stylesheet and `assets` entry, nothing per item ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 11).
2. **Always-loaded rules it relies on:** none for the hiding. The skip link's copy of the recipe is a base rule of its own (`Y/src/base/typography.css:70-90`).
3. **Cross-item rules:** none acquired. The `scroller` layout is a positioned ancestor, so a hidden label inside it scrolls with the track (`Y/src/layouts/scroller/docs.md:7`); the button item's toggle input has its own copy of the recipe and does not use this item (`Y/src/components/button/button.css:107-117`); `print` and this item do not combine (usage rule 5).
4. **Tokens:** none read, none written.
5. **What visibly breaks when the item file is missing:** the words show inline at full size, so "Read more" reads "Read more about the trail map" on screen and each carousel dot shows "Slide 1" beside it. The accessible name is unchanged (inferred from the rule).
6. **Tailwind collision:** none. Tailwind v4 generates no `visually-hidden` class (inferred, not checked against Tailwind's source); the `hidden` class it does generate is a different name ([building-blocks.md](../building-blocks.md) 1.13).

### Platform features to adopt when the browser target moves

None known. Yeti's recipe already uses `clip-path`, inside the target, in place of the deprecated `clip`. The recipe is Yeti's to change, and a **Pin move** brings any change.

### Single-page-application pieces it relies on

None.
