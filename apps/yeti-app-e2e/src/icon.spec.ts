import {
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

async function fontSize(host: Locator): Promise<number> {
  return host.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
}

/** Expects the host's SVG to be one em of the host's computed `font-size`. */
async function expectOneEm(host: Locator): Promise<void> {
  const svg = await rect(host.locator('> svg'));
  const em = await fontSize(host);

  expect(svg.width).toBeCloseTo(em, 1);
  expect(svg.height).toBeCloseTo(em, 1);
}

/**
 * Expects the icons sized as in the Storybook half, each SVG one em square
 * and centred on its label by default, and returns by how many px the SVG of
 * the baseline icon misses Yeti's one-eighth-em nudge below the baseline.
 */
async function expectIconsLaidOut(page: Page): Promise<number> {
  const link = page.locator('#link-icon');
  const aligned = page.locator('#aligned-icon');

  await expectItemSheetsApplied(page, ['icon']);
  await expect(link).toHaveCSS('display', 'inline-flex');

  for (const id of ['#link-icon', '#warning-icon', '#aligned-icon']) {
    await expectOneEm(page.locator(id));
  }

  const svg = await rect(link.locator('> svg'));
  const label = await rect(link.locator('> span'));

  expect((svg.top + svg.bottom) / 2).toBeCloseTo(
    (label.top + label.bottom) / 2,
    0,
  );

  const nudged = await rect(aligned.locator('> svg'));
  const baseline = await rect(page.locator('#baseline-probe'));

  return Math.abs(
    nudged.bottom - baseline.bottom - 0.125 * (await fontSize(aligned)),
  );
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} icon route`, () => {
    describeStandardRouteCases({
      item: 'icon',
      prefix,
      liveHost: '#link-icon',
      leaveLink: 'Leave for a page without icons',
      styled: { property: 'display', value: 'inline-flex' },
    });

    test('paints no frame with align on the icon written with a static align', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#aligned-icon', [
        'align',
      ]);
      const frames = await recordFrames(page, '#aligned-icon', 'display');

      await page.goto(`${prefix}icon`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();
      const aligned = page.locator('#aligned-icon');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the icon was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows align on the icon').toEqual([]);
      await expect(aligned).toHaveAttribute('data-align', 'baseline');
      await expect(aligned).not.toHaveAttribute('align');
    });

    test('keeps the hydrate-never icon sized, and the icon link, after every live icon leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}icon`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live icons' }).click();
      await expect(
        page.locator('#link-icon, #warning-icon, #aligned-icon'),
      ).toHaveCount(0);
      await nextFrames(page);

      const never = page.locator('#never-icon');

      await expect(never).toHaveAttribute('data-ngx-yeti-item-icon', '');
      expect(
        await itemLinks(page, 'icon'),
        'the hydrate never host keeps the icon link',
      ).toEqual(['icon']);
      await expectItemSheetsApplied(page, ['icon']);
      await expect(never).toHaveCSS('display', 'inline-flex');
      await expectOneEm(never);
    });

    // The server hosts keep the icon link in <head>, so the client-only icon
    // reuses it.
    test('renders a client-only icon with 0 unsized frames while the server hosts hold the icon link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-icon', 'display');

      await delayCss(page);
      await page.goto(`${prefix}icon`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only icon' })
        .click();

      const icon = page.locator('#client-icon');

      await expect(icon).toBeVisible();
      await expectItemSheetsApplied(page, ['icon']);
      await expect(icon).toHaveCSS('display', 'inline-flex');
      await expectOneEm(icon);

      // The file that makes the host an inline flex row is the one that
      // sizes its SVG.
      expectStyledFrames(await display(), {
        styled: (value) => value === 'inline-flex',
        label: `${browserName}, ${kind}, client-only icon`,
        ...productionFramesRecordedAs(),
      });
    });

    test('sizes and aligns the icons after hydration', async ({ page }) => {
      await page.goto(`${prefix}icon`);
      await waitForHydration(page);

      expect(
        await expectIconsLaidOut(page),
        'the baseline icon sits one eighth of an em below the baseline',
      ).toBeLessThan(1);
    });

    test('has no horizontal overflow at a 320 px viewport', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}icon`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['icon']);
      await expect(page.locator('#link-icon')).toHaveCSS(
        'display',
        'inline-flex',
      );

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test('passes axe with JavaScript on', async ({ axeViolations, page }) => {
      await page.goto(`${prefix}icon`);
      await waitForHydration(page);

      expect(await axeViolations()).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the icons with their attributes, their names, and the item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}icon`);

        const aligned = page.locator('#aligned-icon');

        await expect(page.locator('#link-icon')).toHaveClass('icon');
        await expect(page.locator('#link-icon')).not.toHaveAttribute(
          'data-align',
        );
        await expect(page.locator('#link-icon')).not.toHaveAttribute(
          'data-gap',
        );
        await expect(aligned).toHaveAttribute('data-align', 'baseline');
        await expect(aligned).not.toHaveAttribute('align');
        await expect(
          page.getByRole('link', { name: 'Open the replay page', exact: true }),
        ).toHaveAttribute('id', 'link-icon');
        await expect(
          page.getByRole('img', { name: 'Warning', exact: true }),
        ).toBeVisible();
        expect(await itemLinks(page, 'icon')).toEqual(['icon']);
      });

      test('sizes and aligns the icons', async ({ page }) => {
        await page.goto(`${prefix}icon`);

        expect(
          await expectIconsLaidOut(page),
          'the baseline icon sits one eighth of an em below the baseline',
        ).toBeLessThan(1);
        await expectOneEm(page.locator('#never-icon'));
      });

      test('follows the icon link', async ({ page }) => {
        await page.goto(`${prefix}icon`);
        await page.locator('#link-icon').click();

        await expect(page).toHaveURL(/\/replay$/);
      });
    });
  });
}
