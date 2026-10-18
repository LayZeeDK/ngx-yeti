import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  childRects,
  expectItemSheetsApplied,
  rect,
} from '@ngx-yeti/testing/playwright';
import { workspaceRoot } from '@nx/devkit';
import { type Locator, type Page } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  isProduction,
  routeKinds,
  test,
} from './support/fixtures';
import { expectHoverLifts, removeEveryHost } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  firstPaintFramesRecordedAs,
  itemLinks,
  recordFrames,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

const yetiPin = readFileSync(
  join(workspaceRoot, 'vendor/yeti/COMMIT'),
  'utf8',
).trim();
const cardHref = `yeti-css/components/card/card.css?v=${yetiPin}`;
const cardAndLift = expect.arrayContaining(['card', 'lift']);
/** The items whose files the first card's and the grid's geometry needs. */
const geometryItems = ['card', 'grid', 'button'];

/** The tags of the card's children and the boxes of the card and of each. */
async function cardGeometry(page: Page): Promise<unknown> {
  const card = page.locator('article');

  return {
    tags: await card.evaluate((element) =>
      [...element.children].map((child) => child.localName),
    ),
    boxes: [await rect(card), ...(await childRects(card))],
  };
}

/**
 * Expects the lifted cards side by side in one row of a grid, and the first
 * card's footer link to be a button.
 */
