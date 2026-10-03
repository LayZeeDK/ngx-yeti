import { type Page } from '@playwright/test';

const mainBundle = /\/main(-[0-9A-Z]+)?\.js$/;

/**
 * Navigate with `waitUntil: 'commit'`, because a held module script also
 * holds back `DOMContentLoaded`.
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
