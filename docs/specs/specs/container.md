# Spec: container (layout)

Ticket: [56. Spec: container (layout)](../issues/56-spec-container.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 6 and Part 1 (1.3, 1.7, 1.13 in particular), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 25 and 26, [Decide: the spec list](../issues/11-decide-spec-list.md) row 6 and question 9, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and the architecture guide's P28 ([architecture-guide.md](../architecture-guide.md), which ranks below the records). `Y/` is `github.com/foundation/yeti/` at the **Pin**. Its open points are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 7 and 11).

In this spec, `container` in code font is always the item; the plain words "size container" and "container query" are the CSS terms (CONTEXT.md, Item name).

## Problem Statement

Yeti's `container` "Makes its box the thing a container query measures, so what is inside can respond to its width instead of the viewport's" (`Y/src/layouts/container/manifest.json:6`). Its item file is one declaration, `.container { container-type: inline-size; }` in `@layer yeti.layouts` (`Y/src/layouts/container/container.css:4-6`). It arranges nothing. It has no attributes, no tokens, no **Module**, and no events.

The manifest also declares two **Markers** that work on any element, `data-show` and `data-hide` (`on: "*"`, vocabulary `width`; `manifest.json:18-33`). `data-show="md"` shows an element only while the nearest size container is at least `md` wide, and `data-hide="md"` removes it from that width up. Below or above the threshold the element is `display: none`, so it is also out of the accessibility tree. Their rules are not in the item file: they are fourteen `@container` rules in the always-loaded `layouts/attributes.css`, in `@layer yeti.utilities` (`Y/src/layouts/attributes.css:345-388`).

An application developer using the package cannot write `class="container"`, `data-show="md"`, or `data-hide="md"`: a directive binds every Yeti class and attribute, and the consumer writes none ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). The developer needs:

- the `container` item file loaded while a `container` is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), because without it the box is not a size container and every marker inside it silently does nothing;
- typed markers, so that `data-show="medium"` fails to compile instead of showing the element at every width ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md));
- markers that work inside any size container, not only a `container`: `nav`, `pagination`, `timeline`, the `demo` preview box, and some shapes of `grid`, `cluster`, `card`, and `breakout` are size containers too (`Y/src/layouts/container/docs.md:27`).

The developer also uses the class's name in a Tailwind v4 application, where Tailwind generates its own `.container` above Yeti's unless told not to (building-blocks 1.13; [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md)).

## Solution

Three directives in the secondary entry point `ngx-yeti/container` (building-blocks Part 2 row 6; 1.3; [Decide: the spec list](../issues/11-decide-spec-list.md) question 9, which puts the any-element markers in the spec of the item that declares them):

- **`YetiContainer`**, selector `[yetiContainer]`, the **Item directive**. It binds `container` as a static host class, sets its presence attribute `data-ngx-yeti-item-container` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the `container` item file when created, on the server too, and releases it on destroy (ADR 0060 point 2). No input, no output, no listener. `exportAs: 'yetiContainer'`.
- **`YetiShow`**, selector `[yetiShow]`, an any-element directive with one required input `yetiShow: YetiWidth`, bound as `[attr.data-show]` (ticket 26 row 25; [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) G).
- **`YetiHide`**, selector `[yetiHide]`, the same for `data-hide` (ticket 26 row 26).

`YetiShow` and `YetiHide` bind no class, because a marker is not an item (ticket 26, grilling question 10), and acquire no item file, because their rules are in the always-loaded group (building-blocks row 6, "no item file"). The developer writes `<div yetiContainer>` where Yeti's docs write `<div class="container">`, and `<p yetiShow="md">` where they write `<p data-show="md">`.

Everything else is Yeti's CSS and the platform. Every rule here is a container query, so the server HTML is already right at every width, with JavaScript off, before hydration, and inside any `@defer` or hydrate block (building-blocks 1.7; architecture guide P28). The package reads no viewport and measures nothing.

## User Stories

