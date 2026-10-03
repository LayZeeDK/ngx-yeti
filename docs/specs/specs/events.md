# Spec: Events (shared spec)

Ticket: [Spec: Events (shared spec)](../issues/40-spec-events.md). Targets Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Accessibility target: WCAG 2.2 AA.

This is a **Shared-utility spec** ([CONTEXT.md](../CONTEXT.md)). It owns no item and no directive. It owns the exported `detail` types, the output names, and the rules that every item spec follows when it maps one of Yeti's six **Events** to an `output()`. The item specs (`alert`, `dialog`, `tabs`, `carousel`, `field`, `toc`) own the directive each output sits on and when exactly it fires. Every decision below cites the record that made it. The points no record settled were decided on 2026-10-03 by the orchestrator in full AFK mode, in [ticket 50](../issues/50-decide-open-points-of-the-specs.md); each is marked "(decided in ticket 50)" and listed under `### Open` in this spec's ticket.

## Problem Statement

Yeti's optional **Modules** report what they did through `yeti:*` DOM events: `yeti:close` on an alert and on a dialog, `yeti:open` on a dialog, `yeti:select` on tabs, `yeti:slide` on a carousel, `yeti:invalid` on a form, and `yeti:current` on a toc. Each is a bubbling, composed, non-cancelable `CustomEvent`. Its name, its target, and its `detail` keys are frozen from `7.0.0-beta` (Yeti's stability guide, "Event names"). An Angular developer who uses Yeti through ngx-yeti cannot use them as Yeti documents:

- An Angular template cannot bind `(yeti:close)`. The compiler splits an event name at its first colon into a global target and an event, accepts only `window`, `document`, and `body` as targets, and fails the build with "Unexpected global target 'yeti'". This applies to `host` listeners too ([Research: binding Yeti's `yeti:*` events in Angular templates](../issues/16-research-yeti-events-in-angular-templates.md), measured).
- The package replaces every Module and loads none beside it ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)), so nothing dispatches the `yeti:*` events at all once the package is in use.
- A listener added in code with `addEventListener` gives an untyped `detail`. It is lost before the listener exists, and it does not refresh a zoneless view unless it writes a signal ([Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md), measured).
- No `yeti:*` event is ever replayed by Angular's event replay, by any mechanism ([ticket 16](../issues/16-research-yeti-events-in-angular-templates.md), measured; [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) consequences).

Without one shared rule, each item spec would choose its own output names, payload shapes, and replay story, and a developer would learn six different conventions for one concept.

## Solution

Every `yeti:*` event an item's Module would have dispatched becomes an Angular `output()` on the directive that replaces that Module. It is named by the event's verb without the prefix and typed by the event's frozen `detail` keys. A developer writes `(select)`, `(slide)`, `(current)`, `(invalid)`, `(opened)`, or `(closed)` on the item's element, as with any Angular output. `$event` is typed with no global augmentation, and nothing runs on pages where the directive is absent ([building-blocks.md](../building-blocks.md) 1.4 and Part 2 row 52; [architecture-guide.md](../architecture-guide.md) P30).

The package exports one type per frozen `detail`: `YetiSelectDetail`, `YetiSlideDetail`, `YetiInvalidDetail`, and `YetiCurrentDetail`. `yeti:open` and both `yeti:close` events carry no `detail`, so their outputs are `void`. The package dispatches no DOM event of its own, `yeti:*` or otherwise. It registers no event-manager plugin alias and no re-dispatcher ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md) consequences; [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); map, Standing rulings, Prefix: "The package dispatches no DOM events of its own, because Yeti owns `yeti:*`").

## User Stories

