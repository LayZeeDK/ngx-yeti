// @ts-check
import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Every Vitest browser config in a workspace project. Loading the unit
// config imports webdriverio, which changes this process's DNS order, so
// these tests live apart from the Vite test in engines.test.mjs.
const root = new URL('../../', import.meta.url);
const callerEnv = { ...process.env };
const configs = globSync(
  '{apps,packages}/**/{vitest*,vite}.config.{ts,mts,cts,js,mjs,cjs}',
  {
    cwd: root,
    exclude: (path) => ['node_modules', 'dist'].includes(basename(path)),
  },
)
  .map((path) => path.replaceAll('\\', '/'))
  // Only configs that name a browser: importing Analog's Vite plugin loads
  // Nitro, Rollup and about 170 packages.
  .filter((path) =>
    /\bbrowser\b/.test(readFileSync(new URL(path, root), 'utf8')),
  );

/**
 * The browser and floor variables the configs read, and every other FLOOR_*
 * variable set in `env`.
 *
 * @param {NodeJS.ProcessEnv} env
 */
function browserVariables(env) {
  return [
    ...new Set([
      'BROWSERS',
      'PLAYWRIGHT_SERVER',
      'SAFARI',
      'FLOOR_CHROMIUM_PATH',
      'FLOOR_FIREFOX',
      'FLOOR_FIREFOX_E2E',
      'FLOOR_WEBKIT',
      ...Object.keys(env).filter((name) => name.startsWith('FLOOR_')),
    ]),
  ];
}

/**
 * The config at `href`, imported with none of the caller's browser variables
 * and only `env` set. A set PLAYWRIGHT_SERVER keeps engines.mjs from reading
 * the endpoint file of a running Playwright server; no local engine uses it.
 * A config keeps the env of its first import, so each `href` is imported once.
 *
 * @param {string} href
 * @param {Record<string, string>} [env]
 */
async function importConfig(href, env = {}) {
  const names = [
    ...new Set([...browserVariables(process.env), ...Object.keys(env)]),
  ];
  const before = names.map((name) => process.env[name]);

  try {
    for (const name of names) {
      delete process.env[name];
    }

    Object.assign(
      process.env,
      { PLAYWRIGHT_SERVER: 'ws://127.0.0.1:1/unused' },
      env,
    );

    return await import(href);
  } finally {
    names.forEach((name, index) => {
      const value = before[index];

      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    });
  }
}

test('finds the Vitest browser configs', () => {
  assert.notEqual(configs.length, 0);
});

for (const path of configs) {
  test(`${path} binds its browser server to 127.0.0.1 at a picked port`, async () => {
    const { default: config } = await importConfig(new URL(path, root).href);
    const browsers = [config, ...(config.test?.projects ?? [])]
      .map((project) => project.test)
      .filter((project) => project?.browser?.enabled);

    assert.notEqual(
      browsers.length,
      0,
      'names a browser but has no enabled browser block',
    );

    for (const { name, browser } of browsers) {
      assert.equal(browser.api?.host, '127.0.0.1', name);
      assert.ok(
        Number.isInteger(browser.api.port) && browser.api.port > 0,
        name,
      );
    }
  });
}

test('the unit config starts the Chromium floor build without the stack profiler', async () => {
  const { default: config } = await importConfig(
    new URL('packages/ngx-yeti/vitest.unit.config.mts?floor', root).href,
    { FLOOR_CHROMIUM_PATH: '/floor/chrome' },
  );
  const browser = config.test.projects.find(
    (/** @type {{ test: { name: string } }} */ project) =>
      project.test.name === 'browser',
  ).test.browser;

  assert.deepEqual(browser.provider.options.launchOptions, {
    executablePath: '/floor/chrome',
    args: ['--disable-stack-profiler'],
  });
  assert.deepEqual(browser.instances, [{ browser: 'chromium' }]);
});

test('the unit config downloads the Firefox floor into tmp/floor-firefox', async () => {
  const { default: config } = await importConfig(
    new URL('packages/ngx-yeti/vitest.unit.config.mts?floor-firefox', root)
      .href,
    { FLOOR_FIREFOX: 'true' },
  );
  const browser = config.test.projects.find(
    (/** @type {{ test: { name: string } }} */ project) =>
      project.test.name === 'browser',
  ).test.browser;

  assert.deepEqual(browser.provider.options.capabilities, {
    browserVersion: 'stable_145.0',
    'wdio:geckodriverOptions': {
      cacheDir: fileURLToPath(new URL('tmp/floor-firefox', root)),
    },
  });
  assert.deepEqual(browser.instances, [{ browser: 'firefox' }]);
});

test('leaves the caller browser variables as it found them', () => {
  const names = browserVariables(callerEnv);

  assert.deepEqual(
    names.map((name) => process.env[name]),
    names.map((name) => callerEnv[name]),
  );
  assert.deepEqual(browserVariables(process.env), names);
});
