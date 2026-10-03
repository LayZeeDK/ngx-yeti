# 05. Task: carry the old map's Yeti findings into this bundle

Type: task
Status: resolved
Blocked by:
Labels: wayfinder:task
Map: ../map.md

## Question

The old map's Research: Yeti, Foundation's version 7 (ticket 194, `research-yeti-foundation-7`) resolved on 2026-10-01 (commit `4e02060`). It covers:

- Yeti's status and timeline;
- the migration guide;
- what is locked and what may change after `7.0.0-beta`;
- browser support;
- coverage against Foundation 6.9;
- its JavaScript;
- lazy loading.

When it resolves, copy its findings into this bundle, so the bundle stands alone, and list which of the four research tickets and [Decide: which Yeti version the specs target, and how the package tracks it](12-decide-yeti-version-policy.md) they already answer in part.

## How to work it

AFK, by the orchestrator, once that ticket's Status is `resolved`. Copy `research/yeti-foundation-7.md` from the old bundle to `research/yeti-foundation-7.md` here, with a header line naming its origin and commit. Then add a note to each ticket it answers in part, naming the section. Copy no decision; the old map decided nothing about Yeti.

## Answer

Done 2026-10-01 by the orchestrator. The findings are copied to [research/yeti-foundation-7.md](../research/yeti-foundation-7.md), with a header naming their origin (commit `4e02060`) and their relative links pointed back into the old bundle; the text is otherwise unchanged. No decision was copied, because the old map decided nothing about Yeti.

- It answers in part: [Research: Angular 22's browser baseline against what Yeti expects](01-research-browser-baseline-vs-yeti.md) (its section 3, which ticket 01's scan corrects), [Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](02-research-yeti-inventory.md) (section 4), [Research: Yeti's JavaScript modules and what Angular adds](03-research-yeti-javascript-and-angular.md) (section 5), [Research: Yeti's styling model, and loading component styles lazily](04-research-yeti-styles-and-lazy-loading.md) (sections 6 and 7), and [Decide: which Yeti version the specs target, and how the package tracks it](12-decide-yeti-version-policy.md) (section 2). Each has a dated note.
- Where it differs from this bundle's later research, the later research holds; the copy's header says so.