1. As an application developer, I want to listen to a Yeti event in my template with ordinary Angular output syntax, so that I do not hit the "Unexpected global target 'yeti'" compile error.
2. As an application developer, I want each output named by Yeti's verb without the `yeti:` prefix, so that Yeti's documentation maps onto the package by removing five characters.
3. As an application developer, I want `$event` on `(select)` typed as `{tab, panel}`, so that a misspelt key fails to compile.
4. As an application developer, I want `$event` on `(slide)` typed as `{index, slide}`, so that I can read the chosen slide's index without a cast.
5. As an application developer, I want `$event` on `(current)` typed as `{link, heading}`, so that I can sync my own UI with the toc's current link.
6. As an application developer, I want `$event` on `(invalid)` typed as `{controls}`, so that I can react to a refused submit with the controls that failed.
7. As an application developer, I want `(opened)` and `(closed)` on a dialog to carry nothing, so that the binding is as simple as Yeti's `yeti:open` and `yeti:close`.
8. As an application developer, I want `(closed)` on an alert, so that I know when to remove it with my own `@if`.
9. As an application developer, I want the payload keys to be exactly Yeti's frozen `detail` keys, so that code I port from a `document.addEventListener('yeti:select', ...)` listener keeps reading `tab` and `panel`.
10. As an application developer, I want the `detail` types exported by name, so that I can type my own handler methods and signals.
11. As an application developer, I want no global `HTMLElementEventMap` augmentation from the package, so that the package does not change how other libraries' events are typed in my templates.
12. As an application developer, I want an output to exist only on the directive that replaces the Module that dispatched the event, so that I find it where Yeti's docs put the event.
13. As an application developer, I want outputs to cost nothing on pages without the directive, so that the package adds no document-level listeners for events.
14. As an application developer, I want the package to dispatch no `yeti:*` DOM event, so that no hidden second copy of an event runs through my page.
15. As an application developer using zoneless change detection, I want my output handler to refresh my view when it writes a signal, so that events work without zone.js.
16. As an application developer, I want each output to report a choice, as Yeti's events do, so that `(slide)` fires when the user picks a slide, not when the scroll ends.
17. As an application developer, I want a separate completion output where an item spec has one, so that I can act after a transition has finished.
18. As an application developer, I want `[(model)]` two-way state beside the output where Yeti exposes state as both an attribute and an event, so that I can bind the state instead of tracking it from events.
19. As an application developer, I want the model's `xChange` and the event's output never to collide in name, so that both stay bindable on one element.
20. As an application developer, I want no `on`-prefixed output names, so that names follow Angular's and Material's style.
21. As an application developer, I want one naming form per item, so that I do not guess between `select` and `selected` on the same directive.
22. As an application developer, I want state found at creation to fire no output that stands for a Yeti event, so that a page that renders a tab selected or a dialog open does not fire `select` or `opened` on load, while a two-way binding still hears once of a state that differs from its bound value (ticket 50 decisions 146 and 199).
23. As an application developer, I want the spec of each item to say whether its output fires for a change I make through a method or the model, so that I can predict feedback loops (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
24. As an application developer using SSR, I want outputs never to fire on the server, so that my handlers do not run during server rendering.
25. As an application developer using event replay, I want to know that no `yeti:*` event replays, and which native events reach a package handler late and then emit, so that I can plan for activity before hydration.
26. As an application developer using a `dialog` opened before hydration, I want the documentation to say that its `close` is not replayed, so that I do not expect a `(closed)` for a close that happened before hydration.
27. As an application developer using `@defer` with a hydrate trigger, I want outputs inside the block to start emitting once the block hydrates, so that deferred widgets behave like eager ones after hydration.
28. As an application developer using `hydrate never`, I want to know that outputs never fire there, while the platform's own behaviour still works, so that I do not depend on them in static regions.
29. As an application developer with JavaScript off, I want every item to stay usable without its outputs, so that events are a notification layer and not a requirement.
30. As an application developer using `withI18nSupport()`, I want outputs to behave the same in translated builds, so that localisation does not change event behaviour.
31. As an application developer, I want a handler that reads `$event.panel` on `(select)` to get the panel element, so that I can focus or scroll it myself.
32. As an application developer, I want `(slide)`'s `index` to be the slide's position among the carousel's own slides, so that it matches Yeti's `slides.indexOf(slide)`.
33. As an application developer migrating from Yeti's install guide example that writes the selected tab's id into the URL, I want the same code to work from `(select)`, so that the migration is mechanical.
34. As an application developer, I want a Yeti pin move that adds an event to reach me as a new output in a package release, so that the frozen-surface promise ("an event may be added; none will be renamed or lose a key") holds through the package.
35. As an application developer, I want removing a key from a `detail` type to be impossible without a breaking release, so that my handlers do not break silently.
36. As a package maintainer, I want the contract check to fail when a manifest event has no output, so that a pin move that adds an event cannot ship unmapped.
37. As a package maintainer, I want one place that lists the six events, their outputs, and their payload types, so that item specs cite it instead of restating it.
38. As a package maintainer, I want item directives to emit through `output()` only, never `EventEmitter`, `@Output`, or `dispatchEvent`, so that the API is signal-era Angular throughout.
39. As a package maintainer, I want a veto expressed as a predicate input, never a cancelable output, so that outputs stay notifications, as Yeti's non-cancelable events are.
40. As a package maintainer, I want outputs and their payloads covered by the four test layers, so that a regression in naming, typing, or timing is caught.
41. As an accessibility tester, I want outputs to add no ARIA, focus, or live-region behaviour of their own, so that accessibility is owned by the item directives and checked there.
42. As a non-Angular script author on the same page, I want to know that `document.addEventListener('yeti:select', ...)` no longer fires under the package, so that I move that code to the output or raise an issue (ADR 0040 makes a DOM event a later decision).
43. As a Storybook reader, I want each item story with an output to show it firing in the Actions panel, so that the event contract is visible in the docs.
44. As an application developer, I want `exportAs` on every directive that carries an output, so that I can reach the directive's model and methods beside the output from my template.

## Implementation Decisions

### 1. Yeti contract

Yeti's events, read at `f52d1e8b9` in `src/guides/install.md:154-176`, `src/guides/stability.md:21`, and the Modules ([ticket 16](../issues/16-research-yeti-events-in-angular-templates.md); [Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md)):

| Event | Module | Dispatched on, and when | `detail` | Source |
| --- | --- | --- | --- | --- |
| `yeti:close` | `alert.js` | the `.alert`, after the fade, before removal | none | `alert.js:17` |
| `yeti:open` | `dialog.js` | the `dialog`, a task after a `show-modal` command, once open | none | `dialog.js:49` |
| `yeti:close` | `dialog.js` | the `dialog`, on every `close` | none | `dialog.js:72-75` |
| `yeti:select` | `tabs.js` | the `.tabs`, on a click, an arrow key, or a hash reveal; not for the load pass | `{ tab, panel }` | `tabs.js:26-35`, `:76-80` |
| `yeti:slide` | `carousel.js` | the `.carousel`, on a dot click it handled; "about the choice, not the arrival" | `{ index, slide }` | `carousel.js:38-47` |
| `yeti:invalid` | `validate.js` | the `form`, when a submit is refused | `{ controls }` | `validate.js:62` |
| `yeti:current` | `toc.js` | the `.toc`, when the mark moves | `{ link, heading }` | `toc.js:36` |

Every one is `bubbles: true, composed: true`, and none is cancelable: "by the time one is dispatched the module has already acted" (`install.md:176`). The frozen surface is the names, the targets, and the `detail` keys; "An event may be added; none will be renamed or lose a key" (`stability.md:21`). The value types of the keys are not frozen in words. Yeti dispatches elements (`tabs.js:34`, `carousel.js:46`, `toc.js:36`, `validate.js:62`). Yeti's `yeti.d.ts` declares no event or `detail` type (checked: no match for `Detail`, `CustomEvent`, or `yeti:` in any `.d.ts` of the clone), so the package declares its own (below). Four Modules dispatch nothing: `demo.js`, `hover.js`, `range.js`, `enter.js` (ticket 03).

### 2. Contract mapping

One row per event. The output sits on the directive that replaces the Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md) consequences; [building-blocks.md](../building-blocks.md) 1.4, Part 2 rows 23, 29, 31, 33, 40, 41, 52):

