import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import {
  vitestBrowserApi,
  vitestInstances,
} from '../../tools/playwright/engines.mjs';

// More info at: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reportsDirectory: path.join(
        import.meta.dirname,
        '../../coverage/packages/ngx-yeti',
      ),
    },
    projects: [
      {
        extends: true,
        plugins: [
          storybookAngularVitest(),
          storybookTest({
            configDir: path.join(import.meta.dirname, '.storybook'),
            storybookUrl: 'http://localhost:4400',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            api: await vitestBrowserApi(),
            headless: true,
            provider: playwright(),
            instances: vitestInstances(playwright),
          },
        },
      },
    ],
  },
});
