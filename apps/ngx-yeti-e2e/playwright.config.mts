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
const storybookURL = 'http://localhost:4401';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
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
  projects: browserProjects(),
});
