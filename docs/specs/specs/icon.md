# Spec: icon (layout)

Ticket: [60. Spec: icon (layout)](../issues/60-spec-icon.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 10 and Part 1 (1.4, 1.9, 1.10), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 40 and 41, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The spec owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is Angular components at `708d4c6e2`. Its open points are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 9 and 38 to 40).

## Problem Statement

Yeti's `icon` makes an inline SVG "behave like a character: in a link, a button, a list item, a heading. It takes the size and color of the text around it and stays aligned with it, at any font size" (`Y/src/layouts/icon/docs.md`). It is one **Identity class**, `icon`, on the element that holds one SVG and its text, and two attributes: `data-gap` (the space between the icon and its text) and `data-align` (centred on the line, or on the baseline). The CSS is an inline flex row; the SVG is one em square and draws in `currentColor` (`Y/src/layouts/icon/icon.css`). There is no **Module** and there are no events (`Y/src/layouts/icon/manifest.json`).

An application developer using the package cannot write `class="icon"`, `data-gap`, or `data-align`: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-align="middle"` fails silently in plain Yeti. The developer also needs the `icon` **Item file** loaded while an icon is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the SVG renders as Yeti's reset draws it, a block on its own line that can fill its container's width (`Y/src/base/reset.css:23-27`; the size is inferred, not measured), with no error.

The icon's accessibility is all in the consumer's SVG. Yeti's manifest says: "When the icon sits beside text, give the SVG aria-hidden="true" so the text is the name. When it stands alone, give the SVG role="img" and an aria-label." (`manifest.json`, `a11y.notes`). The package cannot write that for the consumer, because it cannot know whether an icon is decorative or carries meaning ([building-blocks.md](../building-blocks.md) Part 2 row 10: "a decorative `svg`'s `aria-hidden` stays the consumer's (not every icon is decorative)"). So the package must state the requirement, show it in every example, and assert it in every story ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4).

## Solution

One **Item directive**, `YetiIcon`, on `[yetiIcon]`, in the secondary entry point `ngx-yeti/icon` ([building-blocks.md](../building-blocks.md) Part 2 row 10; 1.3). It binds `icon` as a static host class, `data-gap` from a `gap` input typed `YetiGap`, and `data-align` from an `align` input typed `YetiAlign` (ticket 26 rows 40 and 41). It removes the HTML `align` attribute that a static `align="baseline"` would leave on the host (ticket 26 row 41, kind `removed`; building-blocks 1.4). It sets the static presence attribute `data-ngx-yeti-item-icon` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `icon` item file when it is created, on the server too, and releases it when it is destroyed.

The developer writes `<a yetiIcon href="/download">` where Yeti's docs write `<a class="icon" href="/download">`, and `align="baseline"` where they write `data-align="baseline"`. Unset inputs render nothing, so Yeti's defaults (`xs` and `center`) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

The SVG is the consumer's element and takes no directive: the manifest declares no marker on it (ticket 26 grilling Q6, a child with no marker needs no directive). The accessible name follows Yeti's note, as a usage rule: a decorative SVG beside text carries `aria-hidden="true"`, and a meaningful SVG that stands alone carries `role="img"` and an `aria-label`. The directive declares no name input and writes no ARIA (building-blocks 1.10, Names).

Everything else is Yeti's CSS and the platform. The directive is **types only**: no listener, no render callback, no service, and no DI beyond ADR 0060's styles service. Server HTML is Yeti's documented markup, so the icon renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block.

## User Stories

1. As an application developer, I want to mark a link or a button that holds an icon and its text with one directive attribute, so that I never write Yeti's `icon` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="icon"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the SVG sized to one em and drawn in the text's colour, so that the icon follows the label's size and colour at any font size.
4. As an application developer, I want to set the space between the icon and its text with a `gap` input typed by Yeti's gap vocabulary, so that `gap="tiny"` fails to compile.
5. As an application developer, I want to set the alignment with an `align` input typed by Yeti's align vocabulary, so that `align="middle"` fails to compile.
6. As an application developer, I want `align="baseline"` for an icon in running text, so that the glyph sits on the baseline with Yeti's one-eighth-em nudge.
7. As an application developer, I want an unset `gap` or `align` to render no attribute, so that Yeti's own defaults (`xs` and `center`) apply and move with the pin.
8. As an application developer, I want the HTML `align` attribute that a static `align="baseline"` would leave on the host removed, so that the browser's old presentational hint does not change my text alignment.
9. As an application developer, I want `yetiIcon` beside `yetiButton` on one element, so that Yeti's `class="icon button"` is expressible.
10. As an application developer, I want an icon inside a cluster, a table cell, or a heading, so that I can place icons wherever Yeti's docs do.
11. As an application developer, I want the icon's item file loaded when the first icon renders, so that I do not import `icon.css` globally.
12. As an application developer, I want the item file removed after the last icon leaves the page, so that a route without icons carries none of its CSS.
13. As an application developer, I want the item file in the server HTML when a server-rendered page has an icon, so that the first paint already has the icon at text size.
14. As an application developer, I want the icon correct with JavaScript off under SSR and prerendering, so that a link or a button with an icon is readable and usable before any script runs.
15. As an application developer, I want hydration to change nothing on an icon, so that I get no `NG05xx` error and no layout shift.
16. As an application developer, I want the icon to work under zoneless change detection, including a `gap` or `align` bound from a signal, so that the package fits Angular's recommended mode.
17. As an application developer, I want an icon inside a `@defer (hydrate on ...)` block to keep its size and alignment before and after the block hydrates, so that incremental hydration does not blow the SVG up.
18. As an application developer, I want an icon inside a `hydrate never` block to keep its styles while it is on the page, so that a dehydrated toolbar is not unstyled when a live icon elsewhere leaves.
19. As an application developer, I want to know that an icon inside a client-only `@defer` block needs `icon` in the preload list for a flash-free first paint, so that I can avoid a frame with a full-width SVG.
20. As an application developer using `withI18nSupport()`, I want an icon's label and its `aria-label` translated and hydrated without re-rendering, so that localised pages keep the server's DOM.
21. As an application developer, I want the accessible-name rule stated in the directive's JSDoc and in every example, so that I know when to write `aria-hidden` and when to write `role="img"` with an `aria-label`.
22. As an application developer, I want the package never to add `aria-hidden` or a role to my SVG, so that a meaningful icon is never hidden from assistive technology by default.
23. As an application developer, I want the package to declare no `label` input, so that the name stays on the element that carries it, as Yeti's docs write it.
24. As an application developer, I want to set the default gap through Yeti's `--yeti-space-xs` token, so that my theme controls it.
25. As an application developer, I want the package to offer no input per token, so that the icon's API stays the size of Yeti's contract.
26. As an application developer, I want my own classes and attributes on the host kept, so that I can style the link or button beside the directive.
27. As an application developer, I want a template reference (`#i="yetiIcon"`), so that the icon follows the package's `exportAs` rule.
28. As an application developer, I want to import the directive from `ngx-yeti/icon`, so that a `@defer` block can split it with the rest of the item.
29. As an application developer, I want the usage rules stated (one SVG as a direct child, the name rule, no static Yeti attributes, not on a table cell), so that I use the icon as Yeti intends.
30. As an application developer using Tailwind v4 beside the package, I want to know whether `icon` collides with a Tailwind name, so that I can plan my layer statement.
31. As a screen-reader user, I want a decorative icon beside text to be silent, so that I hear "Download, link", not "image, Download, link".
32. As a screen-reader user, I want an icon-only button to have a name, so that I hear "Close, button", not "button".
33. As a screen-reader user, I want a meaningful icon in running text (a warning sign before a message) announced by its name, so that I get the information a sighted reader gets from the glyph.
34. As a speech-input user, I want a control's name to contain its visible text, so that I can say "click Save" to press the button with a floppy-disk icon and the word Save.
35. As a keyboard user, I want the icon to add no tab stop, so that focus moves only through the link or button that holds it.
36. As a low-vision user, I want a meaningful icon to keep at least 3:1 contrast against its background in light and dark schemes, so that I can see the glyph.
37. As a low-vision user who zooms text, I want the icon to grow with the text, so that it stays the size of the letters beside it.
38. As a low-vision user who overrides text spacing, I want the icon and its label to keep their content visible, so that my spacing settings do not clip either.
39. As a user of forced colours, I want an icon drawn in `currentColor` to take the forced text colour, so that the glyph stays visible beside its text.
40. As a pointer user, I want an icon-only control large enough to hit, so that I do not miss a close button that is one em square.
41. As a package maintainer, I want every story's play function to assert the name of each icon's control and the `aria-hidden` or `role="img"` of each SVG, so that the name rule is met by a test, not by assumption.
42. As a package maintainer, I want the contract check to cover the class and both attributes, so that a pin move that adds or renames one fails before release.
43. As a package maintainer, I want the SSR smoke to assert the server HTML of an icon, the absence of a static `align`, and the item link, so that the first paint is proven.
44. As a package maintainer, I want the fixture app to render icons in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
45. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
46. As a package maintainer, I want the class name checked against Yeti's typings at the pin, so that a future Yeti type named `YetiIcon` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/icon/manifest.json`, `icon.css`, `docs.md`, and `example.html`, and in Yeti's own `Y/test/browser/layouts/icon.spec.js` and its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `icon`, `layout`, `Boxes and Stacks` |
| `class` | `icon` |
| `attributes` | `data-gap` (vocabulary `gap`, 29 values, default `xs`), "Space between the icon and its text."; `data-align` (vocabulary `align`: `start`, `center`, `end`, `stretch`, `baseline`; default `center`), "How the icon lines up with the text: centered on the line, or on the baseline." |
| `classes` | empty |
| `children` | `> svg` (min 1, max 1): "The icon, an inline SVG, sized to one em." |
| `markers` | none |
| `tokens` | public: `--yeti-space-xs` (the default gap); private: `--_yeti-gap`, `--_yeti-align` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "When the icon sits beside text, give the SVG aria-hidden="true" so the text is the name. When it stands alone, give the SVG role="img" and an aria-label." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "inline flexbox gap", "translate property"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.icon` is `display: inline-flex` with `align-items: var(--_yeti-align)` and `gap: var(--_yeti-gap)`; `.icon:not([data-gap])` sets the gap to `--yeti-space-xs` and `.icon:not([data-align])` sets the alignment to `center`; `.icon > *` zeroes margins; `.icon > svg` is `1em` by `1em` with `flex: none`; `.icon[data-align="baseline"] > svg` takes `translate: 0 0.125em`, because "an icon whose bottom edge sits exactly on the baseline reads as floating" (`docs.md`). The `[data-gap]` and `[data-align]` value rules that set `--_yeti-gap` and `--_yeti-align` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:147-152` for `data-align`), not in the item file. No other item's CSS names `.icon` (checked with `rg` over `Y/src/**/*.css`).

