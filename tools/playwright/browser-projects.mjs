import { fileURLToPath } from 'node:url';
import { devices } from '@playwright/test';
import { engines, localEnv } from './engines.mjs';

/**
 * The command the e2e web servers start Nx with: this Node and the installed
 * nx entry, not `npx nx`. Every npx and Nx layer prepends node_modules/.bin
 * dirs to PATH; in a deep worktree the nested tasks' PATH passes cmd.exe's
 * 8191-character limit and `node` or `nx` stops resolving. Dropping the npx
 * layer keeps it under.
 */
export const nx = `"${process.execPath}" "${fileURLToPath(import.meta.resolve('nx'))}"`;

const device = {
  chromium: 'Desktop Chrome',
  firefox: 'Desktop Firefox',
  webkit: 'Desktop Safari',
};

/** @param {import('./engines.mjs').Browser} browser */
function project({ name, engine, options }) {
  return {
    name,
    use: { ...devices[device[engine]], ...options },
  };
}

/** @param {string} url */
export function hostPort(url) {
  const { hostname, port, protocol } = new URL(url);

  return `${hostname}:${port || (protocol === 'https:' ? '443' : '80')}`;
}

/**
 * The Playwright projects of every e2e project. A floor job of floor.yml
 * sets one FLOOR_* variable and runs that engine only; otherwise
 * `engines()` picks them. `webServerUrls` are the config's web server URLs,
 * the only addresses on this machine the remote engines may reach.
 *
 * @param {string[]} webServerUrls
 * @param {NodeJS.ProcessEnv} env
 */
export function browserProjects(webServerUrls, env = localEnv()) {
  const chromiumFloor = env['FLOOR_CHROMIUM_PATH'];

  if (env['FLOOR_WEBKIT'] === 'true') {
    return [project({ name: 'webkit', engine: 'webkit' })];
  }

  if (env['FLOOR_FIREFOX_E2E'] === 'true') {
    return [project({ name: 'firefox', engine: 'firefox' })];
  }

  if (chromiumFloor) {
    return [
      project({
        name: 'chromium',
        engine: 'chromium',
        options: { launchOptions: { executablePath: chromiumFloor } },
      }),
    ];
  }

  return engines(env, webServerUrls.map(hostPort)).map((browser) =>
    project(browser),
  );
}
