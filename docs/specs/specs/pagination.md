# Spec: pagination (component)

Ticket: [85. Spec: pagination (component)](../issues/85-spec-pagination.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 35 and Part 1 (1.1, 1.2, 1.3, 1.4, 1.7, 1.10 "Names", "Current page", "Disabled", and "Target size and non-text contrast", 1.11, 1.12, 1.13, 1.14), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 130 to 133 and grilling questions 15 and 16, [Decide: the spec list](../issues/11-decide-spec-list.md) row 35, [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md) (old ADR 0042's row: the `RouterLinkActive` guidance is documented usage, not a record), [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 8, 9, 10, 18, 42, and 68), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md) point 3, [ADR 0022](../adr/0022-button-declares-no-listeners.md) (read for the disabled link; it binds the `button` item only), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); the map's Standing rulings (Package CSS for accessibility, Forced-colours gap, JavaScript off, Hydration constraints, Zoneless, Directive testing); architecture-guide P9, P11, P15, P23, and P28. The item owns [ledger.md](../ledger.md) row A11Y-1f (Part 2 row 35). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.x); `NC/` is `github.com/angular/components/` at `708d4c6e2`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 93, 94, and 176 to 178), and each is cited where it applies.

## Problem Statement

Yeti's `pagination` is "links to the pages of a long list, each a square target, the current one filled, shrinking to Previous, the current page, and Next when it is narrow" (`Y/src/components/pagination/manifest.json`). It is one **Identity class**, `pagination`, on a `nav` that holds exactly one `ol` of at least two `li`, each holding a page link or a `span` with an ellipsis for skipped pages. Four **Attributes** configure it: `data-variant` (the hue of the current page and of the hover tint), `data-size` (the text step), `data-threshold` (the pagination's own width below which only Previous, the current page, and Next remain), and `data-justify` (where the links sit in the row). It has no **Marker**, no **Module**, and no **Event** (`js: null`). Everything it does is CSS: a wrapping flex row of square targets at least `--yeti-control-size` on each side, a hover tint, the current page filled with the variant's colour and keyed on `aria-current`, a muted ellipsis, and a compact form chosen by a container query on the `nav`'s own width and keyed on `rel~="prev"`, `rel~="next"`, and `aria-current` (`Y/src/components/pagination/pagination.css:4-64`).

An application developer using the package cannot write `class="pagination"` or any of the four attributes: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-threshold="medium"` compiles and silently leaves the row uncompacted; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `pagination` **Item file** loaded while a pagination is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the row is a plain vertical list of underlined links with no targets, no filled current page, and no compact form, with no error.

The accessibility of the row rests on things the markup carries, all of them the consumer's: the `nav` landmark's name (the manifest's one required attribute), `aria-current="page"` on the **Current link**, which is also the only hook Yeti's CSS has for the fill, `rel="prev"` and `rel="next"` on Previous and Next, which the compact form keeps, and `role="list"` on the `ol`. In an Angular application the current page changes with the route or the list's state, so the developer needs to know how to keep exactly one `aria-current="page"` in each pagination, on the server and after every page change. Three gaps remain that Yeti's markup does not close. Yeti draws the current page with a background colour alone and ships no `forced-colors` rule, so under forced colours the current page looks like every other link (ledger A11Y-1f, measured in Chromium). Yeti's pagination has no disabled look and its docs do not say what Previous is on the first page. And the package must say what a developer does at the two ends of the list.

## Solution

One directive in the secondary entry point `ngx-yeti/pagination` ([building-blocks.md](../building-blocks.md) Part 2 row 35; 1.3):

- **`YetiPagination`**, the **Item directive**, on `nav[yetiPagination]`, `exportAs: 'yetiPagination'`. It binds `pagination` as a static host class, binds `data-variant`, `data-size`, `data-threshold`, and `data-justify` from the typed inputs `variant` (`YetiVariant`), `size` (`YetiSizeControl`), `threshold` (`YetiWidth`), and `justify` (`YetiJustify`), sets the static presence attribute `data-ngx-yeti-item-pagination` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `pagination` item file with `injectYetiItemStyles('pagination')` as the last statement of its constructor, on the server too, releasing it when it is destroyed (ADR 0060 point 2; [setup](setup.md)).

The developer writes `<nav yetiPagination justify="center" threshold="md" aria-label="Pagination">` where Yeti's docs write `<nav class="pagination" aria-label="Pagination" data-justify="center" data-threshold="md">`. An unset input renders no attribute, so Yeti's own defaults (`primary`, `md`, `sm`, `start`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). The `ol` with `role="list"`, the `li` items, the links with their `rel`, the ellipsis `span`, the `nav`'s name, and `aria-current="page"` stay the consumer's markup (Part 2 row 35; building-blocks 1.1 and 1.10). The `ol` and its items get no directive: Yeti styles them by element and position only (building-blocks 1.1).

`aria-current="page"` has one writer per link, chosen by the consumer (building-blocks 1.10 "Current page"; architecture-guide P11): either the consumer binds it from the list's own page state, or `RouterLinkActive` writes it with `ariaCurrentWhenActive="page"` and exact matching. The package never writes it and declares no input for it.

The package adds one rule to its accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)`, that draws the current page with a border in a system colour, closing A11Y-1f (map, Standing rulings, Package CSS for accessibility). At the two ends of the list, the spec's reading is that Previous on the first page and Next on the last are left out of the row, not drawn disabled (usage rule 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176).

