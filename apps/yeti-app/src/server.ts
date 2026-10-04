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
 * `style-src 'self' 'nonce-...'` policy. Angular gets the nonce as `CSP_NONCE`
 * through the request context (`app.config.server.ts`), and the client reads
 * it from `ngCspNonce` on the root element. The critical CSS Angular inlines
 * at runtime only carries a nonce fixed at build time, so its `<style>` gets
 * the request's nonce here, as Angular's build-time `addNonce` step would.
 */
app.use('/**', (req, res, next) => {
  if (!('csp' in req.query)) {
    next();

    return;
  }

  const nonce = randomBytes(16).toString('base64');

  angularApp
    .handle(req, { cspNonce: nonce })
    .then(async (response) => {
      if (!response) {
        next();

        return;
      }

      const html = (await response.text())
        .replace('<app-root', `<app-root ngCspNonce="${nonce}"`)
        .replaceAll(
          /<style(?![^>]*\snonce=)(?=[\s>])/g,
          `<style nonce="${nonce}"`,
        );
      const headers = new Headers(response.headers);

      headers.set(
        'Content-Security-Policy',
        `style-src 'self' 'nonce-${nonce}'`,
      );
      await writeResponseToNodeResponse(
        new Response(html, { status: response.status, headers }),
        res,
      );
    })
    .catch(next);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (response) {
        await writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
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
