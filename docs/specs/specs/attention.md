# Spec: attention (utility)

Ticket: [43. Spec: attention (utility)](../issues/43-spec-attention.md). Targets Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 43 ("Native platform, 1; types only"; no module, no building block, no ledger row), [ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md) row 160, [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind U (the selector-named input, chosen by the user on 2026-10-02: "Selector name (Recommended)", map, Standing rulings), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 4 (the class is `NgxYetiAttention`, because Yeti's `yeti.d.ts` exports `YetiAttention`), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) (the item file), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) (animation is Yeti's CSS), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) (rendering modes), [ADR 0014](../adr/0014-testing-stack-for-yeti.md) (test layers), and [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) (WCAG 2.2 AA). The points no record settled were listed under `### Open` in the ticket and are decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 13 to 16).

## Problem Statement

Yeti's `attention` utility plays one pulse or one shake when an element appears, to point at something that has just changed: the alert after a save, the total that moved, the field the server rejected. In plain Yeti the author writes `class="attention"` and, for the shake, `data-attention="shake"` by hand. In an Angular application that has three problems. A misspelt value (`data-attention="shaek"`) is silent and plays the default pulse. The utility's item file must be on the page when the element arrives, and the package loads Yeti's CSS per item ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), so something has to ask for it. And the gesture must behave under server rendering, hydration, `@defer`, and zoneless change detection, which the user requires of every item (map, Standing rulings).

The gesture is motion only. A screen reader hears nothing from it, so Yeti's own accessibility note asks that a change worth pointing at is also said: the element sits in a live region or carries `role="status"`.

## Solution

One attribute directive, `[yetiAttention]`, class `NgxYetiAttention`, in the secondary entry point `ngx-yeti/attention`. The application developer writes it on the element that has just changed, beside that element's own item directive where it has one:

- `<div yetiAlert yetiAttention role="status">` plays Yeti's default gesture, the pulse.
- `<p yetiBadge yetiAttention="shake" role="status">` plays the shake.

The directive binds Yeti's identity class `attention` as a static host class, renders `data-attention` from its selector-named input (no attribute for the bare selector, so Yeti's default applies), marks its host for the item-file service, and acquires the `attention` item file while it lives. It has no listener, no render callback, no output, and no method. Yeti's CSS plays the gesture once, keeps the element where it started, and collapses the gesture under reduced motion. A value outside Yeti's vocabulary fails to compile.

## User Stories

