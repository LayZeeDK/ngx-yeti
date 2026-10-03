import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { Home, Never } from './app';

const appRoutes: Route[] = [
  { path: '', component: Home },
  { path: 'never', component: Never },
];

// provideClientHydration() in 22.2 includes incremental hydration and event replay.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(appRoutes), provideClientHydration()],
};
