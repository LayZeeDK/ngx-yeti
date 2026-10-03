# Binding Yeti's `yeti:*` events in Angular templates

Research for [ticket 16](../issues/16-research-yeti-events-in-angular-templates.md). Decides nothing.

Sources: Angular at `github.com/angular/angular`, branch `22.2.x` (checked: `git status` reports `22.2.x`, up to date with origin); Yeti at `github.com/foundation/yeti`, `f52d1e8b9` (read only); npm metadata from `registry.npmjs.org`; web pages named inline. Probe: an Angular CLI 22.2 app (`@angular/core` `^22.2.0`, `@angular/ssr` `^22.2.1`, zoneless, SSR, `provideClientHydration(withEventReplay())`) at `D:/tmp/ngx-yeti-16/probe`, driven by `D:/tmp/ngx-yeti-16/drive.mjs` (Playwright 1.57 with Microsoft Edge) against the built server (`node dist/probe/server/server.mjs`, `NG_ALLOWED_HOSTS=localhost`).

Each claim is marked **Measured** (seen in the probe), **Read** (seen in source or a page), or **Inferred**.

## Yeti's events

Read, `src/guides/install.md:154-177` and the modules:

| Event | Dispatched on | `detail` | Source |
| --- | --- | --- | --- |
| `yeti:close` | `.alert`, before removal | none | `src/components/alert/alert.js:17` |
| `yeti:open` | `dialog`, once open | none | `src/components/dialog/dialog.js:49` |
| `yeti:close` | `dialog`, on close | none | `src/components/dialog/dialog.js:74` |
| `yeti:select` | `.tabs` | `{ tab, panel }` | `src/components/tabs/tabs.js:31`, `:76` |
| `yeti:slide` | `.carousel` | `{ index, slide }` | `src/components/carousel/carousel.js:43` |
| `yeti:invalid` | `form` | `{ controls }` | `src/components/field/validate.js:62` |
| `yeti:current` | `.toc` | `{ link, heading }` | `src/components/toc/toc.js:36` |

Every one is a `CustomEvent` with `bubbles: true, composed: true` and not cancelable. The stability guide freezes the names, targets, and `detail` keys, and says "An event may be added; none will be renamed or lose a key" (`src/guides/stability.md:21`). So "what breaks when Yeti adds an event" is the only change case to plan for.

## Why `(yeti:close)` fails

- Read: the binding parser splits an event name at its first colon into a target and an event (`packages/compiler/src/template_parser/binding_parser.ts:698-701`, `splitAtColon`). `(yeti:close)` becomes target `yeti`, event `close`.
- Read: the template pipeline's reify phase looks the target up in `GLOBAL_TARGET_RESOLVERS` and throws for anything other than `window`, `document`, `body` (`packages/compiler/src/template/pipeline/src/phases/reify.ts:319-330`). Inferred: `host` listeners go through the same parser and phase, so `host: { "(yeti:close)": ... }` fails the same way.
- Measured: adding `(yeti:slide)="..."` to the probe template fails `ng build` with `Unexpected global target 'yeti' defined for 'slide' event. Supported list of global targets: window,document,body.` The error is a compile error; no runtime code, and so no event manager plugin, ever sees the name.
- Read: the imperative path accepts the colon. `Renderer2.listen(element, 'yeti:close', cb)` with an element target skips the global-target branch (`packages/platform-browser/src/dom/dom_renderer.ts:477-495`) and goes to the event manager, whose `DomEventsPlugin.supports()` returns `true` for every name (`packages/platform-browser/src/dom/events/dom_events.ts:21-23`) and calls `element.addEventListener(eventName, ...)`. Inferred: `Renderer2.listen` or `addEventListener` with the real name works in code; only templates and `host` bindings are blocked.

## Option 1: an event manager plugin

### How plugins work (Read)

- `EVENT_MANAGER_PLUGINS` is a public multi-provider token (`packages/platform-browser/src/dom/events/event_manager.ts:31`); `EventManagerPlugin` is a public abstract class with `supports(eventName)` and `addEventListener(element, eventName, handler, options)` (`event_manager_plugin.ts:32-42`).
- `EventManager` reverses the non-DOM plugins and puts `DomEventsPlugin` last (`event_manager.ts:49-65`), then picks the first plugin whose `supports()` returns true and caches it by name (`event_manager.ts:95-112`).
- Template listeners reach it through `listenToDomEvent` -> `renderer.listen` (`packages/core/src/render3/view/listeners.ts:181`), also in the DOM-only compilation mode (`ɵɵdomListener`, `packages/core/src/render3/instructions/listener.ts:97-118`).
- angular.dev documents the extension point with a `DebounceEventPlugin` for `(input.debounce.500)`, usable in templates and in `host` (`adev/src/content/guide/templates/event-listeners.md:138`, "Extend event handling").
- The server platform registers its own `ServerEventManagerPlugin` (`packages/platform-server/src/server.ts:72`); an app-level plugin is provided on both platforms.

