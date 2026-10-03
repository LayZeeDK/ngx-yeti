# Spec: cluster (layout)

Ticket: [54. Spec: cluster (layout)](../issues/54-spec-cluster.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 4 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 15 to 18, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row. `Y/` is `github.com/foundation/yeti/` at the **Pin**. The one point no record settled is decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decision 9).

## Problem Statement

Yeti's `cluster` is the wrapping row: "Lays its children out in a row that wraps, keeping one gap between them on both axes" (`Y/src/layouts/cluster/manifest.json`). Yeti's docs use it for "a row of things that are sized by their content and may need to wrap: tags, buttons, navigation links, a logo beside a menu" (`Y/src/layouts/cluster/docs.md`). It is one **Identity class**, `cluster`, plus four **Attributes**: `data-gap` (the gap on both axes), `data-align` (vertical alignment within a row), `data-justify` (distribution along the row), and `data-threshold` (below a width of its own, a column of full-width items). It has no markers, no **Module**, and no events.

An application developer using the package cannot write `class="cluster"` or any of the four attributes: the package's contract rule is that a consumer writes no Yeti class or `data-*` attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). The developer wants a misspelt gap or threshold to fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `cluster` **Item file** loaded when a cluster is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the children stack as plain blocks or sit inline with no gap, with no error.

Two details make the item more than a class:

- `align` is also an HTML attribute. A static `align="center"` left on an element is a presentational hint in Chromium and WebKit, which maps it to `text-align` and centres the text of every item ([ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 16; building-blocks 1.4). The directive must own what that static attribute renders.
- `data-threshold` makes the cluster a size container, so it takes the width of its block instead of its content. Yeti's docs name the trap: as an item of another cluster, or of any flex row that sizes its items by their content, a thresholded cluster "has no content width to offer and collapses to nothing" (`docs.md`, "A column when it is narrow"). Yeti's `bin/validate.js` warns about one directly inside another cluster (`Y/bin/validate.js:703-717`); the package's checks belong to a later milestone (map, Milestones), so the spec states it as a usage rule.

## Solution

One **Item directive**, `YetiCluster`, with selector `[yetiCluster]`, in the secondary entry point `ngx-yeti/cluster` ([building-blocks.md](../building-blocks.md) Part 2 row 4: "`[yetiCluster]` (`gap`, `align`, `justify`, `threshold`)", native platform, level 1, types only). The developer writes `<ul yetiCluster gap="xs" role="list">` where Yeti's docs write `<ul class="cluster" data-gap="xs" role="list">`. The directive:

- binds `cluster` as a static host class;
- sets `data-gap`, `data-align`, `data-justify`, and `data-threshold` from four `input()` signals typed by Yeti's own vocabulary types, `YetiGap`, `YetiAlign`, `YetiJustify`, and `YetiWidth`; an unset input renders no attribute, so Yeti's CSS applies its own default ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule R and rule 1);
- binds the HTML `align` attribute to `null`, so a static `align="end"` written as the input's static form never reaches the DOM (the `removed` kind, ticket 26 row 16);
- sets its presence attribute `data-ngx-yeti-item-cluster` on its host and acquires the `cluster` item file when it is created, on the server too, and releases it when it is destroyed ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 point 2);
- declares no output, no listener, no render callback, no service, and no injection token;
- has `exportAs: 'yetiCluster'` (building-blocks 1.3).

Everything else is Yeti's CSS and the platform: the wrapping flex row, the gap on both axes, the alignment and distribution, the column under a **Threshold** by a container query on the cluster's own width, and the children's margins set to zero. The cluster renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block, because all it renders is a static class, attributes bound from inputs, and a static presence attribute.

## User Stories

