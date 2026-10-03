# Prototype: Yeti beside Tailwind v4 in one Angular application

Ticket: [24](../../issues/24-prototype-ngx-yeti-with-tailwind-v4.md). Throwaway. Written 2026-10-01 by Opus 5.5. Builds on [ticket 23's findings](../../research/yeti-layers-and-import-order.md) (layer order, append insertion) and [ticket 04's](../../research/yeti-styles-and-lazy-loading.md) (`styleUrl` lazy parts). Nothing here is decided.

Each claim is labelled **measured** (run in a browser or a build today), **read** (from source, with a path), or **inferred** (follows from the measured or read facts, not run).

## Question

Does an Angular application that uses both Yeti (layered CSS, parts loaded and unloaded per component) and Tailwind v4 render both correctly? How do Yeti's layers and Tailwind's `theme`, `base` (preflight), `components`, and `utilities` cascade against each other? What layer order should the package document or set, if any?

## Setup

- **Yeti** `f52d1e8b9`, exported with `git archive` to `D:/tmp/ngx-yeti-24/yeti`, `npm ci`, `npm run build` ("wrote dist/ (29 entries)"). The clone was not changed. Installed in the app as `yeti-css` from that folder (a symlink).
- **App**: `npx @angular/cli@22.2.1 new app --ssr=false --style=css` in `D:/tmp/ngx-yeti-24/app`, with `CLAUDECODE` unset. Installed: `@angular/core` and `@angular/build` 22.2.1. No `zone.js` and no zone provider: zoneless by default (read in `workspace/src/app` and `package.json`). Not SSR; the production build still runs Beasties on `index.html`.
- **Tailwind**: `npx ng add tailwindcss --skip-confirmation`. It printed "The tailwindcss package does not provide `ng add` actions. The Angular CLI will use built-in actions", created `.postcssrc.json` with `{"plugins": {"@tailwindcss/postcss": {}}}`, appended `@import 'tailwindcss';` to `src/styles.css`, and added `tailwindcss`, `@tailwindcss/postcss` (`^4.1.12`, installed 4.3.3) and `postcss` (measured; the two files are `workspace/.postcssrc.json` and `workspace/src/styles.ng-add.css`).
- **Lazy loading as ticket 23 measured it** (option L1 plus P1): the global `styles.css` carries Yeti's always-group (`layers.css`, 8 tokens, 6 base files, `layouts/attributes.css`). The eager parts (stack, cluster, grid, box, center, container, button, badge, table, alert, in Yeti's order) come from `Eager`'s `styleUrl`; the card comes from `LazyCard`'s `styleUrl`, inside `@if (show())` and `@defer (on immediate)`, in its own lazy chunk. Both use `ViewEncapsulation.None` and `OnPush`; the toggle is a signal. Production budgets were raised in `angular.json` because the component sheets exceed 8 kB.
- **Configurations** (`scripts/build.mjs` rewrites `src/styles.css` and the two part files, then `ng build` into `dist/<name>`):

| Name | Global `styles.css` | Yeti parts |
| --- | --- | --- |
| `Y0` | Yeti always-group, PostCSS configuration renamed away (Yeti alone, no Tailwind plugin) | yes |
| `Y` | Yeti always-group, with `.postcssrc.json` (the Tailwind plugin runs, nothing imports Tailwind) | yes |
| `T` | `@import 'tailwindcss';` (Tailwind alone) | empty files |
| `TY` | Tailwind first, Yeti after (what `ng add` leaves plus Yeti appended) | yes |
| `YT` | Yeti first, Tailwind after | yes |
| `S1` | `@layer theme, base, yeti, components, utilities;` then Tailwind, then Yeti | yes |
| `S1n` | `S1` plus `@source not inline('container');` | yes |
| `S3` | `@layer theme, yeti, utilities;` then `@import 'tailwindcss/theme.css' layer(theme);`, `@import 'tailwindcss/utilities.css' layer(utilities);`, then Yeti (no preflight) | yes |
| `S3n` | `S3` plus `@source not inline('container');` (built for the container check only) | yes |

