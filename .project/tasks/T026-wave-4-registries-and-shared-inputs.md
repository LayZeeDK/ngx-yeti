---
id: T026
title: Add the wave-4 items to the registries and prove one exported type per shared input name
wave: 4
deps: [T020, T021, T022, T023, T024, T025]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/package/consumer/consumer.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/src/shared-inputs.node.spec.ts
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
  - docs/specs/upstream-bugs.md
---

# T026 — Add the wave-4 items to the registries and prove one exported type per shared input name

## Context

With button, icon, container, and table landed, all 22 M002 entry points exist. This task adds the wave-4 items to the packed consuming build, the name-collision and item-names lists, the README, and the changelog, records the wave's upstream bugs, and adds the cross-item check of INTENT E14: two package directives composed on one element that share an input name (`gap` on 21 items, `align` on 8) declare it with the same exported type (building-blocks.md:53), because Angular sets one template binding on every directive that declares the name. It delivers the package entry points surface of the Surface contract: a consumer importing one public symbol from each of the 22 new entry points builds against the tarball.

## Approach

- `tools/package/consumer/consumer.ts`: import and use one public symbol from each of `ngx-yeti/button`, `ngx-yeti/icon`, `ngx-yeti/container`, and `ngx-yeti/table`; the file then covers all 22 M002 entry points beside card, lift, and styles. Keep the existing `threshold="medium"` and other probes.
- `packages/ngx-yeti/src/name-collision.node.spec.ts` and `packages/ngx-yeti/src/item-names.node.spec.ts`: add the four items' exports and root directive files to the positive lists.
- `packages/ngx-yeti/src/shared-inputs.node.spec.ts` (E14): for every package directive declaring `gap`, `align`, or `sticky`, assert with `expectTypeOf` that the input's value type equals the one exported type (`YetiGap`, `YetiAlign`, and the `sticky` boolean form, from `ngx-yeti`) plus `undefined`; `nx typecheck -c spec` checks these lines. Also render, in a server application through public API, one element carrying two directives that share `gap` with one binding, and assert one `data-gap` with the bound value. If a directive breaks the rule, stop and write `NEEDS-ORCHESTRATOR:` naming it; do not edit item sources here.
- `packages/ngx-yeti/README.md`: the four Entry points rows and a status line saying the layouts, table, button, spinner, enter, and visually-hidden are implemented. `packages/ngx-yeti/CHANGELOG.md`: the four entry points; the header already names the Yeti commit.
- `docs/specs/upstream-bugs.md`: a row for every `UPSTREAM:` Log line of T020 to T025; file nothing upstream.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- SC4
- SC5

## Acceptance criteria

1. `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports one public symbol from each of the 22 M002 entry points against the `npm pack` tarball, and the contract check of every M002 item passes over the built manifest.
2. E14: `packages/ngx-yeti/src/shared-inputs.node.spec.ts` proves every directive declaring `gap`, `align`, or `sticky` uses the one exported type for it, and that two directives sharing `gap` on one element render one `data-gap`; `npm exec nx -- typecheck ngx-yeti -c spec` passes.
3. The name-collision and item-names lists hold the four items; the README and changelog name them and state what M002 implemented; every `UPSTREAM:` line of the wave has its row.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && test -f packages/ngx-yeti/src/shared-inputs.node.spec.ts && test -f tools/package/consumer/consumer.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/shared-inputs src/name-collision src/item-names contract.node && npm exec nx -- typecheck ngx-yeti -c spec && npm exec nx -- run ngx-yeti:pack-check
```

Heavy: no

## Log

- 2026-10-10 — created by planner
