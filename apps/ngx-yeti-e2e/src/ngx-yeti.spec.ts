import { expect } from '@playwright/test';
import { expectNoAxeViolations } from './axe';
import { test } from './gallery';

test.describe('NgxYeti stories', () => {
  test('mount renders the story', async ({ mount }) => {
    const root = await mount('src-lib-ngx-yeti--heading');

    await expect(root.getByText('ngx-yeti works!')).toBeVisible();
  });

  test('mount fails on an unknown story id', async ({ mount }) => {
    await expect(mount('src-lib-ngx-yeti--missing')).rejects.toThrow(
      "mount('src-lib-ngx-yeti--missing'): the Storybook build has no story with this id.",
    );
  });

  test('has no axe violations in the dark colour scheme', async ({
    mount,
    page,
  }) => {
    await mount('src-lib-ngx-yeti--primary');
    const html = page.locator('html');
    const lightBackground = await html.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(html).not.toHaveCSS('background-color', lightBackground);
    await expectNoAxeViolations(page);
  });
});
