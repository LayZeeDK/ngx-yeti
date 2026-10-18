import { expectItemSheetsApplied, rect } from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
} from './support/style-probe';

/** The cover and center links, in document order; later items may add more. */
async function coverAndCenterLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'cover' || item === 'center',
  );
}

/** The inline size and position of a center, with its sheet applied. */
async function centerColumn(
  center: Locator,
): Promise<{ left: number; width: number }> {
  await expect(center).not.toHaveCSS('padding-left', '0px');

  const { left, width } = await rect(center);

  return { left, width };
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} cover route`, () => {
    describeStandardRouteCases({
      item: 'cover',
      prefix,
      liveHost: '#live-cover',
      leaveLink: 'Leave for a page without covers',
      styled: { property: 'flex-direction', value: 'column' },
    });

    test('keeps the hydrate-never cover that is a box styled, with both links, after every live cover and box leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live covers' })
        .click();
      await expect(
        page.locator(
          '[data-ngx-yeti-item-cover]:not(#never-cover), [data-ngx-yeti-item-box]:not(#never-cover)',
        ),
      ).toHaveCount(0);
      await nextFrames(page);

      const cover = page.locator('#never-cover');
      const links = await itemLinks(page);

      await expect(cover).toHaveAttribute('data-ngx-yeti-item-cover', '');
      await expect(cover).toHaveAttribute('data-ngx-yeti-item-box', '');
      expect(links, 'the hydrate never host keeps the cover link').toContain(
        'cover',
      );
      expect(links, 'the hydrate never host keeps the box link').toContain(
        'box',
      );
      await expectItemSheetsApplied(page, ['cover', 'box']);
      await expect(cover).toHaveCSS('flex-direction', 'column');
      await expect(cover).toHaveAttribute('data-gap', 'lg');
    });

    // The server hosts keep the cover link in <head>, so the client-only
    // cover reuses it.
    test('renders a client-only cover with 0 unstyled frames while the server hosts hold the cover link', async ({
      browserName,
      page,
    }) => {
      const direction = await recordFrames(
        page,
        '#client-cover',
        'flex-direction',
      );

      await delayCss(page);
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only cover' })
        .click();

      const cover = page.locator('#client-cover');

      await expect(cover).toBeVisible();
      await expect(cover).toHaveCSS('flex-direction', 'column');

      expectStyledFrames(await direction(), {
        styled: (value) => value === 'column',
        label: `${browserName}, ${kind}, client-only cover`,
        ...productionFramesRecordedAs(),
      });
    });

    // The order with center (cover.md:295): the center link is in place, and
    // the cover's file arrives after it, yet lands before it in <head>, so
    // `.cover > *` does not zero the inner center's auto inline margins.
    test('keeps a center centred in a client-only cover that loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}cover`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['cover', 'center']);
      await expect(page.locator('#reference-cover')).toHaveCSS(
        'flex-direction',
        'column',
      );

      const reference = await centerColumn(page.locator('#reference-center'));

      await expect(page.locator('#reference-center')).not.toHaveCSS(
        'margin-left',
        '0px',
      );

      await page
        .getByRole('button', { name: 'Remove the live covers' })
        .click();
      await removeDehydratedHosts(page, '#never-cover');
      await expect(page.locator('[data-ngx-yeti-item-cover]')).toHaveCount(0);
      await expect
        .poll(() => coverAndCenterLinks(page), {
          message: 'only the lone center holds a link',
        })
        .toEqual(['center']);

      await page
        .getByRole('button', { name: 'Show the client-only cover' })
        .click();

      const cover = page.locator('#client-cover');

      await expectItemSheetsApplied(page, ['cover', 'center']);
      await expect(cover).toHaveCSS('flex-direction', 'column');
      expect(
        await coverAndCenterLinks(page),
        'the cover link is inserted before the center link',
      ).toEqual(['cover', 'center']);

      const center = page.locator('#client-center');
      await expect(center).not.toHaveCSS('margin-left', '0px');
      // The column settles after its sheets apply; a cold development
      // server can show the full width first.
      await expect(async () => {
        const inner = await centerColumn(center);

        expect(inner.width).toBeCloseTo(reference.width, 1);
        expect(inner.left).toBeCloseTo(reference.left, 1);
      }).toPass({ timeout: 5_000 });
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the cover with its attributes, marker, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}cover`);

        const cover = page.locator('#live-cover');

        await expect(cover).toHaveClass('cover');
        await expect(cover).toHaveAttribute('data-ngx-yeti-item-cover', '');
        await expect(cover).toHaveAttribute('data-gap', 'lg');
        await expect(cover).not.toHaveAttribute('data-height');
        await expect(page.locator('#cover-heading')).toHaveAttribute(
          'data-center',
          '',
        );
        await expect(page.locator('#cover-heading')).not.toHaveAttribute(
          'data-ngx-yeti-item-cover',
        );
        expect(await coverAndCenterLinks(page)).toEqual(['cover', 'center']);
      });

      test('lays the cover out viewport-tall with its heading centred', async ({
        page,
      }) => {
        await page.goto(`${prefix}cover`);
        await expectItemSheetsApplied(page, ['cover', 'box']);
        await expect(page.locator('#live-cover')).toHaveCSS(
          'flex-direction',
          'column',
        );

        const cover = await rect(page.locator('#live-cover'));
        const top = await rect(page.locator('#cover-top'));
        const heading = await rect(page.locator('#cover-heading'));
        const bottom = await rect(page.locator('#cover-bottom'));
        const viewport = await page.evaluate(() => window.innerHeight);

        expect(cover.height).toBeGreaterThanOrEqual(viewport - 0.5);
        expect(
          Math.abs(
            (heading.top + heading.bottom) / 2 - (top.bottom + bottom.top) / 2,
          ),
          "the heading's midpoint is halfway between the two notes",
        ).toBeLessThanOrEqual(1);
      });
    });
  });
}