The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond ADR 0060's styles service (Part 2, "Types only", with [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 18). The targets, the fill, and the compact form are Yeti's CSS, so they are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to turn a `nav` into a pagination with one directive attribute, so that I never write Yeti's `pagination` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="pagination"` and its `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the current page's hue with a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="blue"` fails to compile.
4. As an application developer, I want to step the text with a `size` input typed by Yeti's `size-control` vocabulary, so that `size="small"` fails to compile.
5. As an application developer, I want to set the width below which the row compacts with a `threshold` input typed by Yeti's `width` vocabulary, so that `threshold="medium"` fails to compile.
6. As an application developer, I want to place the row with a `justify` input typed by Yeti's `justify` vocabulary, so that `justify="middle"` fails to compile.
7. As an application developer, I want static attributes such as `justify="center"` to type-check, so that I need no property binding for a constant.
8. As an application developer, I want an unset input to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
9. As an application developer, I want a static `size="sm"` to do nothing on the `nav` beyond the input, so that the HTML `size` attribute has no effect.
10. As an application developer, I want the directive to match only a `nav`, so that the pagination is always a navigation landmark.
11. As an application developer, I want to write the `ol`, its items, and the links as plain markup with no directive, so that the pagination reads like Yeti's docs.
12. As an application developer, I want to render the page links with `@for` from my own page data, so that the row follows the list.
13. As an application developer, I want each link to be a square target at least the control size, so that it is easy to hit with a pointer or a finger.
14. As an application developer, I want the current page drawn filled in the variant's colour, so that the reader sees where they are at a glance.
15. As an application developer, I want a hover tint in the variant's subtle colour, so that a pointer user sees which page they are about to choose.
16. As an application developer, I want to stand for skipped pages with an ellipsis in a `span`, so that a long list shows only the pages around the current one.
17. As an application developer, I want the row to shrink to Previous, the current page, and Next below the threshold, so that the same markup works in a wide column and a narrow one with no viewport query.
18. As an application developer, I want the compact form decided by the pagination's own width, so that a pagination in a narrow sidebar compacts even on a wide screen.
19. As an application developer, I want to mark Previous and Next with `rel="prev"` and `rel="next"`, so that they stay in the compact form and say what they are to the browser.
20. As an application developer, I want to mark the current page's link with `aria-current="page"` bound from my page state, so that exactly one link is current by construction.
21. As an application developer using the Router, I want `RouterLinkActive` with `ariaCurrentWhenActive="page"` and exact matching to mark the current link, so that the row updates on navigation without code of mine.
22. As an application developer, I want to be told that `RouterLinkActive`'s default subset matching can mark the wrong page when pages are query parameters, so that I set exact matching and one URL per page.
23. As an application developer, I want to be told that a binding to `false` writes `aria-current="false"`, which Yeti's CSS fills like the current page, so that I bind `null` instead.
24. As an application developer, I want to be told never to combine my own `aria-current` with `RouterLinkActive` on one link, so that the two writers do not undo each other.
25. As an application developer, I want to know what to write for Previous on the first page and Next on the last, so that no link leads nowhere and no dead link looks like a live one.
26. As an application developer, I want links that use `routerLink` with query parameters to keep working, so that each page is a URL a reader can bookmark and share.
27. As an application developer, I want to name the pagination with my own `aria-label` and translate it with `i18n-aria-label`, so that the package renders no string of its own.
28. As an application developer, I want to know that two paginations on one page need different names, so that the Story gate's landmark rule passes and screen-reader users can tell them apart.
29. As an application developer, I want to name icon-only Previous and Next links with `aria-label`, so that they make sense alone in the compact form.
30. As an application developer, I want to bind every input from a signal, so that the pagination follows my state under zoneless change detection.
31. As an application developer, I want a template reference (`#pages="yetiPagination"`), so that the directive follows the package's `exportAs` rule.
32. As an application developer, I want to import the directive from `ngx-yeti/pagination`, so that a `@defer` block can split it with the rest of the item.
33. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiSizeControl`, `YetiWidth`, `YetiJustify`), so that I can type my own signals that feed the inputs.
34. As an application developer, I want the pagination item file loaded when the first pagination renders and removed after the last leaves, so that I do not import `pagination.css` globally.
35. As an application developer, I want the item file and the current link's `aria-current` in the server HTML, so that the first paint already shows the row, its compact form, and its current page.
36. As an application developer, I want the row readable, compacted, and its links working with JavaScript off under SSR and prerendering, so that a reader can page through the list before any script runs.
37. As an application developer, I want hydration to change nothing on the pagination, so that I get no `NG05xx` error and no reflow.
38. As an application developer, I want a pagination inside a `@defer (hydrate on ...)` block to stay styled before and after the block hydrates, so that incremental hydration does not unstyle it.
39. As an application developer, I want a pagination inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated pagination is not unstyled when a live one elsewhere leaves.
40. As an application developer, I want to know what a `hydrate never` pagination cannot do (follow the page state, run `routerLink`), so that I put a live pagination in content that hydrates.
41. As an application developer, I want to know that a pagination inside a client-only `@defer` block needs `pagination` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
42. As an application developer using `withI18nSupport()`, I want translated labels and link text to hydrate without being re-rendered, so that localised pages keep the server's DOM.
43. As an application developer, I want to know that a pagination needs a definite width from its container, so that it does not collapse inside a shrink-to-fit parent.
44. As an application developer, I want the usage rules stated (a named `nav`, one `ol` with `role="list"`, at least two items, links with real URLs, exactly one current link, `rel` on Previous and Next, an ellipsis only as a `span`, no static Yeti attributes), so that I use the item as Yeti intends.
45. As a screen-reader user, I want the pagination announced as a navigation landmark named "Pagination", so that I can find it from the landmarks list.
46. As a screen-reader user, I want the pages announced as a list with its count, so that I know how many targets there are.
47. As a screen-reader user, I want the current page's link announced as the current page, so that I know where I am.
48. As a screen-reader user, I want Previous and Next announced by their visible text or their label, so that I know what they do without seeing the row.
49. As a keyboard user, I want each link to be one Tab stop in DOM order, and the ellipsis to be none, so that the pagination adds no keyboard pattern to learn.
50. As a keyboard user, I want a visible focus ring on every link, the current one included, so that I can see where focus is.
51. As a keyboard user, I want the links the compact form hides to leave the Tab order, so that I never Tab to an invisible target.
52. As a low-vision user, I want the current page to differ from its neighbours by more than a faint tint, so that I can see it at my contrast sensitivity.
53. As a low-vision user, I want the row to compact or wrap at 320 CSS px and at 200 % text size, so that I never scroll sideways to read it.
54. As a low-vision user who overrides text spacing, I want the targets to grow with their text, so that my settings clip nothing.
55. As a forced-colours user, I want the current page drawn with a border in a system colour, so that I can still see where I am when the fill is gone.
56. As a right-to-left reader, I want the row to run from right to left with Previous at its inline start, so that it reads in my direction.
57. As a package maintainer, I want the contract check to cover the class, the four attributes, and every value of their vocabularies, so that a pin move that adds a value or an attribute fails before release.
58. As a package maintainer, I want the SSR smoke to assert the server HTML of a pagination, its current link, and its item link, so that the first paint is proven.
59. As a package maintainer, I want the fixture app to render a pagination on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
60. As a package maintainer, I want the target-size and compact-form tests to follow Yeti's own `pagination.spec.js` cases, so that the package proves what Yeti proves.
61. As a package maintainer, I want a forced-colours test that fails when the accessibility stylesheet is left out, so that ledger row A11Y-1f is proven closed by the package's rule and not by chance.
62. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
63. As a package maintainer, I want the class name `YetiPagination` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/pagination/manifest.json`, `pagination.css`, `docs.md`, and `example.html`, in `Y/test/browser/components/pagination.spec.js` and its fixture, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/surface.css`, `Y/src/base/reset.css`, `Y/src/base/typography.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `pagination`, `component`, `Navigation` |
| `class` | `pagination` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "The hue of the current page and of the hover tint." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The text step." `data-threshold`: enum, vocabulary `width` (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`), default `sm`, "The pagination's own width below which only Previous, the current page, and Next remain." `data-justify`: enum, vocabulary `justify` (`start`, `center`, `end`, `between`, `around`, `evenly`), default `start`, "Where the links sit in the row." |
| `classes`, `markers` | empty; no markers |
| `children` | `> ol` (min 1, max 1): "The links, in page order, with role=\"list\"." `li` (min 2, no max): "A page link, or a span holding an ellipsis for skipped pages." |
| `tokens` | public: `--yeti-pagination-radius` ("Corner of each target."), `--yeti-control-size` ("Minimum size of each target."), the six `--yeti-color-primary*` and `--yeti-on-primary` (the default variant when `data-variant` is absent), `--yeti-text-md` and `--yeti-space-sm` (the defaults when `data-size` is absent; "a target's inline padding follows it"), `--yeti-space-xs` ("Gap between targets."), `--yeti-color-text-muted` ("The span standing for skipped pages."); private: `--_yeti-variant` and its five siblings, `--_yeti-justify`, `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby`; `keyboard`: empty; notes: "Put aria-label=\"Pagination\" on the nav. The current page's link carries aria-current=\"page\". Previous and Next carry rel=\"prev\" and rel=\"next\" and visible text or an aria-label; they are what remains when the row is narrow. Skipped pages are a span, not a link. Put role=\"list\" on the ol." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `container size queries`, `:has()`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`pagination.css:4-64`): `.pagination` is an inline-size container (`:5`). `:not([data-justify])`, `:not([data-variant])`, and `:not([data-size])` supply the private tokens only when the attribute is absent (`:6-8`). `.pagination > ol` is a wrapping flex row with `justify-content: var(--_yeti-justify)`, `gap: var(--yeti-space-xs)`, no margin, padding, or list style, at `font-size: var(--_yeti-size-text)` (`:9-18`). Each `li > :is(a, span)` is an `inline-flex` target at least `--yeti-control-size` in both dimensions, with `--yeti-space-sm` inline padding, `--yeti-pagination-radius` corners, inherited colour, and no underline (`:20-30`). `a:hover` takes `--_yeti-variant-subtle` as background (`:31`). `.pagination > ol > li > [aria-current]` fills with `--_yeti-variant` and sets `--_yeti-on-variant` as text colour (`:32-35`): the selector matches the attribute with any value, `"false"` included. `li > span` is muted (`:36`). Six container queries, one per width from `xs` (16rem) to `2xl` (80rem), hide every `li` that holds none of `[rel~="prev"]`, `[rel~="next"]`, and `[aria-current]` while the pagination is narrower than its threshold; `sm` (24rem) is the default (`:41-63`). The thresholds are literals equal to the width tokens' defaults, "because a container condition cannot read a token" (`:38-40`). No rule matches `data-threshold="2xs"` (read; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 93; Yeti row Y12 in [upstream-bugs.md](../upstream-bugs.md)). The item file sets `--_yeti-size-space` and never reads it: the inline padding is `--yeti-space-sm` at every size (read).

Rules the item relies on from the **Always-loaded group**: the `data-variant` value rules, which set the six private variant tokens on any element (`Y/src/layouts/attributes.css:239-254`); the `data-size` value rules (`:256-259`); the `data-justify` value rules (`:155-160`); `--yeti-pagination-radius: var(--yeti-radius-md)` (`Y/src/tokens/components.css:45`); `--yeti-control-size: 2.5rem` (`Y/src/tokens/surface.css:19`); `box-sizing: border-box` (`Y/src/base/reset.css:7`); `:is(ul, ol)[role="list"]`, which removes list markers and start padding (`Y/src/base/reset.css:83-86`); and the base `:focus-visible` ring (`Y/src/base/typography.css:101`). All quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows.