1. As an application developer, I want to write `yetiAttention` on an element that has just changed, so that it plays Yeti's pulse once when it appears.
2. As an application developer, I want to write `yetiAttention="shake"`, so that the element plays Yeti's shake instead.
3. As an application developer, I want `yetiAttention="wobble"` to fail to compile, so that a misspelt gesture never ships as a silent pulse.
4. As an application developer, I want to bind `[yetiAttention]="gesture()"` from a signal, so that the gesture can follow my component's state.
5. As an application developer, I want the bare selector to render no `data-attention` attribute, so that Yeti's own default gesture applies and the server HTML stays Yeti's minimal markup.
6. As an application developer, I want to use Yeti's exported `YetiAttention` type for my own fields, imported from `ngx-yeti`, so that my code and the directive agree on the values.
7. As an application developer, I want the directive class to be `NgxYetiAttention`, so that it never collides with Yeti's `YetiAttention` type in one import list.
8. As an application developer, I want `exportAs: 'yetiAttention'`, so that I can reach the directive from a template reference like every other package directive.
9. As an application developer, I want to put the directive on an alert, a badge, a field, or any element, beside that element's own item directive, so that I keep the element's own styling and semantics.
10. As an application developer, I want the `attention` item file loaded when the first `yetiAttention` host renders and removed after the last one leaves, so that pages that never point at a change do not carry its CSS.
11. As an application developer, I want the item file in the server HTML for server-rendered hosts, so that the gesture plays at first paint with no flash and no script.
12. As an application developer inserting an alert with `@if` after a save, I want the gesture to play when the alert appears, so that the reader catches the change.
13. As an application developer using a client-only `@defer` block, I want to preload the `attention` item file with `provideYetiStyles({ preload: ['attention'] })`, so that the gesture plays at insertion rather than when the file arrives.
14. As an application developer, I want the gesture to play once and stop, so that nothing keeps moving under a reader who cannot dismiss it.
15. As an application developer, I want the element to end exactly where it started, so that no layout is left shifted after the gesture.
16. As a reader who prefers reduced motion, I want the gesture to collapse so the element simply sits still, so that the page does not move for me.
17. As a screen reader user, I want every example and story to put the changed element in a live region or give it `role="status"`, so that I hear the change the gesture points at.
18. As a keyboard user, I want the directive to add no Tab stop, no key handling, and no focus move, so that the gesture never takes my place on the page.
19. As a reader on a 320 px wide screen, I want a shaking element's brief sideways throw to leave no lasting horizontal scroll, so that I never scroll in two directions to read.
20. As an application developer with JavaScript off on a server-rendered or prerendered page, I want the gesture to play from the server HTML, so that the page behaves as Yeti's own markup would.
21. As an application developer using full or incremental hydration, I want hydration to leave the host's class and attribute untouched, so that the gesture does not restart when the page becomes live.
22. As an application developer using `hydrate never`, I want a dehydrated host to keep its item file and play its gesture, so that a static block still points at its change.
23. As an application developer with zoneless change detection, I want a bound gesture value to update the attribute, so that the directive works in the change-detection mode Angular recommends.
24. As an application developer using `withI18nSupport()`, I want translated content inside the host to hydrate cleanly, so that localisation does not re-render the element and replay the gesture.
25. As an application developer, I want the directive to declare no listener, so that nothing about it is replayed or lost before hydration.
26. As an application developer, I want to set `--yeti-attention-duration`, `--yeti-attention-distance`, `--yeti-attention-scale`, and `--yeti-ease` in my own stylesheet, so that I tune the gesture in Yeti's way without a package input.
27. As an application developer, I want the docs to tell me what happens when I set the duration token myself under reduced motion, so that my override does not bring the motion back for readers who asked for less.
28. As an application developer, I want to know how to play the gesture again, so that I can point at a second change on the same spot.
29. As an application developer, I want to know whether `yetiAttention` and `yetiEnter` can share one element, so that one gesture does not silently replace the other.
30. As an application developer, I want the server HTML to equal Yeti's documented markup plus the package's host marker, so that crawlers and dehydrated blocks see a valid Yeti page.
31. As a maintainer, I want the contract check to assert that the directive renders only the class, attribute, and values Yeti's manifest declares, so that a pin move that renames a value fails a test.
32. As a maintainer, I want the colliding-name test of ADR 0080 to run at each pin move, so that a new Yeti export never collides with a package name unseen.
33. As a maintainer, I want the stories to pass the story gate on the WCAG 2.2 AA rule set, so that the package's examples are accessible as written.

## Implementation Decisions

### 1. Yeti contract

From the manifest at the pin: kind `utility`, docs group "Motion", class `attention`, one attribute `data-attention` (type `enum`, vocabulary `attention` with the values `pulse` and `shake`, default `pulse`), no classes, no children, no markers, no module (`js: null`), no events. Tokens: `--yeti-attention-duration`, `--yeti-attention-distance`, `--yeti-attention-scale`, and `--yeti-ease`, all public. Accessibility block: no required attributes, no keyboard; the note says motion is not an announcement, the element belongs in a live region or carries `role="status"`, the gesture plays once and never repeats, and under reduced motion the duration collapses. Support block: individual transform properties, unguarded; they are inside the browser target ([ADR 0002](../adr/0002-browser-target-baseline-2025.md); building-blocks 1.2).

Yeti's CSS, read at the pin: `.attention` runs the pulse keyframes for `--yeti-attention-duration` with `--yeti-ease`, with the initial iteration count of 1 (deliberately not `--yeti-motion-iterations`, which resolves to infinite for endless animations) and no fill mode, because no keyframe leaves the element away from its own computed style. `[data-attention="shake"]` swaps the animation name. The pulse scales to `--yeti-attention-scale` at 50 %; the shake translates by `--yeti-attention-distance` to each side twice. Under `prefers-reduced-motion: reduce` the always-loaded tokens set `--yeti-attention-duration` to `0.01ms` on `:root`.

