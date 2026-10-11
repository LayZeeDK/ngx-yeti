import { composite, contrastRatio } from '@ngx-yeti/testing';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';

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

function centre(box: Box): { readonly x: number; readonly y: number } {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
}

function expectCentredOn(
  box: Box,
  target: { readonly x: number; readonly y: number },
): void {
  expect(Math.abs(centre(box).x - target.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(centre(box).y - target.y)).toBeLessThanOrEqual(1);
}

/**
 * The used length of a public token, read from a probe in the story, so no
 * assertion depends on a token's default (overlay.md, Testing Decisions).
 */
async function token(scope: Locator, name: string): Promise<number> {
  return scope.evaluate((element, property) => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.inlineSize = `var(${property})`;
    element.append(probe);
    const { width } = probe.getBoundingClientRect();
    probe.remove();

    return width;
  }, name);
}

/** Upstream bug O2: read geometry only once the overlay's sheet has applied. */
async function expectOverlayStyled(
  page: Page,
  overlay: Locator,
): Promise<void> {
  await expectItemSheetsApplied(page, ['overlay']);
  await expect(overlay).toHaveCSS('position', 'relative');
}

/** How far the page's content is wider than the viewport, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

async function viewportCentre(
  page: Page,
): Promise<{ readonly x: number; readonly y: number }> {
  return page.evaluate(() => ({
    x: document.documentElement.clientWidth / 2,
    y: document.documentElement.clientHeight / 2,
  }));
}

const viewports = [
  { width: 1280, height: 800 },
  { width: 320, height: 640 },
] as const;

for (const viewport of viewports) {
  const size = `${String(viewport.width)} x ${String(viewport.height)}`;

  test.describe(`overlay at ${size}`, () => {
    test.use({ viewport });

    test('centres the held child over the box, smaller than it, while the rest flows as usual', async ({
      page,
    }) => {
      const root = await openStory(page, 'overlay--default');
      const overlay = root.getByTestId('overlay');

      await expectOverlayStyled(page, overlay);

      const [box, held, picture] = await Promise.all([
        rect(overlay),
        rect(root.getByTestId('overlay-held')),
        rect(root.getByTestId('overlay-picture')),
      ]);

      expectCentredOn(held, centre(box));
      expect(picture.top).toBeCloseTo(box.top, 0);
      expect(held.height).toBeLessThan(box.height);
      expect(held.width).toBeLessThan(box.width);
    });

    test('covers the box on every edge with fill', async ({ page }) => {
      const root = await openStory(page, 'overlay--settings', {
        args: { over: true, fill: true },
      });
      const overlay = root.getByTestId('overlay');
      const held = root.getByTestId('held');

      await expect(held).toHaveAttribute('data-fill', '');
      await expectOverlayStyled(page, overlay);

      const [box, filled] = await Promise.all([rect(overlay), rect(held)]);

      expect(filled.left).toBeCloseTo(box.left, 0);
      expect(filled.top).toBeCloseTo(box.top, 0);
      expect(filled.width).toBeCloseTo(box.width, 0);
      expect(filled.height).toBeCloseTo(box.height, 0);
    });

    test('centres a fixed held child on the viewport before and after scrolling', async ({
      page,
    }) => {
      const root = await openStory(page, 'overlay--fixed');
      const held = root.getByTestId('held');

      await expectOverlayStyled(page, root.getByTestId('overlay'));
      await expect(held).toHaveCSS('position', 'fixed');

      expectCentredOn(await rect(held), await viewportCentre(page));

      await page.mouse.wheel(0, viewport.height);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(0);

      expectCentredOn(await rect(held), await viewportCentre(page));
    });

    test('keeps the held child centred under dir="rtl"', async ({ page }) => {
      const root = await openStory(page, 'overlay--rtl');
      const overlay = root.getByTestId('overlay');

      await expectOverlayStyled(page, overlay);

      const [held, box] = await Promise.all([
        rect(root.getByTestId('overlay-held')),
        rect(overlay),
      ]);

      expect(Math.abs(centre(held).x - centre(box).x)).toBeLessThanOrEqual(1);
      expect(Math.abs(centre(held).y - centre(box).y)).toBeLessThanOrEqual(1);
    });
  });
}

test.describe('overlay at a 320 px viewport', () => {
  for (const id of [
    'overlay--default',
    'overlay--settings',
    'overlay--veil',
    'overlay--scrolls',
    'overlay--rtl',
  ]) {
    test(`${id} reflows without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      const root = await openStory(page, id);

      await expectOverlayStyled(page, root.locator('[yetioverlay]').first());
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('overlay--default at 200 % text zoom', () => {
  test('keeps the held child inside the box minus the gap, scrolling rather than clipping', async ({
    page,
  }) => {
    const root = await openStory(page, 'overlay--default');
    const overlay = root.getByTestId('overlay');
    const held = root.getByTestId('overlay-held');

    await expectOverlayStyled(page, overlay);
    // Text zoom: the root font size at 200 %, so every rem doubles.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    const gap = await token(overlay, '--yeti-space-md');
    const [box, child] = await Promise.all([rect(overlay), rect(held)]);

    expect(child.left).toBeGreaterThanOrEqual(box.left + gap - 1);
    expect(child.right).toBeLessThanOrEqual(box.right - gap + 1);
    expect(child.top).toBeGreaterThanOrEqual(box.top + gap - 1);
    expect(child.bottom).toBeLessThanOrEqual(box.bottom - gap + 1);
    await expect(held).toHaveCSS('overflow-y', 'auto');

    // Whatever does not fit is reachable by scrolling inside the held child.
    const reachable = await held.evaluate((element) => {
      element.scrollTop = element.scrollHeight;

      return (
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1
      );
    });

    expect(reachable).toBe(true);
  });
});

test.describe('overlay--veil', () => {
  test('never lets Tab reach a covered control while the veil shows', async ({
    page,
  }) => {
    const root = await openStory(page, 'overlay--veil');
    const toggle = root.getByTestId('toggle');
    const input = root.getByTestId('form-input');

    await expectOverlayStyled(page, root.getByTestId('form'));
    await toggle.click();
    await expect(root.getByTestId('form-veil')).toBeVisible();
    await toggle.focus();

    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab');
      await expect(input).not.toBeFocused();
      await expect(root.getByTestId('dark-input')).not.toBeFocused();
    }

    await toggle.click();
    await expect(root.getByTestId('form-veil')).toHaveCount(0);
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
  });

  // The scrim's ratio, written down per engine and scheme; the play function
  // asserts it.
  test("records the message's contrast over the scrim", async ({
    browserName,
    page,
  }) => {
    const root = await openStory(page, 'overlay--veil');

    await expectOverlayStyled(page, root.getByTestId('form'));
    await root.getByTestId('toggle').click();

    for (const id of ['form', 'dark']) {
      const veil = root.getByTestId(`${id}-veil`);
      const scrim = await veil.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      const color = await root
        .getByTestId(`${id}-message`)
        .evaluate((element) => getComputedStyle(element).color);
      const ratios = ['#000', '#fff'].map((backdrop) =>
        contrastRatio(color, composite(scrim, backdrop)),
      );

      test.info().annotations.push({
        type: 'veil-scrim-ratio',
        description: `${browserName}, ${id === 'form' ? 'light' : 'dark'}: ${ratios.map((ratio) => ratio.toFixed(3)).join(' on black, ')} on white`,
      });

      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

test.describe('overlay--scrolls', () => {
  test('takes focus with Tab and scrolls with the arrow keys', async ({
    page,
  }) => {
    const root = await openStory(page, 'overlay--scrolls');
    const held = root.getByTestId('held');

    await expectOverlayStyled(page, root.getByTestId('overlay'));
    await page.keyboard.press('Tab');
    await expect(held).toBeFocused();
    expect(await held.evaluate((element) => element.scrollTop)).toBe(0);

    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() => held.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
  });
});
