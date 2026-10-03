# ngx-yeti

Angular directives for [Yeti](https://github.com/foundation/yeti), version 7 of Foundation (`yeti-css`). You write Yeti's own markup, and the directives add typed inputs, generated ids, keyboard and focus behaviour, and the item's styles.

> **Pre-release.** Nothing is published to npm yet, and no Yeti item is implemented. This page describes what the [specs](https://github.com/LayZeeDK/ngx-yeti/blob/main/docs/specs/README.md) plan, and the API can change until the first release.

## What the package will give you

- One directive per Yeti item, 49 in all, from layouts such as `stack` and `grid` to components such as `dialog`, `tabs`, and `tooltip`. Each item is its own entry point, `ngx-yeti/<item>`, so a `@defer` block loads only the items it uses.
- Inputs typed with Yeti's own vocabularies, so a value Yeti does not define fails to compile.
- WCAG 2.2 AA for every item, including the keyboard, focus, and ARIA behaviour Yeti leaves to the page.
- Server-side rendering, prerendering, hydration, incremental hydration, event replay, and `@defer`. Items stay readable, and their native controls keep working, with JavaScript off.
- Each item's CSS loads when its first instance renders and unloads after the last one goes.

The package ships none of Yeti's CSS. You bring a build of Yeti at the commit the package names.

## Requirements

- Angular 22.2.
- Yeti built at the pinned commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. Yeti has no npm release yet, and building it needs Node.js 24 or later.
- Browsers from Baseline 2025: Chrome and Edge 141, Firefox 145, and Safari 26.2.

## Planned setup

The [setup spec](https://github.com/LayZeeDK/ngx-yeti/blob/main/docs/specs/specs/setup.md) defines these steps. They do not work yet.

1. Copy Yeti's CSS into your build output with an `assets` entry in your application's build options:

   ```json
   { "glob": "**/*.css", "input": "node_modules/yeti-css/dist/css", "output": "yeti-css" }
   ```

2. Start your global stylesheet with the cascade layer order and Yeti's always-loaded files. The setup spec lists all 16 imports in their required order. The package's accessibility stylesheet comes last:

   ```css
   @layer yeti, ngx-yeti;
   @import 'yeti-css/css/layers.css';
   /* Yeti's tokens, base styles, and layout attributes, in Yeti's order */
   @import 'ngx-yeti/accessibility.css';
   ```

3. If you render on the server or prerender, provide hydration with i18n support:

   ```ts
   provideClientHydration(withI18nSupport());
   ```

## License

MIT. Yeti itself is licensed under FSL-1.1-MIT.
