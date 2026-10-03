import { type Page } from '@playwright/test';
import { axeRunsWithoutJavaScript, axeViolations } from './support/axe';
import { expect, isProduction, test } from './support/fixtures';
import { watchHydration } from './support/hydration';
import { holdBackMainBundle } from './support/main-bundle';

const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

const noAxeWithoutJavaScript =
  'Firefox runs no microtask on a JavaScript-disabled page, so axe cannot run there';

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

    test('serves server HTML that Yeti styles with JavaScript off', async ({
      noScriptPage,
    }) => {
      await noScriptPage.goto(`${prefix}highlight`);

      await expect(noScriptPage.getByText('Highlighted text')).toHaveCSS(
        'background-color',
        'rgb(255, 255, 0)',
      );

      const { fontFamily, yetiFontSans } = await noScriptPage
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

    test('serves server HTML that axe passes with JavaScript off', async ({
      browserName,
      noScriptPage,
    }) => {
      test.skip(!axeRunsWithoutJavaScript(browserName), noAxeWithoutJavaScript);

      await noScriptPage.goto(`${prefix}highlight`);

      expect(await axeViolations(noScriptPage)).toEqual([]);
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

test.describe('the axe helper', () => {
  async function violationsWithImageMissingAlt(page: Page): Promise<string[]> {
    await page.goto('highlight');
    await page.locator('main').evaluate((main) => {
      main.append(document.createElement('img'));
    });

    return axeViolations(page);
  }

  test('reports a violation with JavaScript on', async ({ page }) => {
    expect(await violationsWithImageMissingAlt(page)).toContainEqual(
      expect.stringMatching(/^image-alt: /),
    );
  });

  test('reports a violation with JavaScript off', async ({
    browserName,
    noScriptPage,
  }) => {
    test.skip(!axeRunsWithoutJavaScript(browserName), noAxeWithoutJavaScript);

    expect(await violationsWithImageMissingAlt(noScriptPage)).toContainEqual(
      expect.stringMatching(/^image-alt: /),
    );
  });
});
