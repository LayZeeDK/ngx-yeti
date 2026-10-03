# Spec: badge (component item)

Ticket: [74. Spec: badge (component)](../issues/74-spec-badge.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 24 and Part 1 (1.3, 1.4, 1.10 to 1.14), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 90 to 92 and grilling questions 6 and 15, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 6, 7, 8, 10, 18, 29, and 42), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row (Part 2 row 24). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 77 and 78), and each is cited where it applies.

## Problem Statement

Yeti's `badge` is "a small inline label for a status or a count, tinted by a hue" (`Y/src/components/badge/manifest.json`): "a status beside a title, a count on a tab, a version next to a heading" (`docs.md`). It replaces Foundation 6's separate label and badge, "so every label-and-badge combination version 6 shipped is three attributes on one class" (`Y/src/guides/migrating.md:95`). It is one **Identity class**, `badge`, on an inline element, and three **Attributes**: `data-variant` (which hue tints it), `data-emphasis` (a subtle tint, a solid fill, or the text alone), and `data-size` (the text size it sits beside; it renders one step smaller). An optional `svg` child is sized to the text. It has no **Module**, no **Marker**, and no **Event**.

An application developer using the package cannot write `class="badge"` or any of those `data-*` attributes: a consumer writes no Yeti class or attribute, and the directive binds them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-variant="succes"` or `data-emphasis="strong"` compiles and silently falls back to Yeti's default; here it must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `badge` **Item file** loaded while a badge is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it a badge is plain text with no tint, padding, or pill corner, and no error.

The item's accessibility is in its words, not in the package. Yeti's manifest says: "A badge is text. If the color carries meaning, the text must carry it too. A count that belongs to a control goes into that control's accessible name, not beside it." The package cannot read whether a word carries the meaning or whether a count belongs to a control, so it must state those requirements, show them in every example, and assert them in every story ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4). Its text contrast must hold at 4.5:1 for every hue, emphasis, and scheme a story shows (ticket 50 decision 8), and [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md) measured the badge itself losing its styles in a `hydrate never` block under a `styleUrl` loader, the failure ADR 0060 exists to close.

## Solution

One directive in the secondary entry point `ngx-yeti/badge` ([building-blocks.md](../building-blocks.md) Part 2 row 24; 1.3):

- **`YetiBadge`**, the **Item directive**, on `[yetiBadge]`, `exportAs: 'yetiBadge'`. It binds `badge` as a static host class, and binds `data-variant`, `data-emphasis`, and `data-size` from the typed inputs `variant` (`YetiVariant`), `emphasis` (`YetiEmphasis`), and `size` (`YetiSizeControl`). It sets the static presence attribute `data-ngx-yeti-item-badge` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `badge` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2).

The developer writes `<span yetiBadge variant="success">Live</span>` where Yeti's docs write `<span class="badge" data-variant="success">Live</span>`. An unset input renders no attribute, so Yeti's own defaults (`primary`, `medium`, `md`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). The optional `svg` child takes no directive.

The directive is **types only**: no listener, no render callback, no service of its own, and no DI beyond the styles service every item directive uses (Part 2, "Types only", with ticket 50 decision 18). Everything visible is Yeti's CSS, so a badge is right on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to mark a word or number as a badge with one directive attribute, so that I never write Yeti's `badge` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="badge"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want a badge with no inputs to be Yeti's quiet default, a subtle primary tint with the hue's text, so that the common case needs no configuration.
4. As an application developer, I want a `variant` input typed by Yeti's `variant` vocabulary, so that `variant="succes"` fails to compile.
5. As an application developer, I want an `emphasis` input typed by Yeti's `emphasis` vocabulary, so that I can pick `high` for the one state that must stand out and `low` for text alone.
6. As an application developer, I want a `size` input typed by Yeti's `size-control` vocabulary, so that a badge beside large text steps up with it.
7. As an application developer, I want a static attribute such as `variant="success"` to type-check, so that I need no property binding for a constant.
8. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
9. As an application developer, I want to bind `variant` from a status signal, so that a deploy badge turns from `warning` to `success` when my state changes, under zoneless change detection.
10. As an application developer, I want a static `size="sm"` to do nothing beyond the input, so that the HTML `size` attribute has no effect on my element.
11. As an application developer, I want the `black` and `white` variants for a badge on a painted band, so that it reads the same in both schemes, as Yeti's docs advise.
12. As an application developer, I want an optional inline icon in a badge sized to its text, so that a status can carry a glyph beside its word.
13. As an application developer, I want the package never to add a role, `aria-hidden`, or a name to my badge or its icon, so that the badge stays the text I wrote.
14. As an application developer, I want the rule for counts on controls stated and shown, so that a count on a tab or button becomes part of the control's name rather than a separate reading.
15. As an application developer, I want a badge inside a heading to stay part of the heading's text, so that "Release notes New" is announced as one heading.
16. As an application developer, I want a badge to keep its own letter spacing inside a tracked heading, so that it does not inherit the heading's tightening at a smaller size.
17. As an application developer, I want to set the badge's corner and weight through `--yeti-badge-radius` and `--yeti-badge-weight`, so that a theme changes every badge with no input.
18. As an application developer, I want `yetiBadge` beside `yetiPaint`, `yetiText`, or `yetiBorder` on one element to declare no input of theirs, so that the directives compose with no shared-name conflict.
19. As an application developer, I want the badge item file loaded when the first badge renders and removed after the last leaves, so that I do not import `badge.css` globally.
20. As an application developer, I want the item file in the server HTML when a server-rendered page has a badge, so that the first paint is already tinted.
21. As an application developer, I want a badge right with JavaScript off under SSR and prerendering, so that the page reads before any script runs.
22. As an application developer, I want hydration to change nothing on a badge, so that I get no `NG05xx` error and no flash.
23. As an application developer, I want a badge inside a `@defer (hydrate on ...)` block to stay styled before and after the block hydrates, so that incremental hydration does not strip it.
24. As an application developer, I want a badge inside a `hydrate never` block to keep its styles for as long as it is on the page, so that it is not unstyled when a live badge elsewhere leaves.
25. As an application developer, I want to know that a badge inside a client-only `@defer` block needs `badge` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
26. As an application developer using `withI18nSupport()`, I want a translated badge word to hydrate without being re-rendered, so that localised pages keep the server's DOM.
27. As an application developer, I want a template reference (`#b="yetiBadge"`), so that the directive follows the package's `exportAs` rule.
28. As an application developer, I want to import the directive from `ngx-yeti/badge`, so that a `@defer` block can split it with the rest of the item.
29. As an application developer, I want the input value types re-exported by name (`YetiVariant`, `YetiEmphasis`, `YetiSizeControl`), so that I can type my own signals that feed the inputs.
30. As an application developer, I want the usage rules stated (a non-interactive inline host, a short word or number, the word carries the meaning, counts in the control's name, the constants on painted bands, no static Yeti attributes), so that I use the badge as Yeti intends.
31. As a screen-reader user, I want a badge read as the plain text it shows, so that "Live" and "Draft" mean the same with no colour.
32. As a screen-reader user, I want a count that belongs to a button or a tab to be part of that control's name, so that I hear "Inbox, 3 unread" when I reach the control, not a stray "3" after it.
33. As a colour-blind user, I want every badge's word to carry its meaning, so that a red and a green badge are told apart by what they say.
34. As a low-vision user, I want badge text to meet 4.5:1 against its tint or fill in the light and the dark scheme, so that I can read a badge one step smaller than the text around it.
35. As a low-vision user who zooms text, I want a badge to grow with the text around it, so that it stays one step smaller rather than fixed.
36. As a low-vision user who overrides text spacing, I want a badge to grow with its content, so that my spacing settings clip nothing.
37. As a forced-colours user, I want a badge's word to stay readable in system colours, so that the tint's loss takes no meaning with it.
38. As a package maintainer, I want the contract check to cover the three attributes and every value of their vocabularies, so that a pin move that adds a value fails before release.
39. As a package maintainer, I want the SSR smoke to assert the server HTML of a badge and its item link, so that the first paint is proven.
40. As a package maintainer, I want the fixture app to render badges on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
41. As a package maintainer, I want a `hydrate never` case that removes every live badge and checks the dehydrated one stays styled, so that ticket 18's measured failure cannot return.
42. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default fails no test for no reason.
43. As a package maintainer, I want the play functions to follow Yeti's own `badge.spec.js` cases and extend its contrast check to every hue and emphasis shown, so that the package proves what Yeti proves and more.
44. As a package maintainer, I want the class name `YetiBadge` checked against Yeti's typings at the pin, so that a future collision is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/badge/manifest.json`, `badge.css`, `docs.md`, and `example.html`, in `Y/src/layouts/attributes.css`, `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, and `Y/schema/vocabulary.json`, and in Yeti's test `Y/test/browser/components/badge.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `badge`, `component`, `Feedback` |
| `class` | `badge` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`, "Which hue tints the badge." `data-emphasis`: enum, vocabulary `emphasis` (`high`, `medium`, `low`), default `medium`, "medium is a subtle tint with dark text, high a solid fill, low text alone." `data-size`: enum, vocabulary `size-control` (`sm`, `md`, `lg`), default `md`, "The text size the badge sits beside; the badge renders one step smaller." |
| `classes` | empty |
| `children` | `> svg` (min 0, max 1): "An optional icon, sized to the text." |
| `markers` | none |
| `tokens` | public: `--yeti-badge-radius`, `--yeti-badge-weight`, `--yeti-stretch-small`, `--yeti-space-xs`, `--yeti-leading-tight`, `--yeti-border-width`, the five `--yeti-color-primary*` stops and `--yeti-on-primary` (the default variant), `--yeti-text-md` and `--yeti-space-sm` (the default size); private: `--_yeti-variant`, `--_yeti-variant-subtle`, `--_yeti-variant-text`, `--_yeti-on-variant`, `--_yeti-size-text`, `--_yeti-variant-soft`, `--_yeti-variant-strong`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "A badge is text. If the color carries meaning, the text must carry it too. A count that belongs to a control goes into that control's accessible name, not beside it." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `inline flexbox`; `guarded`: empty |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components`: `.badge` is `inline-flex` with centred items, a `--yeti-space-xs` gap, `0.15em 0.6em` padding, `font-size: calc(var(--_yeti-size-text) * 0.8)`, `font-stretch: var(--yeti-stretch-small)`, `font-weight: var(--yeti-badge-weight)`, `line-height: var(--yeti-leading-tight)`, `letter-spacing: normal` (so a badge in a tracked heading does not inherit the heading's tightening as an absolute length), `white-space: nowrap`, a transparent border of `--yeti-border-width`, `border-radius: var(--yeti-badge-radius)`, the subtle tint as background and the hue's text colour. `.badge:not([data-variant])` and `.badge:not([data-size])` supply the primary ladder and the `md` step only when the attribute is absent. `[data-emphasis="high"]` fills with the hue and writes in its on-colour; `[data-emphasis="low"]` makes the background transparent and removes the inline padding. `.badge > svg` is `1em` square with `flex: none`.

The value rules for `data-variant` and `data-size` are in the **Always-loaded group**: `[data-variant="<hue>"]` sets the six private ladder tokens (`Y/src/layouts/attributes.css:237-254`; `danger` reads the alert hue, `:246`; `black` and `white` are constants with translucent subtle and soft stops, `:253-254`), and `[data-size="sm|md|lg"]` sets the text and space steps (`:256-259`). `data-emphasis` has no value rule outside `badge.css`. `--yeti-badge-radius` defaults to `var(--yeti-radius-full)` and `--yeti-badge-weight` to `var(--yeti-weight-strong)` (`Y/src/tokens/components.css:14-15`), quoted at the pin as [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) allows. No other item's CSS names `.badge` (checked with `rg` over `Y/src/**/*.css`).

Attributes left to the consumer: none (ticket 26 rows 90 to 92). The element, its text, any `svg` child and its `aria-hidden`, and any ARIA on a control that holds the badge are the consumer's.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `badge` | static host class on `[yetiBadge]` (`YetiBadge`) | always | ADR 0003 point 1; Part 2 row 24 |
| Attribute `data-variant` | which hue tints the badge | input `variant`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies. `variant` is not an HTML attribute | ticket 26 row 90 (R) |
| Attribute `data-emphasis` | tint, fill, or text alone | input `emphasis`: `YetiEmphasis \| undefined`, `[attr.data-emphasis]` | unset renders nothing; Yeti's `medium` applies. Not an HTML attribute | ticket 26 row 91 (R) |
| Attribute `data-size` | the text size the badge sits beside | input `size`: `YetiSizeControl \| undefined`, `[attr.data-size]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (below) | ticket 26 row 92 (R); building-blocks 1.4 |
| Child `> svg` | an optional icon, one em square | the consumer's element; no directive | not applicable | manifest `children`; ticket 26 grilling question 6; building-blocks 1.1 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-badge-radius`, `--yeti-badge-weight` | the badge's own skin | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-stretch-small`, `--yeti-space-xs`, `--yeti-leading-tight`, `--yeti-border-width` | lettering width, icon gap, line height, border | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-color-<hue>*`, `--yeti-on-<hue>`, `--yeti-text-*`, `--yeti-space-*` | the ladder and step each value reads | the consumer's | not applicable | ADR 0004 |
| Private tokens `--_yeti-variant*`, `--_yeti-on-variant`, `--_yeti-size-*` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-badge=""` on `[yetiBadge]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | none: the item has no part that would read one | not applicable | building-blocks 1.9 |

The `inert` kind for `size` (building-blocks 1.4; ticket 26 row 92 and grilling question 15): HTML's `size` acts on `input` and `select` (and obsolete `font`, `hr`, and `basefont`), none of which is a badge's host. On the hosts usage rule 1 names, a static `size="sm"` stays on the host beside `data-size="sm"`, does nothing, and the directive binds nothing for it (ticket 26 row 92: "`inert` on Yeti's hosts"). The host list follows the manifest's "A badge is text" and Yeti's examples, which all use `span` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 77).

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). Each is a full vocabulary, so no `Extract` is needed.

