# Spec: enter (utility)

Ticket: [Spec: enter (utility)](../issues/45-spec-enter.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, develop, 2026-09-25). Accessibility target: WCAG 2.2 AA. Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)).

The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 12 and 19 to 22), and each is cited where it applies. `Y/` is `github.com/foundation/yeti/` at the pin.

## Problem Statement

A consumer wants Yeti's `enter` utility in an Angular application: one arrival, a fade, rise, fall, slide, or growth, played on load, as the element scrolls into view (`data-view`), or once as it first nears the viewport (`data-once`), for the element itself or for each of its children in turn (`data-stagger`). Yeti does almost all of it in CSS (`Y/src/utilities/enter/enter.css`), and an element whose animation never runs is visible, not stranded (`enter/manifest.json` `a11y.notes`).

The one part that needs script is `data-once`. Yeti's `enter.js` holds a single `IntersectionObserver` and removes `data-once` the first time an element nears the viewport (`Y/src/utilities/enter/enter.js:23-31`). In an Angular application that module fails in three measured ways:

- it scans the document once at load, before Angular bootstraps, so it misses even the first route, and every `@if`, `@defer`, and route change after it; a `.enter[data-once]` that Angular renders never arrives ([Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), three engines; [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md));
- when it removes `data-once` from server-rendered markup before hydration, hydration writes the static attribute back, so the arrival never plays; whether the module or hydration wins varies between runs and engines (ticket 18, "the `data-once` race");
- `animate.enter` is no substitute, because it fires on insertion, not on viewport entry ([ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) point 4).

The consumer also must not write Yeti's class or `data-*` attributes by hand ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)), and wants a misspelt arrival to fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)).

## Solution

The package ships one item directive in the `ngx-yeti/enter` entry point: selector `[yetiEnter]`, class `NgxYetiEnter` (the name `YetiEnter` collides with the vocabulary type Yeti's `yeti.d.ts` exports, [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 4), `exportAs: 'yetiEnter'`. It binds the identity class `enter` and sets Yeti's five attributes from typed inputs: `yetiEnter` (selector-named, the arrival), `side`, `stagger`, `view`, and `once` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rules U and R; [building-blocks.md](../building-blocks.md) Part 2 row 45).

`data-once` is the only Angular-owned state in the whole package (ADR 0070 rule S; [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md), "Angular-owned state"). The directive renders it from a `computed` of the `once` input and a private `arrived` signal. Its own `IntersectionObserver`, created per instance in `afterNextRender` with `enter.js`'s `rootMargin` of `'0px 0px 10% 0px'`, sets `arrived` the first time the host nears the viewport, which removes the attribute; Yeti's CSS then plays the arrival exactly as it would after `enter.js`. The observer is disconnected after the arrival and on destroy. So the server HTML and a page with JavaScript off carry `data-once` and the element sits still and visible, which is Yeti's no-script state; hydration finds a binding, not a static attribute, and restores nothing; and an `enter` that Angular renders later arrives, which `enter.js` never did.

Everything else is Yeti's CSS: the five arrivals, logical sides through `:dir()`, the stagger's eight steps and floor, the scroll-driven `data-view` form behind Yeti's `@supports` and reduced-motion guards, and the collapse under reduced motion. The directive adds no class, no inline style, no `animate.enter`, no output, and no ledger row: it is a like-for-like replacement of `enter.js` (building-blocks row 45, Ledger "none (like-for-like)"; [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), Consequences).

## User Stories

