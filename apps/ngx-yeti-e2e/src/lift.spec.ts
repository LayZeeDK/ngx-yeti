import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

interface Reading {
  readonly top: number;
  readonly boxShadow: string;
  readonly translate: string;
  readonly scale: string;
  readonly liftScale: string;
}

/**
 * Upstream bug O2: read geometry only once the lift's and the card's item
 * files have loaded and applied.
 */
async function expectItemsStyled(page: Page): Promise<void> {
  for (const item of ['card', 'lift']) {
    await expect(
      page.locator(`head link[data-ngx-yeti-styles="${item}"]`),
    ).toHaveCount(1);
  }

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.styleSheets].filter(
            ({ ownerNode }) =>
              ownerNode instanceof HTMLLinkElement &&
              ['card', 'lift'].includes(
                ownerNode.dataset['ngxYetiStyles'] ?? '',
              ),
          ).length,
      ),
    )
    .toBe(2);
}

/** The card a link sits in. */
function cardOf(root: Locator, name: string): Locator {
  return root.locator('article').filter({
    has: root.page().getByRole('link', { name }),
  });
}

/** Moves the pointer to the viewport's far corner, off every card. */
async function pointerAway(page: Page): Promise<void> {
  const viewport = page.viewportSize();

  if (viewport === null) {
    throw new Error('No viewport');
  }

  await page.mouse.move(viewport.width - 1, viewport.height - 1);
}

/** Reads the card once its transitions have run out. */
async function settled(card: Locator): Promise<Reading> {
  return card.evaluate(async (element) => {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await Promise.all(
      element.getAnimations().map(async ({ finished }) => finished),
    );
    const style = getComputedStyle(element);

    return {
      top: element.getBoundingClientRect().top,
      boxShadow: style.boxShadow,
      translate: style.translate,
      scale: style.scale,
      liftScale: style.getPropertyValue('--yeti-lift-scale').trim(),
    };
  });
}

test.describe('lift--default', () => {
  test('raises a rise card and deepens its shadow on real hover', async ({
    page,
  }) => {
    const root = await openStory(page, 'lift--default');
    const card = cardOf(root, 'Hover me');

    await expectItemsStyled(page);
    await pointerAway(page);
    const before = await settled(card);

    await card.hover();
    const after = await settled(card);

    expect(after.top).toBeLessThan(before.top);
    expect(after.boxShadow).not.toBe(before.boxShadow);
  });

  test('scales a scale card by --yeti-lift-scale on real hover', async ({
    page,
  }) => {
    const root = await openStory(page, 'lift--default');
    const card = cardOf(root, 'This one grows');

    await expectItemsStyled(page);
    await pointerAway(page);
    await card.hover();
    const { scale, liftScale, translate } = await settled(card);

    expect(liftScale, 'the token is set').not.toBe('');
    expect(Number(scale)).toBeCloseTo(Number(liftScale), 5);
    expect(translate).toBe('none');
  });

  test('keeps a hovered card in place and still deepens its shadow with reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const root = await openStory(page, 'lift--default');
    const card = cardOf(root, 'Hover me');

    await expectItemsStyled(page);
    await pointerAway(page);
    const before = await settled(card);

    await card.hover();
    const after = await settled(card);

    expect(after.top).toBeCloseTo(before.top, 1);
    expect(['none', '0px', '0px 0px']).toContain(after.translate);
    expect(after.boxShadow).not.toBe(before.boxShadow);
  });
});

test.describe('lift--keyboard', () => {
  test('lifts the card on a real Tab to its stretched link', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'Headless WebKit does not move focus on Tab',
    );

    const root = await openStory(page, 'lift--keyboard');
    const link = root.getByRole('link', { name: 'Hover me' });

    await expectItemsStyled(page);
    await pointerAway(page);
    await page.keyboard.press('Tab');

    await expect(link).toBeFocused();
    await expect(link).not.toHaveCSS('outline-style', 'none');
    expect((await settled(cardOf(root, 'Hover me'))).translate).not.toBe(
      'none',
    );
  });

  test('keeps a visible outline on the focused link in forced colours', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'Playwright emulates forced colours in Chromium and Firefox only, and headless WebKit does not move focus on Tab',
    );

    await page.emulateMedia({ forcedColors: 'active' });
    const root = await openStory(page, 'lift--keyboard');
    const link = root.getByRole('link', { name: 'Hover me' });

    await expectItemsStyled(page);
    await page.keyboard.press('Tab');

    await expect(link).toBeFocused();

    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        color: style.outlineColor,
      };
    });

    test.info().annotations.push({
      type: 'forced-colors link outline',
      description: `${outline.style} ${String(outline.width)}px ${outline.color}`,
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThan(0);
  });
});

test.describe('lift--without', () => {
  test('does not move a card without the lift on real hover', async ({
    page,
  }) => {
    const root = await openStory(page, 'lift--without');
    const card = cardOf(root, 'A card that stays put');

    await expectItemsStyled(page);
    await pointerAway(page);
    const before = await settled(card);

    await card.hover();
    const after = await settled(card);

    expect(after.top).toBeCloseTo(before.top, 1);
    expect(after.translate).toBe('none');
  });
});
