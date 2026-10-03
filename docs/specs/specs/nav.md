# Spec: nav (component item)

Ticket: [84. Spec: nav (component)](../issues/84-spec-nav.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 34, its "Aria decisions (2026-10-03)" row for `nav` and `dropdown` ("Custom disclosure navigation, as ADR 0019 says"), and Part 1 (1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.13, 1.15); the user's choice for the row, "Custom disclosure nav (Recommended)" (map, Standing rulings, "The Aria rows, one by one"); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 122 to 129; [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 3, 5, 6, 8, 10, 18, 42, 45, 48, 87, and 88); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0016](../adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md), [ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md), [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); the shared specs [generated-ids](generated-ids.md), [events](events.md), [navigation-close](navigation-close.md), [fragment-links](fragment-links.md), and [setup](setup.md); and, for why Angular Aria's Menu and Tree are not used, [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md) (its [nav and dropdown findings](../prototypes/aria-nav-dropdown/README.md)) and [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md). The nested dropdown is the `dropdown` item's ([dropdown](dropdown.md), written in parallel from [ticket 82](../issues/82-spec-dropdown.md) and Part 2 row 32; its `dropdown--in-nav` story and its navigation case share this spec's). The item owns [ledger.md](../ledger.md) row A11Y-3b. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453`; `APG/` is `github.com/w3c/aria-practices/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 91 to 93 and 167 to 175), and each is cited where it applies.

## Problem Statement

Yeti's `nav` is "The bar across the top of a site: the name, the main links, a button or two. It is a bar of links, not a menu system" (`Y/src/components/nav/docs.md`). It is one **Identity class**, `nav`, on a `nav` element holding an optional brand, a toggle button, one `ul` of links, and optional actions. The list carries `popover` and the toggle carries `popovertarget` naming the list's `id`. Below the nav's own **Threshold** the list is a closed popover the toggle opens as a sheet, a drawer, or a screen; at or above it the nav's container query puts the list back in the bar and hides the toggle. "One list, two modes, no script" (`Y/src/components/nav/nav.css:1-4`). Five **Attributes** configure it (`data-variant`, `data-threshold`, `data-panel`, `data-gap`, `data-sticky`), and three **Markers** name parts (`data-brand`, `data-close`, `data-actions`). It has no **Module** (`manifest.json` `"js": null`).

An Angular developer who writes that markup directly meets five measured or read problems:

- The developer would write `class="nav"`, the `data-*` attributes, the markers, the list's `id`, and the toggle's `popovertarget` by hand, untyped. `data-panel="side"` compiles and silently falls back to the sheet; a misspelt `popovertarget` leaves a toggle that opens nothing, with no error ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md); [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md); [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md)). A hand-written `id` repeats when the nav is rendered twice.
- The open panel stays open when focus leaves it. Popover light dismiss closes on an outside press and on Escape, not on focus-out (WHATWG `popover.html#popover-light-dismiss`, read in ticket 17), so Tab can move focus to a control the drawer or the screen panel still covers (WCAG 2.2 2.4.11; ledger A11Y-3b). [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md) measured Yeti's own nav sheet staying open on focus-out in three engines.
- In a routed application, a nav panel in the persistent shell stays open over the new route after a `routerLink` inside it navigates ([Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), measured in three engines; ledger A11Y-15).
- The application has no typed way to know whether the panel is open, or to open and close it, and a field written from a `toggle` listener does not refresh a zoneless view (ticket 18, measured).
- The developer needs the `nav` **Item file** loaded while a nav is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the user agent hides the closed popover list at every width, so the links never appear in the bar.

## Solution

Seven directives in the secondary entry point `ngx-yeti/nav`, on the consumer's own markup, after Yeti's example ([building-blocks.md](../building-blocks.md) Part 2 row 34; 1.3):

- **`YetiNav`**, the **Item directive** and **Coordinating directive**, on `nav[yetiNav]`, `exportAs: 'yetiNav'`. It binds `nav` as a static host class, binds `data-variant`, `data-threshold`, `data-panel`, `data-gap`, and `data-sticky` from typed inputs, sets the static presence attribute `data-ngx-yeti-item-nav` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), provides `yetiNavToken`, and loads the item file. It owns the `isOpen` model, the `opened` and `closed` **Completion outputs**, no public methods ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91), the focus-out close ([ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md)), and closing on navigation through `injectCloseOnNavigation` ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)).
- **`YetiNavToggle`** on `button[yetiNavToggle]`: binds `popovertarget` to the list's id.
- **`YetiNavList`** on `ul[yetiNavList]`: renders the list's `id` (the consumer's, else `injectYetiId('nav')`), binds the static `popover` attribute, and observes the list's `toggle` and `transitionend`.
- **`YetiNavClose`** on `li[yetiNavClose]`: binds the static marker `data-close`.
- **`YetiNavCloseButton`** on `button[yetiNavCloseButton]` inside the close item: binds `popovertarget` to the list's id and the static `popovertargetaction="hide"` (`Y/src/components/nav/docs.md:16`).
- **`YetiNavBrand`** on `[yetiNavBrand]` and **`YetiNavActions`** on `[yetiNavActions]`: bind the static markers `data-brand` and `data-actions`.

The platform keeps doing what it does in Yeti: the toggle opens and closes the list with no script, light dismiss and Escape close it, the browser gives the toggle its expanded state, and the close button hides the list (`nav/docs.md`; building-blocks 1.8). The package adds only what Yeti lacks: closing when focus leaves the list and its toggle (ledger A11Y-3b), closing on navigation (A11Y-15), typed state and outputs, and generated ids. It keeps Yeti's disclosure markup: native list and links, `role="list"` and the names written by the consumer, no `menu`, `menubar`, `menuitem`, or `tree` role, and no roving tab stop ([ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md)). A `.dropdown` inside a list item is the `dropdown` item's own directives (`nav/manifest.json:76`).

```html
<nav yetiNav aria-label="Site" i18n-aria-label threshold="sm" panel="drawer">
  <a yetiNavBrand routerLink="/">Yeti</a>
  <button type="button" yetiNavToggle aria-label="Menu" i18n-aria-label>
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
  </button>
  <ul yetiNavList role="list">
    <li yetiNavClose><button type="button" yetiNavCloseButton aria-label="Close" i18n-aria-label>×</button></li>
    <li><a routerLink="/docs" routerLinkActive ariaCurrentWhenActive="page" i18n>Docs</a></li>
    <li><a routerLink="/blog" routerLinkActive ariaCurrentWhenActive="page" i18n>Blog</a></li>
  </ul>
</nav>
```

## User Stories

