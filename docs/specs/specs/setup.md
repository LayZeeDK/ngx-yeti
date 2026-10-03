# Spec: Setup (shared-utility spec)

Ticket: [38. Spec: Setup (shared spec)](../issues/38-spec-setup.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) (the loader and what the consumer writes), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md) (the presence attribute), [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) (the pin and the Nx build of Yeti), [ADR 0017](../adr/0017-release-policy-with-a-pinned-yeti.md) (the version format), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) (the rendering-modes contract), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) (the `TransferState` seed), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) (runtime names); [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) with its [prototype](../prototypes/style-loading/README.md); [Research: Yeti's cascade layers and stylesheet order](../issues/23-research-yeti-layers-and-import-order.md); [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md); [Research: what `@boundary` and `@error` could add](../issues/36-research-boundary-and-error-blocks.md) and [Prototype: consumer `@boundary` and `@error` blocks around ngx-yeti](../issues/37-prototype-consumer-boundaries-around-ngx-yeti.md); [building-blocks.md](../building-blocks.md) 1.11, 1.13, and Part 3; the map's Standing rulings on vendoring, hydration features, JavaScript off, hydration constraints, zoneless, deployment URLs, the version format, and directive testing ([map.md](../map.md)); [upstream-bugs.md](../upstream-bugs.md) rows A4 and A8. Decisions of the orchestrator in full AFK mode are cited as "ticket 50 decision N" ([ticket 50](../issues/50-decide-open-points-of-the-specs.md)). The points this spec's ticket listed as open were decided in ticket 50 (decisions 45 and 68 to 73), and each is cited where it applies.

## Problem Statement

An application developer who wants Yeti's look and the package's directives in an Angular 22.2 application has to get several things right once, before any item renders correctly, and none of them can be done by a directive:

- **Yeti is not on npm.** Its `develop` branch is the only source, a git or tarball dependency installs without `dist/` ([ticket 21](../issues/21-prototype-yeti-as-github-dependency.md)), and the package deliberately ships none of Yeti's CSS, by the user's ruling: "Vendoring: Try to find a way to let the consumer bring a build." (map, Standing rulings). So the developer must build Yeti at exactly the commit the package was built against, and serve its files.
- **Order is everything in Yeti's CSS.** A Yeti item file placed before Yeti's `layers.css` broke 65 or 66 of 98 pages ([ticket 23](../issues/23-research-yeti-layers-and-import-order.md), measured in three engines). Next to Tailwind v4 the plain orders fail both ways: with Tailwind first, utilities lose on every Yeti component; with Yeti first, preflight beats all of Yeti and 63 elements change ([ticket 24](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md), measured). Only the application's global stylesheet can fix the order, because the first declaration of a cascade layer decides its place, and no component style can come first.
- **The package's accessibility rules need a place in that order.** Yeti has no `forced-colors` rule anywhere, and its required-field marker leaks into the accessible name ([ledger.md](../ledger.md) rows A11Y-1a to A11Y-1f and A11Y-6). The package closes those gaps with its own CSS in its own `ngx-yeti` cascade layer, which must sit above Yeti's.
- **Server rendering only pays off when the application is set up for it.** Without `withI18nSupport()`, a component with `i18n` text is re-rendered destructively at hydration ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) clause 11, measured in ticket 18). A client-only `@defer` block fetches its item file on construct and paints 18 to 20 unstyled frames with a 300 ms delay ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 6, measured). Angular's inlined critical CSS leaves out six of Yeti's nine `:root` token blocks (upstream bug A4).
- **Error boundaries interact with all of it.** Angular 22's `@boundary` around the package's directives works, but a server-only error makes the client rebuild the item, a client-only error leaves a dead copy of the server markup, a click made before hydration is lost, a stylesheet link can outlive its item, and a constructor error on a template's first creation poisons that template for the whole server process (upstream bug A8; [ticket 37](../issues/37-prototype-consumer-boundaries-around-ngx-yeti.md), measured in three engines).
- **The version has to say which Yeti to build.** A consumer who builds Yeti at another commit gets that commit's CSS under the package's pin, which is unsupported ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), Consequences).

Every item spec links here for this one-time setup and says only what its own item adds (its item file and, where it applies, a preload entry).

## Solution

The package documents one setup, written once per application, that is build configuration and providers only. No consumer TypeScript is written per item, no carrier component, and no Yeti class or attribute by hand (ADR 0060 point 11; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)). It has five parts:

1. **Bring Yeti's build at the pin** under the specifier `yeti-css`: in an Nx workspace, a vendored workspace package with a cached `yeti-build` target ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) point 2, [ticket 22](../issues/22-prototype-building-and-consuming-yeti-with-nx.md)); elsewhere, a clone at the pin built with `npm ci && npm run build` and installed as a `file:` or tarball dependency ([ticket 21](../issues/21-prototype-yeti-as-github-dependency.md)). The pin is in the package's version: `0.<Angular major><Angular minor, two digits><breaking counter, two digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>` ([ADR 0017](../adr/0017-release-policy-with-a-pinned-yeti.md)).
2. **Serve it** with one `assets` entry that copies Yeti's 66 built CSS files to `yeti-css/` beside the application (ADR 0060 point 11, measured).
3. **Order it** in the application's global stylesheet: the cascade-layer statement `@layer yeti, ngx-yeti;` first, then Yeti's always-loaded group as 16 imports in Yeti's order with `layers.css` first, then the package's accessibility stylesheet (ADR 0060 points 7 and 8). Beside Tailwind v4, the one shared statement of ticket 24 with `ngx-yeti` after `yeti`, plus `@source not inline('container');`.
4. **Provide** `provideClientHydration(withI18nSupport())` when the application renders on the server (incremental hydration and event replay are on by default in 22.2), optionally `provideYetiStyles({ preload })` for items first rendered by the client, and `provideYetiFragmentLinks()` when the application has bare fragment links such as a skip link.
5. **Nothing else.** Generated ids need no provider ([ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md) point 5), the `TransferState` seed travels on its own, and zoneless change detection, Angular 22's default, needs nothing from the package.

At run time this spec owns the loader that every item directive uses: a root service that keeps one counted `<link rel="stylesheet">` per item file of the consumer's build, writes it on the server, adopts it at hydration, inserts it in Yeti's order, and removes it only once no host for that item is connected (ADR 0060 points 2 to 6; ADR 0045). It also documents, once for every item, how consumer `@boundary` blocks behave around the package (ticket 50 decisions 41 to 44).

## User Stories

