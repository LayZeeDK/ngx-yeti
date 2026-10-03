# Spec: print (utility)

Ticket: [Spec: print (utility)](../issues/48-spec-print.md). Targets Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Accessibility target: WCAG 2.2 AA.

`print` is a **Utility** ([CONTEXT.md](../CONTEXT.md)): an **Item** of kind `utility` with one **Identity class**, one **Attribute**, no **Marker**, no **Token**, no **Module**, and no **Event**. The package's answer is one **Item directive** of the "types only" kind ([building-blocks.md](../building-blocks.md) Part 2 row 48). Every decision below cites the record that made it. The one point the ticket listed as open was decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decision 12).

Sources at the pin, read for this spec: `src/utilities/print/manifest.json`, `print.css`, `docs.md`, and `example.html`; `src/guides/visibility.md:28`, `:160-169`; `src/guides/migrating.md:44-45`; `src/yeti.css:70`; and Yeti's own browser test `test/browser/utilities/print.spec.js` with its fixture. `Y/` below is the Yeti clone at the pin.

## Problem Statement

An Angular developer building a page that people print needs two kinds of element that Foundation for Sites called `.show-for-print` and `.hide-for-print` (`Y/src/guides/migrating.md:44-45`): a line that exists only on paper (the address behind a link, the date the page was printed, where the document came from), and a control that exists only on screen (a share button, a video, a cookie banner, a "back to top" link). Yeti gives both one name, the `print` class with `data-print="none"` for the screen-only case (`Y/src/utilities/print/docs.md:1-15`).

Written by hand in an Angular template, that contract has the problems every Yeti item has in Angular:

- the developer writes Yeti's class and attribute as strings, so `data-print="nnone"` or `class="prnt"` compiles and silently does nothing, and the screen-only button prints after all;
- a static `data-print` beside a directive that also binds it is written again by hydration, against the hydration constraints the user requires (map, Standing rulings, Hydration constraints; [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) consequences);
- the item's stylesheet has to be on the page whenever a `print` element is, on the server and in the browser, or a paper-only line shows on screen;
- nothing tells the developer the accessibility consequences Yeti states: a paper-only line is never announced on screen, and nothing on paper may depend on a screen-only control (`Y/src/utilities/print/manifest.json:18`).

## Solution

The developer writes `yetiPrint` on the element. Bare, it marks the element as paper-only, which is Yeti's default; `yetiPrint="none"` marks it as screen-only; `yetiPrint="only"` writes the default out. The directive binds Yeti's `print` class as a static host class, renders `data-print` from the typed input only when a value is given, and loads Yeti's `print` **Item file** while any instance is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). A misspelt value fails to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)).

Everything else is Yeti's CSS: two rules in two media queries in the `yeti.utilities` layer (`Y/src/utilities/print/print.css:16-33`). The directive declares no listener, no render callback, and no output, so it behaves the same in every rendering mode, before and after hydration, and with JavaScript off. It sits on any element, beside another item's directive where Yeti's docs combine the two (`<button yetiButton yetiPrint="none">`, from `Y/src/utilities/print/example.html:3`).

## User Stories

