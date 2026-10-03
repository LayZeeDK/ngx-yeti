import { type Page } from '@playwright/test';
import { expect, isProduction, test } from './support/fixtures';
import { watchHydration } from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';

const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const hydration = watchHydration(page);

      await page.goto(`${prefix}highlight`);

      await expect(page.getByText('Highlighted text')).toBeVisible();
      await hydration.expectClean();
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves server HTML that Yeti styles', async ({ page }) => {
        await page.goto(`${prefix}highlight`);

        await expect(page.getByText('Highlighted text')).toHaveCSS(
          'background-color',
          'rgb(255, 255, 0)',
        );

        const { fontFamily, yetiFontSans } = await page
          .locator('html')
          .evaluate((html) => {
            const style = getComputedStyle(html);

            return {
              fontFamily: style.fontFamily,
              yetiFontSans: style.getPropertyValue('--yeti-font-sans').trim(),
            };
          });

        expect(yetiFontSans, 'Yeti defines --yeti-font-sans').not.toBe('');
        expect(fontFamily, "the root font is Yeti's --yeti-font-sans").toBe(
          yetiFontSans,
        );
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}highlight`);

        expect(await axeViolations()).toEqual([]);
      });
    });

    test('replays a click made before hydration', async ({ page }) => {
      const release = await holdBackMainBundle(page);
      const button = page.getByRole('button');

      await page.goto(`${prefix}replay`, { waitUntil: 'commit' });
      await button.click();

      await expect(
        button,
        'the click is not handled before hydration',
      ).toHaveText('Clicked 0 times');

      release();

      await expect(button, 'the click is replayed after hydration').toHaveText(
        'Clicked 1 times',
      );
    });
  });
}

test.describe('the axe fixture', () => {
  async function violationsWithImageMissingAlt(
    page: Page,
    axeViolations: () => Promise<string[]>,
  ): Promise<string[]> {
    await page.goto('highlight');
    await page.locator('main').evaluate((main) => {
      main.append(document.createElement('img'));
    });

    return axeViolations();
  }

  test('reports a violation with JavaScript on', async ({
    axeViolations,
    page,
  }) => {
    expect(
      await violationsWithImageMissingAlt(page, axeViolations),
    ).toContainEqual(expect.stringMatching(/^image-alt: /));
  });

  test.describe('with JavaScript off', () => {
    test.use({ javaScriptEnabled: false });

    test('reports a violation', async ({ axeViolations, page }) => {
      expect(
        await violationsWithImageMissingAlt(page, axeViolations),
      ).toContainEqual(expect.stringMatching(/^image-alt: /));
    });
  });
});
