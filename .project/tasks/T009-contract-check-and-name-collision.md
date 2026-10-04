---
id: T009
title: Add the per-spec contract check for card and lift and the ADR 0080 name-collision test
wave: 2
deps: [T002, T006]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti-testing/src/lib/contract.ts
  - packages/ngx-yeti-testing/src/lib/contract.spec.ts
  - packages/ngx-yeti-testing/src/server.ts
  - packages/ngx-yeti-testing/project.json
  - packages/ngx-yeti/card/src/card.contract.node.spec.ts
  - packages/ngx-yeti/lift/src/lift.contract.node.spec.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
---

# T009 — Add the per-spec contract check for card and lift and the ADR 0080 name-collision test

## Context

ADR 0014 point 3 makes the contract check a layer-3 test: it reads Yeti's built manifest (the `manifest` export of `yeti-css`, written by `yeti-css:yeti-build` as the dist manifest JSON, typed by Yeti's own declarations) and asserts that every class, attribute, marker, value, and event a spec maps has its input, union member, or output, and that no union holds a value the manifest lacks; "the first item spec designs the per-item API in a `*.node.spec.ts`; later specs reuse it" (`.claude/skills/ngx-yeti-testing/SKILL.md`). INTENT.md SC4 requires it to pass for `card` (card.md:326: class `card`; `data-variant`, `data-threshold`, `data-ratio` with unions equal to the vocabularies `variant`, `width`, `ratio`; boolean `data-raised`; marker `data-stretch` on `YetiCardLink`; no events) and `lift` (lift.md:243: class `lift`; `data-lift` mapped to `yetiLift`; `YetiLift` equal to `rise` and `scale`), plus the ADR 0080 name-collision test for `YetiCard`, `YetiCardLink`, `yetiCardToken`, and `NgxYetiLift` against the 46 names Yeti's `yeti.d.ts` exports at the pin. Every later milestone reuses this harness for its items.

## Approach

- A reusable, Node-only harness in `packages/ngx-yeti-testing/src/lib/contract.ts`, exported from `packages/ngx-yeti-testing/src/server.ts` (the Node-only entry; package source may not import `'@ngx-yeti/testing'`, specs may). Its input is a per-item mapping the spec declares (manifest class to directive, attribute to input name and kind, marker to part directive and input, events to outputs); its checks run against the manifest component and the vocabularies at the pin.
- Prove each mapping on rendered output, not on instance fields: for every value of a mapped vocabulary, render the directive on the server (`renderServer()`) or through TestBed and assert the attribute it writes; assert the identity class and that unset inputs render nothing. Union equality has a compile-time half (a value list typed `satisfies readonly YetiVariant[]` plus a type-level exhaustiveness check) and a runtime half (that list equals the manifest vocabulary). No `as` casts (`assertionStyle: 'never'`); narrow `unknown` JSON with type guards. Follow `.claude/skills/type-safety/SKILL.md`.
- Per-item specs: `packages/ngx-yeti/card/src/card.contract.node.spec.ts` and `packages/ngx-yeti/lift/src/lift.contract.node.spec.ts` (the `node` Vitest project picks up `*.node.spec.ts` under an entry point's `src`). A harness self-test in `packages/ngx-yeti-testing/src/lib/contract.spec.ts` shows that a missing input, an extra union value, and a missing value each fail.
- `packages/ngx-yeti/src/name-collision.node.spec.ts`: read the names Yeti's built `yeti.d.ts` exports at the pin (46 at `f52d1e8`, ADR 0080's 2026-10-03 note) and assert none equals a name the package exports: at least `YetiCard`, `YetiCardLink`, `yetiCardToken`, `NgxYetiLift`, every runtime export of each secondary entry point, and the `YetiStylesConfig` type; Yeti's own re-exported types from the primary entry point are excluded by construction.
- `packages/ngx-yeti-testing/project.json`: add `implicitDependencies: ["yeti-css"]` if the harness's own spec reads the manifest, so `test` and `typecheck` run after `yeti-build` through the existing `^yeti-build` target defaults.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (layer 3, contract check), `.claude/skills/ngx-yeti-specs/SKILL.md` (naming, ADR 0080), `.claude/skills/yeti-pin/SKILL.md` (what package and test code may read from Yeti).

## Interface contract

- The primary entry point ngx-yeti re-exports with `export type *` every type of the generated file packages/ngx-yeti/src/yeti-types.ts, a copy of Yeti's built yeti.d.ts at the pin, including `YetiComponentName`, `YetiKind`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`; item entry points import these types with `import type { ... } from 'ngx-yeti'` and never from `'yeti-css'`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- ngx-yeti/lift exports `NgxYetiLift`: selector `[yetiLift]`, exportAs `yetiLift`, input `yetiLift: YetiLift | ''` where unset and `''` render no `data-lift`; host: static class `lift`, static `data-ngx-yeti-item-lift=""`, `data-lift` from the input; acquires the `lift` item file.

## Intent coverage

- SC4

## Acceptance criteria

1. Under `npx nx test ngx-yeti`, `card.contract.node.spec.ts` passes card.md:326's contract check against the built manifest, and `lift.contract.node.spec.ts` passes lift.md:243's.
2. The harness in `packages/ngx-yeti-testing/src/lib/contract.ts` is item-agnostic and exported from the Node-only entry, and its self-test proves a missing input, an extra union value, and a missing vocabulary value each make the check fail.
3. `packages/ngx-yeti/src/name-collision.node.spec.ts` passes for `YetiCard`, `YetiCardLink`, `yetiCardToken`, `NgxYetiLift`, every runtime export of the `styles`, `card`, and `lift` entry points, and `YetiStylesConfig`, against the names Yeti's built `yeti.d.ts` exports at the pin.
4. Every target that reads Yeti's build in this task runs after `yeti-css:yeti-build`.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti ngx-yeti-testing` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && test -f packages/ngx-yeti/lift/src/lift.contract.node.spec.ts && npx nx test ngx-yeti -- contract.node.spec name-collision.node.spec && npx nx test ngx-yeti-testing && npx nx run-many -t typecheck -p ngx-yeti ngx-yeti-testing
```

Heavy: no

## Log

- 2026-10-04 — created by planner
