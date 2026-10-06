import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browserProjects } from './browser-projects.mjs';

test('exposes the web server host:ports, and only those, to a remote project', () => {
  assert.deepEqual(
    browserProjects(
      ['http://localhost:4310/sub/card', 'http://localhost:4312/sub/setup'],
      {
        BROWSERS: 'remote-chromium,chromium',
        PLAYWRIGHT_SERVER: 'ws://127.0.0.1:3000/token',
      },
    ).map(({ name, use }) => [name, use.connectOptions]),
    [
      [
        'remote-chromium',
        {
          wsEndpoint: 'ws://127.0.0.1:3000/token',
          exposeNetwork: 'localhost:4310,localhost:4312',
        },
      ],
      ['chromium', undefined],
    ],
  );
});

test('runs the floor engine alone when its variable is set', () => {
  assert.deepEqual(
    browserProjects(['http://localhost:4401'], {
      FLOOR_WEBKIT: 'true',
      BROWSERS: 'chromium',
    }).map(({ name }) => name),
    ['webkit'],
  );
});
