import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import {
  browserProjects,
  nx,
} from '../../tools/playwright/browser-projects.mjs';

const configuration =
  process.env['FIXTURE_CONFIGURATION'] === 'production'
    ? 'production'
    : 'development';
const port = configuration === 'production' ? 4311 : 4310;
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
  // Never reuse a server: a server left on these ports by another checkout or
  // an interrupted run serves another build, and Nx would cache its pass.
  webServer: [
    {
      command: `${nx} run yeti-app:serve-ssr:${configuration}`,
      url: `${baseURL}card`,
      // `env` also keeps @nx/playwright from inferring a dependency on
      // serve-ssr, which would drop the configuration.
      env: { PORT: String(port) },
      reuseExistingServer: false,
      timeout: 300_000,
      cwd: workspaceRoot,
    },
    // The development server (`nx serve`) for setup-serving.spec.ts, which
    // opens it by this absolute URL. The production run skips that test.
    ...(configuration === 'development'
      ? [
          {
            command: `${nx} run yeti-app:serve:development --port=4312`,
            url: 'http://localhost:4312/sub/setup',
            reuseExistingServer: false,
            timeout: 300_000,
            cwd: workspaceRoot,
          },
        ]
      : []),
  ],
  projects: browserProjects(),
});
