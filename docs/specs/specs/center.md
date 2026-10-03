# Spec: center (layout)

Ticket: [53. Spec: center (layout)](../issues/53-spec-center.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 3 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 12 to 14, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), [architecture-guide.md](../architecture-guide.md) P6, and [ledger.md](../ledger.md) row A11Y-9. `Y/` is `github.com/foundation/yeti/` at the **Pin**. The one point no record settled is decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decision 32).

## Problem Statement

Yeti's `center` is the page column: "the wrapper that keeps a page or a section from spreading across a wide screen, and keeps it off the edges of a narrow one" (`Y/src/layouts/center/docs.md`). It is one **Identity class**, `center`, with three **Attributes**: `data-max` (the widest the content column may be, vocabulary `width`, default `xl`), `data-gap` (the gutter on each side, vocabulary `gap`, default `md`), and the boolean `data-intrinsic` (shrink the column to its content and centre each child on its own width). It has no markers, no children, no **Module**, and no events, and its manifest calls it "Purely visual" (`Y/src/layouts/center/manifest.json`). Foundation 6 readers know it as `.grid-container` (`docs.md`).

An application developer using the package cannot write `class="center"` or `data-max="lg"`: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt width such as `max="large"` must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `center` **Item file** loaded while a center is on the page and removed when none is, inserted in Yeti's order, because `center` ties with `stack` and `shell` inside `yeti.layouts`: a `stack` file appended after `center` would take a center's auto margins away and un-centre a center inside a stack ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 3; building-blocks 1.13).

Yeti's own example composes `center`, `box`, and `data-border` on one `main`, and at a 320 px viewport that page scrolls sideways by 2 px ([ledger.md](../ledger.md) A11Y-9; ticket 17 section 2.4, measured in Chromium). That fails WCAG 2.2 1.4.10 Reflow, and the package's components must meet WCAG 2.2 AA ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md)). Ticket 17 inferred the cause and did not trace it; this spec traces it (section 7) and states what the package does about it: usage rule 3, an anti-pattern story, and a layer-4 assertion ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32).

## Solution

One **Item directive**, `YetiCenter`, with selector `[yetiCenter]`, in the secondary entry point `ngx-yeti/center` ([building-blocks.md](../building-blocks.md) Part 2 row 3; [Decide: the spec list](../issues/11-decide-spec-list.md) row 3, "Attribute-only."). The developer writes `<main yetiCenter max="lg">` where Yeti's docs write `<main class="center" data-max="lg">`. The directive:

- binds `center` as a static host class;
- renders `data-max`, `data-gap`, and `data-intrinsic` from three typed inputs, `max` (`YetiWidth`), `gap` (`YetiGap`), and `intrinsic` (`boolean`), and renders nothing for an unset input, so Yeti's own defaults apply ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind R and rule 1);
- sets the presence attribute `data-ngx-yeti-item-center` on its host and acquires the `center` item file when it is created, on the server too, and releases it when it is destroyed ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 points 2 to 4);
- declares no output, no listener, no render callback, and no **Injection token**, so it is **types only** in building-blocks' sense;
- has `exportAs: 'yetiCenter'` (building-blocks 1.3).

Everything else is Yeti's CSS and the platform: `max-inline-size`, automatic inline margins, gutters as `padding-inline`, and an explicit inline size so a center inside a `stack` (a flex column) still fills its container (`Y/src/layouts/center/center.css:6-15`). The center renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block, because everything it renders is a static class, a static presence attribute, and three attributes bound from inputs.

A center composes with `box` on one element by writing both directives (`<main yetiCenter yetiBox>`), as Yeti's example composes the two classes ([architecture-guide.md](../architecture-guide.md) P6). One composition from Yeti's example, a border on the center's own element, overflows at 320 px; section 7 says what the package does about it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32).

## User Stories