Yeti's own tests (`Y/test/browser/components/pagination.spec.js`): every target is at least a control square; the current page is filled and page 1 is not; the ellipsis is coloured differently from a link; at 1000 px every item shows and at 300 px only Previous, the current page, and Next keep a width; axe reports no violation. `Y/test/browser/contrast.spec.js:28` checks the fixture's Previous, page 1, and current page for contrast.

Attributes left to the consumer (building-blocks 1.1 and Part 2 row 35; ticket 26 maps only the four `data-*` attributes, rows 130 to 133): the `nav`'s `aria-label` or `aria-labelledby`, `role="list"` on the `ol`, `rel` on Previous and Next, each link's `href` or `routerLink`, and `aria-current="page"` on the current link, written by the consumer or by `RouterLinkActive`.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `pagination` | static host class on `nav[yetiPagination]` (`YetiPagination`) | always | ADR 0003 point 1; Part 2 row 35 |
| Attribute `data-variant` | the current page's hue and the hover tint | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. Not an HTML attribute | ticket 26 row 130 (R) |
| Attribute `data-size` | the text step | input `size`: `YetiSizeControl \| undefined`, bound `[attr.data-size]`, `null` when unset | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 131 (R); building-blocks 1.4 |
| Attribute `data-threshold` | the width below which the row compacts | input `threshold`: `YetiWidth \| undefined`, bound `[attr.data-threshold]`, `null` when unset | unset renders nothing; Yeti's `sm` applies. Not an HTML attribute | ticket 26 row 132 (R) |
| Attribute `data-justify` | where the links sit | input `justify`: `YetiJustify \| undefined`, bound `[attr.data-justify]`, `null` when unset | unset renders nothing; Yeti's `start` applies. Not an HTML attribute | ticket 26 row 133 (R) |
| Child `> ol` | the links, with `role="list"` | no directive; `role="list"` is the consumer's static attribute, neither bound nor read | not applicable | building-blocks 1.1; Part 2 row 35 |
| Children `li` | a page link or an ellipsis `span` | no directive | not applicable | building-blocks 1.1 |
| `aria-current="page"` | the current page's state, its fill, and its place in the compact form | the consumer's binding or `RouterLinkActive`'s write; the package neither binds nor reads it | absent until a writer sets it | building-blocks 1.10 "Current page"; ADR 0019 point 3; architecture-guide P11 |
| `rel="prev"`, `rel="next"` | Previous and Next, kept in the compact form | the consumer's static attributes; neither bound nor read | not applicable | Part 2 row 35; manifest `a11y.notes` |
| Name (`aria-label`, `aria-labelledby`) | required on the `nav` | the consumer's static or bound attribute; no name input | not applicable | building-blocks 1.10 "Names"; manifest `a11y.requiredAttributes` |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-pagination-radius` | each target's corners | the consumer's; the package writes none | Yeti's `var(--yeti-radius-md)` | ADR 0004 |
| Tokens `--yeti-control-size`, `--yeti-color-<variant>*`, `--yeti-on-<variant>`, `--yeti-text-*`, `--yeti-space-sm`, `--yeti-space-xs`, `--yeti-color-text-muted` | sizes, colours, gaps | the consumer's | not applicable | ADR 0004 |
| Private tokens (`--_yeti-variant` and siblings, `--_yeti-justify`, `--_yeti-size-text`, `--_yeti-size-space`) | private | never read or written | not applicable | building-blocks 1.13 |
| Package CSS | none in Yeti for `forced-colors` | one rule in `@layer ngx-yeti` for the current link under forced colours | in the package's accessibility stylesheet | ledger A11Y-1f; map, Package CSS for accessibility |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-pagination=""` on the host | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The `inert` kind for `size` (ticket 26 row 131 and grilling question 15; building-blocks 1.4): HTML's `size` attribute applies to form controls, never to a `nav`, so a static `size="sm"` stays on the host beside `data-size="sm"` and does nothing, and the directive binds nothing for it. `variant`, `threshold`, and `justify` are not HTML attributes, so no presentational-attribute kind applies to them, and no input of this item is of the `removed` kind ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9 does not apply).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is the full vocabulary, so no `Extract` is needed. `YetiWidth` keeps `2xs`, which matches no container rule of this item file at the pin (section 1; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 93). Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling question 16): `variant` is `YetiVariant`, `size` is `YetiSizeControl`, `threshold` is `YetiWidth`, and `justify` is `YetiJustify` on every item that reads them, so two package directives written on one `nav` never declare one input name with different types (architecture-guide P9).

**Module replaced:** none. Yeti's `pagination` has `js: null`, so there is no behaviour to list or map ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 35, "Yeti module: none"; [ticket 03](../issues/03-research-yeti-javascript-and-angular.md) puts it among the items whose gain is "only types").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-pagination-radius` for the corners, `--yeti-control-size` for the minimum target, the variant's colour, subtle tint, and "on" colour (the `primary` set by default, or the set a `variant` names, through the always-loaded value rules), `--yeti-space-sm` for the inline padding, `--yeti-space-xs` for the gap, `--yeti-text-md` by default (or the `--yeti-text-*` the set `size` names), and `--yeti-color-text-muted` for the ellipsis. The package writes none and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; derived tokens such as the radius also take effect on one pagination and its descendants (`Y/src/guides/theming.md:38`). A consumer who changes the width tokens does not move the compact form: its widths are literals (section 1). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- No injection token, no parent, no part directives. The item has one directive, and nothing needs to find it (building-blocks 1.9 applies to items with parts).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: the `nav` may also carry a utility such as `yetiPrint`, each item with its own presence attribute (ADR 0045).
- No Aria. Aria has no pagination pattern, the APG has none either, and the item is "links in a labelled `nav` with `aria-current="page"` and `rel`", met by Yeti's markup ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md), section 4.15). Toolbar was considered and not used: a pagination is a list of links with `aria-current`, met by Yeti's markup ([Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md), "Items where no Aria pattern fits any gap"). The one gap, A11Y-1f, is a CSS rule, and Aria ships no CSS (the same research, "Forced colours"). The user's rule "only reach for Angular Aria when it addresses an accesibility feature that Yeti is missing" (map, Standing rulings, When to use Angular Aria) gives no reason to reach for it.
- `RouterLinkActive` and `RouterLink` are the consumer's, from `@angular/router`, not hosted and not injected. The package has no dependency on the Router for this item.
- `YetiButtonDisabledLink` from the [button](button.md) spec is not used inside a pagination: it matches only `a[yetiButton][disabled]`, and a `yetiButton` on a pagination link would add `.button`'s fill and border under the pagination's own colour and size rules (section 7, "Disabled Previous and Next").
- The only injection is the root styles service of ADR 0060, through `injectYetiItemStyles`. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. A consumer who names the pagination with `aria-labelledby` writes the heading's `id` and the reference, both static; the package does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiPagination` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's check of 2026-10-03 under ADR 0080), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; ticket 50 decision 10) |
| Selector | `nav[yetiPagination]` (Part 2 row 35) |
| `exportAs` | `yetiPagination` (building-blocks 1.3) |
| Entry point | `ngx-yeti/pagination` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `size: YetiSizeControl \| undefined` (`md`); `threshold: YetiWidth \| undefined` (`sm`); `justify: YetiJustify \| undefined` (`start`); each `input()` with no default value |
| Host | static `class: 'pagination'`; static `data-ngx-yeti-item-pagination: ''`; `[attr.data-variant]`, `[attr.data-size]`, `[attr.data-threshold]`, `[attr.data-justify]` from the inputs, `null` when unset |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('pagination')` ([setup](setup.md)) |
| Models, outputs, methods, listeners | none |
| Lifecycle | acquires the `pagination` item file as the last statement of its constructor, after anything there that can throw (nothing does today), and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decisions 18, 42, and 45) |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `threshold="md"` compiles and `threshold="medium"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones; architecture-guide P23):