- **Page** (`workspace/src/app/eager.html`): plain elements (headings, list, `hr`, button, inputs, table, `details`), Yeti markup (button, badge, alert, stack, cluster, a center in a stack, grid, table, container, `[hidden]`), Yeti markup carrying utilities (`button.p-8.mt-4.bg-red-500.text-white.block`, `alert.px-10.bg-emerald-200.text-emerald-900.inline-flex`, `stack.gap-10.hidden`, `p.text-xl.font-bold.underline`, and the lazy `card.p-12.bg-amber-100.text-amber-900.flex`), Tailwind-only markup, and token probes (inline `var(--color-red-500)`, `var(--yeti-color-primary)`, and `bg-(--yeti-color-primary)`).
- **Browsers**: Playwright 1.63.0 (Yeti's dev dependency): Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6, headless, 1280x900, `reducedMotion: 'reduce'`, light and dark `colorScheme`. Each page was served from `dist/<name>/browser` by a small Node server.
- **Steps per page** (`scripts/measure.mjs`): wait for Beasties' `media="print"` link to switch; record the layer order in CSSOM order; snapshot every computed longhand of every element under `main` (and `::before`/`::after`), plus `:root` tokens; in the dark run, set `html { color-scheme: light }` inline and snapshot again; click to insert the card, snapshot; remove, snapshot; insert again, snapshot; replace `main` with a fresh clone, snapshot.

## How to run

```sh
# in D:/tmp/ngx-yeti-24 with yeti/ built and app/ created as above; scripts/ copied to measure/
node measure/build.mjs                  # all configurations, or: node measure/build.mjs S1 S3
node measure/measure.mjs                # chromium firefox webkit -> snap-<engine>.json (80-110 MB each, not kept)
node measure/analyze.mjs && node measure/summary.mjs
node measure/report.mjs chromium light probes
node measure/collisions.mjs; node measure/narrow.mjs; node measure/pixels.mjs; node measure/dialog.mjs; node measure/cssdiff.mjs
```

## Results

### 1. Layer order in the browser (measured, same in all three engines)

| Config | Top-level order (weakest first) |
| --- | --- |
| `TY` | `properties, theme, base, components, utilities, yeti` |
| `YT` | `properties, yeti, theme, base, components, utilities` |
| `S1`, `S1n` | `properties, theme, base, yeti, components, utilities` |
| `S3` | `properties, theme, yeti, utilities` |

Yeti's six sublayers stayed in Yeti's order inside `yeti` in every configuration. Beasties' critical `<style>` in the built `index.html` begins with the same statements, for example `@layer properties;@layer theme,base,yeti,components,utilities;@layer theme,base,components,utilities;` for `S1` (measured), so the order holds before and after the full sheet loads. Inserting and removing the lazy card never changed the order (`results/summary.json`, `layersMoved:false`).

### 2. Tailwind's PostCSS plugin on Yeti's own CSS (measured)

- `@tailwindcss/postcss` runs on every stylesheet, not only the one that imports Tailwind: the Yeti-only global sheet grew from 59,396 to 60,814 characters, and each component sheet gained `/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */` (the lazy chunk went from 6,510 to 6,576 bytes). It merges adjacent layer blocks, adds `@supports (color: color-mix(...))` fallbacks, and turns Yeti's six `@property` registrations into an extra `@layer properties` fallback that sets `--yeti-hue-*` and `--yeti-chroma` on `:root` under an old-Safari and old-Firefox `@supports` test (`results/cssdiff.json`).
- Computed styles of `Y` against `Y0`: **0 differences** in all three engines, light and dark. The `properties` layer comes first and holds only that fallback, so it sits below everything (inferred from section 1).

### 3. Each order against Yeti alone (measured)

Counts are elements of Yeti-authored markup without utilities whose computed style differs from `Y0`, after dropping sizes and origins that follow from other changes, `tab-size`, `-webkit-tap-highlight-color`, and border styles on sides with no width. The same in all three engines and both schemes (`results/summary.json`; per-element lists in `results/diff-vs-yeti-chromium-light.txt`).

| Config | Yeti elements changed | What changed |
| --- | --- | --- |
| `TY` | 9 | preflight properties Yeti never sets (below) |
| `YT` | 63 | preflight beats all of Yeti: buttons lose background, border and radius; headings drop to 18px and weight 400; flow margins go to 0; code loses padding; the center in a stack loses its auto margins (110px to 0) |
| `S1`, `S1n` | 9 | as `TY` |
| `S3` | 0 | none (the `.container` collision of section 5 aside) |

The 9 elements in `TY` and `S1`: `ul`/`ol` and their `li` get `list-style-type: none` (preflight `ol, ul, menu { list-style: none }`, `tailwindcss/preflight.css:202-208`, read), buttons get `appearance: button` (`:380`), `option` padding goes to 0, and `hr` side colours change. On element screenshots (`scripts/pixels.mjs`, byte comparison against `Y0`), the list **differs** in all three engines (no markers), while the plain button, the Yeti button, the `hr`, and the select are byte-identical. On every element, preflight's `border: 0 solid` (`preflight.css:7-16`) leaves `border-*-style: solid` where Yeti alone has `none`; that shows only where something later sets a border width without a style (inferred; not found on this page).

**Dialog centring (measured, `scripts/dialog.mjs`).** Yeti's reset is `*:not(dialog) { margin: 0 }` (`base/reset.css`, read), and `components/dialog/dialog.css:4` says so "the browser's own centring survives". Preflight's `* { margin: 0 }` has no such exception, and Yeti sets no dialog margin of its own. With `dialog.css` appended and `showModal()`: `Y0` and `S3` put the dialog at x=572 (margin-left 571.6px); `TY` and `S1` at x=0 (margin 0); `YT` at x=0 and width 40px. Same in all three engines.

### 4. Utilities on Yeti components (measured, all engines and schemes)

A probe "wins" when the utility's properties match Tailwind alone (`results/probes-<engine>-<scheme>.txt`):

| Probe | `TY` | `YT`, `S1`, `S1n`, `S3` |
| --- | --- | --- |
| `button.p-8.mt-4.bg-red-500.text-white.block` | loses: padding 3.38px, Yeti primary, `inline-flex` | wins: 32px, red-500, white, `block` |
| `alert.px-10.bg-emerald-200.text-emerald-900.inline-flex` | loses | wins |
| `stack.gap-10.hidden` | loses: `display: flex`, gap 18px | wins: `none`, 40px |
| lazy `card.p-12.bg-amber-100.text-amber-900.flex` | loses: 18px, Yeti surface | wins: 48px, amber |
| `p.text-xl.font-bold.underline` | wins (Yeti declares none of these on `p`) | wins |

So in `TY` a utility applies only where no Yeti layer declares that property, because every `yeti` layer sits above `utilities`.

### 5. Names Tailwind and Yeti share (measured)

`scripts/collisions.mjs` compiled every one of Yeti's 49 class names and 93 attribute names with a fresh Tailwind 4.3.3 compiler. Four produce a utility: `container`, `grid` (`display: grid`), `table` (`display: table`), and `hidden` (`display: none`; Yeti uses it only as the `[hidden]` attribute). Tailwind's scanner finds these words in the Angular templates, so writing Yeti markup generates them.

- `.grid` and `.table`: Tailwind's rule sets the same `display` Yeti does; grid columns (three of 414.7px) and table width (1280px) matched `Y0` in every mix.
- `.container`: Yeti sets only `container-type: inline-size`; Tailwind adds `width: 100%` and a `max-width` per breakpoint. In every mix without the `@source` line, `S3` included, a Yeti container at a 1100px viewport was 1024px wide and not centred, against 1100px in `Y0` (`scripts/narrow.mjs`, all engines); at 600px no difference. `S1n`'s and `S3n`'s `@source not inline('container');` removed the utility from the CSS and gave 1100px in all engines.
- `[hidden]`: both libraries hide it with `!important` (Yeti in `yeti.reset`, preflight in `base`); `display: none` everywhere.

### 6. Tokens and `light-dark()` (measured)

- No custom property name is shared: Yeti's are `--yeti-*` and `--_yeti-*`, Tailwind's `--color-*`, `--spacing`, `--font-*`, `--default-*`, `--tw-*` (read from both sources). In every mix both resolve: `var(--color-red-500)` gave `oklch(0.637 0.237 25.331)`, `var(--yeti-color-primary)` gave `oklch(0.52 0.15 250)` (light) and `oklch(0.7 0.15 250)` (dark), and `bg-(--yeti-color-primary)` painted Yeti's primary.
- Yeti puts `color-scheme: light dark` on `:root` (`tokens/color.css:23`, read); `:root` kept it in every mix. Tailwind's `dark:` variant follows `prefers-color-scheme`. With the OS dark and `html { color-scheme: light }` set, Yeti's colours flipped to light while `dark:bg-slate-900 dark:text-white` stayed dark, in all engines and every mix (`forcedLight` in the dark probe files).
- Body text in `YT` took Tailwind's font stack instead of Yeti's `system-ui, sans-serif`; in the other mixes Yeti's typography held.

### 7. Yeti on Tailwind-only markup (measured)

Against Tailwind alone, every mix changes the 11 Tailwind-only elements: Yeti's base sets the font size (16px to 18px), line height, `accent-color`, `color-scheme`, flow margins (`margin-top` 18px on a list and a link, 31.98px on an `h2`), and a background on the plain `<button>` (Yeti's control style, because no utility sets one). Utility-set properties held in `S1` and `S3` and `YT`; in `TY` Yeti's heading size beat `text-3xl` (42.6px against 30px) and its control padding beat `py-2`.

