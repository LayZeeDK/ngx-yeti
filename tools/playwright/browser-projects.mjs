import { fileURLToPath } from 'node:url';
import { devices } from '@playwright/test';
import { engines } from './engines.mjs';

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
function project({ name, engine, launchOptions }) {
  return {
    name,
    use: {
      ...devices[device[engine]],
      ...(launchOptions && { launchOptions }),
    },
  };
}

/**
 * The Playwright projects of every e2e project. A floor job of floor.yml
 * sets one FLOOR_* variable and runs that engine only; otherwise
 * `engines()` picks them.
 */
export function browserProjects() {
  const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];

  if (process.env['FLOOR_WEBKIT'] === 'true') {
    return [project({ name: 'webkit', engine: 'webkit' })];
  }

  if (process.env['FLOOR_FIREFOX_E2E'] === 'true') {
    return [project({ name: 'firefox', engine: 'firefox' })];
  }

  if (chromiumFloor) {
    return [
      project({
        name: 'chromium',
        engine: 'chromium',
        launchOptions: { executablePath: chromiumFloor },
      }),
    ];
  }

  return engines().map((browser) => project(browser));
}