### What it can and cannot do

The plugin can never receive `yeti:close` from a template, because the compiler throws first (Measured above). It can receive any name the compiler passes through unchanged, and translate it: the template writes a colon-free alias, and the plugin listens for the real `yeti:` name. Read in the compiler: a name without a colon and without a leading `@` becomes a plain listener, so dash names (`yeti-close`) and dot names (`yeti.close`, the shape `KeyEventsPlugin` and Taiga use) both pass.

Measured: the probe's `YetiEventPlugin` claims names starting with `yetip-` (a probe-only prefix, so it could sit beside option 3 in one template) and calls `element.addEventListener('yeti:' + rest, handler)`. `(yetip-slide)` on a `.carousel` received the real `yeti:slide` event (`$event.type` was `yeti:slide`, `detail.index` was correct), with no Zone.js loaded, and the signal it set rendered. The plugin's `addEventListener` ran once in the browser.

### Per-option record

- **Zoneless:** works (Measured). The handler Angular gives the plugin is the wrapped listener that marks the view for check (Read, `listeners.ts:172-181`).
- **SSR:** the build and server render succeed with the plugin provided (Measured: HTTP 200, no server log errors). On the server the listener attaches to a server DOM element and never fires (Inferred).
- **Event replay:** not replayed. Event replay only stashes names in its fixed early-event list (`packages/core/src/hydration/event_replay.ts:248`; list at `packages/core/primitives/event-dispatch/src/event_type.ts:295-375`), and no custom name is in it. Measured: the server HTML carried `jsaction="click:;"` only, and a `yeti:slide` dispatched by an inline script before `main.js` ran reached no Angular listener. This holds for every option below.
- **Type checking:** `$event` is typed from `HTMLElementEventMap` under strict templates, which are on by default in Angular 22 (Read, `packages/compiler-cli/src/ngtsc/core/src/compiler.ts:1063-1064`; the type-check block emits `el.addEventListener('<name>', ($event) => ...)`, `packages/compiler/src/typecheck/ops/events.ts:198-254`). Without an augmentation the alias name types `$event` as `Event` (Read). With a `declare global { interface HTMLElementEventMap { 'yeti-slide': CustomEvent<...> } }` entry for the alias, `detail` is typed (Measured for the same mechanism under option 3). The augmentation is keyed by the template name, not by `yeti:slide`.
- **Consumer writes:** a provider once (`{ provide: EVENT_MANAGER_PLUGINS, useClass: ..., multi: true }` or a `provideYetiEvents()` function), then `(yeti-close)="..."` (or `(yeti.close)`) on the element or in `host`.
- **When Yeti adds an event:** a prefix-mapping plugin forwards the new name with no code change; only the `HTMLElementEventMap` entry is missing, so `$event` falls back to `Event` until the package adds it (Inferred from the mapping and the type-check block).
- **Other costs:** one `supports()` call per distinct event name per app, cached (Read, `event_manager.ts:95-112`). The alias is a name Yeti never dispatches, so documentation from Yeti (`yeti:close`) and template syntax differ by one character. If a real `yeti-*` DOM event ever existed it would be shadowed (Inferred).
- **Unclaimed-event check:** the `strictUnclaimedEventNames` check only flags single camelCase identifiers, and dash names are exempt by design (Read, `packages/compiler-cli/src/ngtsc/typecheck/src/dom.ts:35`, `:148-190`); it is off by default outside Google (`compiler.ts:1110`).

## Prior art

### `HammerModule` and `HammerGesturesPlugin` (Read, git history)

