import type { ServerResponse } from 'node:http';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type Plugin } from 'vitest/config';

const browserSpecs = 'src/**/*.browser.spec.ts';

function send(response: ServerResponse, status: number, type: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', type);
  response.setHeader('Cache-Control', 'no-store');
  response.end(type === 'text/css' ? 'p { color: red; }' : '<!doctype html>');
}

/**
 * The stylesheet responses `item-links.browser.spec.ts` loads: a real sheet,
 * a 404, a 200 that is HTML (a server's single-page fallback), and a sheet
 * that stays pending for 2 s.
 */
const stylesheetResponses: Plugin = {
  name: 'stylesheet-responses',
  configureServer(server) {
    server.middlewares.use('/__stylesheet/', (request, response) => {
      const name = request.url?.split('?')[0];

      if (name === '/ok.css') {
        send(response, 200, 'text/css');
      } else if (name === '/html.css') {
        send(response, 200, 'text/html');
      } else if (name === '/pending.css') {
        setTimeout(() => {
          send(response, 200, 'text/css');
        }, 2000);
      } else {
        send(response, 404, 'text/html');
      }
    });
  },
};

export default defineConfig({
  plugins: [angular({ fastCompile: true, jit: false })],
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: [browserSpecs],
          // Inlined, Angular's partially compiled packages go through the
          // Analog linker; external, they would need the JIT compiler.
          server: { deps: { inline: [/@angular\//] } },
        },
      },
      {
        extends: true,
        plugins: [stylesheetResponses],
        test: {
          name: 'browser',
          include: [browserSpecs],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: process.env['CI']
              ? [
                  { browser: 'chromium' },
                  { browser: 'firefox' },
                  { browser: 'webkit' },
                ]
              : [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