Nothing is left to the consumer except the live region or `role`, which is the consumer's state under [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 3.

### 2. Contract mapping

| Yeti | Package | Type and default | Static-form kind |
| --- | --- | --- | --- |
| class `attention` | static host class on `[yetiAttention]` | always | n/a |
| `data-attention` | input `yetiAttention` (selector-named, ADR 0070 kind U; ticket 26 row 160), bound as `[attr.data-attention]` | `YetiAttention \| ''`, unset by default; `''` and unset render no attribute, so Yeti's `pulse` applies (ADR 0070 rule 1) | `yetiAttention` is not an HTML attribute name, so no presentational-attribute kind applies |
| `--yeti-attention-duration`, `--yeti-attention-distance`, `--yeti-attention-scale`, `--yeti-ease` | not written by the package; the consumer's stylesheet surface ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)) | Yeti's defaults: `600ms`, `0.35rem`, `1.06`, and the shared ease | n/a |
| events | none (no module) | n/a | n/a |
| (package) `data-ngx-yeti-item-attention` (empty value) | static host presence attribute, for ADR 0060's removal sweep ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) | always | n/a |

`YetiAttention` is Yeti's vocabulary type, reached through the package's generated `yeti-types.ts` and re-exported by name from `ngx-yeti` ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 10; ADR 0080 point 5, as its 2026-10-02 note reads). A static `yetiAttention="shake"` type-checks as a string literal under `strictTemplates` (ADR 0070 rule 2).

No module is replaced: Yeti has none for this item ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); building-blocks row 43).

### 3. Hierarchy and DI shape

One item directive; no part directives, no child directive, no injection token of its own, no `hostDirectives`. No Yeti item always sits on another's element (building-blocks Part 2, "Two findings"), so the directive is written beside the host's own item directive (`yetiAlert`, `yetiBadge`, `yetiField`), never hosted by it (building-blocks 1.9). Its one injection is ADR 0060's root styles service, reached by `injectYetiItemStyles('attention')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45): it acquires the `attention` item file, on the server too, and releases it through `DestroyRef` on destroy (ADR 0060 point 2). "Types only" in row 43 describes the item's own behaviour; the acquisition is what ADR 0060 adds to every directive. No generated id: the directive renders no id and no reference ([generated-ids](generated-ids.md) does not apply).

### 4. API

`NgxYetiAttention`, selector `[yetiAttention]`, `exportAs: 'yetiAttention'`, OnPush-neutral (a directive), zoneless-safe.

| Member | Kind | Type | Notes |
| --- | --- | --- | --- |
| `yetiAttention` | `input()` | `YetiAttention \| ''`, unset | `''` and unset bind `null`, so no attribute renders |

No model, no output, no method, no defaults token (building-blocks 1.4: none by default). A public signal or method to play the gesture again is not offered: row 43 is "types only", which declares no listener and no render callback, and Yeti's docs say the gesture "arrives with the element". The way to play it again is to create the element again (Further Notes, usage).

### 5. Material comparison

| Concern | Angular Material and CDK | This directive |
| --- | --- | --- |
| Drawing the eye to a change | No Material component animates attention | Yeti's CSS gesture on the consumer's element |
| Saying the change | `MatSnackBar` announces through CDK `LiveAnnouncer` (`NC/src/material/snack-bar/snack-bar.ts:50`, `:221`, read) | The consumer's live region or `role="status"` on the host, as Yeti's note asks; the package announces nothing and renders no string (building-blocks 1.10) |
| Reduced motion | Material reads `prefers-reduced-motion` per component in its CSS | Yeti's tokens collapse the duration (building-blocks 1.6 point 4) |

`LiveAnnouncer` is not used: row 43 names no building block, and Yeti's documented pattern is the consumer's own live region.

### 6. Implementation level and primitives

Level 1, native platform: CSS animations with individual transform properties, from Yeti's item file (building-blocks 1.2; row 43). No Aria and no CDK piece applies: there is no pattern, no keyboard, and no state.

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