1. As an application developer, I want to make a box a size container with one directive attribute, so that I never write Yeti's `container` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="container"`, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the `container` item file loaded when the first `container` renders, so that I do not import `container.css` globally.
4. As an application developer, I want the `container` item file removed after the last `container` leaves the page, so that a route without one carries none of its CSS.
5. As an application developer, I want the item file in the server HTML when a server-rendered page has a `container`, so that the first paint is already measured against the box.
6. As an application developer, I want to show an element only from a container width up with `yetiShow="md"`, so that a thing with no narrow form appears only where it has room.
7. As an application developer, I want to remove an element from a container width up with `yetiHide="md"`, so that a narrow-only substitute leaves when the wide form arrives.
8. As an application developer, I want both markers on one element (`yetiShow="sm" yetiHide="md"`), so that I can show something in one band, as Yeti's own example does.
9. As an application developer, I want a misspelt width (`yetiShow="medium"`) to fail to compile, so that a typo never leaves an element visible at every width.
10. As an application developer, I want `<p yetiShow>` with no value to fail to compile, so that a marker is never rendered empty.
11. As an application developer, I want to bind the width from a signal (`[yetiShow]="threshold()"`), so that one component can choose its threshold at run time.
12. As an application developer, I want the markers to work inside any size container (a `nav`, a `pagination`, a `timeline`, a `demo` preview), so that I need a `container` only where nothing else is one.
13. As an application developer, I want to import the markers from `ngx-yeti/container` without loading the `container` item file, so that a marker inside a `nav` costs no extra stylesheet.
14. As an application developer, I want a marker on an element that is also a package item (`<nav yetiCluster yetiShow="md">`), so that a whole layout can appear from a width up; Yeti's utilities layer outranks the layout's own `display`.
15. As an application developer, I want a `container` on the same element as a `box` (`<div yetiContainer yetiBox>`), as Yeti's example writes it, so that I need no extra wrapper.
16. As an application developer, I want both items on one element to keep their item files for as long as the element is on the page, so that a shared host in a `hydrate never` block stays styled.
17. As an application developer, I want to know that a marker on a `container`'s own host is measured against the nearest container above it, never its own box, so that I put it on the right element.
18. As an application developer, I want to know that a marker with no size container above it does nothing at all, so that I recognise the failure mode Yeti documents.
19. As an application developer, I want to name a `container` for my own `@container` rules with an application class and `container-name` in my stylesheet, so that a query can target it as Yeti documents.
20. As an application developer, I want to know that the markers' widths are literals equal to the `--yeti-width-*` defaults, so that I do not expect a theme that moves `--yeti-width-md` to move `yetiShow="md"`.
21. As an application developer, I want the markers to behave the same on the server, before hydration, after hydration, and with JavaScript off, so that the first paint never shows both the narrow and the wide version.
22. As an application developer, I want hydration to change nothing on a `container` or a marker, so that I get no `NG05xx` error and no flash.
23. As an application developer, I want every directive here to work under zoneless change detection, so that the package fits Angular's recommended mode.
24. As an application developer, I want a `container` inside a `@defer (hydrate on ...)` block to stay a size container before and after the block hydrates, so that incremental hydration does not move a threshold.
25. As an application developer, I want a `container` inside a `hydrate never` block to stay a size container for as long as it is on the page, so that a dehydrated block keeps its markers working when a live `container` elsewhere leaves.
26. As an application developer, I want to know that a `container` inside a client-only `@defer` block needs `container` in the preload list, so that its markers do not show every version for a few frames.
27. As an application developer using `withI18nSupport()`, I want translated text inside a `container` or on a marked element to hydrate without being re-rendered, so that localised pages keep the server's DOM.
28. As an application developer, I want a template reference to each directive (`#c="yetiContainer"`, `#s="yetiShow"`), so that the item follows the package's `exportAs` rule.
29. As an application developer using Tailwind v4 beside the package, I want to be told that Tailwind generates its own `.container` and how the setup's `@source not inline('container');` stops it, so that Tailwind's width rules never land on my size container.
30. As an application developer, I want my own classes and attributes on the host kept, so that I can add an application class beside the directive.
31. As a screen-reader user, I want an element that `yetiShow` or `yetiHide` removes to be out of the accessibility tree as well as out of sight, so that I never hear content a sighted user cannot see.
32. As a screen-reader user, I want nothing I need to live only in the version a narrow container removes, so that a narrow page loses no information (Yeti's own rule, `docs.md:25`).
33. As a low-vision user who zooms text, I want the thresholds measured in `rem`, so that a larger text size reaches the narrow form sooner and nothing overflows.
34. As a low-vision user, I want a page using these markers to reflow at 320 CSS pixels with no horizontal scrolling, so that I can read it at high zoom.
35. As a keyboard user, I want a removed link or control to leave the Tab sequence while it is removed, and the visible links to keep it, so that focus never lands on an invisible element.
36. As a keyboard user, I want the `container` itself to add no tab stop, so that focus moves only to interactive content.
37. As a package maintainer, I want each marker's threshold tested by resizing the container, not the viewport, so that the test measures what Yeti's CSS reads (building-blocks 1.7).
38. As a package maintainer, I want the threshold tests to read the width from the `--yeti-width-*` token in an unthemed story, so that no test hard-codes a default and a pin move that splits the literal from the token fails a test.
39. As a package maintainer, I want the contract check to cover the class, both markers, and all seven `width` values, so that a pin move that adds a marker or a value fails before release.
40. As a package maintainer, I want the SSR smoke to assert the server HTML of a `container`, both markers, and the one item link, so that the first paint is proven.
41. As a package maintainer, I want the fixture app to render the item on a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
42. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future Yeti type named `YetiContainer`, `YetiShow`, or `YetiHide` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/container/manifest.json`, `container.css`, `docs.md`, and `example.html`, and in `Y/src/layouts/attributes.css`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `container`, `layout`, `Boxes and Stacks` |
| `class` | `container` |
| `attributes`, `classes` | both empty |
| `children` | `> *`, min 1, no max: "Anything. The container itself arranges nothing." |
| `markers` | `data-show` and `data-hide`, each `type: enum`, `vocabulary: width`, `on: "*"`, no default |
| `tokens` | empty |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely structural." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "container size queries"; `guarded`: empty |
| `since` | `7.0.0` |

The `width` vocabulary is `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` (`Y/schema/vocabulary.json:6`), exported as `YetiWidth` from `yeti.d.ts`. The item file's one rule is `.container { container-type: inline-size; }` in `@layer yeti.layouts`, with no cross-item selector. The markers' rules are in the always-loaded group: for each width, `@container (inline-size < W) { [data-show="w"] { display: none; } }` and `@container (inline-size >= W) { [data-hide="w"] { display: none; } }`, in `@layer yeti.utilities`, with `W` the rem literal named in a comment above each pair (12, 16, 24, 32, 48, 64, and 80 rem at the pin; `attributes.css:366-387`). The comment gives the reasons: a container condition cannot read a custom property, and `display: none` must outrank any `display` the element has from its own item, so the rules sit in the last layer (`attributes.css:345-364`).

The unnamed `@container` condition matches the nearest ancestor size container. With none above, it never matches and the element stays visible at every width (`docs.md:27`; `attributes.css:361-364`).

Attributes left to the consumer: none. Ticket 26 maps both markers (rows 25 and 26); no row is a static attribute the consumer writes.

### 2. Contract mapping

| Contract piece | Yeti | Package | Record |
| --- | --- | --- | --- |
| Identity class | `container` | static host class on `[yetiContainer]` (`YetiContainer`) | ADR 0003 point 1; Part 2 row 6 |
| Attributes | none | no input on `YetiContainer` | manifest `attributes: []` |
| Marker `data-show` | `on: "*"`, `width`, no default | `[yetiShow]` (`YetiShow`), input `yetiShow: YetiWidth`, required, bound as `[attr.data-show]` | ticket 26 row 25 (G); ADR 0070 G; the user's "Selector name (Recommended)" (map, Standing rulings) |
| Marker `data-hide` | `on: "*"`, `width`, no default | `[yetiHide]` (`YetiHide`), input `yetiHide: YetiWidth`, required, bound as `[attr.data-hide]` | ticket 26 row 26 (G); ADR 0070 G |
| Children | `> *`, anything | no part directive | manifest `children`; building-blocks 1.1 (a child Yeti styles by nothing gets no directive) |
| Events | none | no output | manifest `js: null`; [events](events.md) |
| Tokens | none declared | none read or written | manifest `tokens: []`; ADR 0004 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-container` (empty value) on `YetiContainer`'s host only | ADR 0045; ADR 0080 point 2 |

Neither input name is an HTML attribute, so building-blocks 1.4's presentational-attribute kinds do not apply. `YetiShow` and `YetiHide` set no presence attribute and acquire nothing, because they have no item file to count: their rules are in the always-loaded `attributes.css` (building-blocks row 6; row 1 says the same of `box`'s any-element markers; ADR 0045 applies to item root directives only; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 7).

