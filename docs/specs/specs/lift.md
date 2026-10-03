# Spec: lift (utility)

Ticket: [Spec: lift (utility)](../issues/47-spec-lift.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, develop, 2026-09-25). Accessibility target: WCAG 2.2 AA. Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)).

The points this spec's ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 12 and 26), and each is cited where it applies.

## Problem Statement

A consumer builds an Angular page of things that can be pressed and are big enough for movement to read: a grid of cards that are links, a row of tiles that each open something. Yeti's `lift` utility gives them a hover and focus affordance: the element rises by `--yeti-lift-distance` (or grows by `--yeti-lift-scale` at `data-lift="scale"`) and its shadow deepens to `--yeti-lift-shadow`, on `:hover`, on `:focus-visible`, and on `:has(:focus-visible)`, so a keyboard user who tabs to a card's stretched link sees the same affordance a pointer gets. Under reduced motion the distance goes to zero and the scale to one, and the deeper shadow carries the hover alone. Yeti does all of it in CSS: the manifest declares one identity class, `lift`, one attribute, `data-lift` (vocabulary `lift`: `rise`, `scale`; default `rise`), five public tokens, no markers, no children, no events, and no module (`js: null`).

In an Angular application written with ngx-yeti, the consumer writes no Yeti class or `data-*` attribute ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)). Without a directive, the consumer has three problems:

- `class="lift"` and `data-lift="scale"` written by hand are unchecked: a misspelt `data-lift="scael"` compiles and silently gives the default rise, against the typed-values rule ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md));
- the `lift` item file is not loaded, because per-item loading acquires an item file only for a directive that renders ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), so a hand-written `.lift` stays flat;
- the element almost always carries another item already (`<article yetiCard>`), and the consumer needs to know how two item directives share one element, one class each, under SSR and hydration.

## Solution

The package ships one attribute directive in its `ngx-yeti/lift` entry point: selector `[yetiLift]`, class `NgxYetiLift`, `exportAs: 'yetiLift'` ([building-blocks.md](../building-blocks.md) Part 2 row 47). Its class name takes `NgxYeti` because Yeti's `yeti.d.ts` exports `YetiLift`, the `lift` vocabulary type ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 4). Its selector and `exportAs` keep `yeti`.

The directive is "types only" (building-blocks Part 2): it binds `lift` as a static host class, takes one selector-named input, `yetiLift`, typed `YetiLift | ''`, and binds it to `data-lift` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) U; [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 167). The bare selector (`<article yetiCard yetiLift>`) renders no `data-lift`, so Yeti's own default, the rise, applies; `yetiLift="scale"` renders `data-lift="scale"`. It acquires the `lift` item file when created and releases it when destroyed (ADR 0060 point 2). It declares no listener, no render callback, no service, no output, and no Injection token. Everything that moves is Yeti's CSS and the platform's pseudo-classes.

The consumer writes the directive beside the other item's directive on the same element, as Yeti writes `.card.lift` (building-blocks 1.9: two items on one element are written beside each other; no item always sits on another's element, so neither hosts the other).

## User Stories

