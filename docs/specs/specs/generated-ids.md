# Spec: Generated ids (shared-utility spec)

Ticket: [39. Spec: Generated ids (shared spec)](../issues/39-spec-generated-ids.md). Targets Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) (the mechanism), [ADR 0042](../adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md) point 2 (the consumer's `id` wins; points 1, 3, and 4 are replaced), [Decide: hydration-safe generated ids](../issues/35-decide-hydration-safe-generated-ids.md), and [Prototype: hydration-safe generated ids](../prototypes/hydration-safe-ids/README.md). The points no record settled were decided on 2026-10-03 by the orchestrator in full AFK mode, in [ticket 50](../issues/50-decide-open-points-of-the-specs.md); each is marked "(decided in ticket 50)" and listed under `### Open` in this spec's ticket.

## Problem Statement

Yeti's items link their parts by id through the platform. A dialog's opener carries `commandfor` and the dialog its `aria-labelledby`; a dropdown's button carries `popovertarget`; a tooltip's trigger carries `aria-describedby`; a field's control carries `aria-describedby` to its hint and error. Yeti's docs ask the author to write every one of those ids by hand ([ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md)). In an Angular application that means a typo goes unreported, and ids must be made unique by hand across `@for` rows and projected content ([ADR 0042](../adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md), considered options). So the package's directives render these attributes themselves, with generated ids ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) point 5).

A generated id is harder than it looks in a server-rendered Angular application, and the user requires compliance with Angular's hydration constraints (map, Standing rulings, 2026-10-03: "54. Make sure that we always comply with [hydration constraints](https://angular.dev/guide/hydration#constraints)."). Ticket 35 measured three ways the obvious answers fail:

- CDK's `_IdGenerator` keeps its counters in module state, so one server process keeps counting across requests and interleaves concurrent ones, while each browser starts at 0. Angular Aria also adds a random infix that differs between the server and the client. Under full hydration, every one of the 28 ids and references on the test page was rewritten at hydration ([upstream-bugs.md](../upstream-bugs.md) row A6 for Aria's part).
- A counter per application, used alone, is right for full hydration but not for incremental hydration. The server does not number ids in document order: it numbered a `hydrate on` block's content before the content above it. The client skips the dehydrated block, so ids collide. Before the block hydrated there were 8 duplicate ids and 12 references that resolved to two elements. In a `hydrate never` block those duplicates stayed.
- Without the server's counts, ids the client creates fresh (a client-only `@defer`, a `@for` row added later) restart at 0 and repeat ids the server rendered: 8 duplicates after a client-only `@defer`, and 16 after two `@for` additions.

A duplicate id, or a reference that resolves to the wrong element, breaks the accessible name of a tab panel, the description of a control, and the target of an opener. An id that changes at hydration alters the server's HTML, which the hydration constraints forbid.

## Solution

One secondary entry point, `ngx-yeti/generated-ids`, exports two functions and nothing else (ADR 0044 point 1). Application developers never call either one: the consumer writes nothing new, and adds no provider, no setup entry, and no ids inside `hydrate` blocks (ADR 0044 point 5). The package's own directives call them.

- `injectYetiId(item)`, called in a directive's field initializer, returns the consumer's static `id` on the host if there is one. Otherwise it returns the host's current `id` if that id has the package's shape for this item, which means the server rendered the element and hydration claimed it. Otherwise it returns the next number of a per-application counter, for example `ngx-yeti-nav-0`.
- `provideYetiAriaIds()`, listed in the providers of the three package directives that host an Aria directive which generates an id, gives Aria the same counter and the same adoption. Aria keeps its own prefixes and loses its random infix.

The counter is one root service per application, so each server request counts from 0 and two concurrent requests render the same ids. The server's final counts go to the client in one `TransferState` key, and the client's counter continues from them. Measured in Chromium, Firefox, and WebKit under full hydration, `hydrate on`, `hydrate never`, a client-only `@defer`, a growing `@for`, zoneless, and two concurrent requests to one process: 0 rewrites, 0 duplicate ids, every reference resolved to exactly one element, and no `NG05xx` error (ticket 35).

The consumer's own `id` still wins, and anything addressed from outside the application (a fragment link, a `details name` group) still needs a consumer-written id (ADR 0042 point 2; [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 8).

