# Spec: timeline (layout)

Ticket: [67. Spec: timeline (layout)](../issues/67-spec-timeline.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 17 and Part 1, [Decide: the spec list](../issues/11-decide-spec-list.md) row 17, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 68 and 69, [ADR 0002](../adr/0002-browser-target-baseline-2025.md), [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md), and [ledger.md](../ledger.md) row A11Y-10a. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at 22.2.x (`708d4c6e2`). The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 63 to 66), and each is cited where it applies.

Two words need care. Yeti's docs call the dot beside each entry a "marker"; this spec says **entry dot**, because **Marker** is the glossary's word for a `data-*` attribute that names a part, and the timeline has none. And the timeline's `li` children are **entries**, as Yeti's manifest calls them, never "items", because **Item** is one of Yeti's 49.

## Problem Statement

Yeti's `timeline` layout is for "A history, a changelog, the steps of a process, a schedule: entries in order along a line. It is an ordered list with a rail, so it reads as a list and looks like a timeline" (`Y/src/layouts/timeline/docs.md`). It is one **Identity class**, `timeline`, on an `ol`, and two attributes, `data-gap` and `data-alternate`. Every `li` child is an entry with an entry dot on a rail down the list's start edge. With `data-alternate`, once the list's own content box is at least 48rem wide, the rail moves to the centre and the entries take turns on either side. It has no **Marker**, no **Module**, and no events (`Y/src/layouts/timeline/manifest.json`).

An application developer using the package cannot write `class="timeline"` or either `data-*` attribute: a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). Written by hand, `data-gap="large"` compiles and silently falls back to Yeti's default. The developer also needs the `timeline` **Item file** loaded while a timeline is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)); without it the entries render as a plain list with no rail, no dots, and no gap, with no error.

What makes this layout different from its neighbours is that its accessibility lives in the markup the consumer writes. Yeti's manifest asks for three things: "Use an ordered list, so the sequence is announced, and a time element with datetime in each entry. The rail and markers are decorative. Give the ol role=\"list\": removing the list markers removes the list semantics in some engines" (`manifest.json`, `a11y.notes`). The package can enforce the first through its selector, and must state the other two as usage rules. Its contrast is also one of five items axe could not compute on Yeti's own example: `color-contrast` was incomplete on the three `time` elements in all three engines, "background color could not be determined due to a pseudo element" ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md), measured; [ledger.md](../ledger.md) A11Y-10a). So the package must check that contrast itself ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3).

## Solution

One directive in the secondary entry point `ngx-yeti/timeline` ([building-blocks.md](../building-blocks.md) Part 2 row 17; 1.3):

- The **Item directive** `YetiTimeline`, selector `ol[yetiTimeline]`, `exportAs: 'yetiTimeline'`. It binds `timeline` as a static host class, binds `data-gap` from a `gap` input typed `YetiGap` and `data-alternate` from an `alternate` input typed `boolean` with `booleanAttribute` (ticket 26 rows 68 and 69, kind R), sets its presence attribute `data-ngx-yeti-item-timeline` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `timeline` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2).

The developer writes `<ol yetiTimeline alternate role="list">` where Yeti's docs write `<ol class="timeline" data-alternate role="list">`. An unset `gap` renders no attribute, so Yeti's default `lg` applies from its CSS, and `alternate` false renders no `data-alternate` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1). `role="list"` stays the consumer's (Part 2 row 17; building-blocks 1.1), as do the entries, the `time` elements with their `datetime`, and the headings. The directive is **types only** in building-blocks' sense: no listener, no render callback, and no DI beyond ADR 0060's root styles service, which every types-only item directive injects (ticket 50, decision 18). It has no part directive, because the manifest declares no marker and an entry carries no input.

Everything else is Yeti's CSS and the platform. The list is its own inline-size container, so whether it alternates is decided by its own width on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. The rail and the entry dots are pseudo-elements with empty content, so they add nothing to the accessibility tree. The story play function computes the `time` elements' contrast with the exact WCAG formula, which closes what axe left incomplete (A11Y-10a).

## User Stories