1. Put `yetiPagination` on a `nav` and name it with `aria-label` (Yeti's docs use "Pagination", translated with `i18n-aria-label`) or with `aria-labelledby` pointing at a visible heading (manifest `a11y.requiredAttributes`; building-blocks 1.10 "Names"). Two paginations on one page, such as one above and one below a list, take different names ("Pagination, top" and "Pagination, bottom", or each `aria-labelledby` its own heading), because two navigation landmarks with one name fail axe's `landmark-unique`, a `best-practice` rule the **Story gate** runs (axe-core 4.11 lists it under `best-practice`, checked in this repository's `node_modules`; building-blocks 1.10 "Gate").
2. Give the `nav` exactly one direct child `ol`, written with `role="list"`, and give the `ol` at least two `li` items (manifest `children`). The role restores the list's semantics in engines that lose them with `list-style: none` (manifest `a11y.notes`; the [breadcrumbs](breadcrumbs.md) spec's usage rule 2 for the same reset). `@for`, `@if`, and `ng-container` add no element, so the `li` they render are the items. A list with one page shows no pagination.
3. Put exactly one element in each `li`: a link (`a`) to a page, or a `span` holding an ellipsis for skipped pages. Yeti styles only `li > a` and `li > span` as targets (`pagination.css:20`). Never make the ellipsis a link, and never use a `button` for a page: Yeti's CSS draws no target for it, and a page is a place, so it is a link (manifest `a11y.notes`; building-blocks 1.10, "links stay `<a href>`").
4. Give every page link a real URL, through `href` or `routerLink`, never `href="#"` as Yeti's example has it. Prefer one URL per page, such as a `page` query parameter, so that a page can be bookmarked and a reader with JavaScript off pages through the list by full document loads (map, Standing rulings, JavaScript off; ADR 0011 consequences). Each page has one URL form: page 1 is either always `?page=1` or always the bare path, never both, so that exact matching in usage rule 7 finds it.
5. Write Previous and Next as links with `rel="prev"` and `rel="next"`, first and last in the `ol`, with visible text, or with an `aria-label` when their content is an icon (manifest `a11y.notes`). They are what remains in the compact form, together with the current link, so their names must make sense alone. Yeti's compact form keys on `rel~="prev"` and `rel~="next"` (`pagination.css:43-62`), so another `rel` value such as `nofollow` may be added beside them but neither may be left out.
6. On the first page, leave Previous out of the row; on the last page, leave Next out ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176). Never draw them disabled: Yeti's pagination has no disabled look, so a Previous with no target would look and hover like a live link while doing nothing, and `YetiButtonDisabledLink`, the package's disabled link, applies only to an `a[yetiButton]` ([button](button.md) spec, usage rule 4; ADR 0022 point 2). Section 7 records why.
7. Mark exactly one link, the current page's, with `aria-current="page"` (manifest `a11y.notes`). Keep it a link to the page itself, as Yeti's example does, so that it stays a target in the compact form. The attribute has one writer per element (architecture-guide P11), one of:
   - (a) the consumer's own binding from the list's page state, such as `[attr.aria-current]="p === page() ? 'page' : null"` in a `@for`;
   - (b) `RouterLinkActive` on each page link, with `ariaCurrentWhenActive="page"` and `[routerLinkActiveOptions]="{exact: true}"`.

   The examples lead with form (a), and form (b) is documented beside it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 177).