1. As an Angular developer, I want to write `yetiPrint` on an element, so that it appears on the printed page and nowhere else.
2. As an Angular developer, I want to write `yetiPrint="none"` on an element, so that it appears on screen and is left off the printed page.
3. As an Angular developer, I want `yetiPrint="only"` to mean the same as a bare `yetiPrint`, so that I can write the default out when it makes a template clearer.
4. As an Angular developer, I want a misspelt value such as `yetiPrint="nnone"` to fail to compile, so that a screen-only control never prints by accident.
5. As an Angular developer, I want to bind the value, `[yetiPrint]="mode()"`, so that one element can switch medium from application state.
6. As an Angular developer, I want a bound empty string to render no attribute, so that I can bind "default" without writing `only`.
7. As an Angular developer, I want to write no Yeti class and no `data-print` attribute myself, so that Yeti's contract has one owner, the directive.
8. As an Angular developer, I want `yetiPrint` to sit beside `yetiButton` on one `button`, so that Yeti's own example, a share button that does not print, works as Yeti documents it.
9. As an Angular developer, I want a screen-only button to come off the page even though `.button` sets its own `display`, so that the utility does what it says.
10. As an Angular developer, I want `yetiPrint` to work on any element, so that I can mark a paragraph, a link, a figure, a banner, or a whole section.
11. As an Angular developer, I want the `print` item file to load when the first `yetiPrint` element renders and to go after the last, so that pages without one do not carry its rules.
12. As an Angular developer using SSR or prerendering, I want the server HTML to carry the class, the attribute, and the item file's link, so that the first paint is right on screen and on paper.
13. As an Angular developer using SSR, I want hydration to change nothing on a `yetiPrint` element, so that the page complies with Angular's hydration constraints.
14. As an Angular developer, I want `yetiPrint` to work inside a `hydrate never` block, so that dehydrated content still keeps to its medium.
15. As an Angular developer using a client-only `@defer` block or a routed view, I want to know how to preload the item file, so that a paper-only line never flashes on screen while the stylesheet loads.
16. As an Angular developer, I want `yetiPrint` to work zoneless, so that my zoneless application needs nothing extra.
17. As an Angular developer using `i18n`, I want a translated paper-only line to hydrate under `withI18nSupport()`, so that the page is not re-rendered.
18. As an Angular developer, I want an `exportAs` of `yetiPrint`, so that I can reach the directive from a template reference, as with every package directive.
19. As an Angular developer, I want the directive class to be `NgxYetiPrint` and the value type to be Yeti's own `YetiPrint`, so that importing both into one file causes no name clash.
20. As an Angular developer, I want to import the directive from `ngx-yeti/print`, so that a deferred block that uses it splits into its own chunk.
21. As an Angular developer, I want the docs to tell me which accessibility rules I must keep, so that a paper-only or screen-only element never hides something a reader needs.
22. As an Angular developer, I want to be told that a later cascade layer, unlayered CSS, or an inline `display` on the same element defeats the utility, so that a Tailwind `flex` class does not quietly put a screen-only control on paper.
23. As an Angular developer, I want to be told not to combine `yetiPrint` with `yetiVisuallyHidden` on one element, so that I reach for the right tool for "heard but not seen".
24. As an Angular developer writing markup outside Angular templates (`index.html`, `[innerHTML]` content), I want to know I write Yeti's class and attribute as Yeti documents them, so that those elements work too.
25. As an Angular developer, I want to bind a value newer than the pin through the input with `$any`, so that I am not blocked by the package's release.
26. As a reader on screen, I want paper-only lines kept out of sight, so that the page shows only what is useful on screen.
27. As a reader of a printed page, I want the address behind a link and the date of printing on the paper, so that the printed copy stands on its own.
28. As a reader of a printed page, I want share buttons, videos, and banners left off, so that the paper carries only content.
29. As a screen-reader user, I want paper-only lines to stay out of the accessibility tree on screen, so that I do not hear text meant for paper.
30. As a screen-reader user, I want nothing I need to be placed only in a paper-only element, so that I lose no information on screen.
31. As a keyboard user, I want a paper-only link to take no Tab stop on screen, so that focus never lands on something I cannot see.
32. As a person filling in a printed form, I want the form's only way back never to be a screen-only control, so that the printed form can still be returned.
33. As a reader of a black-and-white printout, I want no meaning carried only by which medium shows an element, so that the printed page keeps its sense.
34. As a user with JavaScript off on a server-rendered or prerendered page, I want printing and screen display to behave exactly as with JavaScript on, so that I lose nothing.
35. As a maintainer of ngx-yeti, I want the contract check to fail when Yeti's `print` vocabulary gains or loses a value at a pin move, so that the input type never drifts from Yeti.
36. As a maintainer of ngx-yeti, I want a story and an e2e test that switch the medium in three engines, so that the screen and paper rules are both covered.
37. As a maintainer of ngx-yeti, I want an SSR smoke test that asserts the server HTML and the item link, so that a regression in the first paint fails before release.
38. As a maintainer of ngx-yeti, I want `yetiPrint` to add no ledger row, so that the ledger records only what the package adds over Yeti.
39. As a maintainer of ngx-yeti, I want the directive to have no listener, so that event replay has nothing to replay and nothing to break.

## Implementation Decisions

### 1. Yeti contract

From the manifest at the pin (`Y/src/utilities/print/manifest.json`):