Attributes left to the consumer: none (ticket 26 rows 40 and 41).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `icon` | static host class on `[yetiIcon]` (`YetiIcon`) | always present | ADR 0003 point 1; Part 2 row 10 |
| Attribute `data-gap` | space between the icon and its text | input `gap`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing (Yeti's `xs` applies) | ticket 26 row 40 (R); ADR 0070 rule 1 |
| Attribute `data-align` | centred on the line or on the baseline | input `align`: `YetiAlign \| undefined`, bound `[attr.data-align]` | unset renders nothing (Yeti's `center` applies); `align` is an HTML attribute name, kind `removed`: `'[attr.align]': 'null'` | ticket 26 row 41 (R); building-blocks 1.4 |
| Child `> svg` | the icon, one em square | the consumer's element; no directive, no marker | not applicable | manifest `children`; ticket 26 grilling Q6 |
| SVG's `aria-hidden="true"` or `role="img"` with `aria-label` | Yeti's a11y note | the consumer's, as a usage rule; the package writes neither | not applicable | Part 2 row 10; building-blocks 1.10 (Names); ADR 0015 point 4 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-xs` | the default gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--_yeti-gap`, `--_yeti-align` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-icon=""` on `[yetiIcon]` | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |

The `removed` kind for `align` (building-blocks 1.4; ticket 26 row 41 and grilling Q15): a static `align="baseline"` stays on the element as an input attribute, and HTML's `align` is a presentational hint on any element in Chromium and WebKit, so the directive binds `[attr.align]` to `null`, with a source comment naming the hint it prevents, as Material's `MatHint` does. The icon's hosts are `a`, `button`, and `span` in Yeti's example and fixture. A static `align` that hydration writes back before the `null` binding removes it is accepted, as for every `removed`-kind input; the e2e case asserts that no frame paints with `align` present, and the SSR smoke writes the static form ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9, a trap-quadrant decision whose record is there).

**Module replaced:** none. Yeti's `icon` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 10, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads one public token, `--yeti-space-xs`, when `gap` is unset, and the gap scale through `attributes.css` when it is set. The SVG's size is `1em` and its colour is `currentColor`, so the consumer sizes and colours an icon through the text's own `font-size` and `color`, not through a token. The package writes no token and offers no input, provider, or theme for one. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

None. `YetiIcon` is a standalone item directive. It provides no injection token, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). It has no part directive, so it needs no parent token (building-blocks 1.9).

