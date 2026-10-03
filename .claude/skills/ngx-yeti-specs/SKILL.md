---
name: ngx-yeti-specs
description: 'This skill should be used when implementing, planning, or answering questions about an ngx-yeti spec or record in docs/specs: "implement the accordion spec", "build the setup spec", "what does ADR 0060 decide", "which records does the tabs spec depend on", "where does this directive go", or when two records seem to disagree. Covers the reading order, which record wins, the per-item file layout and naming rules, the implementation level order, and which skill holds the test, story, accessibility, and Yeti rules.'
---

# Implementing an ngx-yeti spec

`docs/specs/` is a verbatim copy of the planning bundle. Never edit it; it is a record, and Prettier and Nx ignore it. Code, tests, and stories go in the workspace projects.

## Read in this order

1. `docs/specs/README.md`: what the bundle holds and the upstream commit each `Y/`, `NG/`, `NGP/`, `NC/`, `APG/` citation means.
2. `docs/specs/map.md`, sections Destination and Notes: the scope and the user's standing rulings, quoted verbatim. These bind.
3. The spec under `docs/specs/specs/<name>.md`. Its header names its Deciding records; read each one it cites before writing code.
4. `docs/specs/building-blocks.md` Part 1 (cross-cutting rules) and the spec's Part 2 row.
5. `docs/specs/ledger.md` rows the spec owns, and `docs/specs/upstream-bugs.md` entries it works around.
6. `docs/specs/CONTEXT.md` for any glossary term in bold.

Each spec is long (30 to 100 KB). Read its Testing Decisions and Implementation Decisions sections in full, and use `rg` for the rest.

## When records disagree

- A dated note (`- 2026-10-03: ...`) supersedes the earlier text of its own record.
- A later dated decision supersedes an earlier one elsewhere. Ticket 50 (`issues/50-decide-open-points-of-the-specs.md`) and ticket 93 are the orchestrator's decisions under the user's full-AFK ruling, not the user's; each records how to overrule it.
- `architecture-guide.md` ranks below every record (README).
- The workspace's test configuration and the `ngx-yeti-testing` skill win over the Stack column of `building-blocks.md` 1.12, which predates ADR 0014's 2026-10-03 notes and ticket 93. Its stale points: a static fixture app served by a file server (the fixture is a server build with Prerender and Server routes), layer 1 in Chromium only (three engines in CI), layer 2 under `@angular/build:unit-test` (a Vitest command), `mount(storyId, props?)` (stories open through `openStory(page, id)`, without props), and the floor "not yet decided" (ticket 93 decided it).
- A spec that asserts CSS `:hover` in a play function moves that assertion to layer 2 or 4 (`ngx-yeti-stories` skill).

## Order of work

- Implement `setup` first. It owns `ngx-yeti/styles` (the item-file loader every directive calls), the generated `yeti-types.ts` copy of `yeti.d.ts` that every input type imports, the rank table, and how `ngx-yeti/accessibility.css` is published and imported. The scaffold `NgxYeti` component and `Highlight` directive in `packages/ngx-yeti/src/lib/` appear in no spec, and they make the primary entry point more than types-only. Remove them when `setup` makes it types-only. Their specs and stories are today's test patterns, and the Fixture app's `highlight` fixture and the `yeti-app-e2e` and `ngx-yeti-e2e` assertions use them, so move those fixtures and assertions to the first real item in the same change.
- The first item spec that writes an accessibility rule creates `accessibility.css` and adds `@import 'ngx-yeti/accessibility.css';` last in `packages/ngx-yeti/.storybook/styles.css` and in `apps/yeti-app/src/styles.css`. That specifier does not resolve in the workspace today: there is no `node_modules/ngx-yeti`, and tsconfig paths do not apply to CSS `@import`. So the same change publishes the file through ng-packagr assets and the package `exports` map (ticket 50 decision 68), and makes both builds resolve it (for example a Vite alias in `.storybook/main.ts` and a matching resolution for the application build), then proves both builds load it.
- Then `generated-ids`, `events`, `fragment-links`, and `navigation-close`, which item specs depend on.
- Then items. Per item, the implementation level order is native platform feature, then `@angular/aria`, then `@angular/cdk`, then custom Angular (map, Implementation order); the spec states where it stopped.
- `@angular/cdk` and `@angular/aria` are not installed yet. Install the version matching `@angular/core` (22.2.x) when the first spec needs one, and declare it as a peer in `packages/ngx-yeti/package.json` as the spec says.

## Where code goes

One secondary entry point per item, plus `styles`, `generated-ids`, `fragment-links`, `navigation-close`, and the type-only `events`; the primary entry point `ngx-yeti` is types-only (building-blocks 1.3 and Part 2 row 50; `docs/specs/specs/events.md`; ADR 0011 clause 10).

Create each entry point with the generator, which writes `packages/ngx-yeti/<item>/ng-package.json`, `<item>/src/index.ts`, and the `ngx-yeti/<item>` path alias in `tsconfig.base.json`:

```sh
npx nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name=<item> --skipModule
```

Files in `packages/ngx-yeti/<item>/src/`:

| File                            | Holds                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                      | Exports the item's classes and tokens; no array of them (ADR 0018)                                                                              |
| `<item>.ts`, `<item>-<part>.ts` | One directive class per file, suffix-less names                                                                                                 |
| `<item>-tokens.ts`              | `InjectionToken<Parent>`; imports the parent class with `import type`; parts import the token as a value to `inject()` it (building-blocks 1.9) |
| `<item>.spec.ts`                | Layer 2 (Vitest browser mode)                                                                                                                   |
| `<item>.ssr.spec.ts`            | Layer 3 server-render smoke                                                                                                                     |
| `<item>.stories.ts`             | Layer 1 stories, `meta.id` pinned to `<item>`                                                                                                   |

Another entry point is imported by its package path (`ngx-yeti/<other>`), never by a relative path. No `@defer` in package templates (ADR 0011 clause 10).

Naming (ADR 0012, ADR 0080): selectors `yeti` + camelCase (`[yetiCard]`), `exportAs` the class name with a lowercase first letter, classes `Yeti` + PascalCase item and part. A class whose name equals a name exported by Yeti's `dist/yeti.d.ts` takes `NgxYeti` instead (six today: `NgxYetiColumns`, `NgxYetiAttention`, `NgxYetiEnter`, `NgxYetiLift`, `NgxYetiPrint`, `NgxYetiPaint`). Runtime names the package writes into the page start with `ngx-yeti`: `--ngx-yeti-*`, `@layer ngx-yeti`, `data-ngx-yeti-*`, ids `ngx-yeti-<item>-<n>`.

## Other skills

- `ngx-yeti-testing`: the four test layers, which file a test goes in, the shared helpers, commands.
- `ngx-yeti-stories`: story conventions and the axe story gate.
- `ngx-yeti-accessibility`: WCAG 2.2 AA criteria, contrast assertions, ledger rows.
- `yeti-pin`: the vendored Yeti, its build, what package code may read, and moving the pin.
- `type-safety`: the lint and type rules every TypeScript file meets.

## Done for a spec

`npm run check` passes (lint, typecheck, test, test-storybook), `npx nx e2e ngx-yeti-e2e` and `npx nx e2e yeti-app-e2e` pass, `npx nx build ngx-yeti` passes, and every ledger row the spec owns is closed by a test named in its Testing Decisions. `test`, `test-storybook`, and `build-fast` compile with Analog `fastCompile` and never type-check; `typecheck` is the type gate (`references/fast-compile.md`).