- **Kind and group:** `utility`, group "Visibility". Description: "Marks an element as belonging to one medium: on the printed page only, or on the screen only."
- **Class:** `print` (`:7`); `classes`, `children`, `markers`, and `tokens` are empty.
- **Attribute:** `data-print`, enum of vocabulary `print` (`only`, `none`; `Y/schema/vocabulary.json:46`), default `only` (`:9`). An absent attribute means `only`: the rule is written as `.print:not([data-print="none"])` "so the written-out default and the omitted one are the same rule and can never drift" (`print.css:17-23`).
- **CSS:** `@media not print { .print:not([data-print="none"]) { display: none; } }` and `@media print { .print[data-print="none"] { display: none; } }`, both in `@layer yeti.utilities` (`print.css:16-33`). The utilities layer is last in Yeti's order, so the rule outranks a component's own `display` (`.button` is `inline-flex` in `yeti.components`, `print.css:26-29`).
- **`a11y`:** no required attributes, no keyboard. Notes: both states take the element out of the accessibility tree in the medium they are not for; a paper-only line must never carry what a screen reader needs; nothing on paper may depend on a screen-only control; "heard but not seen" is `visually-hidden`, not this; "never let the print state be the only thing carrying a meaning" (`:15-19`).
- **`support`:** `unguarded: ["@media print"]`, `guarded: []` (`:21`). Media queries are inside the browser target ([ADR 0002](../adr/0002-browser-target-baseline-2025.md); [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), `media-queries` row).
- **Module and events:** `js: null`. No event ([Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md): print has no module).

Attributes left to the consumer: none. Ticket 26 row 168 maps `data-print` to the selector-named input; it is "the consumer's binding only" ([Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md)).

### 2. Contract mapping