1. As a consumer, I want to write `<article yetiCard yetiLift>`, so that a card rises and deepens its shadow on hover exactly as Yeti's `.card.lift` does.
2. As a consumer, I want the bare `yetiLift` attribute to give Yeti's default gesture, so that the common case needs no value.
3. As a consumer, I want `yetiLift="scale"` to make a tile grow instead of rise, so that a tile in a row keeps the row's line.
4. As a consumer, I want a misspelt gesture such as `yetiLift="scael"` to fail to compile, so that I never ship a silent fallback to the rise (ADR 0005).
5. As a consumer, I want to bind the gesture from a signal (`[yetiLift]="gesture()"`), so that one template can switch between rise and scale.
6. As a consumer, I want binding `''` or leaving the value unset to remove `data-lift`, so that the element returns to Yeti's default with no stale attribute (ADR 0070 rule 1).
7. As a consumer, I want the package never to write `data-lift="rise"` on its own, so that server HTML stays Yeti's minimal documented markup and follows Yeti's default if a later pin changes it (ADR 0070 rule 1).
8. As a consumer, I want to write no `class="lift"` and no `data-lift` by hand, so that the contract stays the directive's (ADR 0003).
9. As a consumer, I want the gesture's type to be Yeti's own `YetiLift`, re-exported by the package, so that I can type my own signals with it (ADR 0080 point 5).
10. As a consumer, I want the `lift` item file loaded when the first lifted element renders and removed after the last one leaves, so that a page without lifts pays nothing (ADR 0060).
11. As a consumer, I want `yetiLift` to combine with `yetiCard`, `yetiBox`, or any other item directive on the same element, so that the lift is an addition and not a replacement (building-blocks 1.9).
12. As a consumer, I want the card's own `raised` shadow and the lift's deeper shadow to cooperate, so that a raised card lifts from its resting shadow to the lift's (Yeti's `yeti.utilities` cascade layer comes after `yeti.components`).
13. As a keyboard user, I want a card to lift when I tab to the stretched link inside it, so that I see which card I am on (`:has(:focus-visible)`).
14. As a keyboard user, I want the focus ring to stay visible on the focused link while the card lifts, so that the lift never replaces the ring (WCAG 2.2 2.4.7).
15. As a user who asked for reduced motion, I want a lifted card not to move at all, so that it never jumps out from under my pointer.
16. As a user who asked for reduced motion, I want the shadow still to deepen on hover and focus, so that I still get the affordance.
17. As a pointer user, I want a grown tile to stay sharp while it scales, so that its text does not jitter (Yeti's `will-change: scale` on the scale gesture).
18. As a consumer, I want a lifted element that its own item already rotates or scales to keep that, so that the lift only adds a `translate` (Yeti uses the individual transform properties).
19. As a consumer who also tints the card on hover, I want to set only colours, so that my colour transition does not cancel Yeti's shadow transition (Yeti lists `background-color` and `border-color` in its own transition).
20. As a consumer, I want to tune distance, scale, shadow, duration, and curve with Yeti's tokens in my stylesheet, so that I theme the lift without a package input (ADR 0004).
21. As a consumer, I want the docs to tell me where a lift belongs (a card that is a link, a tile of choices, a panel that opens something) and where it does not (a button, a paragraph), so that I do not promise an action that does not exist (Yeti's lift docs, stated as a usage rule).
22. As a screen-reader user, I want the lift to add no role, name, or state, so that the accessibility tree is the same with or without it.
23. As a consumer using SSR, I want the server HTML to carry `class="lift"` and any `data-lift`, so that the first paint lifts on hover before any script runs.
24. As a consumer using prerendering, I want the same server HTML, so that a static build behaves the same.
25. As a consumer with JavaScript off, under SSR or prerendering, I want hover and focus to lift the card exactly as with JavaScript on, so that nothing is lost (ADR 0011, 2026-10-03 note).
26. As a consumer using full hydration, I want hydration to change nothing on a lifted element, so that it complies with Angular's hydration constraints.
27. As a consumer using incremental hydration, I want a lifted card inside a `hydrate on ...` block to lift before the block hydrates, so that the affordance does not wait for a trigger.
28. As a consumer using `hydrate never`, I want a lifted card to keep lifting, and the `lift` item file to stay loaded while the card is on the page (ADR 0060 point 4).
29. As a consumer using a client-only `@defer` block, I want to know that a lifted card inserted on the client needs `provideYetiStyles({ preload: ['lift'] })` for a flash-free first hover, so that I can choose it (ADR 0060 point 6).
30. As a consumer using `withI18nSupport()`, I want a lifted card holding `i18n` text to hydrate without being re-rendered, so that localised builds work (ADR 0011 clause 11).
31. As a consumer running zoneless, I want a bound `yetiLift` to update `data-lift` when its signal changes, so that the directive needs no zone.
32. As a consumer using event replay, I want to know the lift has no event to replay, so that a click before hydration is the card's link's and the platform's.
33. As a consumer using Tailwind v4, I want to know that `lift` is not a Tailwind utility name, so that no extra `@source not inline(...)` is needed (ticket 24).
34. As a consumer, I want `#lift = yetiLift` to give me the directive instance, so that I can read the bound gesture in my template.
35. As a consumer, I want to import the directive class from `ngx-yeti/lift` and list it in my component's `imports`, so that a page without lifts does not bundle it (building-blocks 1.3; P22).
36. As a consumer, I want the docs to warn that a forgotten import of `NgxYetiLift` renders a flat card with no error, so that I check my `imports` when nothing lifts (P24).
37. As a consumer writing markup outside an Angular template (`index.html`, `[innerHTML]`), I want to know I write `class="lift"` and `data-lift` myself there, as Yeti documents, so that the escape hatch is clear (ADR 0070).
38. As a consumer who needs a gesture newer than the pin, I want to bind it as `[yetiLift]="$any('new')"`, so that a static `data-lift` is not removed by the directive's unset binding (ADR 0070).
39. As a package maintainer, I want the contract check to assert that `lift`, `data-lift`, `rise`, and `scale` match the built manifest at the pin, so that a pin move that changes them fails a test (ADR 0014 point 3).
40. As a package maintainer, I want a story gate run with axe on the lift stories, so that the lift cannot introduce a WCAG 2.2 AA violation (ADR 0015).
41. As a package maintainer, I want e2e tests in three engines for hover, keyboard focus, scale, and reduced motion, so that Yeti's own measured behaviour is kept under Angular.
42. As a package maintainer, I want the class name `NgxYetiLift` checked against Yeti's exports at each pin move, so that a new collision is caught (ADR 0080 point 4).

## Implementation Decisions

### 1. Yeti contract

From the `lift` manifest at the pin (kind `utility`, group `Motion`, since `7.0.0`):

- Identity class: `lift`. No other class.
- Attributes: `data-lift`, `enum`, vocabulary `lift` (`rise`, `scale`), default `rise`: "Which gesture: rise by --yeti-lift-distance, or scale by --yeti-lift-scale, for a tile in a row where a rise would break the line."
- Markers: none. Children: none.
- Tokens, all public: `--yeti-lift-ease`, `--yeti-lift-duration`, `--yeti-lift-distance`, `--yeti-lift-scale`, `--yeti-lift-shadow`. Their defaults and their reduced-motion overrides (distance to `0rem`, scale to `1`) are declared in the always-loaded group's component tokens, not in the item file.
- `a11y`: no required attributes, no keyboard table; the note says the lift answers `:focus-visible` on the element and on anything inside it, that it is "decoration on top of a focus ring, never a replacement for one", and that under reduced motion the deeper shadow carries the hover alone.
- `support`: unguarded `individual transform properties` and `:has()`, guarded none. Both are inside Baseline 2025 (building-blocks 1.2), so the package adds no guard.
- Module and events: none (`js: null`).
- Attributes left to the consumer: none (ticket 26).

### 2. Contract mapping

| Yeti name | Kind | Angular | Type, default | Record |
| --- | --- | --- | --- | --- |
| `lift` | identity class | static host class on `[yetiLift]` (`NgxYetiLift`) | not applicable | ADR 0003 point 1; building-blocks row 47 |
| `data-lift` | attribute (U) | input `yetiLift` on `[yetiLift]`, bound as `[attr.data-lift]`; `''` and unset render no attribute | `YetiLift \| ''`; input default unset; Yeti's default `rise` applies from its CSS | ADR 0070 U and rule 1; ticket 26 row 167 |
| `data-ngx-yeti-item-lift` | the package's host attribute for the item file | static presence attribute (empty value) | not applicable | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 12 |
| `--yeti-lift-ease`, `--yeti-lift-duration`, `--yeti-lift-distance`, `--yeti-lift-scale`, `--yeti-lift-shadow` | public tokens | none: the consumer's stylesheet surface; the package writes none | Yeti's defaults | ADR 0004 |
| events | none | no output | not applicable | the events spec maps none for `lift` ([events.md](events.md)) |
| Injection tokens | none | the directive provides and reads none | not applicable | building-blocks 1.9 (no parent, no part) |
| Defaults token | none | no package-owned option exists | not applicable | building-blocks 1.4 |

The input's name, `yetiLift`, is not an HTML attribute name, so the presentational-attribute rule of building-blocks 1.4 has nothing to state. The type `YetiLift` comes from the package's generated copy of Yeti's typings at the pin and is re-exported by name from the primary entry point, never redeclared (ADR 0060 point 10; ADR 0080 point 5 and its 2026-10-02 note).

### Module replaced

None: Yeti has no `lift` module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); building-blocks row 47, "Yeti module: none").

