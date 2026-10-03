import { Route } from '@angular/router';
import { APage, B2Page, B3Page, BOpenPage, BPage, RefPage } from './pages/pages';
import { CNoInertPage, COpenPage, CPage, DPage, DRolePage } from './pages/pages-30';

// PROTOTYPE (ticket 29, accordion; ticket 30 adds c*, d*): eager routes.
export const appRoutes: Route[] = [
  { path: '', component: RefPage },
  { path: 'a', component: APage },
  { path: 'b', component: BPage },
  { path: 'b2', component: B2Page },
  { path: 'b3', component: B3Page },
  { path: 'b-open', component: BOpenPage },
  { path: 'c', component: CPage },
  { path: 'c-noinert', component: CNoInertPage },
  { path: 'c-open', component: COpenPage },
  { path: 'd', component: DPage },
  { path: 'd-role', component: DRolePage },
];
