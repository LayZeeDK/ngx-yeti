import { Routes } from '@angular/router';
import { HomePage, LatePage, OtherPage, OwnedPage, TabsPage } from './pages';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage },
  { path: 'tabs', component: TabsPage },
  { path: 'other', component: OtherPage },
  { path: 'late', component: LatePage },
  { path: 'owned', component: OwnedPage },
];
