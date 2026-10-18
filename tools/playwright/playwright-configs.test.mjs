// @ts-check
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { basename } from 'node:path';
import { test } from 'node:test';
import { hostPort } from './browser-projects.mjs';

// Every Playwright config in a workspace project. Each one reads
// process.env at import, so it loads in a child process with its own env.
const root = new URL('../../', import.meta.url);
const configs = globSync(
  '{apps,packages}/**/playwright.config.{ts,mts,cts,js,mjs,cjs}',
  {
    cwd: root,
    exclude: (path) => ['node_modules', 'dist'].includes(basename(path)),
  },
).map((path) => path.replaceAll('\\', '/'));
const printConfig =
  'process.stdout.write(JSON.stringify((await import(process.argv[1])).default))';

/**
 * The config at `path`, loaded with only `env`, so no FLOOR_*,
 * FIXTURE_CONFIGURATION or E2E_LOCAL_WORKERS in the caller's shell changes it.
 * On Windows, libuv adds the system variables Node needs.
 *
 * @param {string} path
 * @param {Record<string, string>} env
 */
function load(path, env) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      ['--input-type=module', '--eval', printConfig, new URL(path, root).href],
      { encoding: 'utf8', timeout: 30_000, env },
    ),
  );
}

test('finds the Playwright configs', () => {
  assert.notEqual(configs.length, 0);
});

for (const path of configs) {
  test(`${path} exposes its web servers to every remote project`, () => {
    const config = load(path, {
      BROWSERS: 'remote-chromium',
      PLAYWRIGHT_SERVER: 'ws://127.0.0.1:1/dummy',
    });
    const urls = [config.webServer ?? []]
      .flat()
      .map(({ url }) => url)
      .concat(config.use?.baseURL ?? []);

    assert.notEqual(config.projects.length, 0);

    for (const { name, use } of config.projects) {
      assert.ok(use.connectOptions?.wsEndpoint, `${name}: no remote engine`);

      const exposed = use.connectOptions.exposeNetwork?.split(',') ?? [];

      for (const url of urls) {
        assert.ok(exposed.includes(hostPort(url)), `${name}: ${url}`);
      }
    }
  });
}

for (const path of configs) {
  test(`${path} keeps CI's one worker unless run-job.mjs sets E2E_LOCAL_WORKERS`, () => {
    assert.equal(load(path, { CI: 'true' }).workers, 1);
    assert.equal(load(path, { CI: 'true', E2E_LOCAL_WORKERS: '3' }).workers, 3);
  });
}

test('apps/yeti-app-e2e runs tailwind.spec.ts only against the Tailwind builds, each on its own port', () => {
  const path = 'apps/yeti-app-e2e/playwright.config.mts';
  const ports = new Set();

  for (const configuration of ['development', 'production']) {
    const config = load(path, { FIXTURE_CONFIGURATION: configuration });

    assert.equal(config.testIgnore, 'tailwind.spec.ts');
    assert.equal(config.testMatch, undefined);
    ports.add(hostPort(config.use.baseURL));
  }

  for (const configuration of ['tailwind-c1', 'tailwind-c2']) {
    const config = load(path, { FIXTURE_CONFIGURATION: configuration });

    assert.equal(config.testMatch, 'tailwind.spec.ts');
    assert.equal(config.testIgnore, undefined);
    assert.deepEqual(
      config.webServer.map(
        /** @param {{ command: string }} server */ ({ command }) =>
          command.split(' ').at(-1),
      ),
      [`yeti-app:serve-ssr:${configuration}`],
    );
    ports.add(hostPort(config.use.baseURL));
  }

  assert.equal(ports.size, 4);
});
