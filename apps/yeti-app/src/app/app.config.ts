import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideClientHydration,
  withI18nSupport,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // In 22.2 this alone turns on incremental hydration and, through it,
    // event replay.
    provideClientHydration(withI18nSupport()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
  ],
};
