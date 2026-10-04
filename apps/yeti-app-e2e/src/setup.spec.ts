import { type Page } from '@playwright/test';
import { expect, isProduction, test } from './support/fixtures';
import { watchHydration } from './support/hydration';
import {
  itemLinks,
  recordFrames,
  recordStyleMutations,
} from './support/style-probe';

const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

/**
 * Event replay removes every `jsaction` attribute once hydration has
 * finished, except in the `hydrate on interaction` block, which keeps its
 * markers until it hydrates.
 */
async function waitForHydration(page: Page): Promise<void> {
  await expect(
    page.locator('[jsaction]:not(#interaction-host, #interaction-host *)'),
  ).toHaveCount(0);
  await nextFrames(page);
}

async function nextFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

/**
 * Starts sampling `property` on `selector` in every animation frame, like
 * `recordFrames` but from now on, for a second probe on the same page.
 */
async function sampleFrames(
  page: Page,
  selector: string,
  property: string,
): Promise<() => Promise<string[]>> {
  const key = await page.evaluate(
    ([frameSelector, frameProperty]) => {
      const name = `__setupFrames${frameSelector}`;
      const frames: string[] = [];

      Reflect.set(window, name, frames);

      const sample = (): void => {
        const element = document.querySelector(frameSelector);

        frames.push(
          element === null
            ? ''
            : getComputedStyle(element).getPropertyValue(frameProperty),
        );
        requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);

      return name;
    },
    [selector, property] as const,
  );

  return () =>
    page.evaluate((name) => {
      const frames: unknown = Reflect.get(window, name);

      return Array.isArray(frames) ? frames.map(String) : [];
    }, key);
}

/**
 * Angular keeps a dehydrated block's server DOM even after its parent view is
 * destroyed (measured with an `@if` around the `hydrate never` block), so no
 * control can remove the dehydrated hosts; the test does.
 */
async function removeDehydratedHosts(page: Page): Promise<void> {
  await page.locator('#never-host, #interaction-host').evaluateAll((hosts) => {
    for (const host of hosts) {
      host.remove();
    }
  });
}

