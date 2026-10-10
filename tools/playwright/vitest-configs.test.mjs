import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { test } from 'node:test';

// Every Vitest browser config in a workspace project. Loading the unit
// config imports webdriverio, which changes this process's DNS order, so
// these tests live apart from the Vite test in engines.test.mjs.
const root = new URL('../../', import.meta.url);
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

test('finds the Vitest browser configs', () => {
  assert.notEqual(configs.length, 0);
});

for (const path of configs) {
  test(`${path} binds its browser server to 127.0.0.1 at a picked port`, async () => {
    const { default: config } = await import(new URL(path, root).href);
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