| Yeti contract | ngx-yeti | Type | Default and unset behaviour | Static form of the input name | Record |
| --- | --- | --- | --- | --- | --- |
| class `print` | static host class on `NgxYetiPrint`, selector `[yetiPrint]` | none | always present | not applicable | [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 1 |
| attribute `data-print` | input `yetiPrint` (selector-named), bound as `[attr.data-print]` | `YetiPrint \| ''`, `YetiPrint` being Yeti's `print` vocabulary type (`'only' \| 'none'`) | unset or `''`: no attribute, so Yeti's default `only` applies; `only` and `none` render as given | `yetiprint` is not an HTML attribute, so no presentational kind applies (building-blocks 1.4) | ADR 0070 rule U and rule 1; ticket 26 row 168; map, Standing rulings, Selector-named inputs |
| markers | none | | | | manifest `markers: []` |
| events | none; no output | | | | manifest `js: null`; [events spec](events.md) API rule 4 |
| tokens | none named; the item reads no token | | | | manifest `tokens: []`; [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) |
| package runtime name | static presence attribute `data-ngx-yeti-item-print` (empty value) | | always present | | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 point 2 |

The `''` member is ADR 0070 rule U's addition for the bare selector, not a value of Yeti's vocabulary. The **Contract check** compares the vocabulary part of the type, `YetiPrint`, with the manifest's values ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3).

Module replaced: none. Yeti's `print` has no module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 48).

### 3. Hierarchy and DI shape

- One directive, no **Part directive**: the manifest declares no children and no markers ([architecture-guide.md](../architecture-guide.md) P2).
- No injection token, no parent, no `hostDirectives`. `print` is not always on another item's element, so it hosts nothing; where it shares an element with another item (`button`, a `stack` child, a `card`), the consumer writes both directives beside each other ([building-blocks.md](../building-blocks.md) 1.9; P6). The two never declare the same input name, because `yetiPrint` is selector-named (P9; ADR 0070's consideration of plain names).
- No generated id and no platform relationship attribute ([generated-ids spec](generated-ids.md) does not apply).
- The one injection is the root styles service of ADR 0060, reached by `injectYetiItemStyles('print')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45): the directive acquires the `print` item file, on the server and in the browser, and releases it through `DestroyRef` on destroy (ADR 0060 point 2). Part 2's "types only" ("no service") was written before ADR 0060 gave every directive this acquisition; this spec reads the two together.
- **Two items on one element.** Each item directive sets its own presence attribute, `data-ngx-yeti-item-<item>`, and ADR 0060 point 4 keeps an item's link while an element carrying that attribute is connected ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 12). When `yetiPrint` shares an element with another item directive (`<button yetiButton yetiPrint="none">`, Yeti's own example), the host carries both `data-ngx-yeti-item-button` and `data-ngx-yeti-item-print`. The names differ, so Angular's merge of host attributes, where a later value for the same name overwrites the earlier one (`mergeHostAttribute`, `NGP/core/src/render3/util/attrs_utils.ts:191-197`, read at `5db6fc4453`, not run), never loses either.

### 4. API

`NgxYetiPrint`, entry point `ngx-yeti/print` ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 10; building-blocks 1.3):

| Member | Form | Notes |
| --- | --- | --- |
| selector | `[yetiPrint]` | any element ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 1) |
| class name | `NgxYetiPrint` | `YetiPrint` is a **Colliding name**: Yeti's `yeti.d.ts` exports it as the `print` vocabulary type (ADR 0080 point 4; [Decide: the glossary](../issues/10-decide-glossary.md) question 11) |
| `exportAs` | `yetiPrint` | the selector keeps `yeti` (ADR 0080 point 4); every directive has one (map, Input naming) |
| input `yetiPrint` | `input<YetiPrint \| ''>()` | no transform; Yeti's default is never written (ADR 0070 rule 1) |
| host | static `class: 'print'`, static `'data-ngx-yeti-item-print': ''`, `[attr.data-print]` from the input, `null` when unset or `''` | building-blocks 1.5: host bindings on signal state |
| models, outputs, methods | none | nothing in Yeti's contract changes state or reports one |

`YetiPrint` is Yeti's type, re-exported by name from the package's primary entry point through the generated types module, never redeclared (ADR 0080 point 5; ADR 0060 point 10).

**Usage rules** ([CONTEXT.md](../CONTEXT.md), Usage rule; P23). The first milestone reports no breach of any of them (map, Milestones):

1. Never put anything a screen reader needs on screen into a paper-only element (bare or `only`): it is `display: none` on screen and out of the accessibility tree there. An address a sighted reader can also see is fine; a warning is not (`Y/src/utilities/print/docs.md:29`).
2. Nothing on paper may depend on a screen-only element (`none`). A form whose only submit button is screen-only prints as a form nobody can return (`docs.md:31`).
3. Never combine `yetiPrint` with `yetiVisuallyHidden` on one element. On screen `print` removes the element, so nothing is left to announce; on paper the clip leaves a blank pixel. Text to be heard and not seen is `visually-hidden` alone (`docs.md:33`).
4. Never let the medium be the only carrier of a meaning; a printed page has no colour guarantee (manifest `a11y.notes`).
5. Set no `display` on a `yetiPrint` host from a cascade layer after `yeti`, from unlayered CSS, or from an inline style. The shared layer statement puts `ngx-yeti`, `components`, and `utilities` after `yeti` (ADR 0060 point 7), so a Tailwind `flex` class or an unlayered **Application class** on the same element beats Yeti's `display: none`, and an inline style beats every layer. Put that class on a wrapper or a child instead. Inferred from the cascade rules and Yeti's own reliance on layer order (`print.css:26-29`); the e2e Tailwind case in Testing Decisions measures it.
6. Write no static `data-print` on the host; give the value to the input. The directive's binding removes or overwrites it, and hydration writes it again (ADR 0070 consequences, 2026-10-03; [building-blocks.md](../building-blocks.md) "Hydration constraints").
7. Markup outside an Angular template (`index.html`, `[innerHTML]` content) is written as Yeti documents it, `class="print"` and `data-print="none"` (ADR 0070). It does not acquire the item file, so a page that has such markup and no `yetiPrint` host names `print` in the preload list (ADR 0060 point 6).
8. A value newer than the pin is bound as `[yetiPrint]="$any('new')"` (ADR 0070).

### 5. Material comparison

| Concern | Angular Material, CDK, or Aria (22.2.x) | ngx-yeti |
| --- | --- | --- |
| Show or hide by medium | none: Material, CDK, and Aria have no print utility | `yetiPrint` over Yeti's `print` |
| Hidden but announced | CDK's `cdk-visually-hidden` class | not this item: `yetiVisuallyHidden`, Yeti's own class (Part 2 row 49); usage rule 3 keeps the two apart |
| Responsive show and hide | CDK `BreakpointObserver` | not used anywhere in the package (building-blocks 1.7); Yeti's `data-show` and `data-hide` are container queries, owned by the `container` spec (Part 2 row 6) |

There is no accessibility or API shape to match: the nearest Material concept is a CSS class.

### 6. Implementation level and primitives

Native platform, level 1: the CSS `@media print` and `@media not print` queries in Yeti's item file, inside the browser target (Part 2 row 48; building-blocks 1.2). No Aria pattern, CDK primitive, or Material piece covers the medium, and none is needed: the platform does the whole job, and the directive adds the class, the typed attribute, the item file, and `exportAs` ("as row 1", Part 2). The package reads no `matchMedia('print')` and listens for no `beforeprint` or `afterprint` (P15: Yeti's behaviour in Angular's form, nothing more).

### 7. ARIA and keyboard

- No APG pattern. The directive binds no role, state, or property, and handles no key.
- In the medium an element is not for, `display: none` removes it from the accessibility tree and from the Tab sequence; in its own medium it is untouched (`docs.md:25-27`; `Y/src/guides/visibility.md:28`).
- Focus: a focusable element inside paper-only content is never a Tab stop on screen, so focus never lands on something invisible. A screen-only control keeps its own focus behaviour on screen.
- Ledger rows: none (Part 2 row 48). Yeti's notes are usage rules here, not gaps the package closes; the package adds nothing over Yeti's CSS.

### 8. Rendered HTML

Consumer markup (Yeti's example, `Y/src/utilities/print/example.html`):

```html
<div yetiStack gap="sm">
  <p yetiPrint>Printed from https://foundationcss.com/guides/visibility</p>
  <button yetiButton yetiPrint="none" type="button">Share this page</button>
