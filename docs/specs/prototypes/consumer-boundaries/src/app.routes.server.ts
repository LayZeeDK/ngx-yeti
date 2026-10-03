import { RenderMode, ServerRoute } from '@angular/ssr';

const prerendered = [
  ...['none', 'server', 'client', 'both', 'reset'].map((where) => ({ layout: 'plain', where, phase: 'ctor' })),
  ...['none', 'server', 'client', 'both'].map((where) => ({ layout: 'on', where, phase: 'ctor' })),
  ...['none', 'server', 'client', 'both'].map((where) => ({ layout: 'never', where, phase: 'ctor' })),
];

export const serverRoutes: ServerRoute[] = [
  { path: 'p/:layout/:where/:phase', renderMode: RenderMode.Prerender, getPrerenderParams: async () => prerendered },
  { path: '**', renderMode: RenderMode.Server },
];