1. As an application developer, I want to make an element the page column with one directive attribute, so that I never write Yeti's `center` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="center"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the column's maximum width with a `max` input typed by Yeti's width vocabulary, so that `max="lg"` reads like Yeti's `data-max="lg"`.
4. As an application developer, I want a misspelt or unknown width such as `max="large"` to fail to compile, so that a typo never ships a full-width page.
5. As an application developer, I want to set the gutter with a `gap` input typed by Yeti's gap vocabulary, including its fluid ranges such as `sm-lg`, so that the gutters follow Yeti's spacing scale.
6. As an application developer, I want a boolean `intrinsic` input, so that I can centre a heading and a button on their own widths with `<div yetiCenter intrinsic>`.
7. As an application developer, I want an unset input to render no attribute, so that Yeti's default (`xl` and `md` at the pin) applies and my server HTML is Yeti's minimal markup.
8. As an application developer, I want to change `max`, `gap`, or `intrinsic` from a signal at run time, so that a page can switch its column width without re-rendering the element.
9. As an application developer, I want a value newer than the pin to be bindable through the input with `$any(...)`, so that I am not blocked on a package release.
10. As an application developer, I want the center's item file loaded when the first center renders and removed after the last leaves, so that I do not import `center.css` globally.
11. As an application developer, I want the center's item file inserted in Yeti's order, so that whichever item loaded first I get full Yeti's result: a center inside a `stack` keeps its auto margins, and a center placed directly in a `shell` has none, as in Yeti ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 86).
12. As an application developer, I want the item file in the server HTML when a server-rendered page has a center, so that the first paint is centred.
13. As an application developer, I want the center centred and capped with JavaScript off under SSR and prerendering, so that the page reads correctly before any script runs.
14. As an application developer, I want hydration to change nothing on a center, so that I get no `NG05xx` error and no layout shift.
15. As an application developer, I want the center to work under zoneless change detection, so that the package fits Angular's recommended mode.
16. As an application developer, I want a center inside a `@defer (hydrate on ...)` block to stay centred before and after the block hydrates, so that incremental hydration does not unstyle it.
17. As an application developer, I want a center inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated section is not uncentred when a live center elsewhere leaves.
18. As an application developer, I want to know that a center inside a client-only `@defer` block needs `center` in the preload list for a flash-free first paint, so that I can avoid a frame at full width.
19. As an application developer, I want a center leaving under my class-form `animate.leave` to keep its styles until Angular removes it, so that the leave animation does not jump to full width.
20. As an application developer using `withI18nSupport()`, I want translated content inside a center to hydrate without being re-rendered, so that localised pages keep the server's DOM.
21. As an application developer, I want to write `yetiCenter` and `yetiBox` on one element, as Yeti's example writes `center box`, so that a bordered or surfaced column needs no extra wrapper.
22. As an application developer, I want one `gap` binding on a `yetiCenter yetiBox` element to set both the center's gutter and the box's padding, so that the element gets one `data-gap`, as Yeti's single attribute means.
23. As an application developer, I want a page that is a stack of centred sections to work, so that the most ordinary page Yeti describes needs nothing special.
24. As an application developer, I want to know that the center's `max` input also leaves an inert `max` attribute in the DOM when I write it statically, so that I am not surprised by it in the server HTML.
25. As an application developer, I want to set the default maximum and gutter through `--yeti-width-xl` and `--yeti-space-md` in my own stylesheet, so that my theme controls them.
26. As an application developer, I want the package to offer no input per token, so that the center's API stays the size of Yeti's contract.
27. As an application developer, I want my own classes and attributes on the center's element to be kept, so that I can add application classes beside the directive.
28. As an application developer, I want a template reference to the directive (`#c="yetiCenter"`), so that the center follows the package's `exportAs` rule like every other directive.
29. As an application developer, I want to import the directive from `ngx-yeti/center`, so that a `@defer` block can split it with the rest of the item.
30. As an application developer, I want the usage rules stated, including which compositions overflow a narrow screen, so that my pages pass WCAG 1.4.10.
31. As an application developer using Tailwind v4 beside the package, I want to know whether `center` collides with a Tailwind name, so that I can plan my layer statement.
32. As a screen-reader user, I want the center to add no role, landmark, or announcement, so that the page's own landmarks (`main`, `section`) are what I hear.
33. As a screen-reader user, I want the reading order inside an `intrinsic` center to be the source order, so that centring each child changes only where it sits.
34. As a low-vision user, I want the column to reflow at 320 CSS pixels with no horizontal scrolling, so that I can read a page at 400 % zoom.
35. As a low-vision user, I want the column's maximum to grow with text zoom, so that a larger text size does not squeeze the line length.
36. As a low-vision user who overrides text spacing, I want the center to keep its content visible, so that my spacing settings do not clip it.
37. As a keyboard user, I want the center to add no tab stop, so that focus moves only to interactive content.
38. As a package maintainer, I want the contract check to cover the center's class, its three attributes and their value lists, and its empty marker and event lists, so that a pin move that changes any of them fails before release.
39. As a package maintainer, I want the 320 px overflow of ledger row A11Y-9 traced to its cause and asserted by a layer-4 test, so that the reflow gap is met by a test, not by assumption.
40. As a package maintainer, I want the SSR smoke to assert the server HTML of a center and its item link, so that the first paint is proven.
41. As a package maintainer, I want the fixture app to render a center in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
42. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes `xl` or `md` does not fail a test for no reason.
43. As a package maintainer, I want the class name `YetiCenter` checked against Yeti's typings at the pin, so that a future Yeti type named `YetiCenter` is caught at the pin move.
44. As a package maintainer, I want the center to need no shared-utility spec, so that its entry point stays one directive.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/center/manifest.json`, `center.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `center`, `layout`, `Page Layouts` |
| `class` | `center` |
| `attributes` | `data-max` (enum, vocabulary `width`, default `xl`); `data-gap` (enum, vocabulary `gap`, default `md`); `data-intrinsic` (boolean) |
| `classes`, `children` | both empty; the manifest declares no markers |
| `tokens` | `--yeti-width-xl` (public, "The default maximum"), `--yeti-space-md` (public, "The default gutter"), and two private tokens |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: logical properties, which is inside Baseline 2025 ([building-blocks.md](../building-blocks.md) Part 1, the platform table); `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts`, give `.center` `box-sizing: content-box`, an inline size of the container's width less two gutters, `max-inline-size` from the maximum, `margin-inline: auto`, and `padding-inline` from the gutter (`center.css:4-16`). The maximum and the gutter are Yeti's **Private tokens**, set from `--yeti-width-xl` and `--yeti-space-md` when `data-max` and `data-gap` are absent (`:17-18`) and, when they are present, by the always-loaded `layouts/attributes.css`. `.center[data-intrinsic]` makes the element a centred flex column of `fit-content` width (`:21-26`). There is no cross-item selector. The two public tokens are declared in the **Always-loaded group** (`Y/src/tokens/space.css:9`, `:41`).