Two items a consumer composes on one element are written beside each other. Yeti's own example writes `class="icon button"` on a `button`, so the consumer writes `<button yetiIcon yetiButton type="button">`. The `button` item's inputs are `variant`, `emphasis`, and `size` (`Y/src/components/button/manifest.json`), so no input name is declared twice on that element (building-blocks 1.4, shared vocabularies). Yeti's `button.css` sizes a direct `svg` child too (`.button > svg`); the two rules are Yeti's and the package adds nothing between them.

One composition is excluded: `yetiIcon` on a table cell. The `table` item's cell directive declares `align` typed `Extract<YetiAlign, 'start' | 'center' | 'end'>` for the cell's `data-align` (ticket 26 row 151), so the two directives would declare one input name with different types and meanings on one element, which building-blocks 1.4 forbids. Yeti's table docs already say to wrap a cell's SVG in an icon inside the cell, not to make the cell an icon (`Y/src/components/table/docs.md`). Usage rule 5 states it, and the table spec states the same rule from its side ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 39).

The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('icon')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which the directive acquires and releases the `icon` item file. That service is the [setup](setup.md) spec's and ADR 0060's.

Generated ids and the platform's relationship attributes: none. The icon renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). A consumer who names an SVG with `aria-labelledby` pointing at a `<title>` writes that id; the package's examples use Yeti's `aria-label` form.