</div>
```

Server HTML and the hydrated DOM are the same, apart from Angular's own hydration annotations:

```html
<div class="stack" data-gap="sm" data-ngx-yeti-item-stack="">
  <p class="print" data-ngx-yeti-item-print="">Printed from https://foundationcss.com/guides/visibility</p>
  <button class="button print" data-print="none" data-ngx-yeti-item-button="" data-ngx-yeti-item-print="" type="button">Share this page</button>
</div>
```

The button carries one presence attribute per item (section 3). `<head>` carries the item links in Yeti's order, the `print` link among them: `<link rel="stylesheet" href="yeti-css/utilities/print/print.css?v=<pin>" data-ngx-yeti-styles="print" data-ngx-yeti-app="<APP_ID>" data-beasties-skip>` (ADR 0060 points 2, 3, 5). There is no closed or open state: the medium decides, and the DOM never changes.

### 9. Animation

None. The medium switch is `display: none`, which Yeti does not transition, and the directive never inserts or removes an element, so `animate.enter` and `animate.leave` do not apply ([ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md)). Reduced motion has nothing to collapse.

### 10. Rendering modes

[ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and building-blocks 1.11, for this item:

- **SSR and prerendering.** The server HTML is section 8: the class, `data-print` where a value is given, the host attribute, and the item link in `<head>`, written by the server in Yeti's order (ADR 0060 point 5). Prerendering is the same HTML at build time; nothing reads a request token (1.11 decision 10). The first paint is right in both media.
- **Pre-hydration rules.** The directive does nothing outside host bindings and the constructor's acquisition, which only records the item for the server's `<head>`. It creates no node, writes no DOM, starts no timer or observer, and reads no `window` (1.11 decision 3).
- **Full hydration.** The host bindings compute the same values on the client; the client adopts the server's link by `data-ngx-yeti-styles` and `data-ngx-yeti-app` (ADR 0060 point 5). Nothing is rewritten, provided the consumer writes no static `data-print` (usage rule 6).
- **Event replay.** The directive declares no listener, so no `jsaction` is added for it and nothing replays. A click on a screen-only button replays to that button's own listeners as usual.
- **Incremental hydration (`hydrate on ...`).** Before its trigger the host is **Dehydrated state**: Yeti's CSS does the whole job, and the host attribute holds the item link while the element is on the page (ADR 0060 point 4). After the trigger the bound value can change.
- **`hydrate never`.** Everything works: the medium switch is CSS. What is lost is only a bound value's later change. The dehydrated host holds the link by its presence attribute, alone on its element or sharing one (section 3).
- **Client `@defer`, routed views, and `@if`.** A host rendered on the client fetches the item file on construction, and until the file arrives a paper-only line shows on screen: ADR 0060 point 6 measured 18 to 20 unstyled frames with a 300 ms delay and 1 to 2 with none. For `print` this is visible content, not only an unstyled box. A consumer whose first `print` host is client-rendered names `print` in `provideYetiStyles({ preload: ['print'] })`, which gave 0 frames in three engines (ADR 0060 point 6). That point measured client-only `@defer`; applying it to routed views and `@if` is this spec's reading of the same fetch-on-construct path.
- **`withI18nSupport()`.** No effect on the directive. A component whose template has an `i18n` paper-only line needs it to hydrate rather than re-render (1.11; ADR 0011 clause 11); the fixture's one `i18n` text is the paper-only line.
- **Zoneless.** The input is a signal and the host binding reads it; there is no listener and no field (map, Standing rulings, item 43).
- **JavaScript off.** With SSR and with prerendering, nothing is lost: the class, the attribute, and the item link are in the server HTML, and both media rules are CSS (map, Standing rulings, JavaScript off; ADR 0011 consequences). A client-only application renders nothing with JavaScript off and is promised nothing.
- **Hydration boundary.** A single element; any boundary will do (1.11 decision 6).

### 11. Hydration constraints

The directive complies with every constraint the user requires (map, Standing rulings, Hydration constraints): the server and the client render the same DOM from the same host bindings; it manipulates no DOM; it adds no element, so it cannot make HTML invalid and works on any valid host; it has no template, so `preserveWhitespaces` cannot differ; and nothing branches on the platform. The consumer's part is usage rule 6.

### 12. Single-page application

None. The item has no fragment link and nothing to close on navigation ([fragment-links spec](fragment-links.md) and [navigation-close spec](navigation-close.md) do not apply; building-blocks 1.15). When a route with the last `yetiPrint` host goes, the link goes with it in the next frame (ADR 0060 point 4), and printing the new route uses the new DOM. A route rendered on the client after navigation is covered by the preload rule in section 10.

### 13. Item file

`yeti-css/css/utilities/print/print.css`, imported by `Y/src/yeti.css:70` among the utilities. It is acquired by every `NgxYetiPrint` instance through the counted link of ADR 0060, on the server and in the browser, and released on destroy. It depends on no other item file and no other item depends on it (ADR 0060 point 9: no cross-item rule). It loads no stylesheet of the package's own.

### 14. Accessibility (WCAG 2.2 AA)

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | On screen, a paper-only element is removed for every reader at once, sighted or not, so no reader gets less than another; usage rule 1 keeps anything a screen reader needs out of it |
| 1.4.1 Use of Color | Applies to the screen. On paper, WCAG does not govern, but usage rule 4 carries Yeti's note that the medium must not be the only carrier of a meaning |
| 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.11 Focus Not Obscured (Minimum) | A paper-only element takes no Tab stop on screen, so focus never reaches something invisible; a screen-only control keeps its own keyboard behaviour |
| 4.1.2 Name, Role, Value | Untouched: the directive adds no role, name, or state |
| 3.3.x (forms) | Usage rule 2: nothing a printed form needs may be screen-only |

The **Story gate** runs axe on every `print` story in the screen medium, where a paper-only element is out of the tree, so axe checks what a screen user meets; Yeti's own test of the item found no violation (`Y/test/browser/utilities/print.spec.js`, last case). Ledger rows: none (Part 2 row 48). Manual release test ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 7): with a screen reader, a paper-only line in `print--default` is not announced, and the browser's print preview shows the line and not the share button.

## Testing Decisions

A good test asserts what a reader meets: the computed `display` of each element in each medium, the class and the attribute in the DOM, and the item link in `<head>`. It never reads an instance field (P25). Every test runs zoneless (map, Standing rulings, item 43). The layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

Story ids (building-blocks 1.3; `<item>` is `print`):

- `print--default`: Yeti's example, a paper-only line and a screen-only `yetiButton` in a `yetiStack`, plus a plain paragraph on both media and a bare-versus-`only` pair, as Yeti's fixture has (`#url`, `#bare`, `#share`, `#plain`).
- `print--bound`: one element whose `[yetiPrint]` is a story arg (`''`, `'only'`, `'none'`).