1. As an application developer, I want to lay out a row of tags, buttons, or links that wraps with one directive attribute, so that I never write Yeti's `cluster` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="cluster"` and `data-*` attributes in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the gap with `gap="xs"`, so that the space between items and between wrapped rows is one value.
4. As an application developer, I want the fluid gap pairs (`gap="sm-lg"`) to be accepted, so that the gap grows with the viewport as Yeti documents.
5. As an application developer, I want `gap="sx"` to fail to compile, so that a misspelt gap never ships.
6. As an application developer, I want `justify="between"` to push the first and last items to the edges, so that a term and its value sit at the two ends of one line.
7. As an application developer, I want `justify` to accept `start`, `center`, `end`, `between`, `around`, and `evenly`, so that I can distribute items as Yeti allows.
8. As an application developer, I want `align="baseline"` to line items up on their text baseline, so that labels of different sizes read as one line.
9. As an application developer, I want a static `align="end"` not to centre or end-align the text inside my items, so that the input does not leak a presentational HTML attribute.
10. As an application developer, I want `threshold="sm"` to turn the cluster into a column of full-width items when its own width is below the `sm` width, so that a row of actions in a sidebar reads as a clean column instead of a ragged wrap.
11. As an application developer, I want the threshold measured on the cluster's own width and not on the screen's, so that the same cluster behaves the same in a sidebar and in the main column.
12. As an application developer, I want a cluster without `threshold` to stay a plain wrapping row that sizes to its items, so that only the clusters I ask for become size containers.
13. As an application developer, I want the usage rule for a thresholded cluster inside a flex row stated, so that it does not collapse to nothing.
14. As an application developer, I want every input I leave unset to render nothing, so that Yeti's own defaults apply and the server HTML stays Yeti's minimal markup.
15. As an application developer, I want the types of `gap`, `align`, `justify`, and `threshold` to be Yeti's own `YetiGap`, `YetiAlign`, `YetiJustify`, and `YetiWidth`, so that a value Yeti adds at a pin move becomes available without the package redeclaring it.
16. As an application developer, I want `gap` typed the same on `yetiCluster` as on `yetiStack`, `yetiBox`, and the other layouts, so that I learn one vocabulary and directives on one element agree.
17. As an application developer, I want to put the cluster on whatever element fits the content (`ul`, `nav`, `div`, a `div` inside a `dl`), so that the semantics stay mine.
18. As an application developer, I want my `role="list"` and `aria-label` on the cluster's host kept, so that list and landmark semantics stay as Yeti's docs write them.
19. As an application developer, I want to write `yetiCluster` beside `yetiEnter` on one element, so that a row of cards can arrive one after another as Yeti's docs show.
20. As an application developer, I want a cluster that is also a stack's child (`yetiCluster yetiStackChild split`), so that a card's row of links settles at the bottom of the card.
21. As an application developer, I want the cluster's item file loaded when the first cluster renders, so that I do not import `cluster.css` globally.
22. As an application developer, I want the item file removed after the last cluster leaves the page, so that a route without a cluster carries none of its CSS.
23. As an application developer, I want the item file in the server HTML when a server-rendered page has a cluster, so that the first paint is laid out.
24. As an application developer, I want the cluster laid out with JavaScript off under SSR and prerendering, so that the page reads correctly before any script runs.
25. As an application developer, I want hydration to change nothing on a cluster, so that I get no `NG05xx` error and no layout shift.
26. As an application developer, I want the cluster to work under zoneless change detection, so that a bound `gap` or `justify` updates when its signal changes.
27. As an application developer, I want a cluster inside a `@defer (hydrate on ...)` block laid out before and after the block hydrates, so that incremental hydration does not unstyle it.
28. As an application developer, I want a cluster inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated block is not unstyled when a live cluster elsewhere leaves.
29. As an application developer, I want to know that a cluster inside a client-only `@defer` block needs `cluster` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
30. As an application developer using `withI18nSupport()`, I want translated items in a cluster to hydrate without being re-rendered, so that localised pages keep the server's DOM.
31. As an application developer, I want a template reference to the directive (`#c="yetiCluster"`), so that the cluster follows the package's `exportAs` rule.
32. As an application developer, I want to import the directive from `ngx-yeti/cluster`, so that a `@defer` block can split it with the rest of the item.
33. As an application developer, I want to know that Yeti's `--yeti-space-*` tokens set the gap sizes and that the threshold widths are fixed in Yeti's CSS, so that I know what my theme can move.
34. As an application developer using Tailwind v4 beside the package, I want to know whether `cluster` collides with a Tailwind name, so that I can plan my layer statement.
35. As a screen-reader user, I want a cluster announced as whatever element it is, with no role of its own, so that a list of tags is a list and a row of links in a `nav` is navigation.
36. As a screen-reader user, I want the reading order of a cluster's items to be their source order, so that `justify` and wrapping never reorder what I hear.
37. As a keyboard user, I want focus to move through a cluster's links and buttons in the order I see them, so that wrapping never makes focus jump.
38. As a keyboard user, I want the cluster to add no tab stop, so that focus moves only to interactive content.
39. As a low-vision user, I want a cluster to wrap and, with a threshold, become a column at 320 CSS pixels, so that I never scroll horizontally to reach an item.
40. As a low-vision user who overrides text spacing, I want the cluster's items to keep their content visible, so that my spacing settings do not clip them.
41. As a pointer user, I want the gap between buttons kept, so that adjacent targets are easy to hit.
42. As a package maintainer, I want the contract check to cover the cluster's class, four attributes, and their values, so that a pin move that renames or removes one fails before release.
43. As a package maintainer, I want the SSR smoke to assert the server HTML of a cluster, the absence of a static `align`, and the item link, so that the first paint and the `removed` kind are proven.
44. As a package maintainer, I want the fixture app to render a cluster in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
45. As a package maintainer, I want no test to depend on a public token's default value or an unfrozen attribute default, so that a pin move that changes a default does not fail a test for no reason.
46. As a package maintainer, I want the class name `YetiCluster` checked against Yeti's typings at the pin, so that a future Yeti type named `YetiCluster` is caught at the pin move.
47. As a package maintainer, I want a cluster that shares its element with `yetiEnter` to carry both presence attributes, so that neither item's link is removed while the element is on the page.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/cluster/manifest.json`, `cluster.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `cluster`, `layout`, `Grids and Rows` |
| `class` | `cluster` |
| `attributes` | `data-gap` (enum, vocabulary `gap`, 29 values, default `md`); `data-align` (enum, vocabulary `align`: `start`, `center`, `end`, `stretch`, `baseline`; default `center`); `data-justify` (enum, vocabulary `justify`: `start`, `center`, `end`, `between`, `around`, `evenly`; default `start`); `data-threshold` (enum, vocabulary `width`: `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`; no default) |
| `classes`, `markers` | both empty |
| `children` | `> *`, at least one: "Anything sized by its content: tags, buttons, links, a logo and a nav." |
| `tokens` | `--yeti-space-md` (public, the default gap); `--_yeti-gap`, `--_yeti-align`, `--_yeti-justify` (private) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Use a list element when the items are a list." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: `flexbox gap`; `guarded`: none |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`: `.cluster` is `display: flex; flex-wrap: wrap` with `align-items`, `justify-content`, and `gap` read from the three private tokens. With no attribute, `.cluster:not([data-gap])` sets the gap to `--yeti-space-md`, `:not([data-align])` sets `center`, and `:not([data-justify])` sets `flex-start`. `.cluster > *` has `margin: 0`. `.cluster[data-threshold]` is `container-type: inline-size`, and seven `@container (inline-size < Nrem)` rules give each child `flex-basis: 100%` below the threshold: 12, 16, 24, 32, 48, 64, and 80 rem for `2xs` to `2xl`. Those widths are written as literals, "the width tokens' defaults, literal because a container condition cannot read a token" (`cluster.css:16-24`). The value rules for `data-gap`, `data-align`, and `data-justify` are not in the item file: they are the **Always-loaded group**'s `layouts/attributes.css` (`Y/src/layouts/attributes.css:5-37` for the gap, `:147-160` for align and justify), which set the same private tokens on any element.