1. As an application developer, I want one documented setup that I write once, so that every item I add afterwards needs nothing but its directive attribute.
2. As an application developer, I want the setup to be build configuration and providers only, so that I write no TypeScript per item and no carrier component.
3. As an application developer, I want the package's version to name the Yeti commit it was built against, so that I know exactly which Yeti to build.
4. As an application developer, I want to install an exact package version, so that a caret range never picks a prerelease I did not test, because a caret on a prerelease matches only prereleases of the same core.
5. As an application developer, I want a breaking release to change the version's two-digit counter, so that I can see a break in the version alone.
6. As an Nx workspace developer, I want to vendor Yeti at the pin as a workspace package with a cached build target, so that Yeti builds once and comes from the cache afterwards.
7. As an Nx workspace developer, I want that build target to be an inferred `nx:run-commands` target that Nx 24 keeps, so that the setup survives the executor removals.
8. As a developer outside Nx, I want to build a clone of Yeti at the pin and install it as a `file:` or tarball dependency, so that I can use the package without Nx.
9. As an application developer, I want the package to depend on no `yeti-css` entry in my lockfile, so that my install never fetches an unbuilt Yeti from GitHub.
10. As an application developer, I want one `assets` entry that copies Yeti's built CSS to `yeti-css/`, so that the item files are served next to my application.
11. As an application developer, I want the item files' URLs to follow my `<base href>`, so that an application under a subpath loads them with no extra configuration.
12. As an application developer, I want to be told that `deployUrl` is not supported, so that I do not configure something the package ignores.
13. As an application developer, I want a global stylesheet that declares Yeti's and the package's cascade layers before anything else, so that no later stylesheet can move a cascade layer.
14. As an application developer, I want the always-loaded group listed in Yeti's order, so that tokens, the reset, the base files, and the shared attributes apply before any item file.
15. As an application developer, I want the package's accessibility stylesheet imported last, in the `ngx-yeti` cascade layer above Yeti's, so that its rules win over Yeti's only where they must.
16. As an application developer, I want my own unlayered CSS to keep beating Yeti and the package, so that my application styles behave as CSS always does.
17. As a Tailwind v4 user, I want one shared cascade-layer statement that keeps Yeti above preflight and utilities above Yeti, so that both frameworks work on one page.
18. As a Tailwind v4 user, I want to know which form to choose, with or without preflight, and what each costs, so that list markers and modal dialogs look as Yeti intends.
19. As a Tailwind v4 user, I want `@source not inline('container');` in the documented setup, so that Tailwind's `.container` never caps a Yeti `container`.
20. As an application developer, I want the package's directives to load each item's CSS when the first instance renders and remove it after the last, so that a page carries only the item files it uses.
21. As an application developer, I want item files inserted in Yeti's own order whatever order my items render in, so that a `center` inside a `stack` or a `cover` stays centred.
22. As an application developer, I want two items on one element, such as a card that lifts, to keep both item files, so that neither loses its styles while the element is on the page.
23. As an application developer, I want the presence attributes on hosts to be the package's alone, so that I never write or remove one.
24. As an application developer using SSR or prerendering, I want the item links in the server HTML, so that the first paint is styled.
25. As an application developer using SSR, I want the client to adopt the server's links at hydration, so that no stylesheet is added or removed and no frame paints unstyled.
26. As an application developer using `hydrate never` or `hydrate on ...`, I want a dehydrated host to keep its item file while it is on the page, so that a block Angular does not own stays styled.
27. As an application developer using a class-form `animate.leave`, I want an item file kept until the leaving host is gone, so that the element animates out styled.
28. As an application developer with a function-form `(animate.leave)` listener anywhere, I want item files still removed after their last host, so that Angular's leave guard never keeps styles forever.
29. As an application developer with client-only `@defer` content, I want to list items in `provideYetiStyles({ preload })`, so that their files are fetched before insertion and the first frame is styled.
30. As an application developer, I want `preload` typed with Yeti's own item names, so that a misspelt item fails to compile.
31. As an application developer with a strict CSP, I want the item links to carry the nonce from `CSP_NONCE`, so that they load under my policy.
32. As an application developer with two Angular applications on one document, I want each application to own its links by `APP_ID`, so that one never removes the other's.
33. As an application developer, I want the item links kept out of Angular's critical-CSS inlining, so that no stale copy outlives an unload and the server logs no warning per link.
34. As an application developer, I want to be told about the token blocks Angular's critical CSS leaves out, so that I understand a one- or two-frame flash in Firefox and what I can do about it.
35. As an application developer using `i18n`, I want `withI18nSupport()` in the documented setup, so that my components hydrate instead of rendering twice.
36. As an application developer, I want event replay and incremental hydration on with no extra provider, so that a click before hydration still reaches the package's handlers.
37. As an application developer, I want to know what turning event replay or incremental hydration off costs, so that I can make that choice knowingly.
38. As an application developer, I want the setup to work with zoneless change detection and with zone.js, so that I choose either.
39. As an end user with JavaScript off, I want every item on a server-rendered or prerendered page styled and its native controls working, so that the page is usable without scripts.
40. As an application developer, I want to be told that a client-only application promises nothing with JavaScript off, so that I pick SSR or prerendering when that matters.
41. As an application developer with a skip link, I want `provideYetiFragmentLinks()` in the documented setup, so that the link moves focus in the page instead of reloading it under my `<base href>`.
42. As a keyboard and screen-reader user, I want the skip link to bypass the header on every route, so that WCAG 2.2 2.4.1 is met.
43. As a forced-colours user, I want the package's accessibility stylesheet loaded, so that pressed toggles, selected tabs, checked controls, progress bars, and the current page link are visible.
44. As an application developer who wraps the package in a `@boundary`, I want to know which errors it catches and which it misses, so that I put the boundary in the right place.
45. As an application developer who wraps a `@defer` block, I want to know that the boundary belongs inside the `@defer`, so that a constructor error in deferred content shows my fallback rather than nothing.
46. As an application developer, I want to know that a constructor error on a template's first creation breaks that template for the server process, so that I do not rely on `$reset()` or on prerendered output for that case.
47. As an application developer, I want to know that a boundary's swap at hydration loses a click made before hydration, so that I do not promise replay inside such a region.
48. As an application developer, I want a package directive that throws in its constructor to leak no stylesheet count, so that a caught error does not keep an item file for the page's life.
49. As an application developer, I want the preload list named as the cover for WebKit's unstyled frames after `$reset()`, so that a recovered item paints styled.
50. As an application developer, I want the package's input types to come from the package, so that a missing or wrong types file in my Yeti build can never turn every input into `any`.
51. As an application developer who moves to a new package version, I want to rebuild Yeti at the new pin and have the item URLs change with it, so that no browser keeps an old item file from its cache.
52. As an application developer, I want a Yeti build at the wrong commit to be documented as unsupported, so that I know what I am risking.
53. As an item spec author, I want one place that states the loader's behaviour, so that each item spec names only its item file and its presence attribute.
54. As a package maintainer, I want the rank table and the types module generated at package build from the pin, so that a pin move regenerates them with no hand edits.
55. As a package maintainer, I want the published package to contain none of Yeti's CSS, so that the vendoring ruling holds and a test proves it.
56. As a package maintainer, I want no package template to use `@boundary`, so that the package cannot reach upstream bug A8 itself.
57. As a package maintainer, I want the fixture app built exactly as this setup documents, so that the e2e layer tests what consumers write.

## Implementation Decisions

### 1. Yeti contract

Yeti declares nothing a directive manages for this spec. What it relies on from Yeti at the pin:

- **The built CSS tree** `dist/css/`: `layers.css`, `tokens/*`, `base/*`, `layouts/attributes.css` (the **Always-loaded group**), and the 49 item files `<kind>/<name>/<name>.css` (ADR 0060 point 1; `Y/src/guides/install.md:92-97`). 66 files in all (measured, ticket 13).
- **The `exports` map**, through which `@import 'yeti-css/css/...'` resolves (ADR 0006 point 2).
- **`layers.css`'s order**: `yeti.reset, yeti.base, yeti.theme, yeti.layouts, yeti.components, yeti.utilities`, declared once (`src/layers.css:7`, read in ticket 23).
- **`yeti.css`'s import order**, the source of the rank table (ADR 0060 point 3), and **`yeti.d.ts`**, the source of the generated types module (point 10). Both are read at package build only; runtime code reads neither (ADR 0006 point 7 and its 2026-10-02 note).
- **`bin/build.js`**, which builds `dist/` and runs `bin/validate.js` on the way (ADR 0014 point 5), and Yeti's `engines.node` of 24 or later (ADR 0006, Consequences; inferred from ticket 22).

### 2. Contract mapping

This spec maps no class, attribute, marker, event, or token of an item. What it writes into the page, or asks the consumer to write, is:

| What | Value | Written by | Record |
| --- | --- | --- | --- |
| Presence attribute on an item root's host | `data-ngx-yeti-item-<item>`, static, empty value; only the item's root directive sets it, never a part, child, or any-element marker directive | each item directive | ADR 0045; ticket 50 decisions 6 and 7 |
| Item link | `<link rel="stylesheet" href="<url><kind>/<name>/<name>.css?v=<pin>">` in `<head>` | the loader | ADR 0060 point 2 |
| Item link attributes | `data-ngx-yeti-styles="<item>"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and `nonce` when `CSP_NONCE` is provided | the loader | ADR 0060 point 2; ticket 13 Q4 |
| Preload link | `<link rel="preload" as="style" href="<same URL as the item link>">`, one per listed item, on the server and the client | the loader, from `provideYetiStyles({ preload })` | ADR 0060 point 6 |
| Default `url` | `yeti-css/`, relative to `<base href>` | consumer may override | ADR 0060 point 2; map, deployment URLs |
| Cascade layers | `yeti` (with Yeti's six sublayers), then `ngx-yeti` | the consumer's global stylesheet | ADR 0060 point 7; ADR 0080 point 2 |
| Package CSS | rules inside `@layer ngx-yeti` only | the package's accessibility stylesheet | ADR 0060 point 8; map, Package CSS for accessibility |
| `TransferState` key | `ngx-yeti-ids` (not this spec's; listed because the setup carries it with no provider) | [generated-ids](generated-ids.md) | ADR 0044 point 3 |

Tokens: none. Yeti's tokens are a consumer stylesheet surface ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)); a theme is the consumer's `:root` block after the always-loaded group or a rule in `@layer yeti.theme` (`theming.md:94-96`, `:113`; building-blocks 1.13). The setup adds nothing for them.

### 3. Hierarchy and DI shape

- **The loader**: a root `@Service()` that exists once per application, so the server has one per request (as the generated-ids counter, ADR 0044 point 2). It is called `YetiStyles` in the [style-loading prototype](../prototypes/style-loading/README.md). It injects `DOCUMENT`, `APP_ID`, `CSP_NONCE` (optional), and the configuration from `provideYetiStyles()` (optional). It is not exported (ticket 50 decision 45).
- **The item-file helper**: an injection-context function that each item root directive calls as the last statement of its constructor, after anything in it that can throw (ticket 50 decision 42). It registers the release on the directive's `DestroyRef` first and then acquires the item, so the release always runs if the directive is destroyed (prototype README, "For the package"). Its shape: `injectYetiItemStyles(item: YetiComponentName): void` in a secondary entry point `ngx-yeti/styles`, beside `provideYetiStyles` (ticket 50 decision 45).
- **`provideYetiStyles(config)`** returns `EnvironmentProviders` with the configuration and, when `preload` is not empty, an environment initializer that writes the preload links. It is a purpose-named provider function, never an umbrella `provideYeti()` (architecture-guide P22; building-blocks 1.4).
- **`provideYetiFragmentLinks()`** is the [fragment-links](fragment-links.md) spec's, in `ngx-yeti/fragment-links`. This spec only places it in the documented setup.
- **The rank table**: a constant in the loader's entry point, generated at package build from `yeti-css/css/yeti.css` at the pin: each of the 49 items with its kind, file path, and rank (ADR 0060 point 3; ADR 0006's 2026-10-02 note). The pin itself is a constant beside it, used for the `?v=` query.
- **The types module**: the generated `yeti-types.ts`, a copy of `yeti.d.ts` at the pin, re-exported from the primary entry point `ngx-yeti` (ADR 0060 point 10; ADR 0080 point 5 and its 2026-10-02 note). `YetiComponentName`, the union of the 49 item names, comes from it.
- **The `MutationObserver`** that triggers the removal check is created in `afterNextRender`, so nothing runs on the server, and disconnected on the root injector's `DestroyRef` (building-blocks 1.11 decision 3, render callbacks as the only platform check; ticket 33 rated the records with no `isPlatformBrowser`). ADR 0060 allows connecting it only while some item has a zero live count; that refinement is the implementer's.

### 4. API

#### What the consumer writes

**A. Yeti at the pin.** The package's version carries the pin as its prerelease tag's last identifier (`g` plus the commit's short SHA), and every release's changelog names the full commit (ADR 0017 point 1). In an Nx workspace the consumer vendors Yeti's source at that commit as an npm workspace package named `yeti-css` (the `git archive` set of ADR 0006 point 2, with its `COMMIT` file), and a small local `createNodes` plugin gives it a cached `yeti-build` target that runs `node bin/build.js` through `nx:run-commands`, with `dist/` as its output, git-ignored (ADR 0006 point 2; ticket 22, measured on Nx 23.2.1, with no target Nx 24 removes, map, Standing rulings). Outside Nx, the consumer clones Yeti at the commit, runs `npm ci && npm run build`, and installs the result as a `file:` or packed tarball dependency named `yeti-css` (ticket 21, measured). Building Yeti needs Node 24 or later (inferred, ADR 0006 Consequences). A build at any other commit is unsupported: its CSS is served under the package's pin query (ADR 0060, Consequences).

**B. The `assets` entry**, in the application's build options (ADR 0060 point 11, measured: 66 files copied):

```json
{ "glob": "**/*.css", "input": "node_modules/yeti-css/dist/css", "output": "yeti-css" }
```

In an Nx workspace `node_modules/yeti-css` is the npm workspaces link to the vendored package; that the glob follows the link was not measured (ticket 13, Triage) and is this spec's e2e case.

**C. The global stylesheet** (the application's `styles` entry). The 16 imports and their order come from the [style-loading prototype](../prototypes/style-loading/README.md)'s `styles.css`; the first line is ADR 0060 point 7's, and the last line's specifier is `ngx-yeti/accessibility.css`, published through the package's `exports` map ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 68):

```css
@layer yeti, ngx-yeti;
@import 'yeti-css/css/layers.css';
@import 'yeti-css/css/tokens/scale.css';
@import 'yeti-css/css/tokens/space.css';
@import 'yeti-css/css/tokens/type.css';
@import 'yeti-css/css/tokens/color.css';
@import 'yeti-css/css/tokens/tone.css';
@import 'yeti-css/css/tokens/motion.css';
@import 'yeti-css/css/tokens/surface.css';
@import 'yeti-css/css/tokens/components.css';
@import 'yeti-css/css/base/reset.css';
@import 'yeti-css/css/base/typography.css';
@import 'yeti-css/css/base/prose.css';
@import 'yeti-css/css/base/controls.css';
@import 'yeti-css/css/base/media.css';
@import 'yeti-css/css/base/transitions.css';
@import 'yeti-css/css/layouts/attributes.css';
@import 'ngx-yeti/accessibility.css';
```

The consumer's theme (token values on `:root`) and application CSS come after. Unlayered application CSS beats every Yeti and package cascade layer wherever it sits; a consumer cascade layer declared after the statement sits above both (ticket 23, measured).

With Tailwind v4 the first line becomes the one shared statement, with `ngx-yeti` after `yeti` (ADR 0060 point 7, from ticket 24):

- **C1, with preflight:** `@layer theme, base, yeti, ngx-yeti, components, utilities;`, then `@import 'tailwindcss';`, then `@source not inline('container');`, then the imports above from `layers.css` on. Measured costs (ticket 24): preflight still sets what Yeti leaves unset, so list markers disappear and a Yeti modal dialog loses its centring (preflight's `* { margin: 0 }`); no fix was measured.
- **C2, without preflight:** `@layer theme, yeti, ngx-yeti, components, utilities;`, then Tailwind's `theme.css` and `utilities.css` imported into their cascade layers, then the `@source` line, then the imports above. Measured: Yeti markup identical to Yeti alone, the dialog centred, utilities winning.

The documentation leads with C2 and documents C1 beside it with its two measured losses and no fix; layer 4 tests both ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 70). The `ngx-yeti` cascade layer itself was not part of ticket 24's measurement; that it keeps its place in both forms is inferred from the first-declaration rule and is this spec's e2e case. Item files are copied assets, not stylesheets in the build, so `@tailwindcss/postcss` never rewrites them (inferred; ticket 24 measured it rewriting `styleUrl` sheets with 0 computed differences).

**D. Application providers**, in the application configuration:

- `provideClientHydration(withI18nSupport())` for an application rendered on the server or prerendered. In 22.2 `provideClientHydration()` alone turns on incremental hydration and, through it, event replay (`NGP/platform-browser/src/hydration.ts:159`, checked in building-blocks 1.11), so the documented setup names no other feature. `withI18nSupport()` is required wherever the application uses `i18n` (ADR 0011 clause 11, measured in ticket 18).
- `provideYetiStyles({ preload: [...] })` only when an item first renders on the client: in a client-only `@defer` block, an `@if`, a `@for` that grows, or a route reached by client navigation (ADR 0060 point 6). Each item spec names this line for its item.
- `provideYetiFragmentLinks()` when the application has bare `#id` links the package's directives do not sit on, a skip link above all ([fragment-links](fragment-links.md), usage rules; ADR 0023 point 2).