### 4. API

| Member | `YetiIcon` |
| --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and `YetiIcon` is not among them, so it takes `Yeti`, not `NgxYeti` (ADR 0080 point 4). The input types `YetiGap` and `YetiAlign` are Yeti's own exported names, re-exported, not redeclared |
| Selector | `[yetiIcon]` |
| `exportAs` | `yetiIcon` |
| Entry point | `ngx-yeti/icon` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `xs`); `align: YetiAlign \| undefined` (Yeti default `center`); each `input()` with no default value (ADR 0070 rule 1) |
| Host | static `class: 'icon'`; static `'data-ngx-yeti-item-icon': ''`; `'[attr.data-gap]'` and `'[attr.data-align]'` from the inputs, `null` when unset; `'[attr.align]': 'null'` with a source comment naming the presentational hint it prevents |
| Providers | none |
| Models, outputs, methods | none |
| Lifecycle | acquires the `icon` item file, on the server too, with `injectYetiItemStyles('icon')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The full `align` vocabulary is accepted, as ticket 26 row 41 types it; `start`, `end`, and `stretch` are Yeti's to define on an icon, and the package does not narrow them.

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiIcon` on the element that holds the SVG and its text: a link, a button, or a `span` inside a list item, a heading, or a paragraph (`docs.md`, "When to use it"). It makes that element an inline flex row.
2. Give it exactly one inline `svg` as a direct child (manifest `children`, `> svg`, min 1, max 1). Yeti's rule is a child selector, so an SVG inside a wrapper element is not sized; a component's host element is the child, so an SVG inside a component's template is not sized either. `@if`, `@for`, and `ng-container` add no element and need no care. Draw the SVG in `currentColor` (`stroke` or `fill`) so that it follows the text's colour, as Yeti's examples do.
3. **The accessible name** (manifest `a11y.notes`; building-blocks 1.10, Names; ADR 0015 point 4):
   - **Decorative**, beside text that already says what the icon shows: give the SVG `aria-hidden="true"`. The text is the name. Never also give it an `aria-label`, which would hide nothing and repeat the name.
   - **Meaningful and standing alone**, as in an icon-only button or link: give the SVG `role="img"` and an `aria-label` that says what the control does ("Close", not "X icon"). The control takes its name from the SVG's content name. Yeti's button docs also accept an `aria-label` on the button itself ("An icon-only button needs an `aria-label`", `Y/src/components/button/docs.md:40`); both give the same name, and the package's examples use the icon manifest's form, and the tests assert the control's computed name, not where the label sits ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 40).
   - **Meaningful beside text**, where the glyph adds information the text does not carry (a warning sign before a message): give the SVG `role="img"` and an `aria-label` naming that information ("Warning"). It becomes part of the text's content.
   - Where a control has visible text, its accessible name contains that text, so a speech-input user can say it (WCAG 2.5.3); the decorative form gives exactly that.
   - The directive writes no `aria-hidden`, no `role`, and no `aria-label`, and declares no input for them.