1. As a consumer, I want to write `<p yetiEnter>` and get Yeti's default fade, so that I never write `class="enter"` myself.
2. As a consumer, I want `<p yetiEnter="rise">`, so that I pick an arrival with one attribute instead of two.
3. As a consumer, I want `yetiEnter="rsie"` to fail to compile, so that a misspelt arrival is caught before it ships.
4. As a consumer, I want the arrival's type to be Yeti's own `YetiEnter` vocabulary type, so that a value Yeti adds at a pin move becomes available without the package redeclaring it.
5. As a consumer, I want `side="end"` with `yetiEnter="slide"`, so that the slide comes from the end edge.
6. As a consumer of a right-to-left page, I want the slide's start edge to follow the page direction with no extra input, so that my markup does not need to know the direction.
7. As a consumer, I want `stagger` on a list or grid, so that its children arrive one after another instead of the element itself.
8. As a consumer, I want a stagger of thirty children to stop growing after the ninth, so that the last card does not wait ten seconds.
9. As a consumer, I want `view`, so that the arrival follows the element across the scrollport where the browser supports it.
10. As a consumer whose readers use Firefox 145, I want `view` to fall back to the load arrival, so that nobody sees an element left invisible.
11. As a consumer, I want `once`, so that a section below the fold arrives the first time it nears the viewport and never replays when the reader scrolls away and back.
12. As a consumer, I want `once` to work on content rendered by `@if`, `@for`, a client `@defer` block, or a route change, so that the arrival is not limited to the first document.
13. As a consumer using SSR or prerendering, I want a `once` element that the user scrolls to after hydration to arrive, so that hydration does not cancel it.
14. As a reader with JavaScript off, I want every `enter` element present and readable, so that a failed script never hides content.
15. As a reader who asked for less motion, I want every arrival, delay, and stagger step to collapse and the scroll-driven form to be switched off, so that content is simply present.
16. As a screen reader user, I want reading order, focus order, and roles unchanged by the arrival, so that the effect is purely visual.
17. As a keyboard user, I want focus to land on a control inside an arriving element without waiting for the animation, so that motion never blocks interaction.
18. As a consumer, I want `stagger`, `view`, and `once` as bare boolean attributes, so that `<ul yetiEnter="rise" stagger once>` reads like Yeti's markup.
19. As a consumer, I want an input I leave unset to render nothing, so that Yeti's own default applies and the server HTML stays Yeti's minimal markup.
20. As a consumer, I want `yetiEnter` beside a layout directive on one element (`<ul yetiGrid yetiEnter="rise" stagger>`), so that I can stagger a grid's cards as Yeti's docs show.
21. As a consumer, I want `yetiEnter` and `yetiMedia` on one element to share one `side` input, so that the one `data-side` attribute Yeti declares for both is set once.
22. As a consumer, I want to time one element with `--yeti-enter-delay` on it, so that a legend's rows land in time with something else on the page, as Yeti's docs describe.
23. As a consumer, I want to set Yeti's six `enter` tokens in my own stylesheet, so that theming stays Yeti's.
24. As a consumer, I want `enter`'s item file loaded when the first `enter` renders and unloaded after the last, so that pages without it do not pay for it.
25. As a consumer who inserts an `enter` with a client-only `@defer` block, I want to preload its item file, so that the arrival is not started late by a stylesheet fetch.
26. As a consumer, I want the directive to work zoneless, so that the attribute removal refreshes the view without zone.js.
27. As a consumer, I want the directive to work inside a `@defer (hydrate on viewport)` block, so that a below-the-fold section can stay dehydrated until the reader reaches it and then arrive.
28. As a consumer with a `hydrate never` block, I want an `enter` inside it to stay visible and still, so that the residue is Yeti's no-script state.
29. As a consumer using `withI18nSupport()`, I want translated content inside an `enter` element to hydrate without being re-rendered, so that the arrival is not repeated.
30. As a consumer, I want no listener, observer, or attribute left behind when the element is destroyed, so that route changes do not leak.
31. As a consumer, I want an `exportAs` name, so that a template reference can read the directive's inputs like every other directive's.
32. As a maintainer, I want the contract check to fail if a pin move renames an `enter` attribute or removes a value, so that the directive never renders something Yeti's manifest does not declare.
33. As a maintainer, I want every behaviour of `enter.js` listed as kept, changed, or removed, so that the replacement can be checked against the pin.
34. As a maintainer, I want the hydration restore that ticket 18 measured covered by an e2e test, so that a regression to a static `data-once` is caught.
35. As a maintainer, I want tests that read the DOM and computed styles, not the directive's fields, so that refactoring does not break them.

## Implementation Decisions

### 1. Yeti contract

From `Y/src/utilities/enter/manifest.json` at the pin ([Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](../issues/02-research-yeti-inventory.md), `research/yeti-inventory.md` row `enter`):

- Kind `utility`, group "Motion", class `enter`, `classes` empty, `children` empty, no markers.
- Attributes: `data-enter` (enum, vocabulary `enter`: `fade`, `rise`, `fall`, `slide`, `scale`; default `fade`), `data-side` (enum, vocabulary `side`: `start`, `end`; default `start`), `data-stagger` (boolean), `data-view` (boolean), `data-once` (boolean). Vocabularies at `Y/schema/vocabulary.json:10` and `:43`.
- Tokens, all public: `--yeti-enter-ease`, `--yeti-enter-delay`, `--yeti-enter-duration`, `--yeti-enter-distance`, `--yeti-enter-scale`, `--yeti-enter-stagger`.
- `a11y`: no required attributes, no keyboard; "Purely visual, and safe by default"; reduced motion collapses duration and stagger, and switches the scroll-driven form off.
- `js`: `enter.js`, optional, `events` empty. Yeti's `enter` dispatches no Event.
- `support`: unguarded `individual transform properties`, `:dir()`, `IntersectionObserver` (all inside Baseline 2025, building-blocks 1.2); guarded `animation-timeline: view()`.