### 3. Hierarchy and DI shape

- One item directive and nothing else: no part directive, because `lift` has no markers or children; no child directive; no coordinating parent.
- No Injection token is provided or injected; the directive injects only the item-file service of ADR 0060 to acquire and release `lift`.
- Not hosted by any other directive and hosting none: no Yeti item always sits on another's element (building-blocks Part 2, "Two findings"), so `yetiLift` is written beside `yetiCard`, `yetiBox`, `yetiCluster`'s children, or any other item directive (building-blocks 1.9; P6).
- No generated ids and no relationship attributes ([generated-ids.md](generated-ids.md) has nothing to give it).
- Two item directives on one element each bind their own static host class; Angular merges static host classes with each other and with the consumer's own `class` attribute, so `<article yetiCard yetiLift>` renders `class="card lift"`. Their inputs cannot collide: `yetiLift` is selector-named (ADR 0070, Considered options: an un-prefixed input on such a directive would receive a same-named input meant for another directive).
- Both directives on one element each write their own presence attribute, `data-ngx-yeti-item-card` and `data-ngx-yeti-item-lift`, so the two never collide ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 12).

### 4. API

`NgxYetiLift`, selector `[yetiLift]`, `exportAs: 'yetiLift'`, entry point `ngx-yeti/lift`, OnPush-safe and zoneless (it has no template; its host bindings read signals):

