# Spec: breadcrumbs (component)

Ticket: [75. Spec: breadcrumbs (component)](../issues/75-spec-breadcrumbs.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 25 and Part 1 (1.1, 1.3, 1.4, 1.10 "Names" and "Current page", 1.11, 1.13), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) row 93 and grilling question 15, [Decide: the spec list](../issues/11-decide-spec-list.md) row 25, [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md) (old ADR 0042's row: the `RouterLinkActive` guidance is documented usage, not a record), [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 8, 18, and 42), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0019](../adr/0019-nav-and-dropdown-are-disclosure-navigation.md) point 3, [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); architecture-guide P9 and P11. The item owns no [ledger.md](../ledger.md) row (Part 2 row 25). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.x); `NC/` is `github.com/angular/components/` at `708d4c6e2`; `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 87 to 90), and each is cited where it applies.

## Problem Statement

Yeti's `breadcrumbs` is "the trail from the home page to the current one, each step a link, with a separator between them that is seen and not read" (`Y/src/components/breadcrumbs/manifest.json`). It is one **Identity class**, `breadcrumbs`, on a `nav` that holds exactly one `ol` of at least two `li` steps. One **Attribute**, `data-size`, steps the text. It has no **Marker**, no **Module**, and no **Event** (`js: null`). Everything it does is CSS: a wrapping row of steps, a separator drawn before every step after the first from the token `--yeti-breadcrumbs-separator` with empty alternative text, muted links, and the current step drawn in the text colour at a strong weight, keyed on `aria-current` (`Y/src/components/breadcrumbs/breadcrumbs.css:21-36`).

An application developer using the package cannot write `class="breadcrumbs"` or `data-size`: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-size="small"` compiles and silently falls back to Yeti's default; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `breadcrumbs` **Item file** loaded while a trail is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the trail is a plain vertical list with no separators and no current-step look, with no error.

The accessibility of the trail rests on three things the markup carries, and two of them are the consumer's: the `nav` landmark's name (`aria-label` or `aria-labelledby`, the manifest's one required attribute), `aria-current="page"` on the current step, which is also the only hook Yeti's CSS has for the current step's look, and `role="list"` on the `ol`. In an Angular application the current step changes with the route, so the developer needs to know how to keep exactly one `aria-current="page"` in the trail, on the server and after every navigation, whether the trail binds it from its own data or lets the Router's `RouterLinkActive` write it. The separators must stay out of every accessible name, which they do only while they come from the token, never from markup.

## Solution

One directive in the secondary entry point `ngx-yeti/breadcrumbs` ([building-blocks.md](../building-blocks.md) Part 2 row 25; 1.3):

- **`YetiBreadcrumbs`**, the **Item directive**, on `nav[yetiBreadcrumbs]`, `exportAs: 'yetiBreadcrumbs'`. It binds `breadcrumbs` as a static host class, binds `data-size` from the typed input `size` (`YetiSizeControl`), sets the static presence attribute `data-ngx-yeti-item-breadcrumbs` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `breadcrumbs` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('breadcrumbs')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).

The developer writes `<nav yetiBreadcrumbs size="sm" aria-label="Breadcrumb">` where Yeti's docs write `<nav class="breadcrumbs" aria-label="Breadcrumb" data-size="sm">`. An unset `size` renders no attribute, so Yeti's own default (`md`) applies from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). The `ol` with `role="list"`, the `li` steps, the links, the `nav`'s name, and `aria-current="page"` stay the consumer's markup (Part 2 row 25; building-blocks 1.1 and 1.10). The `ol` and the steps get no directive: Yeti styles them by element and position only (building-blocks 1.1, "a child Yeti styles only by element and position gets no directive").

`aria-current="page"` has one writer per trail, chosen by the consumer (building-blocks 1.10 "Current page"; architecture-guide P11): either the consumer binds it on the last step from the trail's own data, or `RouterLinkActive` writes it on the link whose route matches exactly, with `ariaCurrentWhenActive="page"`. The package never writes it and declares no input for it.

The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond ADR 0060's styles service (Part 2, "Types only", with [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 18). The wrap, the separators, and the current-step look are Yeti's CSS, so they are right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to turn a `nav` into a breadcrumb trail with one directive attribute, so that I never write Yeti's `breadcrumbs` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="breadcrumbs"` and `data-size`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to step the trail's text with a `size` input typed by Yeti's `size-control` vocabulary, so that `size="small"` fails to compile.
4. As an application developer, I want a static `size="sm"` to type-check, so that I need no property binding for a constant.
5. As an application developer, I want an unset `size` to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
6. As an application developer, I want a static `size="sm"` to do nothing on the `nav` beyond the input, so that the HTML `size` attribute has no effect.
7. As an application developer, I want the directive to match only a `nav`, so that the trail is always a navigation landmark.
8. As an application developer, I want to write the `ol` and `li` steps as plain markup with no directive, so that the trail reads like Yeti's docs.
9. As an application developer, I want to render the steps with `@for` from my own trail data, so that the trail follows the route.
10. As an application developer, I want each step after the first preceded by Yeti's separator, so that I write no separator markup.
11. As an application developer, I want to change the separator for the whole site or one trail through `--yeti-breadcrumbs-separator`, so that a theme can use a chevron.
12. As an application developer, I want the trail to wrap onto further lines in a narrow container, so that a long trail never overflows.
13. As an application developer, I want to mark the current step with `aria-current="page"` bound from my trail data, so that the last step is current by construction.
14. As an application developer, I want the current step to be either plain text or a link to the page itself, as Yeti and the APG allow, so that I can choose.
15. As an application developer using the Router, I want `RouterLinkActive` with `ariaCurrentWhenActive="page"` and exact matching to mark the current link, so that the trail updates on navigation without code of mine.
16. As an application developer, I want to be told that `RouterLinkActive`'s default subset matching marks every ancestor step as current, so that I set exact matching.
17. As an application developer, I want to be told never to combine my own `aria-current` with `RouterLinkActive` on one element, so that the two writers do not undo each other.
18. As an application developer, I want the current step drawn in the text colour at a strong weight, so that it stands apart from the links by more than colour.
19. As an application developer, I want links that use `routerLink` to keep working, so that a step navigates inside the application.
20. As an application developer, I want to name the trail with my own `aria-label` and translate it with `i18n-aria-label`, so that the package renders no string of its own.
21. As an application developer, I want to bind `size` from a signal, so that the trail follows my state under zoneless change detection.
22. As an application developer, I want a template reference (`#crumbs="yetiBreadcrumbs"`), so that the directive follows the package's `exportAs` rule.
23. As an application developer, I want to import the directive from `ngx-yeti/breadcrumbs`, so that a `@defer` block can split it with the rest of the item.
24. As an application developer, I want the input value type re-exported by name (`YetiSizeControl`), so that I can type my own signal that feeds the input.
25. As an application developer, I want the breadcrumbs item file loaded when the first trail renders and removed after the last leaves, so that I do not import `breadcrumbs.css` globally.
26. As an application developer, I want the item file and the current step's `aria-current` in the server HTML, so that the first paint already shows the trail and its current step.
27. As an application developer, I want the trail readable and its links working with JavaScript off under SSR and prerendering, so that the page navigates before any script runs.
28. As an application developer, I want hydration to change nothing on the trail, so that I get no `NG05xx` error and no reflow.
29. As an application developer, I want a trail inside a `@defer (hydrate on ...)` block to stay styled before and after the block hydrates, so that incremental hydration does not unstyle it.
30. As an application developer, I want a trail inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated trail is not unstyled when a live one elsewhere leaves.
31. As an application developer, I want to know what a `hydrate never` trail cannot do (follow the route, run `routerLink`), so that I put a route-driven trail in live content.
32. As an application developer, I want to know that a trail inside a client-only `@defer` block needs `breadcrumbs` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
33. As an application developer using `withI18nSupport()`, I want translated step text and labels to hydrate without being re-rendered, so that localised pages keep the server's DOM.
34. As an application developer, I want a trail in the persistent shell to update its current step after each navigation, so that it never shows a stale current page.
35. As an application developer, I want the usage rules stated (a `nav` with a name, one `ol` with `role="list"`, at least two `li` steps, exactly one current step, separators only from the token, no static Yeti attributes), so that I use the item as Yeti intends.
36. As a screen-reader user, I want the trail announced as a navigation landmark named "Breadcrumb", so that I can find it from the landmarks list.
37. As a screen-reader user, I want the trail announced as a list with its count of steps, so that I know how deep the page sits.
38. As a screen-reader user, I want the current step announced as the current page, so that I know where I am.
39. As a screen-reader user, I want to hear the steps and never the separators, so that "slash" is not read between them.
40. As a keyboard user, I want each link step to be one Tab stop in DOM order, and the plain-text current step to be none, so that the trail adds no keyboard pattern to learn.
41. As a keyboard user, I want a visible focus ring on every link step, so that I can see where focus is.
42. As a low-vision user, I want the trail to wrap at 320 CSS px and at 200 % text size, so that I never scroll sideways to read it.
43. As a low-vision user who overrides text spacing, I want the steps to grow with their text, so that my settings clip nothing.
44. As a forced-colours user, I want the current step to stay distinguishable from the links, so that I can still see where I am.
45. As a right-to-left reader, I want the trail to run from right to left with each separator before its step, so that the trail reads in my direction.
46. As a package maintainer, I want the contract check to cover the class, `data-size`, and every value of its vocabulary, so that a pin move that adds a value or an attribute fails before release.
47. As a package maintainer, I want the SSR smoke to assert the server HTML of a trail, its current step, and its item link, so that the first paint is proven.
48. As a package maintainer, I want the fixture app to render a trail on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
49. As a package maintainer, I want the separator tests to follow Yeti's own `breadcrumbs.spec.js` cases, so that the package proves the same "seen and not read" behaviour Yeti proves.
50. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
51. As a package maintainer, I want the class name `YetiBreadcrumbs` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/breadcrumbs/manifest.json`, `breadcrumbs.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, `Y/src/base/reset.css`, and `Y/schema/vocabulary.json`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `breadcrumbs`, `component`, `Navigation` |
| `class` | `breadcrumbs` |
| `attributes` | `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The text step." |
| `classes`, `markers` | empty; no markers |
| `children` | `> ol` (min 1, max 1): "The trail, in order, with role=\"list\"." `li` (min 2, no max): "A step: a link, or plain text with aria-current=\"page\" for the last." |
| `tokens` | public: `--yeti-breadcrumbs-separator` ("The string between steps."), `--yeti-color-text-muted` ("The links and the separator."), `--yeti-text-md` and `--yeti-space-sm` (the defaults when `data-size` is absent), `--yeti-space-xs` ("Gap between steps, and between a step and its separator."), `--yeti-color-text` ("The current step, and a link under the pointer."), `--yeti-weight-strong` ("Weight of the current step."); private: `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby`; `keyboard`: empty; notes: "Put aria-label=\"Breadcrumb\" on the nav. The last step carries aria-current=\"page\", as plain text or as a link to the page itself. The separators are CSS with empty alternative text, so assistive tech reads only the steps. Put role=\"list\" on the ol." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `alternative text on generated content`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`breadcrumbs.css:3-37`): `.breadcrumbs:not([data-size])` supplies the private size tokens only when the attribute is absent (`:4`). `.breadcrumbs > ol` is a wrapping flex row with `gap: var(--yeti-space-xs)`, no margin, padding, or list style, at `font-size: var(--_yeti-size-text)` (`:5-14`). Each `li` is an `inline-flex` row with the same gap (`:15-20`). `li + li::before` draws `content: var(--yeti-breadcrumbs-separator) / ""` in the muted colour (`:21-24`): the part after the slash is the alternative text, empty, so the separator is drawn and left out of the accessibility tree. Links are muted with no underline, and take the text colour with an underline under the pointer (`:25-32`). `.breadcrumbs [aria-current]` sets the text colour and `--yeti-weight-strong` on whatever element carries it, a link or a plain `li` (`:33-36`); at specificity (0,2,0) it beats `.breadcrumbs a` (0,1,1), and `.breadcrumbs a:hover` (0,2,1) beats both. The item file uses `--_yeti-size-text` only; `--_yeti-size-space` is set and not read (read).

Rules the item relies on from the **Always-loaded group**: the `data-size` value rules, `[data-size="sm"]`, `"md"`, and `"lg"`, which set both private size tokens on any element (`Y/src/layouts/attributes.css:256-259`); the separator's default, `--yeti-breadcrumbs-separator: "/"` (`Y/src/tokens/components.css:43`; catalogue `Y/src/tokens/tokens.json:165`: "a theme may prefer \"›\""); `:is(ul, ol)[role="list"]`, which removes list markers and start padding (`Y/src/base/reset.css:83-86`); and the base `:focus-visible` ring (`Y/src/base/typography.css:101`). All quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows.

Attributes left to the consumer (building-blocks 1.1 and Part 2 row 25; ticket 26 maps only `data-size`, row 93): the `nav`'s `aria-label` or `aria-labelledby`, `role="list"` on the `ol`, and `aria-current="page"` on the current step, written by the consumer or by `RouterLinkActive`.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `breadcrumbs` | static host class on `nav[yetiBreadcrumbs]` (`YetiBreadcrumbs`) | always | ADR 0003 point 1; Part 2 row 25 |
| Attribute `data-size` | the text step | input `size` on `yetiBreadcrumbs`: `YetiSizeControl \| undefined`, bound `[attr.data-size]`, `null` when unset | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 93 (R); building-blocks 1.4 |
| Child `> ol` | the trail, with `role="list"` | no directive; `role="list"` is the consumer's static attribute, neither bound nor read | not applicable | building-blocks 1.1; Part 2 row 25 |
| Children `li` | the steps | no directive | not applicable | building-blocks 1.1 |
| `aria-current="page"` | the current step's state and its look | the consumer's binding or `RouterLinkActive`'s write; the package neither binds nor reads it | absent until a writer sets it | building-blocks 1.10 "Current page"; ADR 0019 point 3; architecture-guide P11 |
| Name (`aria-label`, `aria-labelledby`) | required on the `nav` | the consumer's static or bound attribute; no name input | not applicable | building-blocks 1.10 "Names"; manifest `a11y.requiredAttributes` |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-breadcrumbs-separator` | the separator string | the consumer's; the package writes none | Yeti's `"/"` | ADR 0004 |
| Tokens `--yeti-color-text-muted`, `--yeti-color-text`, `--yeti-weight-strong`, `--yeti-text-md`, `--yeti-space-sm`, `--yeti-space-xs`, and the `--yeti-text-*` and `--yeti-space-*` each size value reads | colours, weight, sizes, gaps | the consumer's | not applicable | ADR 0004 |
| Tokens `--_yeti-size-text`, `--_yeti-size-space` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-breadcrumbs=""` on the host | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The `inert` kind for `size` (ticket 26 row 93 and grilling question 15; building-blocks 1.4): HTML's `size` attribute applies to form controls (`input`, `select`), never to a `nav`, so a static `size="sm"` stays on the host beside `data-size="sm"` and does nothing, and the directive binds nothing for it.

The input value type is Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). It is the full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `breadcrumbs` has `js: null`, so there is no behaviour to list or map ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 25, "Yeti module: none"; [ticket 03](../issues/03-research-yeti-javascript-and-angular.md) puts it among the items whose gain is "only types").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-breadcrumbs-separator` for the separator, `--yeti-color-text-muted` for links and separators, `--yeti-color-text` and `--yeti-weight-strong` for the current step and a hovered link, `--yeti-space-xs` for both gaps, and `--yeti-text-md` by default (or the `--yeti-text-*` the set `size` names, through the always-loaded value rules). The package writes none and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; derived tokens such as the separator also take effect on one trail and its descendants (`Y/src/guides/theming.md:38`). The separator token's value is a CSS `content` list: a quoted string (`"›"`) or an image (`url(...)`), never a bare glyph, because an invalid value makes the whole `content` declaration invalid at computed-value time and no separator is drawn (inferred from the CSS custom-property model, not measured). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- No injection token, no parent, no part directives. The item has one directive, and nothing needs to find it (building-blocks 1.9 applies to items with parts).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other: the `nav` may also carry a utility such as `yetiPrint`, each item with its own presence attribute (ADR 0045).
- No Aria. Aria has no breadcrumb pattern, and the APG breadcrumb is met by Yeti's markup (Part 2 row 25; ticket 17 section 4.5). Toolbar was considered and not used: a breadcrumb is a list of links with `aria-current`, met by Yeti's markup ([Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md), section "Items where no Aria pattern fits any gap"). The user's rule to reach for Angular Aria only when it addresses an accessibility feature Yeti is missing (map, Standing rulings, When to use Angular Aria, paraphrased) gives no reason to reach for it.
- `RouterLinkActive` is the consumer's, from `@angular/router`, not hosted and not injected. The package has no dependency on the Router for this item.
- The only injection is the root styles service of ADR 0060, through `injectYetiItemStyles('breadcrumbs')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45), with which `YetiBreadcrumbs` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. A consumer who names the trail with `aria-labelledby` writes the heading's `id` and the reference, both static; the package does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiBreadcrumbs` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (the orchestrator's check of 2026-10-03 under ADR 0080), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `nav[yetiBreadcrumbs]` (Part 2 row 25) |
| `exportAs` | `yetiBreadcrumbs` (building-blocks 1.3) |
| Entry point | `ngx-yeti/breadcrumbs` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `size: YetiSizeControl \| undefined` (Yeti default `md`), `input()` with no default value |
| Host | static `class: 'breadcrumbs'`; static `data-ngx-yeti-item-breadcrumbs: ''`; `[attr.data-size]` from `size()`, `null` when unset |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('breadcrumbs')` |
| Models, outputs, methods, listeners | none |
| Lifecycle | `injectYetiItemStyles('breadcrumbs')` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `breadcrumbs` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 18, 42, and 45) |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `size="sm"` compiles and `size="small"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones; architecture-guide P23):

1. Put `yetiBreadcrumbs` on a `nav` and name it with `aria-label` (Yeti's docs use "Breadcrumb", translated with `i18n-aria-label`) or with `aria-labelledby` pointing at a visible heading (manifest `a11y.requiredAttributes`; building-blocks 1.10 "Names").
2. Give the `nav` exactly one direct child `ol`, written with `role="list"`, and give the `ol` at least two `li` steps (manifest `children`). The role restores the list's semantics in engines that lose them with `list-style: none` (manifest `a11y.notes`; the [timeline](timeline.md) spec's usage rule 2 for the same reset). A page with a one-step trail, such as the home page, shows no breadcrumbs (Yeti's docs: "A site two levels deep does not need one"). `@for`, `@if`, and `ng-container` add no element, so the `li` they render are the steps.
3. Write every step before the current one as a link, in order from the home page. Give each link its page's name as its text (WCAG 2.4.4).
4. Mark exactly one step, the last, with `aria-current="page"`: on the `li` when the step is plain text, on the `a` when it is a link to the page itself (manifest `a11y.notes`; `APG/breadcrumb/breadcrumb-pattern.html:46-47`). Yeti's CSS styles whatever carries the attribute, so an `li` holding a link would leave the link muted. The attribute has one writer per element (architecture-guide P11), one of:
   - (a) the consumer's own binding from the trail's data, such as `[attr.aria-current]="$last ? 'page' : null"` in a `@for`, or a static `aria-current="page"` on a step that is always the last;
   - (b) `RouterLinkActive` on each link, with `ariaCurrentWhenActive="page"` and `[routerLinkActiveOptions]="{exact: true}"`.

   The examples lead with form (a), and form (b) is documented beside it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87).
5. With form (b), always set exact matching. `RouterLinkActive`'s default is subset matching (`routerLinkActiveOptions` defaults to `{exact: false}`, `NGP/router/src/directives/router_link_active.ts:135-139`), so on `/docs/nav` the `/` and `/docs` steps match too, and the trail would carry three `aria-current="page"`.
6. Never combine your own `aria-current` with `routerLinkActive` on one element. `RouterLinkActive` writes the attribute when it matches and removes it otherwise, and removes it even when `ariaCurrentWhenActive` is unset (`router_link_active.ts:241-249`), so a second writer's value is lost after the next navigation.
7. Draw separators only through `--yeti-breadcrumbs-separator`. Never write a separator in markup (a `/`, a `›`, an icon), not even with `aria-hidden`, and never put `aria-hidden` on a step. A separator in markup is read, or, hidden, still adds a list item or a text node that the steps do not need (APG breadcrumb example, "Accessibility Features": separators "added via CSS" so they are not announced).
8. Do not write `class="breadcrumbs"`, `data-size`, or `data-ngx-yeti-item-breadcrumbs` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[size]="$any('xl')"`, ADR 0070).
9. Bind `size` and the trail's data from values that are the same on the server and the client, never from a browser-only read, because the hydration constraints require the same DOM on both sides.
10. Keep a trail that follows the route in content that hydrates. Inside `hydrate never`, Angular never runs, so form (a)'s bindings and form (b)'s `RouterLinkActive` never update after a client navigation, and a step's `routerLink` cannot navigate through the Router (section 10). A trail in a `hydrate never` block is right only for the route it was rendered on.
11. Import `YetiBreadcrumbs` in every component whose template writes the attribute. A **Forgotten import** with no bound input renders an unstyled list with no error; only a bound `[size]` makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `breadcrumbs` | Angular Material | Angular Router |
| --- | --- | --- | --- |
| Shape | an item directive on the consumer's `nav` | no breadcrumb component (checked: no file under `NC/src` mentions one) | `RouterLinkActive` on a link (`NGP/router/src/directives/router_link_active.ts:109-113`) |
| Current page | `aria-current="page"`, the consumer's or `RouterLinkActive`'s | not applicable | `ariaCurrentWhenActive` input (`:148`), written through `Renderer2` in a microtask after each `NavigationEnd` and on content init (`:228-258`) |
| Separator | Yeti's CSS, generated content with empty alternative text | not applicable | not applicable |
| `exportAs` | `yetiBreadcrumbs` | not applicable | `routerLinkActive` (`:111`) |

Nothing from Material applies, because Material has no breadcrumb. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one; the Router column is the Angular piece this spec's usage rules 4 to 6 depend on.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 25; building-blocks 1.2). The reason, Part 2 row 25's: the APG breadcrumb is met by Yeti's markup (ticket 17 section 4.5), so Yeti's CSS and the platform do the whole job, and the directive adds the class, the typed attribute, the item-file acquisition, and `exportAs`. Alternative text on generated content, the one feature the manifest lists as unguarded, is inside Baseline 2025 (Firefox 128, Safari 17.4; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), `alt-text-generated-content`), so the separator is "seen and not read" in every target browser. No Aria pattern applies (section 3), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read in script. The flex row follows the CSS `direction` by itself, so RTL needs no `Directionality`.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** Breadcrumb (`APG/breadcrumb/breadcrumb-pattern.html:40-52`): the trail is in a navigation landmark (`nav`), the landmark is labelled with `aria-label` or `aria-labelledby`, and the link to the current page has `aria-current="page"`, optional when the current step is not a link. Yeti's markup meets all three, with the consumer's name and `aria-current` (usage rules 1 and 4). Yeti asks for `aria-current` on a plain-text current step too, because its CSS keys the look on it (`breadcrumbs.css:33-36`), so usage rule 4 makes it required in both forms.
- **Roles:** `navigation` from the `nav`, `list` from the `ol` (kept by `role="list"`), `listitem` from each `li`, `link` from each `a`. The package adds none.
- **States:** `aria-current="page"` on the current step: one writer, the consumer's binding or `RouterLinkActive` (section 2).
- **Keyboard:** none of the item's own (manifest `keyboard` is empty; APG: "Not applicable"). Each link is one Tab stop in DOM order; the plain-text current step is not focusable.
- **Separators:** `li + li::before` with `content: var(--yeti-breadcrumbs-separator) / ""` (`breadcrumbs.css:21-24`). The empty alternative text keeps the separator out of the accessibility tree, so it is in no list item's text and no link's name (the separator sits in the `li`, before the `a`, never inside it). This is the APG's own reasoning: the trail's structure is already carried by the labelled landmark and the list, so a separator that reached assistive technology would only add verbosity (`APG/breadcrumb/examples/breadcrumb.html:66-72`). Yeti's own test asserts the alternative text (`Y/test/browser/components/breadcrumbs.spec.js:12-18`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The separator is decoration with empty alternative text, so it is ignored by assistive technology (section 7, Separators). Usage rule 7 keeps separators out of markup. Layer 4 asserts that no separator character is in the accessibility tree in three engines. |
| 1.3.1 Info and Relationships | The landmark, the list and its items, and the current state come from the `nav`, the `ol` with `role="list"`, the `li` steps, and `aria-current` (usage rules 1, 2, and 4). The directive adds no role. |
| 1.3.2 Meaningful Sequence | The steps are in DOM order, from the home page to the current one; the flex row never reorders them (usage rule 3). |
| 1.4.1 Use of Color | The current step differs from the links by weight as well as colour (`breadcrumbs.css:33-36`). A link differs from the plain-text current step by colour and by being a link; the steps sit in a navigation block, not running text, so axe's `link-in-text-block` does not apply (read). Layer 1 asserts the weight difference, as Yeti's test does. |
| 1.4.3 Contrast (Minimum) | Links and the current step are text on the page surface; axe reported no violation and no incomplete result on the breadcrumbs example in either scheme (ticket 17 section 2.1; building-blocks 1.10, which names the five items axe left incomplete, breadcrumbs not among them), so the **Story gate** covers them ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3 asks a play function only for what axe does not check). The separator is generated content, which axe does not check; it is decoration and no ratio is asserted for it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 89). |
| 1.4.4 Resize Text, 1.4.10 Reflow | The row wraps (`flex-wrap: wrap`), and sizes are `rem`-based tokens. Ticket 17 measured no page-level horizontal scroll on the breadcrumbs example at 320 x 640 in Chromium (section 2.4, 46 of 49 pages clean). Layer 4 asserts it at a 320 px viewport with a long trail and at 200 % text zoom. |
| 1.4.12 Text Spacing | The rules set no height and no overflow; steps grow with their text (read). |
| 2.4.3 Focus Order | Tab follows DOM order in left-to-right and right-to-left pages (layer 1, `breadcrumbs--rtl`). |
| 2.4.4 Link Purpose (In Context) | Each link's text is its page's name (usage rule 3); the separator is not in the name. |
| 2.4.6 Headings and Labels | The landmark's label is the consumer's (usage rule 1); the stories use "Breadcrumb", as Yeti and the APG do. |
| 2.4.7 Focus Visible | Yeti's base `:focus-visible` ring on every link (`Y/src/base/typography.css:101`); ticket 17 found a 2 px ring at every Tab stop (building-blocks 1.10). |
| 2.5.8 Target Size (Minimum) | axe's `target-size` ran and passed on the breadcrumbs example (2 nodes, Chromium; ticket 17 section 2.1). The Story gate runs it on every size story, `sm` included. |
| 4.1.2 Name, Role, Value | The landmark's name, the links' names, and the current state are exposed by native elements and `aria-current`. |

Forced colours (not an AA criterion of its own; ticket 17 section 2.6): Yeti has no `forced-colors` rule. Ticket 17 did not measure the breadcrumbs page under forced colours. The current step keeps its strong weight there, as the toc's current link was measured to (ticket 17 section 2.6: "the current link survives (bold)"), so this spec expects it to stay distinguishable, adds no package CSS or ledger row, and has layer 4 assert it. If that assertion fails, a ledger row owned by `breadcrumbs` and one `@layer ngx-yeti` rule follow, after A11Y-1f ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88).

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 25, "Ledger: none"). The package adds no accessibility or standards feature that Yeti lacks: `aria-current` from `RouterLinkActive` is documented usage, not a record or a package feature ([ticket 08](../issues/08-decide-inherited-adrs.md), old ADR 0042's row).

### 8. Rendered HTML

Consumer markup, after Yeti's example, with the trail from the consumer's own data (usage rule 4, form (a)):

```html
<nav yetiBreadcrumbs size="sm" aria-label="Breadcrumb" i18n-aria-label>
  <ol role="list">
    @for (step of trail(); track step.url) {
      <li [attr.aria-current]="$last ? 'page' : null">
        @if ($last) {
          {{ step.label }}
        } @else {
          <a [routerLink]="step.url">{{ step.label }}</a>
        }
      </li>
    }
  </ol>
</nav>
```

On `/docs/nav`, the server HTML and the hydrated DOM are the same. The `nav` carries `yetibreadcrumbs=""`, `size="sm"` (inert), `aria-label="Breadcrumb"`, `class="breadcrumbs"`, `data-size="sm"`, and `data-ngx-yeti-item-breadcrumbs=""`. The `ol` carries `role="list"`. The first two `li` hold `a` elements with `href="/"` and `href="/docs"` (resolved by `RouterLink` against `<base href>`), and the last `li` carries `aria-current="page"` and the text "Nav". The `a` elements carry `RouterLink`'s own `jsaction` for its `click` listener; the `nav` carries none from the package.

With form (b), every step is a link, `<a routerLink="/docs/nav" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{exact: true}">Nav</a>`, and `aria-current="page"` is on the matching `a` instead of an `li`. Whether the server HTML carries it depends on `RouterLinkActive`'s microtask running before serialization (inferred; layer 3 asserts it). If that check fails, form (b) becomes a client-rendered-only usage rule and leaves the JavaScript-off e2e case ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87).

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/breadcrumbs/breadcrumbs.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="breadcrumbs"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:49`). The client adopts it at bootstrap. The item has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiBreadcrumbs` and `size` where the docs write `class="breadcrumbs"` and `data-size`; the `href="#"` placeholders of Yeti's example become real routes, which the package does not change.

### 9. Animation

None. The item has no state transition the package drives, and Yeti's CSS has none for it beyond a link's hover colour. A step the consumer inserts with `@for` may carry a class-form `animate.enter` of the consumer's (building-blocks 1.6 rule 2), never on a server-rendered trail (ADR 0011 clause 12). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-size`, the consumer's name, list role, and `aria-current`, and the item link in `<head>` (section 8). Everything the directive renders at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state** of the package: no person and no Yeti module can change `data-size`. `aria-current` changes only on navigation, which before hydration is a full document load that renders the new trail on the server.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; the binding computed from the same input gives the same value (usage rule 9); 0 style mutations (ADR 0060 point 5, measured for the mechanism). With form (b), `RouterLinkActive` writes the same `aria-current` again through `Renderer2` once the Router has navigated (`router_link_active.ts:228-249`), which changes no node (inferred; layer 4 asserts no `NG05xx`).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the trail and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A click on a `routerLink` step inside a block that has not hydrated is held by Angular's dispatcher, which cancels the native navigation of an `<a>` carrying `jsaction` (ADR 0011 clause 3), and is replayed through the Router once the block hydrates (inferred; layer 4 measures it under `hydrate on interaction`).
- **`hydrate never`:** the trail is its server HTML and stays styled while its host is connected, whatever live trails do (ADR 0060 point 4; ADR 0045). It never follows a client navigation (usage rule 10). Whether a `routerLink` step inside it navigates natively or is held by a dispatcher that never replays is not measured; layer 4 records it. If the click is held and never replayed, usage rule 10 extends to plain `href` links without `routerLink` inside `hydrate never` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 90).
- **Client-only `@defer`:** the item file is fetched when `YetiBreadcrumbs` is constructed, which can show unstyled frames (a vertical list, no separators); the consumer closes the gap with `provideYetiStyles({ preload: ['breadcrumbs'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing of the package replays and it adds no `jsaction`. A consumer `routerLink` declares Angular's `click` listener on its `a`, which replays (building-blocks 1.11).
- **`withI18nSupport()`:** the `aria-label` and step text are usually translated with `i18n` in the consumer's component; that component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** `size` is an `input()` signal read by a host binding, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4). Form (a)'s trail is the consumer's signal; form (b)'s `RouterLinkActive` writes the DOM itself and calls `markForCheck()` (`router_link_active.ts:254`), so it needs no zone either (read).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the trail is readable, wrapped, separated, and shows its current step, and every link step navigates by its `href` as a full document load, because the class, the attribute, the consumer's `aria-current`, and the item link are in the server HTML. Nothing is lost: the item has no behaviour. With form (b), this holds only if `RouterLinkActive`'s attribute is in the server HTML (section 8). A client-only application gets no such promise.
- **Hydration boundary:** the trail is one element tree with no ids or references; a consumer `@defer` wraps the whole `nav` (building-blocks 1.11 decision 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-size` comes from an input whose value usage rule 9 keeps equal on both sides; form (a)'s `aria-current` comes from the same trail data on both sides; form (b)'s comes from the same URL.
- **No direct DOM manipulation:** the directive writes nothing outside host bindings. The item link is the ADR 0060 service's. `RouterLinkActive`'s `Renderer2` attribute write is Angular's own and changes no node.
- **Valid HTML:** `nav > ol > li` with `a` or text is valid; the parser repairs nothing. A step is never a `div` inside the `ol` (usage rule 2).
- **`preserveWhitespaces`:** the directive has no template. White-space-only text in the flex `ol` is not a flex item, and `li + li` counts elements only, so whitespace changes neither the separators nor the layout.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 8 keeps the consumer from writing them. The static `size` is `inert` and never bound, so hydration writes back the same value the server rendered. `aria-current`, `aria-label`, and `role="list"` are attributes the directive does not bind.

