import { test as base } from '@playwright/test';
import { axeViolations } from './axe';

export { expect } from '@playwright/test';

export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

/** The two render modes every fixture is served in (`app.routes.ts`). */
export const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

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
