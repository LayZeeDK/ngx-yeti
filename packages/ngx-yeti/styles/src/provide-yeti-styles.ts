import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  YetiStyles,
  type YetiStylesConfig,
  yetiStylesConfigToken,
} from './yeti-styles';

/**
 * Configures where the package loads Yeti's item files from and which of them
 * it preloads (setup spec section 4; ADR 0060 points 2 and 6).
 *
 * Call it at most once, in the application's root providers (setup usage rule
 * 10): the loader is a root service, so a call in a route's providers has no
 * effect. Calling it is optional; without it the loader uses `yeti-css/`,
 * preloads nothing, and is created by the first item directive on the client
 * instead of at application start.
 *
 * - `url`: the path of the folder the `assets` entry's `output` names,
 *   relative to `<base href>`, with a trailing slash (usage rule 5). Item
 *   files follow `<base href>`, never `APP_BASE_HREF`, which sets where routes
 *   live; for files under a prefix that `<base href>` does not name, give the
 *   prefixed path, such as `'basehref/yeti-css/'`. `deployUrl` and an
 *   absolute or root-relative `url` are not supported (usage rule 6).
 * - `preload`: name every item that first renders on the client, in a
 *   client-only `@defer`, an `@if`, a growing `@for`, or a route reached by
 *   client navigation, when a flash-free first frame matters (usage rule 8).
 *   Each gets one `<link rel="prefetch">` from the server and one
 *   `<link rel="preload" as="style">` from the client, never a second beside
 *   one already in `<head>`. A server style preload holds WebKit's first paint
 *   on a sparse page (upstream bug O4); WebKit ignores the prefetch, so
 *   Safari's fetch starts at bootstrap, from the client's preload, without the
 *   head start the prefetch gives Chromium and Firefox.
 *
 * The rest of the one-time setup is build configuration: build Yeti at the
 * pin the package version names (usage rule 1), write the layer statement
 * first (rule 2), import the always-loaded group and never an item file (rule
 * 3), import the accessibility stylesheet after it (rule 4), write no Yeti
 * class, Yeti `data-*` attribute, or `data-ngx-yeti-*` attribute by hand (rule
 * 7), provide `withI18nSupport()` wherever `i18n` is used (rule 9), and, when
 * deferred content holds package directives, put a `@boundary` inside the
 * `@defer`, not only around it (rule 11).
 */
export function provideYetiStyles(
  config: YetiStylesConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: yetiStylesConfigToken, useValue: config },
    // Created at application start, the loader writes the prefetch or preload
    // links and adopts the server's links at bootstrap (ADR 0060 point 5), so
    // its check removes a server link with no host even before any item
    // renders.
    provideEnvironmentInitializer(() => {
      inject(YetiStyles);
    }),
  ]);
}