**Module replaced:** none. Yeti's `badge` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 24, "Yeti module: none"; [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md) lists the badge among the items whose gain is "only types"). So no module behaviour is kept, changed, or removed, and the item uses neither Aria nor CDK.

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-badge-radius`, `--yeti-badge-weight`, `--yeti-stretch-small`, `--yeti-space-xs`, `--yeti-leading-tight`, and `--yeti-border-width`; with no `variant`, the primary stops and `--yeti-on-primary`; with no `size`, `--yeti-text-md`; and through the always-loaded value rules whichever hue's ladder and text step a set attribute names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; hues, chroma, and the scale only on `:root`, derived tokens on any element (`Y/src/guides/theming.md:38`). `--yeti-badge-radius` and `--yeti-badge-weight` are the badge's own skin surface, the tokens Yeti's theming guide names for a portable theme (`theming.md:117`); Yeti's `soft` and `sharp` themes are examples. Yeti's own test reads `--yeti-stretch-small` through a style tag (`badge.spec.js`, "reads the small lettering width axis"). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- One directive, no parts. The `svg` child is styled by element and position and takes no directive (building-blocks 1.1; ticket 26 grilling question 6). So the item provides no injection token (building-blocks 1.9: a token is the parent handle a part injects).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other. Yeti's examples put a badge inside a heading, a paragraph, a painted `box`, and a card footer (`docs.md`; `Y/src/components/card/example.html:6`), each a nested element, never the badge's own element.
- Shared input names (building-blocks 1.4, shared vocabularies): `variant` is `YetiVariant` on every item that declares it (alert, button, card, field, nav, pagination, progress, spinner, tabs, toc; ticket 26), `emphasis` is `YetiEmphasis` on alert and button and `Extract<YetiEmphasis, 'high'>` on tabs, and `size` is `YetiSizeControl` on every reader. The badge sits on its own element, so it never shares an element with those items in Yeti's markup; the any-element marker directives a consumer may write beside it (`yetiPaint`, `yetiText`, `yetiBorder`) declare selector-named inputs only ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind G), so no name collides.
- The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('badge')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiBadge` acquires and releases the item file (ticket 50 decision 18). That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The badge renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiBadge` |
| --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10; ADR 0080's 2026-10-03 note), so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `[yetiBadge]` (Part 2 row 24) |
| `exportAs` | `yetiBadge` (building-blocks 1.3) |
| Entry point | `ngx-yeti/badge` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `emphasis: YetiEmphasis \| undefined` (`medium`); `size: YetiSizeControl \| undefined` (`md`); each `input()` with no default value |
| Host | static `class: 'badge'`; static `data-ngx-yeti-item-badge: ''`; `[attr.data-variant]`, `[attr.data-emphasis]`, `[attr.data-size]` from the inputs, `null` when unset. No binding for HTML `size` (`inert`) |
| Providers | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('badge')` |
| Models, outputs, methods, listeners | none |
| Lifecycle | acquires the `badge` item file, on the server too, with `injectYetiItemStyles('badge')` as the last statement of its constructor (ticket 50 decisions 42 and 45), after anything there that can throw (nothing does today), and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decisions 18 and 42) |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `variant="success"` compiles and `variant="succes"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiBadge` on a non-interactive inline element, `span` as Yeti's examples do, or `strong`, `em`, `small`, `mark`, `data`, or `time` where that element's meaning fits. Not on a link, a button, or a form control: "A badge is text" (manifest `a11y.notes`), and HTML `size` is inert only on such hosts (section 2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 77). A badge may sit inside a link, a button, a tab, or a heading.
2. Write a word or a number, or a short phrase ("A word or a number that labels something else", `docs.md`). The badge does not wrap (`white-space: nowrap`), so a long phrase can overflow a narrow container (WCAG 1.4.10).
3. The word carries the meaning; the hue is decoration ("Color is decoration here; the word is the meaning", `docs.md`). Never rely on `variant` alone to say success, warning, or failure (WCAG 1.4.1).
4. A count that belongs to a control goes into that control's accessible name, not beside it (manifest `a11y.notes`). Put the badge inside the `button`, `a`, or tab, so that it is part of the name from content, or give the control an `aria-label` that contains the visible label and the count, in that order (WCAG 2.5.3, Label in Name). A count written beside the control is read as separate text.
5. On a painted band (`yetiPaint`, or a `box` with a paint), use `variant="black"` or `variant="white"`, whichever stands against the band, "the two constants, which read the same in both schemes" (`docs.md`). The hued variants are measured against the page surface only (section 7).
6. An `svg` child is the consumer's: give it `aria-hidden="true"`, because the badge's word is the name (rule 3), and draw it in `currentColor`. A badge holds at most one, as a direct child (manifest `children`).
7. Do not write `class="badge"`, `data-variant`, `data-emphasis`, `data-size`, or `data-ngx-yeti-item-badge` statically on the host. The directive binds them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `$any` (`[variant]="$any('info')"`, ADR 0070).
8. Bind every input from values that are the same on the server and the client, never from a browser-only read. The hydration constraints require the same DOM on both sides.
9. Import `YetiBadge` in every component whose template writes the attribute. A **Forgotten import** with only static inputs renders plain text with no class and no error; only a bound input (`[variant]`) makes the compiler report it (NG8002), or a template reference naming the `exportAs` (NG8003) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `badge` | Nearest in Angular Material: `MatBadge` |
| --- | --- | --- |
| Shape | an item directive on the consumer's own inline element, whose text is the badge | a directive on the decorated element, `[matBadge]` (`NC/src/material/badge/badge.ts:77`), that creates its own `span` with the content in `ngOnInit` (`:207-214`, `:261-269`) and positions it over a corner |
| Content | the element's own text, written in the template | the `matBadge` input, a string or number (`:130-134`) |
| Hue | `variant` from Yeti's nine values | `matBadgeColor`, a `ThemePalette` (`:107-115`) |
| Emphasis | `emphasis`: tint, fill, or text alone | none; one filled look |
| Size | `size`: `sm`, `md`, `lg`, relative to the surrounding text | `matBadgeSize`: `small`, `medium`, `large` (`:150`) |
| Position and overlap | none: the badge sits in the line of text | `matBadgePosition`, `matBadgeOverlap` (`:118`, `:127`) |
| Hidden | none: the consumer's `@if` | `matBadgeHidden` (`:153`) |
| Accessibility | the badge is read as text where it sits; a count on a control goes into the control's name (usage rule 4) | the created badge is `aria-hidden="true"` (`:267-269`) and the host is described by `matBadgeDescription` through `AriaDescriber` (`:140-147`, `:310-313`) |
| Forced colours | none of its own; Yeti's transparent border (section 7) | a 1 px outline under the CDK `high-contrast` mixin (`NC/src/material/badge/badge.scss:102-105`) |
| `exportAs` | `yetiBadge` | none (`badge.ts:75-90`) |

