import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const storybookURL = 'http://localhost:4401';

const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];

const chromium = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    ...(chromiumFloor && { launchOptions: { executablePath: chromiumFloor } }),
  },
};
const firefox = { name: 'firefox', use: { ...devices['Desktop Firefox'] } };
const webkit = { name: 'webkit', use: { ...devices['Desktop Safari'] } };

function projects(): (typeof chromium | typeof firefox | typeof webkit)[] {
  if (process.env['FLOOR_WEBKIT']) {
    return [webkit];
  }

  if (process.env['FLOOR_FIREFOX_E2E']) {
    return [firefox];
  }

  return process.env['CI'] && !chromiumFloor
    ? [chromium, firefox, webkit]
    : [chromium];
}

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL: `${storybookURL}/`,
    trace: 'on-first-retry',
  },
  // The plain `nx run` form lets @nx/playwright infer the static-storybook
  // dependency, which builds Storybook first.
  webServer: {
    command: 'npx nx run ngx-yeti:static-storybook',
    url: storybookURL,
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: projects(),
});