No role, no state, no keys, no focus change, and no Tab stop. Ledger rows: none (row 43). Criteria the item touches:

- **4.1.3 Status Messages (AA).** The gesture is not an announcement. Usage rule: the changed element, or an ancestor, is a live region (`role="status"`, `role="alert"`, or `aria-live`), as Yeti's accessibility note says. The directive cannot know the content, so the rule is stated as a requirement, shown in every example, and asserted in every story's play function ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4). The directive adds no role ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 3; building-blocks 1.10, Names). No runtime check is added: checks are a later milestone (map, Milestones).
- **2.2.2 Pause, Stop, Hide (A).** The gesture runs once for 600 ms at Yeti's default, under the 5-second threshold, and never repeats (iteration count 1, measured in all three engines by [ticket 17](../issues/17-research-yeti-accessibility-and-standards.md), research section 2.5).
- **2.3.1 Three Flashes (A).** No flash: a scale or a translate with no colour change.
- **2.3.3 Animation from Interactions** is AAA and outside the target; reduced motion collapses the gesture anyway (ticket 17, section 2.5, measured: `yeti-attention-pulse` collapsed to `0.00001s`).
- **1.4.10 Reflow (AA).** Ticket 17 measured a page-level `scrollWidth` of 329 at 200 ms and 320 at 2.5 s on the shake example at 320 px, in Chromium: the throw overflows for the length of the gesture and then ends. The spec reads this as no 1.4.10 failure, because no content needs two-dimensional scrolling to be read, and adds no ledger row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 13). Test layer 4 asserts that the overflow is gone once the gesture ends.
- **2.4.7, 2.4.11 focus.** Untouched: the directive moves nothing that holds focus away from where it ends, and Yeti's ring is the host's.

### 8. Rendered HTML

Consumer markup (inside an Angular template):

- `<div yetiAlert variant="success" yetiAttention role="status">...</div>`
- `<p yetiBadge variant="alert" yetiAttention="shake" role="status">Card declined</p>`

