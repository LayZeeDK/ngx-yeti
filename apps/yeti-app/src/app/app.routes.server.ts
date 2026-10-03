import { RenderMode, type ServerRoute } from '@angular/ssr';
import { fixtures } from './fixtures/fixtures';

export const serverRoutes: ServerRoute[] = Object.keys(fixtures).flatMap(
  (path) => [
    { path, renderMode: RenderMode.Prerender },
    { path: `server/${path}`, renderMode: RenderMode.Server },
  ],
);