| Member | Kind | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `yetiLift` | `input()` | `YetiLift \| ''` | unset | `''` (the bare selector) and unset render no `data-lift`; `rise` and `scale` render it. No transform. Yeti's default is `rise` (manifest) |

Host: static class `lift`; `[attr.data-lift]` from the input, `null` for `''` and unset; the static presence attribute `data-ngx-yeti-item-lift` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). No models, no outputs, no methods, no host listeners.

Lifecycle: the constructor ends with `injectYetiItemStyles('lift')` from `ngx-yeti/styles` ([setup](setup.md); ticket 50 decisions 42 and 45), which acquires the `lift` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2).

Usage rules (building-blocks 1.10; P23; numbered for the directive's JSDoc):

1. Put `yetiLift` on something that can be pressed and is big enough for the movement to read: a card that is a link, a tile in a grid of choices, a panel that opens something. Not on a button (it already has hovered and pressed states) and not on static text, where it promises an action that does not exist (Yeti's lift docs, "When to use it").
2. Keep the focusable thing inside the lifted element, or make the element itself focusable; the lift answers focus only through `:focus-visible` and `:has(:focus-visible)`.
3. Write no static `class="lift"` or `data-lift` on an element that carries `yetiLift`; set the gesture through the input. Hydration writes a static attribute back for one pass and the unset binding removes it ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), 2026-10-03 consequence; building-blocks, "Hydration constraints").
4. A gesture newer than the pin is bound as `[yetiLift]="$any('new')"` (ADR 0070).
5. When colouring the lifted element on the same hover, set colours only; Yeti's transition already lists `background-color` and `border-color` and runs them on `--yeti-lift-duration`, and a consumer `transition` declaration on the element would replace Yeti's and stop the shadow animating (Yeti's comment in the item file).
6. Import `NgxYetiLift` in every component whose template writes `yetiLift`; a forgotten import renders a flat element with no error unless the input is bound (P24; ADR 0018).

### 5. Material comparison

| Aspect | Angular Material | ngx-yeti `lift` |
| --- | --- | --- |
| Nearest piece | No hover-lift directive or component exists. Material offers static elevation: the `mat-elevation-z<n>` classes from the `elevation-classes()` mixin (`src/material/core/_core.scss:36`, `core/style/_elevation.scss:125`, read at `708d4c6e2`), and `mat-card`'s styles have no hover rule (checked by search) | A hover and focus affordance on any element, from Yeti's CSS |
| API | a class the consumer writes, with an elevation number | a directive with one typed input, `yetiLift`, and no class written by hand (ADR 0003) |
| Focus | not applicable | Yeti answers `:focus-visible` and `:has(:focus-visible)`; the focus ring stays the reset's |
| Reduced motion | not applicable | Yeti's tokens take the movement away and keep the shadow |

So there is no Material or CDK parity feature to add, and no ledger row for parity (building-blocks row 47, "Ledger: none").

### 6. Implementation level and primitives

Native platform, level 1; types only (building-blocks row 47 and its "as row 1": Yeti's CSS does the whole job; the directive adds the class, the typed attribute, `exportAs`, and the item file). The behaviour is CSS pseudo-classes (`:hover`, `:focus-visible`, `:has()`), individual transform properties (`translate`, `scale`), `box-shadow`, `will-change`, a transition, and `prefers-reduced-motion` through Yeti's tokens, all inside Baseline 2025 (building-blocks 1.2). `@angular/aria` has no pattern for it (level 2), and CDK's `FocusMonitor` is not needed because Yeti reads `:focus-visible` itself (level 3; the same reason as building-blocks row 26). No Angular primitive beyond `input()` and host bindings.

### 7. Accessibility (WCAG 2.2 AA)

APG pattern: none. The lift is decoration; it adds no role, state, property, name, or key, and changes no focus order.

| Criterion | How it is met |
| --- | --- |
| 2.4.7 Focus Visible | The focus ring comes from Yeti's reset and the lift does not touch it (manifest `a11y` note); ticket 17 measured a ring at every Tab stop on Yeti's examples, `lift` among them ([ledger](../ledger.md) intro; research row "lift: rides on the focus ring, does not replace it"). The lift adds a second, larger cue on the card the focus is in. |
| 2.4.11 Focus Not Obscured (Minimum) | The rise is `0.125rem` by default and moves the focused element with its card; nothing covers it (inferred from the token value). |
| 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value | The directive renders only `class` and `data-lift`; the accessibility tree is unchanged (inferred; asserted in layer 1). |
| 2.2.2 Pause, Stop, Hide | Not engaged: the motion runs only while the pointer or focus is on the element and ends with it. |
| 2.3.3 Animation from Interactions (AAA, beyond the target) | Met by Yeti anyway: under `prefers-reduced-motion: reduce` the element does not move and only the shadow changes (Yeti's test, "under reduced motion the card stops moving and keeps the deeper shadow"; ticket 17 measured the transitions collapse). |
| 1.4.11 Non-text Contrast | Not engaged: the lift indicates no state a user needs to perceive; focus is shown by the ring. |

Forced colours (not a WCAG AA criterion, ticket 17): the deeper shadow is not drawn in forced-colours mode, so under forced colours with reduced motion a hover shows no change, while the focus ring remains (inferred from the CSS Color Adjust rule that forces `box-shadow` to none; not measured). The spec adds no package CSS and no ledger row for it, because the lift is decoration and the focus ring carries 2.4.7; the layer-4 forced-colours case measures that the ring remains ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 26).

Ledger rows: none (building-blocks row 47). Upstream bug relied on for a known risk: A4 (below, Rendering modes).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

- a card that rises: an `article` with `yetiCard`, `raised`, and `yetiLift`, holding a heading whose link carries `yetiCardLink` with `stretch`;
- a tile that grows: the same with `yetiLift="scale"`.

Server HTML and hydrated DOM are identical: the first renders `class="card lift"`, `data-raised`, and the host attributes of ADR 0060, with no `data-lift`; the second adds `data-lift="scale"`. That is Yeti's documented markup, `<article class="card lift" data-raised>` and `<article class="card lift" data-lift="scale" data-raised>`, plus the package's host attribute. There is no closed or open state: the lift is a hover and focus state of CSS, never written to the DOM.

### 9. Animation

Yeti's CSS only ([ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) point 1): a transition on `translate`, `scale`, `box-shadow`, `background-color`, and `border-color`, over `--yeti-lift-duration` with `--yeti-lift-ease`, toward the hover rule. The package adds no class, no inline style, no `animate.enter` or `animate.leave`, and awaits no transition. Reduced motion is Yeti's (building-blocks 1.6 rule 4): its tokens take the distance to zero and the scale to one, which is deliberately not the duration collapse used elsewhere in Yeti, because a hover has an end state that a collapsed duration would still jump to.

Cross-item motion on one element (inferred from the cascade, not measured): an `enter` arrival or an `attention` pulse animates `translate` or `scale` while it runs, and an animation's value wins over the lift's for that time; the lift resumes when the animation ends.

### 10. Rendering modes

Per [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and building-blocks 1.11:

- **Server output:** the static host class `lift`, `data-lift` when the input is `rise` or `scale`, and the ADR 0060 host attribute; the `lift` item link written into `<head>` in Yeti's order (ADR 0060 points 3 and 5).
- **Before hydration:** nothing to protect. No person and no Yeti module can change `class` or `data-lift` (ticket 26, point 12), so the lift has no Pre-hydration state; hover and focus are CSS.
- **Full hydration:** hydration writes the same static class and the same bound attribute; no node or attribute changes.
- **Event replay:** the directive declares no listener, so nothing replays. A click before hydration belongs to the card's link and the platform.
- **Incremental hydration (`hydrate on ...`):** the dehydrated card is its server HTML, and Yeti's CSS lifts it before the trigger fires. The item link stays while the host is on the page (ADR 0060 point 4).
- **`hydrate never`:** the card keeps lifting for as long as it is on the page; the item link is held by the DOM sweep of ADR 0060 point 4, which finds the host by its host attribute (when the card shares the element, each item sets its own `data-ngx-yeti-item-<item>`, [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 12).
- **Client-only `@defer`:** the directive acquires the item file when constructed; without `provideYetiStyles({ preload: ['lift'] })` the first frames have no lift rules (ADR 0060 point 6). Nothing is visible until a hover, so the gap matters only for a hover inside those frames (inferred).
- **`withI18nSupport()`:** the directive has no template; a consumer component with `i18n` text around a lifted card needs `withI18nSupport()` to hydrate without re-rendering (ADR 0011 clause 11). The fixture includes one `i18n` text (building-blocks 1.11 decision 11).
- **Zoneless:** the one dynamic binding reads an `input()` signal, which refreshes zoneless (ADR 0070 rule 4).
- **JavaScript off, under SSR and prerendering:** everything works: the class, the attribute, the item link, and every pseudo-class are in the server HTML and the CSS, so nothing is lost. A client-only application renders nothing without JavaScript and gets no promise (ADR 0011, 2026-10-03 note).
- **Known risk:** Angular's inlined critical CSS keeps only three of Yeti's nine `:root` token blocks, so until the global stylesheet arrives the component tokens, the five `--yeti-lift-*` among them, are missing (`upstream-bugs.md` A4, measured 1 to 2 frames in Firefox). A hover inside that window draws no lift (inferred). It belongs to the always-loaded group, not to this directive.

### 11. Hydration constraints

Compliant (map, Standing rulings, 2026-10-03):

- the same DOM on the server and the client: a static host class and an attribute bound from an input, with equal values on both ends;
- no direct DOM manipulation: none; the item file's link is written to `<head>`, which hydration does not claim (ticket 33 row 10);
- valid HTML and a consistent `preserveWhitespaces`: the directive has no template;
- no output branched on the platform: no platform check;
- no consumer static attribute on an attribute the directive binds: usage rule 3.

### 12. Single-page application

None. The lift does nothing on navigation and owns no fragment link. Yeti's example puts bare `#` links in its cards; a consumer who does the same under `<base href>` gets them handled by `provideYetiFragmentLinks()` ([fragment-links.md](fragment-links.md)), which this directive does not use. Navigation closing ([navigation-close.md](navigation-close.md)) does not apply: nothing opens.

### 13. Item file

The `lift` item file of kind `utilities`, one counted `<link>` per application, acquired by `NgxYetiLift` at construction and released on destroy, inserted in Yeti's order ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 2 to 4). The consumer's part is the one-time setup of the [setup](setup.md) spec: the Yeti build at the pin, the `assets` entry, the global stylesheet with the cascade-layer statement, and, for client-only `@defer`, `provideYetiStyles({ preload: ['lift'] })`. The directive acquires no other item's file: `lift` reads only tokens of the always-loaded group (ADR 0060 point 9).

## Testing Decisions

A good test asserts what the page shows: the class and `data-lift` on the host, the element's position, scale, and shadow before and after hover and focus, and the item link in `<head>`; never the directive's fields. Layers per [ADR 0014](../adr/0014-testing-stack-for-yeti.md) and building-blocks 1.12, all zoneless. Prior art: Yeti's own lift browser test at the pin (pointer rise, scale, keyboard lift, a card without the class never moves, reduced motion), which layers 1 and 4 port.

### 1. Story play functions

`npx nx test-storybook <lib>`; every story loads the always-loaded group globally and the `lift` item file through the directive, with axe through the story gate on the six tags (ADR 0015).

- `lift--default`: three cards in a cluster, as Yeti's example: a rise card, a second rise card, and a scale card, each with a stretched link. Play: the hosts carry `lift`; the first two have no `data-lift`; the third has `data-lift="scale"`; hover the first and assert its bounding top decreased and its `box-shadow` changed; hover the third and assert `scale` is Yeti's `--yeti-lift-scale` value read from computed style (never a hard-coded `1.02`, ADR 0015 point 3's rule on token defaults) and `translate` is `none`; the accessibility tree has the same roles and names as the same markup without `yetiLift`.
- `lift--keyboard`: Tab to the first stretched link; the link is focused, its focus ring is drawn (`outline-style` not `none`), and the card's `translate` is not `none`.
- `lift--bound`: a control switches a signal bound to `[yetiLift]` between `''`, `rise`, and `scale`; assert `data-lift` is absent, `rise`, then `scale`, then absent again.
- `lift--without`: a card without `yetiLift` beside a lifted one; hovering it does not move it.

### 2. Browser-level tests

`npx nx test <lib>`, Vitest browser mode. The directive alone is created with `TestBed.createDirective(NgxYetiLift, { tagName: 'article', bindings })` (map, Standing rulings, 2026-10-03; ADR 0014's note):

- no binding, and a binding of `''`: the host has class `lift` and no `data-lift`;
- bindings of `rise` and `scale`: `data-lift` equals the value; changing the bound signal updates it after `whenStable()`, zoneless;
- `exportAs` is `yetiLift` (a test host reads it through a template reference);
- the host carries the presence attribute `data-ngx-yeti-item-lift` (ADR 0045), and the item-file service holds one `lift` link while the directive lives and none after destroy (its count read through the DOM: `link[data-ngx-yeti-styles="lift"]` in `<head>`);
- a test host with `article[yetiCard][yetiLift]` (two directives need a host): `class` contains both `card` and `lift`; both item links are acquired; destroying the host releases both. The host carries both `data-ngx-yeti-item-card` and `data-ngx-yeti-item-lift` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)).

### 3. Node-level tests

`lift.ssr.spec.ts` through the shared `renderServer()` helper with `provideClientHydration()` and `withI18nSupport()`, a fixture with one `i18n` text: a rise card and a scale card. `whenStable()` resolves; the server HTML has `class="card lift"` on both, no `data-lift` on the first, `data-lift="scale"` on the second, the host attributes of ADR 0060, the `lift` and `card` item links in `<head>` in Yeti's order, and no `jsaction` on the hosts (no listener to replay).

The contract check (ADR 0014 point 3) covers `lift`: identity class `lift`, attribute `data-lift` mapped to `yetiLift`, and the union `YetiLift` equal to the manifest's `rise` and `scale`.

### 4. Playwright e2e

Storybook half (`npx nx e2e <lib>-e2e`, on the story ids above, Chromium, Firefox, and WebKit in CI): real hover on `lift--default`; real Tab on `lift--keyboard`, skipped in WebKit as Yeti's own test skips it (headless WebKit does not move focus on Tab); `emulateMedia({ reducedMotion: 'reduce' })`: the hovered card's top stays put (within one decimal) and `translate` is `none`, `0px`, or `0px 0px`, while `box-shadow` still changes; `emulateMedia({ forcedColors: 'active' })`: the focused link still has a visible outline (the recorded forced-colours reading, measured here).

Fixture app half (`npx nx e2e <fixture-app>-e2e`; the `lift` route under both `RenderMode.Prerender` and `RenderMode.Server`, ticket 50 decision 2): hydration without `NG05xx` and `componentsSkippedHydration === 0`; 0 attribute mutations on the hosts at hydration; with JavaScript disabled, hover lifts the card and axe passes; a lifted card in a `hydrate never` block keeps the `lift` link and lifts on hover after the other lifted cards have left the page; a lifted card in a client-only `@defer` block with and without `preload: ['lift']`, recording the unstyled frames (ADR 0060 point 6).

## Out of Scope

- Any input per token (`distance`, `scale`, `shadow`, `duration`, `ease`): the tokens are the consumer's stylesheet surface (ADR 0004).
- Hosting `yetiLift` from `yetiCard` or any other item, or a `lift` input on the card: no item always carries the lift (building-blocks 1.9 and Part 2).
- A JavaScript hover or focus listener, `FocusMonitor`, or a `reducedMotion()` signal: Yeti's CSS does it (building-blocks 1.6 rule 4; 1.2).
- Package CSS for forced colours on the lift (ticket 50 decision 26).
- Checks of misuse (a lift on a button or a paragraph, a static `data-lift`): later milestone; stated as usage rules (map, Inherited preferences, Milestones).
- `deployUrl` for the item link: unsupported (map, Standing rulings).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiLift]`, types only, native level 1 | building-blocks row 47; ADR 0003 |
| Class `NgxYetiLift`; selector and `exportAs` keep `yeti` | ADR 0080 point 4 |
| Selector-named input `yetiLift`, `YetiLift \| ''`, `''` renders nothing | ADR 0070 U; ticket 26 row 167; the user's "Selector name (Recommended)" (map, Standing rulings) |
| Unset renders no attribute; Yeti's default applies | ADR 0070 rule 1 |
| `YetiLift` from the package's generated copy of Yeti's typings, re-exported | ADR 0060 point 10; ADR 0080 point 5 |
| Written beside another item's directive, never hosted | building-blocks 1.9, Part 2 "Two findings" |
| Tokens are the consumer's; the package writes none | ADR 0004 |
| No module, no events, no outputs | manifest `js: null`; ADR 0040 |
| Item file as a counted link, acquired at construction | ADR 0060 |
| One presence attribute per item on a two-item element | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 12 |
| No ledger row; forced-colours reading recorded here | building-blocks row 47; ticket 50 decision 26 |
| `injectYetiItemStyles('lift')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |

### Usage examples

- A grid of linked cards: a `yetiGrid` holding `article` elements, each with `yetiCard`, `raised`, and the bare `yetiLift`, and a heading link with `yetiCardLink` and `stretch` (or a `routerLink` on that link).
- A row of choice tiles: each tile with `yetiLift="scale"`.
- A switchable gesture: `[yetiLift]="compact() ? 'scale' : 'rise'"`, with the signal typed from the re-exported `YetiLift`.
- Theming: a `:root` block in the consumer's stylesheet setting `--yeti-lift-distance` and `--yeti-lift-shadow`, or a derived block on one section to tune only its cards (ADR 0004; Yeti's theming guide).
- Importing: the component's `imports` list `NgxYetiLift` from `ngx-yeti/lift` beside `YetiCard` and `YetiCardLink` from `ngx-yeti/card`.

### Styles

1. Item file: the `lift` item file (kind `utilities`), one counted link (ADR 0060); the consumer's one line is the `setup` spec's, plus an optional `preload: ['lift']` for client-only `@defer`.
2. Always-loaded rules it relies on: the five `--yeti-lift-*` tokens and their reduced-motion overrides, `--yeti-shadow-md`, `--yeti-duration-fast`, and `--yeti-ease` (component tokens of the always-loaded group), and the reset's focus ring.
3. Cross-item rules: on a `card` with `raised`, the card's resting `--yeti-shadow-sm` gives way to the lift's shadow on hover, because `yeti.utilities` comes after `yeti.components`; an `enter` or `attention` animation on the same element wins over the lift while it runs (section 9, inferred).
4. Tokens read: the five above; written: none.
5. Without the item file: the element never moves or deepens its shadow; nothing else changes.
6. Tailwind: `lift` is not one of the four Yeti names Tailwind generates (`container`, `grid`, `table`, `hidden`; ticket 24), so no collision.

### Single-page-application pieces it relies on

None. It uses no generated id, no output, no fragment link, and no navigation closing.

### Platform features to adopt when the browser target moves

None. Every feature the lift uses is inside Baseline 2025, and Yeti guards nothing for it (manifest `support.guarded` is empty).