### 12. Single-page application

The item uses neither [navigation-close](navigation-close.md) (it has no open state) nor [fragment-links](fragment-links.md) (its steps are routes, not fragments; a bare `href="#"` from Yeti's example is never shipped, usage rule 3). On a route change:

- A trail inside the routed view leaves with the route and is rendered again by the next one; the item link is removed in the animation frame after no `[data-ngx-yeti-item-breadcrumbs]` host is connected, and re-inserted when a route renders a trail (ADR 0060 point 4; ADR 0045).
- A trail in the persistent shell outside the `router-outlet` stays. With form (a), its steps follow the consumer's trail signal; with form (b), `RouterLinkActive` moves `aria-current` after each `NavigationEnd` (`router_link_active.ts:176-180`). Either way exactly one step is current after each navigation (layer 4).

### 13. Item file

`yeti-css/css/components/breadcrumbs/breadcrumbs.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiBreadcrumbs]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:49`, after `nav` and before `pagination`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-breadcrumbs` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-size]` value rules, the separator's default, the `role="list"` reset, and the focus ring), and optionally `provideYetiStyles({ preload: ['breadcrumbs'] })`. The item adds nothing to it. Cross-item files acquired: none (`breadcrumbs.css` has no cross-item rule, and no other item's rule targets `.breadcrumbs`; ADR 0060 point 9; read).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attribute in the DOM, the item link, the accessibility tree (landmark, name, list, current state, no separator text), where the steps land, and the computed separator content. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a separator test reads the token's computed value and checks that the `::before` content is that value followed by empty alternative text, as Yeti's own test does with the default; a size test compares the `ol`'s font size with a probe element styled `font-size: var(--yeti-text-<size>)` in the same story. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `breadcrumbs` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**), which includes `target-size` and `color-contrast`. Links in stories use `href` paths under a no-op router, so a click does not leave the story. Story ids:

