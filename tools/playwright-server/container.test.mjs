import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import { createRequire } from 'node:module';
import net from 'node:net';
import { once } from 'node:events';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { serve } from './container.mjs';

const require = createRequire(import.meta.url);

/** Two distinct ports the OS hands out on 127.0.0.1 now. */
async function twoFreePorts() {
  const servers = [net.createServer(), net.createServer()];

  for (const server of servers) {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
  }

  const ports = servers.map((server) => {
    const address = server.address();

    assert.ok(typeof address === 'object' && address !== null);

    return address.port;
  });

  for (const server of servers) {
    server.close();
    await once(server, 'close');
  }

  return ports;
}

/**
 * One request; a WebSocket upgrade resolves with status 101.
 *
 * @param {number} port
 * @param {string} path
 * @param {Record<string, string>} headers
 * @returns {Promise<{ status: number, headers: http.IncomingHttpHeaders, body: string }>}
 */
function request(port, path, headers) {
  return new Promise((resolve, reject) => {
    const client = http.request(
      { host: '127.0.0.1', port, path, headers, setHost: false },
      (response) => {
        let body = '';

        response.on('data', (chunk) => (body += String(chunk)));
        response.on('end', () =>
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body,
          }),
        );
      },
    );

    client.on('upgrade', (response, socket) => {
      socket.destroy();
      resolve({ status: 101, headers: response.headers, body: '' });
    });
    client.on('error', reject);
    client.end();
  });
}

const token = randomBytes(16).toString('hex');
let port = 0;
/** @type {ReturnType<typeof serve> | undefined} */
let running;

const loopbackHost = () => ({ Host: `127.0.0.1:${String(port)}` });
const upgradeHeaders = () => ({
  ...loopbackHost(),
  Connection: 'Upgrade',
  Upgrade: 'websocket',
  'Sec-WebSocket-Version': '13',
  'Sec-WebSocket-Key': randomBytes(16).toString('base64'),
});

before(async () => {
  const [outer, inner] = await twoFreePorts();

  port = outer;
  running = serve({
    // playwright-core's exports map does not list cli.js; resolve it beside
    // the package manifest.
    cli: path.join(
      path.dirname(require.resolve('playwright-core/package.json')),
      'cli.js',
    ),
    innerPort: inner,
    port,
    token,
    listenHost: '127.0.0.1',
  });

  for (let attempt = 0; attempt < 100; attempt++) {
    const ready = await request(port, '/json', loopbackHost())
      .then((response) => response.status === 200)
      .catch(() => false);

    if (ready) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('run-server did not answer');
});

after(() => {
  running?.close();
});

test('serves /json to the loopback Host, without a CORS header', async () => {
  const response = await request(port, '/json', loopbackHost());

  assert.equal(response.status, 200);
  assert.ok(response.body.includes(`"/${token}"`));
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('refuses /json to another Host', async () => {
  const response = await request(port, '/json', {
    Host: `evil.example:${String(port)}`,
  });

  assert.equal(response.status, 403);
  assert.equal(response.body, '');
});

test('refuses an upgrade from a web page origin', async () => {
  const response = await request(port, `/${token}`, {
    ...upgradeHeaders(),
    Origin: 'http://evil.example',
  });

  assert.equal(response.status, 403);
});

test('refuses an upgrade at the wrong path', async () => {
  const response = await request(port, '/', upgradeHeaders());

  assert.equal(response.status, 400);
});

test('accepts an upgrade at the token path', async () => {
  const response = await request(port, `/${token}`, upgradeHeaders());

  assert.equal(response.status, 101);
});
