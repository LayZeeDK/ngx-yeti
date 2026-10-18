import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideClientHydration,
  withI18nSupport,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideYetiStyles } from 'ngx-yeti/styles';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // In 22.2 this alone turns on incremental hydration and, through it,
    // event replay.
    provideClientHydration(withI18nSupport()),
    // Each listed item first renders on the client in a fixture's client-only
    // `@defer` (`card` in the setup fixture's). `lift` is left out so the
    // setup route records its frames without a preload, and `enter` so its
    // route measures enter.md:272's insertions without one; its "with" case
    // is the `enter--inserted-preloaded` story (ngx-yeti-specs Departures).
    // Every item here adds a server prefetch and a client preload to every
    // page, so e2e tests assert preloads by containment.
    provideYetiStyles({
      preload: [
        'card',
        'box',
        'breakout',
        'button',
        'center',
        'cluster',
        'columns',
        'container',
        'cover',
        'frame',
        'grid',
        'icon',
        'layer',
        'masonry',
        'overlay',
        'scroller',
        'sidebar',
        'spinner',
        'stack',
        'table',
        'timeline',
        'visually-hidden',
      ],
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
  ],
};
