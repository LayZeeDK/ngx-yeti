import { expectItemSheetsApplied, rect } from '@ngx-yeti/testing/playwright';
import { expect, test } from '@playwright/test';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

test.describe('visually-hidden--read-more', () => {
  test('names each link with its visible and hidden words, in a box of at most 1.5 px', async ({
    page,
  }) => {
    const root = await openStory(page, 'visually-hidden--read-more');

    await expectItemSheetsApplied(page, ['visually-hidden']);

    for (const name of [
      'Read more about the trail map',
      'Read more about the field guide',
    ]) {
      const link = root.getByRole('link', { name, exact: true });
      const span = link.locator('[data-ngx-yeti-item-visually-hidden]');

      await expect(link).toBeVisible();
      await expect(span).toHaveCSS('position', 'absolute');

      const { width, height } = await rect(span);

      expect(width).toBeLessThanOrEqual(1.5);
      expect(height).toBeLessThanOrEqual(1.5);
    }
  });
});

test.describe('visually-hidden--carousel-dots', () => {
  test('takes each dot in turn on Tab and shows the focus ring on the link', async ({
    browserName,
    page,
  }) => {
    const root = await openStory(page, 'visually-hidden--carousel-dots');

    await skipUnlessTabReachesLinks(page, browserName);
    await expectItemSheetsApplied(page, ['visually-hidden']);

    for (const slide of [1, 2, 3]) {
      const dot = root.getByRole('link', {
        name: `Slide ${String(slide)}`,
        exact: true,
      });

      await page.keyboard.press('Tab');

      await expect(dot).toBeFocused();
      await expect(dot).not.toHaveCSS('outline-style', 'none');
      await expect(
        dot.locator('[data-ngx-yeti-item-visually-hidden]'),
      ).toHaveCSS('outline-style', 'none');
    }
  });
});