| Event | Output | Payload type | Directive (owning spec) | Record |
| --- | --- | --- | --- | --- |
| `yeti:close` on `.alert` | `closed`, fired on the dismissal, after the close part moved focus; not a **Completion output**, because the consumer's removal and its leave transition follow it | `void` | `[yetiAlert]` (`alert`) | Part 2 row 23; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 100 |
| `yeti:open` on `dialog` | `opened` | `void` | `dialog[yetiDialog]` (`dialog`) | row 31; [ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md) consequences |
| `yeti:close` on `dialog` | `closed` | `void` | `dialog[yetiDialog]` (`dialog`) | row 31; ADR 0021 |
| `yeti:select` on `.tabs` | `select` | `YetiSelectDetail` | `[yetiTabs]` (`tabs`) | row 40 |
| `yeti:slide` on `.carousel` | `slide` | `YetiSlideDetail` | `section[yetiCarousel]` (`carousel`) | row 29 |
| `yeti:invalid` on `form` | `invalid` | `YetiInvalidDetail` | `form[yetiForm]` (`field`) | row 33; architecture-guide P20 |
| `yeti:current` on `.toc` | `current` | `YetiCurrentDetail` | `nav[yetiToc]` (`toc`) | row 41; [ADR 0025](../adr/0025-toc-finds-its-headings-from-its-links.md) point 5 |