- What it did: `HammerGesturesPlugin` was an `EventManagerPlugin` whose `supports()` matched a fixed `EVENT_NAMES` table of Hammer gestures (`pan`, `panstart`, `pinch`, `swipe`, `tap`, ...) plus names a `HammerGestureConfig` declared, lazily loaded Hammer.js through `HAMMER_LOADER`, and bound gestures as `(swipe)="..."` (`git show f99e7ed20f^:packages/platform-browser/src/dom/events/hammer_gestures.ts`, `EVENT_NAMES` at line 28, `supports` at 198, `isCustomEvent` at 292).
- Made opt-in: `de8ebbdfd0` "feat(ivy): make Hammer support tree-shakable (#32203)", 2019-08-19, first in `9.0.0`. From then the plugin was registered only by importing `HammerModule`.
- Deprecated: `a980ac9a6a` "refactor(platform-browser): Deprecate the HammerJS integration (#60257)", 2025-03-06, first in `20.0.0` (`20.0.0-next.2`). Its message, and the PR body fetched with `gh api`, say only "HammerJS support is deprecated and will be removed in a future major version"; the JSDoc says "Replace it by your own implementation."
- Removed: `f99e7ed20f` "refactor(platform-browser): remove Hammer integration", 2026-03-06, first in `22.0.0-next.5`, with "BREAKING CHANGE: Hammer.js integration has been removed. Use your own implementation." It deleted 596 lines including `hammer_gestures.ts` (`CHANGELOG.md:872`).
- Why: neither commit gives a reason beyond the above. Inferred: Hammer.js's last release is `2.0.8`, published 2016-04-22 (`registry.npmjs.org/hammerjs`, `time["2.0.8"]`), and Pointer Events replace it; the extension point (`EVENT_MANAGER_PLUGINS`) stayed public and documented, so the framework moved the plugin out rather than the mechanism.
- Relevance: it is the closest precedent for a framework-blessed plugin that maps template event names onto a third-party library's events, using a fixed name table plus a configurable extension, the same shape a Yeti plugin would have.

### Third-party packages (Read, npm registry and the 5.1.0 tarball)

- `@taiga-ui/event-plugins` 5.1.0 (registry `modified` 2026-09-14; peers `@angular/core` and `@angular/platform-browser` `>=16`, `rxjs >=7`), the successor of `@tinkoff/ng-event-plugins` (last 3.2.0, registry `modified` 2024-04-10; peers `>=12`). Repository `github.com/taiga-family/ng-event-plugins`. Modifiers `.stop`, `.prevent`, `.self`, `.zoneless`, `.capture`, `.passive`, `.once`, `.debounce~<t>`, `.throttle~<t>`, `resize`, `longtap`, and a `>` global-target syntax (`(document.body>scroll)` style) that avoids the colon and lets any `window` property path be a target (`fesm2022/taiga-ui-event-plugins.mjs`, `GlobalEventPlugin`, modifier `'>'`). Its `LongtapEventPlugin` dispatches its own `CustomEvent<{clientX, clientY}>` named `longtap` and binds it as `(longtap)`: a plugin plus a custom event with typed `detail`, the closest package-level precedent for option 1. It ships `web-types.json` for editor completion; it does not augment `HTMLElementEventMap`.
- No package was found that maps colon-named library events (`MDCSlider:change`, `yeti:*`) onto template names.

### Issues and articles

- `material-components/material-components-web#4221`, "Event names are incompatible with Angular templates" (2019; repository archived 2025-01-13). `(MDCSlider:change)` failed at runtime in Angular 7 (`Unsupported event target null for event change`); the reporter re-emitted events under kebab names such as `mdc-slider-change`. Fetched with markdown.new.
- `webcomponents/custom-elements-everywhere#986` (2021, open): asks for a test of colon event names because Angular cannot bind them, and notes the convention goes back to jQuery UI. Fetched with markdown.new.
- Articles that build a plugin (found by web search; content summarised by the search tool, not fetched in full): Netanel Basal, "Lifting the Veil: Insights into Angular's EventManagerPlugin" (netbasal.com); "Event management on steroids" (angularspace.com), which notes `EventManagerPlugin` became public API in Angular 17 and points to Taiga's package; "Supercharge event management in your Angular application" (angular.love); "Unlocking the Power of Custom Event Manager Plugins in Angular" (medium.com/@sankarums); Sean Larkin's Angular 2 era gist for click-outside and "Hacking Angular2: binding multiple DOM events" (medium.com/@TheLarkInn). From the summaries, none of them handles colon names (not verified against the full texts).

## Option 3: a platform-level re-dispatcher (`yeti:*` -> `yeti-*`)

Measured with `provideYetiRedispatch()` in the probe: an environment initializer that adds one capturing listener on `document` per Yeti event name and, for each, dispatches `new CustomEvent('yeti-' + name, { bubbles, composed, cancelable, detail })` (copied from the original) on `event.composedPath()[0]`.

