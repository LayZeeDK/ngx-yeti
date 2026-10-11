import {
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import {
  expect,
  expectOnlyClientPreloads,
  routeKinds,
  test,
} from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  expectStyledFrames,
  itemLinks,
  recordFrames,
  recordHostAttributes,
  recordStyleMutations,
} from './support/style-probe';

/** The largest box Yeti's recipe may leave (visually-hidden.md:275). */
const largestBox = 1.5;

/** Expects the span out of the flow, in a box of at most `largestBox` px. */
async function expectHidden(page: Page, span: Locator): Promise<void> {
  await expectItemSheetsApplied(page, ['visually-hidden']);
  await expect(span).toHaveCSS('position', 'absolute');

  const { width, height } = await rect(span);

  expect(width).toBeLessThanOrEqual(largestBox);
  expect(height).toBeLessThanOrEqual(largestBox);
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} visually-hidden route`, () => {
    describeStandardRouteCases({
      item: 'visually-hidden',
      prefix,
      liveHost: '#hidden-words',
      leaveLink: 'Leave for the replay page',
      styled: { property: 'position', value: 'absolute' },
    });

    test('changes no attribute or style on the spans and adds or removes no item link at hydration', async ({
      page,
    }) => {
      const styleMutations = await recordStyleMutations(page);
      const hostAttributes = await recordHostAttributes(
        page,
        '[yetivisuallyhidden]',
      );

      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      expectOnlyClientPreloads(await styleMutations());
      expect(
        await hostAttributes(),
        'hydration changes no attribute, style included, on the spans',
      ).toEqual([]);
      expect(await itemLinks(page)).toContain('visually-hidden');
    });

    test('keeps the link and the words hidden in the hydrate-never block after the live spans leave', async ({
      page,
    }) => {
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      await page.getByRole('button', { name: 'Remove the live links' }).click();
      await expect(page.locator('#read-more, #long-link')).toHaveCount(0);
      await nextFrames(page);

      const span = page.locator('#never-words');

      await expect(span).toHaveAttribute(
        'data-ngx-yeti-item-visually-hidden',
        '',
      );
      expect(
        await itemLinks(page),
        'the hydrate never host keeps the link',
      ).toContain('visually-hidden');
      await expectHidden(page, span);
      await expect(
        page.getByRole('link', { name: 'Read more about the mountain hut' }),
      ).toBeVisible();
    });

    test('never shows a preloaded client-only span larger than its box', async ({
      browserName,
      page,
    }) => {
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);

      const widths = await recordFrames(page, '#client-words', 'width', {
        start: 'now',
      });
      const heights = await recordFrames(page, '#client-words', 'height', {
        start: 'now',
      });

      await page
        .getByRole('button', { name: 'Show the client-only link' })
        .click();

      const span = page.locator('#client-words');

      await expect(span).toBeAttached();
      await expectHidden(page, span);

      for (const [side, frames] of [
        ['width', await widths()],
        ['height', await heights()],
      ] as const) {
        expectStyledFrames(frames, {
          styled: (value) => parseFloat(value) <= largestBox,
          label: `${browserName}, ${kind}, client-only span ${side}`,
        });
      }
    });

    test('leaves no horizontal overflow at a 320 px viewport with a long hidden phrase', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${prefix}visually-hidden`);
      await waitForHydration(page);
      await expectHidden(page, page.locator('#long-words'));

      expect(
        await horizontalOverflow(page),
        'horizontal overflow in px',
      ).toBeLessThanOrEqual(0);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('names each link with its hidden words and keeps their box at most 1.5 px', async ({
        page,
      }) => {
        await page.goto(`${prefix}visually-hidden`);

        await expect(
          page.getByRole('link', { name: 'Read more about the trail map' }),
        ).toBeVisible();
        await expect(
          page.getByRole('link', {
            name: 'Details about every trail, hut, ford, and ridge on the long northern route through the mountains',
          }),
        ).toBeVisible();
        await expect(page.locator('#hidden-words')).toHaveClass(
          'visually-hidden',
        );
        await expectHidden(page, page.locator('#hidden-words'));
        await expectHidden(page, page.locator('#never-words'));
      });
    });
  });
}