### 8. The lazy part and its unload (measured)

In every configuration and engine, light and dark: one card `<style>` after insert, 0 after removal, 1 after reinsert (`ins:1,0,1`). The page after removal matched the page before insert with 0 differing declarations; the reinserted card matched the first insert, and a fresh clone of `main` matched both, so the stale-style effect ticket 23 saw in Chromium and WebKit did not appear here. Against Yeti alone the plain card differed by 0 declarations in `S3`, only in `tab-size` and border styles in `TY`/`S1` (29 to 34), and by 109 to 115 in `YT`. Tailwind utilities on the card applied once it arrived in every order but `TY`.

## Verdict

- Both libraries can render correctly in one Angular 22.2 zoneless app with `ng add tailwindcss`, but **not in either plain import order**. Tailwind first puts all of Yeti above Tailwind's utilities, so utilities lose on Yeti components. Yeti first puts preflight above all of Yeti and breaks most Yeti markup. (measured)
- One shared statement placed before both imports fixes the cross-library order, and the lazy parts follow it, because they only add to layers the global sheet already placed. (measured)
- With preflight kept (`S1`), preflight still fills every property Yeti leaves unset: lists lose their markers and Yeti's dialogs lose their centring. (measured)
- Without preflight (`S3`), Yeti markup matched Yeti alone, and utilities still won. (measured)
- In every order, Tailwind's `.container` utility, generated from Yeti's own class name, changes a Yeti container's width between Tailwind's breakpoints. One `@source not inline('container')` line in the consumer's sheet prevents it. (measured)

