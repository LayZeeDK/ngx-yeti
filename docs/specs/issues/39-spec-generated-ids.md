# 39. Spec: Generated ids (shared spec)

Type: task
Status: resolved
Blocked by: 35
Labels: wayfinder:task
Map: ../map.md

## Question

What is the API and behaviour of the shared generated-ids utility, and what does its spec say? It follows [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md): `injectYetiId()`, the per-application counter, the `TransferState` seed, adopting a server-rendered id, `provideYetiAriaIds()`, and the consumer's `id` winning.

## How to work it

Write `specs/generated-ids.md` with the `/to-spec` template and the map's Spec shape note, from the records only: the map's Standing rulings and Inherited preferences, the ADRs, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`, and `CONTEXT.md`. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

Each point is marked "(open: see ticket)" in the spec, which carries the recommended reading.

1. **The Aria provider's reach (HIGH impact, inferred).** A directive's `providers` are visible to the element's content, so CDK, Aria, or Material directives inside a `yetiTabPanel` would also get the package's `_IdGenerator`. Material's ids without an infix could then repeat ids from CDK's module counter elsewhere on the page. ADR 0044 meant the provider for the element only. Recommendation: the provided object handles only the hosted Aria directive's own prefix (`ng-tab-`, `ng-tabpanel-`, `ng-toolbar-widget-`) and passes every other call, with its arguments, to the parent injector's `_IdGenerator`. Add a dated note to ADR 0044 and have the spec's browser-level test measure it. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
2. **The Fixture app needs a server-rendered build.** ADR 0044 asks for an e2e test with two concurrent requests to one server process, and the JavaScript-off ruling asks for an SSR build, but ADR 0014 point 4 and building-blocks 1.12 describe the Fixture app as prerendered only (`outputMode: 'static'`). Recommendation: one Fixture app with `outputMode: 'server'` and per-route render modes (`RenderMode.Prerender` for the prerendered routes, `RenderMode.Server` for the rest), recorded as a note on ADR 0014. This affects every spec. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
3. **The architecture guide's nav example against ADR 0044.** The guide has `nav[yetiNav]` generate one id that `ul[yetiNavList]` binds as `id`. Adoption reads only the calling directive's own host, so the root's call would never adopt the list's server id. Recommendation: the directive whose host renders the `id` calls `injectYetiId`, and the parts that refer to it read the value. The spec follows the record (Precedence). Correct the guide's example and tell the nav spec. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
4. **A bound `[id]` from the consumer.** `HostAttributeToken` reads only static attributes, so a bound id is not honoured and competes with the directive's binding. Recommendation: a usage rule that the consumer's id is a static attribute, with a bound id unsupported. No check in the first milestone (map, Milestones). Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
5. **Consumer ids that start with `ngx-yeti-`.** Such an id could equal a number the counter later gives another element. Recommendation: a usage rule that `ngx-yeti-` is the package's Runtime name and consumers do not use it (ADR 0080 point 2). No check. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
6. **A consumer `id` on an Aria-hosted part.** `provideYetiAriaIds()` has no step 1, and the package's Aria-hosting directives take no `id` input, so a static `id` on `yetiTab`, `yetiTabPanel`, or `yetiButtonsItem` would be rewritten at hydration. Recommendation: a usage rule, stated in the tabs and buttons specs, that these parts take no consumer `id`. A deep link targets an element inside the panel. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
7. **Layer 1 for a spec with no markup.** Recommendation: no story of its own. The item stories' axe run, with `aria-valid-attr-value` among its rules, covers the references, and layers 2 to 4 cover the mechanism. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).

None of these blocks the spec.

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/generated-ids.md](../specs/generated-ids.md).

The spec has 316 lines and 46 user stories, and it raises 7 open points (above), none blocking. It specifies `ngx-yeti/generated-ids` from ADR 0044 and ADR 0042 point 2: the two functions, the unexported per-application counter, the `ngx-yeti-ids` seed, adoption at hydration, and the Aria provider on `yetiTab`, `yetiTabPanel`, and `yetiButtonsItem`. It has no Item file and no ledger row. Its rendering modes come from ticket 35's measurements. The cases ticket 35 inferred (a non-default `APP_ID`, prerendering, `withI18nSupport()`, a client-only application, and JavaScript off) are set as tests for the four layers, and layer 2 uses `TestBed.createDirective`.

Checked: the prototype's code and results, CDK's `id-generator.ts` (it appends `APP_ID` with no separator), and the uses of `_IdGenerator` in Aria and Material (components clone). Inferred: open point 1's leak into content. It is not measured.
