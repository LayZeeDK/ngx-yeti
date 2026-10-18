import {
  composite,
  contrastRatio,
  parseColor,
  type SrgbColor,
} from '@ngx-yeti/testing';
import {
  expectItemSheetsApplied,
  horizontalOverflow,
  rect,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

/** Opens an icon story and waits until Yeti's icon file styles its SVGs. */
async function openIconStory(page: Page, id: string): Promise<Locator> {
  const root = await openStory(page, id);

  await expectItemSheetsApplied(page, ['icon']);
  await expect(root.locator('[yetiicon] > svg').first()).toHaveCSS(
    'flex-shrink',
    '0',
  );

  return root;
}

async function fontSize(host: Locator): Promise<number> {
  return host.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
}

/** Expects the host's SVG to be one em of the host's computed `font-size`. */
async function expectOneEm(host: Locator): Promise<void> {
  const svg = await rect(host.locator('> svg'));
  const em = await fontSize(host);

  expect(svg.width).toBeCloseTo(em, 1);
  expect(svg.height).toBeCloseTo(em, 1);
}

/**
 * The colour the glyph is drawn in, which is its path's stroke, and every
 * background behind it, the nearest first.
 */
async function glyphColours(
  svg: Locator,
): Promise<{ stroke: string; backgrounds: string[] }> {
  return svg.evaluate((node) => {
    const backgrounds: string[] = [];
    const path = node.querySelector('path');

    if (path === null) {
      throw new Error('The SVG holds no path');
    }

    for (
      let current: Element | null = node;
      current !== null;
      current = current.parentElement
    ) {
      for (const transition of current.getAnimations()) {
        transition.finish();
      }

      backgrounds.push(getComputedStyle(current).backgroundColor);
    }

    return { stroke: getComputedStyle(path).stroke, backgrounds };
  });
}

/** Composites the backgrounds down to the nearest opaque one. */
function effectiveBackground(backgrounds: readonly string[]): SrgbColor {
  const opaque = backgrounds.findIndex(
    (background) => parseColor(background).alpha === 1,
  );

  if (opaque < 0) {
    throw new Error('No opaque background behind the element');
  }

  return backgrounds
    .slice(0, opaque)
    .reduceRight<SrgbColor>(
      (backdrop, layer) => composite(layer, backdrop),
      parseColor(backgrounds[opaque] ?? ''),
    );
}

test.describe('icon--default', () => {
  test('sizes each SVG to one em and centres it on its label', async ({
    page,
  }) => {
    const root = await openIconStory(page, 'icon--default');

    await expectItemSheetsApplied(page, ['button', 'cluster']);

    for (const host of [
      root.getByRole('link', { name: 'Download' }),
      root.getByRole('button', { name: 'Save' }),
    ]) {
      await expectOneEm(host);

      const svg = await rect(host.locator('> svg'));
      const label = await rect(host.locator('> span'));

      expect((svg.top + svg.bottom) / 2).toBeCloseTo(
        (label.top + label.bottom) / 2,
        0,
      );
    }
  });
});

test.describe('icon--settings', () => {
  test('sets the SVG of a baseline icon on the baseline with the nudge', async ({
    page,
  }) => {
    const root = await openIconStory(page, 'icon--settings');
    const host = root.getByTestId('static');
    const svg = host.locator('> svg');

    await expect(host).toHaveAttribute('data-align', 'baseline');
    await expect(host).not.toHaveAttribute('align');
    await expect(svg).not.toHaveCSS('translate', 'none');
    await expectOneEm(host);

    const nudged = await rect(svg);
    const baseline = await rect(root.getByTestId('probe'));

    expect(
      Math.abs(
        nudged.bottom - baseline.bottom - 0.125 * (await fontSize(host)),
      ),
    ).toBeLessThan(1);
  });
});

test.describe('icon--in-text', () => {
  test('has no horizontal overflow at a 320 px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    const root = await openIconStory(page, 'icon--in-text');

    for (const id of ['heading', 'item', 'note']) {
      await expectOneEm(root.getByTestId(id));
    }

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('keeps each SVG one em of its text at 200 % text zoom', async ({
    page,
  }) => {
    const root = await openIconStory(page, 'icon--in-text');
    const hosts = ['heading', 'item', 'note'].map((id) => root.getByTestId(id));
    const before = await Promise.all(hosts.map((host) => fontSize(host)));

    // Text zoom: the root font size at 200 %, so every rem doubles.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    for (const [index, host] of hosts.entries()) {
      expect(await fontSize(host)).toBeCloseTo((before[index] ?? 0) * 2, 0);
      await expectOneEm(host);
    }
  });
});

test.describe('icon--standalone', () => {
  test('draws each meaningful glyph at least 3:1 against its background under forced colours', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit has no forced colours mode; Playwright emulates only the media query',
    );

    await page.emulateMedia({ forcedColors: 'active' });

    const root = await openIconStory(page, 'icon--standalone');
    const glyphs = root.locator('svg[role="img"]');

    await expectItemSheetsApplied(page, ['button']);
    await expect(glyphs).toHaveCount(4);

    for (const glyph of await glyphs.all()) {
      const { stroke, backgrounds } = await glyphColours(glyph);
      const ratio = contrastRatio(stroke, effectiveBackground(backgrounds));

      test.info().annotations.push({
        type: 'forced-colors glyph',
        description: `${browserName}, ${(await glyph.getAttribute('aria-label')) ?? ''}: stroke ${stroke}, ${ratio.toFixed(2)}:1`,
      });
      expect(ratio).toBeGreaterThanOrEqual(3);
    }
  });
});
