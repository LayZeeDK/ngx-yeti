import { test as base, type Page } from '@playwright/test';

export { expect } from '@playwright/test';

export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

export const noScriptPages = new WeakSet<Page>();

export const test = base.extend<{ noScriptPage: Page }>({
  noScriptPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      ...(baseURL === undefined ? {} : { baseURL }),
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    noScriptPages.add(page);
    await use(page);
    await context.close();
  },
});