### 2. Contract mapping

| Contract piece | Yeti | Package | Type and default | Static form (building-blocks 1.4) | Record |
| --- | --- | --- | --- | --- | --- |
| Identity class | `center` | static host class on `[yetiCenter]` (`YetiCenter`) | always | n/a | ADR 0003 point 1; Part 2 row 3 |
| `data-max` | Attribute | `max` input, bound as `[attr.data-max]` | `YetiWidth` (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`); unset by default, rendering nothing | `max` is an HTML attribute of form controls; on a center's host it is `inert`: no binding, and a static `max="md"` stays in the DOM beside `data-max="md"` and does nothing | ticket 26 row 12; ADR 0070 kind R |
| `data-gap` | Attribute | `gap` input, bound as `[attr.data-gap]` | `YetiGap` (29 values); unset by default | not an HTML attribute | ticket 26 row 13 |
| `data-intrinsic` | Attribute | `intrinsic` input with `booleanAttribute`, bound as `[attr.data-intrinsic]`: `''` when true, nothing when false | `boolean`, default `false` | not an HTML attribute | ticket 26 row 14 |
| Markers, children | none | no part or child directive | | | manifest |
| Events | none | no output | | | manifest `js: null`; [events](events.md) |
| Token `--yeti-width-xl` | the default maximum | the consumer's; the package writes none | | | ADR 0004 |
| Token `--yeti-space-md` | the default gutter | the consumer's; the package writes none | | | ADR 0004 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-center` (empty value) | always | n/a | ADR 0045; ADR 0080 point 2 |

`YetiWidth` and `YetiGap` are Yeti's own vocabulary types, imported from the package's generated `yeti-types.ts` copy of `yeti.d.ts` at the pin and re-exported from `ngx-yeti` ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). No input defaults to Yeti's default value (ADR 0070 rule 1): Yeti's public defaults are not frozen.