**E. The package itself**, installed at an exact version, because a caret range on a prerelease matches only prereleases of the same core (map, Standing rulings, Version format). Every release is published with `npm publish --tag latest`, so a bare install gets the newest one (ADR 0017's 2026-10-02 note). The Angular packages are peers from the minor the version names (ADR 0017, carried). The package declares no `yeti-css` dependency or peer dependency while Yeti is unpublished (ADR 0006 point 3; ADR 0060 point 10).

No generator writes B, C, or D in the first milestone (ticket 50 decision 69).

#### `provideYetiStyles(config): EnvironmentProviders`

| Option | Type | Default | Meaning | Record |
| --- | --- | --- | --- | --- |
| `url` | `string` | `'yeti-css/'` | the folder the `assets` entry copies Yeti's `dist/css/` to, relative to `<base href>`, with a trailing slash. A URL that is not relative to `<base href>` is not supported or tested (ticket 50 decision 73) | ADR 0060 point 2; map, deployment URLs |
| `preload` | `readonly YetiComponentName[]` | `[]` | items whose files are preloaded on the server and the client at application start | ADR 0060 point 6; type from the generated `yeti-types.ts` (ADR 0080 point 5) |

Called once, in the application's root providers. The loader is a root service and reads the configuration from the root injector, so a call in a route's providers has no effect (follows from ADR 0060 point 2's root service). Calling it is optional: with no call the loader uses the defaults and preloads nothing.

#### The loader's behaviour

1. **Acquire.** The first acquisition of an item creates its link with the attributes of section 2 and inserts it in `<head>` before the first existing item link whose rank is later, so the links are always in `yeti.css`'s order (ADR 0060 point 3). Later acquisitions only count. This runs on the server too, so the server HTML carries every link the render needed (point 5).
2. **Release.** A release lowers the count and schedules a check for the next animation frame. The check removes an item's link only when its count is zero **and** no element with `data-ngx-yeti-item-<item>` is connected (ADR 0060 point 4; ADR 0045). A `MutationObserver` on the document schedules the same check whenever the DOM changes, so a host that Angular detaches later (after a class-form `animate.leave`, or a dehydrated block that an `@if` removes) is seen. On the server nothing is removed.
3. **Adopt.** At creation on the client, the loader takes over every `<head>` link carrying `data-ngx-yeti-styles` and its own `APP_ID` in `data-ngx-yeti-app`, with a count of zero. A link of another `APP_ID` is never touched (ADR 0060 point 5; two applications inferred, not measured).
4. **Preload.** Each listed item gets one preload link, written once; a link with the same `href` already in `<head>` (the server's) is kept, not duplicated (ADR 0060 point 6; prototype).
5. **Order-sensitive pairs.** `stack` and `center`, `shell` and `center`, and `cover` and `center` tie inside `yeti.layouts`, so only Yeti's order gives full Yeti's result for each (ticket 23, measured for `stack` and `shell`; ticket 50 decision 34 for `cover`): a center in a stack or a cover is centred, and a center placed directly in a shell has 0 margins, because `shell.css` comes after `center.css` (`Y/src/yeti.css:30`, `:39`; ticket 50 decision 86). The [shell](shell.md) spec puts a center inside `main`. Rule 1 covers all of them for any order of first rendering.
6. **Cross-item files.** An item that depends on another item's file acquires it too, and its spec names it (ADR 0060 point 9: `button` acquires `spinner` with `button`, whether or not it is busy, [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 109). The loader treats it as any other acquisition.
7. **Angular's renderer never owns these links**, so Angular's leave guard (upstream bug A1) and its uncounted dehydrated instances (A2) do not reach them (ADR 0060 point 4, measured).

#### The package's accessibility stylesheet

One small global CSS file shipped in the package, every rule inside `@layer ngx-yeti`, imported by the consumer as the last line of the always-loaded imports (ADR 0060 point 8; building-blocks Part 3). It is the package's own CSS, not Yeti's, so shipping it is within the vendoring ruling. Each rule belongs to the item spec whose ledger row it closes (A11Y-1a to A11Y-1f, A11Y-6, and any later row such as A11Y-20 if its measurement leads to one, ticket 50 decision 17), and the first spec to write a rule creates the file; this spec owns only how it is loaded. Its rules select Yeti's state hooks (`aria-pressed`, `:checked`, `aria-selected`, `aria-current`, `[required]`), never a private token, and the package defines no class of its own (map, Package CSS for accessibility; ADR 0080 point 2; architecture-guide P17). It is not loaded per item: a second element kind per item would double the server and hydration surface for a few hundred bytes (ADR 0060 point 8). Its import specifier is open (see ticket, point 2).

#### Usage rules

Numbered for the package's JSDoc and documentation. The first milestone reports no breach (map, Milestones).

1. Build Yeti at the commit the installed package version names. Rebuild it at each pin move.
2. Write `@layer yeti, ngx-yeti;` (or the Tailwind form) before any other CSS in the global stylesheet, and import `layers.css` first among Yeti's files.
3. Import the always-loaded group globally, in Yeti's order, and never an item file: item files belong to the loader.
4. Import the package's accessibility stylesheet after the always-loaded group. Without it the ledger rows its rules close are open again.
5. Keep the `assets` entry's `output` and `provideYetiStyles({ url })` in agreement; both default to `yeti-css`.
6. Use `<base href>` (or `APP_BASE_HREF`) for a subpath; `deployUrl` is not supported (map, Standing rulings, item 29).
7. Write no Yeti class, no Yeti `data-*` attribute, and no `data-ngx-yeti-*` attribute by hand. Presence attributes belong to the package (ADR 0045, Consequences; ADR 0003).
8. Name every item that first renders on the client in `preload`, when a flash-free first frame matters.
9. Provide `withI18nSupport()` wherever the application uses `i18n`.
10. Call `provideYetiStyles()` at most once, in the root providers.
11. Put a `@boundary` inside a `@defer` block, never only around it, when the deferred content holds package directives (section 11).

### 5. Material and CDK comparison

| Concern | Angular Material and CDK | ngx-yeti | Why it differs |
| --- | --- | --- | --- |
| Getting started | `ng add @angular/material` writes a theme into the global stylesheet and edits the application | documented files; no generator in the first milestone (ticket 50 decision 69) | the first milestone stays small (map, Milestones) |
| Global CSS | a theme in the global stylesheet; CDK's `overlay-prebuilt.css` and `a11y-prebuilt.css` imported globally | Yeti's always-loaded group plus the package's accessibility stylesheet, imported globally | the same shape: CSS that every page needs stays global |
| Component CSS | bundled into each component's styles and counted by Angular's shared styles host | a counted `<link>` per item file of the consumer's own Yeti build, owned by the package | the package ships no Yeti CSS, and Angular's own counting misses dehydrated instances and sits behind the leave guard (ADR 0060, Considered options) |
| High contrast | per-component rules beside each component's styles, from CDK's `high-contrast` mixin | one rule per gap in `@layer ngx-yeti`, after the same mixin's shape | Yeti ships no `forced-colors` rule (ledger A11Y-1a) |
| Configuration | purpose-named providers and per-component default-options tokens | `provideYetiStyles()`, `provideYetiFragmentLinks()`; no umbrella provider, no defaults token here | architecture-guide P22; building-blocks 1.4 |

### 6. Implementation level and primitives

Custom Angular, level 4 (building-blocks Part 3: "Angular providers and documented consumer files, custom Angular (4)"). No platform feature loads one stylesheet per element and counts it; Aria has no styles API; CDK has none; Angular's own external styles were rejected as private, behind the same guard, and keyed by file name alone (ADR 0060, Considered options; `shared_styles_host.ts:76-80`, `:139-144`, read). Primitives: `DOCUMENT`, `APP_ID`, `CSP_NONCE`, `@Service()`, `makeEnvironmentProviders`, `provideEnvironmentInitializer`, `afterNextRender`, `DestroyRef`, `MutationObserver`, `requestAnimationFrame`, and the platform's `<link rel="stylesheet">` and `<link rel="preload" as="style">`.

### 7. Accessibility (WCAG 2.2 AA) and the ledger

The setup owns no ledger row; it is what makes other rows hold:

- **Forced colours and the required marker** (1.4.11 under forced colours, 2.5.3): the rules of A11Y-1a to A11Y-1f and A11Y-6 exist only if the accessibility stylesheet is imported (usage rule 4). The owning item specs test the rules; this spec tests that the documented setup loads them in `@layer ngx-yeti` above Yeti's cascade layers.
- **Bypass blocks** (2.4.1): a skip link under `<base href>` works only once `YetiFragmentLinks` is running, which `provideYetiFragmentLinks()` guarantees on a page with no toc, carousel, or tabs (ledger A11Y-16, owned by fragment-links).
- **Info and relationships, contrast, focus visible** (1.3.1, 1.4.3, 2.4.7) with JavaScript off: they rest on the server HTML being styled, which the item links in `<head>` and Beasties' `<noscript>` copy of the global stylesheet give (ticket 13, measured: styled with JavaScript off).
- **Unstyled frames** in a client-only `@defer` block or after a `@boundary`'s `$reset()` in WebKit are a visual flash, not an AA failure by themselves (inferred); an item whose unstyled state hides or shows the wrong content says so in its own spec (for example `container`).
- **Story gate**: the setup's stories run axe on the six tags of [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) like every story.

### 8. Rendered HTML

Server `<head>` for a page with a `card`, a `badge`, and a `center`, with `preload: ['alert']`, after the prototype's [server HTML](../prototypes/style-loading/results/server-html.txt) (measured; attribute name updated to ADR 0045's): Angular's inlined critical `<style>` starting with Yeti's layer statement; the global stylesheet link in Beasties' `media="print"` form with its `<noscript>` copy; then the item links in Yeti's order (`center`, `badge`, `card`, whatever order the directives ran in), each with `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`, and no `ng-app-id`; and the preload link for `alert`. In `<body>`, each host carries its own presence attribute (`<article class="card" data-ngx-yeti-item-card>`). The hydrated `<head>` is the same: no link is added or removed at hydration (measured, 0 style mutations after `DOMContentLoaded`).

### 9. Animation

The setup adds no animation. Two loader rules exist for animation (ADR 0060 points 4 and 6): a host leaving under a class-form `animate.leave` keeps its item file until Angular removes the element (measured: 0 unstyled frames while leaving), and an item whose entry uses a class from an item file (Yeti's `enter` utility) needs that file on the page before insertion, by server rendering or by the preload list, because Angular removes an `animate.enter` class after one frame. The function-form `(animate.leave)` listener has no effect on the loader (measured).

### 10. Rendering modes

- **Server output.** Every item rendered on the server acquires its file, so the links are in the server HTML in Yeti's order with the host attributes; the preload links are written too. The loader writes only into `<head>`, which is outside the hydrated tree (ticket 33).
- **Full hydration.** The client adopts the links by attribute; 0 `<style>` or `<link>` additions or removals after `DOMContentLoaded`; 0 unstyled frames in Chromium and WebKit; 0 computed differences from Yeti's full stylesheet (measured, ticket 13). Firefox showed 1 to 2 frames, from upstream bug A4 (Known upstream bugs, below).
- **Incremental hydration (`hydrate on ...`, `hydrate never`).** A dehydrated host keeps its item's link for as long as it is connected, through its presence attribute; hydration claims it (measured). Two items on one dehydrated element keep both links (ADR 0045, Consequences; this spec's e2e case).
- **Client-only `@defer`, `@if`, `@for`, routes.** The item file is fetched when the directive is constructed: 18 to 20 unstyled frames with a 300 ms delay, 1 to 2 with none; the preload list makes it 0 in all three engines (measured). WebKit refetches a re-inserted link: 1 frame from the cache, more without it (measured).
- **Event replay.** The loader declares no listener; nothing replays and nothing waits. With replay switched off (`withNoIncrementalHydration()` turns off both), early clicks, `input`, and `toggle` events never reach Angular, and every early-opened dialog, popover, `details`, and selection is lost (building-blocks 1.11, measured in ticket 18). The documented setup keeps the default.
- **`withI18nSupport()`.** The loader touches no component state and no change detection (read, ticket 13). The setup requires the feature wherever `i18n` is used; without it, a component with `i18n` blocks is serialised with `ngSkipHydration` and re-rendered (ADR 0011 clause 11). Its re-created directives acquire again; the count rises and the link stays (inferred).
- **Zoneless.** Required (map, Standing rulings, 43). The loader writes nothing a template reads; its observer and frame callbacks need no change detection. Measured zoneless in tickets 13 and 37.
- **Prerendering.** The same HTML path as SSR, at build time; `REQUEST` is never read (building-blocks 1.11 decision 10). Inferred in ticket 13; measured in ticket 37 with prerendered routes.
- **JavaScript off, under SSR and prerendering.** Every item is styled: its link is in the server HTML and the global stylesheet loads through Beasties' `<noscript>` copy (measured). Lost: nothing of this spec's; the item links simply stay for the page's life. Bare fragment links reload the page under `<base href>` until the application is live ([fragment-links](fragment-links.md)). A client-only application renders nothing and promises nothing (map, Standing rulings, JavaScript off).
- **Hydration constraints** (map, Standing rulings, 54). Same DOM on both ends: the links are in `<head>`, adopted unchanged, and the presence attributes are static host attributes equal on both ends (ADR 0045; ticket 33). No direct DOM manipulation inside a hydrated tree: the loader writes only `<head>`, and on the client only after creation or in render callbacks. Valid HTML: `<link>` in `<head>`. `preserveWhitespaces` is not touched. No output branches on the platform: the server and the client run the same acquisition; only the observer is client-only, through `afterNextRender`.
- **Known gap: a server catch leaves a stray link.** When a consumer's `@boundary` catches an item's host-binding or effect error on the server, the item had acquired its file and the server never removes links, so the server HTML carries a link with no host (ticket 37 finding 2, measured for a constructor error before ticket 50 decision 42; for host bindings, inferred). The client's first check after a DOM change removes it if no host appears (inferred from the prototype's sweep). Documented, no change (ticket 50 decision 71).

### 11. Consumer `@boundary` and `@error` blocks

The package needs no change for them (ticket 50 decision 41), uses none in its own templates, `demo` included (decision 44), and documents the following once for every item, measured in ticket 37 in three engines with development and production builds unless marked. `@boundary` is developer preview in Angular 22.2 (ticket 36, read).

- **What a boundary catches** around a package directive: errors in its constructor (including `inject()` and field initializers), host bindings, and effects, on the server and the client. **What it misses:** host listeners, `afterNextRender` callbacks, and a constructor error in `@defer` content when the boundary sits outside the `@defer`; that error goes to `ErrorHandler.handleError` and leaves the region empty, with a `200` response. A boundary inside the `@defer` catches it (usage rule 11).
- **Server error, client success:** the server HTML holds the fallback; at hydration the client removes it and builds the item fresh, not hydrated. Angular logs nothing. The DOM therefore differs between the server and the client because the consumer's template rendered differently, not because of the package (decision 41).
- **Server success, client constructor error at hydration:** the server's markup stays on the page beside the fallback as a dead copy (its controls do nothing) and keeps its item link. A client host-binding or effect error instead removes the hydrated item and shows the fallback, with no copy left.
- **Replay:** a click made before hydration on markup that the client replaces or abandons is lost, whether on the item or on a server-rendered fallback's Reset button (decision 43).
- **JavaScript off:** a server-caught item shows the consumer's fallback, not the item, and any button in the fallback does nothing. The guarantee of section 10 holds for items the server rendered.
- **Style links:** an item directive acquires its file as the last thing its constructor does (decision 42), so a constructor error of its own leaks no count. An error from another directive in the same view after the acquisition still leaves the count raised for the page's life, because the failed view is never destroyed (inferred; ticket 37, "For the package"). Documented, no change (ticket 50 decision 71).
- **`$reset()`:** after an update error the item comes back, with new generated ids ([generated-ids](generated-ids.md) owns that), and its link is inserted again in Yeti's order. With the HTTP cache off and the CSS delayed, WebKit paints 16 to 19 unstyled frames; Chromium and Firefox paint 0, and all three paint 0 with the cache on. The preload list is the documented cover (decision 43); that it closes WebKit's frames is inferred, not measured, and is this spec's e2e case.
- **A constructor error on a template's first creation** leaves that embedded template half-built: `$reset()` never recovers it, every later SSR request in the same server process renders the fallback until the process restarts, and a prerender can save the error into static HTML (upstream bug A8). A boundary is therefore cover for update errors, not for creation errors of package directives on the server.

### 12. Single-page application

The loader keeps counting across navigations: a route's items acquire on entry and release on leave, and the files of items on both routes stay (follows from rule 1 and 2). A route reached by client navigation is a client-rendered region, so its items behave as client-only content: the preload list applies (ADR 0060 point 6). Fragment links are [fragment-links](fragment-links.md)'s; closing panels on navigation is [navigation-close](navigation-close.md)'s.

### 13. Item file

None of its own. This spec owns the loader that loads every item's file and the loading of the package's accessibility stylesheet; each item spec names its own item file and presence attribute (ADR 0060, Consequences).

## Testing Decisions

Good tests here assert what the page has: the links in `<head>` with their attributes and order, the presence attributes on hosts, computed styles that prove a file applied, and frame counts, never the loader's fields. Prior art: the [style-loading prototype](../prototypes/style-loading/README.md)'s probe (a `requestAnimationFrame` sampler of computed padding, and a log of every `<style>` and `<link>` added or removed, installed before the page's scripts) and the [consumer-boundaries prototype](../prototypes/consumer-boundaries/README.md)'s probe. Four test layers ([ADR 0014](../adr/0014-testing-stack-for-yeti.md); building-blocks 1.12), all zoneless.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

The Storybook preview's global stylesheet is the documented global stylesheet unchanged (section 4, C), and Storybook serves the Yeti build under `yeti-css/` as the `assets` entry does for an application, so every story of every item exercises this setup (ADR 0014 point 1). This spec's stories:

- `setup--item-links`: a toggle renders and removes a `stack` holding a `center`, then a `center` first and a `stack` after. The play function asserts the two links in `yeti.css`'s order after either order, the inner `center`'s computed inline margins equal on both sides, and both links gone in the frame after the toggle hides the last host.
- `setup--shared-host`: an element with `yetiCard` and `yetiLift`; both presence attributes, both links, and both gone after removal.
- `setup--client-defer-preload`: a client `@defer (on interaction)` block with an `alert`, under `provideYetiStyles({ preload: ['alert'] })`; the preload link is in `<head>` before the interaction, and the alert's first frame is styled.
- `setup--accessibility-layer`: Yeti markup with a rule of the accessibility stylesheet that applies outside forced colours (A11Y-6's required marker); the play function asserts the rule wins over Yeti's, and that a consumer's unlayered rule wins over both.

Each story runs the Story gate with `parameters.a11y.test = 'error'`.

### Layer 2: browser-level (`npx nx test <lib>`, Vitest browser mode)

The loader and the helper under TestBed, zoneless. Probe directives that call the helper are created with `TestBed.createDirective(type, { tagName })` (map, Standing rulings, directive testing; ADR 0014's 2026-10-03 note); a test host remains for the cases that need two directives or a `@boundary`.

- Counting: two hosts of one item give one link; destroying one keeps it; destroying both removes it in the next frame.
- A host connected with count zero (an element carrying `data-ngx-yeti-item-<item>` inserted without a directive, standing for a dehydrated host) keeps the link; removing the element removes it.
- Ordered insertion: every arrival order of `stack`, `center`, `cover`, `shell`, and `card` ends in `yeti.css`'s order.
- Two directives on one host acquire two items and set two presence attributes.
- Attributes: `href` equals `<url><kind>/<name>/<name>.css?v=<pin>`; `data-ngx-yeti-styles`, `data-ngx-yeti-app` with a non-default `APP_ID`, `data-beasties-skip`; `nonce` present with `CSP_NONCE` and absent without.
- `provideYetiStyles({ url: 'assets/yeti/' })` changes every `href`; `preload` writes one preload link per item and never a second for an `href` already present.
- Adoption: a pre-existing link with the application's `APP_ID` is adopted and later removed; one with another `APP_ID` is left alone; two loaders in two environment injectors with different `APP_ID`s never touch each other's links.
- Throwing: a probe directive whose constructor throws before the helper runs, inside a test host's `@boundary`, leaves no link and no count (ticket 50 decision 42).
- No observer before the first render callback: the loader creates no `MutationObserver` until `afterNextRender` runs.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `setup.ssr.spec.ts`)

- Through the shared `renderServer()` helper with `provideClientHydration(withI18nSupport())` and one `i18n` text (building-blocks 1.11 decision 11): a fixture with `card`, `badge`, and `center` produces their links in `<head>` in Yeti's order with every attribute, each host's presence attribute, and the `alert` preload link under `provideYetiStyles({ preload: ['alert'] })`; an item not rendered has no link; `CSP_NONCE` puts the nonce on every link.
- Two concurrent renders produce the same `<head>` (one loader per request, ADR 0044 point 2's reasoning).
- Build outputs: the generated rank table lists the 49 items in the order of `yeti-css/css/yeti.css` at the pin, with each path existing in the build; the generated `yeti-types.ts` equals `yeti.d.ts` at the pin; the pin constant equals the vendored `COMMIT`.
- The published output contains no Yeti rule: no Yeti selector or `@layer yeti` block in the FESM bundles or any shipped CSS (ticket 13, measured with `rg` in the prototype).
- The accessibility stylesheet: every rule is inside `@layer ngx-yeti`; no `--_yeti-*` token is read or written; no class selector names a package class.
- The version: `package.json`'s version matches `0.<Angular major><Angular minor, two digits><two digits>.<patch>-yeti.<Yeti version>.g<SHA>`, its Angular part matches the `@angular/core` peer's minor, and its SHA is a prefix of the vendored `COMMIT`.

### Layer 4: Playwright e2e (three engines in CI)

The Fixture app is built exactly as section 4 documents: the vendored `yeti-css` workspace package and its `yeti-build` target, the `assets` entry through the workspace link, the global stylesheet, `provideClientHydration(withI18nSupport())`, a non-root `<base href>`, `outputMode: 'server'` with each route under both `RenderMode.Prerender` and `RenderMode.Server` (ticket 50 decision 2). Each case runs with JavaScript on and off where it applies.

- JavaScript off: the setup route's items are styled (computed padding of a `card` equal to Yeti's full stylesheet); the global stylesheet's `<noscript>` copy applies; axe passes on the six tags.
- Hydration: no `NG05xx`, `componentsSkippedHydration === 0`, 0 `<link>` or `<style>` mutations after `DOMContentLoaded`, 0 unstyled frames in Chromium and WebKit; Firefox's frames recorded against upstream bug A4.
- `hydrate never` and `hydrate on interaction`: the dehydrated host keeps its link after every live host of its item has left; hydrating keeps it. The shared host of ADR 0045: a `card` with `lift` inside `hydrate never`, after every live `lift` has left, keeps both links.
- Leave: a host under class-form `animate.leave`, with a function-form `(animate.leave)` listener elsewhere on the page, stays styled while leaving and loses its link after.
- Client-only `@defer` with item CSS delayed 300 ms: unstyled frames recorded without the preload list, 0 with it.
- Order: a `stack`, then a `center` inside it, rendered by the client in that order; the `center` stays centred.
- Boundaries (ticket 37's cases, kept as regression tests of the documentation): a server-only constructor error shows the fallback with JavaScript off and the item after hydration; a boundary outside a `@defer` leaves the region empty and one inside shows the fallback; a pre-hydration click on replaced markup is lost; after `$reset()` with item CSS delayed and the cache off, WebKit's unstyled frames are recorded with and without `preload` for the item.
- Tailwind: the same route built under a second build configuration of the fixture app with form C2, and again with C1 (ticket 50 decision 70): utilities win over Yeti, Yeti over preflight, a rule of `@layer ngx-yeti` over Yeti's, and a Yeti `container` is not capped at 1024 px at a 1100 px viewport.
- Not measured before, measured here (ticket 13, Triage): a development-server run (`nx serve`) of the fixture app loads every item link; a route served with a strict `style-src 'self' 'nonce-...'` policy and `CSP_NONCE` shows no CSP violation; the `assets` glob through the npm workspaces link copies the 66 files.
- Upstream bug A4: with the global stylesheet's response delayed, the count of frames in which a `card` computes `padding: 0` is recorded per engine, with Angular's critical-CSS inlining on and off (ticket 50 decision 72).

## Out of Scope

- Each item's item file, presence attribute, preload line, and accessibility rule: the item specs own them.
- Generated ids and the `TransferState` seed: [generated-ids](generated-ids.md).
- Fragment links and `YetiFragmentLinks`: [fragment-links](fragment-links.md); closing panels on navigation: [navigation-close](navigation-close.md); outputs and `yeti:*` events: [events](events.md).
- A generator, schematic, or `ng add` in the first milestone (ticket 50 decision 69), and every development-mode check of the setup (a missing layer statement, a wrong pin, a forgotten import), which are later-milestone checks (map, Milestones; ADR 0060, Considered options).
- Themes: the package ships, wraps, and generates none (ADR 0004).
- `deployUrl` and absolute item URLs (map, Standing rulings, item 29).
- Yeti's optional JavaScript modules: the package replaces them and loads none ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)).
- Filing upstream issues for A4 or A8: needs the user's confirmation (map, AFK override).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| The consumer brings Yeti's build at the pin; the package ships no Yeti CSS | map, Standing rulings, Vendoring; ADR 0060 point 2 |
| One counted `<link>` per item file, written on the server, adopted at hydration | ADR 0060 points 2 and 5 |
| Insertion in `yeti.css`'s order from a generated rank table | ADR 0060 point 3; ticket 23 |
| Removal when the count is zero and no host is connected, checked in the next frame | ADR 0060 point 4 |
| One presence attribute per item, on item roots only | ADR 0045; ticket 50 decisions 6 and 7 |
| `provideYetiStyles({ url, preload })`; preload closes the client-only gap | ADR 0060 points 2 and 6 |
| `@layer yeti, ngx-yeti;` first in the global stylesheet; the Tailwind form | ADR 0060 point 7; ticket 24 |
| One global accessibility stylesheet in `@layer ngx-yeti` | ADR 0060 point 8; map, Package CSS for accessibility |
| Types from a generated copy of `yeti.d.ts` | ADR 0060 point 10 |
| Nx: vendored workspace package and cached `yeti-build`; elsewhere: clone, build, `file:` or tarball | ADR 0006 point 2; ADR 0060 point 11; tickets 21, 22 |
| Version format with the pin; exact pins; `--tag latest` | ADR 0017's 2026-10-02 notes; map, Standing rulings |
| `provideClientHydration(withI18nSupport())`; replay and incremental hydration by default | ADR 0011 clause 11; building-blocks 1.11; map, Standing rulings |
| Only `<base href>`; no `deployUrl` | map, Standing rulings, item 29 |
| JavaScript-off guarantee for SSR and prerendering only | ADR 0011's 2026-10-03 note; map, Standing rulings |
| Acquire last in the constructor; no package `@boundary`; boundaries documented | ticket 50 decisions 41 to 44 |
| Entry point `ngx-yeti/styles` and `injectYetiItemStyles` | ticket 50 decision 45 |
| Accessibility stylesheet specifier `ngx-yeti/accessibility.css` | ticket 50 decision 68 |
| No generator in the first milestone | ticket 50 decision 69 |

### Usage examples

- **A server-rendered application in an Nx workspace**: Yeti vendored at the pin with its `yeti-build` target; the `assets` entry; the global stylesheet of section 4, C; `provideClientHydration(withI18nSupport())` in the application configuration. Every item then needs only its directive attribute and its entry point import (`import { YetiCard } from 'ngx-yeti/card'`).
- **A page with a skip link and no toc, carousel, or tabs**: add `provideYetiFragmentLinks()` and write `<a href="#main">Skip to content</a>` with `<main id="main">` ([fragment-links](fragment-links.md)). Write the link as the first child of `body` in `index.html`, not in a component template: Yeti's skip-link rule matches only `body > a[href^="#"]:first-child` (`Y/src/base/typography.css:70`), which no element inside an Angular template can be ([shell](shell.md) usage rule 5; ticket 50 decision 85).
- **Client-only content**: a dashboard whose `alert` and `badge` appear inside `@defer (on interaction)` adds `provideYetiStyles({ preload: ['alert', 'badge'] })`.
- **Tailwind v4**: replace the first line of the global stylesheet with form C2 of section 4, keep the rest, and keep `@source not inline('container');`.
- **A boundary around deferred content**: `@defer (hydrate on viewport) { @boundary { <article yetiCard>...</article> } @error { ... } }`, the boundary inside the `@defer`.

### Styles

1. Item file: none of its own (section 13).
2. Always-loaded rules relied on: all of them; this spec is where the consumer imports them.
3. Cross-item rules: `button` acquires `spinner` with `button` (ADR 0060 point 9; ticket 50 decision 109); the order-sensitive pairs of section 4, rule 5.
4. Tokens: none read or written.
5. What breaks without the setup: without the `assets` entry every item link fails and every item renders as bare HTML; without the layer statement or with an item file before `layers.css`, 65 or 66 of 98 pages break (ticket 23); without the accessibility stylesheet, the ledger rows it closes reopen.
6. Tailwind collisions: `container` (fixed by `@source not inline('container');`), `grid`, `table`, and `hidden` (measured harmless, ticket 24).

### Known upstream bugs

- **A4, Angular's critical CSS leaves out token blocks.** Angular's inlined critical copy of the always-loaded group keeps three of Yeti's nine `:root` token blocks; the component tokens, `--yeti-border-width`, `--yeti-white`, and the reduced-motion durations are missing, so a server-rendered item paints with its rules but without its tokens until the global stylesheet arrives (1 to 2 frames in Firefox on localhost; measured in Chromium and Firefox; cause not pinned). It is the same for every loading mechanism. Documented with the build option that turns inlining off (`optimization.styles.inlineCritical: false`), which makes the global stylesheet render-blocking; the documentation does not recommend either setting until the layer-4 case has measured both (ticket 50 decision 72).
- **A8, `@boundary` and a constructor error on first creation.** Section 11.
- **WebKit refetches a re-inserted link** (ticket 13, measured): 1 frame from the cache on reload after an unload, more without the cache. The preload list keeps a preload link on the page.
- **O2, stale computed styles** after a stylesheet is inserted or removed, on a few pages in Chromium and WebKit, with every insertion method (ticket 23, measured; engine invalidation inferred).
- A1 (the leave guard) and A2 (uncounted dehydrated instances) do not reach the loader (ADR 0060 point 4).

### Platform features to adopt when the browser target moves

None is needed: cascade layers, `<link rel="preload" as="style">`, `MutationObserver`, and `requestAnimationFrame` are inside Baseline 2025 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). If Yeti is published on npm, the package declares a peer dependency on `yeti-css`, the types copy goes, and ADR 0060 point 10 and ADR 0006 reopen (ADR 0006 point 5; ADR 0060 point 10).

### Watch points

- A pin move changes the `?v=` query on every item URL and regenerates the rank table and the types module; consumers rebuild Yeti at the new pin (ADR 0060, Consequences). A pin move that adds, removes, or renames an always-loaded file also changes the 16 imports of section 4, C; the pin move's changelog entry names it (ADR 0017 point 1; inferred, since no record classes this case).
- `@boundary` is developer preview: a patch release may change section 11's behaviour.
- `provideClientHydration()`'s defaults: if a later Angular release stops turning on incremental hydration and event replay by default, the documented setup adds `withIncrementalHydration()`.
- Nx 24 removes executors (map, Standing rulings): the `yeti-build` target uses `nx:run-commands`, which v24 keeps.
