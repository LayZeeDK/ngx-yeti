import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';
import { nx } from '../../tools/playwright/browser-projects.mjs';
import { engines, localEnv } from '../../tools/playwright/engines.mjs';
import { laneName, storybookURL } from './src/support/screen-reader';

// Not named playwright.config.*: @nx/playwright/plugin would infer an e2e
// target from it, and run-many -t e2e would start a screen reader.
const lane = laneName();
const platform = { nvda: 'win32', voiceover: 'darwin' }[lane];

if (process.platform !== platform) {
  throw new Error(
    `The ${lane} lane runs only on ${platform === 'win32' ? 'Windows' : 'macOS'}, not ${process.platform}.`,
  );
}

const device = {
  chromium: 'Desktop Chrome',
  firefox: 'Desktop Firefox',
  webkit: 'Desktop Safari',
} as const;

// NVDA reads Chromium's and Gecko's trees: Playwright's Chromium and Firefox,
// or the browsers BROWSERS names. VoiceOver reads WebKit's in real Safari,
// which the lane opens itself.
const browsers = process.env['BROWSERS'];
const projects =
  lane === 'nvda'
    ? engines({
        ...localEnv(),
        BROWSERS:
          browsers === undefined || browsers === ''
            ? 'chromium,firefox'
            : browsers,
      }).map(({ name, engine, options }) => ({
        name,
        use: { ...devices[device[engine]], ...options },
      }))
    : [{ name: 'safari' }];

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.screen-reader.ts',
  outputDir: `${workspaceRoot}/dist/.playwright/apps/screen-reader-e2e/test-output`,
  // One screen reader per machine: one worker, one test at a time.
  workers: 1,
  fullyParallel: false,
  // The retry budget of both lanes: a check that fails three times fails the
  // job. A retried pass still passes, and the report keeps every attempt's
  // phrases.
  retries: 2,
  timeout: 5 * 60_000,
  forbidOnly: Boolean(process.env['CI']),
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: `${workspaceRoot}/dist/.playwright/apps/screen-reader-e2e/playwright-report`,
        open: 'never',
      },
    ],
  ],
  use: {
    headless: false,
    trace: 'off',
  },
  webServer: {
    command: `${nx} run ngx-yeti:static-storybook`,
    url: storybookURL,
    reuseExistingServer: false,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects,
});