8. Bind `aria-current` to `null` on every other link, never to `false` or `'false'`. An attribute binding to `false` renders `aria-current="false"`, and Yeti's fill rule matches `[aria-current]` with any value (`pagination.css:32`; read), so the link would be filled as current and kept in the compact form, while assistive technology reports it as not current.
9. With form (b), always set exact matching. `RouterLinkActive`'s default is subset matching (`routerLinkActiveOptions` defaults to `{exact: false}`, `NGP/router/src/directives/router_link_active.ts:135-139`), whose query-parameter comparison is a subset test (`NGP/router/src/url_tree.ts:98-103`), so a page-1 link to the bare path, with no `page` parameter, is active on every page (read; inferred for this markup). With exact matching every query parameter must be equal (`url_tree.ts:87-92`), so a link must carry the list's other parameters too, for example through `queryParamsHandling="merge"` (inferred from the same source; layer 2 asserts it).
10. Never combine your own `aria-current` with `routerLinkActive` on one element. `RouterLinkActive` writes the attribute when it matches and removes it otherwise, even when `ariaCurrentWhenActive` is unset (`router_link_active.ts:241-249`), so a second writer's value is lost after the next navigation.
11. Give the pagination a definite inline size from its container. The `nav` is an inline-size container (`pagination.css:5`), so it does not size itself from its content; inside a shrink-to-fit parent (a flex item with no basis, an inline-block, a float) it collapses (inferred from CSS containment, as the [timeline](timeline.md) spec's usage rule 8 and [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 66 record for the same mechanism; applying it here is ticket 50 decision 178). In normal block flow nothing needs doing.
12. Do not write `class="pagination"`, `data-variant`, `data-size`, `data-threshold`, `data-justify`, or `data-ngx-yeti-item-pagination` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[threshold]="$any('3xl')"`, ADR 0070).
13. Bind the inputs and the page data from values that are the same on the server and the client, never from a browser-only read, because the hydration constraints require the same DOM on both sides.
14. Keep a pagination that follows the page state in content that hydrates. Inside `hydrate never`, Angular never runs, so form (a)'s bindings and form (b)'s `RouterLinkActive` never update after a client navigation, and a `routerLink` cannot navigate through the Router (section 10). A pagination in a `hydrate never` block is right only for the page it was rendered on.
15. Import `YetiPagination` in every component whose template writes the attribute. A **Forgotten import** with only static inputs renders an unstyled list with no error; only a bound input (`[threshold]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `pagination` | Angular Material `MatPaginator` | Angular Router |
| --- | --- | --- | --- |
| Shape | an item directive on the consumer's `nav` of page links | a component, `mat-paginator`, `exportAs: 'matPaginator'` (`NC/src/material/paginator/paginator.ts:98-99`), rendering a page-size select, a range label, and first, previous, next, and last icon buttons | `RouterLink` and `RouterLinkActive` on each link |
| Page change | a navigation to the link's URL | a `page` output carrying a `PageEvent` (`paginator.ts:192`); no URL | `NavigationEnd`; `RouterLinkActive` moves `aria-current` (`router_link_active.ts:228-258`) |
| Current page | `aria-current="page"` on its link, the consumer's or `RouterLinkActive`'s | `pageIndex` state (`paginator.ts:134-141`), shown in the range label; no `aria-current` | `ariaCurrentWhenActive` (`router_link_active.ts:148`) |
| Ends of the list | Previous or Next left out (usage rule 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176) | the previous and next buttons stay, disabled with `disabledInteractive` so they keep focus (`NC/src/material/paginator/paginator.html:45-60`) | not applicable |
| Forced colours | one package rule for the current link (A11Y-1f) | `cdk.high-contrast` rules outline the range actions (`NC/src/material/paginator/paginator.scss:111-120`) | not applicable |
| `exportAs` | `yetiPagination` | `matPaginator` | `routerLinkActive` |

Material's paginator is a different design, buttons driving a page index with no URL, and is not a fit (Part 2 row 35; ticket 17 section 4.15). Two things are taken from it as evidence only: the forced-colours rule follows the CDK `high-contrast` mixin's query, as Material's paginator does, and its focus-keeping disabled buttons are the reason section 7 weighs focus at the ends of the list. Building-blocks 1.14 item 5 asks every spec for this comparison; the Router column is the Angular piece usage rules 7 to 10 depend on.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 35; building-blocks 1.2). Row 35's reason is row 1's: Yeti's CSS does the whole job, and the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs`. The two unguarded features the manifest lists, container size queries and `:has()`, are inside Baseline 2025 ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md): `container-queries` from Firefox 110 and Safari 16, `has` from Firefox 121 and Safari 15.4), so the compact form works in every target browser. Below the target, Firefox 119 and 120 would ignore the compact rules and show every link (ticket 01, `pagination.css:43-63`), which is outside the target. No Aria pattern applies (section 3), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read in script; the forced-colours rule takes the CDK `high-contrast` mixin's shape, `@media (forced-colors: active)`, as plain CSS (`NC/src/cdk/a11y/_index.scss:48-65`; building-blocks 1.2). The flex row follows the CSS `direction` by itself, so RTL needs no `Directionality`. The size-dependent change is a container query on the item's own width, so the package adds no breakpoint service and no viewport-keyed input (building-blocks 1.7; architecture-guide P28).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none for pagination (ticket 17 section 4.15). The parts it is made of are covered: a navigation landmark labelled with `aria-label` or `aria-labelledby`, a list of links, and `aria-current="page"` on the current page's link (WAI-ARIA `aria-current`; building-blocks 1.10 "Current page"), the same shape as the APG's breadcrumb.
- **Roles:** `navigation` from the `nav`, `list` from the `ol` (kept by `role="list"`), `listitem` from each `li`, `link` from each `a`; the ellipsis `span` is plain text. The package adds none. Chromium's tree for Yeti's example is `navigation "Pagination"` with seven links (ticket 17 section 4.15).
- **States:** `aria-current="page"` on the current link: one writer, the consumer's binding or `RouterLinkActive` (section 2).
- **Keyboard:** none of the item's own (manifest `keyboard` is empty). Each link is one Tab stop in DOM order; the ellipsis is not focusable. A link the compact form hides has `display: none` and leaves the Tab order and the accessibility tree with it (`pagination.css:43-62`; read).
- **`rel`:** `rel="prev"` and `rel="next"` are link types the browser knows; Yeti uses them as the compact form's hooks. They add nothing to the accessible name.

**Disabled Previous and Next.** The records give the disabled state of a link one shape: a placeholder link with no target, `role="link"`, and `aria-disabled="true"`, marked by a directive (ADR 0022 point 2; building-blocks 1.10 "Disabled", "`aria-disabled="true"` on a link acting as a button", after `Y/src/guides/components.md:89`). That shape belongs to the `button` item: its directive, `YetiButtonDisabledLink`, matches only `a[yetiButton][disabled]` ([button](button.md) spec, section 4 and usage rule 4, itself open in [ticket 76](../issues/76-spec-button.md) point 2). Inside a pagination, three things stand against it (read at the pin, not measured): `pagination.css` has no rule for `[aria-disabled]`, so a placeholder Previous is drawn as a normal target and still takes the hover tint (`:31` matches any `a`); adding `yetiButton` to get the button's disabled look would also add `.button`'s border and fill under `.pagination > ol > li > :is(a, span)`'s colour and size rules, a look Yeti never shows; and a placeholder link is not focusable, so a keyboard user who presses Next on the second-to-last page loses focus to the `body` when Next becomes a placeholder, just as when it is left out. This spec's reading is usage rule 6: Previous is left out on the first page and Next on the last, which is Yeti's markup with nothing in it that Yeti cannot draw ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176). In the compact form the first page then shows the current link and Next. Moving focus to the list's heading after a page change, which keeps focus from falling to the `body` in both readings, is the application's (Out of Scope).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The landmark, the list and its items, and the current state come from the `nav`, the `ol` with `role="list"`, the `li` items, and `aria-current` (usage rules 1, 2, and 7). The directive adds no role. |
| 1.3.2 Meaningful Sequence | The links are in DOM order, Previous first and Next last, in page order between them (usage rules 3 and 5); the flex row never reorders them, and `justify` moves the row, not its order. |
| 1.4.1 Use of Color | The current page differs from its neighbours by a filled shape, not by a hue on text: its target has the variant's background and the others have none (`pagination.css:32-35`). The fill is a visible shape only while it contrasts with the page, so the play function asserts the ratio between the current link's fill and the background around it (building-blocks 1.10, "Target size and non-text contrast"; threshold at least 3:1, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94). |
| 1.4.3 Contrast (Minimum) | Link text, the ellipsis, and the current page's text on its fill: axe reported no violation on the pagination example in either scheme (ticket 17 section 2.1; building-blocks 1.10 names the five items axe left incomplete, pagination not among them), and Yeti's contrast test covers the fixture's links and current page (`Y/test/browser/contrast.spec.js:28`). The **Story gate** covers each variant story; the `variants` story also asserts at least 4.5:1 for the current page's text on its fill with the exact WCAG formula, because a theme or a pin move can change one variant's "on" colour ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). |
| 1.4.4 Resize Text, 1.4.10 Reflow | The row wraps (`flex-wrap: wrap`) and compacts below its threshold; sizes are `rem`-based tokens. Ticket 17 measured no page-level horizontal scroll on the pagination example at 320 x 640 in Chromium (section 2.4). Layer 4 asserts it at a 320 px viewport and at 200 % text zoom. |
| 1.4.11 Non-text Contrast | The current page's fill against the background is asserted as in 1.4.1. Under forced colours the fill is gone and the package's rule draws the state (A11Y-1f, below). |
| 1.4.12 Text Spacing | The targets have a minimum size and no fixed height or overflow; they grow with their text (read). |
| 2.4.3 Focus Order | Tab follows DOM order in left-to-right and right-to-left pages (layer 1, `pagination--rtl`). Links the compact form hides are not in the order. |
| 2.4.4 Link Purpose (In Context) | A page link's text is its number, whose purpose is clear in context: a list item inside the navigation landmark named "Pagination". Previous and Next carry their text or label (usage rule 5). |
| 2.4.6 Headings and Labels | The landmark's label is the consumer's (usage rule 1); the stories use "Pagination", as Yeti does. |
| 2.4.7 Focus Visible | Yeti's base `:focus-visible` ring on every link, the current one included (`Y/src/base/typography.css:101`); ticket 17 found a 2 px ring at every Tab stop (building-blocks 1.10). Layer 1 asserts the ring on the current link, whose fill could hide a ring drawn inside it. |
| 2.5.8 Target Size (Minimum) | Every target is at least `--yeti-control-size` (2.5rem at the pin) on each side (`pagination.css:23-24`), above 24 CSS px; axe's `target-size` ran and passed on the pagination example (6 nodes, Chromium; ticket 17 section 2.1). The Story gate runs it on every size story, `sm` included, and layer 1 asserts each target is at least the control size, as Yeti's test does. |
| 4.1.2 Name, Role, Value | The landmark's name, the links' names, and the current state are exposed by native elements and `aria-current`. |

Forced colours (not an AA criterion of its own; ticket 17 section 2.6): Yeti has no `forced-colors` rule, and under forced colours "the `aria-current="page"` link looks like the others" (measured in Chromium), because the fill is a background colour, which forced colours replaces.

**Ledger rows owned:** A11Y-1f ([ledger.md](../ledger.md); Part 2 row 35). The package adds one rule to its accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)`, on `.pagination a[aria-current="page"]`, drawing the current link with a border in a system colour, after the CDK `high-contrast` mixin's query (`NC/src/cdk/a11y/_index.scss:48-65`) and the shape of the button's A11Y-1a rule ([button](button.md) spec, section 7). It selects Yeti's state hook only, reads no private token, and names no package class (map, Package CSS for accessibility; [setup](setup.md), the package's accessibility stylesheet; ticket 50 decision 68 for its specifier). A border, as the row says, and not an outline, because the base focus ring is an outline and the current link must show both. Under `box-sizing: border-box` the border fits inside the target's minimum size (`Y/src/base/reset.css:7`), so the row does not shift between modes (inferred). The exact declarations are the implementer's within those limits; layer 4 asserts the outcome. The row's selector requires the value `page`, which usage rule 7 makes the only value a consumer writes. This spec confirms the row as written, with no change to its columns.

### 8. Rendered HTML

Consumer markup, after Yeti's example, with the pages from the consumer's own state (usage rule 7, form (a)) and Previous and Next left out at the ends (usage rule 6):

```html
<nav yetiPagination justify="center" threshold="md" aria-label="Pagination" i18n-aria-label>
  <ol role="list">
    @if (page() > 1) {
      <li><a routerLink="." [queryParams]="{ page: page() - 1 }" queryParamsHandling="merge" rel="prev" i18n>Previous</a></li>
    }
    @for (p of pages(); track p) {
      <li>
        @if (p === null) {
          <span>…</span>
        } @else {
          <a routerLink="." [queryParams]="{ page: p }" queryParamsHandling="merge" [attr.aria-current]="p === page() ? 'page' : null">{{ p }}</a>
        }
      </li>
    }
    @if (page() < last()) {
      <li><a routerLink="." [queryParams]="{ page: page() + 1 }" queryParamsHandling="merge" rel="next" i18n>Next</a></li>
    }
  </ol>
</nav>
```