- **Works:** `(yeti-slide)` on the `.carousel` fired, with `$event.detail.index` correct, `$event.bubbles` and `$event.composed` both `true`, and `$event.detail.slide` the same element object as Yeti's (identity kept, because `detail` is passed by reference). Measured.
- **Keeps `detail`, `bubbles`, `composed`:** only because the re-dispatcher copies them; a `CustomEvent` defaults to `bubbles: false, composed: false, detail: null` (Read, DOM standard behaviour; Inferred for this design). `isTrusted` is `false` on both events, since Yeti's events are script-made too (Inferred).
- **Order:** the re-dispatched event ran to completion inside the original's capture phase, before the original reached a bubbling `document` listener (Measured: `re:yeti-slide` logged before the original's bubble-phase log). So for `yeti:close` on an alert, a `(yeti-close)` handler still runs before Yeti removes the element (Inferred from `alert.js:17` dispatching before removal).
- **Zoneless:** works (Measured, no Zone.js).
- **SSR:** builds and renders (Measured). On the server the initializer adds listeners to the per-request server document; nothing dispatches there (Inferred). A browser-only guard would avoid that.
- **Hydration and event replay:** the re-dispatcher exists only after the app's injector is created, so a Yeti event dispatched before bootstrap is lost (Measured: the inline-script dispatch got no `re:` copy). Event replay does not help, since `yeti-*` is not an early event type (Read and Measured, as under option 1). Measured: a `yeti:slide` dispatched at `DOMContentLoaded` was seen by all three options, so the window of loss is the time before the app bootstraps, not all of hydration.
- **Type checking:** `$event.detail` is typed through a `HTMLElementEventMap` augmentation (`'yeti-slide': CustomEvent<YetiSlideDetail>`). Measured: `$event.detail.nope` failed the build with `TS2339: Property 'nope' does not exist on type 'YetiSlideDetail'`, and `$event.detail.index` compiled.
- **Consumer writes:** `provideYetiEvents()` (name hypothetical) once, then `(yeti-close)="..."` anywhere, including on ancestors (the copy bubbles) and in `host`.
- **Cost per event:** one extra `CustomEvent` allocation and one extra dispatch through the whole propagation path for every Yeti event on the page, whether or not anything binds it; six permanent `document` listeners (Inferred from the design).
- **When Yeti adds an event:** the DOM has no "listen to every type with this prefix" API, so the list of names is fixed in the package; a new Yeti event is silently not re-emitted until the package adds it, and its type entry too (Inferred).
- **Other effects:** every page gets a second, differently named copy of every event, visible to any non-Angular listener; if option 1 also claims `yeti-*`, handlers fire twice (Inferred). Shadow DOM: `composedPath()[0]` is the original target inside a shadow root, so the copy starts where Yeti's did (Inferred; not probed).

## Option 4: a directive per Yeti element (baseline)

Measured with `ProbeCarousel` (`[probeCarousel]`, `slide = output<YetiSlideDetail>()`, `addEventListener('yeti:slide', ...)` on its host in the constructor):

- **Works:** `(slide)="..."` received `$event.index` for both the `DOMContentLoaded` dispatch and the click (Measured).
- **Zoneless:** works (Measured); the output's template subscriber goes through Angular's wrapped listener (Read, `listeners.ts`).
- **SSR:** builds and renders (Measured); the constructor's `addEventListener` runs against the server element and never fires (Inferred). Using `Renderer2.listen` or a `host: { '(...)': ... }` listener instead is not possible for the colon name in `host`, but `Renderer2.listen(el, 'yeti:slide', ...)` works (Read, as above).
- **Event replay:** same as the others: an event before the directive is created is lost (Measured).
- **Type checking:** the output's generic types `$event` directly as the `detail` payload, with no global augmentation (Measured: the template read `$event.index`; Read: outputs are typed by `output<T>()`).
- **Consumer writes:** the directive on the element (`<div class="carousel" yetiCarousel (slide)="...">`), likely already present if the package wraps each component; the output name can drop the `yeti:` prefix and the `detail` wrapper.
- **When Yeti adds an event:** each new event needs a new `output()` on the right directive and a release; until then consumers fall back to `Renderer2.listen` or `addEventListener` (Inferred).
- **Cost:** one listener per element instance, only where the directive is used; nothing on pages without it (Inferred).

## Alias syntax under option 1: dot versus dash

The ticket's options are the plugin, prior art, the re-dispatcher, and the directive. Inside option 1 the alias syntax is a sub-choice: `(yeti.close)` mirrors `keydown.enter` and Taiga's modifiers; `(yeti-close)` matches the re-dispatcher's names and the unclaimed-event exemption. Both compile (Read in the compiler; the dash form Measured). Neither keeps the colon.

## What was not measured

- Real Yeti modules: the probe dispatches Yeti-shaped events from a stand-in script copied from `carousel.js:43`, not Yeti's own `dist/yeti.js`.
- Shadow DOM targets, incremental hydration (`@defer` with hydrate triggers), and a `(yeti.close)` dot alias.
- Behaviour under Zone.js (the probe is zoneless only).