- `breadcrumbs--default`: Yeti's example (three steps, the last plain text with `aria-current="page"`). Asserts the `nav`'s `class` is `breadcrumbs`, `data-ngx-yeti-item-breadcrumbs` is present, and no `data-size`; the `nav` is a navigation landmark named "Breadcrumb", holding a list of three items; the first `li`'s `::before` content is `none`; every later `li`'s `::before` content is the computed `--yeti-breadcrumbs-separator` followed by `/ ""` (`Y/test/browser/components/breadcrumbs.spec.js:12-18`); the current step's computed `color` differs from a link's and its `font-weight` is greater (`:20-24`); Tab visits the two links in order and does not stop on the current step.
- `breadcrumbs--current-link`: the last step as a link to the page itself, `aria-current="page"` on the `a`. Asserts the link has the strong weight and the text colour, unlike the other links, and that exactly one element in the trail carries `aria-current`.
- `breadcrumbs--sizes`: three trails with `size` `sm`, `md`, `lg`, and a Storybook control binding `size` on a fourth. Asserts each `data-size` value; each `ol`'s computed font size equals its probe's; setting the control to unset removes `data-size` and the font size equals the `md` probe's. Asserts a static `size="sm"` stays on the host beside `data-size="sm"` (the `inert` kind).
- `breadcrumbs--separator-token`: a trail with `--yeti-breadcrumbs-separator: "›"` set on the `nav` in the story's style. Asserts every later `li`'s `::before` content contains `"›"` and ends with `/ ""`, and the list items' accessible names contain no `›`.
- `breadcrumbs--wrapping`: a six-step trail in a 200 px container. Asserts the steps wrap onto more than one line, no step overflows the container, and each separator stays at the inline start of its own step.
- `breadcrumbs--rtl`: `breadcrumbs--default` inside `dir="rtl"`. Asserts the first step is the rightmost, each separator sits on the inline-start (right) side of its step, and Tab follows DOM order.