Server and hydrated DOM, identical: `<div class="alert attention" data-variant="success" data-ngx-yeti-item-alert="" data-ngx-yeti-item-attention="" role="status">` (each item directive on the host sets its own presence attribute, [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 12), and `<p class="badge attention" data-variant="alert" data-attention="shake" data-ngx-yeti-item-badge="" data-ngx-yeti-item-attention="" ... role="status">`. The server writes `<link rel="stylesheet" data-ngx-yeti-styles="attention" ...>` into `<head>` in Yeti's order (ADR 0060 points 3 and 5). No `jsaction`: the directive has no listener.

### 9. Animation

Yeti's own keyframes on its own class ([ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) point 1); the package ships no keyframes and no motion input. The gesture is a CSS animation that starts when the rule first matches the element, so an element Angular inserts plays it with no `animate.enter`. `animate.enter` is not used: the host is not entering through Angular's animation (ADR 0010 point 2), and a server-rendered host must not take it (ADR 0010 point 3). No completion output and no wait for `animationend`. Reduced motion is Yeti's (building-blocks 1.6 point 4).

Changing a bound value after render changes the computed `animation-name` (the pulse and the shake are different keyframes), and the platform then starts the new gesture from the beginning; changing between `''`, unset, and `pulse` changes nothing visible (read in the CSS and the CSS Animations model, not measured; test layer 4 measures it).

### 10. Rendering modes

- **Server output and first paint.** The class, `data-attention` when set, and `data-ngx-yeti-item-attention` are host bindings, so the server HTML is Yeti's markup ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 1). The item file link is in `<head>` and render-blocking, so the gesture plays at first paint.
- **Before hydration.** Nothing to touch: no DOM work, no observer, no timer, no render callback.
- **Full and incremental hydration.** Hydration adopts the item link (ADR 0060 point 5) and writes the same class and attribute values again. A write of an unchanged value changes no computed style, so the gesture does not restart at hydration (inferred, not measured; accepted in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 14). Test layer 4 asserts exactly one `animationstart` per host across load and hydration; if it fails, an upstream-bugs row is added and the point is revisited.
- **Event replay.** Nothing replays and nothing needs to: no listener.
- **Client-only `@defer`, `@if`, routed views.** The constructor acquires the item file. If it is not already on the page, the element renders unstyled until the file arrives, and the gesture then starts, late but once (ADR 0060 point 6 measured 1 to 20 unstyled frames for an item; that the late gesture still plays is inferred from CSS animation start rules). `provideYetiStyles({ preload: ['attention'] })` closes the gap, and is the documented setup for an application whose attention hosts are client-inserted, the common case (an alert after a save).
- **`hydrate on ...` before its trigger, and `hydrate never`.** The dehydrated host is its server HTML: it holds its item link for as long as it is on the page (ADR 0060 point 4, measured) and plays its gesture from CSS. Nothing is lost, because the directive has no Angular-side behaviour.
- **`withI18nSupport()`.** The directive has no template and no text. The fixture's host contains one `i18n` text, so the SSR smoke runs with `withI18nSupport()` and the fixture app provides it (building-blocks 1.11 point 11); without it, a component with `i18n` blocks re-renders destructively and its hosts would play their gesture a second time (ticket 18 measured the re-render; the second play is inferred).
- **Zoneless.** The input is a signal and the host binding reads it (building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (the user's "#55 ... Option 1", map, Standing rulings; ADR 0011's 2026-10-03 note). Nothing is lost: the gesture plays from the server HTML and the item link, the live region is markup, and the element ends where it started. A client-only application promises nothing with JavaScript off.

### 11. Hydration constraints

The user's ruling "54. Make sure that we always comply with [hydration constraints](https://angular.dev/guide/hydration#constraints)." (map, Standing rulings) holds:

- the same DOM on the server and the client: every binding is a pure function of the input, with no platform branch;
- no direct DOM manipulation: the directive writes only through host bindings;
- valid HTML: the directive adds a class and two attributes to the consumer's element;
- `preserveWhitespaces`: the directive has no template;
- usage rule: the consumer writes no static `data-attention` and no `class="attention"` on a host of `yetiAttention`, because hydration writes static attributes again before the binding wins ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), 2026-10-03 note; building-blocks, "Hydration constraints (2026-10-03)").

### 12. Single-page application

None. The directive does nothing on navigation and has no fragment link. A host in a destroyed route leaves with it and releases its item file. [navigation-close](navigation-close.md) and [fragment-links](fragment-links.md) do not apply; [events](events.md) does not apply either, because the item has no event.

### 13. Item file

`attention` (`utilities/attention/attention.css` of the consumer's Yeti build, rank 42 in Yeti's file order), acquired by every `yetiAttention` host through ADR 0060's counted link and removed once no host is connected (ADR 0060 points 2 to 4). The consumer's one line is the `setup` spec's ([setup](setup.md)): the `assets` entry for the Yeti build, plus `provideYetiStyles({ preload: ['attention'] })` where hosts are client-inserted. No other item file is acquired (ADR 0060 point 9: no cross-item rule touches this item).

## Testing Decisions

A good test here asserts what a reader and a browser see: the class, `data-attention` present or absent with its value, the computed animation, and the host's place after the gesture. No test reads an instance field or a token's default value ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 3). Prior art: Yeti's own browser test for this utility asserts the animation name per value, one iteration, no running animation once painted, an unchanged box afterwards, the collapse under reduced motion, and axe; test layer 4 repeats those cases against the package's stories. All tests run zoneless (building-blocks 1.12).

### Test layer 1: story play functions (`npx nx test-storybook <lib>`)

Story ids (building-blocks 1.3): `attention--default` (Yeti's example: a success alert with `yetiAttention` and `role="status"`), `attention--shake` (Yeti's docs example: an alert badge with `yetiAttention="shake"` and `role="status"`), and `attention--inserted` (a Save button that inserts an alert with `@if`). Each play function asserts the class `attention`; `data-attention` absent on the default story and `shake` on the shake story; the computed `animation-name` (`yeti-attention-pulse`, `yeti-attention-shake`); that the host or an ancestor is a live region (the usage rule of section 7); and, on the inserted story, that the inserted alert carries the class and starts its gesture after the click. Axe runs through the story gate with `parameters.a11y.test = 'error'` and the six tags.

