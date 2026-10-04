# ngx-yeti

Angular directives for [Yeti](https://github.com/foundation/yeti), version 7 of Foundation (`yeti-css`). You write Yeti's own markup, and the directives add typed inputs, generated ids, keyboard and focus behaviour, and the item's styles.

> **Pre-release.** Nothing is published to npm yet. The setup, the `card` item, and the `lift` item are implemented; the other items follow the [specs](https://github.com/LayZeeDK/ngx-yeti/blob/main/docs/specs/README.md), and the API can change until the first release.

## What the package will give you

- One directive per Yeti item, 49 in all, from layouts such as `stack` and `grid` to components such as `dialog`, `tabs`, and `tooltip`. Each item is its own entry point, `ngx-yeti/<item>`, so a `@defer` block loads only the items it uses.
- Inputs typed with Yeti's own vocabularies, so a value Yeti does not define fails to compile.
- WCAG 2.2 AA for every item, including the keyboard, focus, and ARIA behaviour Yeti leaves to the page.
- Server-side rendering, prerendering, hydration, incremental hydration, event replay, and `@defer`. Items stay readable, and their native controls keep working, with JavaScript off.
- Each item's CSS loads when its first instance renders and unloads after the last one goes.

The package ships none of Yeti's CSS. You bring a build of Yeti at the commit the package names.

## Entry points

| Specifier                    | What it exports                                                         |
| ---------------------------- | ----------------------------------------------------------------------- |
| `ngx-yeti`                   | Types only, such as `YetiComponentName`, generated from Yeti at the pin |
| `ngx-yeti/styles`            | `provideYetiStyles`, `injectYetiItemStyles`, and `YetiStylesConfig`     |
| `ngx-yeti/card`              | `YetiCard`, `YetiCardLink`, and `yetiCardToken`                         |
| `ngx-yeti/lift`              | `NgxYetiLift`                                                           |
| `ngx-yeti/accessibility.css` | The package's accessibility stylesheet                                  |

## Requirements

- Angular 22.2.
- Yeti built at the pinned commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. Yeti has no npm release yet, and building it needs Node.js 24 or later.
- Browsers from Baseline 2025: Chrome and Edge 141, Firefox 145, and Safari 26.2.

## Setup

You write this setup once per application. It is build configuration and providers only: you write no TypeScript per item, no carrier component, and no Yeti class or attribute by hand. After it, each item needs only its directive attribute and its entry point import, such as `import { YetiCard } from 'ngx-yeti/card';`. The [setup spec](https://github.com/LayZeeDK/ngx-yeti/blob/main/docs/specs/specs/setup.md) is the full record.

### A. Build Yeti at the pin

The package version names the Yeti commit it was built against. The format is `0.<Angular major><Angular minor, two digits><breaking counter, two digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>`. The last identifier is `g` plus the commit's short SHA, and every release's changelog names the full commit. A change in the two-digit counter marks a breaking release.

Build Yeti at that commit and install it under the name `yeti-css`:

- **In an Nx workspace**, vendor Yeti's source at the commit as an npm workspace package named `yeti-css`, with its `COMMIT` file. A small local `createNodes` plugin gives it a cached `yeti-build` target that runs `node bin/build.js` through `nx:run-commands`, with `dist/` as its output and git-ignored. Nx 24 keeps `nx:run-commands`.
- **Outside Nx**, clone Yeti at the commit, run `npm ci && npm run build`, and install the result as a `file:` or packed tarball dependency named `yeti-css`.

A Yeti build at any other commit is unsupported: its CSS is served under the package's pin.

### B. Serve Yeti's CSS

Add one `assets` entry to your application's build options. It copies Yeti's 66 built CSS files to `yeti-css/` beside the application:

```json
{ "glob": "**/*.css", "input": "node_modules/yeti-css/dist/css", "output": "yeti-css" }
```

The item files' URLs follow your `<base href>`, so an application under a subpath needs nothing more. `deployUrl` is not supported.

### C. Order the global stylesheet

Your application's global stylesheet (its `styles` entry) starts with the cascade-layer statement, then Yeti's always-loaded group in Yeti's order with `layers.css` first, then the package's accessibility stylesheet:

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

Your theme (token values on `:root`) and your application CSS come after. Unlayered application CSS beats every Yeti and package cascade layer wherever it sits, and a cascade layer you declare after the statement sits above both.

The item files are not in this list. The package loads each one when the item first renders.

#### With Tailwind v4

Replace the first line with one shared statement that keeps `ngx-yeti` after `yeti`, and add `@source not inline('container');` so Tailwind's `.container` never caps a Yeti `container`. There are two forms. Prefer C2.

- **C2, without preflight:** `@layer theme, yeti, ngx-yeti, components, utilities;`, then Tailwind's `theme.css` and `utilities.css` imported into their cascade layers, then the `@source` line, then the imports above from `layers.css` on. Yeti's markup looks as it does with Yeti alone, a Yeti modal dialog stays centred, and utilities win.

  ```css
  @layer theme, yeti, ngx-yeti, components, utilities;
  @import 'tailwindcss/theme.css' layer(theme);
  @import 'tailwindcss/utilities.css' layer(utilities);
  @source not inline('container');
  @import 'yeti-css/css/layers.css';
  /* the other imports above, in the same order */
  ```

- **C1, with preflight:** `@layer theme, base, yeti, ngx-yeti, components, utilities;`, then `@import 'tailwindcss';`, then the `@source` line, then the imports above from `layers.css` on. Preflight still sets what Yeti leaves unset, which costs two things: list markers disappear, and a Yeti modal dialog loses its centring (preflight's `* { margin: 0 }`). No fix for either was measured.

### D. Application providers

In your application configuration:

- `provideClientHydration(withI18nSupport())` when the application renders on the server or prerenders. In Angular 22.2 `provideClientHydration()` turns on incremental hydration and event replay by default, so you need no other feature. `withI18nSupport()` is required wherever the application uses `i18n`; without it a component with `i18n` text is rendered again at hydration instead of hydrated.
- `provideYetiStyles({ url, preload })` from `ngx-yeti/styles`, only when you need it. Both options are optional:
  - `url` is the folder the `assets` entry copies Yeti's CSS to, relative to `<base href>`, with a trailing slash. It defaults to `'yeti-css/'`.
  - `preload` lists the items that first render on the client: in a client-only `@defer` block, an `@if`, a `@for` that grows, or a route reached by client navigation. Each listed item gets one `<link rel="preload" as="style">`, on the server and the client, so its first frame is styled. The names are typed with Yeti's item names, so a misspelt item fails to compile.

```ts
import { type ApplicationConfig } from '@angular/core';
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';
import { provideYetiStyles } from 'ngx-yeti/styles';

export const appConfig: ApplicationConfig = {
  providers: [provideClientHydration(withI18nSupport()), provideYetiStyles({ preload: ['card'] })],
};
```

Generated ids need no provider, and zoneless change detection, Angular 22's default, needs nothing from the package. The setup works with zone.js too.

### E. Install the package

Install the package at an exact version, never a caret range: a caret range on a prerelease matches only prereleases of the same core. Every release is published with `npm publish --tag latest`, so a bare install gets the newest one. The Angular packages are peer dependencies from the minor the version names. The package declares no `yeti-css` dependency or peer dependency while Yeti is unpublished, so your install never fetches an unbuilt Yeti from GitHub.

No generator or `ng add` writes B, C, or D yet.

## Usage rules

The package's JSDoc cites these rules by number.

1. Build Yeti at the commit the installed package version names. Rebuild it at each pin move.
2. Write `@layer yeti, ngx-yeti;` (or the Tailwind form) before any other CSS in the global stylesheet, and import `layers.css` first among Yeti's files.
3. Import the always-loaded group globally, in Yeti's order, and never an item file: item files belong to the loader.
4. Import the package's accessibility stylesheet after the always-loaded group. Without it, the accessibility gaps its rules close are open again.
5. Keep the `assets` entry's `output` and `provideYetiStyles({ url })` in agreement; both default to `yeti-css`.
6. Use `<base href>` (or `APP_BASE_HREF`) for a subpath; `deployUrl` is not supported.
7. Write no Yeti class, no Yeti `data-*` attribute, and no `data-ngx-yeti-*` attribute by hand. Presence attributes belong to the package.
8. Name every item that first renders on the client in `preload`, when a flash-free first frame matters.
9. Provide `withI18nSupport()` wherever the application uses `i18n`.
10. Call `provideYetiStyles()` at most once, in the root providers. The loader is a root service, so a call in a route's providers has no effect.
11. Put a `@boundary` inside a `@defer` block, never only around it, when the deferred content holds package directives.

## Error boundaries

You can wrap the package's directives in your own `@boundary` and `@error` blocks. The package needs no change for them and uses none in its own templates. `@boundary` is a developer preview in Angular 22.2, so a patch release may change what follows.

- **What a boundary catches** around a package directive: errors in its constructor (including `inject()` and field initializers), host bindings, and effects, on the server and the client.
- **What it misses:** host listeners, `afterNextRender` callbacks, and a constructor error in `@defer` content when the boundary sits outside the `@defer`. That error goes to `ErrorHandler.handleError` and leaves the region empty, with a `200` response. Put the boundary inside the `@defer` (usage rule 11):

  ```html
  @defer (hydrate on viewport) { @boundary {
  <article yetiCard>...</article>
  } @error {
  <p>The card could not be shown.</p>
  } }
  ```

- **Server error, client success:** the server HTML holds the fallback. At hydration the client removes it and builds the item fresh instead of hydrating it, and Angular logs nothing.
- **Server success, client constructor error at hydration:** the server's markup stays on the page beside the fallback as a dead copy whose controls do nothing, and it keeps its item link. A client host-binding or effect error instead removes the hydrated item and shows the fallback, with no copy left.
- **Replay:** a click made before hydration on markup that the client replaces or abandons is lost, whether on the item or on a Reset button in a server-rendered fallback.
- **JavaScript off:** an item the server caught shows your fallback, not the item, and any button in the fallback does nothing. Items the server rendered stay styled and usable.
- **Style links:** an item directive loads its file as the last thing its constructor does, so a constructor error of its own leaks no stylesheet count. An error from another directive in the same view after that point still leaves the count raised for the page's life, because Angular never destroys the failed view. When a server boundary catches an item's error, the server HTML can carry that item's link with no host; the client's first check after a DOM change removes it.
- **`$reset()`:** after an update error the item comes back with new generated ids, and its link is inserted again in Yeti's order. With the HTTP cache off and the CSS slow to arrive, WebKit paints a few unstyled frames; Chromium and Firefox do not. List the item in `preload` to cover this.
- **A constructor error on a template's first creation** leaves that template half-built: `$reset()` never recovers it, every later server-side render in the same server process shows the fallback until the process restarts, and a prerender can save the error into static HTML (upstream bug A8). A boundary covers update errors, not creation errors of package directives on the server.

## License

MIT. Yeti itself is licensed under FSL-1.1-MIT.
