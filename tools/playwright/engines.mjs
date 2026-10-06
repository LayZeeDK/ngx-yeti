import { once } from 'node:events';
import net from 'node:net';

/** @typedef {'chromium' | 'firefox' | 'webkit'} Engine */
/** @typedef {{ channel?: string, executablePath?: string }} LaunchOptions */
/** @typedef {{ name: string, engine: Engine, launchOptions?: LaunchOptions }} Browser */

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {Map<string, Omit<Browser, 'name'>>}
 */
function known(env) {
  const firefoxPath = env['FIREFOX_PATH'];

  return new Map([
    ['chromium', { engine: 'chromium' }],
    ['chrome', { engine: 'chromium', launchOptions: { channel: 'chrome' } }],
    ['msedge', { engine: 'chromium', launchOptions: { channel: 'msedge' } }],
    ['firefox', { engine: 'firefox' }],
    [
      'moz-firefox',
      {
        engine: 'firefox',
        launchOptions: {
          channel: 'moz-firefox',
          // The channel looks only in Firefox's default install folders, not
          // in a Microsoft Store install.
          ...(firefoxPath ? { executablePath: firefoxPath } : {}),
        },
      },
    ],
    ['webkit', { engine: 'webkit' }],
  ]);
}

/**
 * The browsers of every browser test run that no floor variable (FLOOR_*,
 * SAFARI) claims: the configs check those first. BROWSERS, a comma-separated
 * list such as `webkit` or `msedge,firefox`, wins over CI; with CI set, the
 * three current engines run; locally, Chromium runs. Names run in list order,
 * each once.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {Browser[]}
 */
export function engines(env = process.env) {
  const table = known(env);
  const list =
    env['BROWSERS'] || (env['CI'] ? 'chromium,firefox,webkit' : 'chromium');
  const names = [...new Set(list.split(',').map((name) => name.trim()))];

  return names.map((name) => {
    const browser = table.get(name);

    if (!browser) {
      throw new Error(
        `BROWSERS=${list}: "${name}" is not one of ${[...table.keys()].join(', ')}`,
      );
    }

    return { name, ...browser };
  });
}

/**
 * The `browser.api` of a Vitest browser config: 127.0.0.1 and a port the OS
 * hands out there now. Vitest's default port can be shared on Windows or sit
 * in a Hyper-V excluded range, and Vitest replaces `port: 0` with its default
 * (upstream bugs O8 to O11).
 *
 * @returns {Promise<{ host: string, port: number }>}
 */
export async function vitestBrowserApi() {
  const host = '127.0.0.1';
  const server = net.createServer().listen(0, host);

  await once(server, 'listening');
  const address = server.address();
  server.close();
  await once(server, 'close');

  if (typeof address !== 'object' || address === null) {
    throw new Error(`No TCP address for a free port on ${host}`);
  }

  return { host, port: address.port };
}

/**
 * `engines()` as the instances of a Vitest browser project. A channel gets
 * its own provider, made by the `provider` passed in (`playwright` from
 * `@vitest/browser-playwright`), so this file imports no Vitest code.
 *
 * @template P
 * @param {(options: { launchOptions: LaunchOptions }) => P} provider
 */
export function vitestInstances(provider) {
  return engines().map(({ name, engine, launchOptions }) =>
    launchOptions
      ? { browser: engine, name, provider: provider({ launchOptions }) }
      : { browser: engine },
  );
}
