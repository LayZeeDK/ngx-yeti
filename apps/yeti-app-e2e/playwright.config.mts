import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { browserProjects } from '../../tools/playwright/browser-projects.mjs';

// Run Nx through this Node and the installed nx entry, not `npx nx`. Every
// npx and Nx layer prepends node_modules/.bin dirs to PATH; in a deep
// worktree the nested tasks' PATH passes cmd.exe's 8191-character limit and
// `node` or `nx` stops resolving. Dropping the npx layer keeps it under.
const nx = `"${process.execPath}" "${fileURLToPath(import.meta.resolve('nx'))}"`;

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
  webServer: [
    {
      command: `${nx} run yeti-app:serve-ssr:${configuration}`,
      url: `${baseURL}highlight`,
      // `env` also keeps @nx/playwright from inferring a dependency on
      // serve-ssr, which would drop the configuration.
      env: { PORT: String(port) },
      reuseExistingServer: !process.env['CI'],
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
            reuseExistingServer: !process.env['CI'],
            timeout: 300_000,
            cwd: workspaceRoot,
          },
        ]
      : []),
  ],
  projects: browserProjects(),
});
