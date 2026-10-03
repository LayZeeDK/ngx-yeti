import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// The port of the ngx-yeti static-storybook target.
const storybookURL = 'http://localhost:4401';

// The floor job (docs/specs/issues/93-decide-testing-at-the-browser-floor.md)
// runs Chromium only, on Chrome for Testing 141 at this path.
const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];

const chromium = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    ...(chromiumFloor && { launchOptions: { executablePath: chromiumFloor } }),
  },
};

/**
 * Test layer 4 over the static Storybook build of ngx-yeti
 * (docs/specs/adr/0014-testing-stack-for-yeti.md, point 4).
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`; see apps/yeti-app-e2e/playwright.config.mts.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    // The gallery page of src/gallery.ts.
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
  // Windows on ARM runs the browsers under x64 emulation, so local runs use
  // Chromium only and CI runs all three engines.
  projects:
    process.env['CI'] && !chromiumFloor
      ? [
          chromium,
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : [chromium],
});
