# 40. Spec: Events (shared spec)

Type: task
Status: resolved
Blocked by: 25, 26
Labels: wayfinder:task
Map: ../map.md

## Question

How does the package expose Yeti's `yeti:*` events (`close`, `open`, `select`, `slide`, `invalid`, `current`) as Angular outputs, and what does the shared `events` spec say? Templates cannot bind `(yeti:close)` (`binding_parser.ts:699`), and the package replaces Yeti's modules ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)).

## How to work it

Write `specs/events.md` with the `/to-spec` template and the map's Spec shape note, from the records only: the map's Standing rulings and Inherited preferences, the ADRs, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`, and `CONTEXT.md`. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **When an output fires for a change the consumer makes** (spec, API rule 9; user story 23). Records settle that state found at creation emits nothing (`tabs.js:26-27`; the open-state ruling) and that a change the directive makes in a handler emits. They do not settle a write through the model's input binding or a call to a public method (`close()`, `select()`). Recommendation: follow Yeti and Angular's `model()`. A consumer's write through the model binding does not emit, as `model()` does not emit `xChange` for a parent write. A public method call emits, as Yeti's `yeti:close` fires on every dialog close (`dialog.js:72-75`). Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
2. **Whether `opened` and `closed` on the dialog, dropdown, and nav are completion outputs** (API rule 7). CONTEXT.md defines **Completion output** as `opened` and `closed`, emitted after the transition (building-blocks 1.4, 1.6 rule 1). Part 2 row 31 has the dialog emit `closed` from its `close` handler and `opened` "once the open is observed", which is Yeti's earlier timing. Recommendation: completion outputs, after the transition by 1.6 rule 1. `isOpenChange` already reports the choice, and CONTEXT.md and 1.4 agree on it. Row 31 should be read as the moment the wait starts. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
3. **The toc's `current` model and `current` output** (Part 2 row 41) cannot both be class members named `current`. Recommendation: the output keeps `current` (Yeti's verb, P30's list), and the toc spec names the model something else (for example `currentLink`, with `currentLinkChange`), by building-blocks 1.3's rule that the model and the output must not collide. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
4. **Value types of `YetiCurrentDetail` and `YetiInvalidDetail`.** The records type `select` and `slide` (architecture-guide P10, P13, P26, P30) but not these two. Recommendation, following the elements Yeti dispatches: `{link: HTMLAnchorElement; heading: HTMLElement}` (`toc.js:36`) and `{controls: readonly HTMLElement[]}`, the invalid control elements in document order (`validate.js:62`). The `field` spec sources them from its registered control directives. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
5. **Which entry point exports the four `detail` types.** Recommendation: `ngx-yeti/events`, imported by type by the item entry points, as the other shared-utility specs have `ngx-yeti/navigation-close`, `ngx-yeti/fragment-links`, and `ngx-yeti/generated-ids` (Part 2 rows 50, 51, 53). It has no runtime cost, because the module exports types only. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).

None blocks the spec. Each one is written as the spec's best reading and marked "(open: see ticket)".

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/events.md](../specs/events.md).

The spec maps the six `yeti:*` events (seven dispatch sites) to `output()`s on the directives that replace their Modules: `closed` (alert, dialog), `opened` (dialog), `select`, `slide`, `invalid`, and `current`. It exports four `detail` types with Yeti's frozen keys. It sets twelve shared API rules: no DOM event, no plugin or re-dispatcher, outputs mark the choice, no veto output, nothing emitted for state at creation, and zoneless. It also covers rendering modes (nothing replays, replayed native events emit late, the dialog `close` residue A3), the four test layers including the manifest contract check, and no ledger rows. The spec has 44 user stories and 5 open points, listed under Open above.
