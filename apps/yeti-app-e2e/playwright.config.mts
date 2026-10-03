import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

/**
 * The tests run against the built Node server of the Fixture app, never the
 * dev server. FIXTURE_CONFIGURATION picks the build: `development` (the
 * default, for Angular's development-mode hydration messages) or
 * `production`. Each configuration gets its own port so a reused server is
 * never one of the other build.
 */
const configuration =
  process.env['FIXTURE_CONFIGURATION'] === 'production'
    ? 'production'
    : 'development';
const port = configuration === 'production' ? 4301 : 4300;
const baseURL = `http://localhost:${String(port)}/sub/`;

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
    // `/sub/` itself has no route, so readiness waits on a fixture.
    url: `${baseURL}highlight`,
    // `env` also keeps @nx/playwright from inferring a dependency on
    // serve-ssr, which would drop the configuration.
    env: { PORT: String(port) },
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
    cwd: workspaceRoot,
  },
  projects: process.env['CI']
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
