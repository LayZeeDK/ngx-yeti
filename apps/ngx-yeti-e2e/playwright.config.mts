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

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL: `${storybookURL}/iframe.html?embed=true`,
    trace: 'on-first-retry',
  },
  // The plain `nx run` form lets @nx/playwright infer the static-storybook
  // dependency, which builds Storybook first.
  webServer: {
    command: 'npx nx run ngx-yeti:static-storybook',
    url: storybookURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects:
    process.env['CI'] && !chromiumFloor
      ? [
          chromium,
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : [chromium],
});
