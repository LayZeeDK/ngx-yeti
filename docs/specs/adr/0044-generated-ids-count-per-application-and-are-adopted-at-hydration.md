---
status: accepted
---

# Generated ids count per application, are adopted from the server's element at hydration, and reach Aria through an element-level `_IdGenerator`

Recorded by [Decide: hydration-safe generated ids](../issues/35-decide-hydration-safe-generated-ids.md), 2026-10-03, under the map's AFK override. It replaces points 1, 3, and 4 of [ADR 0042](0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md) and keeps its point 2 (the consumer's `id` wins). It answers the user's hydration ruling, quoted in the map (Standing rulings, 2026-10-03): "54. Make sure that we always comply with [hydration constraints](https://angular.dev/guide/hydration#constraints)." Evidence: [prototypes/hydration-safe-ids](../prototypes/hydration-safe-ids/README.md), development builds in Chromium, Firefox, and WebKit, zoneless. Sources: Angular at `5db6fc4453` (`NG/`), Angular components at `708d4c6e2` (`NC/`).

## Decision

1. **The entry point `ngx-yeti/generated-ids` exposes two functions, and nothing else:**
   - `injectYetiId(item: string): string`, called in a directive's field initializer. It returns, in this order:
     1. the consumer's static `id` on the host (`HostAttributeToken('id')`), as ADR 0042 point 2 has it;
     2. the host's current `id`, if it has the package's shape for this item (`ngx-yeti-<item>-<n>`): the element was rendered by the server and claimed at hydration, so the client keeps the server's id;
     3. otherwise the next number of a per-application counter for that prefix: `ngx-yeti-<item>-<n>`, with the application's `APP_ID` appended to the prefix when it is not `ng`, as CDK does (`NC/src/cdk/a11y/id-generator.ts:34-36`).
   - `provideYetiAriaIds(): Provider`, listed in the `providers` of every package directive that hosts an Aria directive which generates an id. Today those are `yetiTab` over `Tab`, `yetiTabPanel` over `TabPanel`, and the `buttons` part directive `yetiButtonsItem` over `ToolbarWidget` (`NC/src/aria/tabs/tab.ts:62`, `tab-panel.ts:73`, `toolbar/toolbar-widget.ts:70`). It provides CDK's `_IdGenerator` on that element only, so Aria's `inject(_IdGenerator)` gets an object whose `getId(prefix)` applies steps 2 and 3 with Aria's own prefix (`ng-tab-`, `ng-tabpanel-`, `ng-toolbar-widget-`) and ignores Aria's `randomize` flag.