Nothing from Material's API applies. `MatBadge` is a notification dot attached to another element, created in script, which would break the server HTML and the hydration constraints (a node created outside the template, ADR 0011 clause 4), while Yeti's badge is inline text the consumer writes. Material's description-through-`aria-describedby` model is the opposite of Yeti's note, which keeps the count in the control's name; usage rule 4 follows Yeti. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 24; building-blocks 1.2). The reason, row 1's, which row 24 takes ("as row 1"): Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs`. Inline flexbox, the one feature the manifest lists as unguarded, is inside Baseline 2025, as are `font-stretch` and `white-space` ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), all "high"). No Aria pattern applies (a badge has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read. The padding and gap are logical or symmetric, so RTL needs no `Directionality`.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The directive adds no role, state, or property, and no tab stop.
- **Keyboard:** none. A badge inside a control moves with that control.
- **Names:** none written by the package (building-blocks 1.10, Names). The badge is text in the accessibility tree, part of whatever name its ancestors compute from content; usage rules 3, 4, and 6 are the requirements on content the directive cannot read (ADR 0015 point 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | An `svg` child is decorative and carries `aria-hidden="true"` (usage rule 6). Every story's play function asserts it. |
| 1.3.1 Info and Relationships | The badge is text with no role, so it is read in place. A count that belongs to a control is inside the control or in its `aria-label` (usage rule 4); `badge--in-control` asserts the control's computed name contains the count. |
| 1.4.1 Use of Color | The word carries the meaning (usage rule 3). Every story's play function asserts that each badge has non-empty text content. |
| 1.4.3 Contrast (Minimum) | Yeti says "Text over every tint meets AA in both schemes" (`docs.md`), and its own test asserts AA on seven pairs in light and dark (`badge.spec.js`, the fixture's `data-contrast` badges). Ticket 17 measured the example axe-clean in both schemes ("Conforms as measured", section 3). The package asserts more: `badge--emphasis` shows every hued variant at every emphasis on the page surface, and `badge--painted-band` shows `black` and `white` at every emphasis on Yeti's documented bands; the play functions assert at least 4.5:1 for each, with the exact WCAG formula on computed colours, in a light and a dark `color-scheme` wrapper (ADR 0015 point 3; ticket 50 decision 8). The badge renders one step smaller than its text, so the large-text threshold is never used. If a pair fails, ticket 50 decision 8 applies: a ledger row on the A11Y-10a pattern and a package rule or a usage rule, decided by the owning spec's follow-up. |
| 1.4.4 Resize Text | Size and padding are relative to the surrounding text (`calc(var(--_yeti-size-text) * 0.8)`, `em` padding), so text zoom scales the badge with its line (read; Yeti's test measures the 0.8 ratio). |
| 1.4.10 Reflow | `white-space: nowrap` keeps a badge on one line, so a long phrase can overflow. Usage rule 2 keeps badges to a word or a number. Ticket 17 measured no page-level horizontal scroll on the badge example at 320 x 640 (section 2.4). Layer 4 asserts it at a 320 px viewport for the stories. |
| 1.4.11 Non-text Contrast | The tint is not a boundary a reader needs: the word is the information. No assertion beyond the Story gate. |
| 1.4.12 Text Spacing | The badge has no fixed size and no overflow rule; it grows with its content. Yeti's `letter-spacing: normal` is an author declaration that a user's `!important` spacing overrides (read). Layer 4 applies the 1.4.12 spacing values and asserts no badge text is clipped. |
| 2.5.3 Label in Name | Where a consumer names a control with `aria-label` instead of the badge's text, the label contains the visible text (usage rule 4). |

Forced colours (not an AA criterion of its own, ticket 17 section 2.6): under `forced-colors: active` the tint and fill are replaced by system colours and the word stays readable, so no meaning is lost (usage rule 3). Yeti's border is `solid transparent`; whether the engines draw it in a system colour, giving a boundary like Material's outline, was not measured (inferred). The spec adds no package CSS and no ledger row, and layer 4 records the forced-colours screenshot and the border's computed colour in three engines ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 78).

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 24, "Ledger: none"). The package adds no accessibility or standards feature that Yeti lacks: the badge is text, ticket 17 classed it with the items that "conform as measured" (section 3), and the requirements on content are Yeti's own notes stated as usage rules.

### 8. Rendered HTML

Consumer markup, after Yeti's example and docs:

```html
<p i18n>
  Deploy <span yetiBadge variant="success">Live</span> to production, or keep it
  <span yetiBadge variant="neutral">Draft</span>.