**Module replaced:** none. Yeti's `container` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 6, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item declares no token, and the package writes none. The markers' widths are literals equal to the defaults of `--yeti-width-2xs` to `--yeti-width-2xl`, not reads of them: a theme that sets `--yeti-width-md` moves `data-threshold="md"` on other items, but not `yetiShow="md"` (`docs.md:16`). The package documents this as Yeti does and offers no input or token to move a marker's width. **Private tokens** (`--_yeti-*`) are never read or written.

### 3. Hierarchy and DI shape

None. The three directives are independent: no injection token, no parent injection, no host directive, and no registration. `YetiShow` and `YetiHide` do not look for a `container` above them, because the size container they measure may be any item's, or the consumer's own CSS, and the browser resolves it (`docs.md:25-27`).

No Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"), so `YetiContainer` hosts nothing. A consumer composes it beside another directive on one element by writing both attributes, as Yeti's example puts `container` and `box` on one `div`: `<div yetiContainer yetiBox surface="raised" yetiBorder>`. The directives declare no shared input name (building-blocks 1.4, shared vocabularies). Each item directive on the shared host sets its own presence attribute, so the `box` item file and the `container` item file are each held while the element is connected (ADR 0045).

The only injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('container')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiContainer` acquires and releases the `container` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's; this spec only names the item it acquires.

Generated ids and the platform's relationship attributes: none. Nothing here renders or references an `id`, so the item does not use [generated-ids](generated-ids.md).

### 4. API

**`YetiContainer`**

| Member | Value |
| --- | --- |
| Class | `YetiContainer`. Checked at the Pin: `yeti.d.ts` exports 46 names and `YetiContainer` is not one of them, so the name takes `Yeti` (ADR 0080 point 4; checked against Yeti's built `dist/yeti.d.ts` at the pin, which ADR 0080 used) |
| Selector | `[yetiContainer]` (Part 2 row 6) |
| `exportAs` | `yetiContainer` (building-blocks 1.3) |
| Host | `class: 'container'`; `'data-ngx-yeti-item-container': ''` (both static) |
| Inputs, models, outputs, methods | none |
| Lifecycle | acquires the `container` item file, on the server too, with `injectYetiItemStyles('container')` as the last statement of its constructor (ticket 50 decisions 42 and 45) and releases it on destroy, through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9) |

**`YetiShow`** and **`YetiHide`**

| Member | `YetiShow` | `YetiHide` |
| --- | --- | --- |
| Class | `YetiShow` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 11); not among the 46 names of `yeti.d.ts` (checked) | `YetiHide` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 11); not among them (checked) |
| Selector | `[yetiShow]` | `[yetiHide]` |
| `exportAs` | `yetiShow` | `yetiHide` |
| Input | `yetiShow = input.required<YetiWidth>()` | `yetiHide = input.required<YetiWidth>()` |
| Host | `'[attr.data-show]': 'yetiShow()'` | `'[attr.data-hide]': 'yetiHide()'` |
| Outputs, models, methods, listeners, lifecycle work | none | none |

The input is required, as ticket 26 rows 25 and 26 have it. So ADR 0070 rule 1's "unset means absent" has nothing to apply to: the attribute is always rendered with a vocabulary value. Under `strictTemplates` a static value type-checks as a string literal (ADR 0070 rule 2), so `yetiShow="md"` compiles and `yetiShow="medium"` does not; a bare `yetiShow` is the empty string, which is not a `YetiWidth`, so it does not compile either (read in ADR 0070's cited `translateInput`, not run for these inputs). `YetiWidth` is imported from the package's generated `yeti-types.ts` (ADR 0060 point 10) and re-exported by name (ADR 0080 point 5). A value newer than the pin is bound as `[yetiShow]="$any('3xl')"` (ADR 0070 consequences).

`YetiContainer` has no input, so 1.4's rule for inputs named like HTML attributes has nothing to apply to, and no default changes.

**Usage rules** (numbered here and in each directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiShow` and `yetiHide` only on an element that has a size container above it: a `yetiContainer`, or an item Yeti makes one (`nav`, `pagination`, `timeline`, the `demo` preview, a `grid` with `fold` or `tracks`, a `cluster` with `threshold`, a `card` whose first child is a figure, a `breakout` holding a note; `docs.md:27`). Without one, the marker does nothing. Yeti's `npm run validate` warns about this in Yeti's own source (`Y/src/guides/visibility.md`); the package's counterpart is a later-milestone **Misuse warning**.
2. A marker on a `yetiContainer` host is measured against the nearest size container above that host, never against its own box, because an element cannot query itself (`docs.md:25`).
3. Nothing a reader needs may live only in the version a marker removes. An element removed by a marker is out of the accessibility tree too (`docs.md:25`; `visibility.md`). Prefer an item that changes shape at its own threshold over two marked versions of one thing (`docs.md:25`; `Y/src/guides/responsive.md:79`).
4. A table is not a size container. To remove a column at narrow widths, wrap the table in a `yetiContainer` and put the same marker on the header cell and every body cell of that column (`visibility.md`).
5. Do not write `class="container"`, `data-show`, `data-hide`, or `data-ngx-yeti-item-container` statically on a host. The directives bind them (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)": a consumer writes no static attribute that a directive binds).
6. To name a `container` for your own `@container` rules, give the host an **Application class** and set `container-name` on it in your stylesheet. A name cannot come from an attribute (`docs.md:7-12`), and the package offers no input for it.
7. Import `YetiContainer`, `YetiShow`, and `YetiHide` in every component whose template writes them. A **Forgotten import** of `YetiContainer` renders a plain `div` with no error, because the directive has no input the compiler could report (building-blocks 1.9). A forgotten `YetiShow` or `YetiHide` with a static value also compiles, as an unknown attribute `yetishow`, and the element shows at every width; a bound value (`[yetiShow]`) is reported as NG8002 (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `container`, `yetiShow`, `yetiHide` | Nearest in Angular Material and CDK |
| --- | --- | --- |
| Shape | an attribute directive that binds a class; two any-element directives that bind one attribute each | no component; CDK's `BreakpointObserver` (`NC/src/cdk/layout/breakpoints-observer.ts:43`) is a service that reports viewport media queries to script |
| What is measured | the nearest size container's inline size, in CSS | the viewport, through `matchMedia` |
| Where the decision runs | the browser's style engine, on the server HTML, with no script | the client, after bootstrap; the server cannot know the answer |
| Accessibility | `display: none` removes the element from the accessibility tree | whatever the consumer does with the result |
| API | a class, two typed inputs, `exportAs` | an observable of matched queries |

Nothing from Material's or CDK's API is adopted. `BreakpointObserver` and `MediaMatcher` are not used, because the package reads no viewport (building-blocks 1.7; architecture guide P28). The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 6; building-blocks 1.2). The reason: Yeti's CSS does the whole job, and every size change is `@container` (row 6, "as row 1; every size change is `@container` (1.7)"). CSS container size queries are inside the browser target (building-blocks 1.2, first column), and the manifest lists them as unguarded. No Aria pattern applies (the item has no role), and no CDK piece is used: there is no id, focus, keyboard, or observer. A directive that needed its own size would observe it with `ResizeObserver` (1.7); none of these does.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. `container` takes no role ("Purely structural.", manifest `a11y.notes`), and the markers add no role, state, or property.
- **Keyboard:** none from the package. A focusable element that a marker removes leaves the Tab sequence, because `display: none` makes it not focusable; it returns when the container's width brings it back (platform behaviour, read, not measured for these rules).
- **Names:** none. Nothing here is named or names anything.
- **Focus:** a marker can remove the element that has focus when the container is resized (a window resize or a zoom). The browser then moves focus to the document; the package adds no focus handling, because Yeti's guidance keeps interactive content out of marked-only versions (usage rule 3) and no record adds a behaviour for it.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | `container` is the consumer's element with no role. A marked element keeps its own semantics while shown. |
| 1.3.2 Meaningful Sequence | The class and the markers change no order; DOM order is reading order. |
| 1.4.4 Resize Text | The thresholds are `rem` literals and container widths are CSS lengths, so text zoom reaches the narrow form at a wider window (read in `attributes.css`, not measured). |
| 1.4.10 Reflow | The item sets no width. Layer 4 asserts no horizontal overflow at a 320 px viewport with Yeti's example. Removing content at a narrow width meets 1.4.10 only if nothing is lost, which usage rule 3 states. |
| 2.4.3 Focus Order | Removed elements are not focusable; the visible ones keep DOM order. |
| 4.1.2 Name, Role, Value | The markers add no role or state, and a removed element is out of the accessibility tree, so nothing hidden is announced (`visibility.md`, table). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 6, "Ledger: none"). Ticket 17's axe run found no violation on Yeti's `container` example and did not list it among the five with incomplete contrast (building-blocks 1.10). The package adds no feature Yeti lacks: the markers' accessibility-tree removal is Yeti's CSS.

