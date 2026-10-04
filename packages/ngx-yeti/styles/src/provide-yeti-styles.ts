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
 * effect. Calling it is optional; without it the loader uses `yeti-css/` and
 * preloads nothing.
 *
 * - `url`: keep it in agreement with the `assets` entry's `output` (usage rule
 *   5), relative to `<base href>`; `deployUrl` is not supported (usage rule 6).
 * - `preload`: name every item that first renders on the client, in a
 *   client-only `@defer`, an `@if`, a growing `@for`, or a route reached by
 *   client navigation, when a flash-free first frame matters (usage rule 8).
 *   Each gets one `<link rel="preload" as="style">`, never a second beside one
 *   already in `<head>`.
 *
 * The rest of the one-time setup is build configuration: build Yeti at the
 * pin the package version names (usage rule 1), write the layer statement
 * first (rule 2), import the always-loaded group and never an item file (rule
 * 3), import the accessibility stylesheet after it (rule 4), write no Yeti or
 * `data-ngx-yeti-*` attribute by hand (rule 7), provide `withI18nSupport()`
 * wherever `i18n` is used (rule 9), and put a `@boundary` inside a `@defer`
 * block (rule 11).
 */
export function provideYetiStyles(
  config: YetiStylesConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: yetiStylesConfigToken, useValue: config },
    // The loader writes the preload links when it is created, so create it at
    // application start.
    config.preload === undefined || config.preload.length === 0
      ? []
      : provideEnvironmentInitializer(() => {
          inject(YetiStyles);
        }),
  ]);
}