</p>
<h3>Release notes <span yetiBadge emphasis="high" size="lg" i18n>New</span></h3>
```

Server HTML and the hydrated DOM are the same. The first badge carries `yetibadge=""`, `variant="success"` (the static input attribute, matched by no rule), `class="badge"`, `data-variant="success"`, and `data-ngx-yeti-item-badge=""`, and no `data-emphasis` or `data-size`. The heading's badge carries `emphasis="high"`, `size="lg"` (inert), `class="badge"`, `data-emphasis="high"`, `data-size="lg"`, and the presence attribute, and no `data-variant`, so Yeti's primary ladder applies. No badge carries a role, an `id`, or an ARIA attribute from the package.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/badge/badge.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="badge"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). Its rank is `Y/src/yeti.css:42`, after `buttons` and before `card`. The client adopts the link at bootstrap. The badge has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiBadge` and input names where the docs write `class="badge"` and `data-*` names.

### 9. Animation

None. The badge has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Changing a bound input repaints at once. A badge the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility (the [enter](enter.md) spec). The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4); ticket 18 measured the old `styleUrl` loader kept `badge.css` loaded under a function-form `(animate.leave)` listener anywhere on the page (`upstream-bugs.md` A1), which ADR 0060's links do not depend on (point 4, measured). A server-rendered badge never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a badge's `data-*` attribute (ticket 26, "the consumer's binding only").
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; bindings computed from the same inputs give the same values (usage rule 8); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the badge and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the badge is its server HTML and stays styled while its host is connected, whatever live badges do. This is the case ticket 18 measured failing under a `styleUrl` loader ("a `hydrate never` badge using `styleUrl` is not counted, and lost its styles (padding 8.64px to 0) when the last live badge left"; `upstream-bugs.md` A2); ADR 0060 point 4 and ADR 0045's presence attribute close it, and layer 4 asserts it. Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiBadge` is constructed, which can show unstyled frames (plain text, no tint); the consumer closes the gap with `provideYetiStyles({ preload: ['badge'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and it adds no `jsaction`. A badge inside a button replays as part of the button's click, which is the button's.
- **`withI18nSupport()`:** a badge's word is usually translated with `i18n` on the host or its parent. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). `i18n` on the host element translates its text and leaves the directive's bindings alone (inferred).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the badge is styled and readable, because the class, the attributes, and the item link are in the server HTML. Nothing is lost: the badge has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** a badge may sit in any boundary. It has no ids or references.

