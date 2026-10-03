# 41. Spec: Fragment links (shared spec)

Type: task
Status: resolved
Blocked by: 25
Labels: wayfinder:task
Map: ../map.md

## Question

What is the API and behaviour of the shared fragment-links utility (`provideYetiFragmentLinks()`), and what does its spec say? It follows [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), building-blocks 1.15, and the deployment-URL ruling (only `baseHref`).

## How to work it

Write `specs/fragment-links.md` with the `/to-spec` template and the map's Spec shape note, from the records only: the map's Standing rulings and Inherited preferences, the ADRs, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`, and `CONTEXT.md`. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **Where a package-owned link's fragment comes from.** ADR 0023's Consequences have the consumer write Yeti's static `href="#id"`, which the directive turns into a same-document `href`. The hydration section of building-blocks.md says a consumer writes no static attribute on an attribute a directive binds, because hydration writes static attributes again. Recommendation: keep ADR 0023's form. The directive reads the static `href` once through `HostAttributeToken('href')`, and this is recorded as the one stated exception to that usage rule: the static value is never pre-hydration state, the bound value is the same on the server and the client, and hydration writes both in one synchronous pass. The e2e test asserts no NG05xx error. The alternative, a fragment input with no consumer `href`, departs from Yeti's markup. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
2. **Bare links inside dehydrated and `hydrate never` blocks.** ADR 0023 point 2 says such a link still leaves the page inside `hydrate never`. This spec's reading is that once the root has rendered, the document listener also sees clicks from dehydrated blocks, because a plain link carries no `jsaction` (inferred). Recommendation: specify it as handled, measure it in layer 4 (case 6), and add a dated note to ADR 0023 with the result. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
3. **Whether `YetiFragmentLinks` exposes a current-fragment signal**, and what row 51's "Router optional (`fragment` through `ActivatedRoute` where present)" asks for. Recommendation: no public member in the first milestone. The tabs root reads `location.hash` in its render callback and listens to `hashchange` itself (row 40), and the toc does not need the fragment (ADR 0025). Read row 51's Router clause as "nothing requires the Router". Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
4. **`HashLocationStrategy`.** No record covers it. Under it the route sits in the fragment, so no fragment link can work. Recommendation: out of scope, stated as usage rule 5. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
5. **Fragment-only navigations and navigation-close.** Setting `location.hash` fires `popstate`, which is expected to start a Router navigation whose `NavigationStart` closes open panels through ADR 0041 (inferred). Recommendation: measure it in layer 4 (case 8) and accept the closing as ADR 0041 reads ("the first `NavigationStart`"), with a note in the navigation-close spec. A visitor who follows a link inside a dropdown expects to leave the panel. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/fragment-links.md](../specs/fragment-links.md).

42 user stories and 5 open points (above). None blocks the spec: each has a recommendation, and the spec carries its best reading marked "(open: see ticket)". The spec adds no ledger row and confirms A11Y-16 as it reads.