**Module replaced:** none. Yeti's `center` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 3, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads `--yeti-width-xl` and `--yeti-space-md` when its attributes are unset, and the width and gap scale tokens through `attributes.css` when they are set. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. The private tokens are never read, written, or named by the package.

### 3. Hierarchy and DI shape

None. `YetiCenter` is a standalone item directive. It provides no injection token, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). Two items a consumer composes on one element are written beside each other, and `center box` is the guide's own example ([architecture-guide.md](../architecture-guide.md) question 7 and P6: "Preferred: `<div yetiCenter yetiBox>`"; "Avoided: `yetiCenter` hosting `YetiBox`").

On a `yetiCenter yetiBox` element both directives declare a `gap` input for the one `data-gap` attribute. One binding feeds both inputs and both render the same value, which is what Yeti's single attribute means: the center's gutter and the box's padding come from the same gap (ticket 26, decision 16; ADR 0070's Considered options). Neither directive invents a default, so the two never disagree. The box's `data-border` marker is the any-element directive `[yetiBorder]` (ticket 26 row 5), written beside both.

The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('center')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which the directive acquires and releases the `center` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's.

Generated ids and the platform's relationship attributes: none. The center renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | Value |
| --- | --- |
| Class | `YetiCenter`. Checked at the Pin: `yeti.d.ts` exports no `YetiCenter` (its 46 names are the vocabulary types, `YetiComponentName`, `YetiKind`, `YetiAttributeType`, and the manifest and token interfaces), so the name takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; checked with `rg` against Yeti's built `dist/yeti.d.ts` at the pin, the build ADR 0080 used) |
| Selector | `[yetiCenter]` (Part 2 row 3) |
| `exportAs` | `yetiCenter` (building-blocks 1.3) |
| Entry point | `ngx-yeti/center` (building-blocks 1.3; ADR 0011 clause 10) |
| Host | `class: 'center'`; `'data-ngx-yeti-item-center': ''` (both static); `'[attr.data-max]'`, `'[attr.data-gap]'`, `'[attr.data-intrinsic]'` from the inputs, each `null` when unset |

| Input | Form | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `max` | `input()` | `YetiWidth \| undefined` | `undefined` | static form `inert` (section 2) |
| `gap` | `input()` | `YetiGap \| undefined` | `undefined` | shared with `yetiBox` on one element (section 3) |
| `intrinsic` | `input()` with `booleanAttribute` | `boolean` | `false` | |