## User Stories

1. As an application developer, I want every opener, panel, label, hint, and error the package links to get an id without my writing one, so that I cannot mistype a reference.
2. As an application developer, I want generated ids to be unique on the page across `@for` rows and projected content, so that every `aria-controls`, `aria-labelledby`, `aria-describedby`, `popovertarget`, `commandfor`, and `for` resolves to exactly one element.
3. As an application developer, I want my own static `id` on a host to win over a generated one, so that my deep links, CSS, and tests keep the id I chose.
4. As an application developer, I want every reference to my own id to use it, so that a part I named and the part that points at it stay linked.
5. As an application developer, I want the server and the client to render the same ids, so that hydration changes nothing in the HTML the server sent.
6. As an application developer, I want no `NG05xx` hydration error or warning caused by an id, so that my hydration stays clean in development builds.
7. As an application developer, I want two concurrent requests to one server process to render the same ids, so that server output does not depend on traffic.
8. As an application developer, I want each server response to count from 0, so that ids are short, readable, and stable between deploys.
9. As an application developer using incremental hydration, I want a `@defer (hydrate on ...)` block's ids to equal the server's before and after the block hydrates, so that references never point at two elements in between.
10. As an application developer using `hydrate never`, I want the block's ids to stay the server's and never collide with live content around it, so that its native behaviour keeps working.
11. As an application developer using a client-only `@defer`, I want its new ids to continue after the server's, so that they never repeat an id the server rendered.
12. As an application developer, I want `@for` rows added after hydration to get new ids that repeat nothing on the page, so that a growing list stays valid.
13. As an application developer whose app has no server rendering, I want ids to count from 0 with no setup, so that a client-only application works the same way.
14. As an application developer with zoneless change detection, I want ids generated the same way, so that the package works in the change-detection mode Angular recommends.
15. As an application developer using prerendering, I want the prerendered page's ids to be adopted at hydration exactly as server-rendered ids are, so that SSG behaves like SSR.
16. As an application developer using `withI18nSupport()`, I want translated components to keep their ids through hydration, so that localisation does not break references.
17. As an application developer with a non-default `APP_ID`, I want the application id in generated ids, as CDK does, so that two Angular applications on one page cannot collide.
18. As an application developer, I want to write no provider, no setup entry, and no ids inside `hydrate` blocks for any of this, so that hydration-safe ids cost me nothing.
19. As an application developer using the package's tabs, I want Aria's tab and tab-panel ids to be equal on the server and the client, so that each tab's `aria-controls` and each panel's `aria-labelledby` stay valid.
20. As an application developer using the package's buttons toolbar, I want Aria's toolbar-widget ids to be equal on the server and the client, so that the toolbar's server HTML is not rewritten.
21. As an application developer, I want Aria's ids to keep Aria's own prefixes (`ng-tab-`, `ng-tabpanel-`, `ng-toolbar-widget-`), so that they read as Aria's in the DOM and in tests.
22. As an application developer, I want the package not to change the ids of CDK, Aria, or Material components that the package does not host, so that the rest of my application is unaffected.
23. As an application developer, I want generated ids to be readable (`ngx-yeti-dialog-3`), so that I can find an element in DevTools and in a test failure.
24. As an application developer, I want generated ids to carry the item's name, so that I can tell which item rendered an element.
25. As an application developer, I want generated ids prefixed `ngx-yeti-`, so that they never collide with Yeti's `yeti` names or with my own ids.
26. As an application developer with JavaScript off, I want the server HTML to hold no duplicate ids and every reference to resolve, so that assistive technology reads the page correctly before any script runs.
27. As an application developer, I want the cost of the server's counts in the page to be small, so that the seed does not weigh on my HTML (about 100 bytes in the prototype).
28. As an application developer, I want to know which things need a consumer id (a deep link, a `details name` group, anything addressed from outside the application), so that I add an id only where one is required.
29. As an application developer, I want each item spec to state its id usage rules, so that I learn them where I use the item.
30. As a screen-reader user, I want every tab, panel, field, dialog, and tooltip relationship to name the right element, so that names and descriptions are announced correctly.
31. As a screen-reader user on a page that is still hydrating, I want relationships to be correct from first paint, so that early navigation reads the right labels.
32. As a keyboard user, I want an opener's `popovertarget` or `commandfor` to open the right panel before hydration, so that the platform's opening works at once.
33. As a package maintainer, I want one entry point to be the only place ids are made, so that a change to id generation is one file.
34. As a package maintainer, I want CDK's `_IdGenerator` imported in one file only, as the token Aria injects, so that a CDK rename breaks one place and one test.
35. As a package maintainer, I want a directive to read its host's `id` once, at creation, and never write or query another element, so that the read complies with the hydration constraints.
36. As a package maintainer, I want every generated id and every reference to one to be a host binding, so that the server output is the first paint and nothing is written outside Angular's bindings.
37. As a package maintainer, I want the counter's service unexported, so that no consumer depends on it and it can change.
38. As a package maintainer, I want one count per prefix, so that each item's ids number from 0 independently.
39. As a package maintainer, I want a test that renders the five hydration cases and compares server and client ids, so that a regression in Angular, CDK, or Aria fails before release.
40. As a package maintainer, I want a test that sends two concurrent requests to one server process, so that per-application counting is proven, not assumed.
41. As a package maintainer, I want the cases ticket 35 did not measure (a non-default `APP_ID`, prerendering, `withI18nSupport()`, a client-only application) measured by this spec's tests, so that the inferred behaviour becomes measured.
42. As a package maintainer, I want the item specs that render relationship attributes to use this entry point without restating its rules, so that the rules live in one spec.
43. As a package maintainer, I want the id shape to be a Runtime name under the prefix ruling, so that names stay consistent with `--ngx-yeti-*` and `data-ngx-yeti-*`.
44. As a package maintainer, I want no ledger row for generated ids, because ids are not a feature Yeti lacks, so that the ledger records only accessibility gains over Yeti.
45. As a package maintainer, I want the seed key named once (`ngx-yeti-ids`), so that it is easy to find in served HTML.
46. As a package maintainer, I want `provideYetiAriaIds()` listed on exactly the directives that host an id-generating Aria directive, so that its reach stays inside the package's items.

