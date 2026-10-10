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

test('finds the Playwright configs', () => {
  assert.notEqual(configs.length, 0);
});

for (const path of configs) {
  test(`${path} exposes its web servers to every remote project`, () => {
    const config = JSON.parse(
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '--eval',
          printConfig,
          new URL(path, root).href,
        ],
        {
          encoding: 'utf8',
          timeout: 30_000,
          // Hermetic, so no FLOOR_* or FIXTURE_CONFIGURATION in the caller's
          // shell changes the projects or web servers. On Windows, libuv
          // adds the system variables Node needs.
          env: {
            BROWSERS: 'remote-chromium',
            PLAYWRIGHT_SERVER: 'ws://127.0.0.1:1/dummy',
          },
        },
      ),
    );
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