**Layer 1, story play functions** (`npx nx test-storybook <lib>`), screen medium only, because building-blocks 1.12 puts `emulateMedia` in layer 4:

1. `print--default`: the paper-only line and the bare element have computed `display: none`; the share button and the plain paragraph do not; the button carries `class` with both `button` and `print` and `data-print="none"`; the bare element has no `data-print`; the `only` element has `data-print="only"`; the story gate passes.
2. `print--bound`: switching the arg from `''` to `'none'` adds `data-print="none"` and shows the element; back to `''` removes the attribute and hides it; `'only'` hides it with the attribute present.

**Layer 2, browser-level** (`npx nx test <lib>`), through `TestBed.createDirective(NgxYetiPrint, { tagName: 'p', bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

1. With no binding, the host has class `print`, `data-ngx-yeti-item-print`, and no `data-print`.
2. With `yetiPrint` bound to `''`, no `data-print`; to `'only'` and `'none'`, the attribute equals the value; changing the bound signal updates it without `detectChanges` beyond `whenStable()`.
3. `<link data-ngx-yeti-styles="print">` is in `document.head` while the fixture lives and gone after destroy, observed in the DOM (the root service is unexported, so no double of it can be built).
4. A test host with `<button yetiButton yetiPrint="none">` renders `class="button print"` and both directives' attributes, including both `data-ngx-yeti-item-button` and `data-ngx-yeti-item-print` (ADR 0045).

**Layer 3, node-level** (`npx nx test <lib>`):

1. SSR smoke (`print.ssr.spec.ts`, through the shared `renderServer()` helper with `withI18nSupport()`): a fixture with the default example, an `i18n` paper-only line, and a bound `yetiPrint=""` resolves `whenStable()` and emits section 8's HTML: `class="print"`, `data-print="none"` on the button, no `data-print` on the bare and the `''` hosts, the `print` link in `<head>` with its attributes, and no `jsaction` on any `yetiPrint` host that has no other listener.
2. Contract check coverage: the manifest's `print` class has its directive, `data-print` has the input `yetiPrint`, and the vocabulary type's members equal the manifest's `only` and `none`, with `''` exempt as ADR 0070 rule U's addition.
3. Type tests with `expectTypeOf`: `'nnone'` is not assignable to the input's type; `''`, `'only'`, and `'none'` are.

**Layer 4, Playwright e2e:**

- Storybook half (`npx nx e2e <lib>-e2e`, Chromium, Firefox, WebKit), on `print--default`, Yeti's four cases ported: on screen the paper lines are gone and the screen control is there; with `page.emulateMedia({ media: 'print' })` the two swap and the plain one stays; the bare element and the `only` element agree in both media; the screen-only `.button` really is `display: none` on paper. Plus usage rule 5's case: a Tailwind `flex` utility or an unlayered rule on a `yetiPrint="none"` host keeps it on paper (asserted as the documented failure, in a story that is not part of the gate's set).
- Fixture half (`npx nx e2e <fixture-app>-e2e`), against the fixture app's `print` routes, one prerendered and one server-rendered ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2): hydration with no NG05xx and `componentsSkippedHydration === 0`; with JavaScript disabled, both media assert as above, and axe with the six tags passes on the screen medium; inside a `hydrate never` block the host keeps to its medium and the `print` link stays after the last live `yetiPrint` instance leaves; a client-only `@defer` host shows no paper-only line on screen in any frame when `print` is in the preload list.

Prior art: Yeti's own `print.spec.js` and its fixture, which the layer 4 Storybook half ports; ticket 18's fixture app and SSR builds for the fixture half; [Prototype: item styles as counted `<link>`s](../prototypes/style-loading/README.md) for the link and preload assertions.

## Out of Scope

- Print styling Yeti leaves to the author: `@page`, page margins, `break-inside` and the other break properties, a forced colour scheme on paper, and writing link addresses after links (`docs.md:21`). The package adds none (P15).
- A print button, `window.print()`, `beforeprint` and `afterprint` listeners, or a `matchMedia('print')` signal.
- Show and hide by container width (`data-show`, `data-hide`): the `container` spec's any-element directives (Part 2 row 6).
- Hidden-but-announced text: the `visually-hidden` spec (Part 2 row 49).
- A misuse warning for usage rules 3 and 5, or any other check: a later milestone (map, Milestones).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive, no part directive, types only | [building-blocks.md](../building-blocks.md) Part 2 row 48; [Decide: the spec list](../issues/11-decide-spec-list.md) row 48 |
| Class name `NgxYetiPrint`; selector and `exportAs` keep `yeti` | ADR 0080 point 4; map, Standing rulings, Prefix |
| Selector-named input `yetiPrint`, typed `YetiPrint \| ''`, `''` and unset render nothing | ADR 0070 rule U and rule 1; map, Standing rulings, Selector-named inputs |
| Value type is Yeti's, from the generated types module | ADR 0080 point 5; ADR 0060 point 10 |
| The consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Written beside another item's directive, never hosting it | building-blocks 1.9; P6 |
| Item file as a counted link, acquired in the constructor | ADR 0060 points 2 to 6 |
| No listener, no output, no animation | manifest `js: null`; ADR 0040; ADR 0010 |
| Native platform level 1; no Aria, CDK, or Material piece | building-blocks 1.2; Part 2 row 48 |
| No ledger row | Part 2 row 48 |
| One presence attribute per item when two items share an element | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 12 |

### Usage examples

Imports name every directive the template writes (P24; map, Milestones):

```ts
import { YetiButton } from 'ngx-yeti/button';
import { NgxYetiPrint } from 'ngx-yeti/print';
import { YetiStack } from 'ngx-yeti/stack';