### Test layer 2: browser-level tests (`npx nx test <lib>`, `attention.spec.ts`)

`TestBed.createDirective(NgxYetiAttention, { tagName: 'p', bindings: [...] })` (the user's ruling "58. Specs should assume that the ngx-yeti repo is using Angular 22.2 with Angular's new [directive testing API]...", map, Standing rulings; ADR 0014's 2026-10-03 note). Cases: unset renders no `data-attention`; `''` renders none; `'shake'` renders `shake`; a signal binding moving from `shake` to `''` removes the attribute after `whenStable()`, zoneless; the class and `data-ngx-yeti-item-attention` are present in every case; `exportAs` resolves through a template reference in a test host; the directive acquires `attention` on creation and releases it on destroy, observed in the DOM: `<link data-ngx-yeti-styles="attention">` is in `document.head` while the host lives and gone after destroy (the root service is unexported, so no double of it can be built).

### Test layer 3: node-level Vitest and the SSR smoke (`npx nx test <lib>`, `attention.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and one `i18n` text inside the host: the server HTML has the class, `data-attention="shake"` on the shake host and no `data-attention` on the bare one, `data-ngx-yeti-item-attention`, the item link in `<head>`, no `jsaction` on the host, and no `class="attention"` written twice. The contract check covers the item with no per-spec code: class `attention`, attribute `data-attention`, and the union `pulse | shake` against the built manifest (ADR 0014 point 3).

### Test layer 4: Playwright e2e (three engines in CI)

Against the static Storybook build, on the story ids above:

- the gesture plays once: iteration count `1`, and no running animation on the host once painted;
- the host ends where it started: its box equals an unanimated twin's, and computed `scale` and `translate` are `none`;
- under `emulateMedia({ reducedMotion: 'reduce' })` the duration is at most `0.01ms` and the host's `scale` and `translate` never change across frames;
- at a 320 px viewport the shake story's page `scrollWidth` returns to the viewport width once the gesture ends (section 7, 1.4.10);
- changing the bound value from `pulse` to `shake` starts the shake from its beginning (section 9).

Against the fixture app (`outputMode: 'server'`, one `/attention` route marked `RenderMode.Prerender` and one `RenderMode.Server`; ticket 50 decision 2), each with JavaScript on and off:

- JavaScript off: the gesture plays from the server HTML, the item link is in `<head>`, and axe with the six tags finds nothing;
- hydration: no `NG05xx`, `componentsSkippedHydration === 0`, and exactly one `animationstart` per host across load and hydration (counted by an init script; section 10);
- a `hydrate never` block: the host keeps its item link and plays its gesture;
- a client-only `@defer` host, with and without `preload: ['attention']`: the gesture plays once in both, and with the preload the first frame after insertion is styled.

The floor browsers are named by [ADR 0002](../adr/0002-browser-target-baseline-2025.md). Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

## Out of Scope

- A method, signal, or input to play the gesture again on the same element. Row 43 is "types only"; the consumer re-creates the element (Further Notes).
- A package announcement (`LiveAnnouncer`), a role, or a live region the directive adds: the consumer's markup carries it (section 7).
- An input per token, a motion input, or a reduced-motion signal ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md); building-blocks 1.6 point 4).
- A runtime warning for a host with no live region: misuse warnings are a later milestone (map, Milestones).
- Repeating gestures: Yeti leaves the iteration count at 1 by design.
- `deployUrl`: unsupported (map, Standing rulings, "29. ... Only `baseHref`/`--base-href`/`<base href>` should be supported.").

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One attribute directive, no component | [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 6; [ticket 11](../issues/11-decide-spec-list.md) row 43 |
| Class `NgxYetiAttention`, selector and `exportAs` `yetiAttention` | [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) points 1 and 4 |
| Selector-named input typed `YetiAttention \| ''`, unset renders nothing | [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind U and rule 1; ticket 26 row 160; the user's "Selector name (Recommended)" |
| Native level 1, types only, no module, no ledger row | building-blocks Part 2 row 43 |
| Item file through a counted link; preload for client-inserted hosts | [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 2 to 6 |
| No `animate.enter`; Yeti's CSS plays the gesture | [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) points 1 to 3 |
| Tokens are the consumer's | [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) |
| Live region is a stated requirement, asserted in stories | [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) point 4; Yeti's accessibility note |
| Transient 1.4.10 overflow, no ledger row | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 13 |
| Hydration does not restart the gesture | inferred; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 14 |
| Duration override under reduced motion: a usage rule | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 15 |
| Attention and `enter` go on different elements: a usage rule | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 16 |

### Usage examples

- After a save, inside a component with `NgxYetiAttention` and `YetiAlert` in its `imports`: `@if (saved()) { <div yetiAlert variant="success" yetiAttention role="status"><div><strong>Saved.</strong> Your changes are live.</div></div> }`.
- A declined card: `<p yetiBadge variant="alert" yetiAttention="shake" role="status">Card declined</p>`.
- A gesture from state: `<output [yetiAttention]="gesture()" role="status">{{ total() }}</output>`, where `gesture` is a signal of `YetiAttention | ''`.
- Playing the gesture again: create the element again, for example `@for (change of [lastChange()]; track change.id) { <p yetiAttention role="status">{{ change.text }}</p> }`, so a new id makes a new element.
- Every example imports each directive it uses (building-blocks 1.9, Imports): a forgotten `NgxYetiAttention` leaves the element with no class and no gesture, and only a bound `[yetiAttention]` makes the compiler report it.
- A consumer duration that keeps reduced motion: `.slow-attention { --yeti-attention-duration: 900ms; } @media (prefers-reduced-motion: reduce) { .slow-attention { --yeti-attention-duration: 0.01ms; } }` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 15).
- Beside an entrance: `<section yetiEnter><p yetiAttention role="status">New</p></section>`, never both on one element ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 16).
- Application setup for client-inserted hosts: `provideYetiStyles({ preload: ['attention'] })` (the `setup` spec owns the provider).

### Styles

1. Item file: `attention`, loaded by ADR 0060's counted link; the consumer's line is the `setup` spec's, plus the preload where hosts are client-inserted.
2. Always-loaded rules relied on: the four tokens' defaults and the reduced-motion collapse of `--yeti-attention-duration` in Yeti's component tokens; `--yeti-ease` in Yeti's motion tokens.
3. Cross-item rules: none. On one element, `attention` and `enter` both declare `animation` in `yeti.utilities`, and `enter.css` comes later in Yeti's order, so with equal specificity the entrance replaces the bare pulse, while `[data-attention="shake"]` sets only the name over the entrance's timing (read in the CSS, not measured). So the two go on different elements, the gesture on a child of the entering element (usage rule, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 16). `lift` animates the same `scale` and `translate` properties by transition on hover; a running gesture wins over the transition while it runs (inferred).
4. Tokens: `--yeti-attention-duration`, `--yeti-attention-distance`, `--yeti-attention-scale`, `--yeti-ease`; the package writes none. A consumer sets them on `:root`, on any element, or in a theme file after Yeti (building-blocks 1.13). An unlayered consumer value beats Yeti's layered tokens wherever it sits ([ticket 04](../issues/04-research-yeti-styles-and-lazy-loading.md) 4.2, measured), so a consumer who sets `--yeti-attention-duration` also replaces Yeti's reduced-motion collapse of it unless the consumer repeats the collapse (inferred from that measurement). Usage rule: a consumer who sets `--yeti-attention-duration` also sets it to `0.01ms` inside `@media (prefers-reduced-motion: reduce)`; no package code and no input ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 15).
5. Missing item file: the element renders with no gesture, and nothing else changes.
6. Tailwind v4: no name collision. Of Yeti's class and attribute names, Tailwind 4.3.3 generates a utility only for `container`, `grid`, `table`, and `hidden` ([ticket 24](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md), measured).

### Platform features to adopt when the browser target moves

None. Every feature the item uses is inside Baseline 2025.

### Single-page-application pieces it relies on

None.
