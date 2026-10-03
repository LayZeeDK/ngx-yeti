import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const configuration =
  process.env['FIXTURE_CONFIGURATION'] === 'production'
    ? 'production'
    : 'development';
const port = configuration === 'production' ? 4311 : 4310;
const baseURL = `http://localhost:${String(port)}/sub/`;

const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];

const chromium = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    ...(chromiumFloor && { launchOptions: { executablePath: chromiumFloor } }),
  },
};

/**
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx nx run yeti-app:serve-ssr:${configuration}`,
    url: `${baseURL}highlight`,
    // `env` also keeps @nx/playwright from inferring a dependency on
    // serve-ssr, which would drop the configuration.
    env: { PORT: String(port) },
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
    cwd: workspaceRoot,
  },
  projects: process.env['FLOOR_WEBKIT']
    ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]
    : process.env['CI'] && !chromiumFloor
      ? [
          chromium,
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : [chromium],
});