### 11. Hydration constraints

The badge complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-variant`, `data-emphasis`, and `data-size` come from inputs whose values usage rule 8 keeps equal on both sides.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. Usage rule 1's hosts are phrasing content, valid inside a `p`, a heading, a `button`, and an `a`; a badge on a `div` inside a `p` would be repaired by the parser and differ from the server's DOM.
- **`preserveWhitespaces`:** the directive has no template. White space inside the badge is the consumer's text; the badge's `nowrap` and inline-flex layout collapse it as text would.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 7 keeps the consumer from writing them. The static `size` is `inert` and never bound, so hydration writes back the same value the server rendered.

### 12. Single-page application

None. The badge has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's badges leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-badge]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a badge again re-inserts it. A badge in the persistent shell outside the `router-outlet` keeps its link across routes.

### 13. Item file

`yeti-css/css/components/badge/badge.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiBadge]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:42`, after `buttons` and before `card`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-badge` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]` and `[data-size]` value rules and the tokens), and optionally `provideYetiStyles({ preload: ['badge'] })`. The badge adds nothing to it. Cross-item files acquired: none (`badge.css` names no other item, and no other item's CSS names `.badge`; ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the badge's computed size relative to its text, its colours' contrast, and the computed names of controls that hold a badge. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): the size test compares the badge's font size with its paragraph's, as Yeti's `badge.spec.js` does (0.8 times, within rounding), the pill test compares the corner radius with half the height, and contrast asserts the criterion's ratio, never a colour value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `badge` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every play function asserts, for each badge in the story, a non-empty text content (usage rule 3) and `aria-hidden="true"` on any `svg` child (usage rule 6). Story ids:

- `badge--default`: Yeti's example paragraph, `success` and `neutral`. Asserts `class="badge"`, `data-variant`, `data-ngx-yeti-item-badge`, and no `data-emphasis` or `data-size`; no role, `id`, or `tabindex` on the host; the font size is 0.8 times the paragraph's within rounding; the corner radius is at least half the height.
- `badge--emphasis`: a light and a dark `color-scheme` wrapper (`Y/src/guides/theming.md:52`), each holding the seven hued variants (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`) at `low`, `medium`, and `high` on the page surface. Asserts `low`'s background is transparent, `high`'s differs from `medium`'s, and every badge's text is at least 4.5:1 against its painted background (for `low`, the page surface), with the exact WCAG formula on computed colours (ADR 0015 point 3; ticket 50 decision 8).
- `badge--painted-band`: Yeti's documented bands, `black` on a `white` paint and `white` on `black` and on `primary` paints (`docs.md`; Yeti's fixture), each at the three emphases, in both scheme wrappers. Asserts at least 4.5:1 for each, with the translucent subtle stop composited over the band.
- `badge--inputs`: Storybook controls bind `variant`, `emphasis`, and `size`. The play function sets each, asserts the matching `data-*` value, resets it to unset, and asserts the attribute is absent. With `size="lg"`, asserts the badge's font size is larger than at `md`. A static `size="sm"` renders both `size="sm"` and `data-size="sm"` (the `inert` kind).
- `badge--in-heading`: Yeti's "Release notes" heading with a `high` badge, inside a heading with tracked letter spacing. Asserts the heading's computed name is "Release notes New" and the badge's computed `letter-spacing` is `normal`.
- `badge--in-control`: a `button yetiButton` holding a count badge, and a second button named by `aria-label` with the count. Asserts each button's computed name contains the count and, for the second, starts with the visible label (usage rule 4; WCAG 2.5.3).
- `badge--icon`: a badge with an `svg` child, in a left-to-right and a `dir="rtl"` wrapper. Asserts the `svg` is one em square within 1 px, `aria-hidden="true"`, and sits on the inline-start side in both directions.