### 8. Rendered HTML

Consumer markup, after Yeti's example (`example.html`), with the links pointed at routes rather than `#` so that no fragment link is involved ([fragment-links](fragment-links.md)):

```html
<div yetiContainer yetiBox surface="raised" yetiBorder>
  <nav yetiCluster aria-label="Site">
    <a routerLink="/">Home</a>
    <a routerLink="/docs">Docs</a>
    <a routerLink="/guides" yetiShow="sm">Guides</a>
    <a routerLink="/blog" yetiShow="sm">Blog</a>
    <a routerLink="/changelog" yetiShow="md">Changelog</a>
    <a routerLink="/community" yetiShow="md">Community</a>
    <a routerLink="/contact" yetiShow="lg">Contact</a>
  </nav>
  <p yetiHide="sm">Narrower than sm: two links.</p>
  <p yetiShow="sm" yetiHide="md">At least sm wide: four links.</p>
  <p yetiShow="md" yetiHide="lg">At least md wide: six links.</p>
  <p yetiShow="lg">At least lg wide: every link.</p>
</div>
```

Server HTML and the hydrated DOM are the same. The outer `div` carries `yeticontainer=""`, `class="container box"` (in the order Angular merges the two static host classes), `data-ngx-yeti-item-container=""`, and the `box` directive's and `yetiBorder`'s own bindings and presence attribute (those specs' business). A static `yetiShow="sm"` also stays on its element as the lowercased `yetishow="sm"`, beside `data-show="sm"` (building-blocks 1.4: a static input attribute stays on the element). The markers add nothing else.

The server also writes one item link for `container` into `<head>` in Yeti's order (`yeti.css:35`): `rel="stylesheet"`, `href` `<url>layouts/container/container.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="container"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The markers add no link.

The item has no closed or open state. Which elements are displayed depends only on the container's width, which the browser resolves from the same server HTML.

The delta from Yeti's docs markup: the consumer writes `yetiContainer` where the docs write `class="container"`, and `yetiShow="md"` and `yetiHide="md"` where they write `data-show="md"` and `data-hide="md"`.

### 9. Animation

None. The markers switch `display` with no transition, and `container` has no state. Yeti's reduced-motion handling does not reach them (building-blocks 1.6 point 4). A consumer may remove a `container` with a class-form `animate.leave`; its item link then stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A server-rendered `container` never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static host class and presence attribute, the markers' `data-show` and `data-hide`, and the item link in `<head>` (section 8). Nothing is **Pre-hydration state**: no person and no Yeti module can change these attributes (ADR 0003 point 4; ticket 26, grilling question 12).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). `YetiContainer`'s only constructor work is the item acquisition, which ADR 0060 runs on the server too. The markers do no work at all.
- **Full hydration:** each element is claimed as is; the host bindings write the same values; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the `container`, its markers, and the link; a dehydrated `container` holds the link for as long as it is on the page through its presence attribute (ADR 0060 point 4; ADR 0045). The markers need nothing: their rules are always loaded.
- **`hydrate never`:** the item is its server HTML and stays a size container while the host is connected, whatever live `container` instances do (ADR 0060 point 4; ADR 0045). A shared host such as `yetiContainer yetiBox` keeps both item files (ADR 0045 consequences). There is no Angular behaviour to lose.
- **Client-only `@defer`:** the `container` item file is fetched when `YetiContainer` is constructed. Until it applies, the box is not a size container, so every marker inside it matches nothing and every version shows, the narrow and the wide one together, for a few frames. The consumer closes the gap with `provideYetiStyles({ preload: ['container'] })` (ADR 0060 point 6; [setup](setup.md)). A marker inside another item's size container depends on that item's file in the same way, which that item's spec covers.
- **Event replay:** no directive here declares a listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** text inside a `container` or on a marked element is the consumer's, translated with `i18n` in the consumer's component. The directives add no `i18n` block of their own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** `YetiContainer` has no state. A marker's binding reads an `input()` signal, which refreshes zoneless when the consumer's bound value changes (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the item works in full. The class, the markers, and the item link are in the server HTML, and the decisions are container queries, so resizing the window still shows and removes the marked elements. Nothing is lost. A client-only application gets no such promise.
- **Hydration boundary:** any. The item has no parts and no references, and a marker does not need its size container in the same boundary.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** `YetiContainer`'s bindings are static, and each marker's binding reads an input whose value is the same template expression on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The markers sit on whatever the consumer writes, including `th` and `td` (usage rule 4); the table's own spec owns its explicit `<tbody>` rule (building-blocks, "Hydration constraints (2026-10-03)").
- **`preserveWhitespaces`:** the directives have no template.
- **No output branched on the platform:** none. In particular no directive measures the container's width on the client to compute a value the server lacks (building-blocks 1.7).
- **Static attributes the directives bind:** usage rule 5 keeps the consumer from writing them.

### 12. Single-page application

None. The item has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's `container` instances leave with the route, and the item link is removed in the animation frame after no element with `data-ngx-yeti-item-container` is connected (ADR 0060 point 4; ADR 0045). A route that renders a `container` again re-inserts it. A marker in the persistent shell keeps working across routes for as long as its size container stays.

### 13. Item file

`yeti-css/css/layouts/container/container.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiContainer]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:35`, the rank table of point 3), and removed after the last host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement (with `@source not inline('container');` in a Tailwind v4 application, ADR 0060 point 7), and optionally `provideYetiStyles({ preload: ['container'] })`. The item adds nothing to it. Cross-item files acquired: none (`container.css` has no cross-item rule; ADR 0060 point 9).

