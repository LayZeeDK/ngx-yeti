/**
 * Runs `playwright run-server` on the loopback address and pipes a public
 * port to it. Inside the image: `node container.mjs <token>`; the test calls
 * `serve()` on this machine with its own cli path and ports.
 *
 * run-server binds 127.0.0.1 on purpose: bound to a loopback address,
 * Playwright's wsServer.ts answers 403 to every request whose Host is not
 * localhost, 127.0.0.1 or [::1] and to every upgrade with a non-loopback
 * Origin; bound to another address it checks neither.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';

/**
 * @param {{
 *   cli: string,
 *   innerPort: number,
 *   port: number,
 *   token: string,
 *   listenHost?: string,
 * }} options
 */
export function serve({ cli, innerPort, port, token, listenHost = '0.0.0.0' }) {
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
  const forwarder = net
    .createServer((socket) => {
      const upstream = net.connect(innerPort, '127.0.0.1');
      const close = () => {
        socket.destroy();
        upstream.destroy();
      };

      socket.pipe(upstream).pipe(socket);
      socket.on('error', close);
      upstream.on('error', close);
    })
    .listen(port, listenHost);

  // A cap, so stray local connections cannot exhaust the container.
  forwarder.maxConnections = 64;
  forwarder.on('error', (error) => {
    console.error(error);
    server.kill();
  });

  return {
    server,
    close() {
      forwarder.close();
      server.kill();
    },
  };
}

if (import.meta.main) {
  const [token] = process.argv.slice(2);
  const { server } = serve({
    cli: '/playwright-core/cli.js',
    innerPort: 3001,
    port: 3000,
    token,
  });

  server.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}