On `/results?page=2` of nine pages, the server HTML and the hydrated DOM are the same. The `nav` carries `yetipagination=""`, `justify="center"` and `threshold="md"` (static input attributes, matched by no rule), `aria-label="Pagination"`, `class="pagination"`, `data-justify="center"`, `data-threshold="md"`, and `data-ngx-yeti-item-pagination=""`, and no `data-variant` or `data-size`. The `ol` carries `role="list"`. The `li` hold Previous (`href="/results?page=1"`, `rel="prev"`), pages 1, 2, and 3, an ellipsis `span`, page 9, and Next (`rel="next"`); only page 2's link carries `aria-current="page"`. Each `href` is resolved by `RouterLink` against `<base href>`, and each `a` carries `RouterLink`'s own `jsaction` for its `click` listener; the `nav` carries none from the package.

With form (b), each page link is `<a routerLink="." [queryParams]="{ page: p }" queryParamsHandling="merge" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">`, and `aria-current="page"` is written on the matching link by `RouterLinkActive`. Whether the server HTML carries it depends on `RouterLinkActive`'s microtask running before serialization (inferred; layer 3 asserts it, as the [breadcrumbs](breadcrumbs.md) spec's layer 3 does). If that check fails, form (b) becomes a client-rendered-only usage rule and leaves the JavaScript-off e2e case, as [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87 recorded for the breadcrumbs.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/pagination/pagination.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="pagination"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:50`). The client adopts it at bootstrap. The item has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiPagination` and input names where the docs write `class="pagination"` and `data-*` names; the `href="#"` placeholders become real URLs (usage rule 4); Previous and Next are left out at the ends (usage rule 6), where Yeti's docs example shows a Previous with `href="#"` beside a current page 1.

### 9. Animation

None. The item has no state transition the package drives, and Yeti's CSS has none for it beyond a link's hover tint. A link the consumer inserts with `@for` may carry a class-form `animate.enter` of the consumer's (building-blocks 1.6 rule 2), never on a server-rendered pagination (ADR 0011 clause 12). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the consumer's name, list role, `rel`, and `aria-current`, and the item link in `<head>` (section 8). Everything the directive renders at first paint is a host binding (ADR 0011 clause 1). The compact form is a container query, so the first paint at any width already shows the right form. Nothing is **Pre-hydration state** of the package: no person and no Yeti module can change the four attributes. `aria-current` changes only with a page change, which before hydration is a full document load that renders the new row on the server.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; the bindings computed from the same inputs give the same values (usage rule 13); 0 style mutations (ADR 0060 point 5, measured for the mechanism). With form (b), `RouterLinkActive` writes the same `aria-current` again through `Renderer2` once the Router has navigated (`router_link_active.ts:228-249`), which changes no node (inferred; layer 4 asserts no `NG05xx`).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the row and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A click on a `routerLink` page inside a block that has not hydrated is held by Angular's dispatcher, which cancels the native navigation of an `<a>` carrying `jsaction` (ADR 0011 clause 3), and is replayed through the Router once the block hydrates (inferred; layer 4 measures it under `hydrate on interaction`).
- **`hydrate never`:** the row is its server HTML and stays styled, compact form included, while its host is connected, whatever live paginations do (ADR 0060 point 4; ADR 0045). It never follows a page change (usage rule 14). What a click on a `routerLink` inside it does is recorded by layer 4, as for the breadcrumbs ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 90); if the click is held and never replayed, usage rule 14 extends to plain `href` links inside `hydrate never` as it does there.
- **Client-only `@defer`:** the item file is fetched when `YetiPagination` is constructed, which can show unstyled frames (a vertical list of underlined links); the consumer closes the gap with `provideYetiStyles({ preload: ['pagination'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing of the package replays and it adds no `jsaction`. A consumer `routerLink` declares Angular's `click` listener on its `a`, which replays (building-blocks 1.11).
- **`withI18nSupport()`:** the `aria-label` and the Previous and Next text are usually translated with `i18n` in the consumer's component; that component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** the inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4). Form (a)'s page state is the consumer's signal; form (b)'s `RouterLinkActive` writes the DOM itself and calls `markForCheck()` (`router_link_active.ts:254`), so it needs no zone either (read).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the row is readable, sized, filled at its current page, and compacted below its threshold, and every link navigates by its `href` as a full document load that renders the next page on the server, because the class, the attributes, the consumer's `aria-current`, and the item link are in the server HTML. Nothing is lost: the item has no behaviour. With form (b), this holds only if `RouterLinkActive`'s attribute is in the server HTML (section 8). On a prerendered route, each page's URL must be prerendered too, or served by a server route, for the next page to load; that is the application's routing configuration. A client-only application gets no such promise.
- **Hydration boundary:** the pagination is one element tree with no ids or references; a consumer `@defer` wraps the whole `nav` (building-blocks 1.11 decision 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; the four `data-*` attributes come from inputs whose values usage rule 13 keeps equal on both sides; form (a)'s `aria-current` comes from the same page state on both sides; form (b)'s comes from the same URL. Leaving Previous or Next out (usage rule 6) depends on the same page state.
- **No direct DOM manipulation:** the directive writes nothing outside host bindings. The item link is the ADR 0060 service's. `RouterLinkActive`'s `Renderer2` attribute write is Angular's own and changes no node.
- **Valid HTML:** `nav > ol > li` with `a` or `span` is valid; the parser repairs nothing. An item is never a `div` inside the `ol` (usage rule 2).
- **`preserveWhitespaces`:** the directive has no template. White-space-only text in the flex `ol` is not a flex item, and the compact rules count elements only (`li:not(:has(> ...))`), so whitespace changes neither the targets nor the compact form.
- **No output branched on the platform:** none. The compact form is decided by CSS on both sides, never by a width read in script (building-blocks 1.7).
- **Static attributes the directive binds:** usage rule 12 keeps the consumer from writing them. The static `size` is `inert` and never bound, and the static `variant`, `threshold`, and `justify` are input attributes matched by no rule, so hydration writes back the same values the server rendered. `aria-current`, `aria-label`, `rel`, and `role="list"` are attributes the directive does not bind.

### 12. Single-page application

The item uses neither [navigation-close](navigation-close.md) (it has no open state) nor [fragment-links](fragment-links.md) (its links are page URLs, not fragments; Yeti's bare `href="#"` is never shipped, usage rule 4). On a page change:

- A pagination inside the routed view leaves with the route when the route changes, and is rendered again by the next one; the item link is removed in the animation frame after no `[data-ngx-yeti-item-pagination]` host is connected, and re-inserted when a route renders a pagination (ADR 0060 point 4; ADR 0045).
- A page change that changes only a query parameter keeps the routed component and its pagination; form (a) moves `aria-current` when the page signal derived from the query parameter changes, and form (b)'s `RouterLinkActive` moves it after `NavigationEnd` (`router_link_active.ts:176-180`). Either way exactly one link is current after each page change (layer 4). A link that `@for` tracks by page number stays the same element, so focus stays on a clicked page link; a Previous or Next that the new page leaves out takes focus with it (section 7).

### 13. Item file

`yeti-css/css/components/pagination/pagination.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiPagination]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:50`, after `breadcrumbs` and before `toc`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-pagination` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]`, `[data-size]`, and `[data-justify]` value rules, the tokens, the `role="list"` reset, and the focus ring), the package's accessibility stylesheet (which holds A11Y-1f's rule), and optionally `provideYetiStyles({ preload: ['pagination'] })`. The item adds nothing to it. Cross-item files acquired: none (`pagination.css` has no cross-item rule, and no other item file's rule targets `.pagination`; ADR 0060 point 9; read with `rg -l '\.pagination' src -g '*.css'`, which returns only `pagination.css`).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the accessibility tree (landmark, name, list, current state), the targets' boxes, which items the compact form keeps, and the computed colours and borders. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a target-size test reads `--yeti-control-size` from the page, as Yeti's own test does; a size test compares the `ol`'s font size with a probe element styled `font-size: var(--yeti-text-<size>)`; a fill test compares the current link's background with a probe styled `background-color: var(--yeti-color-<variant>)`; a compact-form test sets the container just below and just above the threshold's literal width read from `pagination.css` at the pin, not from a token. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the `pagination` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), which includes `target-size`, `color-contrast`, and `landmark-unique`. Links in stories use `href` paths under a no-op router, so a click does not leave the story. Story ids:

- `pagination--default`: Yeti's example (Previous, pages 1, 2, and 3, an ellipsis, page 9, Next, page 2 current) with real paths. Asserts the `nav`'s `class` is `pagination`, `data-ngx-yeti-item-pagination` is present, and no `data-variant`, `data-size`, `data-threshold`, or `data-justify`; the `nav` is a navigation landmark named "Pagination", holding a list of seven items; exactly one link carries `aria-current="page"`; every target is at least the computed `--yeti-control-size` on each side (`Y/test/browser/components/pagination.spec.js:12-19`); the current link's background equals its variant probe's and page 1's is transparent; the ellipsis's colour differs from a link's (`:20-22`); Tab visits the six links in order and does not stop on the ellipsis; the focused current link shows a ring outside its fill.
- `pagination--compact`: the default markup in a container whose width a Storybook control sets, starting at 300 px. Asserts that at 300 px only Previous, the current link, and Next have a non-zero width and the other four items are `display: none` (`pagination.spec.js:25-31`), and that Tab visits only those three; widening the container past 24rem shows all seven.
- `pagination--threshold`: one pagination per value of `threshold` from `xs` to `2xl`, each in a container 1 px narrower than the threshold's literal width, and a fifth copy with a Storybook control binding `threshold`. Asserts each compacts below its own threshold and shows every item 1 px above it; asserts `data-threshold` follows the control and is removed when the control is unset. A `2xs` copy is recorded, not asserted, and its result goes to Yeti row Y12 in [upstream-bugs.md](../upstream-bugs.md) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 93).
- `pagination--first-page` and `pagination--last-page`: page 1 of nine with no Previous, and page 9 with no Next (usage rule 6). Asserts the list starts with the current link, or ends with it; no element carries `aria-disabled` or lacks an `href` among the links; and at 300 px the compact form shows the current link and the one neighbour that remains.
- `pagination--variants`: one pagination per value of `variant`, and a Storybook control on a tenth. Asserts each `data-variant`, the current link's background equals its variant probe's, the ratio between that fill and the background around the `nav` is at least 3:1 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94; building-blocks 1.10), and the current link's text on its fill is at least 4.5:1 with the exact WCAG formula, in the light and dark schemes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). A variant that fails in a scheme is recorded and moved to an **Anti-pattern story**, `pagination--anti-pattern-<variant>-<scheme>`, rather than silenced.
- `pagination--sizes`: three paginations with `size` `sm`, `md`, and `lg`, and a control on a fourth. Asserts each `data-size` value; each `ol`'s computed font size equals its probe's; setting the control to unset removes `data-size` and the font size equals the `md` probe's; every target stays at least the control size at `sm`. Asserts a static `size="sm"` stays on the host beside `data-size="sm"` (the `inert` kind).
- `pagination--justify`: one pagination per value of `justify` in a wide container. Asserts each `data-justify` value and where the first and last targets sit in the container (start, centre, end, and the three distributions), with the DOM order unchanged.
- `pagination--icon-links`: Previous and Next as icons with `aria-label` (usage rule 5). Asserts their accessible names, and that they keep those names at 300 px in the compact form.
- `pagination--two-on-a-page`: one pagination above and one below a list, named "Pagination, top" and "Pagination, bottom". Asserts two navigation landmarks with distinct names, which keeps `landmark-unique` passing (usage rule 1).
- `pagination--rtl`: `pagination--default` inside `dir="rtl"`. Asserts Previous is the rightmost target, Next the leftmost, and Tab follows DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `pagination.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiPagination, { tagName: 'nav' })`: the host has class `pagination` and `data-ngx-yeti-item-pagination`, and none of the four `data-*` attributes; with `bindings` setting each input, its attribute follows after `whenStable()`, and binding `undefined` removes it.
- While a fixture lives, one `<link data-ngx-yeti-styles="pagination">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and no attribute other than the class, the four `data-*` attributes, and the presence attribute: a consumer's `aria-label`, `class`, and `aria-current` and `rel` inside the row are left as written.