## Implementation Decisions

### Yeti contract

None. Yeti generates no id: its ids are the author's, written in each example page (ADR 0013; building-blocks Part 2 row 53, "Yeti module: none"). No manifest class, attribute, marker, event, or token belongs to this spec.

### Contract mapping

This spec maps no Yeti class, attribute, marker, event, or token. What it writes into the page are Runtime names and one transfer-state entry:

| What | Value | Record |
| --- | --- | --- |
| Generated id of a package directive | `ngx-yeti-<item>-<n>`, `<n>` counting from 0 per prefix and per application, for example `ngx-yeti-nav-0` | ADR 0044 point 1; [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 2 |
| Generated id with a non-default `APP_ID` | the `APP_ID` appended to the prefix, then `<n>`, as CDK does (CDK appends with no separator: `ngx-yeti-nav-shop0` for `APP_ID` `shop`, read in `id-generator.ts`) | ADR 0044 point 1, step 3 |
| Aria's ids on package-hosted elements | `ng-tab-<n>`, `ng-tabpanel-<n>`, `ng-toolbar-widget-<n>` on the same counter, no random infix | ADR 0044 point 1 |
| Transfer-state key | `ngx-yeti-ids`: an object of final counts per prefix, for example `{"ng-tab-":6,"ngx-yeti-label-":3}` (prototype, `server-adopt-on.html`) | ADR 0044 point 3 |
| References to a generated id | `popovertarget`, `commandfor`, `aria-controls`, `aria-labelledby`, `aria-describedby`, `for`: host bindings in the item directives, same value on both ends | ADR 0044 point 4; building-blocks 1.5 |

The `<item>` is the item's name as Yeti names it (ticket 11), or the part's name where an item has several generated ids; each item spec names the strings it passes.

### Hierarchy and DI shape

- **Entry point.** `ngx-yeti/generated-ids`, a secondary entry point (ADR 0011 clause 10), exporting `injectYetiId` and `provideYetiAriaIds` and nothing else (ADR 0044 point 1). No class, token, or type is exported. Entry points export no import arrays ([ADR 0018](../adr/0018-no-import-arrays-and-later-milestone-import-checks.md)).
- **Counter.** A root `@Service()` inside the entry point, not exported, holding one count per prefix. A root service exists once per application, and the server creates one application per request (ADR 0044 point 2; `service.ts:32`, read in ticket 35). It is the only service this spec adds, warranted because the counts are state shared across instances (building-blocks 1.5).
- **Seed.** On construction the service reads `ngx-yeti-ids` from `TransferState`; the key is absent on the server and in an application with no server HTML, so the counts start empty. On the server it registers an `onSerialize` callback for the same key that returns its counts, so the final counts are written once, when the page is serialised (ADR 0044 point 3).
- **Who calls `injectYetiId`.** The directive whose host renders the `id`, in a field initializer, because adoption reads that directive's own host (ADR 0044 point 1, step 2, and point 4). A part that refers to the id reads the value from that directive, through the item's Injection token or a reference input, and binds it as its own host attribute; it never calls `injectYetiId` for another element's id. Where the architecture guide's example has a coordinating directive generate an id that a part binds as `id` (the nav example), the part that renders the `id` calls it, and the guide's example is corrected to match (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
- **Who lists `provideYetiAriaIds()`.** `yetiTab` (hosting Aria `Tab`, `tab.ts:62`), `yetiTabPanel` (hosting `TabPanel`, `tab-panel.ts:73`), and the `buttons` part directive `yetiButtonsItem` (hosting `ToolbarWidget`, `toolbar/toolbar-widget.ts:70`), in their `providers` (ADR 0044 point 1 and its 2026-10-03 correction). Aria asks for the id in a field initializer with `inject(_IdGenerator).getId(prefix, true)` (read, components `708d4c6e2`), so an element-level provider of `_IdGenerator` is what it receives.
- **Reach of the element-level provider.** A directive's `providers` are visible to the element's content too, so an `_IdGenerator` request from a CDK, Aria, or Material directive inside a `yetiTabPanel` would also reach the package's object (read: Angular's element injector; inferred for this case, not measured). ADR 0044 rejects changing ids outside the package's items. This spec's reading: the object handles only the hosted Aria directive's own prefix (`ng-tab-` on `yetiTab`, `ng-tabpanel-` on `yetiTabPanel`, `ng-toolbar-widget-` on `yetiButtonsItem`) and passes any other call, with its arguments, to the parent injector's `_IdGenerator` (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
- **One import of `_IdGenerator`.** The entry point is the only file in the package that imports CDK's `_IdGenerator`, now only as the DI token Aria injects, not as the package's generator (ADR 0044 point 6).

### API

#### `injectYetiId(item: string): string`

Called in an injection context, in the field initializer of the directive whose host renders the id. Outside an injection context it throws Angular's own error. It returns, in this order (ADR 0044 point 1):

1. The consumer's static `id` on the host, read through `HostAttributeToken('id')`, optional (ADR 0042 point 2).
2. The host's current `id`, if it has the package's shape for this prefix: the prefix (with the `APP_ID` appended where it is not `ng`) followed by digits only. Such an element was rendered by the server and claimed at hydration, so the client keeps the server's id. The read is one `getAttribute('id')` on the directive's own host, once, at creation; it writes nothing and queries no other element (ADR 0044 point 4).
3. Otherwise, the next number of the per-application counter for the prefix `ngx-yeti-<item>-` (with the `APP_ID` appended where it is not `ng`).

The prototype's adopting counter encodes steps 2 and 3, and the seed, more precisely than prose (trimmed from `src/ids.ts`, ticket 35; prototype code, not the package's):

