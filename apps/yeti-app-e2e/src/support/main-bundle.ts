import { type Page } from '@playwright/test';

/** `main.js` in development builds, `main-<hash>.js` in production builds. */
const mainBundle = /\/main(-[0-9A-Z]+)?\.js$/;

/**
 * Holds back the app's main script so the page shows server HTML that has
 * not hydrated. Navigate with `waitUntil: 'commit'`, because a held module
 * script also holds back `DOMContentLoaded`. Call the returned function to
 * let the script load.
 */
export async function holdBackMainBundle(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(mainBundle, async (route) => {
    await released;
    await route.continue();
  });

  return () => {
    release();
  };
}
