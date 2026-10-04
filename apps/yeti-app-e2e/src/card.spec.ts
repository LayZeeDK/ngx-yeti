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

const cardHref =
  'yeti-css/components/card/card.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef';

/**
 * Call before `goto`: lists each attribute of a card host whose value differs
 * from the server's. Hydration rewrites every static and bound attribute with
 * the value it already has (measured in Chromium), so a record alone is no
 * change. Angular's event replay removes its own `jsaction` marker, which
 * `RouterLink`'s listener put on the link, not the package; it is not counted.
 */
async function recordCardHostAttributes(
  page: Page,
): Promise<() => Promise<unknown>> {
  await page.addInitScript(() => {
    const changes: string[] = [];

    Reflect.set(window, '__cardHostAttributes', changes);
    new MutationObserver((mutations) => {
      for (const { target, attributeName, oldValue } of mutations) {
        if (
          target instanceof Element &&
          target.matches('[yeticard], [yeticardlink]') &&
          attributeName !== null &&
          attributeName !== 'jsaction' &&
          target.getAttribute(attributeName) !== oldValue
        ) {
          changes.push(
            `${target.localName} ${attributeName}: ${String(oldValue)} -> ${String(target.getAttribute(attributeName))}`,
          );
        }
      }
    }).observe(document, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
    });
  });

  return () =>
    page.evaluate((): unknown => Reflect.get(window, '__cardHostAttributes'));
}

/**
 * Event replay removes every `jsaction` attribute once hydration has
 * finished, in both builds.
 */
async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator('[jsaction]')).toHaveCount(0);
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

/** The boxes of the card and its children. */
async function cardGeometry(page: Page): Promise<unknown> {
  return page.locator('article').evaluate((card) =>
    [card, ...card.children].map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();

      return { tag: element.localName, x, y, width, height };
    }),
  );
}

/** Upstream bug O2: read geometry only once the card's sheet has applied. */
async function expectCardSheetApplied(page: Page): Promise<void> {
  expect(
    await page.evaluate(() =>
      [...document.styleSheets].some(
        ({ ownerNode }) =>
          ownerNode instanceof HTMLLinkElement &&
          ownerNode.dataset['ngxYetiStyles'] === 'card',
      ),
    ),
    'the card stylesheet is loaded',
  ).toBe(true);
  await expect(page.locator('article')).not.toHaveCSS('padding-top', '0px');
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} card route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}card`);

      await expect(
        page.getByRole('link', { name: 'Weekend in the hills' }),
      ).toBeVisible();
      await expectCleanHydration();
    });

    test("adopts the server's card link at hydration", async ({
      baseURL,
      browserName,
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const cardPadding = await recordFrames(page, 'article', 'padding-top');
      const hostAttributes = await recordCardHostAttributes(page);

      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      expect(
        await styleMutations(),
        'no link or style element is added or removed after DOMContentLoaded',
      ).toEqual([]);
      expect(
        await hostAttributes(),
        'hydration changes no attribute on the card hosts',
      ).toEqual([]);
      expect(await itemLinks(page)).toEqual(['card']);

      const link = page.locator('head link[data-ngx-yeti-styles="card"]');

      await expect(link).toHaveAttribute('rel', 'stylesheet');
      await expect(link).toHaveAttribute('href', cardHref);
      expect(
        await link.evaluate((element) =>
          element instanceof HTMLLinkElement ? element.href : '',
        ),
        'the href resolves against <base href="/sub/">',
      ).toBe(new URL(cardHref, baseURL).href);
      await expect(link).toHaveAttribute('data-ngx-yeti-app', /.+/);
      await expect(link).toHaveAttribute('data-beasties-skip', '');

      const frames = (await cardPadding()).filter((value) => value !== '');

      expect(frames.length, 'the card was sampled').toBeGreaterThan(0);

      if (browserName === 'chromium') {
        expect(
          frames.filter((value) => value === '0px'),
          'no frame after first paint shows the card without Yeti',
        ).toEqual([]);
      } else {
        test.info().annotations.push({
          type: 'frames',
          description: `${String(frames.filter((value) => value === '0px').length)} of ${String(frames.length)} frames without Yeti`,
        });
      }
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves server HTML with the card and its item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}card`);

        const card = page.locator('article');

        await expect(card).toHaveClass('card');
        await expect(card).toHaveAttribute('data-threshold', 'xs');
        await expect(card).toHaveAttribute('data-ngx-yeti-item-card', '');
        await expect(
          page.getByRole('link', { name: 'Weekend in the hills' }),
        ).toHaveAttribute('data-stretch', '');
        expect(await itemLinks(page)).toEqual(['card']);
      });

      test('styles the card with the geometry it has with JavaScript on', async ({
        browser,
        page,
        viewport,
      }) => {
        await page.goto(`${prefix}card`);
        await expectCardSheetApplied(page);

        // A test's `use` options are this context's defaults too.
        const context = await browser.newContext({
          javaScriptEnabled: true,
          viewport,
        });
        const javaScriptPage = await context.newPage();

        await javaScriptPage.goto(page.url());
        await waitForHydration(javaScriptPage);
        await expectCardSheetApplied(javaScriptPage);

        expect(await cardGeometry(page)).toEqual(
          await cardGeometry(javaScriptPage),
        );

        await context.close();
      });

      test("navigates to the stretched link's href on a click near the card's corner", async ({
        page,
      }) => {
        await page.goto(`${prefix}card`);
        await expectCardSheetApplied(page);

        const href = await page
          .getByRole('link', { name: 'Weekend in the hills' })
          .getAttribute('href');
        const box = await page.locator('article').boundingBox();

        if (href === null || box === null) {
          throw new Error('The card or its stretched link is missing');
        }

        const expected = new URL(href, page.url()).href;

        await page.mouse.click(box.x + box.width - 4, box.y + box.height - 4);

        await expect(page).toHaveURL(expected);
      });

      test('serves server HTML that axe passes', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}card`);

        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
