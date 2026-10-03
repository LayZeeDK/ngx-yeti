import { ApplicationConfig, ErrorDetails, ErrorHandler, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';
import { provideYetiStyles } from 'yeti-lib';

/** Logs which path each error took: onViewError (caught by a @boundary) or handleError (not caught). */
@Injectable()
class ProbeErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    record('handleError', message);
    console.error(`[EH handleError] ${message}`);
  }

  onViewError(error: Error, details: ErrorDetails): void {
    record('onViewError', error.message);
    console.warn(`[EH onViewError] ${error.message} boundary=${details.boundary ? 'yes' : 'no'}`);
  }
}

function record(kind: string, message: string): void {
  const g = globalThis as unknown as { __eh?: { kind: string; message: string; t: number }[] };
  (g.__eh ??= []).push({ kind, message, t: typeof performance !== 'undefined' ? performance.now() : 0 });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withI18nSupport()),
    provideYetiStyles({}),
    { provide: ErrorHandler, useClass: ProbeErrorHandler },
  ],
};
