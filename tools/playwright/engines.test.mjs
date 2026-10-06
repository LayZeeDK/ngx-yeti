import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { engines, vitestBrowserApi } from './engines.mjs';

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

test('names the entry it cannot run', () => {
  assert.throws(() => engines({ BROWSERS: ',' }), /"" is not one of/);
  assert.throws(() => engines({ BROWSERS: 'webkit,' }), /"" is not one of/);
  assert.throws(
    () => engines({ BROWSERS: 'safari' }),
    /"safari" is not one of/,
  );
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
