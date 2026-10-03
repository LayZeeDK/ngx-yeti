# Spec: Billboard (utility)

Ticket: [Spec: billboard (utility)](../issues/44-spec-billboard.md). Targets Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Accessibility target: WCAG 2.2 AA.

`billboard` is a **Utility** ([CONTEXT.md](../CONTEXT.md)): an **Item** of kind `utility` in Yeti's **Manifest**, in the docs group "Content". It sizes display text to the size container it sits in, clamped between two steps of Yeti's type scale. This spec covers its one **Item directive**, `YetiBillboard`. Every decision below cites the record that made it. The two points no record settled were listed under `### Open` in this spec's ticket and are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 17 and 18).

## Problem Statement

An Angular developer who wants a hero headline, a figure's number, or a pull quote to fill the box it is on uses Yeti's `billboard` utility. Yeti documents it as a class and one **Attribute** on the consumer's element: `class="billboard"` and `data-fit="<min>-<max>"`, where the value is one of 28 pairs of type steps from the frozen `fit` **Vocabulary**, `md-3xl` when the attribute is absent. Written that way in an Angular template:

- A misspelt pair (`data-fit="lg-dispaly"`) or a pair Yeti does not have (`data-fit="3xl-md"`) compiles and renders at Yeti's default with no report, because neither the class nor the attribute is typed.
- The developer writes Yeti's class and attribute by hand, which the package's contract rule says a consumer never does ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)).
- A static `data-fit` that a directive also declares is written again by hydration and then removed by the directive's unset binding ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), 2026-10-03 note), so mixing the two forms is fragile.
- The item's CSS should load only while a billboard is on the page, from the consumer's own Yeti build ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)); with hand-written markup nothing knows a billboard is there.
- Yeti's docs warn that the utility needs a size container above it and that it is for a line of display text, not prose. Nothing in a hand-written template carries those rules to the next developer.

## Solution

One attribute directive, `[yetiBillboard]`, written on the element Yeti's docs put the class on. It binds the **Identity class** `billboard` as a static host class, renders `data-fit` from a typed `fit` input whose type is Yeti's own `YetiFit` vocabulary type, marks its host with the presence attribute `data-ngx-yeti-item-billboard` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), and acquires the item's **Item file** while it exists. It declares no listener, no render callback, no output, and no **Injection token**. Everything else is Yeti's CSS and the platform: the clamp, the container query units, and the tokens.

The developer writes `<h1 yetiBillboard fit="lg-display">`. A misspelt pair fails to compile. Leaving `fit` unset renders no attribute, so Yeti's `md-3xl` default applies through Yeti's own `:not([data-fit])` rule. The server HTML is Yeti's documented markup, styled with JavaScript off, and nothing changes at hydration.

## User Stories

