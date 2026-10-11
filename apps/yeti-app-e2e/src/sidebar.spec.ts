import {
  expectItemSheetsApplied,
  rect,
  usedLength,
  type Box,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
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

/** The sidebar and center links, in document order; later items may add more. */
async function sidebarAndCenterLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'sidebar' || item === 'center',
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

/** The boxes of the live sidebar's two children, at the top of the page. */
async function liveChildren(page: Page): Promise<readonly [Box, Box]> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  return [
    await rect(page.locator('#sticky-nav')),
    await rect(page.locator('#live-article')),
  ];
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} sidebar route`, () => {
    describeStandardRouteCases({
      item: 'sidebar',
      prefix,
      liveHost: '#live-sidebar',
      leaveLink: 'Leave for a page without sidebars',
      styled: { property: 'flex-wrap', value: 'wrap' },
    });

    test('paints no frame with align on the sidebar written with a static align', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#live-sidebar', [
        'align',
      ]);

      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);

      const entries = await painted();
      const sidebar = page.locator('#live-sidebar');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries`,
      });
      expect(entries, 'no painted frame shows align on the sidebar').toEqual(
        [],
      );
      await expect(sidebar).toHaveAttribute('data-align', 'center');
      await expect(sidebar).not.toHaveAttribute('align');
    });

    test('keeps the hydrate-never sidebar that is a box styled, with both links, after every live sidebar and box leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live sidebars' })
        .click();
      await expect(
        page.locator(
          '[data-ngx-yeti-item-sidebar]:not(#never-sidebar), [data-ngx-yeti-item-box]:not(#never-sidebar)',
        ),
      ).toHaveCount(0);
      await nextFrames(page);

      const sidebar = page.locator('#never-sidebar');
      const links = await itemLinks(page);

      await expect(sidebar).toHaveAttribute('data-ngx-yeti-item-sidebar', '');
      await expect(sidebar).toHaveAttribute('data-ngx-yeti-item-box', '');
      expect(links, 'the hydrate never host keeps the sidebar link').toContain(
        'sidebar',
      );
      expect(links, 'the hydrate never host keeps the box link').toContain(
        'box',
      );
      await expectItemSheetsApplied(page, ['sidebar', 'box']);
      await expect(sidebar).toHaveCSS('flex-wrap', 'wrap');
      await expect(sidebar).toHaveAttribute('data-gap', 'lg');
    });

    // The server hosts keep the sidebar link in <head>, so the client-only
    // sidebar reuses it.
    test('renders a client-only sidebar with 0 unstyled frames while the server hosts hold the sidebar link', async ({
      browserName,
      page,
    }) => {
      const wrap = await recordFrames(page, '#client-sidebar', 'flex-wrap');

      await delayCss(page);
      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only sidebar' })
        .click();

      const sidebar = page.locator('#client-sidebar');

      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveCSS('flex-wrap', 'wrap');

      expectStyledFrames(await wrap(), {
        styled: (value) => value === 'wrap',
        label: `${browserName}, ${kind}, client-only sidebar`,
        ...productionFramesRecordedAs(),
      });
    });

    // The order with center (sidebar.md:316): the center link is in place,
    // and the sidebar's file arrives after it, yet lands before it in
    // <head>, so `.sidebar > *` does not zero the inner center's margins.
    test('keeps a center centred in a client-only sidebar that loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['sidebar', 'center']);
      await expect(page.locator('#reference-sidebar')).toHaveCSS(
        'flex-wrap',
        'wrap',
      );

      const reference = await centerColumn(page.locator('#reference-center'));

      await expect(page.locator('#reference-center')).not.toHaveCSS(
        'margin-left',
        '0px',
      );

      await page
        .getByRole('button', { name: 'Remove the live sidebars' })
        .click();
      await removeDehydratedHosts(page, '#never-sidebar');
      await expect(page.locator('[data-ngx-yeti-item-sidebar]')).toHaveCount(0);
      await expect
        .poll(() => sidebarAndCenterLinks(page), {
          message: 'only the lone center holds a link',
        })
        .toEqual(['center']);

      await page
        .getByRole('button', { name: 'Show the client-only sidebar' })
        .click();

      const sidebar = page.locator('#client-sidebar');

      await expectItemSheetsApplied(page, ['sidebar', 'center']);
      await expect(sidebar).toHaveCSS('flex-wrap', 'wrap');
      expect(
        await sidebarAndCenterLinks(page),
        'the sidebar link is inserted before the center link',
      ).toEqual(['sidebar', 'center']);

      const inner = await centerColumn(page.locator('#client-center'));

      expect(inner.width).toBeCloseTo(reference.width, 1);
      expect(inner.left).toBeCloseTo(reference.left, 1);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the sidebar with its attributes, marker, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}sidebar`);

        const sidebar = page.locator('#live-sidebar');

        await expect(sidebar).toHaveClass('sidebar');
        await expect(sidebar).toHaveAttribute('data-ngx-yeti-item-sidebar', '');
        await expect(sidebar).toHaveAttribute('data-width', 'xs');
        await expect(sidebar).toHaveAttribute('data-gap', 'lg');
        await expect(sidebar).toHaveAttribute('data-align', 'center');
        await expect(sidebar).not.toHaveAttribute('align');
        await expect(page.locator('#sticky-nav')).toHaveAttribute(
          'data-sticky',
          '',
        );
        await expect(page.locator('#sticky-nav')).not.toHaveAttribute(
          'data-ngx-yeti-item-sidebar',
        );
        expect(await sidebarAndCenterLinks(page)).toEqual([
          'sidebar',
          'center',
        ]);
      });

      test('places the children where they sit with JavaScript on', async ({
        baseURL,
        browser,
        page,
      }) => {
        await page.goto(`${prefix}sidebar`);
        await expectItemSheetsApplied(page, ['sidebar', 'box']);
        await expect(page.locator('#live-sidebar')).toHaveCSS(
          'flex-wrap',
          'wrap',
        );

        const [nav, article] = await liveChildren(page);

        if (baseURL === undefined) {
          throw new Error('The Fixture app has no base URL');
        }

        // newContext takes the test's use options, so JavaScript is turned
        // back on here.
        const context = await browser.newContext({
          baseURL,
          javaScriptEnabled: true,
        });

        try {
          const live = await context.newPage();

          await live.goto(`${prefix}sidebar`);
          await waitForHydration(live);
          await expectItemSheetsApplied(live, ['sidebar', 'box']);
          await expect(live.locator('#live-sidebar')).toHaveCSS(
            'flex-wrap',
            'wrap',
          );

          const [liveNav, liveArticle] = await liveChildren(live);

          expect(nav.top, 'the two sit side by side').toBeCloseTo(
            article.top,
            0,
          );

          for (const [off, on] of [
            [nav, liveNav],
            [article, liveArticle],
          ] as const) {
            expect(off.left).toBeCloseTo(on.left, 0);
            expect(off.top).toBeCloseTo(on.top, 0);
            expect(off.width).toBeCloseTo(on.width, 0);
          }
        } finally {
          await context.close();
        }
      });

      test('pins the sticky nav at the sticky offset while the article scrolls past', async ({
        page,
      }) => {
        await page.goto(`${prefix}sidebar`);

        const sidebar = page.locator('#live-sidebar');
        const nav = page.locator('#sticky-nav');

        await expectItemSheetsApplied(page, ['sidebar', 'box']);
        await expect(sidebar).toHaveCSS('flex-wrap', 'wrap');

        const offset = await usedLength(
          page.locator('main'),
          'var(--yeti-sticky-offset)',
          'block',
        );
        const before = await rect(sidebar);

        await page.evaluate((top) => {
          window.scrollTo(0, top);
        }, before.top + 200);

        await expect
          .poll(async () => (await rect(sidebar)).top, {
            message: "the sidebar's top has scrolled out",
          })
          .toBeLessThan(-100);
        await expect
          .poll(async () => (await rect(nav)).top)
          .toBeCloseTo(offset, 0);
        expect(
          (await rect(nav)).height,
          'the stuck nav keeps its own height',
        ).toBeLessThan((await rect(sidebar)).height);
      });
    });
  });
}
