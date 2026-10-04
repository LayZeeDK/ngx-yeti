import {
  CSP_NONCE,
  inject,
  mergeApplicationConfig,
  REQUEST_CONTEXT,
  type ApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/** The nonce `server.ts` passes for a `?csp` request, else `null`. */
function cspNonce(context: unknown): string | null {
  return typeof context === 'object' &&
    context !== null &&
    'cspNonce' in context &&
    typeof context.cspNonce === 'string'
    ? context.cspNonce
    : null;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: CSP_NONCE,
      useFactory: () => cspNonce(inject(REQUEST_CONTEXT, { optional: true })),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