### Layer 2: browser-level (`npx nx test <lib>`, `badge.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiBadge, { tagName: 'span' })`: the host has class `badge` and `data-ngx-yeti-item-badge`, and no `data-variant`, `data-emphasis`, `data-size`, or `size`; with `bindings` setting each input, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiBadge` fixture lives, one `<link data-ngx-yeti-styles="badge">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and no attribute beyond the class, the presence attribute, and the three `data-*` attributes.

A small test host covers what `createDirective` cannot: the template reference `#b="yetiBadge"` resolves; a static `size="sm"` renders both `size="sm"` and `data-size="sm"`; `<span yetiBadge yetiPaint="primary">` renders both directives' attributes and only the badge's presence attribute (ticket 50 decision 7); and the consumer's own `class` on the host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `badge.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup whose paragraph and heading badge carry `i18n`, with a static `size` and a bound `variant` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; each badge renders `class="badge"` and `data-ngx-yeti-item-badge`, the bound `data-variant`, `data-size="lg"` beside the inert `size="lg"`, and no `data-*` for an unset input; `<head>` holds one item link with `data-ngx-yeti-styles="badge"`, `data-beasties-skip`, and an `href` ending `components/badge/badge.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `badge` has `YetiBadge`; `data-variant`, `data-emphasis`, and `data-size` have inputs whose unions equal the manifest's vocabularies `variant`, `emphasis`, and `size-control`; the item has no markers and no events. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `badge.spec.js`: `badge--emphasis` and `badge--painted-band` repeat the contrast assertions with `emulateMedia({ colorScheme: 'light' })` and `'dark'` in three engines; at a 320 px viewport `badge--default` has no horizontal overflow (1.4.10); with the 1.4.12 text-spacing values applied, no badge's text is clipped (its `scrollWidth` equals its `clientWidth`); with `emulateMedia({ forcedColors: 'active' })`, every badge's text keeps a contrast of at least 4.5:1 against its background, and the border's computed colour and a screenshot are recorded, not asserted ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 78).