The manifest's `support.unguarded` lists `flexbox gap` but not container queries, which `cluster.css` uses unguarded. Both are inside Baseline 2025 ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md) lists `container-queries` for `layout:cluster`), so the gap in the manifest changes nothing for the package (read).

Attributes left to the consumer: none of Yeti's. The consumer's own attributes on the host stay theirs: `role="list"` on a `ul` and `aria-label` on a `nav`, as Yeti's docs and example write them (ticket 26; building-blocks 1.1).

### 2. Contract mapping

| Contract piece | Yeti | Package | Type, default, static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `cluster` | static host class on `[yetiCluster]` (`YetiCluster`) | always | ADR 0003 point 1; Part 2 row 4 |
| Attribute `data-gap` | space between items and between wrapped rows | `gap` input, bound as `[attr.data-gap]` | `YetiGap \| undefined`, default `undefined` (renders nothing; Yeti's `md` applies). `gap` is not an HTML attribute | ADR 0070 rule R; ticket 26 row 15 |
| Attribute `data-align` | vertical alignment within a row | `align` input, bound as `[attr.data-align]` | `YetiAlign \| undefined`, default `undefined` (Yeti's `center`). HTML `align`: `removed`, the directive binds `'[attr.align]': 'null'` | ADR 0070 rule R; ticket 26 row 16; building-blocks 1.4 |
| Attribute `data-justify` | distribution along the row | `justify` input, bound as `[attr.data-justify]` | `YetiJustify \| undefined`, default `undefined` (Yeti's `start`). Not an HTML attribute | ADR 0070 rule R; ticket 26 row 17 |
| Attribute `data-threshold` | the cluster's own width below which it is a column | `threshold` input, bound as `[attr.data-threshold]` | `YetiWidth \| undefined`, default `undefined` (no threshold, not a container; the manifest has no default). Not an HTML attribute | ADR 0070 rule R; ticket 26 row 18 |
| Markers | none | no part or child directive | manifest `markers: []` | ADR 0070 |
| Children | `> *` | none: a child Yeti styles only by position gets no directive | building-blocks 1.1 | manifest `children` |
| Events | none | no output | manifest `js: null`; [events](events.md) | ticket 26 |
| Token `--yeti-space-md` | the default gap | the consumer's; the package writes none | n/a | ADR 0004 |
| Private tokens `--_yeti-gap`, `--_yeti-align`, `--_yeti-justify` | Yeti's internals | never read or written | n/a | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-cluster` (empty value) | always | ADR 0045; ADR 0080 point 2 |
| Injection tokens, Defaults token | none | none | n/a | building-blocks 1.4 and 1.9 |

The four types come from the package's generated copy of Yeti's typings at the pin, re-exported by name from the primary entry point (ADR 0060 point 10; ADR 0080 point 5). Checked in Yeti's built `dist/yeti.d.ts` at the pin: `YetiAlign` (`:3`), `YetiGap` (`:10`), `YetiJustify` (`:12`), and `YetiWidth` (`:33`) hold exactly the manifest's values. A static `gap="xs"` type-checks as the literal `'xs'` (ADR 0070 rule 2), so `gap="sx"` fails to compile under strict template type checking.

**Module replaced:** none. Yeti's `cluster` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 4, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-space-md` for its default gap, and through `attributes.css` the `--yeti-space-*` step a bound `gap` names (and, for a fluid pair, the always-loaded scale's private interpolation). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; the space steps are derived tokens, so a consumer may also set them on one element to change one cluster's gaps (`Y/src/guides/theming.md:38`). The threshold widths are not tokens: they are literals in `cluster.css`, so a theme that changes `--yeti-width-sm` does not move a cluster's `sm` threshold (`cluster.css:16-24`). **Private tokens** (`--_yeti-*`) are never read or written.

### 3. Hierarchy and DI shape

None. `YetiCluster` is a standalone item directive. It provides no injection token, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). Its children need no directive, because Yeti styles them only as `> *` (building-blocks 1.1).

A consumer composes it with other directives on one element by writing them side by side (building-blocks 1.9):

- `yetiEnter` with `stagger`, so a row's items arrive in turn (Yeti's `enter` docs; [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) names "`enter` on a `cluster`");
- `yetiStackChild` with `split`, so a cluster is the row that settles at the bottom of a card (`Y/src/guides/layouts.md:159-169`);
- an any-element directive such as `yetiPaint` or `yetiBorder` (ADR 0070 rule G).