4. Do not write `class="icon"`, `data-gap`, `data-align`, or `data-ngx-yeti-item-icon` statically. The directive binds them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[align]="$any('new')"` (ADR 0070).
5. Do not put `yetiIcon` on a `th`, `td`, or `tr`. Wrap the cell's SVG in a `span yetiIcon` inside the cell, as Yeti's table docs say (section 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 39).
6. Make an icon-only control at least 24 by 24 CSS pixels, or give it the spacing WCAG 2.5.8 allows. An icon-only `yetiButton` gets Yeti's control size from the button item; an icon-only link or a bare `button` with only `yetiIcon` is one em square plus nothing. The package adds no CSS and no ledger row for it: a 24 px minimum on `.icon` would change Yeti's layout for icons in running text, where 2.5.8's inline exception applies ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 38).
7. Bind `gap` and `align` from values that are the same on the server and the client, never from a browser-only read. The hydration constraints require the same DOM on both sides.
8. Import every directive class the template writes. A **Forgotten import** of `YetiIcon` with static `gap` and `align` renders an unsized SVG with no error; only a bound input (`[align]`) makes the compiler report it (NG8002) (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `icon` | Angular Material `mat-icon` |
| --- | --- | --- |
| Shape | an item directive on the consumer's link, button, or `span` that holds the consumer's own inline `svg` and its text | a component, `selector: 'mat-icon'`, that renders a font ligature, an SVG icon from a registry, or projected content (`NC/src/material/icon/icon.ts:134`) |
| Sizing | the SVG is always one em, from Yeti's CSS | 24 px by default; `inline` sizes the icon to the font size (`icon.ts:174-178`) |
| Name | the consumer's: `aria-hidden` on a decorative SVG, `role="img"` and `aria-label` on a meaningful one (manifest `a11y.notes`) | host `role="img"` (`icon.ts:138`), and `aria-hidden="true"` set in the constructor unless the consumer wrote one (`icon.ts:243-259`) |
| Styling | Yeti's item file, loaded per item; colour from `currentColor` | component styles; `color` input for the theme palette |
| API | two typed inputs, `exportAs` | `inline`, `color`, `svgIcon`, `fontSet`, `fontIcon`, `exportAs: 'matIcon'` (`icon.ts:135`) |

Not adopted from Material: a default `aria-hidden`. Material sets it on its own icon element; here the directive sits on the control, not on the SVG, so hiding its host would hide the control. Setting it on the child SVG would be a DOM write outside host bindings (hydration constraints) and would hide a meaningful icon whose consumer forgot the `role` (Part 2 row 10, "not every icon is decorative"). Not adopted either: an icon registry, a font-icon mode, or a `color` input. Yeti's icon holds an inline SVG the consumer writes, and its colour is the text's (ADR 0004).

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 10; building-blocks 1.2). The reason, row 1's, which row 10 takes: Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs`. Inline flexbox `gap` and the `translate` property are inside Baseline 2025 (manifest `support`, unguarded). No Aria pattern applies (the icon has no role of its own), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The icon adds no role, state, or property, and no tab stop. The control it sits on (a link, a button) is the consumer's native element with its own role.
- **Keyboard:** none. The host's own keyboard behaviour (Enter on a link, Enter and Space on a button) is the platform's.
- **Names:** usage rule 3. The name comes from the content of the host, computed as accessible-name computation does: text, plus the `aria-label` of a `role="img"` SVG, minus an `aria-hidden` SVG. The package renders no string of its own (building-blocks 1.10, Strings).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | A decorative SVG is hidden with `aria-hidden="true"`; a meaningful one has `role="img"` and an `aria-label` (usage rule 3; manifest `a11y.notes`). The requirement is on content the directive does not read, so it is stated as a requirement, shown in every example, and asserted in every story's play function (ADR 0015 point 4): each decorative SVG has `aria-hidden="true"`, each meaningful SVG has `role="img"` and a non-empty name, and each control has the expected name. Axe's `svg-img-alt`, `link-name`, and `button-name` rules in the **Story gate** catch an unnamed `role="img"` SVG and an unnamed control. |
| 1.3.1 Info and Relationships | The host is the consumer's element and keeps its role; the directive adds none. |
| 1.3.2 Meaningful Sequence | The flex row does not reorder its children; DOM order is reading order. |
| 1.4.4 Resize Text | The SVG is `1em`, so it grows with zoomed text (read; Yeti's `icon.spec.js` asserts the size equals the computed `font-size`). |
| 1.4.10 Reflow | The icon is inline and as wide as its content; Layer 4 asserts no horizontal overflow at a 320 px viewport. |
| 1.4.11 Non-text Contrast | A meaningful icon is a graphic needed to understand the content. It draws in `currentColor`, so its colour is the text's colour. The standalone story's play function computes the ratio of the SVG's computed `color` against its computed background with the exact WCAG formula, unrounded, in the light and dark schemes, and asserts at least 3:1 (ADR 0015 point 3). A decorative icon is exempt. |
| 1.4.12 Text Spacing | The rules set no height and no overflow on the host; the SVG is sized in `em`, not in line height (read). |
| 2.5.3 Label in Name | With the decorative form, the name is exactly the visible text. A consumer who adds an `aria-label` to the host instead keeps the visible text at its start (usage rule 3). |
| 2.5.8 Target Size (Minimum) | Not met by the icon layout itself: an icon-only host is one em square. Usage rule 6 states the requirement; the standalone story uses an icon-only `yetiButton` and its play function asserts the target's box is at least 24 by 24 CSS pixels ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 38). |

Forced colours: the SVG draws in `currentColor`, which forced-colours mode resolves to the forced text colour, so the glyph stays visible beside its text with no package rule (inferred, not measured). The ledger has no forced-colours row for the icon.

**Ledger rows owned:** none. Yeti documents the accessible-name requirement in its own manifest (`a11y.notes`), and the package adds no feature Yeti lacks: it states the requirement, shows it, and tests its own stories. Axe found no violation on Yeti's icon example in three engines ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md)).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<p yetiCluster gap="lg">
  <a yetiIcon href="/download">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    Download
  </a>
  <button yetiIcon yetiButton type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    Save
  </button>
</p>
```

Server HTML and the hydrated DOM are the same. The link carries `yetiicon=""`, `class="icon"`, and `data-ngx-yeti-item-icon=""`, and no `data-gap` or `data-align`, because both inputs are unset. The button carries both items' classes and presence attributes. The SVGs are as the consumer wrote them, with `aria-hidden="true"`. With `align="baseline"` written statically, the host carries `align="baseline"` in the template, `data-align="baseline"` in the DOM, and no `align` attribute, because the `null` binding removes it on the server and again at hydration.

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/icon/icon.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="icon"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The icon has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiIcon` where the docs write `class="icon"`, and `gap` and `align` where they write `data-gap` and `data-align`. The SVG is unchanged.

### 9. Animation

None. The icon has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). The baseline nudge is a static `translate`, not a motion. A consumer may remove an icon's host with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered icon never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, no `align`, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. A link or a button with an icon works natively before hydration.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 7); 0 style mutations (ADR 0060 point 5, measured for the mechanism). A static `align` is written back and removed again in the same pass (section 11).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the icon and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). The icon and its SVG are one element and its child, so they share one **Hydration boundary**. A `hydrate on interaction` block holding an icon button replays the click to the consumer's handler; the icon adds no listener of its own.
- **`hydrate never`:** the icon is its server HTML and stays styled while its host is connected, whatever live icons do (ADR 0060 point 4; ADR 0045's presence attribute is what the check queries). A link still navigates and a button still submits natively.
- **Client-only `@defer`:** the item file is fetched when `YetiIcon` is constructed, which can show frames with an unsized SVG; the consumer closes the gap with `provideYetiStyles({ preload: ['icon'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays because of it and it adds no `jsaction`. The consumer's own `(click)` on the host replays as any other.
- **`withI18nSupport()`:** a label is translated with `i18n` and an SVG's name with `i18n-aria-label`, in the consumer's component. The directive adds no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so a bound `gap` or `align` refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the icon is sized and aligned, and its link or button keeps working, because the attributes and the item link are in the server HTML. Nothing is lost: the icon has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The icon complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; `data-gap` and `data-align` come from inputs whose values usage rule 7 keeps equal on both sides; `align` is always absent.
- **No direct DOM manipulation:** the directive writes nothing outside host bindings, and never touches the SVG. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element. An inline `svg` is phrasing content and may sit inside `a`, `button`, and `span`; the consumer's markup must be valid as written.
- **`preserveWhitespaces`:** the directive has no template. The flex row ignores whitespace between the SVG and the text, and the `gap` sets the space.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 4 keeps the consumer from writing them. The one static form the records invite is `align="baseline"`, an input whose name is also an HTML attribute that the directive removes (building-blocks 1.4). Hydration writes it back before the `null` binding removes it again in the same pass (ADR 0070's 2026-10-03 consequence). The final DOM equals the server's. The static form is accepted, and the spec does not require `[align]` bindings ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).

### 12. Single-page application

None. The icon has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A fragment link that holds an icon is the consumer's link and goes through the fragment-links spec like any other. On a route change, a route's icons leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-icon]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders an icon again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/icon/icon.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiIcon]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:31`, after `center` at `:30`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-icon` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-gap]` and `[data-align]` value rules and the reset that makes an `svg` a block), and optionally `provideYetiStyles({ preload: ['icon'] })`. The icon adds nothing to it. Cross-item files acquired: none (`icon.css` has no cross-item rule, and no other item's CSS names `.icon`; ADR 0060 point 9). An item composed on the same element (`button`) or around it (`cluster`) loads its own file through its own directive.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the SVG's size and position against its text, each control's accessible name, and the SVG's contrast. It never asserts a private field or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): sizes are compared with the host's computed `font-size` and the gap with the computed token in the same page, as Yeti's own `icon.spec.js` does. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `icon` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every story's play function asserts the name rule for every icon it shows (ADR 0015 point 4): each decorative SVG has `aria-hidden="true"` and no `aria-label`, each meaningful SVG has `role="img"` and a non-empty accessible name, and each control is found by `getByRole` with its exact expected name. Story ids:

