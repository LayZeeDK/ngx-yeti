import {
  expectItemSheetsApplied,
  horizontalOverflow,
  resize,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

type CardForm = 'row' | 'stacked' | 'neither';

/**
 * The frame width at the `xs` stop: `16rem` of card content plus the card's
 * padding and border, read with the card's tokens, so the width holds for any
 * token value (card.md, Testing Decisions).
 */
async function xsStop(frame: Locator): Promise<number> {
  return usedLength(
    frame,
    'calc(16rem + 2 * var(--yeti-card-padding) + 2 * var(--yeti-border-width))',
  );
}

/**
 * Sets the frame's width in px (`null` keeps it) and reads the card's form:
 * row when the title's left edge is past the picture's right edge and the
 * picture is 40 % of the card's padding box within 1 px; stacked when the
 * title's top is at or below the picture's bottom (card.md, Testing
 * Decisions).
 */
async function cardForm(
  frame: Locator,
  width: number | null,
): Promise<CardForm> {
  if (width !== null) {
    await resize(frame, width);
  }

  return frame.evaluate((element): CardForm => {
    const card = element.querySelector('article');
    const media = element.querySelector('article > img');
    const title = element.querySelector('article h3');

    if (card === null || media === null || title === null) {
      throw new Error('The card, its picture, or its title is missing');
    }

    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const boxWidth =
      rect.width -
      parseFloat(style.borderLeftWidth) -
      parseFloat(style.borderRightWidth);
    const mediaRect = media.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();

    if (
      titleRect.left >= mediaRect.right &&
      Math.abs(mediaRect.width - 0.4 * boxWidth) <= 1
    ) {
      return 'row';
    }

    return titleRect.top >= mediaRect.bottom ? 'stacked' : 'neither';
  }, width);
}

test.describe('card--default', () => {
  test('switches between the row and the stacked form across the xs stop of its container', async ({
    page,
  }) => {
    const root = await openStory(page, 'card--default');
    const frame = root.getByTestId('frame');

    await expectItemSheetsApplied(page, ['card']);
    await expect(root.getByRole('article')).toHaveCSS('display', 'flex');

    const stop = await xsStop(frame);

    expect(await cardForm(frame, stop + 4)).toBe('row');
    expect(await cardForm(frame, stop - 4)).toBe('stacked');
    expect(await cardForm(frame, stop + 4)).toBe('row');
  });

  test('reflows at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'card--default');
    const frame = root.getByTestId('frame');

    await expectItemSheetsApplied(page, ['card']);
    await expect(root.getByRole('article')).toHaveCSS('display', 'flex');

    // The story's frame starts at a fixed 40rem and scrolls its overflow so it
    // can be resized by hand; reflow is about the card at the page's own
    // width, so drop that width, and let the card's overflow reach the page,
    // where the check below can see it.
    await frame.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.style.inlineSize = '';
        element.style.overflow = '';
      }
    });

    expect(await cardForm(frame, null)).toBe('stacked');
    expect(
      await horizontalOverflow(page),
      'horizontal overflow in px',
    ).toBeLessThanOrEqual(0);
  });

  test('raises its switching width with 200 % text zoom', async ({ page }) => {
    const root = await openStory(page, 'card--default');
    const frame = root.getByTestId('frame');

    await expectItemSheetsApplied(page, ['card']);
    await expect(root.getByRole('article')).toHaveCSS('display', 'flex');

    const stop = await xsStop(frame);

    expect(await cardForm(frame, stop + 4)).toBe('row');

    // Text zoom: the root font size at 200 %, so every rem doubles.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomedStop = await xsStop(frame);

    expect(zoomedStop).toBeGreaterThan(stop + 4);
    expect(await cardForm(frame, stop + 4)).toBe('stacked');
    expect(await cardForm(frame, zoomedStop + 4)).toBe('row');
  });
});

test.describe('card--stretched-link', () => {
  test('navigates on a real click near the corner and not on a click on the footer button', async ({
    page,
  }) => {
    const root = await openStory(page, 'card--stretched-link');
    const card = root.getByRole('article');
    const button = root.getByRole('button', { name: 'Save' });
    const destination = root.getByText('The hills page');

    await expectItemSheetsApplied(page, ['card', 'button']);
    await expect(card).toHaveCSS('display', 'flex');
    await button.click();

    await expect(
      root.getByRole('button', { name: 'Saved' }),
      'the footer button takes the click',
    ).toBeVisible();
    await expect(destination).toHaveCount(0);

    const box = await card.boundingBox();

    if (box === null) {
      throw new Error('The card has no box');
    }

    await page.mouse.click(box.x + box.width - 8, box.y + box.height - 8);

    await expect(destination).toBeVisible();
  });

  test('takes real Tab presses on the stretched link and the footer button only', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'card--stretched-link');
    const card = root.getByRole('article');

    await expectItemSheetsApplied(page, ['card']);
    await expect(card).toHaveCSS('display', 'flex');
    await page.evaluate(() => {
      const after = document.createElement('button');
      after.textContent = 'After the card';
      document.body.append(after);
    });

    await page.keyboard.press('Tab');
    await expect(
      root.getByRole('link', { name: 'Weekend in the hills' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(root.getByRole('button', { name: 'Save' })).toBeFocused();
    await page.keyboard.press('Tab');

    // Without a control after the card, headless Firefox keeps focus on its
    // last control at the end of the document, so the test gives Tab
    // somewhere to go outside the story's markup.
    await expect(
      page.getByRole('button', { name: 'After the card' }),
      'focus has left the card',
    ).toBeFocused();
  });
});

test.describe('card--inputs', () => {
  test('records the raised card edge and the focused link outline in forced colours', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit has no forced colours mode; Playwright emulates only the media query',
    );

    const root = await openStory(page, 'card--inputs', {
      args: { raised: true },
    });
    const card = root.getByRole('article');

    await expectItemSheetsApplied(page, ['card']);
    await expect(card).toHaveCSS('display', 'flex');
    await expect(card).toHaveAttribute('data-raised', '');
    await page.emulateMedia({ forcedColors: 'active' });

    await page.keyboard.press('Tab');
    const link = root.getByRole('link', { name: 'Weekend in the hills' });

    await expect(link).toBeFocused();

    // Recorded, not asserted: forced colours are no WCAG 2.2 AA criterion
    // and the card draws no state by colour, so the spec asks only whether
    // the raised card's transparent border shows (card.md, Testing
    // Decisions).
    const edge = await root.getByRole('article').evaluate((element) => {
      const style = getComputedStyle(element);

      return `border ${style.borderTopStyle} ${style.borderTopWidth} ${style.borderTopColor}; box-shadow ${style.boxShadow}`;
    });
    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);

      return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
    });

    test
      .info()
      .annotations.push(
        { type: 'forced-colors card edge', description: edge },
        { type: 'forced-colors link outline', description: outline },
      );
  });
});