@Component({
  selector: 'app-article-footer',
  imports: [YetiButton, NgxYetiPrint, YetiStack],
  templateUrl: './article-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleFooter {
  readonly url = input.required<string>();
}
```

```html
<div yetiStack gap="sm">
  <p yetiPrint i18n>Printed from {{ url() }}</p>
  <button yetiButton yetiPrint="none" type="button" (click)="share()">Share this page</button>
</div>
```

A bound medium, with the type imported from the package:

```ts
import type { YetiPrint } from 'ngx-yeti';

readonly medium = signal<YetiPrint | ''>('');
```

```html
<aside [yetiPrint]="medium()">...</aside>
```

A client-rendered first instance, with the preload that keeps paper-only lines off the screen (ADR 0060 point 6):

```ts
provideYetiStyles({ preload: ['print'] })
```

What no longer compiles: `<p yetiPrint="nnone">`. What is never written: `class="print"` or `data-print="none"` inside an Angular template.

### Styles

1. **Item file and the consumer's line:** `utilities/print/print.css`, loaded by the directive as a counted link (section 13). The consumer writes nothing per item; the setup is the `setup` spec's (ADR 0060 point 11), plus `print` in the preload list where the first instance is client-rendered.
2. **Always-loaded rules relied on:** the layer statement that places `yeti.utilities` last inside `yeti` (`layers.css`, first in the consumer's global stylesheet; ADR 0060 point 7). Related but not required: `[data-paint]` keeps its colour on paper through `print-color-adjust: exact` (`Y/src/layouts/attributes.css:452-456`), owned by the `box` spec's `yetiPaint` (Part 2 row 1).
3. **Cross-item rules:** none in CSS. The utility outranks any item's `display` through layer order, which is what makes `yetiButton` beside `yetiPrint="none"` work (`print.css:26-29`); two items sharing an element each set their own presence attribute (section 3; [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), ticket 50 decision 12).
4. **Tokens:** none read, none written.
5. **What breaks without the item file:** both media show everything: paper-only lines appear on screen and screen-only controls print.
6. **Tailwind name collision:** none in the names building-blocks 1.13 lists (`container`, `grid`, `table`, `hidden`). Tailwind v4's `print:` is a variant prefix, not a `.print` utility (inferred, not measured). Usage rule 5 covers Tailwind's later `utilities` layer.

### Platform features to adopt when the target moves

None. `@media print` is long inside the target, and Yeti guards nothing for this item (manifest `support`).

### Single-page application pieces relied on

None ([fragment-links spec](fragment-links.md), [navigation-close spec](navigation-close.md), [generated-ids spec](generated-ids.md), and [events spec](events.md) each do not apply).
