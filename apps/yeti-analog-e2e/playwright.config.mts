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
  // In CI a test that passes only on a retry fails the run: the retry keeps
  // its trace, and a timing regression no longer passes as flaky.
  failOnFlakyTests: Boolean(process.env['CI']),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
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
  },
  projects: browserProjects(),
});
