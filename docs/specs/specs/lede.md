# Spec: lede (utility)

Ticket: [46. Spec: lede (utility)](../issues/46-spec-lede.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 46 and Part 1, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [ledger.md](../ledger.md) row A11Y-10e. `Y/` is `github.com/foundation/yeti/` at the **Pin**. The points no record settled were listed under `### Open` in this spec's ticket and are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 8, 23, and 25).

## Problem Statement

Yeti's `lede` is the standfirst: "The one sentence under a page's heading that says what the page is, before the page begins" (`Y/src/utilities/lede/docs.md`). It is one **Identity class**, `lede`, on a paragraph. Its CSS sets the paragraph one size step above the body, on a shorter line, with Yeti's `text-wrap: pretty` (`Y/src/utilities/lede/lede.css`). It has no attributes, no markers, no children, no **Module**, and no events (`Y/src/utilities/lede/manifest.json`).

An application developer using the package cannot write `class="lede"`: the package's contract rule is that a consumer writes no Yeti class, and a directive binds it ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1). The developer also needs the `lede` **Item file** loaded when a lede is on the page and removed when none is, as the map's lazy-styles requirement asks ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without the item file the paragraph renders as body copy at the body's measure, with no error.

The lede is also one of five items whose contrast axe could not compute on Yeti's own example (ticket 17, measured: `color-contrast` incomplete, heading "partially obscured", Chromium and Firefox). So the package must check that contrast itself ([ledger.md](../ledger.md) A11Y-10e; [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3).

## Solution

One **Item directive**, `YetiLede`, with selector `[yetiLede]`, in the secondary entry point `ngx-yeti/lede` ([building-blocks.md](../building-blocks.md) Part 2 row 46, "class only"; 1.3). The developer writes `<p yetiLede>` where Yeti's docs write `<p class="lede">`. The directive:

- binds `lede` as a static host class;
- sets the presence attribute `data-ngx-yeti-item-lede` on its host ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) and acquires the `lede` item file when it is created, on the server too, and releases it when it is destroyed (ADR 0060 point 2), through `injectYetiItemStyles('lede')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45);
- declares no input, no output, no listener, no render callback, and no injection token, so it is **types only** in building-blocks' sense, with no types to bind;
- has `exportAs: 'yetiLede'` (building-blocks 1.3).

Everything else is Yeti's CSS and the platform: the size, line height, and measure come from three **Tokens** the consumer may set in a stylesheet ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)). The lede renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block, because the only things it renders are a static class and a static attribute.

The story's play function computes the contrast of the lede and of the heading above it with the exact WCAG formula, which closes what axe left incomplete (A11Y-10e).

## User Stories

1. As an application developer, I want to mark a paragraph as a lede with one directive attribute, so that I never write Yeti's `lede` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="lede"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the lede's item file loaded when the first lede renders, so that I do not import `lede.css` globally.
4. As an application developer, I want the lede's item file removed after the last lede leaves the page, so that a route without a lede carries none of its CSS.
5. As an application developer, I want the item file in the server HTML when a server-rendered page has a lede, so that the first paint is styled.
6. As an application developer, I want the lede styled with JavaScript off under SSR and prerendering, so that the page reads correctly before any script runs.
7. As an application developer, I want hydration to change nothing on a lede, so that I get no `NG05xx` error and no flash.
8. As an application developer, I want the lede to work under zoneless change detection, so that the package fits Angular's recommended mode.
9. As an application developer, I want the lede to work inside a `@defer (hydrate on ...)` block before and after the block hydrates, so that incremental hydration does not unstyle it.
10. As an application developer, I want a lede inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated block is not unstyled when a live lede elsewhere leaves.
11. As an application developer, I want to know that a lede inside a client-only `@defer` block needs `lede` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
12. As an application developer, I want a lede that leaves under my class-form `animate.leave` to keep its styles until Angular removes it, so that the leave animation is not unstyled.
13. As an application developer using `withI18nSupport()`, I want a translated lede to hydrate without being re-rendered, so that localised pages keep the server's DOM.
14. As an application developer, I want the lede's class to survive moving the paragraph into a `stack` or any other layout, so that wrapping the heading and the lede does not turn the lede into body copy (Yeti's own reason for a class, `docs.md`).
15. As an application developer, I want to set how large a lede reads with `--yeti-lede-size`, so that my theme controls it.
16. As an application developer, I want to set the lede's line length with `--yeti-lede-measure`, so that a larger lede does not run to a longer line than the prose it introduces.
17. As an application developer, I want to know that `--yeti-lede-size` and `--yeti-lede-measure` move together, because `ch` is a unit of the font, so that I change both when I change one.
18. As an application developer, I want the lede's tokens set the way Yeti documents (a `:root` block, a theme file after Yeti, a runtime `setProperty`), so that I learn one theming mechanism.
19. As an application developer, I want the package to offer no input per token, so that the lede's API stays the size of Yeti's contract.
20. As an application developer, I want my own classes and attributes on the lede's paragraph to be kept, so that I can add application classes beside the directive.
21. As an application developer, I want a template reference to the directive (`#l="yetiLede"`), so that the lede follows the package's `exportAs` rule like every other directive.
22. As an application developer, I want to import the directive from `ngx-yeti/lede`, so that a `@defer` block can split it with the rest of the item.
23. As an application developer, I want the usage rules stated (a paragraph, one per page, no static `class="lede"`), so that I use the lede as Yeti intends.
24. As an application developer using Tailwind v4 beside the package, I want to know whether `lede` collides with a Tailwind name, so that I can plan my layer statement.
25. As a screen-reader user, I want the lede announced as an ordinary paragraph, with no role or announcement of its own, so that the page reads as prose.
26. As a screen-reader user, I want the lede's text in reading order right after the heading, so that I hear what the page is about before the page begins.
27. As a low-vision user, I want the lede's text to meet WCAG 2.2 AA contrast in light and dark schemes, so that I can read it.
28. As a low-vision user, I want the lede to grow with text zoom and reflow at 320 CSS pixels, so that a larger standfirst never forces horizontal scrolling.
29. As a low-vision user who overrides text spacing, I want the lede to keep its content visible, so that my spacing settings do not clip it.
30. As a keyboard user, I want the lede to add no tab stop, so that focus moves only to interactive content.
31. As a user of a browser without `text-wrap: pretty` (Firefox at the floor), I want the lede to wrap normally, so that the missing feature costs only the line breaks' polish.
32. As a package maintainer, I want the lede's contrast asserted in its play function with the exact WCAG formula, so that A11Y-10e is met by a test, not by assumption.
33. As a package maintainer, I want the contract check to cover the lede's class and its empty attribute, marker, and event lists, so that a pin move that adds an attribute fails before release.
34. As a package maintainer, I want the SSR smoke to assert the server HTML of a lede and its item link, so that the first paint is proven.
35. As a package maintainer, I want the fixture app to render a lede in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
36. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
37. As a package maintainer, I want the class name `YetiLede` checked against Yeti's typings at the pin, so that a future Yeti type named `YetiLede` is caught at the pin move.
38. As a package maintainer, I want the lede to need no shared-utility spec, so that its entry point stays one directive.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/utilities/lede/manifest.json`, `lede.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `lede`, `utility`, `Content` |
| `class` | `lede` |
| `attributes`, `classes`, `children`, `markers` | all empty |
| `tokens` | `--yeti-lede-size` (public), `--yeti-lede-measure` (public), `--yeti-leading-md` (public) |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "A lede takes no role and announces nothing of its own. It is ordinary prose set larger, and its position under the heading already says what it is." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded` and `guarded` both empty |
| `since` | `7.0.0` |

The rule, in `@layer yeti.utilities`, sets `font-size: var(--yeti-lede-size)`, `line-height: var(--yeti-leading-md)`, `max-inline-size: var(--yeti-lede-measure)`, and `text-wrap: pretty` on `.lede`. It has no cross-item selector. The two lede tokens are declared in the **Always-loaded group** (`Y/src/tokens/type.css:38-39`: `--yeti-lede-size: var(--yeti-text-lg)` and `--yeti-lede-measure: 50ch`, defaults quoted at the pin, as ADR 0006 allows), and `--yeti-leading-md` in the same file (`:15`).

Attributes left to the consumer: none to leave. [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) has no row for `lede`, because the manifest declares no attribute or marker.

### 2. Contract mapping

| Contract piece | Yeti | Package | Record |
| --- | --- | --- | --- |
| Identity class | `lede` | static host class on `[yetiLede]` (`YetiLede`) | ADR 0003 point 1; Part 2 row 46 |
| Attributes | none | no input | manifest `attributes: []` |
| Markers | none | no part directive | manifest `markers: []` |
| Children | none | none | manifest `children: []` |
| Events | none | no output | manifest `js: null`; [events](events.md) |
| Token `--yeti-lede-size` | how large a lede reads | the consumer's; the package writes none | ADR 0004 |
| Token `--yeti-lede-measure` | the lede's line length | the consumer's; the package writes none | ADR 0004 |
| Token `--yeti-leading-md` | the line height, the same as body prose | the consumer's; the package writes none | ADR 0004 |
| Host attribute (package) | not Yeti's | static presence attribute `data-ngx-yeti-item-lede` (empty value) | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0080 point 2 |

**Module replaced:** none. Yeti's `lede` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 46, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads the three tokens above. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. `--yeti-lede-size` and `--yeti-lede-measure` are not hue, chroma, or scale inputs, so they also take effect on any element, such as one long-read container (`Y/src/guides/theming.md:38`; the comment at `Y/src/tokens/type.css:35-37`). Yeti's own guidance, which the package documents unchanged: a theme that moves the size moves the measure, because `ch` is a unit of the font (`lede.css`, `docs.md`). **Private tokens** (`--_yeti-*`) are never read or written.

### 3. Hierarchy and DI shape

None. `YetiLede` is a standalone item directive. It provides no injection token, injects no parent, hosts no directive, and is hosted by none: no Yeti item always sits on another item's element (Part 2, "Two findings that hold across the matrix"). A consumer composes it beside another directive on the same element by writing both attributes, for example a lede that is also an `enter` target (`<p yetiLede yetiEnter>`), because the two declare no shared input name (building-blocks 1.4, shared vocabularies).

The only injection is the root styles service of ADR 0060, through `injectYetiItemStyles('lede')` ([setup](setup.md); ticket 50 decisions 42 and 45), with which the directive acquires and releases the `lede` item file. That service is the [setup](setup.md) spec's (`provideYetiStyles()`) and ADR 0060's; this spec only names the item it acquires.

Generated ids and the platform's relationship attributes: none. The lede renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | Value |
| --- | --- |
| Class | `YetiLede`. Checked at the Pin: `yeti.d.ts` exports 46 names and `YetiLede` is not one of them, so the name takes `Yeti`, not `NgxYeti` (ADR 0080 point 4; checked against Yeti's built `dist/yeti.d.ts` at the pin, which ADR 0080 used) |
| Selector | `[yetiLede]` (Part 2 row 46) |
| `exportAs` | `yetiLede` (building-blocks 1.3) |
| Entry point | `ngx-yeti/lede` (building-blocks 1.3; ADR 0011 clause 10) |
| Host | `class: 'lede'`; `'data-ngx-yeti-item-lede': ''` (both static) |
| Inputs, models, outputs, methods | none |
| Lifecycle | `injectYetiItemStyles('lede')` is the last statement of its constructor, after anything there that can throw (nothing does today), so the `lede` item file is acquired on the server too; the release runs through `DestroyRef` (ADR 0060 point 2; [setup](setup.md); ticket 50 decisions 42 and 45; building-blocks 1.9) |

No input exists, so building-blocks 1.4's rule for inputs named like HTML attributes has nothing to apply to, and no default changes.

**Usage rules** (numbered here and in the directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiLede` on the one paragraph under the page's heading that says what the page is. Yeti: "Put it on that paragraph and nothing else: a second lede on a page is not a lede" (`docs.md`). The selector accepts any element, as row 46 has it; the paragraph is the documented host.
2. Do not write `class="lede"` or `data-ngx-yeti-item-lede` statically on the host. The directive binds both (ADR 0003 point 1; building-blocks, "Hydration constraints (2026-10-03)": a consumer writes no static attribute that a directive binds).
3. Do not use the lede in place of a heading. It takes no role and is not a heading (manifest `a11y.notes`); the page's heading stays a heading element.
4. Import `YetiLede` in every component whose template writes `yetiLede`. A **Forgotten import** renders a plain paragraph with no error, because the directive has no input the compiler could report (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `lede` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an attribute directive on the consumer's paragraph | no component; Material's typography hierarchy is a Sass mixin that emits classes for type levels (`NC/src/material/core/typography/_typography.scss:12`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | a global stylesheet compiled from Sass |
| Accessibility | none of its own: ordinary prose | none of its own |
| API | class and `exportAs` only | classes only |

Nothing from Material's API applies: neither side has behaviour to compare. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 46; building-blocks 1.2). The reason: Yeti's CSS does the whole job; the directive adds the class, the item-file acquisition, and `exportAs` (row 1's reason, which row 46 takes, "as row 1"). No Aria pattern applies (a lede has no role), and no CDK piece is used: there is no id, focus, keyboard, or observer.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The lede is a paragraph with no role, state, or property, and adds no tab stop.
- **Keyboard:** none.
- **Names:** none. The lede is named by nothing and names nothing.

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The lede is the consumer's `p`, with no role; its relationship to the page is its position under the heading, which the DOM order carries (manifest `a11y.notes`). Usage rule 3 keeps headings as headings. |
| 1.3.2 Meaningful Sequence | The class changes size and line length only; DOM order is reading order. |
| 1.4.3 Contrast (Minimum) | axe left `color-contrast` incomplete on Yeti's example in Chromium and Firefox (ticket 17). The play function computes the ratio of the lede's text and of the heading above it from computed colours with the exact WCAG formula, unrounded, in the light and dark schemes, and asserts at least 4.5:1 ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3; A11Y-10e). It uses the normal-text threshold even where the lede's computed size could count as large text, because the size is a token the consumer may lower ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). A package rule is added only if the assertion fails (A11Y-10a's "package rule only if it fails"). |
| 1.4.4 Resize Text | The size is `var(--yeti-text-lg)` at the pin, a step of Yeti's fluid type scale with `rem` bounds (`Y/src/tokens/type.css`), and the measure is in `ch`; both grow with text zoom (read, not measured for the lede). |
| 1.4.10 Reflow | `max-inline-size` only caps the line; the lede sets no minimum width. Layer 4 asserts no horizontal overflow at a 320 px viewport. |
| 1.4.12 Text Spacing | The rule sets no height and no overflow; overridden spacing grows the paragraph (read). |
| 2.4.6 Headings and Labels | Not met by the lede and not claimed: the page's heading carries it (usage rule 3). |

**Ledger rows owned:** A11Y-10e only ([ledger.md](../ledger.md)). This spec confirms its **What the package adds** column as written ("As A11Y-10a": a play-function assertion with the exact formula; a package rule only if it fails) and does not change it. Its **What Yeti does** column read "as A11Y-10b" (text over an image, the author's responsibility), which did not describe the lede's example: there is no image, and axe's incomplete result names the example's heading. [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 23 rewrites that cell: plain text on the page surface; axe left `color-contrast` incomplete on the example's heading as partially obscured, cause not traced. No new ledger row: the lede adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<article>
  <h1>Card</h1>
  <p yetiLede>A bordered surface for one thing.</p>
  <p>One thing in a box: an article in a listing, a product, a person, a plan.</p>
</article>
```

Server HTML and the hydrated DOM are the same: the paragraph carries `yetilede=""`, `class="lede"`, and `data-ngx-yeti-item-lede=""`, and nothing else from the package. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>utilities/lede/lede.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="lede"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The lede has no closed or open state.

The delta from Yeti's docs markup: the consumer writes `yetiLede` where the docs write `class="lede"`.

### 9. Animation

None. The lede has no state and no transition. Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may put the `enter` utility's directive beside it, and may remove a lede with a class-form `animate.leave`. In that case the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A lede that is server-rendered never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static host class and host attribute, plus the item link in `<head>` (section 8). Nothing is state, so nothing is Angular-owned **Pre-hydration state** (ADR 0003 point 4).
- **Before hydration:** the directive creates no node, reads no layout, starts no timer or observer, and touches no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is the item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** the paragraph is claimed as is; 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the lede and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism).
- **`hydrate never`:** the lede is its server HTML and stays styled while the host is connected, whatever live ledes do (ADR 0060 point 4). There is no Angular behaviour to lose.
- **Client-only `@defer`:** the item file is fetched when the directive is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['lede'] })` (ADR 0060 point 6; [setup](setup.md)).
- **Event replay:** the directive declares no listener, so nothing replays and no `jsaction` is added to the lede.
- **`withI18nSupport()`:** a lede's text is usually translated with `i18n` in the consumer's component. The directive adds no `i18n` block of its own; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** no state, so nothing for change detection to refresh (map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the lede is readable and styled, because the class and the item link are in the server HTML. Nothing is lost: the lede has no behaviour. A client-only application gets no such promise.
- **Hydration boundary:** the lede may sit in any boundary; it has no parts and no references.

### 11. Hydration constraints

The lede complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the host bindings are static, so both render `class="lede"` and `data-ngx-yeti-item-lede`.
- **No direct DOM manipulation:** the directive writes nothing to the DOM. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directive changes no element; the consumer's `p` stays a `p`. A `p` cannot hold block content, so a lede that wraps a `div` would be repaired by the parser and differ from the server's DOM; usage rule 1's paragraph host avoids it.
- **`preserveWhitespaces`:** the directive has no template.
- **No output branched on the platform:** none.
- **Static attributes the directive binds:** usage rule 2 keeps the consumer from writing them.

### 12. Single-page application

None. The lede has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's ledes leave with the route, and the item link is removed in the animation frame after no lede host is connected (ADR 0060 point 4). A route that renders a lede again re-inserts it.

### 13. Item file

`yeti-css/css/utilities/lede/lede.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiLede]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:68`, the rank table of point 3), and removed after the last host has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement, and optionally `provideYetiStyles({ preload: ['lede'] })`. The lede adds nothing to it. Cross-item files acquired: none (`lede.css` has no cross-item rule; ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attribute in the DOM, the item link, the computed type on the paragraph, and the contrast. It never asserts a private field or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3). Where a test needs to know that the lede's rule applied, it compares the lede's computed `font-size` and `max-inline-size` with those of a probe element in the same story whose inline style is `font-size: var(--yeti-lede-size)` and `max-inline-size: var(--yeti-lede-measure)`, so the assertion holds for any token value. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `lede` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `lede--default`: Yeti's example (heading, lede, body paragraph). Asserts `class="lede"` and `data-ngx-yeti-item-lede` on the paragraph, no other package attribute, no `tabindex`, and an accessible role of `paragraph`. Asserts the computed `font-size` and `max-inline-size` equal the probe's. Asserts the WCAG contrast ratio of the lede's text and of the heading, each against its computed background, with the exact formula, unrounded, at least 4.5:1 (A11Y-10e).
- `lede--dark-scheme`: the same markup in a wrapper with the consumer's `color-scheme: dark` (ADR 0004 consequences). Repeats the contrast assertion (ticket 17 measured both schemes).
- `lede--in-stack`: the heading and the lede wrapped in a `stack` layout, Yeti's own reason for using a class (`docs.md`). Asserts the lede still matches the probe.
- `lede--themed`: the story sets `--yeti-lede-size` and `--yeti-lede-measure` on its wrapper. Asserts the computed values follow the probe in that wrapper, so a consumer's token takes effect.

### Layer 2: browser-level (`npx nx test <lib>`, `lede.spec.ts`)

Through `TestBed.createDirective(YetiLede, { tagName: 'p' })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- the host has class `lede` and `data-ngx-yeti-item-lede`;
- the host has no other attribute from the package and no listener;
- while the fixture lives, one `<link data-ngx-yeti-styles="lede">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone;
- two fixtures share one link, and it stays until both are destroyed.

A small test host covers what `createDirective` cannot: a template reference `#l="yetiLede"` resolves to the `YetiLede` instance, and the consumer's own `class` on the host is kept beside `lede`.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `lede.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose heading and lede carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the lede renders `class="lede"` and `data-ngx-yeti-item-lede`; `<head>` holds one item link with `data-ngx-yeti-styles="lede"`, `data-beasties-skip`, and an `href` ending `utilities/lede/lede.css?v=<pin>`; the lede carries no `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the lede through the contract mapping: class `lede` has `YetiLede`; the manifest's `attributes`, `markers`, and events for `lede` are empty, so a pin move that adds one fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

On the fixture app, built with `outputMode: 'server'`, with a `/lede` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the lede matches the probe and `@axe-core/playwright` with the six tags reports no violation;
- a lede inside a client-only `@defer` block with `lede` in the preload list shows no unstyled frame; a lede inside a `hydrate never` block stays styled after a live lede on the page is removed;
- navigating from the lede route to a route without a lede removes the item link, and navigating back re-inserts it;
- at a 320 px viewport the page has no horizontal overflow (1.4.10);
- in Firefox, the lede renders with normal wrapping, with no error (Yeti's `text-wrap: pretty` is outside the browser target there).

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the lede story; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula.

## Out of Scope

- An input per token, or a lede size or measure input (ADR 0004).
- A `p[yetiLede]` selector or any check that the host is a paragraph or that a page has one lede. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- Package CSS for the lede, unless the contrast assertion fails (A11Y-10a's rule).
- Heading semantics, `aria-describedby` from the heading to the lede, or any role on the lede (manifest `a11y.notes`).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiLede]`, class only | building-blocks Part 2 row 46; [Decide: the spec list](../issues/11-decide-spec-list.md) ("Class only.", and point 7: even `lede` gets a static host class and an `exportAs`) |
| Static host class; the consumer writes no Yeti class | ADR 0003 point 1 |
| `exportAs: 'yetiLede'`; class `YetiLede` with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/lede` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 46 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link with `data-ngx-yeti-item-lede` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) | ADR 0060 points 2 to 6 |
| `injectYetiItemStyles('lede')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| Contrast asserted in the play function | ADR 0015 point 3; ledger A11Y-10e |
| Normal-text 4.5:1 threshold for the lede | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A page header:

```html
<header yetiStack>
  <h1 i18n>Trail maps</h1>
  <p yetiLede i18n>Printed maps for every marked route in the park.</p>
</header>
```

```ts
import { YetiLede } from 'ngx-yeti/lede';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-maps-header',
  imports: [YetiLede, YetiStack],
  templateUrl: './maps-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsHeader {}
```

A theme that sets the lede two steps up and on a shorter line, in the consumer's stylesheet after Yeti:

```css
:root {
  --yeti-lede-size: var(--yeti-text-xl);
  --yeti-lede-measure: 42ch;
}
```

A page whose lede renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['lede'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `utilities/lede/lede.css`, loaded by the directive as a counted link (section 13). The consumer writes nothing for the lede beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `tokens/type.css` declares `--yeti-lede-size`, `--yeti-lede-measure`, `--yeti-leading-md`, and the type scale; `base/typography.css` sets the body prose the lede is measured against.
3. **Cross-item rules:** none.
4. **Tokens:** reads three, writes none (section 2).
5. **What breaks without the item file:** the paragraph renders at the body size and the body measure, so the lede reads as body copy, with no error.
6. **Tailwind name collision:** none known. building-blocks 1.13 lists `container`, `grid`, `table`, and `hidden`, not `lede` (that Tailwind generates no `lede` utility is inferred, not measured).

### Platform features to adopt when the browser target moves

None for the package. Yeti's `text-wrap: pretty` (`lede.css:17`) is outside Baseline 2025 (Firefox lacks it; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md)) and unguarded; it is one of the cosmetic features the specs treat as Yeti does (building-blocks 1.2), so Firefox wraps the lede normally. It needs nothing from the package when the target moves. Yeti's manifest lists `support.unguarded` as empty for the lede, which does not match ticket 01's finding. This is upstream-bugs row Y8 (verified *read*, no minimal reproduction, not filed); the package does nothing either way ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 25).

### Single-page-application pieces relied on

None: the lede uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