1. As an application developer, I want to lay out an ordered list as a timeline with one directive attribute, so that I never write Yeti's `timeline` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="timeline"` and `data-*` attributes, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the directive to match only an `ol`, so that the markup Yeti's manifest asks for ("Use an ordered list") is the only markup the directive styles.
4. As an application developer, I want to set the space between entries with a `gap` input typed by Yeti's `gap` vocabulary, fluid pairs included, so that `gap="large"` fails to compile.
5. As an application developer, I want to turn on alternating sides with a bare `alternate` attribute, so that `<ol yetiTimeline alternate>` reads like Yeti's `data-alternate`.
6. As an application developer, I want `[alternate]="false"` to remove `data-alternate`, so that a bound boolean switches the mode both ways.
7. As an application developer, I want a static attribute such as `gap="md"` to type-check, so that I need no property binding for a constant.
8. As an application developer, I want an input I leave unset to render no attribute, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
9. As an application developer, I want to change a bound input at run time and see the layout follow, so that a density setting in my UI can change the gap.
10. As an application developer, I want an alternating timeline to fall back to one side when the list itself is narrower than 48rem, so that the same markup works in a sidebar and across a page.
11. As an application developer, I want the switch to follow the list's own width, not the viewport's, so that a timeline in a narrow column never alternates by mistake.
12. As an application developer, I want a rail and an entry dot beside each entry with no markup of mine, so that the timeline looks like a timeline from a plain list.
13. As an application developer, I want the entries to read top to bottom in source order in both modes, so that the visual order is the order I wrote.
14. As an application developer, I want to know that the layout sets the space between entries and the room beside the rail, so that I do not add entry margins or padding that fight it.
15. As an application developer, I want `@for` and `@if` inside the list to add entries without wrapper elements, so that a list of events renders as entries.
16. As an application developer, I want to be told that every direct child must be an `li`, so that my list stays valid HTML and hydrates cleanly.
17. As an application developer, I want each entry's content (a `time` with `datetime`, a heading, text) to be mine, so that I choose the heading level and the date format.
18. As an application developer, I want the timeline item file loaded when the first timeline renders and removed after the last leaves, so that I do not import `timeline.css` globally.
19. As an application developer, I want the item file in the server HTML when a server-rendered page has a timeline, so that the first paint already has the rail.
20. As an application developer, I want the layout right with JavaScript off under SSR and prerendering, so that the page reads the same before any script runs.
21. As an application developer, I want hydration to change nothing on a timeline, so that I get no `NG05xx` error and no reflow.
22. As an application developer, I want the layout to work under zoneless change detection, so that the package fits Angular's recommended mode.
23. As an application developer, I want a timeline inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated block is not unstyled when a live timeline elsewhere leaves.
24. As an application developer, I want to know that a timeline inside a client-only `@defer` block needs `timeline` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
25. As an application developer, I want `data-show` and `data-hide` inside an entry to work without an extra `container`, so that I can hide an entry's detail in a narrow timeline.
26. As an application developer, I want a template reference (`#t="yetiTimeline"`), so that the directive follows the package's `exportAs` rule.
27. As an application developer, I want to import the directive from `ngx-yeti/timeline`, so that a `@defer` block can split it with the rest of the item.
28. As an application developer, I want the `gap` type re-exported by name from the package (`YetiGap`), so that I can type my own signals that feed the input.
29. As an application developer, I want the usage rules stated (an `ol` with `role="list"`, only `li` children, at least two, a `time` with `datetime`, nothing meaningful in the dots), so that I use the layout as Yeti intends.
30. As an application developer using Tailwind v4 beside the package, I want to know whether `timeline` collides with a Tailwind name, so that I can plan my layer statement.
31. As a screen-reader user, I want the timeline announced as a list with its number of entries in every engine, WebKit included, so that I know how long the history is.
32. As a screen-reader user, I want each entry announced as a list item in source order, so that the sequence is clear.
33. As a screen-reader user, I want each date exposed through a `time` element with a machine-readable `datetime`, so that the date is unambiguous to tools that read it.
34. As a screen-reader user, I want the rail and the entry dots to add nothing to what I hear, so that decoration does not interrupt the entries.
35. As a screen-reader user, I want headings inside entries to be real headings, so that I can jump between entries by heading.
36. As a sighted keyboard user, I want Tab to move through links inside the entries in the order they are drawn, so that focus never jumps across the centre line out of sequence.
37. As a low-vision user, I want each entry's date to meet WCAG 2.2 AA contrast in light and dark schemes, so that I can read when each thing happened.
38. As a low-vision user, I want the timeline to fall to one side when I zoom in or the container narrows, so that I never scroll sideways to read an entry.
39. As a low-vision user who overrides text spacing, I want entries to grow with their content, so that my spacing settings clip nothing.
40. As a user of a right-to-left language, I want the rail on the start edge and the first entry on the start side, so that the timeline mirrors with my reading direction.
41. As a package maintainer, I want the contrast of A11Y-10a asserted in the play function with the exact WCAG formula, so that the ledger row is met by a test, not by assumption.
42. As a package maintainer, I want the contract check to cover both attributes and every value of the `gap` vocabulary, so that a pin move that adds a value or attribute fails before release.
43. As a package maintainer, I want the SSR smoke to assert the server HTML of a timeline and its item link, so that the first paint is proven.
44. As a package maintainer, I want the fixture app to render the timeline on a prerendered and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
45. As a package maintainer, I want the e2e run to resize the container across the alternate threshold in three engines, so that a container-query difference between engines shows up in CI.
46. As a package maintainer, I want no test to depend on a public token's default value or on Yeti's default `gap`, so that a pin move that changes a default fails no test for no reason.
47. As a package maintainer, I want the class name checked against Yeti's typings at the pin, so that `YetiTimeline` stays correct if Yeti ever exports a type of that name.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/timeline/manifest.json`, `timeline.css`, `docs.md`, and `example.html`, in `Y/src/guides/layouts.md`, and in Yeti's own test `Y/test/browser/layouts/timeline.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `timeline`, `layout`, `Grids and Rows` |
| `class` | `timeline` |
| `attributes` | `data-gap` (vocabulary `gap`, 29 values; default `lg`: "Space between entries."), `data-alternate` (boolean: "Put entries on alternate sides of a centred rail once the list is wide enough.") |
| `classes` | empty |
| `children` | `> li` (min 2, max none: "The entries, in order. Put a time, a heading, and text inside each.") |
| `markers` | none |
| `tokens` | `--yeti-space-lg` (public: "The default gap, and the room between the rail and the entries"), `--yeti-color-border-strong` (public: "The rail and the markers"), and the private `--_yeti-gap` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Use an ordered list, so the sequence is announced, and a time element with datetime in each entry. The rail and markers are decorative. Give the ol role=\"list\": removing the list markers removes the list semantics in some engines." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "container size queries", "logical inset properties"; `guarded`: none |
| `since`, `example`, `demo` | `7.0.0`; `example.html`; docs demo height `xl` |

How it works, in `@layer yeti.layouts`:

- **The list.** `.timeline` is a relative-positioned flex column with `gap: var(--_yeti-gap)`, `list-style: none`, `padding-inline-start: 0`, and `container-type: inline-size`. `.timeline:not([data-gap])` sets the gap to `--yeti-space-lg`. Every child (`.timeline > *`) is relative-positioned with `margin: 0` and `padding-inline-start: var(--yeti-space-lg)`, the room for the rail and its dot.
- **The rail and the entry dots.** `.timeline::before` is an empty-content 2px line down the start edge, centred `0.5rem` in (`inset-inline-start: calc(0.5rem - 1px)`), painted `--yeti-color-border-strong`. `.timeline > li::before` is an empty-content 1rem circle at the entry's start edge, `0.35em` from its top, in the same colour, so its centre sits on the rail. Only `li` children get a dot.
- **Alternate.** Inside `@container (inline-size >= 48rem)`, a list with `[data-alternate]` moves the rail to `calc(50% - 1px)` and makes each `li` `calc(50% - var(--yeti-space-lg))` wide. Odd entries take `align-self: flex-start` with the room on their end side and their dot outside their end edge; even entries take `align-self: flex-end` with the room on their start side and their dot outside their start edge. The 48rem is a literal in the CSS ("once the list's content box is lg (48rem) wide", the file's head comment), not a token. Narrower, the list is single-sided again.
- **No value rules of its own.** The `data-gap` values set `--_yeti-gap` in the always-loaded `layouts/attributes.css`; `data-alternate` is matched only by the item file. [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md) measured the timeline among the nine item files that showed no dependence on `attributes.css` on Yeti's example, which sets no `data-gap`.
- **Lists without the role.** Yeti's reset removes list styling only for `:is(ul, ol)[role="list"]` (`Y/src/base/reset.css:83-86`), and its prose rules pad and space every other list (`Y/src/base/prose.css:25-37`). `.timeline` removes the list style and padding itself and zeroes its children's margins in the later `yeti.layouts` layer, so the drawing is the same with or without the role (inferred from the layer order in `Y/src/layers.css:7`). What the role restores is the list's semantics in WebKit (manifest `a11y.notes`; ticket 17, read).

**Against the browser target** (ADR 0002; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), `research/browser-baseline-vs-yeti.md`, read):

| Feature the item file uses | web-features status | In the target? |
| --- | --- | --- |
| Container size queries (`container-type: inline-size`, `@container`) | `container-queries`, Baseline high since 2023 (Chrome 105, Firefox 110, Safari 16) | yes, unguarded |
| Logical inset properties (`inset-block`, `inset-inline-start`, `inset-inline-end`) | Baseline high | yes, unguarded |
| Flexbox, `gap`, `::before`, `:nth-child()`, `calc()`, `em` units, relative and absolute positioning, `list-style` | Baseline high since 2015 to 2018 (`research/browser-baseline-vs-yeti.md` rows `before-after`, `nth-child`, `list-style`, `relative-positioning`, `absolute-positioning`, `em-unit`, `width-height`) | yes |
| `<time>` (HTML only, in Yeti's example) | `time`, Baseline high since 2017 | yes |

Nothing in the item file is outside the target, and nothing is guarded. The item uses no Module: `js` is `null`, and `Y/dist/js/` has no timeline file.

Attributes left to the consumer: none of Yeti's `data-*` attributes (ticket 26 rows 68 and 69 map both). The consumer keeps `role="list"` on the `ol` (Part 2 row 17; building-blocks 1.1), the `li` entries, and their content.

### 2. Contract mapping

| Contract piece | Yeti | Package | Static form of an HTML-named input | Record |
| --- | --- | --- | --- | --- |
| Identity class | `timeline` | static host class on `ol[yetiTimeline]` (`YetiTimeline`) | not applicable | ADR 0003 point 1; Part 2 row 17 |
| `data-gap` | space between entries; default `lg` | `gap` on `yetiTimeline`: `YetiGap`, default `undefined`, bound `[attr.data-gap]` | not an HTML attribute | ticket 26 row 68 (R) |
| `data-alternate` | entries on alternate sides of a centred rail once the list is 48rem wide | `alternate`: `boolean` with `booleanAttribute`, default `false`, bound `[attr.data-alternate]` as `''` when true and `null` when false | not an HTML attribute | ticket 26 row 69 (R); building-blocks 1.4 |
| Children `> li` | the entries, at least two | no directive | not applicable | manifest `children`; no marker |
| `role="list"` | Yeti's docs and example write it on the `ol` | the consumer's static attribute; the directive neither binds nor reads it | not applicable | Part 2 row 17; building-blocks 1.1 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-lg` | the default gap, and the room between the rail and the entries | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-color-border-strong` | the rail and the entry dots | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-space-*` | the values each `gap` value reads (`attributes.css`) | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--_yeti-gap` | private | never read or written | not applicable | building-blocks 1.13 |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-timeline` (empty value) on `ol[yetiTimeline]` | not applicable | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Injection token | not Yeti's | none: the item has no part directive to find it | not applicable | ADR 0070 kind C applies only to a marker on a child; the manifest has none |