Attributes left to the consumer: none of Yeti's. The consumer's own attributes on the host stay theirs (`role="list"` on a `ul`, as Yeti's example writes it; ticket 26).

### 2. Contract mapping

| Yeti name | Kind | Angular side | Type and default | Static form | Record |
| --- | --- | --- | --- | --- | --- |
| `enter` | Identity class | static host class on `NgxYetiEnter` | always | n/a | ADR 0003 point 1 |
| `data-enter` | Attribute | `yetiEnter` input (selector-named) | `YetiEnter \| ''`; `''` (the bare selector) renders no attribute, so Yeti's `fade` applies | `yetiEnter` is not an HTML attribute; no kind needed | ADR 0070 rule U; ticket 26 row 162 |
| `data-side` | Attribute | `side` input | `YetiSide`; unset renders nothing (Yeti's `start`) | not an HTML attribute | ADR 0070 rule R; ticket 26 row 163 |
| `data-stagger` | Attribute | `stagger` input | `boolean`, `booleanAttribute`, default `false`; `true` renders `data-stagger=""`, `false` nothing | not an HTML attribute | ticket 26 row 164 |
| `data-view` | Attribute | `view` input | `boolean`, `booleanAttribute`, default `false` | not an HTML attribute | ticket 26 row 165 |
| `data-once` | Attribute, Angular-owned state | `once` input plus the private `arrived` signal; bound as `[attr.data-once]` from a `computed`: `''` while `once()` is true and `arrived()` is false, otherwise nothing | `boolean`, `booleanAttribute`, default `false` | not an HTML attribute | ADR 0070 rule S; ticket 26 row 166 |
| `data-ngx-yeti-item-enter` | the package's host attribute | static presence attribute (empty value); the directive acquires the `enter` item file in its constructor and releases it on destroy. On an element shared with another item directive (`grid`, `cluster`, `media`) each directive writes its own presence attribute, so they never collide ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 12) | always | n/a | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 2 |
| Events | none | no output: `js[0].events` is empty | | | ticket 26, "Angular-owned state"; [events spec](events.md) |
| `--yeti-enter-*` (six Tokens) | Token | none; the consumer's stylesheet | | | [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) |
| Injection tokens | none | the directive provides and reads none | | | building-blocks 1.9 |
| Defaults token | none | no package-owned option to default | | | building-blocks 1.4 |

`YetiEnter` and `YetiSide` come from the package's generated copy of Yeti's types at the pin, re-exported by name from the primary entry point (ADR 0060 point 10; ADR 0080 point 5). A static `yetiEnter="rise"` type-checks as the literal `'rise'` (ADR 0070 rule 2).

#### Module replaced: `enter.js`

| `enter.js` behaviour (`Y/src/utilities/enter/enter.js`) | In the package | Record |
| --- | --- | --- |
| One `IntersectionObserver` for every `.enter[data-once]` in the document (`:23`, `:31`) | Changed: one observer per directive instance | building-blocks row 45 and 1.15; ADR 0040 |
| Scans once at load; elements added later are not picked up (`:20-22`, `:31`) | Changed: each instance sets itself up when created, in any rendering mode, including `@if`, `@for`, client `@defer`, and routes | ADR 0040; ADR 0011 clause 5 |
| `rootMargin: '0px 0px 10% 0px'` (`:29`) | Kept | ticket 26 row 166 |
| First intersecting entry: `removeAttribute('data-once')` (`:26`) | Changed: the observer sets the `arrived` signal, and the host binding removes the attribute | ADR 0070 rule S |
| `unobserve` after the first arrival; nothing puts the attribute back (`:27`) | Kept: the observer is disconnected after the arrival, and `arrived` never returns to `false` | ticket 26; Yeti's no-replay design (`enter/docs.md`) |
| No teardown | Added: disconnected on destroy | building-blocks 1.9 and 1.15 |
| Runs before hydration on server-rendered markup | Removed: nothing changes `data-once` before hydration, because the consumer loads no Yeti module beside the package | ADR 0040; ticket 33 row 16 |

### 3. Hierarchy and DI shape

- One item directive, no part directives, no child directive: `enter` declares no markers and no `children` (ADR 0070 rules R, U, S).
- No parent token, no Injection token of its own, no service. The observer is per instance, so no state is shared between instances (building-blocks 1.5).
- Injects `ElementRef` (the observer's target), `DestroyRef` (teardown), and the package's style loader for the item file, through `injectYetiItemStyles('enter')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 42 and 45), which releases it through `DestroyRef` (ADR 0060 point 2). No generated ids, so nothing from the [generated-ids spec](generated-ids.md); no relationship attributes.
- Not hosted by any other item and hosts none (building-blocks Part 2, "no Yeti item always sits on another item's element"). On one element it composes by being written beside a layout directive (`yetiGrid`, `yetiCluster`, `yetiStack`) or `yetiMedia`.
- Shared input name: `side` is also declared by `yetiMedia`, `yetiSidebar`, `yetiHero`, and `yetiDropdown`, all typed `YetiSide` (ticket 26 rows 56, 74, 83, 115, 163), so two of them on one element receive one value of one type, and both bind the one `data-side` Yeti declares for both (building-blocks 1.4, "Shared vocabularies"; ADR 0070, considered option on defaults).

### 4. API

`NgxYetiEnter`, selector `[yetiEnter]`, `exportAs: 'yetiEnter'`, entry point `ngx-yeti/enter`, OnPush-safe, zoneless-safe.

| Member | Kind | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `yetiEnter` | `input()` | `YetiEnter \| ''` | `''` | the arrival; `''` renders no `data-enter` |
| `side` | `input()` | `YetiSide \| undefined` | `undefined` | renders `data-side` when set; only `slide` reads it (`enter.css:36-43`) |
| `stagger` | `input()` with `booleanAttribute` | `boolean` | `false` | |
| `view` | `input()` with `booleanAttribute` | `boolean` | `false` | |
| `once` | `input()` with `booleanAttribute` | `boolean` | `false` | |
| `arrived` | private signal (`#arrived`) | `boolean` | `false` | not public API; `exportAs` exposes the inputs only ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 19) |

No `model()`, no outputs, no public methods. Behaviour:

1. **Construction** (server and client): acquire the `enter` item file through `injectYetiItemStyles('enter')`, the constructor's last statement ([setup](setup.md); ticket 50 decisions 42 and 45); nothing else. No DOM access, no observer (building-blocks 1.11 decision 3).
2. **First client render** (`afterNextRender`): if `once()` is true and `arrived()` is false, create one `IntersectionObserver` with `rootMargin: '0px 0px 10% 0px'` and observe the host. Under zone.js it starts outside the Angular zone ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 4).
3. **First intersecting entry:** set `arrived` to `true`, then disconnect the observer. The `computed` turns `data-once` off, the host binding removes it, and Yeti's CSS starts the arrival as a new animation (`enter.css:103-114`).
4. **Changes to `once` after the first client render** ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 20): the arrival is one-way; once `arrived` is true, no later value of `once` renders `data-once` again. A `once` that is `false` at the first client render is treated as already arrived, because the element has played its load arrival, so a later `true` renders nothing and creates no observer.
5. **Destroy:** disconnect the observer if it exists; release the item file (ADR 0060 point 2; building-blocks 1.9).

### 5. Material comparison

Material has no entrance-animation directive, and building-blocks row 45 names no Aria or CDK building block. The nearest Angular piece is the framework's own `animate.enter`:

| Aspect | Angular `animate.enter` (class form) | `yetiEnter` |
| --- | --- | --- |
| When it plays | on insertion of the element, and at hydration of a server-rendered element (building-blocks 1.6 point 3) | on first paint from Yeti's CSS; with `once`, when the host first nears the viewport; with `view`, along the scrollport |
| Server-rendered persistent element | never used: it would replay at hydration ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 12) | safe: the CSS arrival runs on the server HTML, and `data-once` is a binding hydration leaves alone |
| The class | removed after one frame (ADR 0060 point 6) | the identity class `enter` stays |
| Reduced motion | whatever the named class does | Yeti's tokens collapse it (`Y/src/tokens/components.css:183-189`) |

