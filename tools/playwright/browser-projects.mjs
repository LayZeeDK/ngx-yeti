import { fileURLToPath } from 'node:url';
import { devices } from '@playwright/test';

/**
 * The command the e2e web servers start Nx with: this Node and the installed
 * nx entry, not `npx nx`. Every npx and Nx layer prepends node_modules/.bin
 * dirs to PATH; in a deep worktree the nested tasks' PATH passes cmd.exe's
 * 8191-character limit and `node` or `nx` stops resolving. Dropping the npx
 * layer keeps it under.
 */
export const nx = `"${process.execPath}" "${fileURLToPath(import.meta.resolve('nx'))}"`;

/**
 * The Playwright projects of every e2e project. A floor job of floor.yml
 * sets one FLOOR_* variable and runs that engine only; with CI set, the
 * three current engines run; locally, Chromium runs.
 */
export function browserProjects() {
  const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];
  const chromium = {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      ...(chromiumFloor && {
        launchOptions: { executablePath: chromiumFloor },
      }),
    },
  };
  const firefox = { name: 'firefox', use: { ...devices['Desktop Firefox'] } };
  const webkit = { name: 'webkit', use: { ...devices['Desktop Safari'] } };

  if (process.env['FLOOR_WEBKIT'] === 'true') {
    return [webkit];
  }

  if (process.env['FLOOR_FIREFOX_E2E'] === 'true') {
    return [firefox];
  }

  return process.env['CI'] && !chromiumFloor
    ? [chromium, firefox, webkit]
    : [chromium];
}
