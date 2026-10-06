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
// playwright-core's exports map does not list cli.js; resolve it beside the
// package manifest.
const cli = path.join(
  path.dirname(require.resolve('playwright-core/package.json')),
  'cli.js',
);

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
 * One request on a connection of its own (the pipe checks the first request
 * of a connection; a kept-alive one would reuse the check). A WebSocket
 * upgrade resolves with status 101; a connection the pipe closes rejects.
 *
 * @param {number} port
 * @param {string} path
 * @param {Record<string, string>} headers
 * @returns {Promise<{ status: number, headers: http.IncomingHttpHeaders, body: string }>}
 */
function request(port, path, headers) {
  return new Promise((resolve, reject) => {
    const client = http.request(
      { host: '127.0.0.1', port, path, headers, setHost: false, agent: false },
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

/**
 * Polls the token path until run-server answers it through the pipe: any
 * HTTP status proves the server is up; a closed connection does not.
 *
 * @param {number} port
 * @param {string} token
 */
async function ready(port, token) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const answered = await request(port, `/${token}`, {
      Host: `127.0.0.1:${String(port)}`,
    })
      .then(() => true)
      .catch(() => false);

    if (answered) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('run-server did not answer');
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
    cli,
    innerPort: inner,
    port,
    token,
    listenHost: '127.0.0.1',
  });
  await ready(port, token);
});

after(() => {
  running?.close();
});

test('closes a /json request before Playwright sees it', async () => {
  await assert.rejects(request(port, '/json', loopbackHost()));
  await assert.rejects(
    request(port, '/json', { Host: `evil.example:${String(port)}` }),
  );
});

test('closes an upgrade at the wrong path', async () => {
  await assert.rejects(request(port, '/', upgradeHeaders()));
});

test('refuses an upgrade from a web page origin', async () => {
  const response = await request(port, `/${token}`, {
    ...upgradeHeaders(),
    Origin: 'http://evil.example',
  });

  assert.equal(response.status, 403);
});

test('refuses an upgrade with another Host', async () => {
  const response = await request(port, `/${token}`, {
    ...upgradeHeaders(),
    Host: `evil.example:${String(port)}`,
  });

  assert.equal(response.status, 403);
});

test('accepts an upgrade at the token path', async () => {
  const response = await request(port, `/${token}`, upgradeHeaders());

  assert.equal(response.status, 101);
});

/**
 * Opens a raw connection, writes `bytes` with `gapMs` between them, and
 * resolves with the time until the pipe closed it, or -1 if it stayed open
 * for `waitMs`.
 *
 * @param {Buffer} bytes
 * @param {number} gapMs
 * @param {number} waitMs
 */
function dribble(bytes, gapMs, waitMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.connect(port, '127.0.0.1');
    let index = 0;
    const timer = setInterval(() => {
      if (index < bytes.length) {
        socket.write(bytes.subarray(index, index + 1));
        index += 1;
      }
    }, gapMs);
    const stop = setTimeout(() => {
      clearInterval(timer);
      socket.destroy();
      resolve(-1);
    }, waitMs);

    socket.on('close', () => {
      clearInterval(timer);
      clearTimeout(stop);
      resolve(Date.now() - started);
    });
    socket.on('error', () => socket.destroy());
  });
}

test('closes a client whose first bytes are not `GET /`', async () => {
  const closedAfter = await dribble(Buffer.from('X'), 10, 3000);

  assert.ok(closedAfter >= 0 && closedAfter < 1000, String(closedAfter));
});

test('keeps a right and a wrong first token digit open alike', async () => {
  const right = token[0];
  const wrong = right === '0' ? '1' : '0';

  for (const digit of [right, wrong]) {
    // The whole prefix at once, then silence: a per-byte check of the token
    // would close the wrong digit now and keep the right one open.
    const closedAfter = await dribble(Buffer.from(`GET /${digit}`), 1, 300);

    assert.equal(
      closedAfter,
      -1,
      `${digit} closed after ${String(closedAfter)} ms`,
    );
  }
});

test('closes a dribbling client 5 s after it opened', async () => {
  // Correct bytes, one every 400 ms: the line never completes in time.
  const closedAfter = await dribble(
    Buffer.from(`GET /${token} HTTP/1.1\r\n`, 'latin1'),
    400,
    9000,
  );

  assert.ok(closedAfter >= 4500 && closedAfter < 7000, String(closedAfter));
});

/**
 * Opens `count` connections that send `GET /` and then nothing, and resolves
 * with a function that closes them.
 *
 * @param {number} toPort
 * @param {number} count
 */
async function holdPending(toPort, count) {
  const sockets = Array.from({ length: count }, () =>
    net.connect(toPort, '127.0.0.1'),
  );

  for (const socket of sockets) {
    socket.on('error', () => socket.destroy());
    await once(socket, 'connect');
    socket.write('GET /');
  }

  return () => {
    for (const socket of sockets) {
      socket.destroy();
    }
  };
}

test('admits an upgrade while 16 tokenless connections are pending', async () => {
  const release = await holdPending(port, 16);

  try {
    const response = await request(port, `/${token}`, upgradeHeaders());

    assert.equal(response.status, 101);
  } finally {
    release();
  }
});

test('stops once no admitted connection has been open for the idle time', async () => {
  const [outer, inner] = await twoFreePorts();
  const idleToken = randomBytes(16).toString('hex');
  const idle = serve({
    cli,
    innerPort: inner,
    port: outer,
    token: idleToken,
    listenHost: '127.0.0.1',
    idleMs: 500,
  });
  // A tokenless peer every 300 ms must not keep the server up.
  const peer = setInterval(() => {
    const socket = net.connect(outer, '127.0.0.1', () => socket.write('GET /'));

    socket.on('error', () => socket.destroy());
  }, 300);

  try {
    await ready(outer, idleToken);
    await once(idle.server, 'exit');
    clearInterval(peer);
    await assert.rejects(
      request(outer, `/${idleToken}`, { Host: `127.0.0.1:${String(outer)}` }),
    );
  } finally {
    clearInterval(peer);
    idle.close();
  }
});
