import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Serve static files from /browser under the app's `<base href>`.
 */
app.use(
  '/sub',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Strict-CSP case of the setup spec (setup.md, layer 4): a `?csp` request,
 * such as `/sub/server/card?csp`, is answered with a per-request nonce in a
 * `style-src 'self' 'nonce-...'` policy. On a server-rendered route, Angular
 * gets the nonce as `CSP_NONCE` through the request context
 * (`app.config.server.ts`) and puts it on the item links, and the client reads
 * it from `ngCspNonce` on the root element. A prerendered route is served from
 * HTML rendered at build time, so its item and prefetch links carry no nonce
 * and load under `'self'`: `?csp` proves nonces on server-rendered routes
 * only. The critical CSS Angular inlines
 * at runtime only carries a nonce fixed at build time, so its `<style>` gets
 * the request's nonce here, as Angular's build-time `addNonce` step would.
 */
async function withNonce(response: Response, nonce: string): Promise<Response> {
  const html = (await response.text())
    .replace('<app-root', `<app-root ngCspNonce="${nonce}"`)
    .replaceAll(/<style(?![^>]*\snonce=)(?=[\s>])/g, `<style nonce="${nonce}"`);
  const headers = new Headers(response.headers);

  // The body grew by the nonces, so a prerendered page's length and
  // validator no longer describe it.
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('Content-Security-Policy', `style-src 'self' 'nonce-${nonce}'`);

  return new Response(html, { status: response.status, headers });
}

/**
 * Handle all other requests by rendering the Angular application, with a
 * nonce for a `?csp` request (see `withNonce` for what a prerendered route
 * does not get).
 */
app.use('/**', (req, res, next) => {
  const nonce = 'csp' in req.query ? randomBytes(16).toString('base64') : null;

  angularApp
    .handle(req, nonce === null ? undefined : { cspNonce: nonce })
    .then(async (response) => {
      if (!response) {
        next();

        return;
      }

      await writeResponseToNodeResponse(
        nonce === null ? response : await withNonce(response, nonce),
        res,
      );
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] ?? '4000';
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
