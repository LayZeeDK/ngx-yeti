import { RenderMode, ServerRoute } from '@angular/ssr';

// PROTOTYPE (ticket 18): /pre is prerendered at build time, the rest rendered per request.
export const serverRoutes: ServerRoute[] = [
  { path: 'pre', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
