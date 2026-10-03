import { test as base, type Page } from '@playwright/test';

export { expect } from '@playwright/test';

/** Whether the tests run against the production build of the Fixture app. */
export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

/** Pages created by the `noScriptPage` fixture. */
export const noScriptPages = new WeakSet<Page>();

export const test = base.extend<{ noScriptPage: Page }>({
  /** A page in its own context with JavaScript disabled. */
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