The input value type `YetiGap` is Yeti's own, imported from the package's generated `yeti-types.ts` and re-exported by name from the primary entry point, never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). It is a full vocabulary, so no `Extract` and no package-declared `Yeti<Item><Input>` type is needed. Neither input name is an HTML attribute on an `ol` (`start`, `reversed`, and `type` are, and the directive declares none of them), so no input has a presentational-attribute kind, and ticket 50 decision 9 does not reach this item.

**Module replaced:** none. Yeti's `timeline` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 17, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-space-lg` for its default gap and for the room beside the rail, `--yeti-color-border-strong` for the rail and the entry dots, and, through the always-loaded value rules, whichever `--yeti-space-*` (or fluid pair) a set `gap` names. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`; they are derived tokens, so they also take effect on one timeline element (`Y/src/guides/theming.md:38`). Two cautions follow from the CSS, both inferred and not measured: a theme that sets `--yeti-space-lg` below 1rem puts each 1rem entry dot under the start of its entry's text; and the rail and dots carry no meaning, so a theme may paint them in any colour (section 7, 1.4.11). **Private tokens** (`--_yeti-*`) are never read or written.

### 3. Hierarchy and DI shape

`YetiTimeline` provides nothing and injects only the root styles service of ADR 0060, through `injectYetiItemStyles('timeline')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 42 and 45), which acquires the `timeline` item file on the server too and releases it through `DestroyRef`. That service belongs to the [setup](setup.md) spec and ADR 0060. No injection token is declared: building-blocks 1.9 gives an item a token for its part directives to find it, and this item has none. The [architecture-guide.md](../architecture-guide.md) glossary row for a part directive named `li[yetiTimelineEntry]` as an example "where the entry carries a marker"; at the pin no entry carries one, so the package has no such directive, and the example is removed from the guide ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 63). If a later pin adds a marker on an entry, the part directive and its token come with it (ADR 0070 kind C).

No item directive hosts another (Part 2, "Two findings that hold across the matrix"). A consumer composes another item directive with `yetiTimeline` by writing both attributes on the `ol`; two directives that declare `gap` share `YetiGap` and bind the same `data-gap` (building-blocks 1.4, shared vocabularies). An item directive on an entry (`<li yetiBox>`) is an ordinary entry that also carries that item's class; whose padding wins between `.timeline > *` and the other item's rule is decided by Yeti's layer and source order, which this spec did not measure, so usage rule 6 puts another item inside the `li` rather than on it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 65).

Generated ids and the platform's relationship attributes: none. The layout renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

**`YetiTimeline`**

| Member | Value |
| --- | --- |
| Class | `YetiTimeline`. Checked at the Pin: not among the 46 names `yeti.d.ts` exports (checked against Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used), so it keeps `Yeti` (ADR 0080 point 4) |
| Selector | `ol[yetiTimeline]` (Part 2 row 17; ticket 11 row 17, "Attribute-only on the consumer's `ol > li`") |
| `exportAs` | `yetiTimeline` (building-blocks 1.3) |
| Entry point | `ngx-yeti/timeline` (building-blocks 1.3; ADR 0011 clause 10) |
| Inputs | `gap: YetiGap \| undefined`, an `input()` with no default value (ADR 0070 rule 1; `YetiGap` is at line 10 of that `yeti.d.ts`); `alternate: boolean`, an `input()` with `transform: booleanAttribute` and default `false` (ADR 0070 rule 2; building-blocks 1.4) |
| Host | static `class: 'timeline'`; static `'data-ngx-yeti-item-timeline': ''`; `'[attr.data-gap]'` from `gap()`, `null` when unset; `'[attr.data-alternate]'`: `''` when `alternate()` is true, else `null` |
| Providers | none |
| Models, outputs, methods, listeners | none |
| Lifecycle | its constructor ends with `injectYetiItemStyles('timeline')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45; nothing else in it can throw), which acquires the `timeline` item file, on the server too, and releases it on destroy through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