### Layer 2: browser-level (`npx nx test <lib>`, `breadcrumbs.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiBreadcrumbs, { tagName: 'nav' })`: the host has class `breadcrumbs` and `data-ngx-yeti-item-breadcrumbs`, and no `data-size`; with `bindings` setting `size`, `data-size` follows after `whenStable()`, and binding `undefined` removes it.
- While a fixture lives, one `<link data-ngx-yeti-styles="breadcrumbs">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and no attribute other than the class, `data-size`, and the presence attribute: a consumer's `aria-label`, `class`, and a static `aria-current` elsewhere in the trail are left as written.

A small test host covers what `createDirective` cannot: the template reference `#c="yetiBreadcrumbs"` resolves; a static `size="sm"` renders both `size="sm"` and `data-size="sm"`; and, with `provideRouter` and three routes, `RouterTestingHarness` navigating to `/docs/nav` leaves exactly one `aria-current="page"` in a form (b) trail with exact matching, on the `/docs/nav` link, and moves it to the `/docs` link after navigating there. The same harness with the default subset matching leaves three, which is the evidence for usage rule 5. A form (a) trail driven by a signal moves `aria-current` to the new last step when the signal changes.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `breadcrumbs.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()`, `provideRouter` with three routes, and the URL `/docs/nav` (building-blocks 1.11 decision 11, 1.12). Two fixtures, one per form of usage rule 4, each with `aria-label="Breadcrumb" i18n-aria-label`, a static `size="sm"`, and an `i18n` step text: `whenStable()` resolves; the `nav` renders `class="breadcrumbs"`, `data-size="sm"`, `size="sm"`, and `data-ngx-yeti-item-breadcrumbs`; the `ol` keeps `role="list"`; exactly one element carries `aria-current="page"`, the last `li` in form (a) and the `/docs/nav` link in form (b); `<head>` holds one item link with `data-ngx-yeti-styles="breadcrumbs"`, `data-beasties-skip`, and an `href` ending `components/breadcrumbs/breadcrumbs.css?v=<pin>`; the `nav` carries no `jsaction`. The form (b) assertion is the check [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87 names: if it fails, form (b) becomes a client-rendered-only usage rule.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `breadcrumbs` has `YetiBreadcrumbs`; `data-size` has an input whose union equals the manifest's vocabulary `size-control`; the item has no markers and no events. A pin move that adds an attribute, a value, or a marker fails here before any story does. The attribute-and-value check over the stories (building-blocks 1.12) covers every `data-size` value they render.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids:

