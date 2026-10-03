import { test as base } from '@playwright/test';
import { axeViolations } from './axe';

export { expect } from '@playwright/test';

export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

export const test = base.extend<{ axeViolations: () => Promise<string[]> }>({
  axeViolations: async (
    { browserName, javaScriptEnabled, page },
    use,
    testInfo,
  ) => {
    testInfo.skip(
      !javaScriptEnabled && browserName === 'firefox',
      'Firefox runs no microtask on a JavaScript-disabled page, so axe cannot run there',
    );

    await use(() => axeViolations(page, javaScriptEnabled));
  },
});