## Options for the decision (none chosen)

What the consumer writes in `src/styles.css`. The `ng add tailwindcss` default (`TY`) and Yeti first (`YT`) are not among them: section 3 and 4 measured both breaking.

- **C1. Shared statement, preflight kept (`S1`)**:

  ```css
  @layer theme, base, yeti, components, utilities;
  @import 'tailwindcss';
  @source not inline('container');
  /* Yeti's always-group, layers.css first */
  ```

  Utilities win; Yeti beats preflight where both declare something. Lists lose markers and dialogs lose centring unless something restores them; the restoring rule's layer was not measured.
- **C2. Shared statement, no preflight (`S3`)**:

  ```css
  @layer theme, yeti, utilities;
  @import 'tailwindcss/theme.css' layer(theme);
  @import 'tailwindcss/utilities.css' layer(utilities);
  @source not inline('container');
  /* Yeti's always-group */
  ```

  Yeti markup matched Yeti alone and utilities win. Tailwind-only markup gets Yeti's base instead of preflight. The `@source` line gave the Yeti container its full 1100px here too (`S3n`, measured).
- **Where the line lives.** It can be written by the consumer from the docs, shipped by the package as a ready file the consumer imports first (inferred, not built), or written by an `ng add` for the package (inferred, not built). The package cannot set Tailwind's order from component styles: the order is fixed by the first declaration, which is in the global sheet and Beasties' copy of it (sections 1 and 8, and ticket 23).
- **Dark mode.** Tailwind's `dark:` does not follow a page that forces Yeti's scheme with `color-scheme`. A custom `dark` variant keyed to the same attribute or class the page uses would align them (inferred, not measured).
- **Name collisions.** `@source not inline(...)` for `container` (measured). Tailwind's `prefix()` option would also avoid all four (inferred, not measured, and it changes every utility in the consumer's markup).

## What this prototype does not prove

- SSR, hydration, incremental hydration, and event replay with Tailwind present. Ticket 23 measured them without Tailwind; this app is client-rendered with Beasties' build-time copy only.
- `ng serve` and HMR, Shadow DOM encapsulation, `Emulated` encapsulation, and right-to-left.
- Viewports other than 1280px, plus 1100px and 600px for the container.
- Yeti parts other than the eleven loaded here and the dialog. The other preflight effects (`border-style: solid`, `tab-size`, `appearance: button`, `option` padding) had no visible effect on this page; whether some Yeti part sets a border width without a style was not checked.
- A rule restoring list markers and dialog margins under C1, and in which layer it would have to sit.
- Tailwind's `prefix()` and a custom `dark` variant. `S3n` was measured only for the container width, not with the full snapshot.
- Whether the shared statement can be supplied by Yeti's own always-group file instead of the consumer's sheet.