- `breadcrumbs--default` and `breadcrumbs--separator-token`: the accessibility tree of the `nav` (an ARIA snapshot) is a navigation landmark named "Breadcrumb" holding a list of the steps, with the current one marked current, and contains no `/` or `›` text, in Chromium, Firefox, and WebKit (1.1.1). WebKit's Tab skips links by default (ticket 17 section 1), so the WebKit focus case uses `element.focus()`, as ticket 17 did.
- `breadcrumbs--wrapping`: at a 320 px viewport the page has no horizontal overflow; at 200 % text zoom the trail still wraps inside its container (1.4.4, 1.4.10).
- `breadcrumbs--default` under `emulateMedia({ forcedColors: 'active' })` in Chromium and Firefox: the current step's computed `font-weight` stays greater than a link's, and a screenshot is recorded ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88).

Fixture-app half, built with `outputMode: 'server'`, with a `/docs/nav` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). Each route renders a form (a) trail in the routed view and a form (b) trail in the persistent shell:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; `aria-current="page"` is on the same element before and after hydration, in both trails;
- with JavaScript disabled, both trails show their current step with the strong weight, `@axe-core/playwright` with the six tags reports no violation, and clicking the `/docs` step loads `/docs` as a new document whose trails mark `/docs` current;
- with JavaScript on, clicking the `/docs` step navigates through the Router; afterwards each trail has exactly one `aria-current="page"`, on its `/docs` step;
- with `main.js` held back, a click on the `/docs` step before hydration is replayed and ends on `/docs` (event replay; building-blocks 1.11);
- a trail inside a `@defer (hydrate on interaction)` block: a click on a step hydrates the block and navigates through the Router;
- a trail inside a `hydrate never` block keeps its item link after every live trail on the page is removed (ADR 0045); a click on its `routerLink` step is recorded, not asserted (does the browser navigate, does the Router, or does nothing happen) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 90);
- a trail inside a client-only `@defer` block with `breadcrumbs` in the preload list shows no unstyled frame;
- navigating from the route to one without a routed trail removes nothing while the shell trail remains, and the item link is removed only on a page with no trail at all.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/breadcrumbs.spec.js` with the fixture `test/browser/fixtures/components/breadcrumbs.html` for the separator, current-step, and axe cases; the APG breadcrumb example for the accessibility features; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; the [sidebar](sidebar.md) spec's probe technique for token-independent sizes.

## Out of Scope

- An input for the trail's name, its separator, or the current step: the name is the consumer's (building-blocks 1.10 "Names"), the separator is a token (ADR 0004), and `aria-current` is the consumer's or `RouterLinkActive`'s (building-blocks 1.10 "Current page").
- A directive for the `ol` or the steps, or a component that renders the trail from route data (building-blocks 1.1; Part 2 row 25). Building a trail from the Router's route tree is application behaviour (architecture-guide P15).
- Writing `aria-current` from the package, or wrapping `RouterLinkActive` (ticket 08, old ADR 0042's row: documented usage, not a record).
- Collapsing a long trail behind an overflow button: Yeti has no such behaviour; its trail wraps.
- Any check that the host has one `ol`, at least two steps, exactly one `aria-current`, a name, or no separator in markup. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the item, unless the forced-colours assertion fails ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88; building-blocks 1.13).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `nav[yetiBreadcrumbs]` with `size`; no part directives | building-blocks Part 2 row 25; ticket 26 row 93; [Decide: the spec list](../issues/11-decide-spec-list.md) row 25 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| `size` typed by Yeti's `YetiSizeControl`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert` on a `nav` | building-blocks 1.4; ticket 26 row 93, grilling question 15 |
| The name, `role="list"`, and `aria-current="page"` are the consumer's, or `RouterLinkActive`'s for `aria-current` | building-blocks 1.1, 1.10 "Names" and "Current page"; Part 2 row 25; ADR 0019 point 3 |
| One writer of `aria-current` per element; exact matching with `RouterLinkActive` | architecture-guide P11; `RouterLinkActive` source (read) |
| Examples lead with the consumer's binding from trail data | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 87 |
| No Aria, no CDK | building-blocks 1.2; Part 2 row 25; map, Standing rulings (When to use Angular Aria) |
| The separator stays Yeti's generated content with empty alternative text | Yeti's CSS; manifest `a11y.notes`; ADR 0004 for the token |
| The presence attribute and the item file | ADR 0045; ADR 0060 points 2 to 6 |
| `injectYetiItemStyles('breadcrumbs')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `exportAs`; the class name has no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/breadcrumbs` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 25 and "Types only"; ticket 50 decision 18 |
| No ledger row; forced colours measured, not assumed | Part 2 row 25; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 88 |
| No contrast assertion beyond the Story gate | ADR 0015 point 3; ticket 17 section 3; ticket 50 decision 8 for any assertion added later |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A trail built from route data, the last step current by construction (form (a)):

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBreadcrumbs } from 'ngx-yeti/breadcrumbs';

