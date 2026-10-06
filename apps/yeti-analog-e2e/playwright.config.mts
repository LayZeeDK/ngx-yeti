import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import {
  browserProjects,
  nx,
} from '../../tools/playwright/browser-projects.mjs';

const baseURL = 'http://localhost:4300';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  // In CI a test that passes only on a retry fails the run, so a timing
  // regression no longer passes as flaky.
  failOnFlakyTests: Boolean(process.env['CI']),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    // Keep the trace of the attempt that failed. A trace recorded only on
    // the retry shows a passing run when the test is flaky.
    trace: 'retain-on-first-failure',
  },
  // Never reuse a server: one left on this port by another checkout or an
  // interrupted run serves another build, and Nx would cache its pass.
  webServer: {
    // @nx/playwright infers no `yeti-analog:serve` dependency from this form, so
    // `e2e` runs without parallelism and the web server starts the app itself.
    command: `${nx} run yeti-analog:serve`,
    url: baseURL,
    reuseExistingServer: false,
    cwd: workspaceRoot,
    // Vite's CLI flushes Node's compile cache synchronously 10 s after it
    // starts, which held the first test's `page.goto` for up to 58 s on fresh
    // Windows runners (upstream bug O12).
    env: { NODE_DISABLE_COMPILE_CACHE: '1' },
  },
  projects: browserProjects(),
});
