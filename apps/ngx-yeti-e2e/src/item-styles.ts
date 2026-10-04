import { expect, type Page } from '@playwright/test';

/**
 * Upstream bug O2: read geometry only once the item files of `items` have
 * loaded and applied. Expects one link per item in `<head>`, then waits until
 * each has a stylesheet.
 */
export async function expectItemSheetsApplied(
  page: Page,
  items: readonly string[],
): Promise<void> {
  for (const item of items) {
    await expect(
      page.locator(`head link[data-ngx-yeti-styles="${item}"]`),
    ).toHaveCount(1);
  }

  await expect
    .poll(() =>
      page.evaluate(
        (names) =>
          [...document.styleSheets].filter(
            ({ ownerNode }) =>
              ownerNode instanceof HTMLLinkElement &&
              names.includes(ownerNode.dataset['ngxYetiStyles'] ?? ''),
          ).length,
        items,
      ),
    )
    .toBe(items.length);
}
