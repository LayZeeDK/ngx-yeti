import { type Route } from '@angular/router';
import { fixtures } from './fixtures/fixtures';

export const appRoutes: Route[] = Object.entries(fixtures).flatMap(
  ([path, component]) => [
    { path, component },
    { path: `server/${path}`, component },
  ],
);
