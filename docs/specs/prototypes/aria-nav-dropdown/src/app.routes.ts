import { Route } from '@angular/router';
import { PageA, PageANever, PageB, PageB2, PageBNever } from './pages';

export const appRoutes: Route[] = [
  { path: 'a', component: PageA },
  { path: 'b', component: PageB },
  { path: 'b2', component: PageB2 },
  { path: 'a-never', component: PageANever },
  { path: 'b-never', component: PageBNever },
];