The exported `detail` types (Part 2 row 52; value types from [architecture-guide.md](../architecture-guide.md) P10, P13, P26, and P30's preferred shapes, and from the elements Yeti dispatches):

| Type | Keys and value types |
| --- | --- |
| `YetiSelectDetail` | `tab: HTMLElement`; `panel: HTMLElement \| null` (P13, P30) |
| `YetiSlideDetail` | `index: number`; `slide: HTMLElement` (P10's preferred `output`) |
| `YetiCurrentDetail` | `link: HTMLAnchorElement`; `heading: HTMLElement` (from `toc.js:36`; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| `YetiInvalidDetail` | `controls: readonly HTMLElement[]`, the invalid controls in document order (from `validate.js:62`; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |

Each type is a read-only object type whose keys are exactly Yeti's frozen keys, no more and no fewer. A Yeti pin move that adds a key adds it to the type in the release that moves the pin; removing a key is impossible while Yeti keeps it, because the key is frozen. The types are TypeScript-only and emit no runtime code.

**Module replaced:** none here. Each item spec carries its own "Module replaced" subsection and lists the event among the module's behaviours it keeps ([building-blocks.md](../building-blocks.md) 1.14 item 2). This spec decides only what all of them share: the event becomes an output, and the DOM event is gone.

**Outputs that map no Yeti event:** `[yetiDropdown]` and `nav[yetiNav]` declare `opened` and `closed` (Part 2 rows 32 and 34), although `hover.js` and the nav dispatch no event. They follow the naming and payload rules of this spec, and their spec owns them.

**Tokens:** none. Events read and write no `--yeti-*` token.

### 3. Hierarchy and DI shape

None. The events spec adds no directive, service, injection token, provider, or host directive. An output lives on the item directive or the part directive that its item spec names. Where a part detects the change and the root carries the output, the part reaches the root through the item's parent token ([building-blocks.md](../building-blocks.md) 1.9), as the alert's close button does for the root's `closed` (row 23). "A part-level output is `void`; a root-level output carries the part" (1.4).

### 4. API

Rules every item spec applies:

1. **Declaration.** `readonly <name> = output<T>()`, from `@angular/core` (`NGP/core/src/authoring/output/output.ts:69`, Part 2 row 52). No `@Output`, no `EventEmitter`, no `outputFromObservable` ([architecture-guide.md](../architecture-guide.md) P10 public API rule).
2. **Names.** The event's verb without the prefix: `select` (or `selected`), `slide`, `current`, `invalid`, and `opened` and `closed` for `yeti:open` and `yeti:close` ([building-blocks.md](../building-blocks.md) 1.3). One form per spec. The form is chosen so that the output does not share a class member name with a method of the same directive (`select()`, `open()`, `close()`), and does not collide with a model's `xChange` (1.3). Never an `on` prefix, never `yetiSelect` (architecture-guide P13).
3. **Payload.** The output's type is the event's `detail` type from section 2, or `void` where the event has no `detail` (1.4).
4. **Where.** On the directive that replaces the Module that dispatched the event, which is the element Yeti dispatched it on (ADR 0040 consequences). An item with no Module declares no output for a Yeti event. `enter` declares none, because Yeti's `enter` declares no event ([ticket 26](../issues/26-decide-yeti-data-attributes-mapping.md)).
5. **No DOM event.** The directive does not also dispatch `yeti:*`, nor any other `CustomEvent`. A consumer who needs the DOM event for non-Angular code raises an issue; that is a later decision (ADR 0040 consequences).
6. **No plugin and no re-dispatcher.** The package registers nothing in `EVENT_MANAGER_PLUGINS` and installs no document listener that copies `yeti:*` to `yeti-*` ([building-blocks.md](../building-blocks.md) 1.4; P30). The reasons: a plugin never sees `(yeti:select)` because the compiler fails first; the alias and the re-dispatcher type `detail` only through global augmentation or not at all; the re-dispatcher costs one event per Yeti event on every page; and none of the three replays (ticket 16, measured in Chromium).
7. **Choice, not arrival.** An output that maps a Yeti event fires when Yeti's would have: on the choice the user or the platform made, not when a transition or a scroll ends (`carousel.js:38-41`; [building-blocks.md](../building-blocks.md) 1.4). A completion output, where a spec has one, fires after the transition, by 1.6 rule 1 (transition end filtered by target, with a fallback timer from the computed duration plus 100 ms). The dialog's, dropdown's, and nav's `opened` and `closed` are completion outputs: they fire after the transition, as CONTEXT.md and 1.4 say, and Part 2 row 31 is corrected to match (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
8. **Models beside outputs.** Where Yeti exposes state as both an attribute and an event, the item has a `model()` as well as the output: the tabs' selection, the dialog's open state (`isOpen`), the toc's current link (1.4). The carousel's index is not one of them: the carousel has a read-only `current` signal beside `slide`, and no model ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121). The model's `xChange` and the event's output are separate members with different names (1.3). The toc's row names both a `current` model and a `current` output, which cannot both be class members: the output keeps `current`, and the toc spec gives the model another name (for example `currentLink`, with `currentLinkChange`) (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
9. **When an output fires.** State found when the directive is created emits no output that stands for a Yeti event (`opened`, `closed`, `select`, `slide`, `current`): Yeti's tabs skip the load pass (`tabs.js:26-27`), and open state is read once at creation (map, Standing rulings, Open state; [ADR 0021](../adr/0021-dialog-is-a-directive-on-the-native-dialog.md)). A change the directive makes in a handler emits. A public method call (`close()`, `select()`) emits, as Yeti's `yeti:close` fires on every dialog close (`dialog.js:72-75`); a write through the model's input binding does not, as `model()` emits no `xChange` for a parent write (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). A model's `xChange` is the exception at creation: it emits once where the element's state differs from the bound value (decision 146: the dialog's, the dropdown's, and the nav's `isOpenChange`) and where the package writes a default (decision 199: the tabs' `selectedChange`).
10. **No veto.** No output is cancelable. Where a consumer must veto a close, the item spec adds a predicate input (Material's `closePredicate`), beside the platform's own `cancel` on a dialog ([building-blocks.md](../building-blocks.md) 1.4).
11. **Zoneless.** An output emitted from a `host` listener marks the view for check through Angular's wrapped listener. Package state that an output reports is a signal, so a zoneless view reads it (1.5; ticket 18, measured; ticket 16 measured an output working zoneless).
12. **`exportAs`** is on every directive, by the user's ruling of 2026-09-29, carried over (map, Input naming). This spec adds none.

Exported names: `YetiSelectDetail`, `YetiSlideDetail`, `YetiInvalidDetail`, `YetiCurrentDetail`. They are not prefixed `NgxYeti`, because none collides with a `yeti.d.ts` export (ADR 0080 point 4; checked above). They are exported from one type-only `ngx-yeti/events` entry point (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)), imported by type by the item entry points, matching the other shared-utility specs (`ngx-yeti/navigation-close`, `ngx-yeti/fragment-links`, `ngx-yeti/generated-ids`; Part 2 rows 50, 51, 53).

### 5. Material comparison

| Concept | Material (`NC/src/material/`, 22.2.x) | ngx-yeti |
| --- | --- | --- |
| Selection changed | `MatTabGroup.selectedTabChange` with a change event object, and `selectedIndexChange` (`tabs/tab-group.ts:274`, `:284`) | `select` with `YetiSelectDetail`, plus the tab list's `selected` model (row 40) |
| Open state two-way | `MatDrawer.openedChange` (`sidenav/drawer.ts:311`), `MatSelect.openedChange` (`select/select.ts:569`) | `isOpenChange` from the `isOpen` model (rows 31, 32, 34) |
| After a transition | `MatExpansionPanel.afterExpand`, `afterCollapse` (`expansion/expansion-panel.ts:124`, `:127`) | completion outputs `opened` and `closed` ([CONTEXT.md](../CONTEXT.md), Completion output; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| Event style | `@Output()` with `EventEmitter` or `Observable` | `output()` only (P10) |
| Veto | `closePredicate` (dialog) | predicate input on the item, never a cancelable output (1.4) |

Material emits an object per change with the source component. ngx-yeti keeps Yeti's frozen `detail` keys instead, so Yeti's documentation and ported listeners read the same keys.

### 6. Implementation level and primitives

Custom Angular, level 4: Angular's `output()` ([building-blocks.md](../building-blocks.md) Part 2 row 52, "Angular `output()`"). No platform feature, no Aria pattern, and no CDK primitive carries a typed component event. The platform's `CustomEvent` is what the package replaces, because a template cannot bind its name (ticket 16, measured).

### 7. ARIA and keyboard

None. Outputs carry no role, state, name, focus rule, or key. Yeti's events are notifications after the Module has acted (`install.md:176`), and the outputs are the same. Focus and announcements are the item directives' (the dialog's focus return, the alert's focus move, the field's focus on the first invalid control) and are checked in their specs. Ledger rows: none (Part 2 row 52).

### 8. Rendered HTML

Outputs render nothing. The server HTML and the hydrated DOM are the same with or without a bound output. A bound output adds no attribute, and `jsaction` appears only for native events in `host` metadata or templates, never for an output (ticket 16: the server HTML carried `jsaction="click:;"` only).

### 9. Animation

None of its own. Rule 7 above places outputs against Yeti's transitions: a choice output fires before the transition, and a completion output fires after it by 1.6 rule 1. Under `prefers-reduced-motion` a measured zero duration completes at once (1.6 rule 4).

### 10. Rendering modes

- **SSR and prerendering.** No output emits on the server. Handlers run only in the browser, and the package adds no listener before `afterNextRender` ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 4). Prerendering is SSR at build time and behaves the same.
- **Full hydration.** Outputs start to emit once the directive is hydrated. State present at creation, including a change the platform made before hydration and the directive reads once, emits nothing (rule 9).
- **Event replay.** No `yeti:*` event replays, and no output replays as such ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) consequences; [building-blocks.md](../building-blocks.md) 1.11). A native event in a `host` listener on Angular's replay list (a tab's `click`, a carousel dot's `click`, a `details` or popover `toggle`) reaches the package handler once the boundary hydrates, and the handler then emits: late, but once. A replayed `toggle` emits only on a real change: the handler compares the live state with the state the directive holds, and a toggle that the creation-time read already found emits nothing, as rule 9 says ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 91 and 97). A `dialog`'s `close` is never replayed (`upstream-bugs.md` A3), so a dialog closed before hydration emits no `closed`. Each item spec lists which of its outputs can fire from a replayed event.
- **Incremental hydration.** Inside `@defer (hydrate on ...)` the outputs emit after the block hydrates, as under full hydration.
- **Client `@defer`.** Content rendered on the client is set up by the directive when created (ADR 0040), so its outputs work from the first interaction.
- **`hydrate never`.** Outputs never emit. The platform's behaviour still works: the dialog opens, the `details` toggles, the carousel scrolls, every tab panel shows ([building-blocks.md](../building-blocks.md) 1.11 decision 7).
- **`withI18nSupport()`.** No effect on outputs. A component with `i18n` blocks needs it to hydrate rather than re-render, which keeps its directives and outputs (1.11).
- **Zoneless.** Required (map, Standing rulings, item 43). Outputs work zoneless (ticket 16, measured), and every state an output reports is a signal (rule 11).
- **JavaScript off.** No output ever fires, and nothing that depends on one is lost from the page: every item stays readable and its native controls keep working, by the user's ruling on JavaScript off (map, Standing rulings; ADR 0011 consequences). What is lost is the application's reaction to an event, which is application code.

### 11. Hydration constraints

The events spec complies with every constraint the user required (map, Standing rulings, Hydration constraints): outputs create no DOM, write no attribute, branch on no platform, and change nothing in the server HTML, so the server and the client render the same DOM.

### 12. Single-page application

None of its own. The tabs' hash reveal emits `select` as `tabs.js:76` did (row 40, through the fragment-links spec), and a dialog closed on navigation emits `closed` through its own close path ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)). Those are the item specs' to state.

### 13. Item file

None. The events spec is a utility without styles; it loads no item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

### 14. Accessibility (WCAG 2.2 AA)

Outputs touch no WCAG 2.2 AA success criterion directly: they render nothing and move no focus. The criteria an event-driven behaviour touches (2.4.3 Focus Order for the dialog's focus return, 3.3.1 Error Identification for the field's invalid controls, 4.1.2 Name, Role, Value for the tabs' selection) are met by the item directives and are cited in their specs. Ledger rows: none. The replacement of each event is like-for-like (ADR 0040 consequences: "a like-for-like replacement is not a ledger row").

## Testing Decisions

A good test asserts what a consumer observes: that `(select)` fires with the right `tab` and `panel` elements after a user action, not that a private field changed. It never asserts how the output is connected internally. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s; this spec owns the shared cases, and each item spec runs them for its own outputs.

- **Layer 1, story play functions** (`npx nx test-storybook <lib>`). Each item story with an output declares it in `argTypes` as an action, and the play function asserts that it fired, with its payload, after the interaction: `tabs--default` (click the second tab, `select` with that tab and its panel), `carousel--default` (click a dot, `slide` with its index), `dialog--default` (open and close, `opened` then `closed`), `alert--dismissible` (close, `closed`), `field--form-invalid` (submit an invalid form, `invalid` with the controls), `toc--default` (scroll, `current`). Story ids are the item specs'; these names are the expected form (`<item>--<story>`, building-blocks 1.3). Each play function also asserts that no `yeti:*` event reached a `document` listener.
- **Layer 2, browser-level** (`npx nx test <lib>`). Through `TestBed.createDirective(type, { tagName, bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note), with a test host only where a parent or content is needed: the output emits once per change the directive makes; it does not emit for state present at creation; it emits after a replay-shaped event, whose `preventDefault` throws, with the state already changed (1.12); a completion output fires after `transitionend` on the host and, with no transition, after the fallback timer; no `CustomEvent` is dispatched on the host or the document.
- **Layer 3, node-level** (`npx nx test <lib>`). Type tests for the four `detail` types with Vitest's `expectTypeOf`: exact keys, read-only, a misspelt key is a type error. The contract check over the built manifest ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) asserts that every event of every item's `js[].events` in `dist/yeti.manifest.json` has an output on the mapped directive, with the payload type's keys equal to the event's `detail` keys. A pin move that adds an event or a key fails here first. Each item's SSR smoke asserts that a bound output adds no attribute to the server HTML.
- **Layer 4, Playwright e2e** (`npx nx e2e <fixture-app>-e2e`). On the fixture app with `main.js` held back: a click on a tab before hydration produces one `select` after hydration (replay); a dialog closed with Escape before hydration produces no `closed` (A3, the stated residue); inside a `hydrate never` block a bound output never fires while the platform behaviour works. Chromium, Firefox, and WebKit in CI.

Prior art: ticket 16's probe (`ProbeCarousel` with `slide = output<YetiSlideDetail>()`), measured working zoneless and under SSR, and ticket 18's event-replay fixture.

## Out of Scope

- Dispatching any DOM event, `yeti:*` or a package-named one, for non-Angular code. ADR 0040 makes it a later decision on a consumer's request.
- An event-manager plugin, a `yeti-*` alias, or a re-dispatcher (building-blocks 1.4; P30).
- Replaying a `yeti:*` event, or an output, for activity before hydration (no mechanism exists; ticket 16).
- Outputs for items whose Module dispatches nothing (`demo`, `range`, `enter`, the hover trigger), except the `opened` and `closed` outputs their own specs declare.
- The exact moment each output fires on its item (an item spec's), beyond rules 7 and 9.
- Checks that a consumer binds an output correctly. Checks belong to a later milestone (map, Milestones).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Every `yeti:*` event becomes an `output()` on the directive that replaces its Module | [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md) consequences; map, The contract the package manages |
| Named by the verb without the prefix; `opened` and `closed` for open and close; no `on` prefix | [building-blocks.md](../building-blocks.md) 1.3; architecture-guide P13 |
| Typed by the frozen `detail` keys; part-level outputs `void` | building-blocks 1.4; Yeti `stability.md:21` |
| Four exported `detail` types | building-blocks Part 2 row 52 |
| No DOM event, no plugin, no re-dispatcher | ADR 0040; building-blocks 1.4; P30; ADR 0080 |
| Outputs mark the choice; completion outputs follow the transition | building-blocks 1.4, 1.6 rule 1; `carousel.js:38-41` |
| No cancelable output; veto by predicate input | building-blocks 1.4 |
| No output replays; replayed native events emit late | ADR 0011 consequences; building-blocks 1.11; ticket 16 |
| Zoneless by signals | map, Standing rulings, item 43; ticket 18 |

### Usage examples

Tabs, with a ported URL update from Yeti's install guide:

```html
<div yetiTabs (select)="onSelect($event)">...</div>
```

```ts
onSelect({ tab }: YetiSelectDetail): void {
  history.replaceState(null, '', `#${tab.id}`);
}
```

Dialog, with the model and both outputs:

```html
<dialog yetiDialog #confirm="yetiDialog" [(isOpen)]="confirmOpen" (opened)="log('open')" (closed)="log('closed')">...</dialog>
```

Alert removal by the consumer:

```html
@if (showAlert()) {
  <div yetiAlert role="status" (closed)="showAlert.set(false)">...</div>
}
```

What no longer compiles or no longer fires: `(yeti:select)` (compile error), `document.addEventListener('yeti:select', ...)` (the package dispatches nothing).

### Platform features to adopt when the target moves

None. The events spec relies on no platform feature outside the target and replaces the platform's `CustomEvent` only because Angular's template syntax cannot bind a colon-named event. If Angular's compiler ever accepts colon names on element targets, nothing changes: Yeti's Modules stay unloaded (ADR 0040), so there would still be no `yeti:*` event to bind.

### Single-page application pieces relied on

None directly. The tabs' hash reveal (fragment-links spec) and closing on navigation (navigation-close spec) produce `select` and `closed` through their item directives.
