import { expect, type Page } from '@playwright/test';

/**
 * Upstream bug O2: read geometry only once the item files of `items` have
 * loaded and applied. Expects one link per item in `<head>`, then waits until
 * each has a stylesheet with rules: a failed load leaves an empty sheet in
 * `document.styleSheets` (review finding G4-02).
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
    .poll(
      () =>
        page.evaluate(
          (names) =>
            [...document.styleSheets].filter((sheet) => {
              const { ownerNode } = sheet;

              if (
                !(ownerNode instanceof HTMLLinkElement) ||
                !names.includes(ownerNode.dataset['ngxYetiStyles'] ?? '')
              ) {
                return false;
              }

              try {
                return sheet.cssRules.length > 0;
              } catch {
                // An aborted load leaves a sheet whose rules throw.
                return false;
              }
            }).length,
          items,
        ),
      { message: 'item sheets loaded with rules' },
    )
    .toBe(items.length);
}