Each of these marks the host with its own presence attribute, so the element carries `data-ngx-yeti-item-cluster` beside, for example, `data-ngx-yeti-item-enter` (ADR 0045).

Shared input names: `gap` is typed `YetiGap` on every item that declares it, and `align` is `YetiAlign` on every root directive that declares it, so two items on one element receive one value of one type (building-blocks 1.4, shared vocabularies; architecture-guide P9). `justify` is `YetiJustify` on `cluster`, `columns`, and `pagination`, and `YetiScrollerJustify` (declared as `Extract<YetiJustify, 'start' | 'center' | 'end'>`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 60) on `scroller` (ticket 26 rows 17, 22, 55, 133). A cluster and a scroller on one element would be two layouts setting one element's `display`, which Yeti's docs never write, so this spec reads that the two cannot share an element and P9's rule is not broken (inferred).

The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('cluster')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which the directive acquires and releases the `cluster` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's; this spec only names the item it acquires.

Generated ids and the platform's relationship attributes: none. The cluster renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | Value |
| --- | --- |
| Class | `YetiCluster`. Checked at the Pin: `yeti.d.ts` exports 46 names and `YetiCluster` is not one of them (`rg` over Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used), so the name takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) |
| Selector | `[yetiCluster]` (Part 2 row 4; [Decide: the glossary](../issues/10-decide-glossary.md)) |
| `exportAs` | `yetiCluster` (building-blocks 1.3) |
| Entry point | `ngx-yeti/cluster` (building-blocks 1.3; ADR 0011 clause 10) |
| Host | `class: 'cluster'`; `'data-ngx-yeti-item-cluster': ''` (both static); `'[attr.data-gap]': 'gap() ?? null'`, and the same for `data-align`, `data-justify`, `data-threshold`; `'[attr.align]': 'null'`, with a source comment naming the effect it prevents (a static `align` is a `text-align` hint in Blink and WebKit; building-blocks 1.4) |
| Inputs | `gap: input<YetiGap>()`, `align: input<YetiAlign>()`, `justify: input<YetiJustify>()`, `threshold: input<YetiWidth>()`, each defaulting to `undefined` |
| Models, outputs, methods | none |
| Lifecycle | acquires the `cluster` item file, on the server too, with `injectYetiItemStyles('cluster')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it on destroy, through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

No default differs from Yeti's: every input is unset by default and renders nothing (ADR 0070 rule 1). The directive does not compute an effective value, because nothing in it behaves differently by value.

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiCluster` on the element whose children are the row's items: a `ul` when the items are a list, with `role="list"` as Yeti writes it; a `nav` with an `aria-label` for a row of site links; a `div` otherwise (manifest `a11y.notes`; `docs.md`; `example.html`). The cluster adds no semantics of its own.
2. Do not write `class="cluster"`, `data-gap`, `data-align`, `data-justify`, `data-threshold`, or `data-ngx-yeti-item-cluster` statically on the host. The directive binds them all; a static Yeti attribute is written back at hydration and removed again by the unset binding ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), 2026-10-03 note; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through the input as `[gap]="$any('new')"` (ADR 0070).
3. Give a thresholded cluster a block that has a width. Do not make it an item of another cluster, or of any flex row that sizes its items by their content, unless it has a width of its own or `flex-grow` (`docs.md`, "A column when it is narrow"; `Y/bin/validate.js:703-717`, which warns about the direct-child case). The package's **Misuse warning** for it is a later-milestone check (map, Milestones).
4. Do not reorder items visually (no `order` and no `row-reverse` in an **Application class** on the items or the host), so that reading and focus order stay the source order (WCAG 1.3.2 and 2.4.3; manifest `a11y.notes`, "Purely visual").
5. `align` may be written in its static form (`align="end"`); the directive removes the HTML attribute it would otherwise leave (building-blocks 1.4, `removed` kind). The hydration rule of usage rule 2 does not cover this static form of a `removed` input ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).
6. Import `YetiCluster` in every component whose template writes `yetiCluster`. A **Forgotten import** renders an unstyled element with no error when every input is written in its static form; a bound input (`[gap]`) makes the compiler report it (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `cluster` | Nearest in Angular Material: `mat-chip-set` |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's element; the consumer's children are the items | a component whose template wraps the projected chips in its own `div` (`NC/src/material/chips/chip-set.ts:38`) |
| Layout | Yeti's wrapping flex row with a gap on both axes, distribution, alignment, and a container-query column | a wrapping flex row (`chip-set.scss:35-38`), spaced by chip margins |
| Accessibility | no role of its own; the consumer's element and `role="list"` carry the semantics | `role="presentation"` by default when it has chips, with a `role` input (`chip-set.ts:65`, `:99-105`); `mat-chip-listbox` and `mat-chip-grid` are composite widgets |
| API | four typed inputs and `exportAs` | `role`, `tabIndex`, `disabled`, and the chips' own API |

Nothing from Material's API is taken: the chip set is a container for interactive chips, and the cluster is layout only, so it neither adds a role nor manages focus. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 4; building-blocks 1.2). The reason: Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs` (row 1's reason, which row 4 takes, "as row 1"). The threshold is a container query in Yeti's CSS, so the package has no `ResizeObserver`, no `BreakpointObserver`, and no viewport-keyed input (building-blocks 1.7; Part 2 row 4: "`threshold` is a container query (1.7)"). No Aria pattern applies (a cluster has no role), and no CDK piece is used: there is no id, focus, keyboard, direction, or observer. Right-to-left needs nothing: flex rows and `justify-content` follow the writing direction.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The cluster has no role, state, or property, and adds no tab stop. A row of links in a `nav` is the consumer's landmark; a list of tags is the consumer's list.
- **Keyboard:** none of its own. Tab moves through the items' own focusable elements in source order.
- **Names:** none. The consumer names a `nav` cluster with `aria-label`, as Yeti's example does (building-blocks 1.10, Names).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The cluster is the consumer's element with no role. List semantics come from a `ul` or `ol` with `role="list"`, landmark semantics from a `nav`, and a term and its value from `dt` and `dd` inside a `dl` (usage rule 1; manifest `a11y.notes`). |
| 1.3.2 Meaningful Sequence | Flex wrapping keeps source order, and `justify` only distributes space; DOM order is reading order (Yeti's note "Purely visual"; ticket 17 read reading order equal to source order for the layouts). Usage rule 4 keeps an Application class from reordering. |
| 2.4.3 Focus Order | As 1.3.2: the visual order of wrapped items is the source order, so focus follows what is seen. |
| 1.4.10 Reflow | The row wraps at any width; with a threshold it becomes a column of full-width items. Yeti's example page had no page-level horizontal scroll at 320 px in ticket 17's run (measured in Chromium; 46 of 49 pages passed, and `cluster` was not among the three that failed, `research/yeti-accessibility-and-standards.md` section 2.4). Usage rule 3 prevents the one collapse Yeti documents. Layer 4 asserts no horizontal overflow at a 320 px viewport. |
| 1.4.4 Resize Text | The gaps are `--yeti-space-*` steps in `rem` with fluid pairs, and the thresholds are in `rem`, so both follow text zoom (read). |
| 1.4.12 Text Spacing | The rules set no height and no overflow; overridden spacing grows the items, which wrap (read). |
| 2.5.8 Target Size (Minimum) | The cluster does not size its items, and its default gap keeps adjacent targets apart. With `gap="none"` the targets' own size decides; Yeti's examples pass axe-core's `target-size` rule, which the Story gate runs on every story (ADR 0014 point 1). This spec reads that the gap is the consumer's choice and adds no check (inferred). |
| 4.1.2 Name, Role, Value | Nothing rendered has a name, role, or value. |

Yeti's `cluster` example passes axe with the WCAG 2.2 AA tags in Chromium, Firefox, and WebKit, and the Nu checker reports no error (ticket 17, measured); WebKit's Playwright default skips links on Tab, which is the browser's setting, not Yeti's (`research/yeti-accessibility-and-standards.md:34`).

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 4, "Ledger: none"). The cluster adds no feature Yeti lacks: the `removed` binding for `align` keeps Yeti's own behaviour against an HTML side effect the package's input name introduces, and is not a standards feature.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<nav yetiCluster gap="sm" aria-label="Site">
  <a yetiBox surface="raised" yetiBorder href="/">Home</a>
  <a yetiBox surface="raised" yetiBorder href="/docs">Docs</a>
  <a yetiBox surface="raised" yetiBorder href="/guides">Guides</a>
