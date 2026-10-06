import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { engines, vitestBrowserApi, vitestInstances } from './engines.mjs';

/** @param {NodeJS.ProcessEnv} env */
const names = (env) => engines(env).map(({ name }) => name);

test('runs Chromium without CI or BROWSERS', () => {
  assert.deepEqual(names({}), ['chromium']);
});

test('runs the three engines with CI set', () => {
  assert.deepEqual(names({ CI: 'true' }), ['chromium', 'firefox', 'webkit']);
});

test('lets BROWSERS win over CI', () => {
  assert.deepEqual(names({ CI: 'true', BROWSERS: 'webkit' }), ['webkit']);
});

test('keeps the list order and drops repeats', () => {
  assert.deepEqual(names({ BROWSERS: ' webkit , chromium,webkit' }), [
    'webkit',
    'chromium',
  ]);
});

test('falls back to the default for an empty BROWSERS', () => {
  assert.deepEqual(names({ BROWSERS: '' }), ['chromium']);
  assert.deepEqual(names({ BROWSERS: '', CI: 'true' }), [
    'chromium',
    'firefox',
    'webkit',
  ]);
});

test('sets FIREFOX_PATH as the executable of moz-firefox only', () => {
  const env = {
    BROWSERS: 'moz-firefox,msedge,firefox',
    FIREFOX_PATH: 'ff.exe',
  };

  assert.deepEqual(
    engines(env).map(({ options }) => options?.launchOptions),
    [
      { channel: 'moz-firefox', executablePath: 'ff.exe' },
      { channel: 'msedge' },
      undefined,
    ],
  );
});

test('connects the remote names to PLAYWRIGHT_SERVER', () => {
  // Playwright treats an empty exposeNetwork as no proxy.
  const connectOptions = {
    wsEndpoint: 'ws://127.0.0.1:3000/token',
    exposeNetwork: '',
  };

  assert.deepEqual(
    engines({
      BROWSERS: 'remote-chromium,remote-firefox,remote-webkit,webkit',
      PLAYWRIGHT_SERVER: connectOptions.wsEndpoint,
    }),
    [
      {
        name: 'remote-chromium',
        engine: 'chromium',
        options: { connectOptions },
      },
      {
        name: 'remote-firefox',
        engine: 'firefox',
        options: { connectOptions },
      },
      { name: 'remote-webkit', engine: 'webkit', options: { connectOptions } },
      { name: 'webkit', engine: 'webkit' },
    ],
  );
});

test('exposes only the named host:ports to a remote engine', () => {
  const env = {
    BROWSERS: 'remote-webkit,webkit',
    PLAYWRIGHT_SERVER: 'ws://127.0.0.1:3000/token',
  };

  assert.deepEqual(
    engines(env, ['localhost:4310', '127.0.0.1:4312']).map(
      ({ options }) => options?.connectOptions?.exposeNetwork,
    ),
    ['localhost:4310,127.0.0.1:4312', undefined],
  );
});

test('refuses a remote name without a Playwright server', () => {
  assert.throws(
    () => engines({ BROWSERS: 'remote-webkit' }),
    /"remote-webkit" needs a Playwright server: run `node tools\/playwright-server\/server.mjs` or set PLAYWRIGHT_SERVER/,
  );
  assert.doesNotThrow(() => engines({ BROWSERS: 'webkit' }));
});

test('gives a channel or a remote engine its own Vitest provider', () => {
  assert.deepEqual(
    vitestInstances(
      (options) => options,
      { host: '127.0.0.1', port: 61000 },
      {
        BROWSERS: 'chromium,msedge,remote-firefox',
        PLAYWRIGHT_SERVER: 'ws://127.0.0.1:3000/token',
      },
    ),
    [
      { browser: 'chromium' },
      {
        browser: 'chromium',
        name: 'msedge',
        provider: { launchOptions: { channel: 'msedge' } },
      },
      {
        browser: 'firefox',
        name: 'remote-firefox',
        provider: {
          connectOptions: {
            wsEndpoint: 'ws://127.0.0.1:3000/token',
            // The Vitest browser server, and nothing else on this machine.
            exposeNetwork: '127.0.0.1:61000',
          },
        },
      },
    ],
  );
});

test('names the entry it cannot run', () => {
  assert.throws(() => engines({ BROWSERS: ',' }), /"" is not one of/);
  assert.throws(() => engines({ BROWSERS: 'webkit,' }), /"" is not one of/);
  assert.throws(
    () => engines({ BROWSERS: 'safari' }),
    /"safari" is not one of/,
  );
});

test('pins the browser port only when a remote engine is selected', async () => {
  const local = await vitestBrowserApi({ BROWSERS: 'chromium' });
  const remote = await vitestBrowserApi({
    BROWSERS: 'chromium,remote-webkit',
    PLAYWRIGHT_SERVER: 'ws://127.0.0.1:3000/token',
  });

  assert.equal(local.strictPort, undefined);
  assert.equal(remote.strictPort, true);
});

test('names the Vite server URL 127.0.0.1 at the port vitestBrowserApi() picks', async () => {
  const api = await vitestBrowserApi();
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
    server: { ...api, hmr: false, watch: null },
  });

  try {
    await server.listen();

    assert.deepEqual(server.resolvedUrls?.local, [
      `http://127.0.0.1:${String(api.port)}/`,
    ]);
  } finally {
    await server.close();
  }
});