1. As an application developer, I want to write `yetiBillboard` on a heading, so that the heading is sized by the box it is in rather than by the window.
2. As an application developer, I want a `fit` input that takes a pair such as `lg-display`, so that I choose the smallest and largest sizes the line may set.
3. As an application developer, I want a misspelt or reversed pair to fail to compile, so that a typo never silently falls back to the default size.
4. As an application developer, I want leaving `fit` unset to give me Yeti's own default pair, so that the common case needs no input.
5. As an application developer, I want the unset case to render no `data-fit` attribute, so that a billboard nested in another billboard never inherits its parent's pair, as Yeti's CSS intends.
6. As an application developer, I want to bind `fit` from a signal or a component field, so that the pair can change with my own state.
7. As an application developer, I want a changed `fit` to update the attribute at once under zoneless change detection, so that the size follows without `markForCheck`.
8. As an application developer, I want to write no Yeti class or `data-*` attribute myself, so that my templates use one typed API.
9. As an application developer, I want to keep my own application classes on the same element, so that `yetiBillboard` composes with my styles.
10. As an application developer, I want to put `yetiBillboard` beside other package directives on one element, such as a cover's child directive or `yetiPaint`, so that I can write Yeti's examples one to one.
11. As an application developer, I want the directive to keep the element I chose, so that an `h1` stays an `h1` and the heading outline is mine.
12. As an application developer, I want the docs to tell me the billboard needs a size container as an ancestor, so that I do not put `yetiContainer` on the same element and measure the wrong box.
13. As an application developer, I want the docs to tell me what happens with no size container at all, so that I know the line follows the small viewport instead and is not broken.
14. As an application developer, I want the docs to tell me to use it on a line and not on prose, so that body copy keeps a readable size.
15. As an application developer, I want the item's CSS to load when the first billboard renders and unload after the last, so that a page without one does not carry its rules.
16. As an application developer, I want the item's CSS to come from my own Yeti build at the pin, so that the package ships no Yeti CSS.
17. As an application developer, I want a billboard in a client-only `@defer` block to paint at its fitted size on the first frame when I name it in the preload list, so that the headline does not jump.
18. As an application developer rendering on the server, I want the server HTML to carry the class and the pair, so that the first paint is already at its fitted size.
19. As an application developer, I want hydration to change nothing on a billboard, so that there is no mismatch, no rewrite, and no layout shift.
20. As an application developer using incremental hydration, I want a billboard inside a `hydrate on ...` block to be fully styled before and after its trigger, so that the trigger timing does not show.
21. As an application developer using `hydrate never`, I want a billboard there to keep its styles for as long as it is on the page, so that a dehydrated region looks the same as a live one.
22. As an application developer using `withI18nSupport()`, I want a translated billboard heading to hydrate without being re-rendered, so that localized pages keep their server HTML.
23. As a visitor with JavaScript off, I want a server-rendered or prerendered billboard to read at its fitted size, so that nothing is lost without script.
24. As a visitor who sets a larger default font size, I want the billboard's floor and ceiling to grow with it, so that the line never falls below a legible step.
25. As a visitor who zooms the page, I want the headline to grow, so that I can read it at 200 % (ledger row A11Y-20, measured by layer 4; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17).
26. As a visitor using assistive technology, I want the billboard to change nothing in the accessibility tree, so that headings and text are announced as they are written.
27. As a designer theming with Yeti's tokens, I want to move `--yeti-fit-width` once, so that every pair reaches its ceiling at a different container width together.
28. As a designer, I want `--yeti-tracking-heading` to set the billboard's letter-spacing along with every heading level, so that display type stays consistent.
29. As a designer, I want the type steps the pairs name to follow my theme's scale, so that the billboard stays on the same scale as the rest of the page.
30. As an application developer who needs a pair a later Yeti adds before the package's pin moves, I want a documented way to bind it, so that I am not blocked.
31. As an application developer, I want the directive's `exportAs` name, so that I can refer to it in a template like every other package directive.
32. As an application developer using `@defer` to split my bundle, I want the billboard in its own entry point, so that a deferred block pulls in only what it uses.
33. As an application developer using Tailwind v4 beside the package, I want to know whether `billboard` collides with a Tailwind name, so that I set up my cascade layers once.
34. As a package maintainer, I want the contract check to fail when Yeti's `fit` vocabulary gains or loses a value at a pin move, so that the input type never drifts from the manifest.
35. As a package maintainer, I want story play functions that assert the fitted size against computed token values, so that a pin move that breaks the clamp fails before release without tying a test to a token's default.
36. As a package maintainer, I want the SSR smoke to assert the server HTML, so that a change that moves work out of host bindings is caught.
37. As a package maintainer, I want the e2e suite to run the billboard route with JavaScript on and off, on server-rendered and prerendered routes, so that the JavaScript-off guarantee is tested.
38. As a package maintainer, I want no `ledger.md` row unless the package adds or finds an accessibility feature or gap for this item, so that the ledger says what the package does and nothing more.

## Implementation Decisions

### Yeti contract

From Yeti's billboard manifest, docs, and CSS at the pin:

- **Class:** `billboard`, in `@layer yeti.utilities`. `classes`, `children`, and `markers` are empty.
- **Attribute:** `data-fit`, type `enum`, vocabulary `fit`, default `md-3xl`: "The two ends of the clamp, as a pair of type steps: the smallest the line may set and the largest." The vocabulary has 28 values, every smaller of the eight steps `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `display` paired with every larger one.
- **The default is keyed on absence:** Yeti sets the default pair only on `.billboard:not([data-fit])`, "so a billboard inside another never inherits its parent's ends".
- **Tokens (public):** `--yeti-fit-width`, `--yeti-tracking-heading`, and the eight `--yeti-text-*` steps. **Private:** `--_yeti-fit-min`, `--_yeti-fit-max`.
- **`a11y`:** no required attributes, no keyboard. The note: the clamp is the accessibility story; the floor and the ceiling are steps of the type scale set in `rem`, so a larger default font size raises the floor; use it on a line, not on prose.
- **`support`:** unguarded container query units, `clamp()`, and `atan2()` and `tan()`; nothing guarded.
- **Module and events:** none (`js: null`). Since `7.0.0`.
- **Left to the consumer:** nothing of the contract (ticket 26: no row is a static attribute the consumer writes, and none is left to the consumer). The element, its heading rank, and the size container above it are the consumer's markup.

### Contract mapping

| Yeti name | Kind | Angular | Type and default | Source |
| --- | --- | --- | --- | --- |
| `billboard` | Identity class | `YetiBillboard` binds it as a static host class | always present | ADR 0003 point 1 |
| `data-fit` | Attribute (R) | input `fit` on `yetiBillboard`, bound as `data-fit` | `YetiFit`, Yeti's `fit` vocabulary type from the package's generated types module; unset by default, which renders no attribute so Yeti's `md-3xl` applies | [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 161; ADR 0070 R and rule 1; [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md); ADR 0060 point 10 |
| Static form of `fit` | not applicable | `fit` is not an HTML attribute name, so no output, removed, insertion, or inert kind applies | none | building-blocks 1.4 |
| Events | none | no output | none | the manifest's `js: null` |
| `--yeti-fit-width` | Token (public) | the consumer's | Yeti's default, the `md` width | [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) |
| `--yeti-tracking-heading` | Token (public) | the consumer's | Yeti's default, `normal` | ADR 0004 |
| `--yeti-text-xs` to `--yeti-text-display` | Token (public) | the consumer's, through Yeti's scale | Yeti's fluid scale | ADR 0004 |
| `--_yeti-fit-min`, `--_yeti-fit-max` | Private token | never read or written | none | ADR 0004, Consequences |
| `data-ngx-yeti-item-billboard` (empty value) | the package's Runtime name | static host presence attribute | always present | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 2 |

No Module is replaced, so the spec has no "Module replaced" subsection ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); building-blocks Part 2 row 44, "Yeti module: none").

### Hierarchy and DI shape

- One Item directive, no part directive and no child directive: the item has no markers and no children (building-blocks Part 2 row 44).
- No item always sits on another item's element, so `YetiBillboard` hosts nothing through `hostDirectives` (building-blocks Part 2, "Two findings"). Directives a consumer composes on the same element (`yetiCoverChild` with `center`, `yetiPaint`, `yetiText`, `yetiLede`) are written beside it (building-blocks 1.9). None of them declares an input named `fit`, so one element has one owner per attribute (building-blocks 1.4, Shared vocabularies; architecture guide P9).
- The directive provides no Injection token, because nothing reads it, and injects one thing: the root styles service of ADR 0060 point 2, reached by `injectYetiItemStyles('billboard')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which it acquires `billboard` (on the server too) and releases it through `DestroyRef` on destroy. Acquiring the item file through ADR 0060's root styles service is the one injection every types-only item directive makes (a note on building-blocks Part 2's "Types only" definition; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 18).
- No generated id and no relationship attribute: nothing points at a billboard, so the [generated-ids](generated-ids.md) spec does not apply.

### API

`YetiBillboard`, selector `[yetiBillboard]`, `exportAs: 'yetiBillboard'`, entry point `ngx-yeti/billboard` (building-blocks 1.3; ADR 0080 points 1 and 3). The class name does not collide with Yeti's typings: only `columns`, `attention`, `enter`, `lift`, and `print` take `NgxYeti` (ADR 0080 point 4), and `NgxYetiPaint` is the sixth, because `YetiPaint` is one of the 46 names `yeti.d.ts` exports ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 10).

| Member | Kind | Type | Default | Yeti default | Notes |
| --- | --- | --- | --- | --- | --- |
| `fit` | `input()` | `YetiFit \| undefined` | `undefined`: no `data-fit` rendered | `md-3xl` | The 28 pairs of the `fit` vocabulary. A literal attribute type-checks as a string literal, so `fit="lg-display"` compiles and `fit="display-lg"` does not (ADR 0070 rule 2). |

No model, no output, no method, no defaults token (building-blocks 1.4, Defaults tokens: none by default), and no input per token (ADR 0004). `fit` is not selector-named: `data-fit` is an R attribute, not a utility attribute named as its item (ADR 0070, U lists `data-attention`, `data-enter`, `data-lift`, `data-print` only).

Host bindings, all on signals or static: the class `billboard`, the static presence attribute `data-ngx-yeti-item-billboard`, and `data-fit` from `fit()`, which binds null and so removes the attribute when the input is unset (ADR 0070 rules 1 and 4).