```ts
// Read once, at creation: a host claimed at hydration still carries the server's id here,
// because directives are created after the element is located and host bindings run later.
const served = host.getAttribute('id');

if (served !== null && served.startsWith(prefix) && /^\d+$/.test(served.slice(prefix.length))) {
  return served;
}

const n = this.#counts[prefix] ?? 0; // #counts starts from TransferState's 'ngx-yeti-ids', else {}
this.#counts[prefix] = n + 1;

return `${prefix}${n}`;
```

Why adoption is safe: at hydration Angular locates the server's element before it creates the element's directives (`element.ts:140-144`, `:331-345`, read), and host bindings run after, so the server's `id` is still on the host when the field initializer runs. An adopted id is always below the seeded count for its prefix, because the server counted it, so a fresh client id never repeats it (measured: 0 duplicates in every case).

Usage rules (stated in the JSDoc; the first milestone reports no breach, map, Milestones):

1. The calling directive binds the returned value as its host's `id` with a host binding, and every reference to it is a host binding (ADR 0044 point 4).
2. The returned value is read once and kept in a field; it never changes for the directive's life.
3. The consumer's id is a static `id` attribute. A bound `[id]` or `[attr.id]` on a host whose directive calls `injectYetiId` is not read by step 1 and competes with the directive's own binding, so it is unsupported (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
4. A consumer-written id does not start with `ngx-yeti-`, which is the package's Runtime name (ADR 0080 point 2); such an id could equal a number the counter later gives another element (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

#### `provideYetiAriaIds(): Provider`

Provides CDK's `_IdGenerator` on the listing directive's element. Its `getId(prefix)` applies steps 2 and 3 above with Aria's own prefix, adopting the host's server-rendered `ng-tab-<n>` (or `ng-tabpanel-<n>`, `ng-toolbar-widget-<n>`) and otherwise taking the next number of the same per-application counter. It ignores Aria's `randomize` flag (ADR 0044 point 1). It has no step 1: the package's Aria-hosting directives take no `id` input, because a host directive's input is bound only from the consumer's template (`directive-composition-api.md:33`, `:50`, read). So a consumer writes no `id` on `yetiTab`, `yetiTabPanel`, or `yetiButtonsItem`, and a deep link targets an element inside the panel instead (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). Calls with any other prefix go to the parent `_IdGenerator` (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md), as above).

