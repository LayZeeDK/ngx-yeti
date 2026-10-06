import {
  test,
  type Page,
  type PlaywrightWorkerOptions,
} from '@playwright/test';

/**
 * Skips the test unless Tab reaches links in this browser. WebKit's
 * `TabsToLinks` preference is on by default only in its GTK and WPE ports, so
 * only Linux WebKit tabs to links. The check reads the browser's platform, not
 * this process's: a remote WebKit is Linux while the runner may be Windows.
 */
export async function skipUnlessTabReachesLinks(
  page: Page,
  browserName: PlaywrightWorkerOptions['browserName'],
): Promise<void> {
  if (browserName !== 'webkit') {
    return;
  }

  const platform = await page.evaluate(() => navigator.platform);

  test.skip(
    !platform.startsWith('Linux'),
    'WebKit moves focus on Tab to form controls only, not links, outside Linux',
  );
}