**Usage rules** (CONTEXT, Usage rule; architecture guide P23; each repeated in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Use `yetiBillboard` on a line of display text (a headline, a number, a pull quote), not on prose (Yeti's `a11y` note).
2. Put a size container above it, as an ancestor: `yetiContainer`, or an item that is one (Yeti's docs name `grid`, `timeline`, `nav`, `pagination`, `demo`, a `card` with a leading figure, a `breakout` with a note), or the consumer's own `container-type: inline-size`. Writing `yetiContainer` on the same element measures the box outside it, because an element cannot query itself (Yeti's docs).
3. The element carries the meaning: choose the heading level or element for the document; `yetiBillboard` sizes it and says nothing about its rank (Yeti's docs, Accessibility).
4. Write no static `class="billboard"` or `data-fit`; set the pair through `fit`. A pair newer than the package's pin is bound as `[fit]="$any('<pair>')"` (ADR 0005, 2026-10-02 note; ADR 0070).
5. Markup outside an Angular template (`index.html`, `[innerHTML]` content) is written as Yeti documents it, with the class and attribute (ADR 0070).
6. A billboard that first renders inside a client-only `@defer` block, `@if`, or a routed view after load is named in `provideYetiStyles({ preload: ['billboard'] })` for a first frame at its fitted size (ADR 0060 point 6).

### Comparison with Angular Material and CDK

| Concern | Material or CDK | ngx-yeti billboard |
| --- | --- | --- |
| Display type | Material's typography levels (`mat-display-large` and the others) are fixed sizes applied by class or by element from a global stylesheet; none sizes text to a container (read in the components clone at 22.2.x: no Material, CDK, or Aria style reads `cqi` or declares a size container outside the form field) | A per-element directive whose size Yeti's CSS takes from the nearest size container, clamped between two scale steps |
| API shape | No directive; typography is a stylesheet concern | One input from Yeti's frozen vocabulary, `exportAs`, no outputs, as every types-only item |
| Accessibility | Sizes in `rem`, which a larger default font size scales | The same for the floor and the ceiling; the middle of the ramp follows the container (Yeti's `a11y` note) |

No CDK or Aria primitive applies (building-blocks Part 2 row 44: "none").

### Implementation level and primitives

Level 1, native platform; types only (building-blocks Part 2 row 44, "as row 1": Yeti's CSS does the whole job; the directive adds the class, typed attributes, and `exportAs`). The platform features are container queries and `cq*` units, `clamp()`, and the trigonometric functions, all inside Baseline 2025 and unguarded by Yeti, so the package adds no guard and no feature detection (building-blocks 1.2; [ADR 0002](../adr/0002-browser-target-baseline-2025.md)). No `ResizeObserver`: Yeti's CSS reads the container's size itself (building-blocks 1.7).

### ARIA, keyboard, and accessibility

**APG pattern:** none; the utility has no role, state, or keyboard behaviour, and binds no ARIA (building-blocks 1.10). Ticket 17 measured Yeti's billboard example clean: axe-core with the WCAG 2.2 AA tags found no violation in three engines, light and dark ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md), section 3).

WCAG 2.2 AA criteria this item touches ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 1):

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The directive changes no element and no role; structure is the consumer's element (usage rule 3). Asserted by the play function's accessibility-tree check. |
| 1.4.3 Contrast (Minimum) | Not changed by this item: the billboard sets size and letter-spacing only; colour comes from the consumer's context or `yetiText`/`yetiPaint`. The Story gate runs axe's `color-contrast` on every story. |
| 1.4.4 Resize Text | Yeti's floor and ceiling are `rem` steps, so a larger default font size raises both (Yeti's `a11y` note). Between the two ends the size is a proportion of the container's width, which page zoom shrinks in CSS pixels; whether the line still reaches 200 % under page zoom inside the ramp was not measured (ticket 17 lists "200 % zoom (1.4.4) beyond the 320 px reflow" as not measured). Worked from Yeti's CSS and scale at their defaults, not run: a default-pair heading in a fluid 400 px container at a 1280 px window sets about 44 px; at 200 % page zoom the container is 200 CSS px, the fluid scale steps down, and the line falls to its floor of about 17 CSS px, about 33 device px, smaller than before zooming. Inferred risk, recorded as ledger row A11Y-20 (owner `billboard`; verified *inferred*; tested by L4). The package adds no CSS until the layer-4 zoom case has measured it in three engines; a fix is decided once it has run ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17). |
| 1.4.10 Reflow | The floor keeps the line at or above a legible step in a narrow container; a long word at a high floor can overflow a narrow column, which is the author's choice of pair (inferred, not measured). Measured at a 320 px viewport in the e2e suite. |
| 1.4.12 Text Spacing | `letter-spacing` comes from `--yeti-tracking-heading`; a user stylesheet that overrides spacing still applies (inferred; ticket 17 did not measure 1.4.12). Measured in the e2e suite with the WCAG text-spacing values. |

**Ledger rows:** A11Y-20 (WCAG 2.2 1.4.4 under page zoom; Yeti does what its `a11y` note says; the package adds nothing yet; verified *inferred*; tested by L4; owner `billboard`), added by [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17. Building-blocks Part 2 row 44 listed none.

### Rendered HTML

Consumer markup:

- `<div yetiContainer><h1 yetiBillboard fit="lg-display">Build interfaces that read their own container</h1></div>`

Server HTML and hydrated DOM, identical: the `div` with the container item's class and its own `data-ngx-yeti-item-container=""`; the `h1` with `class="billboard"`, `data-fit="lg-display"`, and `data-ngx-yeti-item-billboard=""`; in `<head>`, one `<link rel="stylesheet" data-ngx-yeti-styles="billboard" ...>` in Yeti's order (ADR 0060 points 2, 3, and 5). With `fit` unset the `h1` carries no `data-fit`. There is no open or closed state. No `jsaction` attribute on the billboard, because it declares no listener.

### Animation

None. Yeti's billboard rules declare no transition or animation (building-blocks 1.6). A consumer who animates entry composes Yeti's `enter` utility through its own directive.

### Rendering modes

[ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and building-blocks 1.11, for this item:

- **Server output:** the class, `data-fit` when bound, `data-ngx-yeti-item-billboard`, and the item link in `<head>`; all host bindings on signal or static state (clause 1). No template branches on the platform.
- **Before hydration:** nothing to touch: no listener, no render callback, no observer, no timer, no DOM write (clauses 3 and 4; building-blocks 1.11 decision 3). The item link is written on the server and adopted by attribute at bootstrap (ADR 0060 point 5).
- **Full hydration:** no attribute changes, no rewrite (ADR 0060 point 5 measured 0 style mutations after `DOMContentLoaded` for the loader; the billboard's attributes are host bindings equal on both ends).
- **Event replay:** no listener, so nothing replays and nothing waits for replay. No `yeti:*` event exists for this item.
- **`@defer (hydrate on ...)`:** server-rendered and styled before the trigger; the dehydrated host holds the item link while connected (ADR 0060 point 4, measured).
- **`hydrate never`:** the server HTML stays, and the item link stays while the host is connected (ADR 0060 point 4, measured), so the billboard keeps its fitted size for good. Nothing is lost: the item has no Angular behaviour.
- **Client-only `@defer`, `@if`, routed views:** the directive acquires the item on construct; without the preload list the line paints at its element's base size for a few frames and then jumps to its fitted size (ADR 0060 point 6 measured 18 to 20 unstyled frames with the CSS delayed 300 ms, 1 to 2 with none). `provideYetiStyles({ preload: ['billboard'] })` closes it (usage rule 6).
- **`withI18nSupport()`:** the directive has no template and no `i18n` of its own. A consumer component with `i18n` text in a billboard hydrates without being re-rendered only with `withI18nSupport()` (clause 11, measured in ticket 18). The fixture includes one `i18n` billboard heading (building-blocks 1.11 decision 11).
- **Hydration boundary:** a billboard is not a composite widget, so it may sit in any boundary; it needs its size container only in the rendered DOM, not in the same boundary (building-blocks 1.11 decision 6 applies to composites).
- **Zoneless:** `fit` is an `input()` signal and every host binding reads it or is static (ADR 0070 rule 4; map, Standing rulings, 43).
- **JavaScript off, under SSR and prerendering:** nothing is lost. The fitted size is CSS from the server HTML and the server-written item link (ADR 0060 point 5, measured styled with JavaScript off). A client-only application promises nothing (map, Standing rulings, JavaScript off; ADR 0011, 2026-10-03 note).
- **Hydration constraints** (map, Standing rulings, 2026-10-03): the same DOM on the server and the client; no direct DOM manipulation by the directive (the loader's `<head>` link is ADR 0060's, written on the server and adopted); valid HTML, since the element is the consumer's; nothing depends on `preserveWhitespaces`; no output branched on the platform. The consumer writes no static `data-fit` (usage rule 4; building-blocks, Hydration constraints).

### Single-page application

None: the item has no state to close on navigation and no fragment link ([navigation-close](navigation-close.md) and [fragment-links](fragment-links.md) do not apply; building-blocks 1.15). A routed view that renders a billboard acquires the item on construct, as above. The [events](events.md) spec does not apply: the item has no event.

### Item file

The item file is `billboard`, kind `utilities`, loaded by ADR 0060's counted `<link>` from the consumer's Yeti build at the pin, acquired in the constructor and released on destroy, removed only when no host with `data-ngx-yeti-item-billboard` is connected (ADR 0060 points 1 to 4). The consumer writes nothing per item beyond the one-time setup the `setup` spec owns ([setup](setup.md); ADR 0060 point 11). The billboard acquires no other item file: its rules depend on a size container's `container-type`, which is another element's and is acquired by that element's own directive (`container` for `yetiContainer`), so ADR 0060 point 9's cross-item rule names nothing here.

## Testing Decisions

Good tests here assert what the page shows: the class and `data-fit` in the DOM, the computed `font-size` and `letter-spacing` against the computed values of Yeti's tokens, and the item link, never the directive's fields (building-blocks 1.12; architecture guide P25). No test depends on a public token's default value; size assertions compare the billboard's computed size with the token's computed value at run time, as Yeti's own billboard browser test does (ADR 0015 point 3; [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md)). Prior art: Yeti's own billboard browser test at the pin (wider container sets larger; clamped at both ends of its pair; a lower ceiling grows more slowly; the viewport fallback with no size container; the tracking token), which the stories and e2e cases below port. Four Test layers ([ADR 0014](../adr/0014-testing-stack-for-yeti.md)), all zoneless.

Story ids (building-blocks 1.3): `billboard--default`, `billboard--fit`, `billboard--clamp`, `billboard--nested`, `billboard--no-container`, `billboard--hero`.

### 1. Story play function

Each story loads the always-loaded group globally and the item file as a consumer would (ADR 0014 point 1); the Story gate runs axe with the six tags and `parameters.a11y.test = 'error'`.

- `billboard--default`: one billboard with `fit` unset in a `yetiContainer`. Asserts `class` contains `billboard`, no `data-fit`, `data-ngx-yeti-item-billboard`; the accessibility tree shows the heading at its own level and name.
- `billboard--fit`: `fit` bound from a story arg (the Storybook control lists the 28 pairs). Asserts `data-fit` equals the arg after each change, and that the computed `font-size` lies between the computed values of the pair's two `--yeti-text-*` tokens.
- `billboard--clamp`: the same heading in containers of 120 px, 200 px, 400 px, and 900 px. Asserts the 400 px heading is larger than the 200 px one, the 120 px one equals the computed floor token, and the 900 px one equals the computed ceiling token (Yeti's test, ported); a `sm-xl` heading at 400 px is smaller than the default at 400 px and inside its own ends.
- `billboard--nested`: a `fit="sm-md"` billboard inside a `fit="lg-display"` billboard's container. Asserts the inner one has no inherited pair when its own `fit` is unset (its computed size lies within `md` to `3xl`).
- `billboard--no-container`: a billboard with no size container above it. Asserts it renders and its size lies within its pair; the viewport fallback itself is asserted in test layer 4.
- `billboard--hero`: Yeti's example shape, a container, cover, and box painted `primary`, with the heading as the cover's centred child at `lg-3xl`. Asserts the heading carries both directives' attributes and passes the Story gate's contrast rule.

### 2. Browser-level test (Vitest browser mode, `npx nx test <lib>`)

Directive-level cases use `TestBed.createDirective(YetiBillboard, { tagName: 'h2', bindings })`, which returns a `DirectiveFixture` (map, Standing rulings, 2026-10-03, item 58; ADR 0014's note). Cases that need a sibling directive or content use a test host component, which ADR 0014's note keeps for those.

- The host has the class `billboard` and `data-ngx-yeti-item-billboard`, with and without `fit`.
- `fit` unset: no `data-fit`. Bound to `lg-display`: `data-fit="lg-display"`. Changed to `sm-md` through the binding's signal: the attribute follows after `await fixture.whenStable()`. Set back to `undefined`: the attribute is removed.
- Item file: after creation the document has one link with `data-ngx-yeti-styles="billboard"`; a second billboard does not add another; after both are destroyed and a frame has passed, the link is gone (ADR 0060 point 4).
- Test host: `yetiBillboard` beside a cover's child directive with `center` and beside `yetiPaint`: each attribute is present once, and `fit` reaches only the billboard.
- Test host: a `[fit]="$any('new-pair')"` binding renders `data-fit="new-pair"` (usage rule 4).
- Every case runs zoneless.

### 3. Node-level Vitest (`npx nx test <lib>`, `billboard.ssr.spec.ts`)

Through the shared `renderServer()` helper with `provideClientHydration()` and `withI18nSupport()`, over a fixture with one `i18n` billboard heading (building-blocks 1.11 decision 11):

- The server HTML has `class="billboard"`, `data-fit` only where bound, `data-ngx-yeti-item-billboard=""`, and no `jsaction` on the billboard host.
- `<head>` has exactly one link with `data-ngx-yeti-styles="billboard"`, `data-ngx-yeti-app`, and `data-beasties-skip`, in Yeti's order relative to a `container` link from the same page (ADR 0060 points 2 and 3).
- A fixture that also writes a static `data-fit` beside an unset `fit` documents the hydration hazard: the rendered output carries no `data-fit` (ADR 0070, 2026-10-03 note).

The **Contract check** covers this item with no per-spec code beyond this mapping: class `billboard` bound by `YetiBillboard`; attribute `data-fit` with input `fit`; the `YetiFit` union equal to the manifest's `fit` vocabulary, 28 values; no markers, no events (ADR 0014 point 3).

### 4. Playwright e2e

Storybook half (`npx nx e2e <lib>-e2e`, Chromium, Firefox, WebKit, on the story ids above):

- Container widths, not only the viewport (building-blocks 1.7): resizing the container in `billboard--clamp` moves the size along the ramp and stops at both ends.
- `billboard--no-container`: at the default viewport and at 360 px wide, the narrower reading is smaller (Yeti's viewport-fallback test, ported).
- Tracking: with `--yeti-tracking-heading: -0.03em` added on `:root`, computed `letter-spacing` is close to `-0.03` times the computed `font-size` (Yeti's test, ported).
- Text spacing (1.4.12): with the WCAG text-spacing values injected, the heading's text is not clipped and stays in its container.
- Reflow (1.4.10): `billboard--hero` at a 320 px viewport has no horizontal scroll.
- Zoom (1.4.4): the rendered `font-size` of `billboard--clamp`'s 400 px heading at 100 % and at 200 % page zoom, in Chromium, Firefox, and WebKit, through the protocol's page scale or an equivalent viewport and device scale factor. The case records the measurement for ledger row A11Y-20 and has no size threshold yet: the package adds no CSS until it has run in all three engines, and the fix is decided then ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17).

Fixture half (`npx nx e2e <fixture-app>-e2e`, the `billboard` route as a server-rendered and a prerendered route, `outputMode: 'server'`; ADR 0014's 2026-10-03 note, decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)):

- Hydration: no `NG05xx`, `componentsSkippedHydration === 0`, and no attribute mutation on the billboard host after `DOMContentLoaded`.
- JavaScript disabled, on both kinds of route: the billboard's computed `font-size` equals the JavaScript-on value at the same width, and axe on the six tags passes (ADR 0011, 2026-10-03 note).
- `hydrate never` block holding a billboard beside a live one that is then removed: the dehydrated billboard keeps its fitted size (ADR 0060 point 4).
- Client-only `@defer` with `billboard` in the preload list: the first frame after insertion already has the fitted size.
- `withI18nSupport()`: the `i18n` heading hydrates with no re-render.

## Out of Scope

- An input per token, such as a `fitWidth` input for `--yeti-fit-width`, and any theme: tokens are the consumer's stylesheet surface (ADR 0004).
- A JavaScript fit that measures text or the container (a `ResizeObserver`-driven size): Yeti's CSS does the job and the package reads no size it does not need (building-blocks 1.7).
- Choosing or changing the element's heading level: the element is the consumer's (usage rule 3).
- Acquiring the `container` item file for a billboard: the size container's own directive does that (Item file, above).
- A development-mode Misuse warning for the usage rules (a missing size container, a billboard on prose): checks are deferred to a later milestone (map, Milestones).
- Package CSS for this item: no rule is planned unless the layer-4 zoom case for ledger row A11Y-20 measures a failure ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17) (map, Standing rulings, Package CSS for accessibility).
- Filing anything upstream with Yeti: no report without the user's confirmation (map, Standing rulings, Upstream bugs).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One Item directive, attribute selector, no component | ADR 0003 points 1 and 6; building-blocks 1.1; Part 2 row 44 |
| Identity class as a static host class | ADR 0003 point 1 |
| `fit` input typed `YetiFit`, from the generated types module | ticket 26 row 161; ADR 0005 and its note; ADR 0060 point 10; ADR 0080 point 5 |
| Unset `fit` renders no attribute; Yeti's default applies | ADR 0070 rule 1 |
| `fit` is not selector-named | ADR 0070, kinds R and U |
| `YetiBillboard`, `[yetiBillboard]`, `exportAs: 'yetiBillboard'`, `ngx-yeti/billboard` | ADR 0080 points 1, 3, 4; building-blocks 1.3 |
| Level 1, types only, no Module | building-blocks Part 2 row 44; ADR 0040 |
| Item file through the counted link; `data-ngx-yeti-item-billboard` | ADR 0060 points 1 to 6; [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) |
| No other item file acquired | ADR 0060 point 9 (this spec's reading) |
| Tokens are the consumer's; private tokens untouched | ADR 0004 |
| Ledger row A11Y-20 for 1.4.4, inferred, measured by L4 | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 17 |
| Rendering modes as host bindings only | ADR 0011 clauses 1, 3, 4; building-blocks 1.11 |
| `TestBed.createDirective` in test layer 2 | map, Standing rulings, 2026-10-03; ADR 0014's note |
| Fixture app's server and prerendered routes | ticket 50 decision 2; ADR 0014's note |

### Usage examples

Each example imports `YetiBillboard` from `ngx-yeti/billboard` and every other directive it writes, because a Forgotten import fails silently (architecture guide P24; [ADR 0018](../adr/0018-no-import-arrays-and-later-milestone-import-checks.md)).

- A hero headline sized by its column: a `section` with Yeti's hero directive, a copy column with `yetiContainer`, and inside it `<h1 yetiBillboard fit="xl-display">`, as Yeti's hero docs show.
- A figure's number on a card that is sometimes a column and sometimes a page: `<p yetiBillboard fit="lg-3xl">` inside a card with a leading figure, which is already a size container.
- The default pair: `<h2 yetiBillboard>` inside `yetiContainer` sets between `md` and `3xl`.
- A bound pair: `<h2 yetiBillboard [fit]="compact() ? 'md-xl' : 'lg-display'">`.
- Yeti's own example, one to one: a `div` with `yetiContainer`, the cover directive with height `sm`, `yetiBox`, and `yetiPaint="primary"`, holding `<h2 yetiBillboard fit="lg-3xl" yetiCoverChild center>`.
- Theming: `:root { --yeti-fit-width: 40rem; --yeti-tracking-heading: -0.02em; }` in the consumer's stylesheet, or `--yeti-fit-width` on one section to change where its billboards reach their ceilings.

### Styles

1. **Item file and the consumer's line:** `billboard`, loaded by ADR 0060's loader; the consumer's setup is the `setup` spec's ([setup](setup.md)), plus `preload: ['billboard']` for client-only inserts.
2. **Always-loaded rules relied on:** the type scale and the `--yeti-text-*` steps, `--yeti-tracking-heading`, and `--yeti-fit-width` from Yeti's tokens; the base heading rules for the element's own size before the item file applies.
3. **Cross-item rules:** none in Yeti's CSS. The billboard reads the nearest size container, which `container` and the size-container items provide on another element.
4. **Tokens:** reads `--yeti-fit-width`, `--yeti-tracking-heading`, and the eight `--yeti-text-*` steps; writes none. A consumer sets them in any stylesheet or with `setProperty`; the scale inputs (`--yeti-base`, `--yeti-ratio`) only on `:root` (ADR 0004; Yeti's theming guide).
5. **Without the item file:** the element renders at its base-typography size with default letter-spacing; nothing else breaks.
6. **Tailwind v4:** Tailwind generates no `billboard` class, so no collision. The `container` collision in the examples is the `container` spec's (building-blocks 1.13).

### Platform features to adopt when the browser target moves

None known: everything the item uses is inside Baseline 2025 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Yeti's CSS divides two lengths with `tan(atan2(a, b))` because typed division in `calc()` is outside that floor (Yeti's billboard CSS); when Yeti changes that at a Pin move, nothing changes in the package.