#### What is not exported

The counter service, its `TransferState` key object, the shape test, and the Aria provider's factory stay internal. No Defaults token exists: nothing about ids is configurable (building-blocks 1.4).

### Comparison with Angular Material and CDK

| Concern | CDK `_IdGenerator` (Material, Aria) | `ngx-yeti/generated-ids` |
| --- | --- | --- |
| Counter scope | Module state, per process (`id-generator.ts:18`) | One per application, so one per server request |
| Concurrent SSR requests | Counts interleave (A `-22`, B `-23`, A `-24`, measured) | Identical ids per request (measured) |
| Random infix | Optional; Aria always asks for it (`getId(prefix, true)`) | None; Aria's flag is ignored on package-hosted elements |
| Server-rendered id at hydration | Replaced by a client id (28 to 42 rewrites, measured) | Adopted (0 rewrites, measured) |
| Client-created ids after hydration | Restart from the browser's module count | Continue from the server's counts through `TransferState` |
| `APP_ID` | Appended when not `ng` | Appended when not `ng`, as CDK does |
| Consumer id | Each component's `id` input | The host's static `id` attribute (ADR 0042 point 2) |
| Public API | `_IdGenerator`, outside the public API promise (leading underscore) | Two exported functions; the counter is internal |

Material components the consumer uses keep CDK's ids; the package changes only ids on its own items (ADR 0044, considered options: providing the replacement for the whole application was rejected).

### Implementation level and primitives

Building-blocks Part 2 row 53 places this spec at level 3, CDK: `_IdGenerator` stays the token through which Aria's ids reach the package's per-application counter. The counter itself is the package's own, over Angular's `@Service()`, `TransferState` with `makeStateKey` and `onSerialize` (`transfer_state.ts:134`), `HostAttributeToken`, and `ElementRef` for the one read. Why this level: it is the smallest design that gives equal ids on the server and the client with no consumer code, measured in three engines (ticket 35). The platform has no id generator, `@angular/core` has no public one in 22.2 (ADR 0042, considered options), and Aria's own generator is the cause of upstream bug A6.

### Accessibility

No WCAG success criterion is met by this spec alone, and it adds no ledger row: ids are not a feature Yeti lacks (ADR 0042 Consequences; ADR 0044 Consequences). It is what the relationship attributes of every other spec depend on:

