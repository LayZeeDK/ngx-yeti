import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  delayCss,
  itemLinks,
  itemSheetsLoaded,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

interface Box {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
}

async function rect(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const { top, bottom, left, right, width, height } =
      element.getBoundingClientRect();

    return { top, bottom, left, right, width, height };
  });
}

/** The used block size of a public token, read from a probe in the page. */
async function token(page: Page, name: string): Promise<number> {
  return page.locator('main').evaluate((main, property) => {
    const probe = document.createElement('div');
    probe.style.blockSize = `var(${property})`;
    main.append(probe);
    const { height } = probe.getBoundingClientRect();
    probe.remove();

    return height;
  }, name);
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectSheetsApplied(
  page: Page,
  sidebar: Locator,
  items: readonly string[] = ['sidebar'],
): Promise<void> {
  await expect
    .poll(() => itemSheetsLoaded(page, items), {
      message: `the ${items.join(' and ')} stylesheets are loaded`,
    })
    .toBe(true);
  await expect(sidebar).toHaveCSS('flex-wrap', 'wrap');
}

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
    test('hydrates with 0 skipped components and no NG05xx message, and leaves no align', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}sidebar`);

      await expect(page.locator('#live-sidebar')).toBeVisible();
      await expectCleanHydration();
      await expect(page.locator('#live-sidebar')).not.toHaveAttribute('align');
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
      await expectSheetsApplied(page, sidebar, ['sidebar', 'box']);
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

      const frames = await wrap();
      const unstyled = frames.filter((value) => value !== 'wrap');

      expect(
        frames.length,
        'the client-only sidebar was sampled',
      ).toBeGreaterThan(0);
      test.info().annotations.push({
        type: isProduction ? 'a4-frames' : 'frames',
        description: `${browserName}${isProduction ? ', production' : ''}, ${kind}: ${String(unstyled.length)} of ${String(frames.length)} frames without the sidebar file`,
      });

      if (!isProduction) {
        expect(
          unstyled,
          'no frame shows the client-only sidebar without Yeti',
        ).toEqual([]);
      }
    });

    // The order with center (sidebar.md:316): the center link is in place,
    // and the sidebar's file arrives after it, yet lands before it in
    // <head>, so `.sidebar > *` does not zero the inner center's margins.
    test('keeps a center centred in a client-only sidebar that loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);
      await expectSheetsApplied(page, page.locator('#reference-sidebar'), [
        'sidebar',
        'center',
      ]);

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

      await expectSheetsApplied(page, sidebar, ['sidebar', 'center']);
      expect(
        await sidebarAndCenterLinks(page),
        'the sidebar link is inserted before the center link',
      ).toEqual(['sidebar', 'center']);

      const inner = await centerColumn(page.locator('#client-center'));

      expect(inner.width).toBeCloseTo(reference.width, 1);
      expect(inner.left).toBeCloseTo(reference.left, 1);
    });

    test('removes the sidebar link on leaving the route and re-inserts it on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}sidebar`);
      await waitForHydration(page);

      expect(await itemLinks(page)).toContain('sidebar');

      await page
        .getByRole('link', { name: 'Leave for a page without sidebars' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-sidebar]')).toHaveCount(0);
      await expect
        .poll(async () => (await itemLinks(page)).includes('sidebar'))
        .toBe(false);

      await page.goBack();
      await expect(page.locator('#live-sidebar')).toBeVisible();
      await expect
        .poll(async () => (await itemLinks(page)).includes('sidebar'))
        .toBe(true);
      await expectSheetsApplied(page, page.locator('#live-sidebar'));
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
        await expectSheetsApplied(page, page.locator('#live-sidebar'), [
          'sidebar',
          'box',
        ]);

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
          await expectSheetsApplied(live, live.locator('#live-sidebar'), [
            'sidebar',
            'box',
          ]);

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

        await expectSheetsApplied(page, sidebar, ['sidebar', 'box']);

        const offset = await token(page, '--yeti-sticky-offset');
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

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}sidebar`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
