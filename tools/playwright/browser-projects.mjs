import { devices } from '@playwright/test';

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
