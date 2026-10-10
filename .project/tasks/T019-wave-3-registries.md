---
id: T019
title: Add the wave-3 items to the consumer build, name-collision list, README, and changelog
wave: 3
deps: [T009, T010, T011, T012, T013, T014, T015, T016, T017, T018]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/package/consumer/consumer.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
  - docs/specs/upstream-bugs.md
---

# T019 — Add the wave-3 items to the consumer build, name-collision list, README, and changelog

## Context

Wave 3 lands fifteen items in parallel tasks that may not share files, so the package-wide registries are updated here, after all of them: the packed consuming build (SC5), the ADR 0080 name-collision test's positive list, the item-names test, the package README's Entry points table and status line, the changelog, and any upstream bug the wave's tasks reported. Items: breakout, timeline, grid, masonry, enter, visually-hidden, cluster, sidebar, cover, columns, layer, overlay, spinner, scroller, frame.

## Approach

- `tools/package/consumer/consumer.ts`: import and use at least one public symbol from each of the fifteen entry points (for example each item's root directive in the component's `imports` and template), so `pack-check` proves every entry point resolves through the tarball's `exports`.
- `packages/ngx-yeti/src/name-collision.node.spec.ts`: add every new export of the fifteen entry points to the `arrayContaining` positive list (lines 57 to 67), so a missing entry point fails the test; the collision check itself stays as is (ADR 0080). `packages/ngx-yeti/src/item-names.node.spec.ts`: add each new root directive file to its positive list.
- `packages/ngx-yeti/README.md`: one Entry points row per item, and the status line (line 5) naming what is implemented now. `packages/ngx-yeti/CHANGELOG.md`: one Entry points line per item under the unreleased version, whose header names the Yeti commit (ADR 0017). Write for the package's readers, without planning ids.
- `docs/specs/upstream-bugs.md`: turn every `UPSTREAM:` Log line of T009 to T018 into a row in the file's own format; frame's row (T018) is already there; file nothing upstream.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- None

## Intent coverage

- SC5

## Acceptance criteria

1. `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports a public symbol from each of the fifteen wave-3 entry points against the `npm pack` tarball, and the contract checks of those items pass over the built manifest.
2. The name-collision positive list holds every export of the fifteen entry points and the item-names list every new root directive file; both tests pass.
3. The README's Entry points table and status line and the changelog name the fifteen items; every `UPSTREAM:` line of the wave has its row.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && test -f tools/package/consumer/consumer.ts && test -f packages/ngx-yeti/src/name-collision.node.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && npm exec nx -- test ngx-yeti -- src/name-collision src/item-names contract.node && npm exec nx -- run ngx-yeti:pack-check
```

Heavy: no

## Log

- 2026-10-10 — created by planner
