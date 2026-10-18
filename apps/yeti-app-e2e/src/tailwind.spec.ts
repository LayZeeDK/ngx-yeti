import {
  expectItemSheetsApplied,
  rect,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, routeKinds, test } from './support/fixtures';

/** Form C1 of the setup spec keeps Tailwind's preflight; form C2 leaves it out. */
const hasPreflight = process.env['FIXTURE_CONFIGURATION'] === 'tailwind-c1';

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} setup route beside Tailwind`, () => {
    test("lets a utility win over Yeti's rule", async ({ page }) => {
      await page.goto(`${prefix}setup`);
      await expectItemSheetsApplied(page, ['card', 'lift']);

      const card = page.locator('#shared-host');
      const utility = `${String(await usedLength(card, 'calc(var(--spacing) * 8)'))}px`;

      expect(utility, "Tailwind's theme sets --spacing").not.toBe('0px');
      await expect(card, 'card.css pads the card').not.toHaveCSS(
        'padding-top',
        '0px',
      );
      await expect(card).not.toHaveCSS('padding-top', utility);

      await card.evaluate((element) => {
        element.classList.add('p-8');
      });

      await expect(card).toHaveCSS('padding-top', utility);
    });

    test('keeps Yeti above preflight', async ({ page }) => {
      await page.goto(`${prefix}setup`);

      const heading = page.getByRole('heading', { name: 'Setup', exact: true });

      // Preflight draws every border solid, at no width; Yeti sets no style.
      await expect(heading).toHaveCSS(
        'border-top-style',
        hasPreflight ? 'solid' : 'none',
      );
      // Preflight makes a heading inherit its size; Yeti's type scale wins.
      expect(await usedLength(heading, '1em')).toBeGreaterThan(
        await usedLength(page.locator('main'), '1em'),
      );
    });

    test("lets the package's layer win over Yeti's fluid scale", async ({
      page,
    }) => {
      await page.goto(`${prefix}setup`);

      const body = page.locator('body');
      /**
       * The body's font size with the viewport length of the package's
       * `--_yeti-t` set to `viewport`. Yeti's own `--_yeti-t` reads `100vw`,
       * so the size follows `viewport` only while the package's rule wins.
       */
      const fontSizeAt = async (viewport: string): Promise<number> => {
        await page.locator(':root').evaluate((root, value) => {
          if (!(root instanceof HTMLElement)) {
            throw new TypeError('the root is not an HTMLElement');
          }

          root.style.setProperty('--_ngx-yeti-viewport', value);
        }, viewport);

        return usedLength(body, '1em');
      };

      const narrow = await fontSizeAt('var(--yeti-viewport-min)');
      const wide = await fontSizeAt('var(--yeti-viewport-max)');

      expect(narrow).toBeCloseTo(
        await usedLength(body, 'var(--yeti-base-min)'),
        1,
      );
      expect(wide).toBeCloseTo(
        await usedLength(body, 'var(--yeti-base-max)'),
        1,
      );
      expect(wide).toBeGreaterThan(narrow);
    });
  });

  test.describe(`the ${kind} container route beside Tailwind`, () => {
    test.use({ viewport: { width: 1100, height: 800 } });

    test('leaves a Yeti container wider than 1024 px', async ({ page }) => {
      await page.goto(`${prefix}container`);
      await expectItemSheetsApplied(page, ['container']);

      const container = page.locator(
        '#wide-container[data-ngx-yeti-item-container]',
      );

      await expect(container).toHaveClass(/(^|\s)container(\s|$)/);
      expect((await rect(container)).width).toBeGreaterThan(1024);
    });
  });
}