- `icon--default`: Yeti's example (a link "Download" and a `yetiButton` "Save", each with a decorative SVG, inside a `yetiCluster`). Asserts `class="icon"` and `data-ngx-yeti-item-icon` on both hosts, no `data-gap`, `data-align`, or `align`, and no `tabindex`, role, or ARIA added by the package. Asserts the link's name is exactly "Download" and the button's exactly "Save" (2.5.3). Asserts each SVG's box equals the host's computed `font-size` in both dimensions and is centred on its label, as Yeti's own test does.
- `icon--standalone`: an icon-only `yetiButton` whose SVG has `role="img"` and `aria-label="Close"`, and a `span yetiIcon` in running text whose SVG has `role="img"` and `aria-label="Warning"` before a message. Asserts the button is found as `button` named "Close", the warning SVG as `img` named "Warning", and the paragraph's text content order unchanged. Asserts the button's box is at least 24 by 24 CSS pixels (2.5.8; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 38). Asserts the contrast of each SVG's computed `color` against its computed background with the exact WCAG formula, unrounded, at least 3:1 (1.4.11), in a light wrapper and in a wrapper with the consumer's `color-scheme: dark` (ADR 0004 consequences).
- `icon--settings`: `gap` and `align` bound from Storybook controls. Asserts `data-gap` and `data-align` follow each control, that clearing a control removes the attribute, and that with `align="baseline"` the SVG's bottom sits one eighth of the computed `font-size` below a zero-size probe at the label's baseline, within 1 px, as Yeti's own test does. With `align="baseline"` written statically, asserts `data-align="baseline"` and no `align` attribute (building-blocks 1.4).
- `icon--in-text`: icons in a heading, a list item, and a paragraph at three font sizes. Asserts each SVG is one em of its own host's computed `font-size` and that each host's children have no margins.

