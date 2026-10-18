// @ts-check
import { fileURLToPath } from 'node:url';
import { devices } from '@playwright/test';
import { chromiumFloor, engines, localEnv } from './engines.mjs';

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

/**
 * The Playwright worker count of a local container run, spread after the
 * preset. Only tools/ci-local/run-job.mjs sets E2E_LOCAL_WORKERS, so CI keeps
 * the preset's count, and a command-line `--workers` still wins.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ workers?: number }}
 */
export function localWorkers(env = process.env) {
  const value = env['E2E_LOCAL_WORKERS'];

  if (!value) {
    return {};
  }

  const workers = Number(value);

  if (!Number.isInteger(workers) || workers < 1) {
    throw new Error(
      `E2E_LOCAL_WORKERS must be a whole number from 1, not ${value}`,
    );
  }

  return { workers };
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
  const floor = chromiumFloor(env);

  if (env['FLOOR_WEBKIT'] === 'true') {
    return [project({ name: 'webkit', engine: 'webkit' })];
  }

  if (env['FLOOR_FIREFOX_E2E'] === 'true') {
    return [project({ name: 'firefox', engine: 'firefox' })];
  }

  if (floor) {
    return [project(floor)];
  }

  return engines(env, webServerUrls.map(hostPort)).map((browser) =>
    project(browser),
  );
}