`YetiShow` and `YetiHide` load no file. Their rules are in `layouts/attributes.css`, which the consumer's global stylesheet loads with the **Always-loaded group** (map, The always-loaded group; building-blocks 1.13).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and the attributes in the DOM, the item link, and which elements are displayed and in the accessibility tree at a given container width. It never asserts a private field or how the styles service counts. Every test runs zoneless (map, Standing rulings, item 43).

No test hard-codes a threshold. A threshold test reads the width from the matching `--yeti-width-*` token's computed value on `:root` in an unthemed story, then sets the container's inline size to that width and to that width minus one pixel. The two are equal at the pin, as Yeti's comments say (`attributes.css:366-386`), so the test holds for any pin that keeps them equal, and fails at a pin move that splits them. It does not depend on a public token's default value, because it reads the value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). Tests resize the container, not only the viewport (building-blocks 1.7). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `container` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `container--default`: Yeti's example (section 8) in a wrapper whose inline size the play function sets. Asserts `class` contains `container`, `data-ngx-yeti-item-container` is present, the computed `container-type` is `inline-size`, and the host has no `tabindex` and no role. For each of four widths (below `sm`, `sm`, `md`, `lg`) asserts the number of links with an accessible role (2, 4, 6, 7), that exactly one of the four paragraphs is displayed, and that each removed link has no accessible role in the tree. Asserts Tab moves through the displayed links only.
- `container--show-hide`: Yeti's docs pair, one `yetiShow="md"` and one `yetiHide="md"` paragraph. Asserts the swap at the token's width and one pixel below.
- `container--all-widths`: one element per width with `yetiShow`, and one per width with `yetiHide`, in a container resized through the seven stops. Asserts each element's `display` against its threshold, so every one of the 14 rules is reached.
- `container--bound`: `[yetiShow]` bound from a story arg. Asserts `data-show` follows the arg when it changes, with no other change on the host.
- `container--in-nav`: `yetiShow` on links inside a `yetiNav`, written as the `nav` spec documents, with no `yetiContainer`. Asserts the marker follows the nav's own width, so a marker needs only some size container (`docs.md:27`).
- `container--on-item`: `yetiShow="md"` on a `yetiCluster`. Asserts the cluster's computed `display` is `none` below `md` and its own `flex` from `md` up, so the utilities layer outranks the layout.
- `container--self`: `yetiShow="md"` on a `yetiContainer` host inside an outer `yetiContainer`. Asserts the marker follows the outer box's width, not its own (usage rule 2).
- `container--table-column`: Yeti's table example from `visibility.md` with `yetiTable` and `yetiShow="sm"` on one column's cells. Asserts the column's header and cells leave together, and the table keeps its caption and the other columns.
- `container--named`: an application class on the host with `container-name` set in the story's stylesheet and a `@container` rule naming it. Asserts the rule applies at its width (usage rule 6).
- `container--outside-a-container`: an **Anti-pattern story**: `yetiShow="md"` with no size container above it. Asserts the element is displayed at every width, which is the failure mode usage rule 1 states. It switches off no Story gate rule.

