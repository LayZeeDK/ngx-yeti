import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';
import { openStory } from './open-story';

test.describe('NgxYeti stories', () => {
  test('openStory renders the story', async ({ page }) => {
    const root = await openStory(page, 'src-lib-ngx-yeti--heading');

    await expect(root.getByText('ngx-yeti works!')).toBeVisible();
  });

  test('openStory fails on an unknown story id', async ({ page }) => {
    await expect(openStory(page, 'src-lib-ngx-yeti--missing')).rejects.toThrow(
      "openStory('src-lib-ngx-yeti--missing'): the Storybook build has no story with this id.",
    );
  });

  test('has no axe violations in the dark colour scheme', async ({ page }) => {
    await openStory(page, 'src-lib-ngx-yeti--primary');
    const html = page.locator('html');
    const lightBackground = await html.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(html).not.toHaveCSS('background-color', lightBackground);
    await expectNoAxeViolations(page);
  });
});