No models, outputs, or methods. Lifecycle: acquires the `center` item file, on the server too, with `injectYetiItemStyles('center')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it on destroy, through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9).

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiCenter` on the wrapper of a page or a section. The center carries no landmark of its own: use `main`, `section`, or another element whose semantics the content needs.
2. Do not write `class="center"`, `data-max`, `data-gap`, `data-intrinsic`, or `data-ngx-yeti-item-center` statically on the host. The directive binds each of them; a value newer than the pin goes through the input as `$any('new-value')` (ADR 0003 point 1; ADR 0070's last paragraph; building-blocks, "Hydration constraints (2026-10-03)").
3. Do not put an inline border on the center's own element, and do not set the box's `gapInline` on it: the center's width leaves room for its own gutters only, so either one makes the column wider than its container below the maximum (section 7). Put the border or the extra inline padding on a `yetiBox` inside the center. This rule is the package's treatment of ledger row A11Y-9 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32).
4. Import `YetiCenter` in every component whose template writes `yetiCenter`. A **Forgotten import** of a center written with inputs fails to compile (`max` and `gap` are unknown properties); a bare `<main yetiCenter>` renders an uncentred element with no error (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `center` | Nearest in Angular Material and CDK |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's wrapper | none: Material and the CDK ship no page-column layout; the deprecated `@angular/flex-layout` is not part of either |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | none |
| Accessibility | none of its own: purely visual | none |
| API | class, three typed inputs, `exportAs` | none |

Nothing from Material's API applies. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 3; building-blocks 1.2). The reason, row 1's, which row 3 takes ("as row 1"): Yeti's CSS does the whole job; the directive adds the class, typed attributes, the item-file acquisition, and `exportAs`. No Aria pattern applies (the center has no role), and no CDK piece is used: there is no id, focus, keyboard, direction read, or observer. Yeti's CSS is logical, so right-to-left pages need nothing.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The center adds no role, state, property, or tab stop.
- **Keyboard:** none.
- **Names:** none.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The center adds no semantics; the consumer's element (`main`, `section`) carries them (usage rule 1). |
| 1.3.2 Meaningful Sequence | The center and `intrinsic` change position only; DOM order is reading order (read in `center.css`: no `order`, no reversed direction). |
| 1.4.4 Resize Text | The maximums are `rem` (`Y/src/tokens/space.css:36-42`) and the gutters follow Yeti's space scale, so the column grows with text zoom (read). |
| 1.4.10 Reflow | A center alone, or with `yetiBox` and no border, is exactly its container's width below the maximum: content plus two gutters (read). Two compositions are wider: see "Ledger row A11Y-9" below. Layer 4 asserts no horizontal overflow at a 320 px viewport for the documented forms. |
| 1.4.12 Text Spacing | The rules set no height and no overflow (read). |

**Ledger row A11Y-9: the cause, traced.** Below its maximum a center's content box is the container's width less two gutters, and it is `content-box`, so its padding brings it back to exactly the container's width (`center.css:5`, `:12`, `:15`). Anything else on the inline axis is added on top:

- **A border.** `[data-border]` draws `--yeti-border-width` (1px at the pin, `Y/src/tokens/surface.css:5`) on every side of any element (`Y/src/layouts/attributes.css:465`). On a center it adds twice the border width. On Yeti's example at 320 px: 320 px less two gutters, plus two gutters, plus 2 x 1 px = 322 px, which is the `scrollWidth` ticket 17 measured. So the cause is Yeti's CSS, read and matching the measured number (the arithmetic was not re-run in a browser).
- **The box's inline padding.** `.box[data-gap-inline]` (`Y/src/layouts/box/box.css:8`) has a higher specificity than `.center`, so on a `center box` element it replaces the center's inline padding while the center's width still subtracts its own gutters. A `gapInline` larger than the gap overflows by the difference on each side (read, inferred; not measured).
- **Not affected:** `intrinsic`, whose `fit-content` width is computed from the space left after padding and border (read, inferred), and a plain `center box` with no border, whose padding the center's own `padding-inline` overrides on the inline axis (`box.css` comes before `center.css` in `Y/src/yeti.css:29-30`, and ADR 0060 point 3 keeps that order).

The ledger row's **What the package adds** column, which first read "Undecided until the spec traces the cause", now records decision 32: the cause is Yeti's CSS. The package adds usage rule 3, the anti-pattern story, and the layer-4 `scrollWidth` assertion, and no package CSS ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32, option C). No upstream report is drafted now; filing would need the user's confirmation in any case. A package rule with a sizing keyword (option A2) is adopted later only if a layer-4 measurement passes in all three engines, and then usage rule 3 is relaxed. The ledger row records this (decision 32).

No new ledger row: the center adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example, in the form usage rule 3 keeps:

```html
<main yetiCenter max="md">
  <div yetiBox yetiBorder surface="raised">
    <h1>A readable column</h1>
    <p>Never wider than the maximum, never touching the screen edge.</p>
  </div>
</main>
```

