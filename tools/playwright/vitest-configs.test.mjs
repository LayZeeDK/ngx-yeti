import assert from 'node:assert/strict';
import { test } from 'node:test';

// Every Vitest config with a browser project. Loading the unit config
// imports webdriverio, which changes this process's DNS order, so these
// tests live apart from the Vite test in engines.test.mjs.
const configs = [
  '../../packages/ngx-yeti/vitest.config.mts',
  '../../packages/ngx-yeti/vitest.unit.config.mts',
  '../../packages/ngx-yeti-testing/vitest.config.mts',
];

for (const path of configs) {
  test(`${path} binds its browser server to 127.0.0.1 at a picked port`, async () => {
    const { default: config } = await import(
      new URL(path, import.meta.url).href
    );
    const browsers = config.test.projects
      .map((project) => project.test)
      .filter((project) => project?.browser?.enabled);

    assert.notEqual(browsers.length, 0);

    for (const { name, browser } of browsers) {
      assert.equal(browser.api?.host, '127.0.0.1', name);
      assert.ok(
        Number.isInteger(browser.api.port) && browser.api.port > 0,
        name,
      );
    }
  });
}