- WCAG 2.2 4.1.2 Name, Role, Value and 1.3.1 Info and Relationships: `aria-labelledby`, `aria-describedby`, and `aria-controls` must name exactly one existing element. Under this spec they do, from the server HTML on and through every hydration case (measured, ticket 35).
- Ledger rows that rely on this spec without being its rows: A11Y-7 (`demo`'s grip `aria-controls` to the preview box's generated id) and A11Y-14 (`field`'s composed `aria-describedby` from the hint's and error's generated ids). Their specs own them.
- Duplicate ids: the server HTML holds none, so references resolve with JavaScript off (inferred in ticket 35 from the server HTML; this spec's e2e measures it).

### Rendered output

The consumer writes Yeti's markup with the package's directive attributes and no ids. Server HTML from the prototype's adopt mode (trimmed from `results/server-adopt-on.html`, ticket 35):

```html
<button role="tab" yetitab="" value="one" id="ng-tab-0" aria-selected="true" aria-controls="ng-tabpanel-0">
<div role="tabpanel" yetitabpanel="" value="one" id="ng-tabpanel-0" aria-labelledby="ng-tab-0">
<h3 yetilabel="" id="ngx-yeti-label-0">
<div role="region" yetilabelled="" aria-labelledby="ngx-yeti-label-0">
<!-- in the transfer-state script: -->
"ngx-yeti-ids":{"ng-tab-":6,"ng-tabpanel-":6,"ng-toolbar-widget-":6,"ngx-yeti-label-":3,"ngx-yeti-panel-":3}
```

The hydrated DOM is identical: no id or reference attribute changes (measured with a `MutationObserver` in three engines). A host with a consumer id renders that id, and every reference to it uses it.

### Animation

None. The entry point renders nothing and animates nothing.

### Rendering modes

- **Server output.** Generated ids and references are host bindings, so they are in the server HTML; each request counts from 0; the final counts are serialised into `ngx-yeti-ids`. No template branches on the platform, and the entry point has no platform check: the key's absence is what tells the server and a client-only application apart (ADR 0044 point 3).
- **Full hydration.** Every package-generated id is adopted; 0 rewrites (measured).
- **`@defer (hydrate on ...)`.** Before the block hydrates its ids are the server's and collide with nothing, because ids outside the block are also the server's; after it hydrates they are adopted; 0 rewrites (measured).
- **`hydrate never`.** The block keeps the server's ids for good, and live content around it never takes one of its numbers, because the client counts from the seed (measured).
- **Client-only `@defer`, `@if`, routed views.** Fresh ids continue after the server's counts (measured for `@defer`; `@if` and routes are the same path, inferred).
- **`@for` growing after hydration.** New rows get new numbers; 0 duplicates (measured).
- **Event replay.** The entry point declares no listener, so nothing replays and nothing waits for replay.
- **`withI18nSupport()`.** Not measured in ticket 35; inferred to behave as full hydration because it changes neither directive creation nor `TransferState`. This spec's SSR smoke and e2e measure it. Without `withI18nSupport()`, a component with `i18n` blocks is serialised with `ngSkipHydration` and re-rendered (ADR 0011 clause 11); its elements are then created fresh, take new numbers from the seed, and replace the server's DOM, so no reference dangles (inferred).
- **Prerendering.** Not measured in ticket 35; inferred the same as SSR, with the seed written at build time. Measured by this spec's e2e.
- **Zoneless.** Required (map, Standing rulings, 43); ticket 35 ran zoneless (no zone.js loaded, measured). Nothing here is read by a template after creation, so no signal is needed.
- **JavaScript off, under SSR and prerendering.** The server HTML has unique ids and resolving references, so every relationship attribute works for assistive technology and the platform's openers work (ADR 0011, 2026-10-03 note). Nothing is lost: the entry point has no client-only behaviour. A client-only application renders nothing with JavaScript off and promises nothing (map, Standing rulings, JavaScript off).
- **Hydration constraints.** Same DOM on both ends (measured); no direct DOM manipulation: one read of the directive's own host, no write, no query (ADR 0044 point 4, the same read-once pattern as the open-state decision); valid HTML, no duplicate ids; nothing depends on `preserveWhitespaces`; no output branched on the platform.
- **Hydration boundary.** Generated ids no longer require a widget and the parts its ids link to share one Hydration boundary (ADR 0011, 2026-10-03 note; CONTEXT, Hydration boundary). The shared-boundary rule (building-blocks 1.11 decision 6) stays for behaviour reasons, not ids ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 227; ADR 0011's note on clause 7).

### Single-page application

None. The counter lives for the application, not the route, so ids keep counting across navigations and stay unique. Fragment targets need consumer ids (ADR 0011 clause 8); fragment handling is the fragment-links spec's.

### Item file

None. The entry point has no styles and loads no Item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) applies to items only).