### Layer 2: browser-level (`npx nx test <lib>`, `container.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiContainer, { tagName: 'div' })`: the host has class `container` and an empty `data-ngx-yeti-item-container`, and no other package attribute and no listener; while the fixture lives, one `<link data-ngx-yeti-styles="container">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link, which stays until both are destroyed.
- `createDirective(YetiShow, { tagName: 'p', bindings: [inputBinding('yetiShow', width)] })` with `width` a signal: the host has `data-show` equal to the signal's value; after the signal changes and `whenStable()`, the attribute follows; the host has no class, no presence attribute, and no `data-ngx-yeti-*` attribute; no item link is added to `document.head`.
- The same for `YetiHide` and `data-hide`.

A small test host covers what `createDirective` cannot: both markers on one element render both attributes; `#c="yetiContainer"`, `#s="yetiShow"`, and `#h="yetiHide"` resolve to their instances; the consumer's own `class` on a `yetiContainer` host is kept beside `container`; `yetiContainer` beside a stand-in second item directive on one host keeps both presence attributes (ADR 0045).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `container.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and Yeti's example as the fixture, with one paragraph's text carrying `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the `container` renders `class="container"` and `data-ngx-yeti-item-container`; each marked element renders its `data-show` or `data-hide` value; `<head>` holds one item link with `data-ngx-yeti-styles="container"`, `data-beasties-skip`, and an `href` ending `layouts/container/container.css?v=<pin>`, and no link for the markers; no element here carries a `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `container` has `YetiContainer`; the manifest's attributes and events for `container` are empty; marker `data-show` has `yetiShow` and `data-hide` has `yetiHide`, each typed `YetiWidth`, whose members equal the `width` vocabulary. A pin move that adds a marker, an attribute, or a width value fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer 1 story ids (ADR 0014 point 4; building-blocks 1.12): `container--default` and `container--show-hide` at each threshold in Chromium, Firefox, and WebKit, resizing the container, and resizing the viewport with the container at full width; the same markup in a narrow sidebar and a full-width section of one page makes two different decisions (`docs.md:25`).