The directive itself uses no `animate.enter` (ADR 0010 point 4; building-blocks row 45). A consumer writes `yetiEnter` on an element it inserts, which already plays on insertion, and never writes `animate.enter="enter"` beside `yetiEnter` on one element; building-blocks 1.6 point 2's allowance stays for package host bindings ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 22).

### 6. Implementation level and primitives

Native platform, level 1: CSS animations and `IntersectionObserver`, both inside Baseline 2025 (building-blocks 1.2). Aria has no pattern for motion, CDK has no viewport observer the package uses, and Material has no counterpart. The directive exists because the module is one observer that misses Angular-rendered DOM (ticket 20, measured) and races hydration (ticket 18, measured) (building-blocks row 45, "Why this level").

### 7. ARIA and keyboard

No APG pattern applies: `enter` has no role, no state, and no keyboard (manifest `a11y`). The directive renders no ARIA and no `tabindex`, adds no key handler, and moves no focus. Hidden content: during the backwards-filled first frame an element is transparent but stays in the accessibility tree and in focus order; `enter` never uses `hidden`, `inert`, or `aria-hidden` (manifest `a11y.notes`; building-blocks 1.10).

#### Accessibility (WCAG 2.2 AA)

| Criterion | How it is met | Source |
| --- | --- | --- |
| 1.3.2 Meaningful Sequence, 2.4.3 Focus Order | Reading and focus order are the source order; the arrival changes neither | manifest `a11y.notes`; `enter/docs.md` Accessibility |
| 2.2.2 Pause, Stop, Hide | Each arrival plays once and ends; at Yeti's defaults the longest is the stagger floor, 8 x 200 ms of delay plus 600 ms of duration, 2.2 s, under the criterion's five seconds; `view` is paced by the reader's own scrolling | `Y/src/tokens/components.css:125-139`, `enter.css:54` (read); the five-second reading is this spec's (inferred) |
| 2.3.1 Three Flashes or Below Threshold | No flashing: opacity and transform from one `from` keyframe | `enter.css` keyframes (read) |
| 1.4.10 Reflow, 1.4.4 Resize Text | The arrival uses `translate` and `scale`, which do not change layout; the element ends where the layout put it | `enter.css` keyframes; Yeti's test "a risen element ends exactly where the layout put it" (read) |
| 1.4.3, 1.4.11 Contrast | The end state is the element's own computed style, so contrast is the content's | `enter.css` header comment (read) |
| 2.3.3 Animation from Interactions (AAA, beyond the target) | Met anyway by Yeti: under `prefers-reduced-motion: reduce` duration, stagger, and delay collapse and `view` is switched off | ticket 17: "With `reducedMotion: 'reduce'` every animation and transition measured collapsed", enter among them (measured) |
| 4.1.2 Name, Role, Value | Nothing rendered that has a name, role, or value | |