### Layer 2: browser-level (`npx nx test <lib>`, `icon.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiIcon, { tagName: 'button' })`: the host has class `icon` and `data-ngx-yeti-item-icon`, and no `data-gap`, `data-align`, or `align`; with `bindings` setting `gap` to `'sm'` and `align` to `'baseline'`, the attributes follow, and setting them back to `undefined` removes them.
- While a `YetiIcon` fixture lives, one `<link data-ngx-yeti-styles="icon">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- The directive adds no listener to its host and writes no attribute on any child element.

A small test host covers what `createDirective` cannot: the template reference `#i="yetiIcon"` resolves; a static `align="baseline"` renders `data-align="baseline"` and no `align`; a host holding an SVG with `aria-hidden="true"` keeps it unchanged and a host holding an SVG with `role="img"` and `aria-label` keeps both unchanged (the package writes no ARIA); `yetiIcon` beside `yetiButton` on one `button` gives both classes and both presence attributes; and the consumer's own `class` on the host is kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `icon.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose labels carry `i18n` and whose standalone SVG carries `i18n-aria-label` (building-blocks 1.11 decision 11, 1.12), with a static `align="baseline"` on one host: `whenStable()` resolves; each host renders `class="icon"` and `data-ngx-yeti-item-icon`; the baseline host renders `data-align="baseline"` and no `align`; each SVG renders with the consumer's `aria-hidden` or `role` and `aria-label` unchanged; `<head>` holds one item link with `data-ngx-yeti-styles="icon"`, `data-beasties-skip`, and an `href` ending `layouts/icon/icon.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the icon through the contract mapping: class `icon` has `YetiIcon`; `data-gap` and `data-align` have inputs whose unions equal the manifest's vocabularies; the manifest declares no marker and no event for `icon`. A pin move that adds an attribute, a marker, or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: the SVG is one em square, centred by default, and on the baseline with the nudge, matching Yeti's own `icon.spec.js` cases with sizes read from computed styles; at a 320 px viewport the page has no horizontal overflow (1.4.10); with text zoomed to 200 % the SVG still equals the host's computed `font-size` (1.4.4).

Fixture-app half, built with `outputMode: 'server'`, with an `/icon` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the SVGs are one em and aligned as in the Storybook half, the icon link navigates, and `@axe-core/playwright` with the six tags reports no violation;
- an icon inside a client-only `@defer` block with `icon` in the preload list shows no frame with an unsized SVG; an icon inside a `hydrate never` block stays sized after a live icon on the page is removed;
- navigating from the icon route to a route without one removes the item link, and navigating back re-inserts it;
- a `MutationObserver` installed before the main bundle records the `align` attribute's rewrite and removal on an icon host whose consumer wrote a static `align` during hydration, and a `requestAnimationFrame` probe records whether a frame is painted while it is present; the test asserts the attribute is absent after hydration and that no frame is painted while it is present ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9; if this fails, every `removed`-kind spec switches to bound-only inputs).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically). Screen-reader announcement of the decorative and standalone forms is a manual release test (ADR 0015 point 7).

