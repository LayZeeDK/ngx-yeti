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
    // `card` first renders on the client in the setup fixture's client-only
    // `@defer`; `lift` is left out so the same route records its frames
    // without a preload.
    provideYetiStyles({ preload: ['card'] }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
  ],
};
