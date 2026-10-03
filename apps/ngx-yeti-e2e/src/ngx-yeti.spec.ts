import { expect } from '@playwright/test';
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
});
