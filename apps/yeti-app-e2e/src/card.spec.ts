import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import {
  itemLinks,
  recordFrames,
  recordStyleMutations,
} from './support/style-probe';

const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

const yetiPin = readFileSync(
  join(workspaceRoot, 'vendor/yeti/COMMIT'),
  'utf8',
).trim();
const cardHref = `yeti-css/components/card/card.css?v=${yetiPin}`;

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

/** Delays every Yeti file 300 ms; Playwright's routing also turns the HTTP cache off. */
async function delayItemCss(page: Page): Promise<void> {
  await page.route('**/yeti-css/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
}

/**
 * Removes every live card with the control, then the `hydrate never` host:
 * Angular keeps a dehydrated block's server DOM even after its parent view is
 * destroyed (measured on the setup route), so no control can remove it.
 */
async function removeEveryHost(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Remove the live cards' }).click();
  await page.locator('#never-card').evaluate((card) => {
    card.remove();
  });
  await expect(page.locator('[data-ngx-yeti-item-card]')).toHaveCount(0);
  await expect.poll(() => itemLinks(page)).toEqual([]);
}

/** Hovers the card with the real pointer and expects its top to rise. */
async function expectHoverLifts(page: Page, card: Locator): Promise<void> {
  // Yeti's `.lift` transition list; an element without Yeti computes `all`.
  await expect(card).not.toHaveCSS('transition-property', 'all');

  const before = await card.boundingBox();

  if (before === null) {
    throw new Error('The card is not rendered');
  }

  // Away from the card first, so the hover starts from rest.
  await page.mouse.move(0, 0);
  await card.hover();

  await expect
    .poll(async () => (await card.boundingBox())?.y, {
      message: "the hovered card's top decreases",
    })
    .toBeLessThan(before.y);
}

/**
 * Call before `goto`: counts animation frames and records the frame in which
 * the page's last card host left and the one in which the card link left.
 */
async function recordCardLinkRemoval(
  page: Page,
): Promise<() => Promise<{ hostsLeft: number; linkLeft: number }>> {
  await page.addInitScript(() => {
    const record = { hostsLeft: -1, linkLeft: -1 };
    let frame = 0;
    let seen = false;

    Reflect.set(window, '__cardLinkRemoval', record);

    const tick = (): void => {
      frame += 1;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    new MutationObserver(() => {
      const hosts = document.querySelector('[data-ngx-yeti-item-card]');
      const link = document.head.querySelector(
        'link[data-ngx-yeti-styles="card"]',
      );

      if (hosts !== null && link !== null) {
        seen = true;
      }

      if (seen && hosts === null && record.hostsLeft < 0) {
        record.hostsLeft = frame;
      }

      if (seen && link === null && record.linkLeft < 0) {
        record.linkLeft = frame;
      }
    }).observe(document, { childList: true, subtree: true });
  });

  return () =>
    page.evaluate(() => {
      const record: unknown = Reflect.get(window, '__cardLinkRemoval');

      return {
        hostsLeft: Number(Reflect.get(Object(record), 'hostsLeft')),
        linkLeft: Number(Reflect.get(Object(record), 'linkLeft')),
      };
    });
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
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

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

      // Upstream bug A4 (setup.md:403): with critical-CSS inlining on, a
      // server-rendered card can paint before the global stylesheet applies,
      // in Chromium too (1 of 20 production runs), so production records it.
      if (isProduction) {
        test.info().annotations.push({
          type: 'a4-frames',
          description: `${browserName}, critical-CSS inlining on (production): ${String(frames.filter((value) => value === '0px').length)} of ${String(frames.length)} frames without Yeti`,
        });
      } else if (browserName !== 'firefox') {
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

    test("keeps the hydrate-never host's card and lift links, lift, and border after every live card leaves", async ({
      page,
    }) => {
      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live cards' }).click();
      await expect(page.locator('article, li')).toHaveCount(0);
      await nextFrames(page);

      const card = page.locator('#never-card');

      await expect(card).toHaveAttribute('data-ngx-yeti-item-card', '');
      await expect(card).toHaveAttribute('data-ngx-yeti-item-lift', '');
      expect(
        await itemLinks(page),
        'the hydrate never host keeps both links',
      ).toEqual(['card', 'lift']);

      await expectHoverLifts(page, card);
      await expect(card, 'the card keeps its border').toHaveCSS(
        'border-top-style',
        'solid',
      );
      await expect(card).not.toHaveCSS('border-top-width', '0px');
    });

    // The server hosts keep the card link in <head>, so the client-only card
    // reuses it and the preload plays no part; the setup-defer route carries
    // the preload claim (card.md:337).
    test('renders a client-only card with 0 unstyled frames while the server hosts hold the card link', async ({
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#client-card',
        'padding-top',
      );

      await delayItemCss(page);
      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only card' })
        .click();

      const card = page.locator('#client-card');

      await expect(card).toBeVisible();
      await expect(card).not.toHaveCSS('padding-top', '0px');
      expect(await itemLinks(page)).toEqual(['card', 'lift']);

      const frames = (await cardPadding()).filter((value) => value !== '');

      expect(frames.length, 'the client-only card was sampled').toBeGreaterThan(
        0,
      );
      expect(
        frames.filter((value) => value === '0px'),
        'no frame shows the client-only card without Yeti',
      ).toEqual([]);
    });

    test("records the client-only card's frames after every card host has left", async ({
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#client-card',
        'padding-top',
      );

      await page.goto(`${prefix}card`);
      await waitForHydration(page);
      await removeEveryHost(page);

      await delayItemCss(page);
      await page
        .getByRole('button', { name: 'Show the client-only card' })
        .click();

      const card = page.locator('#client-card');

      await expect(card).not.toHaveCSS('padding-top', '0px');
      expect(await itemLinks(page)).toEqual(['card']);

      const frames = (await cardPadding()).filter((value) => value !== '');

      expect(frames.length, 'the client-only card was sampled').toBeGreaterThan(
        0,
      );
      // The server's card link used the preload at load, and routing turns
      // the HTTP cache off, so the re-inserted link refetches: recorded, not
      // asserted. The setup-defer route carries the 0-frame preload claim.
      test.info().annotations.push({
        type: 'frames',
        description: `${String(frames.filter((value) => value === '0px').length)} of ${String(frames.length)} frames without the card file (re-inserted)`,
      });
    });

    test('removes the card link on leaving the route and re-inserts it once on returning', async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const removal = await recordCardLinkRemoval(page);

      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      await page
        .getByRole('link', { name: 'Leave for a page without cards' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-card]')).toHaveCount(0);
      await expect.poll(() => itemLinks(page)).toEqual([]);

      const { hostsLeft, linkLeft } = await removal();

      expect(hostsLeft, 'the last card host left').toBeGreaterThan(0);
      expect(
        linkLeft - hostsLeft,
        'the card link leaves in the frame after the last card host',
      ).toBe(1);

      await page.goBack();
      await expect(
        page.getByRole('link', { name: 'Weekend in the hills' }),
      ).toBeVisible();
      await expect.poll(() => itemLinks(page)).toEqual(['card', 'lift']);
      await nextFrames(page);

      expect(
        (await styleMutations()).filter(
          (entry) => entry === 'add link[data-ngx-yeti-styles="card"]',
        ),
        'returning inserts the card link once',
      ).toEqual(['add link[data-ngx-yeti-styles="card"]']);
      expect(await itemLinks(page)).toEqual(['card', 'lift']);
    });

    test("records NgOptimizedImage's development-mode messages for the cropped picture and the row form", async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'NgOptimizedImage logs its checks in development mode only',
      );

      const messages: string[] = [];

      page.on('console', (message) => {
        messages.push(message.text());
      });

      await page.goto(`${prefix}card`);
      await waitForHydration(page);
      await expectCardSheetApplied(page);
      await expect(
        page
          .locator('img[ngsrc]')
          .evaluateAll((images) =>
            images.every(
              (image) => image instanceof HTMLImageElement && image.complete,
            ),
          ),
      ).resolves.toBe(true);
      await nextFrames(page);

      const imageMessages = messages.filter((text) =>
        /NgOptimizedImage|NG029\d\d/.test(text),
      );

      test.info().annotations.push(
        {
          type: 'NgOptimizedImage',
          description: `${String(imageMessages.length)} message(s) with the row-form card (section 8) and the square-cropped card`,
        },
        ...imageMessages.map((description) => ({
          type: 'NgOptimizedImage',
          description,
        })),
      );
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
        expect(await itemLinks(page)).toEqual(['card', 'lift']);
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
