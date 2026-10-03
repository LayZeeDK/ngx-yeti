# 35. Decide: hydration-safe generated ids

Type: grilling
Status: resolved
Blocked by: 33, 34
Labels: wayfinder:grilling
Map: ../map.md

## Question

[ADR 0042](../adr/0042-generated-ids-come-from-cdk-idgenerator-through-one-helper.md) takes generated ids from CDK's `_IdGenerator` through one `injectYetiId()` helper, and lets a consumer's own `id` win. [Research: the decided records against Angular's hydration constraints](33-research-decided-records-against-hydration-constraints.md) rated it at risk, on two counts:
- ticket 30 measured that Aria's generated ids change at hydration because of a random infix (`id-generator.ts:24`);
- CDK keeps its counters in module state (`id-generator.ts:18`, read), so a server process keeps counting across requests while each browser starts at 0.

The user requires compliance with the hydration constraints (map, Standing rulings, 2026-10-03). How does the package give every id it generates, and every id Aria generates inside a package directive, the same value on the server and the client? Consider:
- in a full hydration, an incremental `hydrate` block, a `hydrate never` block, an `@defer` block rendered only on the client, and a `@for` that adds items after hydration;
- with zoneless change detection;
- across concurrent SSR requests in one server process.

Candidates include:
- a per-application counter, provided in the application's injector so that it resets per request;
- ids derived from a stable key, such as the host's position or a consumer key;
- Angular's own `TransferState` or the hydration info;
- passing the package's id into Aria's `id` inputs;
- requiring consumer ids inside `hydrate` blocks.

Then what does ADR 0042 become?

## How to work it

AFK grilling under the map's AFK override, with a prototype where a candidate needs one. Use the workspaces of tickets 29 and 30 under `D:/tmp/ngx-yeti-29-*/ws` and development builds, and measure in Chromium, Firefox, and WebKit. Send two concurrent SSR requests to one server process and compare their ids. Record the decision as a dated note on ADR 0042, or as a new ADR from 0044 to 0049, plus the `## Answer` and `### Triage`. Only HIGH impact with NOT-HIGH confidence stays `OPEN FOR HUMAN`.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5, AFK grilling under the map's AFK override, with the prototype [hydration-safe-ids](../prototypes/hydration-safe-ids/README.md): development builds, zoneless, Angular, `@angular/aria`, and `@angular/cdk` 22.2.1, in Chromium, Firefox, and WebKit. Every result was the same in all three engines. The decision is [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md). It replaces ADR 0042 points 1, 3, and 4 and keeps point 2.

**Decision.** `ngx-yeti/generated-ids` exposes `injectYetiId(item)` and `provideYetiAriaIds()`, and nothing else.
- `injectYetiId(item)` returns, in order: the consumer's static `id`; the host's current `id` if it has the shape `ngx-yeti-<item>-<n>`, which means the server rendered it and hydration claimed it; or the next number of a per-application counter.
- The counter is a root `@Service()`, so there is one per SSR request. Its final counts reach the client in one `TransferState` key, and the client's counter continues from them.
- `provideYetiAriaIds()` goes in the providers of `yetiTab`, `yetiTabPanel`, and `yetiButtonsItem` (the orchestrator's correction following audit 0003; first written as `yetiButton`). It provides `_IdGenerator` on that element, so Aria's `Tab`, `TabPanel`, and `ToolbarWidget` get the same counter and adoption, keep their own prefixes, and lose the random infix.
- The consumer writes nothing new.

**Grilling record (both sides, AFK).**
- *Q: A per-application counter resets per request; isn't that enough?* Only for full hydration, a client-only `@defer`, and `@for` (measured: 0 rewrites in each). The server numbered a `hydrate on` block's content before the content above it (measured, `server-counter-on.html`), and the client skips the dehydrated block. Before that block hydrated, the page had 8 duplicate ids and 12 references that resolved to two elements. After, 42 ids and references were rewritten. In `hydrate never`, the 8 duplicates stayed.
- *Q: Then require consumer ids inside `hydrate` blocks?* Rejected (inferred). Aria's widgets in the block count too, the package's Aria-hosting directives take no `id` input, nothing can check the rule, and one missed id shifts every id after it.
- *Q: Angular's hydration key, `ngh`, or `TransferState` keyed per element?* The `ngh` data and the defer block ids are private (read, `hydration/interfaces.ts:45`, `defer/interfaces.ts:242`). No public key ties an element to a stored id, so `TransferState` carries counts only.
- *Q: Isn't reading the host's `id` a DOM access the constraints warn about?* The constraint is that the HTML is not altered and the DOM structure matches (`NG/adev/src/content/guide/hydration.md:99-101`). The read writes nothing, touches only the directive's own host, and runs once at creation, as the open-state decision's read of `open` does. Measured: 0 rewrites and no `NG05xx` in any case. It works because Angular locates the server's element before it creates the element's directives (read, `element.ts:140-144`, `:331-345`).
- *Q: Why the `TransferState` seed?* Without it (the `noseed` control), client-created ids restarted at 0 and duplicated server ids: 8 after a client-only `@defer`, and 16 after two `@for` additions (measured).
- *Q: Pass the package's id into Aria's `id` input instead?* A host directive's input is bound only from the consumer's template (read, `directive-composition-api.md:33`, `:50`). The element-level `_IdGenerator` reaches the same field without the consumer (measured on `Tab`, `TabPanel`, and `ToolbarWidget`).

**Measurements (ADR 0042 as written / counter only / ADR 0044).**
- Full hydration: 28 rewrites / 0 / 0.
- `hydrate on`: 42 rewrites / duplicates, then 42 rewrites / 0.
- `hydrate never`: 28 / 8 duplicates that stay / 0.
- Client-only `@defer`: 28 / 0 / 0.
- `@for` growing after hydration: 28 / 0 / 0.
- Two concurrent requests to one process: the ids differ and the counts interleave (A `-22`, B `-23`, A `-24`) / identical / identical.
- `aria-controls` and `aria-labelledby` resolved to exactly one element after every case under ADR 0044.
- No `NG05xx` error or warning anywhere. The only console messages were Aria's development-mode warning that each panel lacks an `ngTabContent` (`NC/src/aria/private/utils/violations.ts:12`), the same in every mode.

**ADR 0042 becomes:** point 2 (the consumer's `id` wins, and deep links and `details name` need consumer ids) stands. Points 1, 3, and 4 are replaced by ADR 0044. Its "Considered options" still hold for a package counter (now chosen, but per application and seeded rather than duplicated from CDK) and for `crypto.randomUUID()`.

### Checked and inferred

- Measured: everything in the table and the Measurements list above, plus zoneless (the build loads no zone.js).
- Read: the `file:line` references above and in ADR 0044.
- Inferred, not measured: a non-default `APP_ID` (appended as CDK does), prerendering, `withI18nSupport()`, a client-only application, and JavaScript off. In ADR 0044 the server HTML had no duplicate ids, so references resolve with JavaScript off.

### Triage

Rule: the map's AFK override. Only HIGH impact with NOT-HIGH confidence stays `OPEN FOR HUMAN`.

| Point | Impact | Confidence | Evidence | Outcome |
| --- | --- | --- | --- | --- |
| Adopt the server's id at hydration, and seed the counter through `TransferState` | HIGH (every item with a generated id) | HIGH (0 rewrites, 0 duplicates, and every reference resolved in 6 cases x 3 engines; controls failed as predicted) | prototype, ADR 0044 | decided |
| One `getAttribute('id')` on the host at creation complies with the hydration constraints | HIGH (the user's ruling 54) | HIGH (no write and no structure change; measured 0 rewrites, no `NG05xx`; same read-once pattern as the open-state decision) | `hydration.md:99-101`; prototype | decided |
| Aria's ids through an element-level `_IdGenerator` provider | MEDIUM (depends on Aria injecting an underscore class, already a dependency under ADR 0042) | HIGH (measured on all three Aria directives the package hosts) | `tab.ts:62`, `tab-panel.ts:73`, `toolbar-widget.ts:70` | decided; the generated-ids spec's server-and-client test watches it |
| `APP_ID` appended to the prefix when not `ng` | LOW | MEDIUM (read from CDK; not measured) | `id-generator.ts:34-36` | decided; the spec measures it |
| Prerendering, `withI18nSupport()`, a client-only application | MEDIUM | MEDIUM (inferred: none changes directive creation or `TransferState`) | ADR 0044 Consequences | decided; the spec measures each |

No item stays `OPEN FOR HUMAN`.

### For the orchestrator

Records outside this ticket's edit scope that the Answer changes:

1. **ADR 0042:** a dated note saying points 1, 3, and 4 are replaced by ADR 0044, and that its 2026-10-03 note's open change is settled.
2. **ADR 0011 clause 7:** its reason ("the server's ids and the client's can differ") no longer holds. Either restate the shared-boundary rule with another reason or retire it. **CONTEXT.md**, "Hydration boundary", follows clause 7.
3. **`building-blocks.md:69`** ("Generated ids differ between server and client, which is harmless"; "Aria-hosted elements keep Aria's own prefixes"), **`:307`** (row 53: the helper's text and `_IdGenerator` as the generator), **`:33`**, and **`:344`**: point to ADR 0044.
4. **`architecture-guide.md:388`** (the ids baseline, "a server and client id that differ are harmless") and **`:26`**, **`:256`** (`_IdGenerator` named as the building block).
5. **`research/hydration-constraints-audit.md`** row 4 and its open line 54: settled by ADR 0044, measured.
6. **`ledger.md`** A11Y-7 cites ADR 0042 for the demo grip's id: add ADR 0044.
7. **The map:** a Decisions so far line for this ticket.