export interface Step {
  readonly url: string;
  readonly label: string;
}

@Component({
  selector: 'app-trail',
  imports: [YetiBreadcrumbs, RouterLink],
  template: `
    <nav yetiBreadcrumbs aria-label="Breadcrumb" i18n-aria-label>
      <ol role="list">
        @for (step of steps(); track step.url) {
          <li [attr.aria-current]="$last ? 'page' : null">
            @if ($last) {
              {{ step.label }}
            } @else {
              <a [routerLink]="step.url">{{ step.label }}</a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trail {
  readonly steps = input.required<readonly Step[]>();
}
```

Every step a link, with the Router marking the current one (form (b)); exact matching keeps the home and section steps from matching too:

```html
<nav yetiBreadcrumbs size="sm" aria-label="Breadcrumb" i18n-aria-label>
  <ol role="list">
    <li><a routerLink="/" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }" i18n>Home</a></li>
    <li><a routerLink="/docs" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }" i18n>Docs</a></li>
    <li><a routerLink="/docs/nav" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }" i18n>Nav</a></li>
  </ol>
</nav>
```

The imports are `YetiBreadcrumbs`, `RouterLink`, and `RouterLinkActive`.

A trail named by a visible heading: `<h2 id="trail-label" i18n>You are here</h2>` before `<nav yetiBreadcrumbs aria-labelledby="trail-label">`.

A chevron separator for the whole site, with a mirrored one in right-to-left pages, in the consumer's stylesheet after Yeti (`Y/src/tokens/tokens.json:165`; the RTL rule is inferred, not measured):

```css
:root {
  --yeti-breadcrumbs-separator: "›";
}
:root:dir(rtl) {
  --yeti-breadcrumbs-separator: "‹";
}
```

A trail whose page renders it inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['breadcrumbs'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/breadcrumbs/breadcrumbs.css`, loaded by `YetiBreadcrumbs` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css:256-259` maps `data-size` to the private size tokens; `tokens/components.css:43` declares the separator's default; `base/reset.css:83-86` removes list markers for `role="list"`; `base/typography.css:101` draws the focus ring.
3. **Cross-item rules:** none. No other item file targets `.breadcrumbs`, and `breadcrumbs.css` targets no other item (read).
4. **Tokens:** reads `--yeti-breadcrumbs-separator`, `--yeti-color-text-muted`, `--yeti-color-text`, `--yeti-weight-strong`, `--yeti-space-xs`, and `--yeti-text-md` or the `--yeti-text-*` a set `size` names; writes none (section 2).
5. **What breaks without the item file:** the trail renders as a vertical list with no markers (the `role="list"` reset) and no separators; links take the base link colour and the current step has no strong weight, so it is marked for assistive technology only. The `data-size` attribute still sets private tokens that nothing reads. No error is reported.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `breadcrumbs` and `data-size` produced none.

### Platform features to adopt when the browser target moves

None. Alternative text on generated content, the one unguarded feature, is inside Baseline 2025 (section 6), and Yeti guards nothing for this item. Nothing was checked against web-features data for this spec beyond ticket 01's table.

### Single-page-application pieces relied on

None of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). The item relies on ADR 0060's styles service for route changes, and on the consumer's `RouterLink` and, in form (b), `RouterLinkActive` (section 12).
