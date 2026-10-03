# 24. Prototype: the package beside Tailwind v4 in one Angular application

Type: prototype
Status: resolved
Blocked by: 04, 23
Labels: wayfinder:prototype
Map: ../map.md

## Question

Does an Angular application that uses both the package (Yeti's layered CSS, loaded and unloaded per component) and Tailwind v4 render both correctly? How do Yeti's layers and Tailwind's layers (`theme`, `base`, `components`, `utilities`) and preflight cascade against each other? And what layer order, if any, should the package document or set?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 34. We must verify that ngx-yeti works with Tailwind v4 and design how their styles and layers would overlap/cascade properly when using both in a consuming Angular application project.

## How to work it

Build an Angular 22.2 application under `D:/tmp/` with Yeti at `f52d1e8b9`, the strongest lazy-loading candidate from [Research: Yeti's cascade layers and stylesheet order, for lazy loading](23-research-yeti-layers-and-import-order.md), and Tailwind v4 set up with `ng add tailwindcss`. The old map's PostCSS prototype found that this merges `@tailwindcss/postcss` into `postcss.config.json`, and that Angular's own automatic setup covers only v3.

Measure in Chromium, Firefox, and WebKit:

- Tailwind's preflight against Yeti's base;
- a utility on a Yeti component (spacing, colour, display);
- a Tailwind utility whose name matches a Yeti class or attribute;
- Yeti's tokens and `light-dark()` beside Tailwind's theme variables;
- each candidate order: Tailwind first, Yeti first, or one shared `@layer` statement;
- a lazily loaded Yeti part arriving after Tailwind;
- an unload of that part.

Report computed-style differences against each library alone. Capture under `prototypes/yeti-tailwind/`, and append an `## Answer` with the recommended order and what a consumer writes. Decide nothing.

## Answer

Resolved 2026-10-01 (Opus 5.5). Capture: [prototypes/yeti-tailwind/README.md](../prototypes/yeti-tailwind/README.md). An Angular 22.2.1 zoneless client app in `D:/tmp/ngx-yeti-24/app` used Yeti `f52d1e8b9` (built in `D:/tmp/ngx-yeti-24/yeti`), with the always-group global and parts through `styleUrl` (ticket 23's L1 and P1), and Tailwind 4.3.3 from `ng add tailwindcss`. Production builds were measured in Chromium 153, Firefox 155, and WebKit 26.6 through Playwright 1.63.0, light and dark, against Yeti alone and Tailwind alone. The results were the same in all three engines. Nothing is decided.

- **Plain orders (measured).** With Tailwind first (the `ng add` default plus Yeti appended), every `yeti` layer sits above `utilities`, so `p-8`, `bg-*`, `block`, and `hidden` lose on Yeti components, the lazy card included. With Yeti first, preflight's `base` beats all of Yeti and 63 Yeti elements change, for example button backgrounds, heading sizes, and the center-in-stack margins.
- **Shared statement (measured).** `@layer theme, base, yeti, components, utilities;` before both imports kept Yeti above preflight and utilities above Yeti. Yeti's sublayers kept their order, and Beasties' critical `<style>` starts with the same statement. Preflight still sets what Yeti leaves unset: list markers disappear (visible in screenshots) and a Yeti modal dialog loses its centring (x=572 to x=0), because preflight's `* { margin: 0 }` has no `:not(dialog)`.
- **No preflight (measured).** `@layer theme, yeti, utilities;` with `tailwindcss/theme.css` and `utilities.css` imported into those layers gave Yeti markup identical to Yeti alone, kept the dialog centred, and let utilities win.
- **Name collisions (measured).** Of Yeti's 49 class names and 93 attribute names, Tailwind generates `container`, `grid`, `table`, and `hidden`. Tailwind's scanner finds these names in Yeti markup. `grid`, `table`, and `[hidden]` came out the same. `.container` capped a Yeti container at 1024px at a 1100px viewport in every order. `@source not inline('container');` removed it.
- **Tokens (measured).** No custom property name is shared. Both token sets resolve together, and `bg-(--yeti-color-primary)` works. Forcing `html { color-scheme: light }` under a dark OS flips Yeti's `light-dark()` colours, but Tailwind's `dark:` variant still follows the OS.
- **Lazy part and unload (measured).** The card's `<style>` count went 1, 0, 1. The layer order never moved. The page after unload matched the page before insert with 0 differences, and the reinsert and a fresh clone matched the first insert. `@tailwindcss/postcss` rewrites every sheet, Yeti's component sheets included (a licence banner, merged layers, a `properties` fallback for Yeti's `@property`), with 0 computed differences.
- **What a consumer would write, as options (from the measurements):**
  - C1 keeps preflight: the shared statement, `@import 'tailwindcss';`, `@source not inline('container');`, then Yeti's always-group. It needs a fix for list markers and dialog margins, which was not measured.
  - C2 drops preflight: `@layer theme, yeti, utilities;`, the two layered Tailwind imports, the `@source` line, then Yeti.
  - Where the line lives: in the docs, in a package-shipped first import, or written by an `ng add`. The last two are inferred and were not built. Component styles cannot set it, because the global sheet declares the order first.
- **Not measured:** SSR and hydration with Tailwind, `ng serve` and HMR, Shadow DOM, a custom `dark` variant, Tailwind's `prefix()`, and other Yeti parts' unset properties under preflight.
