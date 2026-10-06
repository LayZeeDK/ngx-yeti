import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import net from 'node:net';

/** @typedef {'chromium' | 'firefox' | 'webkit'} Engine */
/** @typedef {{ channel?: string, executablePath?: string }} LaunchOptions */
/** @typedef {{ wsEndpoint: string, exposeNetwork: string }} ConnectOptions */
/**
 * The Playwright options of a browser, in the shape both consumers take as
 * is: Vitest's `PlaywrightProviderOptions` and Playwright Test's `use`.
 *
 * @typedef {{
 *   launchOptions?: LaunchOptions,
 *   connectOptions?: ConnectOptions,
 * }} Options
 */
/** @typedef {{ name: string, engine: Engine, options?: Options }} Browser */

/**
 * Where the Playwright server script writes the endpoint of the server it
 * runs, its path included.
 */
export const playwrightServerFile = new URL(
  '../../tmp/playwright-server',
  import.meta.url,
);

function serverFileEndpoint() {
  try {
    return readFileSync(playwrightServerFile, 'utf8').trim();
  } catch {
    return '';
  }
}

export const localEnv = () => ({
  ...process.env,
  PLAYWRIGHT_SERVER: process.env['PLAYWRIGHT_SERVER'] || serverFileEndpoint(),
});

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} expose
 * @returns {Map<string, Omit<Browser, 'name'>>}
 */
function known(env, expose) {
  const firefoxPath = env['FIREFOX_PATH'];
  const endpoint = env['PLAYWRIGHT_SERVER'];
  /** @type {{ options?: Options }} */
  const remote = endpoint
    ? {
        options: {
          connectOptions: {
            wsEndpoint: endpoint,
            exposeNetwork: expose.join(','),
          },
        },
      }
    : {};

  return new Map([
    ['chromium', { engine: 'chromium' }],
    [
      'chrome',
      { engine: 'chromium', options: { launchOptions: { channel: 'chrome' } } },
    ],
    [
      'msedge',
      { engine: 'chromium', options: { launchOptions: { channel: 'msedge' } } },
    ],
    ['firefox', { engine: 'firefox' }],
    [
      'moz-firefox',
      {
        engine: 'firefox',
        options: {
          launchOptions: {
            channel: 'moz-firefox',
            // The channel looks only in Firefox's default install folders,
            // not in a Microsoft Store install.
            ...(firefoxPath ? { executablePath: firefoxPath } : {}),
          },
        },
      },
    ],
    ['webkit', { engine: 'webkit' }],
    ['remote-chromium', { engine: 'chromium', ...remote }],
    ['remote-firefox', { engine: 'firefox', ...remote }],
    ['remote-webkit', { engine: 'webkit', ...remote }],
  ]);
}

/**
 * The browsers of every browser test run that no floor variable (FLOOR_*,
 * SAFARI) claims: the configs check those first. BROWSERS, a comma-separated
 * list such as `webkit` or `msedge,firefox`, wins over CI; with CI set, the
 * three current engines run; locally, Chromium runs. Names run in list order,
 * each once. The `remote-*` names run the pinned engines in the Playwright
 * server at PLAYWRIGHT_SERVER, and reach this machine only at `expose`, the
 * `host:port`s of the web servers under test.
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} expose
 * @returns {Browser[]}
 */
export function engines(env = localEnv(), expose = []) {
  const table = known(env, expose);
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

    if (name.startsWith('remote-') && !browser.options) {
      throw new Error(
        `BROWSERS=${list}: "${name}" needs a Playwright server: run \`node tools/playwright-server/server.mjs\` or set PLAYWRIGHT_SERVER`,
      );
    }

    return { name, ...browser };
  });
}

/**
 * The `browser.api` of a Vitest browser config: 127.0.0.1 and a port the OS
 * hands out there now. Vitest's default port can be shared on Windows or sit
 * in a Hyper-V excluded range, and Vitest replaces `port: 0` with its default
 * (upstream bugs O8 to O11). With a `remote-*` name selected, `strictPort`
 * too: a port lost to a race between the pick and Vite's bind is then an
 * error, not a silent move to a port outside the `exposeNetwork` rule; a
 * local browser does not care which port Vite binds.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<{ host: string, port: number, strictPort?: true }>}
 */
export async function vitestBrowserApi(env = localEnv()) {
  const host = '127.0.0.1';
  const server = net.createServer().listen(0, host);

  await once(server, 'listening');
  const address = server.address();
  server.close();
  await once(server, 'close');

  if (typeof address !== 'object' || address === null) {
    throw new Error(`No TCP address for a free port on ${host}`);
  }

  const remote = engines(env).some(({ options }) => options?.connectOptions);

  return { host, port: address.port, ...(remote ? { strictPort: true } : {}) };
}

/**
 * `engines()` as the instances of a Vitest browser project. A browser with
 * options gets its own provider, made by the `provider` passed in
 * (`playwright` from `@vitest/browser-playwright`), so this file imports no
 * Vitest code. `api` is the project's `browser.api`, the one address the
 * remote engines may reach.
 *
 * @template P
 * @param {(options: Options) => P} provider
 * @param {{ host: string, port: number }} api
 * @param {NodeJS.ProcessEnv} env
 */
export function vitestInstances(provider, api, env = localEnv()) {
  return engines(env, [`${api.host}:${String(api.port)}`]).map(
    ({ name, engine, options }) =>
      options
        ? { browser: engine, name, provider: provider(options) }
        : { browser: engine },
  );
}