Server HTML and the hydrated DOM are the same: the `main` carries `yeticenter=""`, the inert `max="md"`, `class="center"`, `data-max="md"`, and `data-ngx-yeti-item-center=""`, and nothing else from the package; the inner `div` carries the box's own class, attributes, and presence attribute. The server also writes one item link per item into `<head>` in Yeti's order: for the center, `rel="stylesheet"`, `href` `<url>layouts/center/center.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="center"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts those links at bootstrap. With `max`, `gap`, and `intrinsic` unset, the `main` carries no `data-max`, `data-gap`, or `data-intrinsic`. The center has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiCenter` and inputs where the docs write the class and `data-*` attributes; a static `max` leaves an inert `max` attribute; and, under usage rule 3, the border sits on an inner box rather than on the center itself.

### 9. Animation

None. The center has no state and no transition. Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a center with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A center that is server-rendered never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static host class and presence attribute, `data-*` attributes for the inputs that are set, and the item link in `<head>` (section 8). Nothing is state, so nothing is Angular-owned **Pre-hydration state** (ADR 0003 point 4).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the element is claimed as is; the input bindings write the values the server wrote; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the center and its link; a dehydrated host holds the link through its presence attribute for as long as it is on the page (ADR 0060 point 4; ADR 0045).
- **`hydrate never`:** the center is its server HTML and stays styled while the host is connected, whatever live centers do (ADR 0060 point 4; ADR 0045). Its inputs never change there, which loses nothing: the server rendered their values.
- **Client-only `@defer`:** the item file is fetched when the directive is constructed, which can show frames at full width; the consumer closes the gap with `provideYetiStyles({ preload: ['center'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added to the center.
- **`withI18nSupport()`:** a center's content is usually translated with `i18n` in the consumer's component. The directive adds no `i18n` block of its own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** the three inputs are `input()` signals read by host bindings, so a changed binding refreshes the attribute zoneless (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the center is centred, capped, and guttered, because the class, the attributes, and the item link are in the server HTML. Nothing is lost: the center has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the center may sit in any boundary; it has no parts and no references.

### 11. Hydration constraints

The center complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static, and the three attributes are bound from inputs that hold the same values on both.
- **No direct DOM manipulation:** the directive writes nothing to the DOM outside its host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element; a `main` stays a `main`.
- **`preserveWhitespaces`:** the directive has no template.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 2 keeps the consumer from writing them, because an unset input's binding removes a static `data-*` attribute and hydration then undoes and redoes it (ADR 0070, 2026-10-03 consequence).

### 12. Single-page application

None. The center has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change a route's centers leave with the route, and the item link is removed in the animation frame after no host with `data-ngx-yeti-item-center` is connected (ADR 0060 point 4; ADR 0045). A route that renders a center again re-inserts it, in Yeti's order (point 3). An application shell that keeps one center around the router outlet keeps the link for the whole session.

### 13. Item file

`yeti-css/css/layouts/center/center.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiCenter]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:30`, after `box` at `:29` and `stack` at `:20`, before the rest of the layouts; the rank table of point 3), and removed after the last host has left the DOM. That order gives full Yeti's result in the ties with `.stack > * { margin: 0 }` and `.shell > * { margin: 0 }` (`Y/src/layouts/stack/stack.css:12`, `Y/src/recipes/shell/shell.css:13`), the ties building-blocks 1.13 names and ticket 23 measured: `center.css` comes after `stack.css`, so a center in a stack keeps its `margin-inline: auto`; `shell.css` comes after `center.css` (`Y/src/yeti.css:30`, `:39`), so a center placed directly in a shell has 0 margins, as in Yeti, and the [shell](shell.md) spec puts a center inside `main` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 86). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns. The center adds nothing to it. Cross-item files acquired: none (`center.css` has no cross-item rule; ADR 0060 point 9). The rules for set `data-max` and `data-gap` values live in the always-loaded `layouts/attributes.css`, which no directive manages.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the item link, the computed geometry of the column, and the absence of horizontal overflow. It never asserts a private field, how the styles service counts, or a private token. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). Where a test needs the column's maximum, it compares the center's computed `max-inline-size` with that of a probe element in the same story whose inline style is `max-inline-size: var(--yeti-width-<value>)` (or `var(--yeti-width-xl)` when `max` is unset), so the assertion holds for any token value. Centring is asserted as equal inline margins within 1 px once the container is wider than the maximum. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `center` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `center--default`: section 8's markup (center with `max="md"`, bordered box inside). Asserts `class="center"`, `data-max="md"`, `data-ngx-yeti-item-center`, no `data-gap` or `data-intrinsic`, no `tabindex`, and no role added; the column's `max-inline-size` equals the probe's; equal inline margins in a wide frame.
- `center--unset`: `<div yetiCenter>`. Asserts no `data-*` attribute of Yeti's on the host and a `max-inline-size` equal to the `--yeti-width-xl` probe.
- `center--intrinsic`: a heading and a button in `<div yetiCenter intrinsic>`. Asserts `data-intrinsic=""`, that the column is narrower than its container, and that each child's inline centre equals the column's within 1 px.
- `center--in-stack`: a stack of three centred sections, Yeti's "most ordinary page". Asserts each center fills its container below the maximum and keeps equal margins above it, whichever of `stack` and `center` the story renders first (the tie, ADR 0060 point 3).
- `center--with-box`: `<section yetiCenter yetiBox gap="lg">`. Asserts one `data-gap="lg"` on the host, set by both directives.
- `center--controls`: Storybook controls bound to `max`, `gap`, and `intrinsic` through signals; the play function changes each and asserts the attribute follows and is removed when unset.
- `center--themed`: the story sets `--yeti-width-xl` and `--yeti-space-md` on its wrapper and asserts the unset center follows the probes there.

### Layer 2: browser-level (`npx nx test <lib>`, `center.spec.ts`)

Through `TestBed.createDirective(YetiCenter, { tagName: 'main', bindings: [...] })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- with no bindings, the host has class `center` and `data-ngx-yeti-item-center`, and no `data-max`, `data-gap`, or `data-intrinsic`;
- input bindings for `max`, `gap`, and `intrinsic` render `data-max`, `data-gap`, and `data-intrinsic=""`; a signal that moves a value to `undefined` (or `intrinsic` to `false`) removes the attribute after `whenStable()`, zoneless;
- while the fixture lives, one `<link data-ngx-yeti-styles="center">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link, and it stays until both are destroyed.

A small test host covers what `createDirective` cannot: a template reference `#c="yetiCenter"` resolves to the `YetiCenter` instance; the consumer's own `class` is kept beside `center`; on `<section yetiCenter yetiBox gap="lg">` the host carries one `data-gap="lg"`; and a static `max="md"` leaves the inert `max` attribute beside `data-max="md"` (building-blocks 1.4's kind `inert`, so no absence assertion applies).

