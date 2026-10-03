import { Route } from '@angular/router';
import { Home } from './pages/home';
import { DeferPage } from './pages/defer-page';
import { AnimPage } from './pages/anim-page';
import { GuardPage } from './pages/guard-page';
import { I18nPage } from './pages/i18n-page';

// PROTOTYPE (ticket 18): eager routes, so lazy route chunks do not blur the measurements.
export const appRoutes: Route[] = [
  { path: '', component: Home },
  { path: 'pre', component: Home },
  { path: 'defer', component: DeferPage },
  { path: 'anim', component: AnimPage },
  { path: 'guard', component: GuardPage },
  { path: 'i18n', component: I18nPage },
];
