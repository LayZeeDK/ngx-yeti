import {
  CSP_NONCE,
  ErrorHandler,
  inject,
  mergeApplicationConfig,
  REQUEST_CONTEXT,
  type ApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { FixtureFault } from './fixtures/setup-boundaries-fixture';

/**
 * The setup-boundaries fixture's faults are deliberate; logged on each
 * server render, they bury real errors in the e2e and build logs.
 */
class FixtureFaultFilter extends ErrorHandler {
  override onViewError(error: Error): void {
    if (!(error instanceof FixtureFault)) {
      this.handleError(error);
    }
  }
}

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
    { provide: ErrorHandler, useClass: FixtureFaultFilter },
    {
      provide: CSP_NONCE,
      useFactory: () => cspNonce(inject(REQUEST_CONTEXT, { optional: true })),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