The type check of a misspelt value (`max="large"` fails to compile) is a compile-time fixture under the package's strict template type checking, run with the layer-2 build (ADR 0005 consequences).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `center.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose heading inside the center carries `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the center renders `class="center"`, `data-max` only where bound, and `data-ngx-yeti-item-center`; `<head>` holds one item link with `data-ngx-yeti-styles="center"`, `data-beasties-skip`, and an `href` ending `layouts/center/center.css?v=<pin>`, placed before a later-ranked item's link and after a `stack` link when both are present; the center carries no `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the center through the contract mapping: class `center` has `YetiCenter`; attributes `data-max`, `data-gap`, and `data-intrinsic` have inputs whose types equal the manifest's `width` and `gap` vocabularies and `boolean`; the marker and event lists are empty. A pin move that adds an attribute or a value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

On the fixture app, built with `outputMode: 'server'`, with a `/center` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the center matches its probe and `@axe-core/playwright` with the six tags reports no violation;
- at a 320 px viewport, `document.documentElement.scrollWidth` equals the viewport width for the documented forms: a center alone, `center` with `intrinsic`, `center` with `yetiBox`, and section 8's bordered box inside a center (1.4.10; ledger A11Y-9). Yeti's own composition, a border on the center's element, is rendered on an **Anti-pattern story** route, and the test records its `scrollWidth` against the viewport width, which documents the 2 px overflow ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32);
- a center inside a client-only `@defer` block with `center` in the preload list shows no frame at full width; a center inside a `hydrate never` block stays centred after a live center on the page is removed;
- a `stack` of centers loaded in either order keeps every center centred (the tie);
- navigating from the center route to a route without a center removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story; ticket 17's `over.mjs` reflow script for the 320 px assertion; ticket 23's tie pages for the in-stack story; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- An input per token (ADR 0004).
- Defaulting `max` or `gap` to Yeti's `xl` or `md` (ADR 0070 rule 1).
- An input for `data-border` on the center: it is the any-element `[yetiBorder]` directive's (ticket 26 row 5), which the [box](../issues/51-spec-box.md) spec owns.
- `yetiCenter` hosting `YetiBox`, or any combined center-and-box directive (architecture-guide P6).
- Any check that a center does not carry a border, or that its host is a landmark. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Filing the upstream report for A11Y-9: the map keeps upstream reports behind the user's confirmation (map, Out of scope; AFK override).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiCenter]` with `max`, `gap`, `intrinsic` | building-blocks Part 2 row 3; [Decide: the spec list](../issues/11-decide-spec-list.md) row 3 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed `YetiWidth`, `YetiGap`, `boolean`; unset renders nothing | ADR 0005; ADR 0070 kind R and rules 1 and 2; ticket 26 rows 12 to 14 |
| `max`'s static form is inert | ticket 26 row 12; building-blocks 1.4 |
| `exportAs: 'yetiCenter'`; class `YetiCenter` with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/center` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 3 |
| Composed beside `yetiBox`, sharing one `gap` | architecture-guide P6; ticket 26 decision 16 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order; presence attribute `data-ngx-yeti-item-center` | ADR 0060 points 2 to 6; ADR 0045 |
| A11Y-9's cause is Yeti's CSS; usage rule 3, an anti-pattern story, and a layer-4 assertion | this spec's trace (section 7); the remedy is [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A page that is a stack of centred sections, with a reading column for the article:

```html
<div yetiStack gap="xl">
  <header yetiCenter max="2xl">
    <h1 i18n>Trail maps</h1>
  </header>
  <main yetiCenter max="lg" gap="sm-lg">
    <article i18n>...</article>
  </main>
