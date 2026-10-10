import {
  clientCardPreload,
  expect,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import { removeDehydratedHosts, removeEveryHost } from './support/hosts';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  delayCss,
  expectHydrationFrames,
  itemLinks,
  recordFrames,
  recordStyleMutations,
} from './support/style-probe';

/** The `hydrate on interaction` host, which keeps `jsaction` until it hydrates. */
const interactionHost = '#interaction-host';

/** The `hydrate never` and `hydrate on interaction` hosts. */
const dehydratedHosts = `#never-host, ${interactionHost}`;

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} setup route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}setup`);

      await expect(
        page.getByRole('link', { name: 'A card that lifts' }),
      ).toBeVisible();
      await expectCleanHydration();
    });

    test("adopts the server's links with no unstyled frame", async ({
      browserName,
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const cardPadding = await recordFrames(
        page,
        '#shared-host',
        'padding-top',
      );

      await page.goto(`${prefix}setup`);
      await waitForHydration(page, interactionHost);

      expect(
        await styleMutations(),
        'only the client card preload is added after parsing ends',
      ).toEqual([clientCardPreload]);
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      for (const item of ['card', 'lift']) {
        const link = page.locator(`head link[data-ngx-yeti-styles="${item}"]`);

        await expect(link).toHaveAttribute('data-ngx-yeti-app', /.+/);
        await expect(link).toHaveAttribute('data-beasties-skip', '');
      }

      const shared = page.locator('#shared-host');

      await expect(shared).toHaveAttribute('data-ngx-yeti-item-card', '');
      await expect(shared).toHaveAttribute('data-ngx-yeti-item-lift', '');

      expectHydrationFrames(await cardPadding(), browserName);
    });

    test("keeps the dehydrated hosts' links after every live host leaves, and after hydrating one", async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);

      await page.goto(`${prefix}setup`);
      await waitForHydration(page, interactionHost);

      await page.getByRole('button', { name: 'Remove the live hosts' }).click();
      await expect(page.locator('#shared-host, #leaving-host')).toHaveCount(0);
      await nextFrames(page);

      expect(
        await itemLinks(page),
        'the hydrate never and hydrate on interaction hosts keep both links',
      ).toEqual(['card', 'lift']);

      // From here on only the interaction host holds the links.
      await removeDehydratedHosts(page, '#never-host');
      await nextFrames(page);

      expect(
        await itemLinks(page),
        'the dehydrated interaction host keeps both links',
      ).toEqual(['card', 'lift']);

      const button = page.getByRole('button', { name: 'Hydrate this card' });

      await button.click();
      await expect(
        page.getByRole('button', { name: 'Hydrated' }),
        'the interaction block hydrated and replayed the click',
      ).toBeVisible();
      await nextFrames(page);

      expect(await itemLinks(page)).toEqual(['card', 'lift']);
      expect(
        await styleMutations(),
        'no item link is removed or added again on the way, only the client card preload is added',
      ).toEqual([clientCardPreload]);

      const host = page.locator(interactionHost);

      await expect(host).toHaveAttribute('data-ngx-yeti-item-card', '');
      await expect(host).toHaveAttribute('data-ngx-yeti-item-lift', '');
    });

    test('keeps the leaving host styled while it leaves and drops its link after', async ({
      browserName,
      page,
    }) => {
      const leavingPadding = await recordFrames(
        page,
        '#leaving-host',
        'padding-top',
      );

      await page.goto(`${prefix}setup`);
      await waitForHydration(page, interactionHost);

      const leaving = page.locator('#leaving-host');

      // Upstream bug A4 reaches only the frames before the global stylesheet
      // applies; from here on every frame is inside the asserted leave window.
      await expect(leaving).not.toHaveCSS('padding-top', '0px');

      const leaveWindow = await recordFrames(
        page,
        '#leaving-host',
        'padding-top',
        { start: 'now' },
      );

      // Only the live hosts hold the card link now.
      await removeDehydratedHosts(page, dehydratedHosts);
      await page.getByRole('button', { name: 'Remove the live hosts' }).click();

      await expect(leaving, 'the host is leaving').toHaveClass(
        /app-setup-leaving/,
      );
      expect(await itemLinks(page)).toContain('card');
      await expect(leaving).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).toEqual([]);

      const present = await leavingPadding();
      const leaveFrames = await leaveWindow();

      expect(present.length, 'the leaving host was sampled').toBeGreaterThan(0);
      expect(
        leaveFrames.length,
        'the leaving host was sampled while it left',
      ).toBeGreaterThan(0);
      expect(
        leaveFrames.filter((value) => value === '0px'),
        'no frame shows the leaving card without Yeti while it leaves',
      ).toEqual([]);

      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, critical-CSS inlining on (production): ${String(present.filter((value) => value === '0px').length)} of ${String(present.length)} frames without Yeti from first paint`,
        });
      } else {
        expect(
          present.filter((value) => value === '0px'),
          'no frame after first paint shows the leaving card without Yeti',
        ).toEqual([]);
      }
    });

    test("records the client-only @defer's frames after every host has left", async ({
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#client-card',
        'padding-top',
      );

      await page.goto(`${prefix}setup`);
      await waitForHydration(page, interactionHost);
      await removeEveryHost(page, 'Remove the live hosts', dehydratedHosts);

      await expect(
        page.locator('head link[rel="preload"][as="style"]'),
        'the app preloads the card file only',
      ).toHaveAttribute('href', /components\/card\/card\.css/);

      const liftTransition = await recordFrames(
        page,
        '#client-lift',
        'transition-property',
        { start: 'now' },
      );

      await delayCss(page);
      await page
        .getByRole('button', { name: 'Show the client-only items' })
        .click();

      await expect(page.locator('#client-lift')).not.toHaveCSS(
        'transition-property',
        'all',
      );
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const card = await cardPadding();

      expect(card.length, 'the client-only card was sampled').toBeGreaterThan(
        0,
      );

      const lift = await liftTransition();

      // Recorded, not asserted: the `setup-defer` route below carries the
      // 0-frame claim.
      test.info().annotations.push(
        {
          type: 'frames',
          description: `${String(card.filter((value) => value === '0px').length)} of ${String(card.length)} frames without the card file (re-inserted)`,
        },
        {
          type: 'frames',
          description: `${String(lift.filter((value) => value === 'all').length)} of ${String(lift.length)} frames without the lift file (no preload)`,
        },
      );
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test("styles the card as Yeti's full stylesheet does", async ({
        page,
      }) => {
        await page.goto(`${prefix}setup`);

        const card = page.locator('#shared-host');

        await expect(card).not.toHaveCSS('padding-top', '0px');

        const padding = await card.evaluate(
          (element) => getComputedStyle(element).padding,
        );

        expect(await itemLinks(page)).toEqual(['card', 'lift']);

        // Swap the item links for Yeti's full yeti.css, which the assets glob
        // copies beside the item files.
        await page.evaluate(() => {
          for (const link of document.head.querySelectorAll(
            'link[data-ngx-yeti-styles]',
          )) {
            link.remove();
          }
        });
        await expect(card, 'the item link styled the card').toHaveCSS(
          'padding-top',
          '0px',
        );
        await page.evaluate(() => {
          const link = document.createElement('link');

          link.rel = 'stylesheet';
          link.href = 'yeti-css/yeti.css';
          document.head.append(link);
        });

        await expect(card).toHaveCSS('padding', padding);
      });

      test('applies the global stylesheet', async ({ page }) => {
        await page.goto(`${prefix}setup`);

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
        expect(fontFamily).toBe(yetiFontSans);
      });

      test("applies the global stylesheet's noscript copy", async ({
        page,
      }) => {
        test.skip(
          !isProduction,
          'Only the production build inlines critical CSS and writes the noscript copy',
        );

        await page.goto(`${prefix}setup`);

        expect(
          await page.evaluate(() =>
            [...document.styleSheets].some(
              ({ ownerNode, media }) =>
                ownerNode instanceof HTMLLinkElement &&
                ownerNode.parentElement?.localName === 'noscript' &&
                media.mediaText === '',
            ),
          ),
          'the stylesheet link inside <noscript> applies',
        ).toBe(true);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}setup`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} setup-defer route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}setup-defer`);

      await expect(
        page.getByRole('button', { name: 'Show the deferred card' }),
      ).toBeVisible();
      await expectCleanHydration();
    });

    test('renders the client-only card with 0 unstyled frames through the preload', async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const cardPadding = await recordFrames(
        page,
        '#deferred-card',
        'padding-top',
      );

      await page.addInitScript(() => {
        // `load` does not bubble; a capturing listener sees the link's.
        document.addEventListener(
          'load',
          ({ target }) => {
            if (target instanceof HTMLLinkElement && target.rel === 'preload') {
              Reflect.set(window, '__ngxYetiPreloaded', true);
            }
          },
          true,
        );
      });
      // Item CSS delayed from the start.
      await delayCss(page);
      await page.goto(`${prefix}setup-defer`);
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'only the client card preload is added after parsing ends',
      ).toEqual([clientCardPreload]);
      expect(await itemLinks(page), 'the server rendered no card').toEqual([]);
      await expect(
        page.locator('head link[rel="preload"][as="style"]'),
      ).toHaveAttribute('href', /components\/card\/card\.css/);
      // The client's preload has loaded before the interaction. Routing turns
      // the HTTP cache off, so the server's prefetch, whose response would
      // otherwise serve it, cannot stand in for it here.
      await expect
        .poll(() =>
          page.evaluate((): unknown =>
            Reflect.get(window, '__ngxYetiPreloaded'),
          ),
        )
        .toBe(true);

      await page
        .getByRole('button', { name: 'Show the deferred card' })
        .click();

      const card = page.locator('#deferred-card');

      await expect(card).toBeVisible();
      await expect(card).not.toHaveCSS('padding-top', '0px');
      expect(await itemLinks(page)).toEqual(['card']);

      const frames = await cardPadding();
      const unstyled = frames.filter((value) => value === '0px');

      expect(frames.length, 'the deferred card was sampled').toBeGreaterThan(0);

      expect(
        unstyled,
        'no frame shows the preloaded card without Yeti',
      ).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the placeholder with the card prefetch, no style preload, and no card link', async ({
        page,
      }) => {
        await page.goto(`${prefix}setup-defer`);

        await expect(
          page.getByRole('button', { name: 'Show the deferred card' }),
        ).toBeVisible();
        expect(await itemLinks(page)).toEqual([]);
        await expect(page.locator('head link[rel="prefetch"]')).toHaveAttribute(
          'href',
          /components\/card\/card\.css/,
        );
        await expect(
          page.locator('head link[rel="preload"]'),
          'a server style preload holds the first paint in WebKit (upstream bug O4)',
        ).toHaveCount(0);
        await expect(
          page.locator('[jsaction]'),
          'a jsaction marker that waitForHydration waits on',
        ).not.toHaveCount(0);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}setup-defer`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