Prior art: Yeti's `example.html` for the default story and its `test/browser/layouts/icon.spec.js` and fixture for the geometry cases; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula.

## Out of Scope

- An input for the SVG's name (`label`, `ariaLabel`), a `decorative` input, or any directive on the SVG (building-blocks 1.10, Names; Part 2 row 10).
- Setting `aria-hidden` or `role` on the consumer's SVG by default, as Material's icon does (section 5).
- An icon registry, a font-icon mode, sprite loading, or a `color` input (ADR 0004; Yeti's icon holds an inline SVG).
- An input per token (ADR 0004).
- Any check that the host has exactly one SVG child, that a decorative SVG is hidden, or that an icon-only control has a name. Checks belong to a later milestone (map, Milestones); the usage rules state them and the stories test the package's own examples.
- Package CSS for target size or forced colours, unless an assertion fails (building-blocks 1.10; the user's "Accessibility CSS: Yes." applies only where Yeti's CSS is what fails).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiIcon]` with `gap` and `align`; no part or child directive | building-blocks Part 2 row 10; ticket 26 rows 40 and 41 and grilling Q6 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiGap` and `YetiAlign`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2 |
| `align` is a `removed` presentational-attribute input | building-blocks 1.4; ticket 26 row 41 and grilling Q15 |
| A static `align` written back at hydration and removed in the same pass is compliant | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9 |
| The SVG's `aria-hidden`, `role`, and `aria-label` are the consumer's; no name input | Part 2 row 10; building-blocks 1.10 (Names); manifest `a11y.notes` |
| The name rule is stated, shown in every example, and asserted in every story | ADR 0015 point 4 |
| Non-text contrast of a meaningful icon asserted in the play function | ADR 0015 point 3 |
| Examples name an icon-only button through the SVG, not the button | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 40 |
| Usage rule against `yetiIcon` on a table cell | building-blocks 1.4 (shared vocabularies); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 39 |
| Usage rule and story assertion for a 24 px target | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 38 |
| No token, no DI, no host directives; composed beside `yetiButton` | building-blocks 1.9; Part 2, "Two findings" |
| `exportAs`; class name with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/icon` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 10 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-icon` | ADR 0060 points 2 to 6; ADR 0045 |
| No ledger row | ledger format (rows are for what Yeti lacks); Yeti documents the name rule |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A decorative icon in a link and in a button, where the text is the name:

```html
<a yetiIcon routerLink="/downloads">
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" fill="none" stroke="currentColor" stroke-width="2" /></svg>
  <span i18n>Download</span>
</a>

<button yetiIcon yetiButton type="submit">
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
  <span i18n>Save</span>
</button>
```

An icon-only button, where the SVG is the name:

```html
<button yetiIcon yetiButton type="button" emphasis="low" (click)="close()">
  <svg role="img" aria-label="Close" i18n-aria-label viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" /></svg>
</button>
```

A meaningful icon in running text, on the baseline:

```html
<p>
  <span yetiIcon align="baseline">
    <svg role="img" aria-label="Warning" i18n-aria-label viewBox="0 0 24 24"><path d="M12 3 2 21h20L12 3zm0 6v6m0 3v1" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    <span i18n>Your session ends in five minutes.</span>
  </span>
</p>
```

A tick in a table cell, wrapped as Yeti's table docs say:

```html
<td yetiTableCell align="center">
  <span yetiIcon>
    <svg role="img" aria-label="Included" i18n-aria-label viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
  </span>
</td>
```

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiIcon } from 'ngx-yeti/icon';

@Component({
  selector: 'app-toolbar',
  imports: [YetiButton, YetiIcon],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {}
```

A page whose icons render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['icon'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/icon/icon.css`, loaded by `YetiIcon` as a counted link (section 13). The consumer writes nothing for the icon beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-gap` and `data-align` values to the private tokens; `tokens/space.css` declares `--yeti-space-xs`; `base/reset.css:23-27` makes an `svg` a block with `max-inline-size: 100%`, which the item file overrides in size for a direct child.
3. **Cross-item rules:** none in `icon.css`. `button.css` also sizes a direct `svg` child of a `.button`; on an element with both classes, both are Yeti's rules.
4. **Tokens:** reads one public token, writes none (section 2).
5. **What breaks without the item file:** the SVG renders as the reset's block, on its own line above the text and up to its container's width (inferred), and nothing errors.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `icon` (that Tailwind generates no `icon` utility is inferred, not measured).

### Platform features to adopt when the browser target moves

None. Every feature `icon.css` uses (inline flexbox `gap`, the `translate` property, `em` sizing) is inside Baseline 2025 (building-blocks 1.2), and the manifest lists both as unguarded.

### Single-page-application pieces relied on

None: the icon uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