</div>
```

```ts
import { YetiCenter } from 'ngx-yeti/center';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-maps-page',
  imports: [YetiCenter, YetiStack],
  templateUrl: './maps-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsPage {}
```

A sign-in screen whose heading and button sit in the middle rather than stretch:

```html
<section yetiCenter max="sm" intrinsic>
  <h2 i18n>Welcome back</h2>
  <button yetiButton type="submit" i18n>Sign in</button>
</section>
```

A surfaced column, with the border on the inner box (usage rule 3):

```html
<main yetiCenter max="md">
  <div yetiBox yetiBorder surface="raised">...</div>
</main>
```

A theme that narrows the default page column, in the consumer's stylesheet after Yeti:

```css
:root {
  --yeti-width-xl: 60rem;
}
```

A page whose center renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['center'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/center/center.css`, loaded by the directive as a counted link in Yeti's order (section 13). The consumer writes nothing for the center beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `tokens/space.css` declares `--yeti-width-*` and `--yeti-space-*`; `layouts/attributes.css` turns set `data-max` and `data-gap` values into the center's maximum and gutter, and draws `[data-border]`.
3. **Cross-item rules:** none. The ties with `stack` and `shell` are an order, not a rule; insertion in Yeti's order gives Yeti's result for both (centred in a stack, not directly in a shell; ticket 50 decision 86).
4. **Tokens:** reads two public tokens and the width and gap scales; writes none (section 2).
5. **What breaks without the item file:** the element is a plain block at its container's full width with no gutters, so text runs to the screen edge, with no error.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `center` (that Tailwind generates no bare `center` utility is inferred, not measured).

### Platform features to adopt when the browser target moves

None for the package. Yeti's only unguarded feature for the center is logical properties, inside the target. The explicit inline size exists because `auto` margins in a flex column take the free space (`center.css:6-11`); a sizing keyword that fills the available space less padding and border would let Yeti keep the center's width right under a border too, which is option A2 for A11Y-9, adopted only if a layer-4 measurement passes in all three engines ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 32). Whether the three target engines support such a keyword unprefixed was not checked.

### Single-page-application pieces relied on

None: the center uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