Fixture-app half, built with `outputMode: 'server'`, with a `/badge` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; the badges' attributes after hydration equal the server HTML's;
- with JavaScript disabled, each badge's computed background, colour, padding, and font size equal those with JavaScript on, and `@axe-core/playwright` with the six tags reports no violation;
- a badge inside a `hydrate never` block keeps its item link and its computed padding after every live badge on the page is removed (ticket 18's measured failure, now a regression case; ADR 0060 point 4);
- a badge inside a client-only `@defer` block with `badge` in the preload list shows no unstyled frame;
- navigating from the badge route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` examples for the stories, and its `test/browser/components/badge.spec.js` with the fixture `test/browser/fixtures/components/badge.html` for the size ratio, the transparent low emphasis, the pill radius, the per-scheme AA check, the lettering-width token, and axe; ticket 18's fixture app for the `hydrate never` case; ADR 0060's prototype for the server HTML and the item link; the [box](box.md) spec's play-function contrast assertions on painted bands.

## Out of Scope

- An input per token, a radius or weight input, or a hue outside Yeti's `variant` vocabulary (ADR 0004; ADR 0070 rule 2).
- Material's badge shape: a content input, a badge created in script and positioned over another element, `overlap`, `position`, `hidden`, or a description through `aria-describedby` (Part 2 row 24 names three inputs; section 5).
- Writing the count into a control's name for the consumer, or any `aria-label` the package composes (building-blocks 1.10, Names and Strings).
- A badge that is itself a link or a control (usage rule 1).
- Any check that the host is a non-interactive inline element, that the text is short, that the word carries the meaning, or that a count is in its control's name. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the badge, including forced colours: none, and no ledger row; layer 4 records the forced-colours result (ticket 50 decision 78; building-blocks 1.13; ADR 0060 point 8).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiBadge]` with `variant`, `emphasis`, `size`; no part directive | building-blocks Part 2 row 24; ticket 26 rows 90 to 92; [Decide: the spec list](../issues/11-decide-spec-list.md) row 24 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant`, `YetiEmphasis`, `YetiSizeControl`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `size` is `inert` on the badge's hosts | building-blocks 1.4; ticket 26 row 92, grilling question 15; the host list is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 77 |
| The `svg` child takes no directive; its `aria-hidden` is the consumer's | ticket 26 grilling question 6; building-blocks 1.1 and 1.10 |
| `YetiBadge` marks its host with `data-ngx-yeti-item-badge` and acquires the item file | ADR 0045; ADR 0060 point 2 |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4; ticket 50 decision 10 |
| Entry point `ngx-yeti/badge` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only; no Module | building-blocks 1.2; Part 2 row 24; ADR 0040 |
| Tokens are the consumer's, the badge's own skin tokens included | ADR 0004 |
| Item file as a counted link in Yeti's order | ADR 0060 points 2 to 6 |
| Requirements on content (the word carries the meaning, counts in the control's name, decorative icon) as usage rules asserted in every story | ADR 0015 point 4; manifest `a11y.notes` |
| 4.5:1 text contrast asserted for every hue and emphasis shown, in both schemes | ADR 0015 point 3; ticket 50 decision 8 |
| No ledger row; forced colours recorded, not fixed | Part 2 row 24; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 78 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A deploy status bound from state, with its word chosen with its hue:

```html
<p>
  Deploy
  <span yetiBadge [variant]="deployed() ? 'success' : 'warning'">
    {{ deployed() ? 'Live' : 'Pending' }}
  </span>
</p>
```

```ts
import { YetiBadge } from 'ngx-yeti/badge';

@Component({
  selector: 'app-deploy-status',
  imports: [YetiBadge],
  templateUrl: './deploy-status.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeployStatus {
  readonly deployed = input(false);
}
```

A count that belongs to a button, inside it so that it is part of the button's name:

```html
<button yetiButton type="button">
  Inbox <span yetiBadge variant="alert" emphasis="high">3</span>
</button>
```

The imports are `YetiButton` and `YetiBadge`. On a painted band, after Yeti's docs: `<div yetiBox yetiPaint="primary">Build status <span yetiBadge variant="white">Passing</span></div>`. With an icon: `<span yetiBadge variant="success"><svg aria-hidden="true" viewBox="0 0 16 16">...</svg>Verified</span>`. A value newer than the pin: `<span yetiBadge [variant]="$any('info')">`. A page whose badges render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['badge'] })`. A pill-free theme, in the consumer's stylesheet after Yeti: `:root { --yeti-badge-radius: var(--yeti-radius-sm); }`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/badge/badge.css`, loaded by `YetiBadge` as a counted link (section 13). The consumer writes nothing for the badge beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-variant` to a hue's ladder (`:237-254`) and `data-size` to a text and space step (`:256-259`); `tokens/components.css` declares `--yeti-badge-radius` and `--yeti-badge-weight` (`:14-15`); the colour, type, and space token files declare the rest.
3. **Cross-item rules:** none. `badge.css` names no other item, and no other item's CSS names `.badge`. Items around a badge (`box` with a paint, `button`, `card`) load their own files through their own directives.
4. **Tokens:** reads the six skin and type tokens, the default variant's stops and on-colour, and the default size's text step, plus the named ladders and steps through the value rules; writes none (section 2).
5. **What breaks without the item file:** the badge renders as plain inline text in the surrounding font size, with no tint, padding, border, or pill corner, and an `svg` child at its own intrinsic size, with no error. The `data-*` attributes still set their private tokens, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured); `badge` produced none.

### Platform features to adopt when the browser target moves

None. Inline flexbox, the one feature the manifest lists as unguarded, is inside Baseline 2025 (section 6), and Yeti guards nothing for the badge.

### Single-page-application pieces relied on

None: the badge uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