/** Removes every host and waits for `<head>` to hold no item link. */
async function removeEveryHost(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Remove the live hosts' }).click();
  await removeDehydratedHosts(page);
  await expect(page.locator('[data-ngx-yeti-item-card]')).toHaveCount(0);
  await expect.poll(() => itemLinks(page)).toEqual([]);
}

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
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'no link or style element is added or removed after DOMContentLoaded',
      ).toEqual([]);
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      for (const item of ['card', 'lift']) {
        const link = page.locator(`head link[data-ngx-yeti-styles="${item}"]`);

        await expect(link).toHaveAttribute('data-ngx-yeti-app', /.+/);
        await expect(link).toHaveAttribute('data-beasties-skip', '');
      }

      const shared = page.locator('#shared-host');

      await expect(shared).toHaveAttribute('data-ngx-yeti-item-card', '');
      await expect(shared).toHaveAttribute('data-ngx-yeti-item-lift', '');

      const frames = (await cardPadding()).filter((value) => value !== '');
      const unstyled = frames.filter((value) => value === '0px');

      expect(frames.length, 'the card was sampled').toBeGreaterThan(0);

      // Upstream bug A4 (setup.md:403): with critical-CSS inlining on, a
      // server-rendered host can paint before the global stylesheet applies,
      // in Chromium too, so production records the frames.
      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, critical-CSS inlining on (production): ${String(unstyled.length)} of ${String(frames.length)} frames without Yeti`,
        });

        return;
      }

      test.info().annotations.push({
        type: 'frames',
        description: `${browserName}: ${String(unstyled.length)} of ${String(frames.length)} frames without Yeti`,
      });

      // Firefox's frames are recorded against upstream bug A4 (setup.md:338).
      if (browserName !== 'firefox') {
        expect(unstyled, 'no frame shows the card without Yeti').toEqual([]);
      }
    });

    test("keeps the dehydrated hosts' links after every live host leaves, and after hydrating one", async ({
      page,
    }) => {
      await page.goto(`${prefix}setup`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live hosts' }).click();
      await expect(page.locator('#shared-host, #leaving-host')).toHaveCount(0);
      await nextFrames(page);

      expect(
        await itemLinks(page),
        'the hydrate never and hydrate on interaction hosts keep both links',
      ).toEqual(['card', 'lift']);

      const button = page.getByRole('button', { name: 'Hydrate this card' });

      await button.click();
      await expect(
        page.getByRole('button', { name: 'Hydrated' }),
        'the interaction block hydrated and replayed the click',
      ).toBeVisible();
      await nextFrames(page);

      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      for (const id of ['#never-host', '#interaction-host']) {
        await expect(page.locator(id)).toHaveAttribute(
          'data-ngx-yeti-item-card',
          '',
        );
        await expect(page.locator(id)).toHaveAttribute(
          'data-ngx-yeti-item-lift',
          '',
        );
      }
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
      await waitForHydration(page);

      const leaving = page.locator('#leaving-host');

      // Upstream bug A4 reaches only the frames before the global stylesheet
      // applies; from here on every frame is inside the asserted leave window.
      await expect(leaving).not.toHaveCSS('padding-top', '0px');

      const leaveWindow = await sampleFrames(
        page,
        '#leaving-host',
        'padding-top',
      );

      // Only the live hosts hold the card link now.
      await removeDehydratedHosts(page);
      await page.getByRole('button', { name: 'Remove the live hosts' }).click();

      await expect(leaving, 'the host is leaving').toHaveClass(
        /app-setup-leaving/,
      );
      expect(await itemLinks(page)).toContain('card');
      await expect(leaving).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).toEqual([]);

      const present = (await leavingPadding()).filter((value) => value !== '');
      const leaveFrames = (await leaveWindow()).filter((value) => value !== '');

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
      await waitForHydration(page);
      await removeEveryHost(page);

      await expect(
        page.locator('head link[rel="preload"][as="style"]'),
        'the app preloads the card file only',
      ).toHaveAttribute('href', /components\/card\/card\.css/);

      const liftTransition = await sampleFrames(
        page,
        '#client-lift',
        'transition-property',
      );

      // Playwright's routing also turns the HTTP cache off.
      await page.route('**/yeti-css/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await route.continue();
      });
      await page
        .getByRole('button', { name: 'Show the client-only items' })
        .click();

      await expect(page.locator('#client-lift')).not.toHaveCSS(
        'transition-property',
        'all',
      );
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const card = (await cardPadding()).filter((value) => value !== '');

      expect(card.length, 'the client-only card was sampled').toBeGreaterThan(
        0,
      );

      const lift = (await liftTransition()).filter((value) => value !== '');

      // The server's card already used the preload, and routing turns the
      // HTTP cache off, so the re-inserted card link refetches: recorded, not
      // asserted. The `setup-defer` route below carries the 0-frame claim.
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

      // Item CSS delayed 300 ms from the start; routing also turns the HTTP
      // cache off.
      await page.route('**/yeti-css/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await route.continue();
      });
      await page.goto(`${prefix}setup-defer`);
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'no link or style element is added or removed after DOMContentLoaded',
      ).toEqual([]);
      expect(await itemLinks(page), 'the server rendered no card').toEqual([]);
      await expect(
        page.locator('head link[rel="preload"][as="style"]'),
      ).toHaveAttribute('href', /components\/card\/card\.css/);
      // The preload response has arrived before the interaction.
      await expect
        .poll(() =>
          page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .some(({ name }) => name.includes('components/card/card.css')),
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

      const frames = (await cardPadding()).filter((value) => value !== '');

      expect(frames.length, 'the deferred card was sampled').toBeGreaterThan(0);
      expect(
        frames.filter((value) => value === '0px'),
        'no frame shows the preloaded card without Yeti',
      ).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the placeholder with the card preload and no card link', async ({
        page,
      }) => {
        await page.goto(`${prefix}setup-defer`);

        await expect(
          page.getByRole('button', { name: 'Show the deferred card' }),
        ).toBeVisible();
        expect(await itemLinks(page)).toEqual([]);
        await expect(
          page.locator('head link[rel="preload"][as="style"]'),
        ).toHaveAttribute('href', /components\/card\/card\.css/);
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