</nav>
```

Server HTML and the hydrated DOM are the same. The `nav` carries `yeticluster=""`, `gap="sm"` (a static input attribute stays on the element, building-blocks 1.4; `gap` is not an HTML attribute), `aria-label="Site"`, `class="cluster"`, `data-gap="sm"`, and `data-ngx-yeti-item-cluster=""`, and no `data-align`, `data-justify`, or `data-threshold`. The server also writes the `cluster` and `box` item links into `<head>` in Yeti's order: for the cluster, `rel="stylesheet"`, `href` `<url>layouts/cluster/cluster.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="cluster"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts the links at bootstrap.

With `align`: `<div yetiCluster align="baseline">` renders `class="cluster"`, `data-align="baseline"`, and no `align` attribute in the server HTML. During hydration Angular writes the static `align="baseline"` back and the binding's first client pass removes it again ([Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) rows 5 and 6, read; no frame is painted between the two, which layer 4 asserts; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).

With a threshold: `<div yetiCluster threshold="sm" gap="xs">` renders `data-threshold="sm"`, which makes the `div` an inline-size container; below 24 rem of its own width every child takes the whole row.

The cluster has no closed or open state. The delta from Yeti's docs markup: the consumer writes `yetiCluster` and the input names where the docs write `class="cluster"` and the `data-*` attributes.