Yeti's `enter` example passes axe with the WCAG 2.2 AA tags in three engines; the Nu checker's only note is the consumer's `role="list"` (ticket 17, measured). Ledger rows: none. The directive replaces `enter.js` like for like and adds nothing Yeti's module did not do, so it adds no row ([ledger.md](../ledger.md) format; ADR 0040, Consequences; building-blocks row 45).

### 8. Rendered HTML

Consumer markup (a staggered grid of cards that arrives once):

`<ul yetiGrid min="xs" yetiEnter="rise" stagger once role="list">` with `<li yetiCard>` children.

Server HTML and first paint, also the JavaScript-off page:

`<ul class="grid enter" data-min="xs" data-enter="rise" data-stagger="" data-once="" role="list" data-ngx-yeti-item-grid="" data-ngx-yeti-item-enter="">`, one presence attribute per item ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), plus the item links for `grid`, `card`, and `enter` in `<head>` (ADR 0060 points 2 and 5). Yeti's `.enter[data-once][data-stagger] > *` rule gives the children `animation: none`, so they are present and still.

After hydration, unchanged until the list first nears the viewport. Then `data-once` is gone, and each child plays `yeti-enter-rise`, a step behind the one before. Scrolling away and back changes nothing.

`<p yetiEnter>` renders `<p class="enter" data-ngx-yeti-item-enter="">` and fades on first paint. `<p yetiEnter="slide" side="end">` renders `data-enter="slide" data-side="end"`.

### 9. Animation

All of it is Yeti's CSS on the identity class and attributes (ADR 0010 point 1; building-blocks 1.6 point 1): one animation per element or per child, `backwards` fill, ending where the layout put the element. The directive adds no class, no inline style, and no timer, and waits for no `animationend`: no completion output exists, because Yeti declares no event. It uses no `animate.enter` (ADR 0010 point 4). Reduced motion is Yeti's (building-blocks 1.6 point 4). `--yeti-enter-delay` set inline on one element is honoured and zeroed under reduced motion by Yeti (`enter.css:23-25`).

### 10. Item file