Fixture-app half, built with `outputMode: 'server'`, with a `/container` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled, the page shows the narrow set at a 320 px viewport and the wide set at a 1280 px viewport, and `@axe-core/playwright` with the six tags reports no violation;
- a `container` inside a client-only `@defer` block with `container` in the preload list shows no frame in which two of the four paragraphs are displayed together;
- a `container` inside a `hydrate never` block stays a size container after a live `container` on the page is removed;
- a `yetiContainer yetiBox` host inside a `hydrate never` block keeps both item links after every live `container` and `box` has left (ADR 0045 consequences' shared-host case, here with `box`);
- navigating from the `container` route to a route without one removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow (1.4.10).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and the docs pairs in `docs.md` and `visibility.md` for the stories; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) for the `.container` collision, which this spec does not test again.

## Out of Scope

- A `name` input, or any way to set `container-name` from the package. Yeti says a name cannot come from an attribute (`docs.md:7`); usage rule 6 states the consumer's way.
- A `type` input for `container-type: size` or `normal`. Yeti declares no attribute for it.
- A marker band form (`yetiShow="sm-md"`). Yeti has none on purpose (`attributes.css:356-358`); two markers on one element give a band.
- A viewport-keyed input (`showFor`, `hideFor`), a breakpoint service, `BreakpointObserver`, or `matchMedia` (building-blocks 1.7; architecture guide P28).
- An input or token that moves a marker's width with a theme. The widths are Yeti's literals (`docs.md:16`).
- A check that a marker has a size container above it, or that hidden content exists elsewhere. Checks belong to a later milestone (map, Milestones); usage rules 1 and 3 state them.
- Package CSS for the item. None is needed, and no ledger row asks for it.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec), and the Tailwind setup itself (the setup spec, ADR 0060 point 7).
- The `box`, `cluster`, `nav`, and `table` directives in this spec's examples, which their own specs own.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| `[yetiContainer]`, class only; `[yetiShow]` and `[yetiHide]` in the same spec | building-blocks Part 2 row 6; [Decide: the spec list](../issues/11-decide-spec-list.md) row 6 and question 9 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Each marker is its own directive with a selector-named, required `YetiWidth` input, binding no class | ticket 26 rows 25 and 26; ADR 0070 G; the user's "Selector name (Recommended)" (map, Standing rulings) |
| Types are Yeti's `YetiWidth`, from the generated types module | ADR 0005; ADR 0060 point 10; ADR 0080 point 5 |
| `exportAs` on all three; class names with no collision | building-blocks 1.3; ADR 0080 point 4 |
| Class names `YetiShow` and `YetiHide` | building-blocks 1.3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 11 |
| Entry point `ngx-yeti/container` for all three | building-blocks 1.3; ADR 0011 clause 10; ticket 11 question 9 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 6 |
| Item file as a counted link; presence attribute `data-ngx-yeti-item-container` | ADR 0060 points 2 to 6; ADR 0045 |
| The markers load no file and set no presence attribute | building-blocks Part 2 rows 1 and 6; ADR 0045; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 7 |
| No viewport reads; tests resize the container | building-blocks 1.7; architecture guide P28 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A header whose secondary links appear only where its column has room:

```html
<header yetiContainer>
  <nav yetiCluster aria-label="Site">
    <a routerLink="/">Home</a>
    <a routerLink="/docs">Docs</a>
    <a routerLink="/changelog" yetiShow="md" i18n>Changelog</a>
  </nav>
</header>
```

```ts
import { RouterLink } from '@angular/router';
import { YetiContainer, YetiShow } from 'ngx-yeti/container';
import { YetiCluster } from 'ngx-yeti/cluster';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, YetiContainer, YetiShow, YetiCluster],
  templateUrl: './site-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {}
```

A threshold chosen at run time:

```html
<aside yetiContainer>
  <p [yetiHide]="compactFrom()">Tap a row to see its details.</p>
</aside>
```

```ts
import type { YetiWidth } from 'ngx-yeti';
import { YetiContainer, YetiHide } from 'ngx-yeti/container';

@Component({
  selector: 'app-row-help',
  imports: [YetiContainer, YetiHide],
  templateUrl: './row-help.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowHelp {
  readonly compactFrom = input<YetiWidth>('sm');
}
```

A named `container` for the consumer's own query, after Yeti's docs (`docs.md:9-12`), with an application class:

```html
<div yetiContainer class="sidebar-slot">
  <div yetiCluster class="stack-on-narrow">...</div>
</div>
```

```css
.sidebar-slot { container-name: slot; }
@container slot (inline-size < 30rem) { .sidebar-slot .stack-on-narrow { flex-direction: column; } }
```

A page whose `container` renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['container'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/container/container.css`, loaded by `YetiContainer` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css:345-388`, the 14 `data-show` and `data-hide` rules in `@layer yeti.utilities`; `layers.css`, which places that layer last.
3. **Cross-item rules:** none in `container.css`. Other items' size containers (`nav`, `pagination`, `timeline`, `demo`, and the shapes of `grid`, `cluster`, `card`, and `breakout`) also make markers work, through their own item files.
4. **Tokens:** reads none and writes none (section 2). The markers' widths are literals, not the `--yeti-width-*` tokens.
5. **What breaks without the item file:** the box is not a size container, so markers inside it measure the next size container above, or none, in which case every marked element shows at every width, with no error. A consumer `@container` rule that targets the box stops matching.
6. **Tailwind name collision:** yes. Tailwind v4 generates `.container` in its `utilities` layer, above `yeti`, unless the consumer's global stylesheet has `@source not inline('container');` (building-blocks 1.13; ADR 0060 point 7; ticket 24, measured in three engines). The [setup](setup.md) spec documents the statement; this spec relies on it.

### Platform facts the consumer should know

- `container-type: inline-size` applies inline-size containment: the box's width no longer depends on its content. A `container` that gets its width from its content (a shrink-to-fit flex item, an inline-block) can collapse, so put it where its width comes from its context (CSS Containment Level 3, read; not measured for Yeti's examples).
- The `@container` conditions are unnamed, so a nested size container (a `nav` inside a `container`) becomes the one its descendants' markers measure.

### Platform features to adopt when the browser target moves

None. Container size queries are inside the browser target (building-blocks 1.2), and the manifest's `support.unguarded` lists only them. Typed `attr()`, which might one day let a name or a width come from an attribute, is not in Baseline 2025 and is not something Yeti uses; the package would follow Yeti if it did.

### Single-page-application pieces relied on

None: the item uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
