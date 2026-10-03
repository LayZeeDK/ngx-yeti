---
status: accepted
---

# Generated ids come from CDK's `_IdGenerator` through one package helper; the consumer's own `id` wins

Recorded by [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md). It settles the question [Decide: the spec list](../issues/11-decide-spec-list.md) row 53 left to ticket 25: "whether a leading-underscore API is acceptable". [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) point 5 and [ADR 0013](0013-parts-name-their-targets-by-reference.md) already decided that the directives render the platform's relationship attributes (`popovertarget`, `commandfor`, `aria-controls`, `aria-describedby`, `aria-labelledby`) with generated ids, and [ADR 0080](0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 2 gave generated ids the `ngx-yeti-<item>-` prefix.

`_IdGenerator` is a `@Service()` in `@angular/cdk/a11y`, exported from the entry point's public API (`src/cdk/a11y/public-api.ts:39`), with `getId(prefix, randomize = false)` keeping one counter per prefix in module state and adding the application id when it is not the default (`id-generator.ts:22-36`, read in the 22.2.x clone at `708d4c6e2`). The leading underscore is Angular components' convention for an export outside the public API promise. Aria's own directives use it for their ids (`src/aria/tabs/tab.ts:62`, `tab-panel.ts:73`), so a package that hosts Aria's Tabs already depends on it at run time.

We decided:

1. **One helper, `injectYetiId(item)`, in the generated-ids entry point**, is the only place the package imports `_IdGenerator`. It returns the consumer's static `id` where the host has one (`HostAttributeToken('id')`), otherwise `inject(_IdGenerator).getId('ngx-yeti-<item>-')`, without the random infix. A swap to another generator, if CDK ever removes or renames the service, is one file.
2. **The consumer's `id` wins**, as building-blocks 1.5 has it, and anything addressed from outside the application (a deep link, a `details name` group) needs a consumer-supplied id, stated per spec as a usage rule.
3. **Every generated id and every reference to one is a host binding**, so the server's and the client's ids may differ (the counters are per process) and both ends are rewritten in one hydration pass; a part and its target therefore share one hydration boundary unless the target has a static `id` ([ADR 0011](0011-rendering-modes-contract-for-yeti.md) clause 7).
4. **Aria-hosted elements keep Aria's own prefixes** (`ng-tab-`, `ng-tabpanel-`), because Aria generates them in its own directives and the wrapper does not override them.

## Considered options

- **A package counter service of its own.** Rejected: it would duplicate twenty lines of CDK for the sake of the underscore, and the package depends on CDK anyway.
- **`crypto.randomUUID()` per instance.** Rejected: random on the server and the client alike, so the same hydration rule applies, and the ids are longer and unreadable in tests.
- **A public id API in `@angular/core`.** None exists in 22.2 (searched `packages/core/src` for an id generator; nothing public).
- **The consumer writes every id, as Yeti's docs do.** Rejected by ADR 0003 point 5 and ADR 0013: a typo goes unreported, and the ids would have to be unique across `@for` and projected content by hand.

## Consequences

- The generated-ids spec is the helper, its types, and its tests, and it has no ledger row: ids are not a feature Yeti lacks.
- `@angular/cdk` stays a peer at the Angular minor the release names (ADR 0017), and a CDK release that changes `_IdGenerator` is caught by the package's own tests of the id shape.
- Yeti's `data-ngx-yeti-*` attributes and `--ngx-yeti-*` properties are unaffected; this record is about `id` values only.
- 2026-10-03: [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) rates this record at risk under the user's hydration ruling (map, Standing rulings). Ticket 30 measured that Aria's generated ids change at hydration because of a random infix (`id-generator.ts:24`). CDK keeps its counters in module state (`id-generator.ts:18`, read), so a server process keeps counting across requests while each browser starts at 0. The record has to change to give the same id on the server and the client: a per-application counter, the package's id passed into Aria's `id` input, and the consumer's own ids inside `hydrate` blocks. That change is open until a decision on hydration-safe ids.
- 2026-10-03: [ADR 0044](0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) replaces points 1, 3, and 4: the package's ids come from a per-application counter seeded on the client through `TransferState`, a server-rendered id is adopted at hydration, and Aria's ids use the same counter, so the server and the client render the same ids. Point 2 (the consumer's `id` wins) stands. The open change in the note above is settled.
