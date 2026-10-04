import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';
import { openStory } from './open-story';

test.describe('openStory', () => {
  test('renders the story', async ({ page }) => {
    const root = await openStory(page, 'card--default');

    await expect(
      root.getByRole('link', { name: 'Weekend in the hills' }),
    ).toBeVisible();
  });

  test('fails on an unknown story id', async ({ page }) => {
    await expect(openStory(page, 'card--missing')).rejects.toThrow(
      "openStory('card--missing'): the Storybook build has no story with this id.",
    );
  });

  test('opens a story that has no axe violations in the dark colour scheme', async ({
    page,
  }) => {
    await openStory(page, 'card--default');
    const html = page.locator('html');
    const lightBackground = await html.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(html).not.toHaveCSS('background-color', lightBackground);
    await expectNoAxeViolations(page);
  });
});