`enter`'s item file is the `utilities/enter/enter.css` file of the consumer's Yeti build, in cascade layer `yeti.utilities` ([Research: Yeti's cascade layers and stylesheet order](../issues/23-research-yeti-layers-and-import-order.md)). The directive sets `data-ngx-yeti-item-enter` on its host ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) and acquires the file through `injectYetiItemStyles('enter')`, the last statement of its constructor, on the server too ([setup](setup.md); ticket 50 decisions 42 and 45); the root style service writes one counted `<link>`, in Yeti's order, and removes it after the last host leaves the DOM (ADR 0060 points 2 to 5). The consumer's one line is the [setup](setup.md) spec's global setup; for a client-only insertion the consumer adds `enter` to `provideYetiStyles({ preload: [...] })` (ADR 0060 point 6; building-blocks row 45). The package's accessibility stylesheet has no `enter` rule.

### 11. Rendering modes

Per [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and building-blocks 1.11:

- **Server output:** the class, the attributes from bound inputs, `data-once=""` when `once` is true, the item link in `<head>`, and the host attribute of ADR 0060. No `jsaction`: the directive has no listeners. No observer, no DOM access.
- **Prerendering:** the same HTML; nothing reads request tokens (building-blocks 1.11 decision 10).
- **JavaScript off, under SSR and prerendering:** every `enter` element is present and readable. An element without `once` plays its arrival from CSS on first paint (inferred from `enter.css`; ticket 18 probed only the `once` element). A `once` element stays still and visible forever (ticket 18, measured: "element visible, no arrival"). What is lost: only the `once` arrival. A client-only application promises nothing (ADR 0011, 2026-10-03 note).
- **Before hydration:** nothing changes `data-once`: the consumer loads no Yeti module (ADR 0040), and no person can change a `data-*` attribute (ADR 0070 rule S). The element is visible and still.
- **Full hydration:** hydration claims the host, and the binding's first client pass writes the same `data-once` it found, so nothing visible changes; the observer starts after the first render, and the arrival plays when the host nears the viewport ([Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) row 16, "complies"). A `once` element already near the viewport when the app hydrates arrives right after hydration, as it would after `enter.js` ran at load, but later; this spec keeps that like-for-like behaviour, with the usage rule that `once` is for content that starts below the fold, and layer 4 records the delay ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 21).
- **Incremental hydration:** inside a `@defer (hydrate on ...)` block that has not hydrated, the host is its dehydrated state: still and visible, holding its item link (ADR 0060 point 4). With `hydrate on viewport`, the block hydrates as it comes into view, and the observer then reports the host near the viewport, so it arrives at once (inferred).
- **`hydrate never`:** the directive never runs; a `once` element stays still and visible, Yeti's no-script state, and its item link stays while the host is on the page (ticket 26; ADR 0060 point 4).
- **Client-only `@defer`, `@if`, `@for`, routes:** the directive is created with the element and sets itself up, so a `once` element arrives (fixes the failures of tickets 18 and 20). An element without `once` plays its arrival on insertion from CSS (ticket 18, measured: "A static `.enter` inserted by `@if` animated by itself"). The item file must be present before insertion: by a server-rendered instance holding the link, or by the preload list; without it the fetch can start the arrival late (ADR 0060 point 6; [Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md), inferred).
- **Event replay:** nothing to replay; the directive declares no listener, and `animation*` events are not replayed (building-blocks 1.11).
- **`withI18nSupport()`:** the directive has no template; `i18n` content inside the host hydrates with the application's `withI18nSupport()` instead of being re-rendered, which would replay a load arrival (ADR 0011 clause 11).
- **Zoneless:** the observer writes the `arrived` signal and the host binding reads it, the form ticket 18 measured refreshing zoneless (ADR 0070 rule 4; standing ruling 43).
- **Hydration boundary:** one element; a staggered host's children belong in the same template as the host, which a consumer's `@defer` around the whole element keeps (building-blocks 1.11 decision 6).

### 12. Hydration constraints

Compliant (map, Standing rulings, 2026-10-03; ticket 33 row 16):

- **The same DOM on the server and the client:** every attribute is a host binding on signal state, equal on both sides at hydration; the only later change is the removal of `data-once` from a binding after the first render.
- **No direct DOM manipulation:** the directive writes no attribute itself; the observer only sets a signal.
- **Valid HTML and a consistent `preserveWhitespaces`:** no template of its own.
- **No output branched on the platform:** no platform check; the observer exists only because `afterNextRender` runs only in the browser.
- **State set before hydration is not undone:** the one state, `data-once`, is changed by no one before hydration (ADR 0040; ADR 0070 rule S). The open-state ruling ("Never bind; read once", map, Standing rulings) concerns `open` on `details` and `dialog` and does not apply: `enter` has no `open`.
- **Usage rules that keep it so:** the consumer writes no static `class="enter"` and no static `data-enter`, `data-side`, `data-stagger`, `data-view`, or `data-once` on a host (ADR 0070, 2026-10-03 note; building-blocks "Hydration constraints"), and loads no `enter.js` beside the package (ADR 0040); loading it would bring back ticket 18's race.

### 13. Single-page application

None of navigation's: an `enter` element in a new route is set up by its own directive and arrives (ADR 0040; building-blocks 1.15). An element in a destroyed route disconnects its observer. No fragment links, so nothing from the [fragment-links spec](fragment-links.md); nothing opens, so nothing from the [navigation-close spec](navigation-close.md).

## Testing Decisions

A good test checks what a reader or a consumer sees: the class and attributes on the host, whether `data-once` is present, the computed `animation-name`, `animation-delay`, and `opacity`, and how many times `animationstart` fired. It does not read the directive's fields. Layers per [ADR 0014](../adr/0014-testing-stack-for-yeti.md) and building-blocks 1.12; all run zoneless. Yeti's own `Y/test/browser/utilities/enter.spec.js` is prior art for the CSS cases.

### Test layer 1: story play functions

Story ids (building-blocks 1.3): `enter--default`, `enter--arrivals`, `enter--stagger`, `enter--view`, `enter--once`, `enter--once-stagger`, `enter--inserted`. Every story loads the always-loaded group and the `enter` item file as a consumer would, and runs the Story gate with the six axe tags.

- `enter--default`: `<p yetiEnter>` has class `enter`, no `data-enter`, and `animation-name` `yeti-enter-fade`.
- `enter--arrivals`: one host per value of the `enter` vocabulary, plus `side="end"` and a slide inside `dir="rtl"`; asserts each `animation-name` (`yeti-enter-slide-end` for both the end side and the RTL start).
- `enter--stagger`: eleven children; the host has no animation, and the children's `animation-delay` steps by `--yeti-enter-stagger` up to the ninth, which the tenth and eleventh share.
- `enter--view`: asserts `data-view` and, where `CSS.supports('animation-timeline', 'view()')` is false, that the element is already opaque.
- `enter--once` and `enter--once-stagger`: below a spacer; `data-once` present and `animation-name` `none` with `opacity` 1; after `scrollIntoView` the attribute is gone and the element (or every child) ends opaque; scrolling away and back adds no `animationstart`.
- `enter--inserted`: a button toggles an `@if` holding a `once` element and a plain one; after insertion the plain one has `animation-name` `yeti-enter-fade` and the `once` one arrives when scrolled to.

### Test layer 2: browser-level tests

`NgxYetiEnter` created with `TestBed.createDirective(NgxYetiEnter, { tagName, bindings })` (map, Standing rulings, 2026-10-03; ADR 0014's note), inputs bound through `bindings`; a test host component only for the inserted and staggered cases. Cases:

- the class `enter` and `data-ngx-yeti-item-enter` are on the host;
- each input renders its attribute; `''` for `yetiEnter`, unset `side`, and `false` booleans render nothing;
- `once` true with the host below the viewport: `data-once=""` stays after `whenStable()`; after the host is scrolled into view and the observer fires, `data-once` is gone after `whenStable()` with no manual change detection (zoneless);
- scrolled away and back: `data-once` does not return;
- `once` true, then set to `false` before arrival: the attribute goes; set back to `true`: it returns and the arrival still happens on intersection; after arrival, `true` renders nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 20);
- `once` false at the first render, later `true`: no `data-once` (decision 20);
- destroyed before intersecting: no error; `IntersectionObserver.prototype.disconnect` was called (the one structural assertion, for building-blocks 1.15's teardown);
- while the fixture lives, one `<link data-ngx-yeti-styles="enter">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone (ADR 0060 point 2; the root service is unexported, so the test reads the DOM).

### Test layer 3: node-level tests

`enter.ssr.spec.ts` through the shared `renderServer()` helper with `provideClientHydration()` and `withI18nSupport()` and one `i18n` text (building-blocks 1.11 decision 11): a fixture with `<p yetiEnter>`, `<p yetiEnter="slide" side="end">`, and `<ul yetiEnter="rise" stagger once role="list">`. `whenStable()` resolves; the server HTML has `class="enter"`, the attributes as in section 8, `data-once=""` on the list, no `data-enter` on the bare host, no `jsaction` on any host, and one `enter` item link in `<head>` (ticket 33 row 16's server-HTML half). No pure-logic test: the `computed` is covered in test layer 2.

### Test layer 4: Playwright e2e

Storybook half, on the layer-1 Story ids, in Chromium, Firefox, and WebKit: Yeti's own cases for arrivals, RTL, stagger delays, `view` with and without `view()` support (Firefox 145 has none), reduced motion through `emulateMedia` (every duration and delay collapses; a `view` element below the fold is opaque), the `once` withholding and no replay counted by `animationstart`, and a tall `once` element arriving once its top edge nears the viewport.

Fixture app half, on the `enter` route, both as `RenderMode.Prerender` and as `RenderMode.Server` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0014's note), with JavaScript on and off:

- hydration logs no `NG05xx`, and `componentsSkippedHydration` is 0;
- **ticket 33 row 16:** with the main bundle held back, a below-the-fold `once` element has `data-once` and opacity 1; after hydration finishes it still has `data-once`; scrolled to, it loses it and `animationstart` fires once; scrolling away and back fires nothing more;
- a `once` element already in view at load: record how long after first paint it arrives ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 21);
- JavaScript disabled: every `enter` element opaque, the `once` ones keep `data-once` and `animation-name` `none`; axe on the page;
- a client `@defer (on interaction)` block, an `@if`, and a route change each insert a `once` element that arrives (the failures of tickets 18 and 20), with and without `provideYetiStyles({ preload: ['enter'] })`, recording when the first `animationstart` fires against when the item link loads (ADR 0060 point 6);
- a `@defer (hydrate on viewport)` block holding a `once` element: dehydrated and still above the fold, arrives after scrolling to it;
- a `hydrate never` block: the `once` element stays still and visible, and the item link stays.

Contract check: the class `enter`, the five attributes, the five `enter` values and two `side` values, and no Event (ADR 0014 point 3).

## Out of Scope

- Animating an element's removal: `enter` has no exit; `animate.leave` belongs to the items whose elements leave (ADR 0010 point 2).
- Any input per `--yeti-enter-*` Token, an animations-off Injection token, or a `reducedMotion()` signal (ADR 0004; building-blocks 1.6 points 4 and 6).
- An output or a DOM event for the arrival: Yeti declares none ([events spec](events.md); ticket 26).
- Loading `enter.js` beside the package (ADR 0040).
- Feature detection of `animation-timeline: view()` in package code: Yeti's `@supports` guard is the fallback (building-blocks 1.2).
- A shared observer across instances, or an observer root other than the viewport.
- Generated ids, fragment links, and closing on navigation: not used (see section 13).
- Any check of misuse, such as a static `data-once` written by a consumer: later milestone (map, Inherited preferences, Milestones).
- `deployUrl`: unsupported (map, Standing rulings).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `[yetiEnter]`, class `NgxYetiEnter`, `exportAs: 'yetiEnter'`, entry point `ngx-yeti/enter` | ADR 0080 point 4; building-blocks 1.3 and row 45 |
| `data-enter` is the selector-named `yetiEnter` input, `''` for Yeti's default | ADR 0070 rule U; the user's "Selector name (Recommended)" (map, Standing rulings, 2026-10-02) |
| `side`, `stagger`, `view`, `once` are inputs on the item directive; unset renders nothing | ADR 0070 rules R and 1; ticket 26 rows 163 to 166 |
| Types are Yeti's `YetiEnter` and `YetiSide` from the generated types copy | ADR 0005; ADR 0060 point 10; ADR 0080 point 5 |
| `data-once` is Angular-owned state: a `computed` of `once` and `arrived` | ADR 0070 rule S; ADR 0003 point 4; ticket 26 |
| One `IntersectionObserver` per instance, `rootMargin: '0px 0px 10% 0px'`, in `afterNextRender`, disconnected on arrival and destroy | building-blocks row 45 and 1.15; ticket 26 row 166 |
| `arrived` is private | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 19 |
| The arrival is one-way, and a `once` that is `false` at the first client render latches it | ticket 50 decision 20 |
| A `once` element in view at hydration arrives after hydration, like for like; `once` is for content below the fold | ticket 50 decision 21 |
| No `animate.enter="enter"` beside `yetiEnter` on one element | ticket 50 decision 22 |
| No `animate.enter` in the directive | ADR 0010 point 4; building-blocks row 45 |
| No outputs; no ledger row | ticket 26; ADR 0040, Consequences; building-blocks row 45 |
| Item file acquired in the constructor; preload for client-only insertion | ADR 0060 points 2 and 6; building-blocks row 45 |
| `injectYetiItemStyles('enter')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `enter.js` replaced; consumers load none of Yeti's modules | ADR 0040 |
| Each item on a host writes its own presence attribute, `data-ngx-yeti-item-enter` | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 12 |

### Usage examples

- A hero headline that fades on load: `<h1 yetiEnter>`.
- A row of cards that rises in turn as the page loads: `<ul yetiCluster gap="md" justify="center" yetiEnter="rise" stagger role="list">`, Yeti's own example.
- A below-the-fold grid that arrives once: `<ul yetiGrid min="xs" yetiEnter="rise" stagger once role="list">`.
- A panel that slides in from the end edge: `<section yetiEnter="slide" side="end">`; in a right-to-left page it comes from the left with no change.
- A scroll-linked arrival: `<figure yetiEnter="scale" view>`; in Firefox 145 it plays on load instead.
- A media object whose image side and slide side are the one `data-side`: `<div yetiMedia yetiEnter="slide" side="end">`.
- A timed element: `<p yetiEnter [style.--yeti-enter-delay]="'800ms'">`, or the same token set in a stylesheet; under reduced motion Yeti zeroes it.
- Client-inserted content with a `once` arrival: the application config calls `provideYetiStyles({ preload: ['enter'] })` (the `setup` spec), and the template inserts `<section yetiEnter="rise" once>` from a `@defer` block.
- Imports: each standalone component lists `NgxYetiEnter` and every other directive class its template writes (building-blocks 1.9, "Imports").

Usage rules: write `once` for content that starts below the fold, as Yeti's docs describe it ("as it first comes near the viewport"); put `stagger` on the layout that holds the row, not on the items (`enter/docs.md`); use one arrival per page section, as Yeti's "When to use it" asks; write no Yeti class or `data-*` attribute on the host; write no `animate.enter="enter"` beside `yetiEnter` (ticket 50 decision 22); load no `enter.js`.

The owner directive ticket 20 measured as the fix, trimmed (from the prototype). It removed the attribute itself; ADR 0070 rule S replaces that write with a signal and a host binding so hydration has nothing to restore:

```ts
afterNextRender(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.removeAttribute('data-once');
        observer?.disconnect();
      }
    },
    { rootMargin: '0px 0px 10% 0px' },
  );
  observer.observe(el);
});
```

### Styles

1. Item file: `enter`'s, loaded per ADR 0060 (section 10); preload it for client-only insertion.
2. Always-loaded rules relied on: the tokens in `Y/src/tokens/components.css:125-139` and their reduced-motion block at `:183-189`; the global reduced-motion collapse of the motion tokens.
3. Cross-item rules: none of its own. Staggering targets the children of whatever layout carries it (`cluster`, `grid`), whose item files those directives load.
4. Tokens read: `--yeti-enter-ease`, `--yeti-enter-delay`, `--yeti-enter-duration`, `--yeti-enter-distance`, `--yeti-enter-scale`, `--yeti-enter-stagger`. Written by the package: none. The consumer sets them in a `:root` block, a theme file after Yeti, a rule on one element, or a style binding (ADR 0004).
5. Missing item file: every element is simply present with no arrival, Yeti's safe failure.
6. Tailwind: no name collision; `enter` is not a Tailwind utility class (building-blocks 1.13 lists `container`, `grid`, `table`, `hidden`).

### Single-page-application pieces it relies on

None of the shared specs: no [events](events.md), no [generated ids](generated-ids.md), no [fragment links](fragment-links.md), no [navigation close](navigation-close.md). It relies on the style loader of ADR 0060 and the `setup` spec's preload list.

### Platform features to adopt when the browser target moves

- `animation-timeline: view()` is guarded by Yeti; when it is in the target, nothing in the package changes, because Yeti owns the guard (building-blocks 1.2).
- `sibling-index()` is Yeti's stated alternative to the eight stagger rules (`enter.css` comment); adopting it is a Yeti change at a pin move, not the package's.
- None changes the directive: `IntersectionObserver` is already the platform's mechanism, and a CSS-only trigger for a once-only arrival would be Yeti's to adopt first (inferred).
