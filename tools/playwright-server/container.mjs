/**
 * Runs `playwright run-server` on the loopback address and pipes a public
 * port to it. Inside the image: `node container.mjs <token>`; the test calls
 * `serve()` on this machine with its own cli path and ports.
 *
 * run-server binds 127.0.0.1 on purpose: bound to a loopback address,
 * Playwright's wsServer.ts answers 403 to every request whose Host is not
 * localhost, 127.0.0.1 or [::1] and to every upgrade with a non-loopback
 * Origin; bound to another address it checks neither.
 *
 * The pipe admits a connection only when its first request is
 * `GET /<token>`: Playwright's `/json` answers the token path to any request
 * with an allowed Host, and Docker publishes the port to other containers as
 * well as to this machine, so without this check any container could read
 * the token. A connection is closed at the first byte of `GET /` that
 * differs, or 5 s after it opened without the whole line; the line itself
 * is compared once, in constant time, so no byte of the token is confirmed
 * before the whole line arrives. Later requests on a kept-alive connection
 * pass unchecked; a client that got the first one through already holds the
 * token.
 */
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import net from 'node:net';

/**
 * @param {{
 *   cli: string,
 *   innerPort: number,
 *   port: number,
 *   token: string,
 *   listenHost?: string,
 *   idleMs?: number,
 * }} options `idleMs`: stop the server once no admitted connection has been
 * open for that long.
 */
export function serve({
  cli,
  innerPort,
  port,
  token,
  listenHost = '0.0.0.0',
  idleMs,
}) {
  const server = spawn(
    process.execPath,
    [
      cli,
      'run-server',
      '--host',
      '127.0.0.1',
      '--port',
      String(innerPort),
      '--path',
      `/${token}`,
    ],
    { stdio: 'inherit' },
  );
  const requestLine = Buffer.from(`GET /${token} HTTP/1.1\r\n`, 'latin1');
  // Only this public prefix is checked byte by byte; a per-byte check of the
  // token would tell a guesser which digit is right.
  const publicPrefix = 'GET /'.length;
  // Connections still before the line check, oldest first. At most 16 wait
  // at a time, so tokenless clients cannot fill the server's connection cap;
  // a new connection evicts the oldest waiting one.
  /** @type {Set<net.Socket>} */
  const pending = new Set();
  let admitted = 0;
  /** @type {NodeJS.Timeout | undefined} */
  let idle;

  const close = () => {
    clearTimeout(idle);
    forwarder.close();
    server.kill();
  };

  const armIdleTimer = () => {
    clearTimeout(idle);

    if (idleMs !== undefined && admitted === 0) {
      idle = setTimeout(close, idleMs);
    }
  };

  const forwarder = net
    .createServer((socket) => {
      if (pending.size >= 16) {
        for (const oldest of pending) {
          oldest.destroy();
          break;
        }
      }

      let head = Buffer.alloc(0);
      let passed = false;
      const deadline = setTimeout(() => socket.destroy(), 5000);

      pending.add(socket);
      socket.on('error', () => socket.destroy());
      socket.on('close', () => {
        clearTimeout(deadline);
        pending.delete(socket);

        if (passed) {
          admitted -= 1;
          armIdleTimer();
        }
      });
      socket.on('data', function onData(chunk) {
        head = Buffer.concat([head, chunk]);
        const seen = Math.min(head.length, publicPrefix);

        if (!head.subarray(0, seen).equals(requestLine.subarray(0, seen))) {
          socket.destroy();

          return;
        }

        if (head.length < requestLine.length) {
          return;
        }

        socket.off('data', onData);
        clearTimeout(deadline);

        if (
          !timingSafeEqual(head.subarray(0, requestLine.length), requestLine)
        ) {
          socket.destroy();

          return;
        }

        passed = true;
        pending.delete(socket);
        admitted += 1;
        clearTimeout(idle);

        const upstream = net.connect(innerPort, '127.0.0.1');
        const drop = () => {
          socket.destroy();
          upstream.destroy();
        };

        upstream.on('error', drop);
        socket.on('error', drop);
        upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      });
    })
    .listen(port, listenHost);

  // A cap, so stray local connections cannot exhaust the container.
  forwarder.maxConnections = 64;
  forwarder.on('error', (error) => {
    console.error(error);
    process.exitCode = 1;
    close();
  });
  armIdleTimer();

  return { server, close };
}

if (import.meta.main) {
  const [token] = process.argv.slice(2);
  const { server } = serve({
    cli: '/playwright-core/cli.js',
    innerPort: 3001,
    port: 3000,
    token,
    idleMs: 30 * 60_000,
  });

  // The idle stop ends run-server with SIGTERM and exits 0; a pipe error
  // does the same but has set exitCode 1 first. Any other signal, such as
  // the kernel's SIGKILL on memory exhaustion, is a failure.
  server.on('exit', (code, signal) => {
    process.exit(signal === 'SIGTERM' ? (process.exitCode ?? 0) : (code ?? 1));
  });
}