## Testing Decisions

Good tests here assert what the page shows: the `id` and reference attributes in the server HTML, in the hydrated DOM, and after client-side additions, never the counter's fields. Prior art is ticket 35's probe (`tools/probe35.mjs`): a `MutationObserver` installed before the page's scripts counts every `id`, `aria-controls`, and `aria-labelledby` write that changes a value, then lists duplicate ids and references that do not resolve to exactly one element. Four layers ([ADR 0014](../adr/0014-testing-stack-for-yeti.md); building-blocks 1.12), all zoneless.

### 1. Story play function

No story of its own: the entry point renders no markup and has no interaction (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). Its effect is covered by the item stories that render relationship attributes, whose axe run on the WCAG 2.2 AA rule set includes `aria-valid-attr-value`, which fails an ARIA id reference that names no element.

### 2. Browser-level test (Vitest browser mode, `npx nx test <lib>`)

Directive-level cases use `TestBed.createDirective(type, { tagName?, bindings? })`, which returns a `DirectiveFixture` (map, Standing rulings, 2026-10-03, item 58; ADR 0014's note), over a test-only directive that calls `injectYetiId('probe')` and binds the result as its host `id`. Cases that need a static attribute, content, or a hosted Aria directive use a test host component, which ADR 0014's note keeps for directives that need a parent or content.

- Counting: three directives created in turn get `ngx-yeti-probe-0`, `-1`, `-2`; a second prefix counts from 0 independently.
- `APP_ID`: with `APP_ID` provided as `shop`, the id is `ngx-yeti-probe-shop0`.
- Seed: with `TransferState` holding `ngx-yeti-ids` as `{"ngx-yeti-probe-": 5}` before creation, the first id is `ngx-yeti-probe-5`.
- Consumer id (test host): a static `id="mine"` is returned and bound unchanged, and the counter does not advance.
- Adoption (test host): a host rendered with a static `id` the shape of the prefix plus digits is returned unchanged; a host whose id has the prefix but a non-digit tail is not adopted.
- Aria (test host): `yetiTab`, `yetiTabPanel`, and `yetiButtonsItem` with their Aria directives get `ng-tab-0`, `ng-tabpanel-0`, `ng-toolbar-widget-0` with no random infix, and Aria's `aria-controls` and `aria-labelledby` follow.
- Reach (test host): an Aria `Listbox` or a CDK-generated id inside a `yetiTabPanel`'s content keeps CDK's own id, not the package's counter (the reading marked open above).
- Zoneless: every case runs with zoneless change detection and `await fixture.whenStable()`.

### 3. Node-level Vitest (`npx nx test <lib>`, `generated-ids.ssr.spec.ts`)

Through the shared `renderServer()` helper with `provideClientHydration()` and `withI18nSupport()`, and one `i18n` text in the fixture (building-blocks 1.11 decision 11):

- The five cases ADR 0044's Consequences name, rendered on the server: full, a `hydrate on` block, a `hydrate never` block, a client-only `@defer`, and a `@for`. Each server HTML has no duplicate id, every reference resolves to one element, and the counts start at 0.
- The serialised state holds `ngx-yeti-ids` with the final count of every prefix used.
- Two `renderApplication` calls started together return identical HTML.
- A non-default `APP_ID` puts the application id in every generated id and the state script under that application.

### 4. Playwright e2e (`npx nx e2e <fixture-app>-e2e`)

In Chromium, Firefox, and WebKit, against the Fixture app, with ticket 35's probe as the pattern:

- Server and client compared for the five cases: 0 rewrites of `id`, `aria-controls`, `aria-labelledby`, `aria-describedby`, `popovertarget`, and `commandfor`; 0 duplicate ids; every reference resolves to exactly one element; for `hydrate on`, checked both before and after the block hydrates; for `@for`, after two rows are added.
- No `NG05xx` error or warning, and `componentsSkippedHydration === 0`.
- Two concurrent requests to one server process, then a third, return identical ids. It runs against the Fixture app's server-rendered routes (`outputMode: 'server'`; ADR 0014's 2026-10-03 note, decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
- Prerendered routes: the same comparison, measuring what ticket 35 inferred.
- `withI18nSupport()`: a route whose component has `i18n` text hydrates with 0 rewrites.
- JavaScript disabled, on the Fixture app's server-rendered and prerendered routes: no duplicate ids, every reference resolves, and axe on the same six tags passes (ADR 0011, 2026-10-03 note).
- A client-only build of one route: ids count from 0 and are unique.

The Storybook half of layer 4 has nothing to test here. The Contract check needs no row for this spec, because it maps no Yeti name.

## Out of Scope

- Which ids each item generates, and their item strings: each item spec owns its own (`dialog`, `dropdown`, `nav`, `tooltip`, `field`, `demo`, `tabs`, `buttons`, and others).
- Ids addressed from outside the application (fragment links, `details name` groups): consumer-written by usage rule in each owning spec (ADR 0042 point 2); fragment handling is the fragment-links spec's.
- Changing ids of CDK, Aria, or Material components the package does not host (ADR 0044, considered options).
- Passing the package's id into Aria's `id` input (rejected, ADR 0044).
- Angular's private hydration data (`ngh`, defer block ids) as an id source (rejected as private, ADR 0044).
- A development-mode misuse warning for the usage rules: checks are deferred to a later milestone (map, Milestones).
- Filing upstream bug A6 with Angular: no upstream report without the user's confirmation (map, Standing rulings, Upstream bugs).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Directives render relationship attributes with generated ids | ADR 0003 point 5; ADR 0013 |
| The consumer's static `id` wins; external addresses need consumer ids | ADR 0042 point 2; ADR 0011 clause 8 |
| One entry point, two exported functions | ADR 0044 point 1 |
| Adopt the server-rendered id at hydration | ADR 0044 point 1, step 2; measured, ticket 35 |
| Per-application counter in a root `@Service()`, not exported | ADR 0044 point 2 |
| Seed the client's counter through `TransferState`, key `ngx-yeti-ids` | ADR 0044 point 3 |
| Ids and references are host bindings, equal on both ends | ADR 0044 point 4 |
| The consumer writes nothing new | ADR 0044 point 5 |
| `_IdGenerator` only as the token Aria injects, in one file | ADR 0044 point 6 |
| `provideYetiAriaIds()` on `yetiTab`, `yetiTabPanel`, `yetiButtonsItem` | ADR 0044 point 1 and its 2026-10-03 correction; building-blocks, Aria decisions |
| Prefix `ngx-yeti-<item>-` as a Runtime name | ADR 0080 point 2 |
| `APP_ID` appended when not `ng`, as CDK does | ADR 0044 point 1, step 3 |
| No ledger row | ADR 0042 and ADR 0044, Consequences |
| Level 3, CDK | building-blocks Part 2 row 53 |

### Usage examples

Application developers write nothing for ids. On a dialog, the consumer writes the opener and the dialog with the package's directive attributes, and the server HTML carries `commandfor="ngx-yeti-dialog-0"` on the opener and `id="ngx-yeti-dialog-0"` on the dialog; the hydrated page keeps both. Writing `id="confirm"` on the dialog makes the opener's `commandfor="confirm"`. A carousel slide or a heading that a fragment link targets takes a consumer id, which its spec states as a usage rule.

Package maintainers use the two functions as the API section says: a directive whose host renders an id calls `injectYetiId('<item>')` in a field and binds it as `[attr.id]`; a part that refers to it binds the same field through the item's token; and the three Aria-hosting directives list `provideYetiAriaIds()` in their `providers`.

### Styles

None: no Item file, no always-loaded rule relied on, no token read or written, and no Tailwind name collision.

### Platform features to adopt when the browser target moves

None is known: id generation uses no browser feature outside Baseline 2025 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). If a later Angular release adds a public, hydration-stable id API, the entry point is the one file to change (ADR 0042, considered options: none exists in 22.2).

### Watch points

- A CDK release that renames `_IdGenerator`, or an Aria release that stops injecting it, fails this spec's server-and-client test (ADR 0044 point 6 and Consequences).
- Upstream bug A6 (Aria's random infix) is worked around only on package-hosted elements; Aria used directly elsewhere in the consumer's application still rewrites its ids at hydration.
