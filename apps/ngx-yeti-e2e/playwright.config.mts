import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import {
  browserProjects,
  nx,
} from '../../tools/playwright/browser-projects.mjs';

const storybookURL = 'http://localhost:4401';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  // In CI a test that passes only on a retry fails the run: the retry keeps
  // its trace, and a timing regression no longer passes as flaky.
  failOnFlakyTests: Boolean(process.env['CI']),
  use: {
    baseURL: `${storybookURL}/`,
    trace: 'on-first-retry',
  },
  // Never reuse a server: static-storybook also serves on 4401 for people,
  // and a reused one may be a fastCompile build or one being rebuilt.
  webServer: {
    command: `${nx} run ngx-yeti:static-storybook`,
    url: storybookURL,
    reuseExistingServer: false,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: browserProjects([storybookURL]),
});