1. As an application developer, I want to build Yeti's site bar with directive attributes on my own `nav`, `button`, `ul`, and `li` elements, so that I never write Yeti's `nav` class or its markers by hand.
2. As an application developer, I want the directives to render Yeti's exact class, `data-*` attributes, markers, `popover`, and `popovertarget`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the list's `id` generated for me and the toggle's `popovertarget` bound to it, so that I never type an id and two navs on one page never share one.
4. As an application developer, I want my own static `id` on the list to win, so that I can address the list from my own code or tests.
5. As an application developer, I want the close button's `popovertarget` bound to the same id with `popovertargetaction="hide"`, so that the close item works with no script.
6. As an application developer, I want `variant` typed by Yeti's `variant` vocabulary, so that `variant="blue"` fails to compile.
7. As an application developer, I want `threshold` typed by Yeti's `width` vocabulary, shared with `columns`, so that a nav and the columns under it can switch at the same width.
8. As an application developer, I want `panel` typed by Yeti's `panel` vocabulary (`sheet`, `drawer`, `screen`), so that `panel="side"` fails to compile.
9. As an application developer, I want `gap` typed by Yeti's `gap` vocabulary, fluid pairs included, so that the bar's spacing matches every other item's.
10. As an application developer, I want a boolean `sticky` input, so that the bar stays at the top of the scrollport as the page scrolls.
11. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own defaults (`primary`, `md`, `sheet`, `sm`) apply from its CSS.
12. As an application developer, I want static attributes such as `threshold="sm"` to type-check, so that I need no property binding for a constant.
13. As an application developer, I want the links in the bar when the nav is wide and behind the toggle when it is narrow, decided by the nav's own width, so that a nav in a narrow column collapses while the same one across a page does not.
14. As an application developer, I want an `isOpen` model, so that I can read or two-way bind whether the panel is open.
15. As an application developer, I want writing `isOpen` to open or close the panel, so that my state can drive it.
16. As an application developer, I want a button elsewhere on the page to open and close the panel by writing `isOpen`, so that one programmatic path serves every item with an open state (ticket 50 decision 91).
17. As an application developer, I want `(opened)` and `(closed)` outputs that fire once the panel has finished opening or closing, so that I act on settled UI.
18. As an application developer, I want `(closed)` to fire however the panel closed (the toggle, the close button, Escape, an outside press, focus leaving, navigation, my own code), so that I need one handler.
19. As an application developer, I want the panel to close when a `routerLink` in it navigates, so that the new route is not covered by a stale panel.
20. As an application developer, I want the panel to stay open when the application starts if the user opened it before hydration, so that start-up does not undo the user's action.
21. As an application developer, I want a nested `dropdown` in a list item to keep working with its own directives, so that a section with children of its own opens inside the bar or the panel.
22. As an application developer, I want `aria-current="page"` to come from `RouterLinkActive` with `ariaCurrentWhenActive="page"` or my own binding, so that Yeti's current-link style follows the route with no class.
23. As an application developer, I want `yetiNav` beside `yetiShellRegion` or `yetiSidebarChild` on one `nav` to share one `sticky` input, so that one `data-sticky` is rendered.
24. As an application developer, I want the nav item file loaded when the first nav renders and removed after the last leaves, so that I do not import `nav.css` globally.
25. As an application developer, I want the item file in the server HTML when a server-rendered page has a nav, so that the first paint already shows the bar or the toggle.
26. As an application developer, I want the bar and the toggle to work with JavaScript off under SSR and prerendering, so that the site can be navigated before any script runs.
27. As an application developer, I want hydration to change nothing on the nav, so that I get no `NG05xx` error and no flash.
28. As an application developer, I want the nav to work inside a `@defer (hydrate on ...)` block before and after it hydrates, so that incremental hydration is safe.
29. As an application developer, I want the docs to state what a nav inside `hydrate never` keeps and loses, so that I keep shell navs in hydrated regions.
30. As an application developer, I want to know that a nav in a client-only `@defer` block needs `nav` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
31. As an application developer using `withI18nSupport()`, I want translated labels and links to hydrate without being re-rendered, so that localised pages keep the server's DOM.
32. As an application developer, I want template references for every directive (`#n="yetiNav"`), so that the package's `exportAs` rule holds.
33. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiWidth`, `YetiPanel`, `YetiGap`), so that I can type my own signals that feed the inputs.
34. As an application developer, I want the usage rules stated (names, `role="list"`, the toggle and list as direct children, the close item for `screen`, `aria-current`, sticky offsets, one hydration boundary), so that I use the item as Yeti intends.
35. As an application developer, I want the nav to work under zoneless change detection, so that `isOpen` and the outputs refresh my views.
36. As a keyboard user, I want Enter or Space on the toggle to open and close the list, so that I can reach the links behind it.
37. As a keyboard user, I want Tab from the toggle to reach the first link of the open list, so that the panel follows the toggle in the tab order.
38. As a keyboard user, I want Escape to close the open list and return focus to the toggle, so that I am not left inside a closed panel.
39. As a keyboard user, I want the panel to close when focus moves outside the list and its toggle, so that a drawer or screen panel never covers the control I tabbed to.
40. As a keyboard user, I want a nested dropdown's Escape to close only the nested panel first, so that I do not lose my place in the list.
41. As a keyboard user, I want focus back on the toggle after a navigation closes the panel, so that my place in the page is kept.
42. As a pointer user, I want a press on the panel's own padding or text to leave it open, so that the panel does not shut under my pointer.
43. As a pointer user, I want a press outside the panel, or on the drawer's backdrop, to close it, so that dismissing is as Yeti has it.
44. As a touch user of a `screen` panel, I want a close button in the panel, so that I can leave a panel that has no outside to press.
45. As a screen-reader user, I want the bar to be a named navigation landmark with a list of links, so that I can find it and know how many links it holds.
46. As a screen-reader user, I want the toggle to be a named button whose expanded state the browser reports, so that I know whether the list is shown.
47. As a screen-reader user, I want the current page's link announced as current, so that I know where I am.
48. As a screen-reader user, I want links to stay links, never menu items, so that the links list and link navigation keys work.
49. As a low-vision user, I want the links' text, the current link, and the toggle's icon to meet contrast in light and dark schemes, so that I can read the bar.
50. As a low-vision user, I want the bar to collapse rather than overflow at 320 CSS pixels, so that I never scroll sideways.
51. As a user of forced colours, I want the current link still told apart from the others, so that the state is not lost.
52. As a user who prefers reduced motion, I want the panel to appear without sliding, so that motion does not distract me.
53. As a keyboard user of a sticky bar, I want a focused control never to be entirely hidden behind the stuck bar, so that I can see where focus is.
54. As a package maintainer, I want the contract check to cover the five attributes, the three markers, and every value of their vocabularies, so that a pin move that adds one fails before release.
55. As a package maintainer, I want the SSR smoke to assert the server HTML of a nav with its generated id and item link, so that the first paint is proven.
56. As a package maintainer, I want the fixture app to render the nav on a prerendered and a server route, with JavaScript on and off, so that both paths of the JavaScript-off ruling are tested.
57. As a package maintainer, I want the focus-out case, the inside-press case, and the pre-hydration press case measured in three engines, so that ADR 0043's consequences are checked for the nav.
58. As a package maintainer, I want whether the platform returns focus to the toggle after `hidePopover()` measured, so that ADR 0041 point 4's conditional `focus()` is justified.
59. As a package maintainer, I want the geometry tests to follow Yeti's own `nav.spec.js` cases, so that the package proves the same item Yeti proves.
60. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/nav/manifest.json`, `nav.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/space.css`, `Y/src/components/toc/toc.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `nav`, `component`, `Navigation` |
| `class` | `nav` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (9 values), default `primary`, "The hue of the current link and of the hover tint." `data-threshold`: enum, vocabulary `width` (`2xs` to `2xl`), default `md`, "The nav's own width at or above which the links sit in the bar; below it they are behind the toggle." `data-panel`: enum, vocabulary `panel` (`sheet`, `drawer`, `screen`), default `sheet`. `data-gap`: enum, vocabulary `gap` (29 values), default `sm`. `data-sticky`: boolean, "Keep the bar at the top of the scrollport as the page scrolls, at --yeti-sticky-offset from the edge." |
| `classes` | empty |
| `children` | `> [data-brand]` (0 to 1); `> button[popovertarget]` (exactly 1, "The toggle; its popovertarget names the list's id. Hidden while the links are in the bar."); `> ul[popover]` (exactly 1, "The links, one per li, with role=\"list\" and the id the toggle names."); `li` (1 or more, "each holds one link"); `[data-close]` (0 to 1, "An li holding a button with popovertargetaction=\"hide\" ... Required with data-panel=\"screen\"."); `.dropdown` (0 or more); `> [data-actions]` (0 to 1) |
| `markers` | `data-brand` (on `> *`), `data-close` (on `li`), `data-actions` (on `> *`), all boolean |
| `tokens` | public: `--yeti-nav-padding`, `--yeti-nav-radius`, `--yeti-nav-border`, `--yeti-nav-surface`, `--yeti-nav-panel`, `--yeti-nav-brand-weight`, `--yeti-nav-brand-size`, `--yeti-nav-link`, `--yeti-stretch-small`, `--yeti-control-size`, `--yeti-shadow-md`, `--yeti-shadow-color`, `--yeti-color-text`, `--yeti-border-width`, `--yeti-space-sm`, the six `--yeti-color-primary*` and `--yeti-on-primary` defaults, `--yeti-weight-strong`, `--yeti-space-xs`, `--yeti-duration-fast`, `--yeti-ease`, `--yeti-text-lg`, `--yeti-space-xl`; private: `--_yeti-gap`, `--_yeti-variant*`, `--_yeti-on-variant`, `--_yeti-nav-link` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby`; keyboard: Enter / Space on the toggle opens or closes the list; Tab from the toggle into the open list's first link; Escape closes the open list and returns focus to the toggle; notes: the nav's name, the toggle's name, `aria-current="page"`, `role="list"` on the `ul`, and the close item with `screen` |
| `js` | `null`: no Module, no **Event** |
| `support` | `unguarded`: `popover`, container size queries, `@starting-style`; `guarded`: anchor positioning with `anchor-scope` (fallback: the sheet starts at the top of the viewport, and a submenu in the open panel docks to the foot of it) |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.nav` is a flex row and an inline-size container (`nav.css:6-16`); `.nav:not([data-gap])` and `.nav:not([data-variant])` supply the defaults (`:17-18`). The toggle and the close button are bare squares of `--yeti-control-size` (`:38-59`). Links and a nested dropdown's trigger are `inline-flex` at the control size; `a[aria-current]` takes the variant's text colour and `--yeti-weight-strong` (`:71-88`). `:popover-open` turns the list into a fixed panel (`:96-115`), shaped by `data-panel`: the sheet under the bar, anchored where anchor positioning and `anchor-scope` exist and at the top of the viewport otherwise (`:128-144`); the drawer from the start edge with a dimmed `::backdrop` (`:148-155`); the screen over the viewport, inset by `--yeti-space-xl` when no close item exists (`:158-173`). A dropdown inside the open panel becomes a full-width block (`:188-219`). The panel fades in, and the drawer slides in, through `@starting-style`; leaving is instant (`:221-227`). Six `@container` blocks, one per threshold from `xs` to `2xl`, put the list in the bar and hide the toggle and the close item, each guarded by `:not(:has(> ul[popover]:popover-open))`, so an open panel stays a panel at any width until it is dismissed (`:229-280`). No block exists for `2xs` ([upstream-bugs.md](../upstream-bugs.md) Y12; ticket 50 decision 93). `data-variant`, `data-gap`, and `data-threshold` are mapped to private tokens by the always-loaded `layouts/attributes.css`, and `[data-sticky]` is its `yeti.utilities` rule (`:333-342`). Smooth scrolling for in-page links lives in `toc.css` (`html:has(.toc, .nav a[href^="#"]:not([href="#"]))`, `toc.css:9`).

Attributes left to the consumer (ticket 26 rows 122 to 129; building-blocks 1.1 and 1.10): the nav's `aria-label` or `aria-labelledby`, the toggle's name, the close button's name, `role="list"` on the `ul`, `type="button"` on both buttons, and `aria-current` on the current link (by hand or by `RouterLinkActive`).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `nav` | static host class on `nav[yetiNav]` (`YetiNav`) | always | ADR 0003 point 1; Part 2 row 34 |
| Attribute `data-variant` | hue of the current link and hover tint | input `variant`: `YetiVariant \| undefined`, `[attr.data-variant]` | unset renders nothing; Yeti's `primary` applies. Not an HTML attribute | ticket 26 row 122 (R) |
| Attribute `data-threshold` | the nav's own width for the bar | input `threshold`: `YetiWidth \| undefined`, `[attr.data-threshold]` | unset renders nothing; Yeti's `md` applies. Not an HTML attribute | ticket 26 row 123 (R); building-blocks 1.7 |
| Attribute `data-panel` | the open list's shape | input `panel`: `YetiPanel \| undefined`, `[attr.data-panel]` | unset renders nothing; Yeti's `sheet` applies. Not an HTML attribute | ticket 26 row 124 (R) |
| Attribute `data-gap` | space between parts and links | input `gap`: `YetiGap \| undefined`, `[attr.data-gap]` | unset renders nothing; Yeti's `sm` applies. Not an HTML attribute | ticket 26 row 125 (R) |
| Attribute `data-sticky` | keeps the bar at the top of the scrollport | input `sticky`: `boolean`, `booleanAttribute`, `[attr.data-sticky]` as `''` or `null` | default `false`, renders nothing. Not an HTML attribute | ticket 26 row 126 (R) |
| Marker `data-brand` (on `> *`) | the site's name or mark | static host attribute `data-brand=""` on `[yetiNavBrand]` (`YetiNavBrand`); no input | always present | ticket 26 row 127 (P) |
| Marker `data-close` (on `li`) | the item holding the close button | static `data-close=""` on `li[yetiNavClose]` (`YetiNavClose`); no input | always present | ticket 26 row 128 (P) |
| Marker `data-actions` (on `> *`) | buttons at the end of the bar | static `data-actions=""` on `[yetiNavActions]` (`YetiNavActions`); no input | always present | ticket 26 row 129 (P) |
| Child `> button[popovertarget]` | the toggle | `button[yetiNavToggle]` (`YetiNavToggle`) binds `[attr.popovertarget]` from the list's id | always bound once the list is known | ADR 0003 point 5; ADR 0013; Part 2 row 34 |
| Child `> ul[popover]` | the list | `ul[yetiNavList]` (`YetiNavList`) binds static `popover: ''` and `[attr.id]` from `injectYetiId('nav')` | always | ADR 0003 point 5; ADR 0044; [generated-ids](generated-ids.md) |
| Child `[data-close] > button` | hides the list | `button[yetiNavCloseButton]` (`YetiNavCloseButton`) binds `[attr.popovertarget]` from the list's id and static `popovertargetaction: 'hide'` | always | `nav/docs.md:16`; Part 2 row 34 |
| Children `li`, links | entries | no directive; the consumer's `li` and `a` | not applicable | architecture-guide's part rule (a position-styled `li` gets none) |
| Child `.dropdown` | a nested dropdown | the `dropdown` item's directives (`li[yetiDropdown]` and its parts); not this spec's | not applicable | `nav/manifest.json:76`; Part 2 rows 32 and 34 |
| Native state `:popover-open` | the list's open state | never bound; read once when the list part is created, then followed through the list's `toggle`; the `isOpen` model reflects it | not applicable | map, Standing rulings, Open state; ADR 0003 point 4 |
| Events | none (`js: null`) | outputs `opened` and `closed`, `void`, Completion outputs that map no Yeti event | not applicable | [events](events.md) section 2 ("Outputs that map no Yeti event"); ticket 50 decision 3 |
| Tokens `--yeti-nav-*`, `--yeti-control-size`, colour, space, motion tokens | the item's look | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-sticky-offset`, `--yeti-scroll-padding`, `--yeti-toc-scroll` | where the sticky bar stops; where a scroll into view stops; smooth in-page scrolling | the consumer's | not applicable | ADR 0004; usage rule 9 |
| Private tokens | `--_yeti-*` | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-nav=""` on `nav[yetiNav]` only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Generated id (package) | not Yeti's | `ngx-yeti-nav-<n>` on the list unless the consumer wrote an `id` | always, on the list | ADR 0044; ADR 0080 point 2; [generated-ids](generated-ids.md) |
| Injection token | not Yeti's | `yetiNavToken`, provided by `YetiNav` | not applicable | building-blocks 1.3 and 1.9 |

No input on any nav directive is named like an HTML attribute of its host, so no input needs an `output`, `removed`, `insertion`, or `inert` kind (building-blocks 1.4). The part directives set no presence attribute and acquire no item file (ticket 50 decision 6). The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). `YetiPanel` is one of the 46 names `yeti.d.ts` exports; the package imports and re-exports it and declares no type of that name.

**Module replaced:** none. Yeti's `nav` has no Module (`manifest.json` `"js": null`; Part 2 row 34, "none (`nav` has no module)"). Every behaviour of Yeti's nav is the platform's and its CSS's, and the package keeps each one:

| Yeti behaviour | Where | Package |
| --- | --- | --- |
| The toggle opens and closes the list | `popovertarget` (`docs.md`, How it works) | kept: the toggle's directive renders `popovertarget` with the list's id |
| Light dismiss: an outside press or a backdrop press closes the panel | platform `popover="auto"` (`docs.md`; `nav.css:146-147`) | kept, the platform's (ADR 0016 point 1) |
| Escape closes the panel and returns focus to the toggle | platform close request (`manifest.json` `a11y.keyboard`) | kept, the platform's; measured in ticket 17 (all engines, keyboard-opened) |
| The toggle's expanded state | the browser (`docs.md`) | kept: no `aria-expanded` is bound (building-blocks 1.8) |
| The close item hides the list | `popovertargetaction="hide"` | kept: the close button's directive renders both attributes |
| Links in the bar at or above the threshold; an open panel stays a panel until dismissed | container queries (`nav.css:229-280`) | kept, Yeti's CSS (building-blocks 1.7) |
| The panel's shape, entering transition, and nested dropdown block | `nav.css` | kept, Yeti's CSS |
| Smooth scrolling for in-page links | `toc.css:9` | kept as Yeti has it, documented, not loaded by the nav (ADR 0060 point 9) |

Added (not Yeti's): focus-out closing (A11Y-3b), closing on navigation (A11Y-15), the `isOpen` model, the `opened` and `closed` outputs, and generated ids.

### 3. Hierarchy and DI shape

- **Root:** `YetiNav` provides `{ provide: yetiNavToken, useExisting: YetiNav }`, with the token declared with `import type` in the entry point's token file (building-blocks 1.9). Its description is its name.
- **Required parts:** `YetiNavToggle`, `YetiNavList`, and `YetiNavCloseButton` inject `yetiNavToken` with no `optional` flag: building-blocks 1.9 names "a nav toggle inside a nav" as a part that cannot exist alone, and a list or a close button outside a nav has no toggle and no Yeti rule (`.nav > ul[popover]`). Because DI follows the declaration site, these parts are declared in the same template as their `yetiNav` host (usage rule 3).
- **Marker parts:** `YetiNavBrand`, `YetiNavActions`, and `YetiNavClose` inject `yetiNavToken` with `{ optional: true, skipSelf: true }`, as the `breakout` spec's marker part does, and read nothing from it in the first milestone; the **In-item check** that would use it belongs to a later milestone (map, Milestones) (ticket 50 decision 172).
- **Registration:** `YetiNavList` and `YetiNavToggle` register their host elements with the root through the token in their constructors, into two root signals, and unregister on destroy. The root's `listId` is a `computed` from the registered list's id. These members are documented as internal, as the `buttons` spec's `members` are; they are not public API. There is one list and one toggle (manifest `children`, exactly 1 each), so no ordered collection is needed.
- **Generated id:** `YetiNavList` calls `injectYetiId('nav')` in a field initializer, because its host renders the `id` ([generated-ids](generated-ids.md), "Who calls `injectYetiId`"; ticket 50 decision 5, the guide's corrected nav example). The toggle and the close button read `listId` through the token and bind it as their own host attribute; neither calls `injectYetiId`. The relationship attributes are host bindings that hydration leaves unchanged (ADR 0044 point 4).
- **Nested dropdowns:** building-blocks 1.9 lets a `li[yetiDropdown]` inside the list inject `yetiNavToken` optionally, through the token's `import type` declaration, so the `dropdown` entry point would not import `YetiNav` (architecture-guide's entry-point rule). The [dropdown](dropdown.md) spec finds no behaviour that needs it and injects nothing from the nav (its own open point); the nav provides the token for its parts either way. The nav reads nothing from its dropdowns: their panels are DOM descendants of the list, so the nav's focus-out rule treats them as inside the list, and their popovers are nested under the list's in the platform's popover stack.
- **Composition:** no host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer writes `yetiShellRegion` or `yetiSidebarChild` beside `yetiNav` on one `nav`; `sticky` is `boolean` on all of them, so one static `sticky` renders one `data-sticky` (building-blocks 1.4, shared vocabularies). A link in the actions may carry `yetiButton`.
- **Other injections:** `YetiNav` injects ADR 0060's styles service through `injectYetiItemStyles('nav')` ([setup](setup.md); ticket 50 decision 45), calls `injectCloseOnNavigation(this.isOpen, () => this.#closeOnNavigation())` ([navigation-close](navigation-close.md)), and injects `DOCUMENT` for the focus checks.
- **Implementation level:** native platform for every behaviour Yeti has; custom Angular host listeners for the two additions (section 6).

### 4. API

| Member | `YetiNav` | `YetiNavToggle` | `YetiNavList` | `YetiNavCloseButton` | `YetiNavClose`, `YetiNavBrand`, `YetiNavActions` |
| --- | --- | --- | --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so `Yeti` (ADR 0080 point 4; ticket 50 decision 10) | same | same | same | same |
| Selector | `nav[yetiNav]` (Part 2 row 34; architecture-guide's native-element rule) | `button[yetiNavToggle]` | `ul[yetiNavList]` | `button[yetiNavCloseButton]` | `li[yetiNavClose]`, `[yetiNavBrand]`, `[yetiNavActions]` |
| `exportAs` | `yetiNav` | `yetiNavToggle` | `yetiNavList` | `yetiNavCloseButton` | `yetiNavClose`, `yetiNavBrand`, `yetiNavActions` |
| Entry point | `ngx-yeti/nav` | same | same | same | same |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `threshold: YetiWidth \| undefined` (`md`); `panel: YetiPanel \| undefined` (`sheet`); `gap: YetiGap \| undefined` (`sm`); each `input()` with no default value; `sticky: boolean`, `booleanAttribute`, default `false` | none | none | none | none |
| Models | `isOpen: boolean`, `model(false)`; see "Open state" | none | none | none | none |
| Outputs | `opened: void`, `closed: void`, Completion outputs ([events](events.md) rules 1 to 3 and 7; ticket 50 decision 3) | none | none | none | none |
| Methods | none: programmatic open and close go through `isOpen` (ticket 50 decision 91) | none | none | none | none |
| Host | static `class: 'nav'`; static `data-ngx-yeti-item-nav: ''`; `[attr.data-variant]`, `[attr.data-threshold]`, `[attr.data-panel]`, `[attr.data-gap]`, `[attr.data-sticky]`; `(focusout)` and `(pointerdown)` listeners | `[attr.popovertarget]` from `listId()` | static `popover: ''`; `[attr.id]`; `(toggle)` and `(transitionend)` listeners | `[attr.popovertarget]` from `listId()`; static `popovertargetaction: 'hide'` | static `data-close: ''`, `data-brand: ''`, `data-actions: ''` |
| Providers | `yetiNavToken` | none | none | none | none |
| Injection | styles service; `DOCUMENT`; through `injectCloseOnNavigation`, `Router` (optional) and `DestroyRef` | `yetiNavToken` (required) | `yetiNavToken` (required); through `injectYetiId`, the id counter | `yetiNavToken` (required) | `yetiNavToken` (optional, `skipSelf`) |
| Lifecycle | acquires `nav` as the last statement of its constructor, after anything that can throw, and releases it through `DestroyRef` ([setup](setup.md); ticket 50 decisions 42 and 45) | registers and unregisters its host | registers and unregisters its host and id | none | none |

**Open state** (the open-state ruling, "Never bind; read once (Recommended)", map, Standing rulings; building-blocks 1.4; the [dialog](dialog.md) spec's same section, which this follows so that the two items agree):

1. The list has no open attribute, so a server render always has it closed and the model starts `false`. The list part reads the list's `:popover-open` once, when it is created ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91): on the server the read reports closed, because the server's DOM never has an open popover, and at hydration it sees whatever the user did before hydration. The read needs no platform check; a layer-3 case asserts that it runs on the server's DOM without an error.
2. At the first render the element wins over the parent's initial `isOpen` binding: the model is set to the element's state, and `isOpenChange` emits only when that differs from the bound value; `opened` does not emit. An initial bound `true` opens nothing (ticket 50 decisions 91 and 146).
3. After that, the list's `toggle` handler reads the list's live `:popover-open`, never the event's `newState`, so a replayed `toggle` that no longer matches the element changes nothing. A change sets `isOpen` (emitting `isOpenChange`) and starts the completion wait.
4. A parent's later write to `isOpen` calls `showPopover()` (for `true` on a closed list) or `hidePopover()` (for `false` on an open list) in an `afterRenderEffect` write phase and emits no `isOpenChange`, as `model()` does not for a parent write. The platform's `toggle` follows, and `opened` or `closed` emits after the transition, because those outputs follow every open and close of the list (events rule 9; the dialog spec's reading).
5. The nav has no `open()`, `close()`, or `toggle()` method: a parent opens and closes the list by writing `isOpen` (point 4; ticket 50 decision 91). Opening above the threshold shows a panel, because Yeti's CSS keeps an open list a panel at any width (`nav.css:229-238`); the toggle is then visible until the panel is dismissed.

**Completion** (building-blocks 1.6 rule 1; ticket 50 decision 3): after an open or close is observed, the list part waits for the first `transitionend` whose `target` is the list and whose `pseudoElement` is empty, with a fallback timer of the longest computed `transition-duration` on the list plus 100 ms, a measured zero completing at once, then the root emits `opened` or `closed`. Yeti's panel fades in over `--yeti-duration-fast` (and the drawer slides) and leaves instantly (`nav.css:108`, `:221-227`), so `closed` emits at once. A wait still running when the opposite change starts completes at once, so a `closed` always precedes the next `opened`, as the dialog spec has it. The timer is never a parsed token (`upstream-bugs.md` Y1) and is cleared on destroy.

**Focus-out close** (ADR 0016 point 2; ADR 0043 point 1; Part 2 row 34; ledger A11Y-3b): `YetiNav`'s `focusout` host listener acts only while `isOpen()` is true. It closes the list with `hidePopover()` when `event.relatedTarget` is outside both the list and the toggle, the "panel and its invoker" of ADR 0016 point 2; brand, actions, and the rest of the bar count as outside (ticket 50 decision 167; ADR 0043's note of 2026-10-03). It ignores a `focusout` whose `relatedTarget` is null when a `pointerdown` inside the list or the toggle came first: the `pointerdown` host listener sets a one-shot flag that the next `focusout` consumes and that a zero-delay timer started in the handler clears, so a press on the panel's padding or text, which moves focus to `body`, leaves it open (ADR 0043 point 1; `APG/content/patterns/disclosure/examples/js/disclosureMenu.js:87-92`). Neither handler calls `preventDefault()`, and both change state only, so they are replay-safe (building-blocks 1.5). A focus-out close moves no focus, since focus has already left (ADR 0016 consequences).

**Closing on navigation** ([navigation-close](navigation-close.md); ADR 0041): `#closeOnNavigation()` reads whether the active element is inside the list, calls `hidePopover()`, and then, if focus was inside the list and is now on `body` or still inside the hidden list, focuses the toggle with `{ preventScroll: true }`. ADR 0041 point 4 has the nav add a `focus()` on the opener where the platform does not restore it; layer 4 measures what the platform does in three engines, and the call does nothing when the platform already moved focus to the toggle (ticket 50 decision 168). Above the threshold the toggle is hidden after the close, so focus stays where the platform put it.

**Escape and the close button:** the platform's. `hidePopover()` and a close request return focus to the element focused before the list opened when focus is inside the list (HTML popover hiding steps, read), which is the toggle after a keyboard open (ticket 17, measured). After a pointer open in WebKit, where a clicked button does not take focus, there is no toggle to return to; the package adds nothing there, as Yeti does not (building-blocks 1.10, Focus).

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `panel="drawer"` compiles and `panel="side"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiNav` on a `nav` element, and name it with `aria-label` or `aria-labelledby`, since a page often has more than one (manifest `requiredAttributes`; building-blocks 1.10, Names). The directive declares no name input.
2. Give the nav, as direct children and in this order, an optional `yetiNavBrand` element (usually a link home), one `button[yetiNavToggle]`, one `ul[yetiNavList]`, and an optional `yetiNavActions` element (manifest `children`; `nav.css` selects `> button[popovertarget]` and `> ul[popover]`). Each is an element, never a component host, because Yeti's child selectors match the element.
3. Declare the toggle, the list, and the close button in the same template as their `yetiNav` host (section 3). A consumer `@defer` wraps the whole nav, never a part of it (building-blocks 1.11 decision 6).
4. Write `type="button"` and a name on the toggle (`aria-label`, or visible text) and on the close button. The toggle needs a name because it is often an icon; a decorative `svg` inside it takes `aria-hidden="true"` (manifest `a11y.notes`; Yeti's example) (ticket 50 decision 173).
5. Write `role="list"` on the `ul`: Yeti's reset only removes list markers where that role says the list is decorative, and the role keeps list semantics in WebKit (`nav/docs.md`, Accessibility; architecture-guide's own example of this rule).
6. Put one link per `li`. A section with children of its own is a `li[yetiDropdown]` with the dropdown item's own toggle and panel; its trigger is a `button`, not a link (`docs.md`; `nav/example.html`).
7. With `panel="screen"`, include the close item: `<li yetiNavClose>` as the list's first child holding one `button[yetiNavCloseButton]` (manifest `[data-close]`). A screen has no outside to press and a phone has no Escape. The close item may be used with any panel.
8. Mark the current page's link with `aria-current="page"`: `routerLinkActive` with `ariaCurrentWhenActive="page"` on a `routerLink`, with `[routerLinkActiveOptions]="{ exact: true }"` on the home link, or the consumer's own binding; never a class (building-blocks 1.10, Current page; ADR 0019 point 3). `routerLinkActive` leads in the examples, and layer 3 checks that its attribute is in the server HTML; if that fails, the consumer's binding leads and `routerLinkActive` is client-only (ticket 50 decision 174).
9. A sticky bar must not hide focus ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 48; ledger [A11Y-22](../ledger.md)): with `sticky`, set `--yeti-scroll-padding` on `:root` to at least the bar's height plus its offset, so a control that focus scrolls into view stops below the stuck bar, and set `--yeti-sticky-offset` to the bar's height plus the gap on whatever holds the other things that stick, leaving the nav reading the default (`docs.md`; `Y/src/tokens/tokens.json:125-126`) (ledger A11Y-22, which the nav shares; ticket 50 decision 170).
10. Do not write `class="nav"`, `data-variant`, `data-threshold`, `data-panel`, `data-gap`, `data-sticky`, `data-brand`, `data-close`, `data-actions`, `popover`, `popovertarget`, `popovertargetaction`, or `data-ngx-yeti-item-nav` statically on any host. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the Pin goes through `$any` (`[panel]="$any('sidebar')"`, ADR 0070).
11. Do not bind the list's `[id]`, and do not give it an id starting with `ngx-yeti-`; a static `id` is fine ([generated-ids](generated-ids.md) usage rules; ticket 50 decision 5).
12. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's width. The nav already follows its own width in CSS (building-blocks 1.7).
13. Open the panel only through the toggle or `isOpen`, never through a bare `popover` the consumer controls alone, so that the panel closes on navigation (the [shell](shell.md) spec's usage rule 8).
14. Keep a nav in the persistent shell in a hydrated region, not inside `hydrate never` or a `@defer (hydrate on ...)` block that has not hydrated, because a panel with no live directive is not closed on focus-out or navigation ([navigation-close](navigation-close.md), Rendering modes).
15. In-page links (`href="#pricing"`) scroll smoothly only while a `toc` item file is loaded, because the rule is in `toc.css` (ADR 0060 point 9). Under a `<base href>` other than `/`, a bare `#id` link reloads the document unless the application provides `provideYetiFragmentLinks()` ([fragment-links](fragment-links.md)). A `routerLink` with `fragment` renders a path before the `#`, so Yeti's smooth-scrolling selector does not match it (read in `toc.css:9`).
16. Import every nav directive the template writes. A **Forgotten import** of `YetiNavToggle` or `YetiNavList` leaves a toggle with no `popovertarget` or a list with no `popover`, with no error; a forgotten `YetiNav` with parts imported fails at creation, because the parts' required `yetiNavToken` is missing (building-blocks 1.9). Template references (`#n="yetiNav"`) or a bound input make the compiler report the others (NG8002, NG8003).

### 5. Material comparison

Material has no disclosure navigation bar. The nearest pieces are `MatToolbar` for the bar and the tab nav bar (`MatTabNav` with `MatTabLink`) for links that mark the current one.

| Aspect | ngx-yeti `nav` | Angular Material |
| --- | --- | --- |
| Shape | an item directive and six part directives on the consumer's `nav`, `button`, `ul`, and `li` | `<mat-toolbar>` component (`NC/src/material/toolbar/toolbar.ts:32-33`); `[mat-tab-nav-bar]` with `[mat-tab-link]` (`tab-nav-bar/tab-nav-bar.ts:57`, `:242`) |
| Collapsing | at the nav's own threshold, in CSS, behind a popover toggle | none: the toolbar wraps or the consumer builds a sidenav; the tab nav bar scrolls with pagination buttons |
| Current link | `aria-current="page"` from `RouterLinkActive` or the consumer | `[attr.aria-current]` from the link's `active` input (`tab-nav-bar.ts:250`) |
| Roles | links in a list in a named `nav`; no composite role (ADR 0019) | the tab nav bar gives `tablist` and `tab` roles when it is linked to a `mat-tab-nav-panel` (`:230`, `:415`) |
| Keyboard | Tab through every link; Enter and Space on the toggle; Escape closes | arrow keys between tab links through a key manager |
| Open state | `isOpen` model, `opened` and `closed` | not applicable |
| `exportAs` | one per directive | `matToolbar`, `matTabNavBar, matTabNav`, `matTabLink` (`toolbar.ts:33`; `tab-nav-bar.ts:58`, `:243`) |

Nothing from Material's API is adopted: the tab nav bar's roles and arrow keys are a composite pattern that ADR 0019 rules out for site navigation, and its `active` input is what `RouterLinkActive` already gives. The `aria-current` binding is the same idea. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1: `popover`, `popovertarget`, `popovertargetaction`, `:popover-open`, light dismiss, container queries, and `@starting-style` (Part 2 row 34; building-blocks 1.2; all inside Baseline 2025, ticket 01). The reason, row 34's: "the panel, Escape, outside press, and the toggle's expanded state are the platform's (`nav/docs.md`); the package adds focus-out and navigation closing". Those two additions are custom Angular host listeners and the shared [navigation-close](navigation-close.md) function, with `hidePopover()` and `focus()` as imperative calls in handlers after hydration (building-blocks 1.5).

Not used, with the reason:

- **Angular Aria `Menu`, `MenuBar`, and `Tree`** (`NC/src/aria/menu/menu.ts:150`; `menu-bar.ts:59`; `tree/tree.ts:99`): ADR 0019 and the user's choice "Custom disclosure nav (Recommended)" (map, Standing rulings). Ticket 29 measured the menu family on Yeti's nav: Yeti's styles survived only through a 40-line bridge that kept `popover` and `popovertarget` and only after removing `role="list"`; every link and item had `tabindex="-1"` in the server HTML, so with JavaScript off, before hydration, and inside `hydrate never` no nav link could be reached by Tab (upstream-bugs A5); Enter on a link item was cancelled; the menubar did not close the nav sheet on focus-out or on navigation; axe reported two critical violations until `role="none"` went on each `li`; and links became menu items, against Yeti's docs, the APG (`APG/content/patterns/disclosure/examples/disclosure-navigation.html:35-37`), and Angular's own Aria guide (`adev/src/content/guide/aria/menu.md:53`). Tree was read, not built: its child group is an inline `ng-template`, which replaces Yeti's popover sub-panel (ticket 29's README). Ticket 32 recommends custom Angular for the nav for the same reasons.
- **CDK `FocusMonitor`** (`NC/src/cdk/a11y/focus-monitor/focus-monitor.ts:87`, `:178-181`): it reports that focus left, not where it went, so it cannot tell an inside press from a departure, and it adds document listeners (ADR 0043).
- **CDK Menu, Overlay, `BreakpointObserver`, `MediaMatcher`, `FocusKeyManager`**: the panel is the consumer's `popover`, not an overlay (building-blocks 1.8); the threshold is a container query (1.7); there is no roving focus (ADR 0019 point 1).
- **CDK `_IdGenerator`** directly: ids come from `injectYetiId` ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)).

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** Disclosure Navigation Menu (ADR 0019 consequences; `APG/content/patterns/disclosure/examples/disclosure-navigation.html`), with the landmarks pattern for the `nav`. The toggle is a disclosure button; the list is native links in a list; there is no `menu`, `menubar`, `menuitem`, or `tree` role, and no roving tab stop.
- **Roles, states, names:** the `nav` is the navigation landmark, named by the consumer (usage rule 1). The toggle is a native `button` named by the consumer; its expanded state comes from `popovertarget` (building-blocks 1.8): ticket 17 read `button "Menu" expanded=true` after opening in Chromium's tree, and ticket 29 read it through CDP with no attribute. The package binds no `aria-expanded` and no `aria-controls`, because the state is the platform's and a bound one would be **Pre-hydration state** that a pre-hydration open makes wrong (ticket 29 measured Aria's `aria-expanded="false"` on an open panel before hydration). Firefox's and WebKit's mapping was not measured; layer 4 records it. The list is `list` with `listitem`s through the consumer's `role="list"` (usage rule 5). The current link carries `aria-current="page"` (usage rule 8).
- **Keyboard** (manifest `a11y.keyboard`; ticket 17 measured all of these in three engines on Yeti's example):

| Key | Where | Result |
| --- | --- | --- |
| Tab, Shift+Tab | page | brand, toggle (below the threshold), the links of an open list or of the bar, the actions, in DOM order. WebKit's default skips links (ticket 17) |
| Enter, Space | toggle | opens or closes the list (the platform's `popovertarget`); focus stays on the toggle |
| Tab | toggle, list open | moves into the list's first link: the popover follows its invoker in the tab order |
| Enter | link | follows the link, as any link (no package handler on links; ADR 0011 clause 3) |
| Escape | inside the open list | closes it and returns focus to the toggle (platform); inside an open nested dropdown, closes the dropdown first and focuses its trigger, then a second Escape closes the list (ticket 17, measured) |
| Tab or Shift+Tab out of the list and the toggle | list open | the list closes (package focus-out, A11Y-3b) |
| Enter, Space | close button | hides the list (platform's `popovertargetaction="hide"`) |
| Arrow keys, Home, End | anywhere | nothing: the APG makes them optional and ADR 0019 left them to this spec (ticket 50 decision 169) |

- **Focus:** after Escape or the close button, the platform returns focus to the toggle when it had focus before opening; after a navigation close, the nav's close path ensures it (section 4); after a focus-out close, focus is where the user moved it.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | A named `nav` landmark, a list of links, a native button. `role="list"` keeps list semantics (usage rule 5). The directives add no role. |
| 1.3.2 Meaningful Sequence, 2.4.3 Focus Order | The panel follows the toggle in DOM order and in the tab order; drawer and screen move only where the list is drawn. Layer 1 asserts tree order equals DOM order, and layer 4 asserts Tab from the toggle reaches the first link. |
| 1.4.1 Use of Color | The current link differs by weight as well as hue (`nav.css:85-88`); usage rule 8 marks it with `aria-current`. |
| 1.4.3 Contrast (Minimum) | Each play function asserts at least 4.5:1, with the exact WCAG formula on computed colours, for a plain link and the current link against the bar's painted background, and for both inside the open panel against the panel's background, for every `variant` the story shows, in the light and dark schemes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). axe found no violation on Yeti's example (ticket 17). A pair that fails gets a ledger row and one package rule in `@layer ngx-yeti`, after the A11Y-10a pattern. |
| 1.4.11 Non-text Contrast | The toggle has no border or background at rest, so its icon identifies it; the play function asserts at least 3:1 between the icon's colour and the bar's background, as the alert spec does for its close glyph. The panel's shadow is decoration. The focus ring is Yeti's (ticket 17: a 2 px ring at every stop). |
| 1.4.10 Reflow | Below the threshold the links go behind the toggle; a long brand wraps (`nav.css:25-27`); an open sheet scrolls inside the viewport (`overflow: auto`, `max-block-size`). Layer 4 asserts no horizontal overflow at 320 px, after Yeti's own test. |
| 1.4.12 Text Spacing | The bar and the panel set no fixed height; links take a minimum, not a fixed, block size (read). |
| 1.4.13 Content on Hover or Focus | Not touched by the nav: the panel opens on activation. A nested dropdown with `trigger="hover"` is the `dropdown` spec's. |
| 2.1.1 Keyboard, 2.1.2 No Keyboard Trap | Native button, links, and popover; Escape and Tab always leave the panel. |
| 2.4.1 Bypass Blocks | The nav is a landmark; a skip link past it is the consumer's ([shell](shell.md) usage rule 5). |
| 2.4.7 Focus Visible | Yeti's focus ring on the toggle, the links, and the close button; the Story gate and layer 4 check it. |
| 2.4.11 Focus Not Obscured (Minimum) | An open drawer or screen covers most of the page; the focus-out close keeps Tab from landing on a covered control (A11Y-3b). Without anchor positioning the sheet starts at the top of the viewport and covers the bar (`nav.css:117-119`); Shift+Tab from the first link to the toggle keeps the panel open, which 2.4.11's note on content opened by the user allows, because Escape reveals the toggle without moving focus. A sticky bar: usage rule 9 and A11Y-22. |
| 2.5.8 Target Size (Minimum) | The toggle, the close button, and each link are at least `--yeti-control-size` high (`nav.css:44-45`, `:74`); axe's `target-size` passed on Yeti's nav in Chromium (ticket 17). The play function asserts at least 24 by 24 CSS pixels for the toggle and the close button. |
| 4.1.2 Name, Role, Value | The toggle's and close button's names are the consumer's (usage rule 4); the play function asserts a non-empty computed name; the expanded state is the platform's (above). |

**Ledger rows owned:** A11Y-3b ([ledger.md](../ledger.md); Part 2 row 34), confirmed as written: "The list panel stays open when focus leaves it", closed by the `focusout` host listener of section 4, tested by L1 and L4. Its "Verified" cell reads *measured*: ticket 29 measured Yeti's own nav sheet staying open on focus-out in three engines, and the package-shaped variant closing it, tested by L1, L2, and L4 (ticket 50 decision 171). Shared: A11Y-22 for the sticky bar (ticket 50 decision 170). Used, owned elsewhere: A11Y-15 ([navigation-close](navigation-close.md)). Forced colours: the current link keeps its weight, the link text and icon are system colours, and the focus ring remains; the panel's shadow is removed, so its edge may merge with the page. No package rule and no row now, after [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88: layer 4 asserts the current link's weight difference under `forcedColors: 'active'` and records the open panel's edge (ticket 50 decision 175).

### 8. Rendered HTML

Consumer markup, after Yeti's example, with a nested dropdown:

```html
<nav yetiNav aria-label="Site" i18n-aria-label>
  <a yetiNavBrand routerLink="/">Yeti</a>
  <button type="button" yetiNavToggle aria-label="Menu" i18n-aria-label>
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
  </button>
  <ul yetiNavList role="list">
    <li><a routerLink="/docs" routerLinkActive ariaCurrentWhenActive="page" i18n>Docs</a></li>
    <li><a routerLink="/blog" routerLinkActive ariaCurrentWhenActive="page" i18n>Blog</a></li>
    <li yetiDropdown>
      <button type="button" yetiDropdownToggle i18n>More</button>
      <div yetiDropdownPanel>
        <a routerLink="/guides" i18n>Guides</a>
        <a routerLink="/components" i18n>Components</a>
      </div>
    </li>
  </ul>
  <div yetiNavActions><a yetiButton size="sm" routerLink="/start" i18n>Get started</a></div>
</nav>
```

Server HTML, on `/docs`, and the hydrated DOM are the same:

- the `nav` carries `yetinav=""`, `aria-label="Site"`, `class="nav"`, `data-ngx-yeti-item-nav=""`, no `data-variant`, `data-threshold`, `data-panel`, `data-gap`, or `data-sticky`, and a `jsaction` for `focusout` and `pointerdown`;
- the brand carries `data-brand=""` beside the link's own `href="/"`;
- the toggle carries `type="button"`, `yetinavtoggle=""`, `aria-label="Menu"`, and `popovertarget="ngx-yeti-nav-0"`, and no `aria-expanded`;
- the list carries `role="list"`, `yetinavlist=""`, `popover=""`, `id="ngx-yeti-nav-0"`, and a `jsaction` for `toggle`;
- the Docs link carries `href="/docs"` and `aria-current="page"` from `RouterLinkActive` (inferred: the server's initial navigation has ended before the render; layer 3 checks it, as [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87 has for breadcrumbs);
- the nested `li` and its parts carry what the `dropdown` spec renders (`class="dropdown"`, its toggle's `popovertarget`, its panel's `popover` and id);
- the actions carry `data-actions=""`.

The server also writes the item links into `<head>` in Yeti's order: `button` (`Y/src/yeti.css:40`), then `nav` (`:48`), then `dropdown` (`:57`), each `rel="stylesheet"`, `href` `<url>components/<name>/<name>.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="<name>"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts them at bootstrap.

Open, after a click on the toggle below the threshold: the list matches `:popover-open` and sits in the top layer; no attribute changes on any element, and `isOpen` is `true` once the `toggle` event has run. With a close item, `<li yetiNavClose>` renders `data-close=""` and its button `popovertarget="ngx-yeti-nav-0"` and `popovertargetaction="hide"`.

The delta from Yeti's docs markup: the consumer writes directive attributes where the docs write `class="nav"`, the markers, `popover`, `popovertarget`, `popovertargetaction`, and the list's `id`; the id is generated; `href="#"` placeholders become routes.

### 9. Animation

- **Yeti's transition on native state:** the open list fades in (the drawer slides in) from `@starting-style` over `--yeti-duration-fast` with `--yeti-ease`; leaving is instant (`nav.css:108`, `:221-227`). The directive adds no class and no inline style (ADR 0010 point 1; building-blocks 1.6 rule 1).
- **Completion:** section 4. `opened` follows the fade; `closed` follows at once.
- **Reduced motion:** Yeti's tokens collapse `--yeti-duration-fast`, so the panel appears at once and `opened` completes at once (building-blocks 1.6 point 4); in-page scrolling falls back to the browser's jump (`tokens/components.css:178-182`).
- **No `animate.enter` or `animate.leave`:** the nav and its list persist; a server-rendered nav never takes `animate.enter` (ADR 0011 clause 12). A nav the consumer inserts or removes with `@if` may take a class-form `animate.leave` of the consumer's; the item link stays until Angular removes the last host (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** section 8. Everything at first paint is a host binding or the consumer's markup (ADR 0011 clause 1). The list is closed on the server, because a popover has no open attribute. Nothing is **Pre-hydration state** among the bound attributes: no person and no Yeti mechanism can change a `data-*` attribute, a marker, `popover`, or `popovertarget` (ticket 26 rows 122 to 129). The open state is pre-hydration state and is never bound (section 4).
- **Before hydration:** the toggle opens and closes the list, Escape and light dismiss close it, the close button hides it, and links navigate by document load, all natively (building-blocks 1.11; ticket 29 measured variant A working in all six rendering cases). No directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4).
- **Full hydration:** every host is claimed as it is; the list adopts its server id (ADR 0044); bindings give the same values (usage rule 12); 0 style mutations (ADR 0060 point 5, measured for the mechanism). When the list part is created at hydration it reads the live open state (section 4), so a list the user opened before hydration stays open and `isOpen` becomes `true`. The navigation-close function ignores the application's start-up navigation, so it does not close that list ([navigation-close](navigation-close.md), API point 4).
- **Event replay:** the list's `toggle`, and the nav's `focusout` and `pointerdown`, are on Angular's replay lists (`NGP/core/primitives/event-dispatch/src/event_type.ts`: `focusout` and `pointerdown` in `BUBBLE_EVENT_TYPES`, `:299` and `:335`; `toggle` in `CAPTURE_EVENT_TYPES`, `:358-363`; read). A replayed `toggle` reaches the handler, which reads the live state, so it changes nothing that the creation-time read did not already set, and emits `opened` or `closed` only for a change it observes: late, but once ([events](events.md), Rendering modes). A replayed `focusout` whose `relatedTarget` left the list and toggle closes a list the user opened before hydration, as the live handler would have. `pointerdown` is replayed too (`event_type.ts:335`, read; the [dialog](dialog.md) spec's finding, which corrects ADR 0043's note of 2026-10-03), so a press on the panel's padding before hydration is replayed before its `focusout`, and the one-shot guard keeps the list open, as it does live (inferred, not measured; layer 4 measures it; ADR 0043's correcting note; ticket 50 decision 92). `transitionend` is not replayed; a completion wait started by a replayed `toggle` ends by its timer.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the nav and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4). Before its trigger the nav works natively; after it, as under full hydration. `hydrate on interaction` hydrates on the first click and replays it; a toggle click before that has already opened the list natively, and the replayed `toggle` is read as above.
- **`hydrate never`:** the nav is its server HTML and stays styled while its host is connected (ADR 0045; ADR 0060 point 4). It keeps everything the platform does: the toggle, Escape, light dismiss, the close button, the threshold. It loses the focus-out close, closing on navigation, the model, and the outputs. A `routerLink` inside it behaves as the [breadcrumbs](breadcrumbs.md) spec's usage rule 10 and layer-4 record say for a dehydrated `routerLink` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 90). This is the stated residue, and usage rule 14 keeps shell navs out of it.
- **Client-only `@defer`:** the item file is fetched when `YetiNav` is constructed, which can show unstyled frames (the list hidden by the user agent, the toggle a plain button); the consumer closes the gap with `provideYetiStyles({ preload: ['nav'] })` (ADR 0060 point 6; [setup](setup.md)). Ids continue from the server's counts (ADR 0044).
- **`withI18nSupport()`:** the labels and link texts are usually translated with `i18n` and `i18n-aria-label` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directives add no `i18n` block and no string (building-blocks 1.10, Strings).
- **Zoneless:** inputs are `input()` signals read by host bindings; `isOpen` is a model written from the `toggle` handler; the outputs are `output()`s; the toggle's `popovertarget` is a `computed`. Every view refreshes with no zone (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the bar is readable and styled, links are in the bar above the threshold and behind a working toggle below it, Escape and outside presses close the panel, the close button works, and links load documents. Lost: closing on focus-out and on navigation (a document load closes the panel anyway), `isOpen`, and the outputs. A client-only application gets no such promise.
- **Hydration boundary:** the nav root and all its parts belong in one boundary (usage rule 3), because the parts register with the root. Ids no longer need it (ADR 0044), but the focus-out listener and the registration do.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, presence attribute, markers, `popover`, and `popovertargetaction` are static; the `data-*` attributes come from inputs that usage rule 12 keeps equal; the id is adopted at hydration and the two `popovertarget` bindings derive from it (ADR 0044, measured in ticket 35).
- **No direct DOM manipulation:** before hydration, nothing but the creation-time read of `:popover-open`, which writes nothing (ticket 50 decision 91). After it, `showPopover()`, `hidePopover()`, and `focus()` in handlers and in an `afterRenderEffect` write phase (building-blocks 1.5); none changes an attribute the server rendered. The item link is the ADR 0060 service's.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written: a `ul` holds only `li` children, and a `nav` may hold the button and the list (usage rule 2).
- **`preserveWhitespaces`:** the directives have no template. White-space text in the flex bar is not a flex item, and Yeti's selectors match elements only.
- **No output branched on the platform:** none. The open-state read runs once at creation, on the server's DOM too, where it reports closed, with no platform branch ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 91; item 1 above).
- **State set before hydration is not undone:** the open state is never bound and is read once when the list part is created, the initial bound `isOpen` does not win, and the start-up navigation is ignored (section 4; [navigation-close](navigation-close.md)).
- **Static attributes the directives bind:** usage rule 10 keeps the consumer from writing them. The consumer's `aria-label`, `role`, `type`, and a static `id` on the list are not bound by any directive (the list's `[attr.id]` binding writes the same value as the consumer's static `id`), so hydration writes back what the server rendered.

### 12. Single-page application

- **Closing on navigation:** while the list is open, `YetiNav` closes it on the first `NavigationStart` after the application's initial navigation, with focus back on the toggle (section 4; [navigation-close](navigation-close.md); ADR 0041; ledger A11Y-15). A nested dropdown closes through its own subscription; closing the list also hides the nested popover through the platform's popover stack. Back and Forward through the Router count as navigation.
- **Fragment links:** the nav's links are the consumer's, and the package puts no listener on them (ADR 0011 clause 3). A `routerLink` with `fragment` goes through the Router; a bare `href="#id"` needs `provideYetiFragmentLinks()` under a non-root `<base href>` (usage rule 15; [fragment-links](fragment-links.md)). A fragment target under a sticky bar is the consumer's to offset (usage rule 9; fragment-links usage rule 4).
- **Route changes:** a nav in the persistent shell outside the `router-outlet` persists; `RouterLinkActive` moves `aria-current` on `NavigationEnd`. A nav inside a routed view leaves with the route, and its item link is removed in the animation frame after no `[data-ngx-yeti-item-nav]` host is connected (ADR 0060 point 4; ADR 0045). No listener outlives a directive: the host listeners are Angular's, the navigation subscription ends on destroy, and the fallback and guard timers are cleared on destroy (building-blocks 1.15).

### 13. Item file

`yeti-css/css/components/nav/nav.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `nav[yetiNav]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:48`, after `seam` and before `breadcrumbs`), and removed after the last host carrying `data-ngx-yeti-item-nav` has left the DOM. The parts acquire nothing (ticket 50 decision 6). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]`, `[data-gap]`, `[data-threshold]`, and `[data-sticky]` rules and the tokens), and optionally `provideYetiStyles({ preload: ['nav'] })`.

Cross-item files (ADR 0060 point 9): `nav.css` holds its own rules for a nested `.dropdown` (`:71`, `:188-219`), so they arrive with the nav; the dropdown's own `dropdown.css` is acquired by `yetiDropdown`, and a `yetiButton` in the actions acquires `button.css`. The nav acquires neither. The smooth scrolling for in-page links is in `toc.css` and is documented, not loaded by the nav (ADR 0060 point 9; usage rule 15).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, markers, ids, and relationship attributes in the DOM, the item link, whether the list matches `:popover-open`, where focus is, what the accessibility tree says, and that each output fired once. It never asserts a private field, the registration signals, or how the styles service counts. No test depends on a public token's default value or a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): every story sets `threshold` explicitly and sizes the nav's container against a probe styled `inline-size: var(--yeti-width-<w>)`, plus or minus `2rem`; durations are compared with a probe or the token's computed value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `nav` item file through the directive, as a consumer would (ADR 0014 point 1), under `provideRouter` with `provideLocationMocks()` so the iframe's URL does not change. Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), closed and open. Story ids:

- `nav--default`: section 8's markup in a resizable container with `threshold="sm"`. Wider than the probe: the list sits in the bar, the toggle has `display: none`, and the brand, links, and actions share one line. Narrower: the toggle shows and the list is hidden. Asserts the class, the presence attribute, `data-threshold="sm"`, `role="list"`, the toggle's `popovertarget` equal to the list's `id`, the id's `ngx-yeti-nav-` shape, no `aria-expanded` on the toggle, and the contrast pairs of section 7 in the bar.
- `nav--sheet`, `nav--drawer`, `nav--screen`: each panel below the threshold. Click the toggle: the list is `:popover-open`, `isOpen` is `true` (through the `exportAs` reference rendered in the story), and `opened` fired once, after the fade. Geometry after Yeti's `nav.spec.js`: the sheet spans the viewport's width and sits at the bar's bottom where anchor positioning exists, else at 0; the drawer is a column from the start edge and a backdrop click closes it; the screen covers the viewport and its close item hides it. Contrast pairs inside the panel. `closed` fired once on each close.
- `nav--keyboard`: focus the toggle, Enter opens, Tab reaches the first link (WebKit uses `element.focus()`, as ticket 17 did), Escape closes and focus is on the toggle, Space opens again.
- `nav--focus-out` (A11Y-3b): open with the keyboard; Tab past the last link to the actions: the list closes and `closed` fires; reopen and Shift+Tab from the first link to the toggle: the list stays open; a pointer press on the panel's padding: the list stays open and focus is on `body`; Tab from the panel to a control after the nav: closed.
- `nav--close-item`: a sheet with `yetiNavClose`; the close item is hidden in the bar and shown in the panel, its button has `popovertargetaction="hide"` and the list's id, and pressing it closes the list.
- `nav--model`: `[(isOpen)]` bound to a story signal and buttons outside the nav that set the signal. Writing the signal opens and closes the list with no `isOpenChange`; the toggle updates the signal; `opened` and `closed` fire for every change. Opening above the threshold shows a panel that stays until dismissed (`nav.css:229-238`).
- `nav--inputs`: controls bind `variant`, `threshold`, `panel`, `gap`, and `sticky`. Each value sets its `data-*` attribute; unset removes it; `sticky` renders `data-sticky=""`.
- `nav--current`: `RouterLinkActive` marks the active link with `aria-current="page"`; the current link's weight is above the plain link's and its colour differs (Yeti's test), and both pass 4.5:1.
- `nav--dropdown`: a nested `li[yetiDropdown]`; open the list, open the nested panel, first Escape closes only the nested panel and focuses its trigger, second Escape closes the list and focuses the toggle; Tab out of the nested panel to a control after the nav closes both.
- `nav--two-navs`: two navs on one page get different list ids, and each toggle opens only its own list.
- `nav--rtl`: `nav--drawer` inside `dir="rtl"`: the drawer comes from the right edge, and Tab order equals DOM order.

The play functions assert the toggle's and the close button's computed names, their boxes of at least 24 by 24 CSS pixels, and the toggle icon's 3:1 against the bar.

### Layer 2: browser-level (`npx nx test <lib>`, `nav.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiNav, { tagName: 'nav' })`: class `nav`, the presence attribute, no `data-*` attributes by default; `bindings` for each input set and remove its attribute after `whenStable()`; one `<link data-ngx-yeti-styles="nav">` while the fixture lives, gone an animation frame after `fixture.destroy()`.
- `createDirective(YetiNavBrand, { tagName: 'a' })`, `YetiNavActions` on a `div`, `YetiNavClose` on an `li`: the marker and no other package attribute; created alone, each injects no parent and throws nothing.
- `createDirective(YetiNavToggle, { tagName: 'button' })` and `YetiNavList` alone: creation throws Angular's missing-provider error for `yetiNavToken` (the required injection).

A small test host covers what `createDirective` cannot:

- the list renders `ngx-yeti-nav-<n>`, a static `id` wins, and the toggle's and close button's `popovertarget` follow it;
- `isOpen`: `showPopover()` on the list sets it after the `toggle` event; a host that is already `:popover-open` when the list part is created reads as `true` with one `isOpenChange` and no `opened`; an initial bound `true` on a closed list opens nothing; a later parent write opens the list with no `isOpenChange`;
- completion: `opened` waits for the list's `transitionend` with an empty `pseudoElement`, or the fallback timer when the duration is zero or no event comes; an opposite change completes a running wait at once;
- focus-out: a `focusout` with `relatedTarget` on the actions closes an open list; on the toggle or a link in the list keeps it; a `focusout` with `relatedTarget` null after a `pointerdown` inside the list keeps it, and the flag is consumed so a second null `focusout` closes; nothing happens while the list is closed;
- replay safety: dispatch `focusout` and `pointerdown` events whose `preventDefault` throws, and assert the state changed (building-blocks 1.12);
- navigation: under `provideRouter` with `provideLocationMocks()`, an open list closes on a navigation after the initial one, and focus moves to the toggle when it was on a link in the list; with no `Router`, nothing happens;
- the directive has no `open()` or `close()` method (ticket 50 decision 91); destroy closes nothing, clears the timers, and leaves no listener;
- `<nav yetiNav yetiShellRegion sticky>` renders one `data-sticky=""`.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `nav.ssr.spec.ts`)

Through the shared `renderServer()` helper with `provideRouter`, `withI18nSupport()`, and section 8's markup with `i18n` texts, rendered at `/docs`: `whenStable()` resolves; the server HTML has section 8's attributes, the list id `ngx-yeti-nav-0` and both `popovertarget`s equal to it, `popover` on the list, no `aria-expanded`, `aria-current="page"` on the Docs link from `RouterLinkActive` (decision 87's check; if it fails, usage rule 8 leads with the consumer's binding and `RouterLinkActive` becomes client-only), `jsaction` on the nav and the list, and one item link for `nav` with `data-beasties-skip` and an `href` ending `components/nav/nav.css?v=<pin>`; the transfer-state key `ngx-yeti-ids` holds the `ngx-yeti-nav-` count; no `document` or `location` access throws; the list part's creation-time read of `:popover-open` runs on the server's DOM without an error and reports closed (ticket 50 decision 91).

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item: class `nav` has `YetiNav`; `data-variant`, `data-threshold`, `data-panel`, and `data-gap` have inputs whose unions equal the manifest's vocabularies `variant`, `width`, `panel`, and `gap`; `data-sticky` has the boolean `sticky`; the markers `data-brand`, `data-close`, and `data-actions` have `YetiNavBrand`, `YetiNavClose`, and `YetiNavActions`; the manifest's events for `nav` are empty, and `opened` and `closed` are listed as outputs that map no Yeti event ([events](events.md)).

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `nav.spec.js`: resize the container, not the viewport, across the threshold (building-blocks 1.7); a panel opened and then widened past the threshold stays a panel until Escape; real key presses for `nav--keyboard`, `nav--focus-out`, and `nav--dropdown`, with WebKit's link focus through `element.focus()`; the inside-press case in three engines, because WebKit does not focus a clicked button (ADR 0043 consequences); no horizontal overflow at a 320 px viewport, with a long brand wrapping; `emulateMedia({ reducedMotion: 'reduce' })`: the panel is opaque in the first frame after opening and `opened` completes at once; `emulateMedia({ forcedColors: 'active' })`: the current link's weight still differs, and the open panel's edge is recorded with a screenshot ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88). The toggle's expanded state is read from Chromium's tree through CDP and recorded for Firefox and WebKit. With `sticky` and usage rule 9 followed, at 320 x 640, Shift+Tab through a long page leaves each focused link at least partly visible below the stuck bar; the same walk with Yeti's default scroll padding is recorded, not asserted (A11Y-22; decision 48).

Fixture-app half, built with `outputMode: 'server'`, with a `/nav` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route holds the nav in a shell outside the `router-outlet`:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; the list's id and both `popovertarget`s are unchanged by hydration;
- **navigation** (ADR 0041; A11Y-15): open the list with the keyboard and with the pointer, follow a `routerLink` in it: the list is closed and focus is on the toggle; the same from a link in the nested dropdown; with the list open, Back closes it. The measurement that ADR 0041 point 4 asks for is recorded first with the package's `focus()` disabled in a test build: where the platform already returns focus to the toggle in an engine, the record says so;
- **pre-hydration open** (the open-state ruling; [navigation-close](navigation-close.md)): hold back the main bundle, open the list with the toggle, release it, wait for stability: the list is still open, `isOpen` reads `true`, the start-up navigation did not close it; then follow a link: it closes. Repeat with `[(isOpen)]` bound to `false` in the fixture;
- **pre-hydration press** (ADR 0043 note; the replayed `pointerdown`): hold back the bundle, open the list, press on the panel's padding, release the bundle: the list is still open after replay. A second run presses on the padding and then Tabs out of the nav: the list is closed after replay. Both are recorded in three engines (ticket 50 decision 92);
- **pre-hydration focus-out:** hold back the bundle, open the list with the keyboard, Tab to a control after the nav, release: the list is closed after replay (ADR 0043 note);
- **JavaScript disabled:** above the threshold the links are in the bar; below it the toggle opens the list, Escape and an outside press close it, the close button hides it, and a link loads the next page with the panel closed; `@axe-core/playwright` with the six tags reports no violation, closed and open;
- `hydrate never`: the platform behaviours above work and Tab past the list leaves it open (the stated residue); a `routerLink` click is recorded as the breadcrumbs spec's decision 90 case;
- a nav inside a client-only `@defer` block with `nav` in the preload list shows no unstyled frame; navigating to a route without a nav removes the item link, and back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and `Y/test/browser/components/nav.spec.js` with its fixture `nav.html` for the geometry, threshold, panel, close-item, nested-dropdown, smooth-scrolling, and axe cases; ticket 17's keyboard scripts for Escape and focus return; ticket 29's variant A for the focus-out, navigation, and rendering-mode cases (measured on a sketch of this row); ticket 20's fixture for navigation under `<base href>`; ticket 35's fixture for ids across hydration; the [dialog](dialog.md) spec's open-state and completion cases.

## Out of Scope

- Angular Aria `Menu`, `MenuBar`, or `Tree`, any `menu`, `menubar`, `menuitem`, or `tree` role, and a roving tab stop (ADR 0019; the user's choice of 2026-10-03).
- Arrow-key movement between links or toggles in the first milestone (ticket 50 decision 169).
- An application menu, a command menu, or menu modes; a spec that wants one is a new item (ADR 0019 consequences). A side column of links is a `stack` inside a `sidebar` (`docs.md`).
- The nested dropdown's behaviour: hover opening, its focus-out, and its keys are the `dropdown` spec's.
- A viewport breakpoint input or a script that decides when the bar collapses (building-blocks 1.7).
- An input per token, a name input, an `aria-expanded` binding, or a class for the current link (ADR 0004; building-blocks 1.8 and 1.10).
- CDK `FocusMonitor`, `FocusTrap`, or Overlay (ADR 0043; building-blocks 1.8).
- Loading `toc.css` for smooth in-page scrolling (ADR 0060 point 9).
- Any check that the toggle and list are direct children, that `role="list"` and the names are present, or that a `screen` panel has a close item. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the nav, unless a contrast pair or the forced-colours record fails (section 7).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Disclosure navigation on Yeti's markup; no Aria Menu or Tree | ADR 0019; map, Standing rulings ("Custom disclosure nav (Recommended)"); building-blocks "Aria decisions (2026-10-03)"; tickets 29 and 32 |
| Item directive `nav[yetiNav]` with `variant`, `threshold`, `panel`, `gap`, `sticky`; parts for the toggle, list, close item and button, brand, and actions | Part 2 row 34; ticket 26 rows 122 to 129; building-blocks 1.3 |
| The platform opens, closes, dismisses, and reports expanded state; the directives render `popover` and `popovertarget` | ADR 0003 point 5; ADR 0016 point 1; building-blocks 1.8 |
| The list part renders the id through `injectYetiId('nav')`; the toggle and close button bind it | ADR 0044; [generated-ids](generated-ids.md); ticket 50 decision 5 |
| `isOpen` model never bound to the element; read once at creation; parent writes are commands; no methods | map, Standing rulings, Open state; the [dialog](dialog.md) spec; ticket 50 decision 91 |
| `opened` and `closed` are void Completion outputs that follow every change | [events](events.md); ticket 50 decision 3 |
| Focus-out close as a `focusout` host listener with a one-shot `pointerdown` guard, against the list and the toggle | ADR 0016 point 2; ADR 0043 point 1; A11Y-3b; ticket 50 decisions 92 and 167 |
| Closing on navigation through `injectCloseOnNavigation`, with a conditional `focus()` on the toggle | ADR 0041 points 1 and 4; [navigation-close](navigation-close.md) |
| `aria-current` from `RouterLinkActive` or the consumer; `role="list"` and names are the consumer's | building-blocks 1.10; ticket 26; architecture-guide's usage-rule example |
| Only `YetiNav` marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| Item file as a counted link, acquired last in the constructor | ADR 0060; [setup](setup.md); ticket 50 decisions 42 and 45 |
| A sticky bar follows the shared sticky rule | ticket 50 decisions 48 and 170; A11Y-22 |
| Directive tests through `TestBed.createDirective`; fixture app with prerendered and server routes | map, Standing rulings; ADR 0014 note; ticket 50 decision 2 |

### Usage examples

A shell's site bar with a drawer below `sm`, a close item, and a sticky bar:

```html
<nav yetiNav yetiShellRegion sticky aria-label="Site" i18n-aria-label threshold="sm" panel="drawer" #site="yetiNav">
  <a yetiNavBrand routerLink="/">Trailhead</a>
  <button type="button" yetiNavToggle aria-label="Menu" i18n-aria-label>
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
  </button>
  <ul yetiNavList role="list">
    <li yetiNavClose><button type="button" yetiNavCloseButton aria-label="Close" i18n-aria-label>×</button></li>
    @for (link of links(); track link.path) {
      <li><a [routerLink]="link.path" routerLinkActive ariaCurrentWhenActive="page">{{ link.label }}</a></li>
    }
  </ul>
</nav>
```

```ts
import { YetiNav, YetiNavClose, YetiNavCloseButton, YetiNavBrand, YetiNavList, YetiNavToggle } from 'ngx-yeti/nav';
import { YetiShellRegion } from 'ngx-yeti/shell';

@Component({
  selector: 'app-site-nav',
  imports: [YetiNav, YetiNavBrand, YetiNavToggle, YetiNavList, YetiNavClose, YetiNavCloseButton, YetiShellRegion, RouterLink, RouterLinkActive],
  templateUrl: './site-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNav {
  readonly links = input.required<readonly { path: string; label: string }[]>();
}
```

`@for` adds no element, so each `li` is a direct child of the list. The consumer's stylesheet, for a 4rem bar (usage rule 9):

```css
:root {
  --yeti-scroll-padding: 5rem;
}
```

Reacting to the panel: `<nav yetiNav ... (opened)="track('menu')" (closed)="restoreFocusHint()">`. Driving it from state: `<nav yetiNav [(isOpen)]="menuOpen">`, and `<button yetiButton type="button" (click)="menuOpen.set(false)">` elsewhere on the page. A painted bar: `<nav yetiNav yetiPaint="primary" variant="white">` with `--yeti-nav-link` set in the consumer's stylesheet to the colour that reads on it (`docs.md`).

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/nav/nav.css`, loaded by `YetiNav` as a counted link (section 13).
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-variant`, `data-gap`, and `data-threshold` and holds the `[data-sticky]` rule in `yeti.utilities` (`:333-342`); `tokens/components.css` declares the `--yeti-nav-*` tokens (`:31-41`) and `--yeti-toc-scroll`; `tokens/space.css` declares `--yeti-sticky-offset` and `--yeti-scroll-padding`; `base/typography.css:8` reads the scroll padding; the base focus ring.
3. **Cross-item rules:** `nav.css` styles a nested `.dropdown` itself; `dropdown.css` and `button.css` come with their own directives; smooth in-page scrolling needs `toc.css` (section 13).
4. **Tokens:** reads the manifest's tokens (section 1); writes none. A consumer sets them on `:root`, in a theme after Yeti, or on the nav itself for the derived ones (`--yeti-nav-*`), per `Y/src/guides/theming.md:38`; `--yeti-nav-link` is the one to set on a painted bar (`docs.md`). `--yeti-width-*` is also every other item's threshold (`columns`, `card`, `pagination`).
5. **What breaks without the item file:** the user agent's `[popover]:not(:popover-open) { display: none }` hides the list at every width, so the links never appear in the bar; the toggle is a plain button that opens a list centred by the user agent with a border; the brand and actions lose their bar layout. No error.
6. **Tailwind name collision:** none. Ticket 24 found only `container`, `grid`, `table`, and the attribute `hidden` produce utilities (measured); `nav` is not a utility name, and Tailwind's `sticky` class is not Yeti's attribute (inferred, as in the sidebar spec).

### Platform features to adopt when the browser target moves

- **Anchor positioning with `anchor-scope`:** Yeti guards it (`nav.css:135-144`, `:201-219`); where it is missing the sheet covers the bar and a nested block docks to the viewport's foot. The package relies on the fallback and adds no guard (building-blocks 1.2).
- **`interestfor`:** the end of the nested dropdown's hover opening (`hover.js:11-13`), the `dropdown` spec's.
- **CSS scroll-state container queries:** a candidate for a sticky bar that reacts to being stuck (the sidebar spec's note; inferred, not checked against web-features data).
- `popover="hint"` and invoker commands for popovers (`command="toggle-popover"`) are not needed: `popovertarget` already covers the toggle and the close button.

### Single-page-application pieces relied on

[navigation-close](navigation-close.md) (`injectCloseOnNavigation`), [generated-ids](generated-ids.md) (`injectYetiId`), [events](events.md) (naming and timing of `opened` and `closed`), [setup](setup.md) (`injectYetiItemStyles`, `provideYetiStyles`), and, for the consumer's own in-page links, [fragment-links](fragment-links.md) (`provideYetiFragmentLinks()`).