async function expectGridOfCards(page: Page, grid: Locator): Promise<void> {
  const footerLink = page.getByRole('link', { name: 'Read more' });

  await expectItemSheetsApplied(page, geometryItems);
  await expect(grid).toHaveCSS('display', 'grid');
  await expect(grid.locator('> li[data-ngx-yeti-item-card]')).toHaveCount(3);
  await expect(footerLink).toHaveClass('button');
  await expect(footerLink).toHaveAttribute('data-ngx-yeti-item-button', '');

  const cards = await childRects(grid);
  const [first] = cards;

  if (first === undefined) {
    throw new Error('The grid has no card');
  }

  for (const [index, card] of cards.entries()) {
    expect(
      Math.abs(card.top - first.top),
      'every card starts in the first row',
    ).toBeLessThanOrEqual(1);
    expect(
      card.left,
      'each card starts after the one before it',
    ).toBeGreaterThanOrEqual(cards[index - 1]?.right ?? 0);
  }
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
    describeStandardRouteCases({
      item: 'card',
      prefix,
      liveHost: 'article',
      leaveLink: 'Leave for a page without cards',
      styled: { property: 'padding-top', value: /^(?!0px$)/ },
    });

    test("adopts the server's card link at hydration", async ({
      baseURL,
      browserName,
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const cardPadding = await recordFrames(page, 'article', 'padding-top');
      const hostAttributes = await recordHostAttributes(
        page,
        '[yeticard], [yeticardlink]',
      );

      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      expectOnlyClientPreloads(await styleMutations());
      expect(
        await hostAttributes(),
        'hydration changes no attribute on the card hosts',
      ).toEqual([]);
      expect(await itemLinks(page)).toEqual(cardAndLift);

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

      expectStyledFrames(await cardPadding(), {
        styled: (value) => value !== '0px',
        label: `${browserName}, ${kind}, card from first paint`,
        ...firstPaintFramesRecordedAs(browserName),
      });
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
      ).toEqual(cardAndLift);

      await expectHoverLifts(page, card);
      await expect(card, 'the card keeps its border').toHaveCSS(
        'border-top-style',
        'solid',
      );
      await expect(card).not.toHaveCSS('border-top-width', '0px');
    });

    test('lays the lifted cards out in the columns of a grid, with a button for the footer link', async ({
      page,
    }) => {
      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      const grid = page.locator('ul[data-ngx-yeti-item-grid]');

      await expect(grid).toHaveClass('grid');
      await expectGridOfCards(page, grid);
    });

    // The server hosts keep the card link in <head>, so the client-only card
    // reuses it and the preload plays no part; the setup-defer route carries
    // the preload claim (card.md:337).
    test('renders a client-only card with 0 unstyled frames while the server hosts hold the card link', async ({
      browserName,
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#client-card',
        'padding-top',
      );

      await delayCss(page);
      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only card' })
        .click();

      const card = page.locator('#client-card');

      await expect(card).toBeVisible();
      await expect(card).not.toHaveCSS('padding-top', '0px');
      expect(await itemLinks(page)).toEqual(cardAndLift);

      expectStyledFrames(await cardPadding(), {
        styled: (value) => value !== '0px',
        label: `${browserName}, ${kind}, client-only card`,
      });
    });

    test("records the client-only card's frames after every card host has left", async ({
      browserName,
      page,
    }) => {
      const cardPadding = await recordFrames(
        page,
        '#client-card',
        'padding-top',
      );

      await page.goto(`${prefix}card`);
      await waitForHydration(page);
      await removeEveryHost(page, 'Remove the live cards', '#never-card');

      await delayCss(page);
      await page
        .getByRole('button', { name: 'Show the client-only card' })
        .click();

      const card = page.locator('#client-card');

      await expect(card).not.toHaveCSS('padding-top', '0px');
      expect(await itemLinks(page, 'card')).toEqual(['card']);
      expect(await itemLinks(page, 'lift')).toEqual([]);

      // The server's card link used the preload at load, and routing turns
      // the HTTP cache off, so the re-inserted link refetches: recorded, not
      // asserted. The setup-defer route carries the 0-frame preload claim.
      expectStyledFrames(await cardPadding(), {
        styled: (value) => value !== '0px',
        label: `${browserName}, ${kind}, client-only card after every host left`,
        recordedAs: 'reinserted-frames',
      });
    });

    test('removes the card link in the frame after the last card host leaves, and re-inserts it once on returning', async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const removal = await recordCardLinkRemoval(page);

      await page.goto(`${prefix}card`);
      await waitForHydration(page);

      await page
        .getByRole('link', { name: 'Leave for a page without cards' })
        .click();
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
      await expect.poll(() => itemLinks(page)).toEqual(cardAndLift);
      await nextFrames(page);

      expect(
        (await styleMutations()).filter(
          (entry) => entry === 'add link[data-ngx-yeti-styles="card"]',
        ),
        'returning inserts the card link once',
      ).toEqual(['add link[data-ngx-yeti-styles="card"]']);
      expect(await itemLinks(page)).toEqual(cardAndLift);
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
      await expectItemSheetsApplied(page, ['card']);
      await expect(page.locator('article')).not.toHaveCSS('padding-top', '0px');
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

      test("serves server HTML with the card's threshold, its stretched link, and the route's item links", async ({
        page,
      }) => {
        await page.goto(`${prefix}card`);

        const card = page.locator('article');

        await expect(card).toHaveClass('card');
        await expect(card).toHaveAttribute('data-threshold', 'xs');
        await expect(
          page.getByRole('link', { name: 'Weekend in the hills' }),
        ).toHaveAttribute('data-stretch', '');
        const named = ['grid', 'button', 'card', 'spinner', 'lift'];

        expect(
          (await itemLinks(page)).filter((item) => named.includes(item)),
          "the server writes the route's item links in Yeti's order",
        ).toEqual(named);
      });

      test('lays the lifted cards out in the columns of a grid, with a button for the footer link', async ({
        page,
      }) => {
        await page.goto(`${prefix}card`);

        const grid = page.locator('ul[data-ngx-yeti-item-grid]');

        await expect(grid).toHaveClass('grid');
        await expectGridOfCards(page, grid);
      });

      test('styles the card with the geometry it has with JavaScript on', async ({
        browser,
        page,
        viewport,
      }) => {
        await page.goto(`${prefix}card`);
        await expectItemSheetsApplied(page, geometryItems);
        await expect(page.locator('article')).not.toHaveCSS(
          'padding-top',
          '0px',
        );

        // A test's `use` options are this context's defaults too.
        const context = await browser.newContext({
          javaScriptEnabled: true,
          viewport,
        });
        const javaScriptPage = await context.newPage();

        await javaScriptPage.goto(page.url());
        await waitForHydration(javaScriptPage);
        await expectItemSheetsApplied(javaScriptPage, geometryItems);
        await expect(javaScriptPage.locator('article')).not.toHaveCSS(
          'padding-top',
          '0px',
        );

        expect(await cardGeometry(page)).toEqual(
          await cardGeometry(javaScriptPage),
        );

        await context.close();
      });

      test("navigates to the stretched link's href on a click near the card's corner", async ({
        page,
      }) => {
        await page.goto(`${prefix}card`);
        await expectItemSheetsApplied(page, ['card']);
        await expect(page.locator('article')).not.toHaveCSS(
          'padding-top',
          '0px',
        );

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
    });
  });
}