2. **The counter is a root `@Service()` inside the entry point and is not exported.** A root service exists once per application (`NG/packages/core/src/di/interface/service.ts:32`), and the server creates one application per request, so each response counts from 0 and two concurrent requests to one process render the same ids. It keeps one count per prefix.
3. **The server's final counts go to the client in `TransferState`** under one key, `ngx-yeti-ids`, written through `onSerialize` (`NG/packages/core/src/transfer_state.ts:134`). The client's counter starts from them, so an id the client creates (a client-only `@defer`, a `@for` item added later) never repeats an id the server rendered into a block the client has not hydrated or never will. On the server, and in an application with no server HTML, the key is absent and the counter starts at 0.
4. **Every generated id and every reference to one stays a host binding** (ADR 0042 point 3's mechanism), but the server and the client now produce the same value, so hydration rewrites nothing. The read in step 2 is one `getAttribute('id')` on the directive's own host, once, when the directive is created. It writes nothing and queries no other element. It is the same read-once-at-creation pattern the map's open-state decision uses for `open`.
5. **The consumer writes nothing new:** no provider, no setup entry, no ids inside `hydrate` blocks. Anything addressed from outside the application still needs a consumer id (ADR 0011 clause 8; ADR 0042 point 2).
6. **`_IdGenerator` is still imported in one file**, now as a DI token Aria injects, not as the package's generator. If CDK renames it or Aria stops injecting it, the generated-ids spec's server-and-client test fails (see Consequences).

## Why (measured unless marked)

| Case | ADR 0042 as written | Per-application counter only | **This record** |
| --- | --- | --- | --- |
| Full hydration | all 28 ids and references rewritten | 0 rewrites | 0 rewrites |
| `@defer (hydrate on ...)`, before it hydrates | ids as served | 8 duplicate ids; 12 references resolve to two elements | 0 duplicates; every reference resolves |
| `@defer (hydrate on ...)`, after | 42 rewrites | 42 rewrites | 0 |
| `@defer (hydrate never)` | 28 rewrites | 28 rewrites, 8 duplicates that stay | 0 |
| Client-only `@defer` | 28 rewrites | 0 | 0 |
| `@for` growing after hydration | 28 rewrites | 0 | 0, new ids unique |
| Two concurrent SSR requests, one process | different ids per request, interleaved counts | identical | identical |
| `NG05xx` | none | none | none |

- The server does not number ids in document order: it gave a `hydrate on` block's content the first ids, before the content above it (prototype `results/server-counter-on.html`). So any scheme that counts on both ends in construction order breaks wherever a block is dehydrated on the client.
- At hydration Angular locates the server's element before it creates that element's directives (`NG/packages/core/src/render3/instructions/element.ts:140-144`, `:331-345`), and host bindings run after, so the server's `id` is still on the host when the field initializer runs (read; the measured 0 rewrites agree).
- Without the `TransferState` seed, client-created ids restarted at 0 and duplicated server ids: 8 after a client-only `@defer`, 16 after two `@for` additions (measured, the `noseed` control).
- With zoneless change detection, none of this changed: the workspace has no zone.js (measured).

## Considered options

- **CDK's `_IdGenerator` as ADR 0042 used it.** Rejected: module-state counters (`id-generator.ts:18`) count across requests and interleave concurrent ones, and Aria's random infix (`:24`) differs between server and client, so every id and reference is rewritten at hydration (measured).
- **A per-application counter alone.** Rejected: right for full hydration, client-only `@defer`, and `@for`, but it duplicates ids around `hydrate` blocks (measured).
- **That counter plus a rule that consumers write every id inside `hydrate` blocks.** Rejected (inferred): it holds only if every id-generating element in the block has a consumer id, Aria's widgets included, which the package's Aria-hosting directives do not take as an input; nothing can check the rule, and one missed id shifts every id after it.
- **Ids derived from a stable key (the host's position, a consumer key).** Rejected: position would need a walk of the DOM at creation, and an element the client creates fresh is not yet attached (inferred); a consumer key is the rule above under another name.
- **Angular's hydration data (`ngh`, the `__nghData__` and `__nghDeferData__` entries, defer block ids `d0`).** Rejected: private. `DEFER_BLOCK_ID` and `SSR_UNIQUE_ID` are internal constants (`NG/packages/core/src/hydration/interfaces.ts:45`, `NG/packages/core/src/defer/interfaces.ts:242`), and core exposes them only as `ɵ` exports. `TransferState` is used here for counts only, because no public key ties one element to one stored id.
- **Passing the package's id into Aria's `id` input.** Rejected: a host directive's input is bound only from the consumer's template (`NG/adev/src/content/guide/directives/directive-composition-api.md:33`, `:50`), so the package's directive cannot set it itself; ticket 30 kept ids stable that way only with consumer-written ids. The element-level `_IdGenerator` reaches the same field without the consumer.
- **Providing the replacement `_IdGenerator` for the whole application.** Rejected: it would change the ids of every CDK, Aria, and Material component the consumer uses, which is outside the package's items.

## Consequences

- The generated-ids spec covers the two functions, the counter, and the seed. Its node-level SSR smoke renders the five cases above and compares server and client ids, and its e2e test sends two concurrent requests to one server process (ADR 0014). It still has no ledger row.
- A part and the element its ids name no longer get different ids on the two ends, so ADR 0011 clause 7's stated reason ("the server's ids and the client's can differ") no longer holds. Whether the shared-boundary rule stays for another reason is the orchestrator's to record.
- One `TransferState` entry per page, about 100 bytes in the prototype.
- Not measured: a non-default `APP_ID`, prerendering, `withI18nSupport()`, and a client-only application. Each is inferred to behave as above, because none changes how directives are created or how `TransferState` travels; the generated-ids spec measures them.
- 2026-10-03 (orchestrator's correction following audit 0003): point 1 first named `yetiButton` as the host of `ToolbarWidget`. Since audit 0003, `yetiButton` hosts nothing from Aria and the part directive `yetiButtonsItem` hosts `ngToolbarWidget` (building-blocks, Aria decisions row 27), so `provideYetiAriaIds()` goes on `yetiButtonsItem`.
- 2026-10-03 (orchestrator, full AFK mode; [ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 1): `provideYetiAriaIds()` answers only the hosted Aria directive's own id prefixes (`ng-tab-`, `ng-tabpanel-`, `ng-toolbar-widget-`, and any other the hosting spec lists) and passes every other call, with its arguments, to the parent `_IdGenerator`. A directive's `providers` reach the element's content, and the package must not change ids it does not own, so Material, CDK, or Aria content inside the element keeps its own ids. A layer-2 test nests a Material and a CDK id consumer inside a `yetiTabPanel`. The options record, with how to overrule it, is decision 226 (audit 0004 M16).
- 2026-10-03 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md), decision 227; audit 0004 M17): the shared-boundary rule's new reason, which the Consequences above left to the orchestrator, is recorded in decision 227 and as a note on [ADR 0011](0011-rendering-modes-contract-for-yeti.md) clause 7.