No input default differs from Yeti's: `gap` is `undefined` until the consumer sets it, and Yeti's CSS supplies `lg`; `alternate` false is Yeti's absent attribute. A static attribute type-checks as a string literal under `strictTemplates`, so `gap="md"` compiles and `gap="large"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directive's JSDoc; checks for them belong to a later milestone, map, Milestones):

1. Put `yetiTimeline` on an `ol`, the ordered list Yeti's manifest asks for, so that the sequence is announced. The selector matches nothing else: on a `ul` or a `div` the attribute renders a plain element with no error, unless an input is bound (`[gap]`, NG8002) or a template reference names the `exportAs` (NG8003).
2. Write `role="list"` statically on the `ol`. `.timeline` removes the list numbers, and "removing the list markers removes the list semantics in some engines" (manifest `a11y.notes`); the role restores them in WebKit (ticket 17, read). The role is the consumer's; the directive does not bind it.
3. Make every direct child an `li`, and give the list at least two (manifest `children`, `> li`, min 2). An `ol`'s content model allows only `li` and script-supporting elements, so a `div` or a component host element as a child is invalid HTML, and Yeti draws an entry dot only for `li`. `@for`, `@if`, and `ng-container` add no element, so the `li` elements they render are the entries. A component that renders an entry takes an attribute selector on the `li` (`<li app-release>`). A `@defer` block inside the list renders its placeholder and loading elements as children, so they are `li` too.
4. Put a `time` element with a valid `datetime` in each entry, then a heading and text, as the manifest asks ("Put a time, a heading, and text inside each"; `a11y.notes`). The heading level follows the page's outline and is the consumer's.
5. Keep the entries in the order they happened, or in the order the page explains (newest first, for a changelog). The layout draws them top to bottom in source order in both modes and never reorders them; do not reorder them with CSS `order` or a reversed direction (WCAG 1.3.2, 2.4.3).
6. Do not give the entries a margin or an inline padding. The layout sets the space between entries with `gap` (Yeti's test asserts "children have no margins"), and the start padding is the room for the rail and its dot (`.timeline > *`). A consumer's unlayered margin wins over Yeti's `yeti.layouts` rule and changes the spacing. Put another item (a `card`, a `box`) inside the `li`, not on it (section 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 65).
7. Put nothing meaningful in the rail or the entry dots. They are decorative (manifest `a11y.notes`), they are drawn in `--yeti-color-border-strong`, and they are not checked for non-text contrast. A status shown only by a dot's colour would fail WCAG 1.4.1 and 1.4.11; show it as text in the entry.
8. Give the timeline a definite inline size from its container. The list is an inline-size container, so it does not size itself from its content; inside a shrink-to-fit parent (a flex item with no basis, an inline-block, a float) it collapses to its padding (inferred from CSS containment; layer 4 measures it in three engines with a timeline inside a `cluster`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 66). In normal block flow nothing needs doing.
9. Do not write `class="timeline"`, `data-gap`, `data-alternate`, or `data-ngx-yeti-item-timeline` statically on the host. The directive binds them, and a static copy is written back and removed again at hydration (ADR 0003 point 1; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (`[gap]="$any('4xl')"`, ADR 0070).
10. Import `YetiTimeline` in every component whose template writes the attribute. A **Forgotten import** renders a plain numbered list with no error unless an input is bound or a template reference names the `exportAs` (building-blocks 1.9).

### 5. Material comparison

Material has no timeline. The nearest pieces are a plain list and the vertical stepper:

| Aspect | ngx-yeti `timeline` | `MatList` | `MatStepper`, vertical |
| --- | --- | --- | --- |
| Shape | an attribute directive on the consumer's `ol` | a component `<mat-list>` with `<mat-list-item>` children (`NC/src/material/list/list.ts:31-42`, `:45`) | a component with `<mat-step>` children (`NC/src/material/stepper/stepper.ts:47`, `:125`) |
| List semantics | the consumer's `ol` with `role="list"`; `li` entries | `mat-list` binds no role (checked: the only `role` host bindings in `list/` are on the nav, action, and selection lists), so the author adds `role="list"` and `listitem` | none: a stepper is a set of headers that are buttons (`stepper.html:85`), not a list |
| Interaction | none; entries hold the consumer's content and links | none | step headers are interactive, with selection |
| Layout | Yeti's CSS: a rail with dots, alternating sides by the list's own width | a vertical stack of rows | a vertical line between step icons |
| `exportAs` | `yetiTimeline` | `matList` (`list.ts:33`) | `matStepper`, `matVerticalStepper` (`stepper.ts:126`) |

Nothing of either applies. A stepper is a widget for moving through a process, which a timeline is not; `MatList`'s lesson is the same as Yeti's: list semantics are the author's to write.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 17; building-blocks 1.2). The reason: Yeti's CSS does the whole job; the directive adds the class, the typed attributes, the item-file acquisition, and `exportAs` (row 1's reason, which row 17 takes, "as row 1"). The list semantics are HTML's `ol` and `li`, the date is HTML's `time`, and the size switch is a container query. No Aria pattern applies (a timeline has no widget role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read. The rail, the dots, and the alternating sides use logical properties, so RTL needs no `Directionality`. The package does no feature detection and adds no CSS (building-blocks 1.2 and 1.13).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The layout adds no role, state, or property, and no tab stop.
- **Keyboard:** none. Focus moves through links and controls inside the entries in DOM order.
- **Names:** none required. A consumer may name the list with `aria-labelledby` pointing at a heading above it; the directive declares no name input (building-blocks 1.10, Names).

**List semantics.** The `ol` with `role="list"` is exposed as a list whose children are list items, so assistive technology can say how many entries there are and where the reader is; the explicit role keeps that in WebKit, where `list-style: none` otherwise removes it (manifest `a11y.notes`; ticket 17: the redundant role is deliberate, and the Nu Html Checker's "The `list` role is unnecessary" warning on the timeline is advisory). The rail and the entry dots are `::before` boxes with `content: ""`, which contribute no text and no node to the accessibility tree. The list numbers are not drawn, so the order is carried by the DOM sequence and by each entry's `time`. The `ol` keeps its own `start`, `reversed`, and `type` attributes for the consumer; with no numbers drawn they change nothing visible.

**Reading order against visual order.** The layout never changes the DOM. Single-sided, the entries are drawn one under another in source order. Alternating, each entry still starts below the previous one (a flex column whose children only change `align-self`), so the eye moves down a zigzag in source order, and Tab moves through the entries' links in the same order. So the visual, reading, and focus sequences are the same in both modes (read in `timeline.css`; asserted in layers 1 and 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The `ol` and `li` carry the list and its entries; `role="list"` keeps them in WebKit (usage rule 2). Each entry's date is a `time` with `datetime` and its title a real heading (usage rule 4). The layout adds no structure of its own. |
| 1.3.2 Meaningful Sequence | Visual order equals source order in both modes (above). Usage rule 5 forbids reordering. |
| 1.4.1 Use of Color | The dots are decorative and all one colour; usage rule 7 keeps meaning out of them. |
| 1.4.3 Contrast (Minimum) | axe left `color-contrast` incomplete on the `time` elements in all three engines (ticket 17), because each entry holds a pseudo-element. The dot sits in the entry's start padding, single-sided, and outside the entry's box, alternating, so it never lies under the date (read in `timeline.css`). The play function asserts that geometry, then computes the ratio of each `time` element's computed colour against its effective background (the nearest ancestor with an opaque background colour) with the exact WCAG formula, unrounded, in the light and dark schemes, in both modes, and asserts at least 4.5:1 ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3; A11Y-10a; 4.5:1 for text, ticket 50 decision 8). The same assertion covers the entries' headings and text. A package rule is added only if it fails (A11Y-10a). |
| 1.4.4 Resize Text | The gap, the room beside the rail, the dot, and the threshold are `rem` and `em` based, so text zoom scales them with the text (read, not measured). |
| 1.4.10 Reflow | Below a 48rem list width the timeline is single-sided, and the entries wrap their content. Layer 4 asserts no horizontal overflow and one side at a 320 px viewport for Yeti's example. |
| 1.4.11 Non-text Contrast | Not applicable: the rail and the dots are decorative (manifest `a11y.notes`) and convey nothing the `ol` and the `time` elements do not. Yeti's hex comments put `--yeti-color-border-strong` at about 2.1:1 against `--yeti-color-surface` in the light scheme (computed from `Y/src/tokens/color.css:96`, `:102`; inferred, not measured), which is why usage rule 7 keeps meaning out of them. No assertion and no ledger row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 64). |
| 1.4.12 Text Spacing | The rules set no height and no overflow on the entries; entries grow with their content, and the dot is placed `0.35em` from the entry's top, so it follows the first line (read). |
| 2.4.3 Focus Order | Focus follows source order, which is the drawn order in both modes (above). |
| 2.4.6 Headings and Labels | Each entry's heading is the consumer's (usage rule 4). |

**Ledger rows owned:** A11Y-10a only ([ledger.md](../ledger.md); Part 2 row 17). This spec confirms its **What the package adds** column as written: a play-function assertion with the exact WCAG formula on computed colours, and a package rule only if it fails. No new ledger row: the timeline adds no feature Yeti lacks, and its semantics come from the consumer's markup that Yeti's docs already ask for.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<ol yetiTimeline alternate role="list">
  <li><time datetime="2026-09-12">12 September</time><h3>The plan</h3><p>Twelve layouts on paper.</p></li>
  <li><time datetime="2026-09-13">13 September</time><h3>The layouts</h3><p>Fifteen of them, in the browser.</p></li>
  <li><time datetime="2026-09-14">14 September</time><h3>The components</h3><p>Eight, and two themes.</p></li>
</ol>
```

Server HTML and the hydrated DOM are the same. The `ol` carries `yetitimeline=""`, `alternate=""` (the static input attribute, matched by no rule), `role="list"`, `class="timeline"`, `data-alternate=""`, and `data-ngx-yeti-item-timeline=""`, and no `data-gap`. The entries are the consumer's, unchanged. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/timeline/timeline.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="timeline"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap.

The delta from Yeti's docs markup: the consumer writes `yetiTimeline` and input names where the docs write `class="timeline"` and `data-*` names. The layout has no closed or open state.

### 9. Animation

None. The layout has no state and no transition; Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). Crossing the 48rem threshold moves the entries at once. An entry the consumer inserts or removes with `@if` or `@for` may carry a class-form `animate.enter` or `animate.leave` of the consumer's or Yeti's `enter` utility; the entries after it shift without animation, and in alternate mode they change sides, because `:nth-child` counts again. The item link stays until Angular removes the last host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered timeline never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, the presence attribute, the bound `data-*` attributes, and the item link in `<head>` (section 8). Nothing is state a person or a module can change, so nothing is Angular-owned **Pre-hydration state** (ADR 0003 point 4; ticket 26: "the consumer's binding only" on rows 68 and 69). Whether the list alternates is the browser's container query on first paint, with no script.
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the host is claimed as it is; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the timeline and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the timeline is its server HTML and stays styled while the host is connected, whatever live timelines do (ADR 0060 point 4). Nothing is lost except changing a bound input, which needs Angular.
- **Client-only `@defer`:** the item file is fetched when `YetiTimeline` is constructed, which can show unstyled frames (a plain list with no rail); the consumer closes the gap with `provideYetiStyles({ preload: ['timeline'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added. Links inside entries are the consumer's.
- **`withI18nSupport()`:** entry text and dates are usually translated with `i18n` in the consumer's component, and a localised date is the consumer's `time` content, with `datetime` unchanged. The directive adds no `i18n` block of its own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are `input()` signals read by host bindings, so a changed input refreshes its attribute with no zone (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the timeline is readable, with its rail, its dots, and its alternating sides by the list's width, because the class, the attributes, and the item link are in the server HTML, and the list semantics are the consumer's markup. Nothing is lost: the layout has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the `ol` and its entries may sit in different boundaries only as far as HTML allows: a `@defer` block inside the list renders `li` elements (usage rule 3). The layout has no ids or references, and a deferred entry hydrates on its own.

### 11. Hydration constraints

The layout complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** host bindings read only inputs, which are equal on both, so both render the same class and attributes. The container query changes no DOM.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside host bindings. The item link belongs to the ADR 0060 service, which writes it on the server and adopts it on the client.
- **Valid HTML:** the selector puts the directive on an `ol`, and usage rule 3 makes every child an `li`. An `ol` child that is not an `li` is not moved by the parser, so the DOM would still match, but the HTML would be invalid and the child would get no dot.
- **`preserveWhitespaces`:** the directive has no template. Whitespace text between entries is not rendered in a flex container, so it adds no gap.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 9 keeps the consumer from writing them. The static input attribute `alternate=""` is the input's own form and matches no rule; `role="list"` is a static attribute the directive does not bind, so hydration writes back the same value. No input is named like an HTML attribute (section 2).

### 12. Single-page application

None. The layout has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A consumer's fragment link to an entry's `id` is the consumer's and goes through the fragment-links handling like any bare link. On a route change, a route's timelines leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-timeline]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a timeline again re-inserts it.

### 13. Item file

`yeti-css/css/layouts/timeline/timeline.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `ol[yetiTimeline]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:36`, after `container` and before the `media` recipe, the rank table of point 3), and removed after the last host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement, and optionally `provideYetiStyles({ preload: ['timeline'] })`. The layout adds nothing to it. Cross-item files acquired: none. `timeline.css` has no rule for another item, and the `data-gap` value rules it depends on are in the always-loaded `layouts/attributes.css` (ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the list semantics, where the entries and dots land, and the contrast. It never asserts a private field or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). Spacing is read from probe elements in the same story (`inline-size: var(--yeti-space-<value>)`, as the [masonry](masonry.md) spec does), so an expected gap holds for any token value; contrast is asserted as a ratio from computed colours, never as a token value. The alternate threshold is a literal 48rem in Yeti's CSS, not a token, so stories size their container well to each side of it (30rem and 70rem), as Yeti's own test does with 500 and 1000 px. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `timeline` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `timeline--default`: Yeti's example with `alternate`, in a resizable container set to 70rem. Asserts `class="timeline"`, `data-alternate=""`, `data-ngx-yeti-item-timeline`, and no `data-gap` from the package on the `ol`; `role="list"` left as written. Asserts the accessible roles: one `list` holding three `listitem`s, each with a heading. Asserts the rail is centred: the `ol`'s `::before` has non-`none` content and its centre is the list's centre within 1 px; odd entries end before the centre and even entries start after it, as Yeti's test does. Asserts each entry's top is below the previous entry's top (the zigzag keeps source order). Runs the A11Y-10a contrast assertion (section 7, 1.4.3) on every `time`, heading, and paragraph, after asserting that no entry dot's box intersects its entry's `time` box.
- `timeline--single`: Yeti's fixture without `alternate`, in a 70rem container. Asserts each dot's centre lies on the rail's centre within 1 px, every entry starts at the same `left`, and consecutive entries are separated by the gap read from a `--yeti-space-lg` probe within 1 px (Yeti's test, "a rail down the start edge with a marker per entry on it"). Runs the contrast assertion and the dot-geometry assertion.
- `timeline--narrow`: `timeline--default` in a 30rem container. Asserts every entry starts at the same `left` (single-sided), then widens the container to 70rem and asserts the alternate geometry; then narrows it again.
- `timeline--dark-scheme`: `timeline--default` and `timeline--single` in a wrapper with the consumer's `color-scheme: dark` (ADR 0004 consequences). Repeats the contrast assertions (ticket 17 measured both schemes).
- `timeline--inputs`: Storybook controls bind `gap` and `alternate`. The play function sets `gap` to an explicit value, asserts `data-gap` and the gap against that value's probe, resets it to unset and asserts the attribute is absent; toggles `alternate` on and off and asserts `data-alternate=""` and its absence.
- `timeline--links`: four entries, each holding a link, in a 70rem alternating container. Asserts Tab visits the links in source order and that each focused link's top is below the previous one's.
- `timeline--rtl`: `timeline--default` and `timeline--single` inside `dir="rtl"`. Asserts the rail is on the right edge when single-sided, the first entry is on the right when alternating, and Tab still follows source order.

### Layer 2: browser-level (`npx nx test <lib>`, `timeline.spec.ts`)

Through `TestBed.createDirective(YetiTimeline, { tagName: 'ol', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- the host has class `timeline` and `data-ngx-yeti-item-timeline`; with no bindings it has no `data-gap` and no `data-alternate`;
- a `gap` binding renders `data-gap`, a changed binding updates it after `whenStable()`, and binding `undefined` removes it;
- `alternate` bound `true` renders `data-alternate=""`, `false` removes it, and the string `''` (the static attribute's value through `booleanAttribute`) renders it;
- while the fixture lives, one `<link data-ngx-yeti-styles="timeline">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- the directive injects no parent and provides no token.

A small test host covers what `createDirective` cannot: the template reference `#t="yetiTimeline"` resolves; the consumer's own `class` and `role="list"` on the host are kept beside `timeline`; a static `alternate` and `gap="md"` render `data-alternate=""` and `data-gap="md"`; `<ul yetiTimeline>` gets no class and no presence attribute (the selector is `ol` only); entries rendered by `@for` are direct `li` children with no wrapper.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `timeline.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of Yeti's example whose entry text carries `i18n`, with a static `alternate`, `gap="md"`, and `role="list"` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the `ol` renders `class="timeline"`, `data-alternate=""`, `data-gap="md"`, `role="list"`, and `data-ngx-yeti-item-timeline`; each `li` is a direct child holding its `time` with `datetime`; `<head>` holds one item link with `data-ngx-yeti-styles="timeline"`, `data-beasties-skip`, and an `href` ending `layouts/timeline/timeline.css?v=<pin>`; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `timeline` has `YetiTimeline`; `data-gap` has an input whose union equals the manifest's `gap` vocabulary, and `data-alternate` a boolean input; the item has no markers and no events. A pin move that adds an attribute, a marker, or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer 1 story ids: `timeline--narrow` resizes the container, not the viewport, across the threshold in Chromium, Firefox, and WebKit, and asserts the single-sided and alternate geometry on each side (building-blocks 1.7 and 1.12). `timeline--links` presses Tab in each engine and asserts source order. A timeline inside a `cluster` is measured in each engine to confirm usage rule 8's collapse ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 66).

Fixture half, on the **Fixture app** built with `outputMode: 'server'`, with a `/timeline` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders Yeti's example, alternating and single-sided:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled, the entries' positions equal those with JavaScript on at the same width, the rail and dots are drawn, and `@axe-core/playwright` with the six tags reports no violation;
- a timeline inside a client-only `@defer` block with `timeline` in the preload list shows no unstyled frame; a timeline inside a `hydrate never` block keeps its rail after a live timeline on the page is removed;
- navigating from the timeline route to a route without one removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow and the alternating example is single-sided (1.4.10).

**Manual release test** (ADR 0015 point 7): with VoiceOver in Safari, the timeline is announced as a list with its number of entries, and each entry as a list item. The automated layers compute roles from the DOM, not from WebKit's accessibility tree, so they cannot assert what `role="list"` restores there.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md`, and `test/browser/layouts/timeline.spec.js` with its fixture (the rail and dot geometry, the gap check, the alternate sides at 1000 and 500 px, the child margins) for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula; the [lede](lede.md) and [layer](layer.md) specs' dark-scheme stories for the contrast cases; the [masonry](masonry.md) spec's probe technique.

## Out of Scope

- An input per token, or a gap given as a length rather than Yeti's `gap` vocabulary (ADR 0004; ADR 0070 rule 2).
- An input for the 48rem threshold or a viewport breakpoint of any kind (building-blocks 1.7; Yeti's threshold is a literal in its CSS).
- Binding `role="list"`, `start`, `reversed`, or `type` on the `ol`, or `datetime` on the `time` elements: they are the consumer's markup (Part 2 row 17; building-blocks 1.1).
- A part directive on the entries, or package CSS for the rail and the dots (no marker; building-blocks 1.13).
- Package CSS for the dates' contrast, unless the A11Y-10a assertion fails.
- A check that the host has at least two `li` children, that each holds a `time`, or that no entry is reordered or given a margin. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `ol[yetiTimeline]` with `gap` and `alternate`; no part directive | building-blocks Part 2 row 17; ticket 26 rows 68 and 69; ticket 11 row 17 ("Attribute-only on the consumer's `ol > li`") |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Class `YetiTimeline`; selector and `exportAs` keep `yeti` | ADR 0080 point 4; checked against `yeti.d.ts` at the pin |
| `gap` typed by Yeti's `YetiGap` from the generated `yeti-types.ts`; `alternate` with `booleanAttribute` | ADR 0080 point 5; ADR 0060 point 10; ADR 0070 rule 2 |
| Unset input renders no attribute | ADR 0070 rule 1 |
| `role="list"`, the entries, and their `time` and headings are the consumer's | Part 2 row 17; building-blocks 1.1; manifest `a11y.notes` |
| No injection token | building-blocks 1.9 (a token serves part directives; this item has none) |
| Presence attribute `data-ngx-yeti-item-timeline` | ADR 0045 |
| Entry point `ngx-yeti/timeline` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 17 |
| Contrast asserted in play functions, 4.5:1 for text, light and dark | ADR 0015 point 3; ledger A11Y-10a; ticket 50 |
| Rail and dots decorative; 1.4.11 not applied | manifest `a11y.notes`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 64 |
| Another item inside an entry rather than on it | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 65 |
| Usage rule for a shrink-to-fit parent, with one layer-4 measurement | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 66 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link | ADR 0060 points 2 to 6 |
| `injectYetiItemStyles('timeline')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A changelog, newest first, each entry from data:

```html
<h2 id="changes">Changes</h2>
<ol yetiTimeline gap="md" role="list" aria-labelledby="changes">
  @for (release of releases(); track release.version) {
    <li>
      <time [attr.datetime]="release.date">{{ release.date | date: 'longDate' }}</time>
      <h3>{{ release.version }}</h3>
      <p>{{ release.summary }}</p>
    </li>
  }
</ol>
```

```ts
import { DatePipe } from '@angular/common';
import { YetiTimeline } from 'ngx-yeti/timeline';

@Component({
  selector: 'app-changelog',
  imports: [YetiTimeline, DatePipe],
  templateUrl: './changelog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Changelog {
  readonly releases = input.required<readonly Release[]>();
}
```

A history that alternates across a wide column and stays single-sided in a sidebar, with the same markup:

```html
<ol yetiTimeline alternate role="list">
  <li><time datetime="2026-01-01">January</time><h3>Started</h3><p>The first commit.</p></li>
  <li><time datetime="2026-06-01">June</time><h3>Shipped</h3><p>The first release.</p></li>
</ol>
```

A user's choice of density, typed by Yeti's vocabulary:

```ts
import type { YetiGap } from 'ngx-yeti';

readonly spacing = signal<YetiGap>('sm');
```

```html
<ol yetiTimeline [gap]="spacing()" role="list">...</ol>
```

An entry rendered by a component takes an attribute selector on the `li`: `<li app-release [release]="r">`. A page whose timeline renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['timeline'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/timeline/timeline.css`, loaded by `YetiTimeline` as a counted link (section 13). The consumer writes nothing for the layout beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-gap` value to `--_yeti-gap`; `tokens/space.css` declares `--yeti-space-*`; `tokens/color.css` declares `--yeti-color-border-strong`; `base/reset.css` removes list styling for `[role="list"]`, which the item file repeats for itself.
3. **Cross-item rules:** none. The timeline is an inline-size container, so `data-show` and `data-hide` (always-loaded) inside an entry measure the list without a `container` around it (`Y/src/layouts/container/docs.md`, which names `timeline` among the layouts that are size containers with no conditions attached). An item directive inside an entry loads its own item file through its own directive.
4. **Tokens:** reads `--yeti-space-lg` (default gap and the room beside the rail), `--yeti-color-border-strong`, and the named `--yeti-space-*` through the value rules; writes none (section 2).
5. **What breaks without the item file:** the entries render as an unstyled numbered list (or, with `role="list"`, an unnumbered one through the reset) with no rail, no dots, no gap, and no alternating sides, with no error. The `data-*` attributes still set `--_yeti-gap`, which nothing reads.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured; `prototypes/yeti-tailwind/results/collisions.json`). `timeline` produced none.

### Platform features to adopt when the browser target moves

None needed. Everything the item file uses is inside Baseline 2025, unguarded (section 1). A list that keeps its semantics with `list-style: none` in every engine would make usage rule 2's role unnecessary; that is a WebKit behaviour, not a feature with a Baseline status, and Yeti's manifest would change first.

### Single-page-application pieces relied on

None: the layout uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