### 9. Animation

None. The cluster has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may write `yetiEnter` with `stagger` beside it to make the items arrive in turn; the motion is the `enter` utility's, which loads its own item file ([specs/enter.md](enter.md)). A consumer may remove a cluster with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A cluster that is server-rendered never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static host class and presence attribute, the four `data-*` attributes from bound inputs, no `align` attribute, plus the item link in `<head>` (section 8). Nothing is **Pre-hydration state**: no person and no Yeti module can change a cluster's attributes before hydration (ADR 0003 point 4; ADR 0070 rule S names `data-once` as the only such attribute).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too. The threshold's container query works on the server HTML before any script.
- **Full hydration:** the element is claimed as is; the bindings write the values the server wrote; 0 style mutations from the item link (ADR 0060 point 5, measured for the mechanism). The static `align` rewrite is section 8's.
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the cluster and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). Hydrating the block changes no attribute.
- **`hydrate never`:** the cluster is its server HTML and stays laid out while the host is connected, whatever live clusters do, because the presence attribute keeps the link (ADR 0045; ADR 0060 point 4). There is no Angular behaviour to lose; bound inputs keep their server values.
- **Client-only `@defer`, `@if`, `@for`, routes:** the item file is fetched when the directive is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['cluster'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added to the cluster. Items inside it replay their own listeners.
- **`withI18nSupport()`:** a cluster's items are usually translated with `i18n` in the consumer's component. The directive adds no `i18n` block of its own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** the inputs are `input()` signals read by host bindings, so a bound `[gap]` or `[justify]` refreshes without zone.js (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the cluster is laid out, wraps, and turns into a column under its threshold, because the class, the attributes, and the item link are in the server HTML and the threshold is CSS. Nothing is lost: the cluster has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the cluster may sit in any boundary; it has no parts and no references. Its items may be split across `@defer` blocks inside it, each item hydrating on its own trigger, because Yeti styles them only as children.

### 11. Hydration constraints

The cluster complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static, and the four `data-*` attributes are bindings on input signals, equal on both sides ([Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) row 15, "complies"). The one difference during hydration is the static `align` written back and removed again in the same pass (row 6, "at risk", read; accepted by [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9).
- **No direct DOM manipulation:** the directive writes nothing to the DOM itself. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client, in `<head>`, outside the hydrated tree.
- **Valid HTML:** the directive changes no element. A cluster that is a term and its value is a `div` wrapping a `dt` and its `dd` inside a `dl`, which HTML allows (`docs.md`); a cluster on a `ul` keeps `li` children. Invalid nesting that the parser repairs is the consumer's to avoid.
- **`preserveWhitespaces`:** the directive has no template. Whitespace text between inline items is the consumer's template's; a flex container ignores it for layout.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 2 keeps the consumer from writing Yeti's; usage rule 5 states the `align` case.

### 12. Single-page application

None. The cluster has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A cluster of `routerLink`s keeps working, because the links are the consumer's and the directive declares no listener. On a route change, a route's clusters leave with the route, and the item link is removed in the animation frame after no element with `data-ngx-yeti-item-cluster` is connected (ADR 0045; ADR 0060 point 4). A route that renders a cluster again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/cluster/cluster.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiCluster]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:21`, the rank table of point 3), and removed after the last host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (whose `layouts/attributes.css` holds the gap, align, and justify value rules), and optionally `provideYetiStyles({ preload: ['cluster'] })`. The cluster adds nothing to it. Cross-item files acquired: none (`cluster.css` has no selector naming another item; ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, and the geometry of the items (on one row or several, the gap between them, at the edges or not, full width or not). It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on an unfrozen attribute default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3; ADR 0070 rule 1). Where a test needs a gap size, it compares the measured gap with a probe element in the same story whose inline style is `gap: var(--yeti-space-<step>)`, so the assertion holds for any token value. Where a test needs a threshold, it sizes the container well below the smallest threshold (10 rem) and well above the largest (90 rem), so it holds for any literal Yeti picks at a pin move. Stories and e2e tests that show the threshold resize the container, not only the viewport, because that is what Yeti's CSS reads (building-blocks 1.7). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `cluster` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `cluster--default`: Yeti's example, a `nav` of eight raised boxes with `gap="sm"` and `aria-label`. Asserts `class="cluster"`, `data-gap="sm"`, `data-ngx-yeti-item-cluster`, no `data-align`, `data-justify`, or `data-threshold`, no `tabindex`, and the accessible role `navigation` named "Site". At a wide container all items share one row; at a narrow one they wrap, and the horizontal gap and the gap between rows both equal the `sm` probe.
- `cluster--tags`: Yeti's docs list, a `ul` with `role="list"` and `gap="xs"`. Asserts the role `list` with three `listitem`s and the `xs` probe gap.
- `cluster--justify`: one cluster per `justify` value in a fixed-width container. Asserts for `between` that the first item's left edge and the last item's right edge meet the cluster's edges (Yeti's own test, `Y/test/browser/layouts/cluster.spec.js`); for `end` that the last item meets the end edge; and, inside `dir="rtl"`, that `start` puts the first item at the right edge.
- `cluster--align`: items of different heights with each `align` value. Asserts the items' `align-self` result by geometry (tops equal for `start`, bottoms equal for `end`), and that the host has no `align` attribute although the story writes the static form.
- `cluster--legend`: Yeti's legend, a `dl` stack whose rows are `div` clusters with `justify="between"` and a `yetiNumeric` value. Asserts each `dt` at the start edge and each `dd` at the end edge, and the description-list roles.
- `cluster--threshold`: three buttons in a cluster with `threshold="sm"` inside a resizable wrapper. At 10 rem every child's width equals the cluster's and each sits below the one before; at 90 rem they share one row. Asserts the cluster's `container-type` is `inline-size`, and that the cluster in `cluster--default` has `container-type: normal`.
- `cluster--threshold-in-row`: a thresholded cluster as an item of another cluster, given `flex-grow: 1` inline (usage rule 3). Asserts its width is greater than zero and its items are visible.

### Layer 2: browser-level (`npx nx test <lib>`, `cluster.spec.ts`)

Through `TestBed.createDirective(YetiCluster, { tagName: 'div', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- the host has class `cluster` and `data-ngx-yeti-item-cluster`;
- with no bindings, the host has no `data-gap`, `data-align`, `data-justify`, `data-threshold`, or `align`;
- each input bound through `bindings` renders its attribute with the value; setting it back to `undefined` removes the attribute, after `whenStable()` with no manual change detection (zoneless);
- the host has no other attribute from the package and no listener;
- while the fixture lives, one `<link data-ngx-yeti-styles="cluster">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link, and it stays until both are destroyed.

A small test host covers what `createDirective` cannot: a template reference `#c="yetiCluster"` resolves to the `YetiCluster` instance; a static `align="end"` leaves `data-align="end"` and no `align` attribute; the consumer's own `class`, `role="list"`, and `aria-label` are kept; and `<ul yetiCluster yetiEnter="rise" stagger>` carries both `data-ngx-yeti-item-cluster` and `data-ngx-yeti-item-enter` (ADR 0045).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `cluster.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose items carry `i18n` (building-blocks 1.11 decision 11, 1.12): `<ul yetiCluster gap="xs" justify="between" align="baseline" threshold="sm" role="list">`. `whenStable()` resolves; the server HTML has `class="cluster"`, `data-gap="xs"`, `data-justify="between"`, `data-align="baseline"`, `data-threshold="sm"`, and `data-ngx-yeti-item-cluster`, and has no `align` attribute (building-blocks 1.4: the SSR smoke writes the static form and asserts that the attribute is absent); `<head>` holds one item link with `data-ngx-yeti-styles="cluster"`, `data-beasties-skip`, and an `href` ending `layouts/cluster/cluster.css?v=<pin>`; the cluster carries no `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the cluster through the contract mapping: class `cluster` has `YetiCluster`; `data-gap`, `data-align`, `data-justify`, and `data-threshold` have the inputs `gap`, `align`, `justify`, and `threshold`, whose unions hold exactly the manifest's values; the markers and events for `cluster` are empty, so a pin move that adds one fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 Story ids: the threshold story resized through its wrapper in Chromium, Firefox, and WebKit; the wrap and gap of `cluster--default` at 320 px and 1600 px.

Fixture app half, built with `outputMode: 'server'`, with a `/cluster` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0014's 2026-10-03 note):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- a `MutationObserver` installed before the main bundle records the `align` attribute's rewrite and removal on the `align="baseline"` cluster during hydration, and a `requestAnimationFrame` probe records whether a frame is painted while it is present; the test asserts the attribute is absent after hydration and that no frame is painted while it is present (ticket 33 row 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9; if this fails, every `removed`-kind spec switches to bound-only inputs);
- with JavaScript disabled the clusters wrap, the thresholded one is a column in a narrow container, and `@axe-core/playwright` with the six tags reports no violation;
- a cluster inside a client-only `@defer` block with `cluster` in the preload list shows no unstyled frame; a cluster inside a `hydrate never` block stays laid out after every live cluster on the page is removed; a `yetiCluster yetiEnter` host inside `hydrate never` keeps both item links after every live cluster and every live enter has left (ADR 0045 consequences);
- navigating from the cluster route to a route without a cluster removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow (1.4.10).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and docs snippets for the stories; Yeti's `Y/test/browser/layouts/cluster.spec.js` for the geometry assertions (one row when there is room, the gap on both axes, `between` at the edges, the threshold column, `container-type` only on a thresholded cluster); ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 30's `MutationObserver` record of a static attribute rewritten at hydration for the `align` measurement.

## Out of Scope

- An input per token, a gap or threshold provider, or a theme (ADR 0004).
- A `ResizeObserver`, a breakpoint input, or any viewport-keyed behaviour (building-blocks 1.7).
- A child directive for the cluster's items: Yeti styles them only by position (building-blocks 1.1; manifest `markers: []`).
- A role, a keyboard model, or a roving tab stop on the cluster: it is layout only (manifest `a11y.notes`). A consumer who wants a toolbar of buttons uses the `buttons` item.
- The Misuse warning for a thresholded cluster inside another cluster, and any check of the host element: later milestone (map, Milestones); usage rules 1 and 3 state them.
- Package CSS for the cluster: Yeti's CSS meets the criteria in section 7, and the package adds no ledger row.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).
- `deployUrl`: unsupported (map, Standing rulings).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiCluster]` with `gap`, `align`, `justify`, `threshold`; types only | building-blocks Part 2 row 4; [Decide: the spec list](../issues/11-decide-spec-list.md) row 4 ("Attribute-only.") |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Each attribute an input on the root directive, named in camelCase, unset renders nothing | ADR 0070 rules R and 1; ticket 26 rows 15 to 18 |
| Types `YetiGap`, `YetiAlign`, `YetiJustify`, `YetiWidth` from the generated types copy | ADR 0005; ADR 0060 point 10; ADR 0080 point 5 |
| `align` is the `removed` kind: `'[attr.align]': 'null'` | ticket 26 row 16; building-blocks 1.4; architecture-guide P9 |
| Static `align` form allowed despite the hydration rewrite | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9 |
| `exportAs: 'yetiCluster'`; class `YetiCluster` with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/cluster` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1; the threshold is Yeti's container query | building-blocks 1.2 and 1.7; Part 2 row 4 |
| Tokens are the consumer's | ADR 0004 |
| Presence attribute `data-ngx-yeti-item-cluster` | ADR 0045 |
| Item file as a counted link | ADR 0060 points 2 to 6 |
| No ledger row | Part 2 row 4; ledger format |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A list of tags (Yeti's docs):

```html
<ul yetiCluster gap="xs" role="list">
  <li i18n>css</li>
  <li i18n>layout</li>
  <li i18n>intrinsic</li>
</ul>
```

A legend whose rows are a term and its value at the two ends (Yeti's docs):

```html
<dl yetiStack gap="xs">
  <div yetiCluster justify="between"><dt>Distance</dt><dd yetiNumeric>14.2 km</dd></div>
  <div yetiCluster justify="between"><dt>Ascent</dt><dd yetiNumeric>1,120 m</dd></div>
</dl>
```

A row of actions that becomes a column in a narrow sidebar (Yeti's docs):

```html
<div yetiCluster threshold="sm" gap="xs">
  <a yetiButton href="/save">Save</a>
  <a yetiButton emphasis="medium" href="/preview">Preview</a>
  <a yetiButton emphasis="low" href="/discard">Discard</a>
</div>
```

A card's links settling at the bottom of the card (`Y/src/guides/layouts.md:159-169`), and a row whose items arrive in turn:

```html
<nav yetiCluster yetiStackChild split gap="sm" aria-label="Card actions">...</nav>
<ul yetiCluster gap="md" justify="center" yetiEnter="rise" stagger role="list">...</ul>
```

```ts
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiStack } from 'ngx-yeti/stack';
import { YetiNumeric } from 'ngx-yeti/table';

@Component({
  selector: 'app-trail-legend',
  imports: [YetiCluster, YetiStack, YetiNumeric],
  templateUrl: './trail-legend.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailLegend {}
```

`YetiNumeric` is the `table` item's any-element directive (building-blocks Part 2 row 39), so this example imports it from `ngx-yeti/table`; the table spec fixes its entry point.

A bound gap that follows a signal: `<div yetiCluster [gap]="dense() ? 'xs' : 'md'">`. A page whose cluster renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['cluster'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/cluster/cluster.css`, loaded by the directive as a counted link (section 13). The consumer writes nothing for the cluster beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` turns `data-gap`, `data-align`, and `data-justify` into the private tokens the cluster reads (`:5-37`, `:147-160`); `tokens/space.css` declares the `--yeti-space-*` steps and `tokens/scale.css` the fluid interpolation the gap pairs use.
3. **Cross-item rules:** none in `cluster.css`. `toc.css` names `.cluster` in `.toc > ul:not(.cluster)`, so a toc whose list is a cluster keeps the cluster's row and gap (`Y/src/components/toc/toc.css:24-33`); that rule is the toc item's, and the `yetiCluster` on that list acquires its own item file.
4. **Tokens:** reads `--yeti-space-md` and the space steps; writes none (section 2).
5. **What breaks without the item file:** the host is no flex container, so the children render as their own display (blocks stack with no gap, inline items run as text), and `data-threshold` does nothing; no error.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `cluster` (that Tailwind generates no `cluster` utility is inferred, not measured).

### Platform features to adopt when the browser target moves

None for the package. Flex `gap` and container queries are inside Baseline 2025 and used unguarded by Yeti (section 1). A container condition that can read a custom property would let Yeti tie the thresholds to `--yeti-width-*` (`cluster.css:16-24`); that is a Yeti change at a pin move, not the package's.

### Single-page-application pieces relied on

None: the cluster uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service and ADR 0045's presence attribute for route changes (section 12).
