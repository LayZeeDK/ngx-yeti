import { type Locator, type Page } from '@playwright/test';

const mainBundle = /\/main(-[0-9A-Z]+)?\.js$/;

/**
 * Navigate with `waitUntil: 'commit'`, because a held module script also
 * holds back `DOMContentLoaded`.
 */
export async function holdBackMainBundle(page: Page): Promise<() => void> {
  const { promise: released, resolve } = Promise.withResolvers();

  await page.route(mainBundle, async (route) => {
    await released;
    await route.continue();
  });

  return () => {
    resolve(undefined);
  };
}

/**
 * Clicks while the main bundle is held. With the bundle held, WebKit sometimes
 * paints no frame at all (when the card style preload lands after parsing
 * ends), so a plain click's wait for two stable animation frames never ends.
 * In WebKit the click is forced, which is still a real pointer event before
 * hydration; the other engines keep Playwright's actionability checks.
 */
export async function clickWhileHeld(
  locator: Locator,
  browserName: string,
): Promise<void> {
  await locator.click({ force: browserName === 'webkit' });
}