A small test host covers what `createDirective` cannot: the template reference `#p="yetiPagination"` resolves; a static `size="sm"` renders both `size="sm"` and `data-size="sm"`; a static `threshold="md"` renders `data-threshold="md"`; `[attr.aria-current]` bound to `false` renders `aria-current="false"` and that link's background equals the current link's, which is the evidence for usage rule 8, while binding `null` renders no attribute. With `provideRouter` and one route `/results`, `RouterTestingHarness` navigating to `/results?page=2&q=hills` leaves exactly one `aria-current="page"` in a form (b) row with exact matching and `queryParamsHandling="merge"`, on page 2's link, and moves it to page 3's link after navigating there; the same harness with the default subset matching and a page-1 link to the bare path marks page 1 as well, which is the evidence for usage rule 9. A form (a) row driven by a signal moves `aria-current` to the new page and leaves Previous out when the signal is 1.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `pagination.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()`, `provideRouter` with the route `/results`, and the URL `/results?page=2` (building-blocks 1.11 decision 11, 1.12). Two fixtures, one per form of usage rule 7, each with `aria-label="Pagination" i18n-aria-label`, static `size="sm"`, `threshold="md"`, and `justify="center"`, and `i18n` Previous and Next text: `whenStable()` resolves; the `nav` renders `class="pagination"`, `data-size="sm"`, `data-threshold="md"`, `data-justify="center"`, `size="sm"`, and `data-ngx-yeti-item-pagination`, and no `data-variant`; the `ol` keeps `role="list"`; Previous and Next keep their `rel`; exactly one element carries `aria-current="page"`, page 2's link, in both forms; `<head>` holds one item link with `data-ngx-yeti-styles="pagination"`, `data-beasties-skip`, and an `href` ending `components/pagination/pagination.css?v=<pin>`; the `nav` carries no `jsaction`. A third fixture at `/results?page=1` renders no Previous. The form (b) assertion is the measurement section 8 needs.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `pagination` has `YetiPagination`; `data-variant`, `data-size`, `data-threshold`, and `data-justify` each have an input whose union equals the manifest's vocabulary (`variant`, `size-control`, `width`, `justify`); the item has no markers and no events. A pin move that adds an attribute, a value, or a marker fails here before any story does. The attribute-and-value check over the stories (building-blocks 1.12) covers every value they render. The name-collision test checks `YetiPagination` against the 46 names of `yeti.d.ts` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 10).

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids:

- `pagination--default`: the accessibility tree of the `nav` (an ARIA snapshot) is a navigation landmark named "Pagination" holding a list of the items, with page 2 marked current, in Chromium, Firefox, and WebKit. WebKit's Tab skips links by default (ticket 17 section 1), so the WebKit focus case uses `element.focus()`, as ticket 17 did.
- `pagination--default` under `emulateMedia({ forcedColors: 'active' })` in Chromium and Firefox (A11Y-1f): the current link's computed border width or colour differs from its neighbours'; with the package's accessibility stylesheet left out, the same comparison finds no difference, which proves the rule is what draws the state (axe does not check it); a screenshot is recorded in each engine. The current link's box size is equal with and without forced colours.
- `pagination--compact`: at a 320 px viewport the page has no horizontal overflow, and only Previous, the current link, and Next are visible and in the Tab order, in three engines; at 200 % text zoom the row still fits its container (1.4.4, 1.4.10).
- A pagination inside a `cluster`, a shrink-to-fit parent: its width is measured and recorded in three engines (usage rule 11; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 178).

