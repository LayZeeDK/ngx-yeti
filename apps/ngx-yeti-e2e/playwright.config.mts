import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { browserProjects } from '../../tools/playwright/browser-projects.mjs';

const storybookURL = 'http://localhost:4401';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL: `${storybookURL}/`,
    trace: 'on-first-retry',
  },
  // The plain `nx run` form lets @nx/playwright infer the static-storybook
  // dependency, which builds Storybook first.
  webServer: {
    command: 'npx nx run ngx-yeti:static-storybook',
    url: storybookURL,
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: browserProjects(),
});
