import { Route } from '@angular/router';
import { APage, B2Page, B3Page, BOpenPage, BPage, RefPage } from './pages/pages';

// PROTOTYPE (ticket 29, accordion): eager routes.
export const appRoutes: Route[] = [
  { path: '', component: RefPage },
  { path: 'a', component: APage },
  { path: 'b', component: BPage },
  { path: 'b2', component: B2Page },
  { path: 'b3', component: B3Page },
  { path: 'b-open', component: BOpenPage },
];