Fixture-app half, built with `outputMode: 'server'`, with a `/results` route marked `RenderMode.Server` and a prerendered `/archive` route with its pages listed for prerendering (`RenderMode.Prerender`), each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). Each route renders a form (a) row and a form (b) row:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; `aria-current="page"` is on the same element before and after hydration, in both rows;
- with JavaScript disabled, both rows show the current page filled, the compact form applies at a 320 px viewport, `@axe-core/playwright` with the six tags reports no violation, and clicking Next loads the next page as a new document whose rows mark it current;
- with JavaScript on, clicking page 3 navigates through the Router; afterwards each row has exactly one `aria-current="page"`, on page 3's link, and focus is still on that link; from page 8, clicking Next leads to page 9 with no Next in the row, and the element that holds focus afterwards is recorded;
- with `main.js` held back, a click on Next before hydration is replayed and ends on the next page (event replay; building-blocks 1.11);
- a row inside a `@defer (hydrate on interaction)` block: a click on a page link hydrates the block and navigates through the Router;
- a row inside a `hydrate never` block keeps its item link after every live row on the page is removed (ADR 0045); a click on its `routerLink` is recorded, not asserted ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 90's case, applied here);
- a row inside a client-only `@defer` block with `pagination` in the preload list shows no unstyled frame;
- navigating to a route with no pagination removes the item link in the next animation frame, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/pagination.spec.js` with the fixture `test/browser/fixtures/components/pagination.html` for the target-size, fill, compact-form, and axe cases; ticket 17's forced-colours screenshots for A11Y-1f; the [button](button.md) spec's forced-colours case for A11Y-1a, which this spec's layer-4 case follows; the [breadcrumbs](breadcrumbs.md) spec for the `aria-current` forms and the `RouterLinkActive` measurements; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [sidebar](sidebar.md) spec's probe technique for token-independent sizes.

## Out of Scope

- An input for the pagination's name, the current page, the page count, or the URLs: the name is the consumer's (building-blocks 1.10 "Names"), and `aria-current`, `rel`, and the links are the consumer's or the Router's (Part 2 row 35; building-blocks 1.10 "Current page").
- A component or directive that computes which pages to show, where the ellipsis goes, or the page links from a total and a current page. That is application behaviour, and Yeti has none (architecture-guide P15; Part 2 row 35, types only).
- A Material-style paginator with a page-size select, a range label, first and last buttons, or a `page` output (section 5).
- A disabled look for Previous and Next, and any directive that disables a pagination link (usage rule 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176).
- Moving focus after a page change. Where focus goes when the list changes is the application's; the e2e records what happens at the end of the list (section 7).
- Writing `aria-current` from the package, or wrapping `RouterLinkActive` (ticket 08, old ADR 0042's row: documented usage, not a record).
- Any check that the host has one `ol`, at least two items, exactly one `aria-current`, `rel` on Previous and Next, real URLs, or a name. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the item beyond A11Y-1f's forced-colours rule (building-blocks 1.13; map, Package CSS for accessibility).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `nav[yetiPagination]` with `variant`, `size`, `threshold`, and `justify`; no part directives | building-blocks Part 2 row 35; ticket 26 rows 130 to 133; [Decide: the spec list](../issues/11-decide-spec-list.md) row 35 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant`, `YetiSizeControl`, `YetiWidth`, and `YetiJustify`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5; building-blocks 1.4 shared vocabularies |
| `size` is `inert` on a `nav`; no `removed` input | building-blocks 1.4; ticket 26 row 131, grilling question 15 |
| The name, `role="list"`, `rel`, the URLs, and `aria-current="page"` are the consumer's, or `RouterLinkActive`'s for `aria-current` | building-blocks 1.1, 1.10 "Names" and "Current page"; Part 2 row 35; ADR 0019 point 3 |
| One writer of `aria-current` per element; exact matching with `RouterLinkActive`; `null`, never `false` | architecture-guide P11; `RouterLinkActive` and `url_tree.ts` source (read); `pagination.css:32` (read) |
| Examples lead with the consumer's binding from page state | ticket 50 decision 177 (after [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87 for the breadcrumbs) |
| Previous and Next left out at the ends, not drawn disabled | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 176 (ADR 0022 point 2 and the button spec read; they do not apply to a pagination link) |
| Distinct names for two paginations on one page | building-blocks 1.10 "Names" and "Gate"; axe `landmark-unique` (`best-practice`, checked) |
| A definite inline size from the container | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 178 (after ticket 50 decision 66 for the timeline) |
| No Aria, no CDK in script | building-blocks 1.2; Part 2 row 35; map, Standing rulings (When to use Angular Aria) |
| One forced-colours rule in `@layer ngx-yeti` for the current link | ledger A11Y-1f; map, Package CSS for accessibility; [setup](setup.md) |
| Contrast: 4.5:1 for the current page's text; the fill-to-background threshold | ticket 50 decision 8; building-blocks 1.10 (threshold at least 3:1, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 94) |
| The presence attribute and the item file | ADR 0045; ADR 0060 points 2 to 6; ticket 50 decisions 18, 42, and 45 |
| `exportAs`; the class name has no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/pagination` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 35 and "Types only"; ticket 50 decision 18 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A pagination over search results, its pages from the component's own state (form (a)), Previous and Next left out at the ends:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiPagination } from 'ngx-yeti/pagination';

@Component({
  selector: 'app-pages',
  imports: [YetiPagination, RouterLink],
  template: `
    <nav yetiPagination justify="center" aria-label="Pagination" i18n-aria-label>
      <ol role="list">
        @if (page() > 1) {
          <li><a routerLink="." [queryParams]="{ page: page() - 1 }" queryParamsHandling="merge" rel="prev" i18n>Previous</a></li>
        }
        @for (p of shown(); track $index) {
          <li>
            @if (p === null) {
              <span>…</span>
            } @else {
              <a routerLink="." [queryParams]="{ page: p }" queryParamsHandling="merge" [attr.aria-current]="p === page() ? 'page' : null">{{ p }}</a>
            }
          </li>
        }
        @if (page() < last()) {
          <li><a routerLink="." [queryParams]="{ page: page() + 1 }" queryParamsHandling="merge" rel="next" i18n>Next</a></li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pages {
  readonly page = input.required<number>();
  readonly last = input.required<number>();

  // The application's own choice of which pages to show; null is an ellipsis.
  protected readonly shown = computed(() => windowAround(this.page(), this.last()));
}
```

`windowAround` is the application's function, and `page` comes from the `page` query parameter through the Router's component input binding. Every value is the same on the server and the client (usage rule 13).

Every page a link, with the Router marking the current one (form (b)):

```html
<nav yetiPagination aria-label="Pagination" i18n-aria-label>
  <ol role="list">
    <li><a routerLink="." [queryParams]="{ page: 1 }" queryParamsHandling="merge" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">1</a></li>
    <li><a routerLink="." [queryParams]="{ page: 2 }" queryParamsHandling="merge" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">2</a></li>
    <li><a routerLink="." [queryParams]="{ page: 3 }" queryParamsHandling="merge" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">3</a></li>
  </ol>
</nav>
```

The imports are `YetiPagination`, `RouterLink`, and `RouterLinkActive`.

Icon-only Previous and Next, compacting in a narrow sidebar at the `md` threshold:

```html
<nav yetiPagination threshold="md" size="sm" aria-label="Archive pages" i18n-aria-label>
  <ol role="list">
    <li><a [routerLink]="['/archive', page() - 1]" rel="prev" aria-label="Previous page" i18n-aria-label>‹</a></li>
    <!-- the page links, as in the first example -->
    <li><a [routerLink]="['/archive', page() + 1]" rel="next" aria-label="Next page" i18n-aria-label>›</a></li>
  </ol>
</nav>
```

A wider corner for every target, in the consumer's stylesheet after Yeti: `:root { --yeti-pagination-radius: var(--yeti-radius-lg); }`.

A pagination whose page renders it inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['pagination'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/pagination/pagination.css`, loaded by `YetiPagination` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css:239-254`, `:256-259`, and `:155-160` map `data-variant`, `data-size`, and `data-justify` to the private tokens; `tokens/components.css:45` declares the radius and `tokens/surface.css:19` the control size; `base/reset.css:7` sets `border-box` and `:83-86` removes list markers for `role="list"`; `base/typography.css:101` draws the focus ring.
3. **Cross-item rules:** none. No other item file targets `.pagination`, and `pagination.css` targets no other item (read).
4. **Tokens:** reads `--yeti-pagination-radius`, `--yeti-control-size`, the variant's colour set, `--yeti-space-sm`, `--yeti-space-xs`, `--yeti-text-md` or the `--yeti-text-*` a set `size` names, and `--yeti-color-text-muted`; writes none (section 2).
5. **Package CSS:** A11Y-1f's rule in the accessibility stylesheet, inside `@layer ngx-yeti` and `@media (forced-colors: active)` (section 7).
6. **What breaks without the item file:** the row renders as a vertical list with no markers (the `role="list"` reset) of underlined links in the base link colour; there are no square targets, no fill on the current page, so it is marked for assistive technology only, and no compact form, so every link shows at every width. The `data-*` attributes still set private tokens that nothing reads. No error is reported.
7. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `pagination` and its attributes produced none.

### Platform features to adopt when the browser target moves

None. Container size queries and `:has()`, the two unguarded features, are inside Baseline 2025 (section 6), and Yeti guards nothing for this item. If a later CSS level lets a container condition read a custom property, Yeti could key the compact form on the width tokens rather than literals; that is Yeti's change, and the package's inputs would not change. Nothing was checked against web-features data for this spec beyond ticket 01's table.

### Single-page-application pieces relied on

None of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). The item relies on ADR 0060's styles service for route changes, and on the consumer's `RouterLink` and, in form (b), `RouterLinkActive` (section 12).
