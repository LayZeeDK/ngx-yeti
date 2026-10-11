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

/** The used block size of a CSS length, read from a probe in the story. */
async function blockLength(root: Locator, length: string): Promise<number> {
  return root.evaluate((element, value) => {
    const probe = document.createElement('div');
    probe.style.blockSize = value;
    element.append(probe);
    const { height } = probe.getBoundingClientRect();
    probe.remove();

    return height;
  }, length);
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectCoverStyled(
  page: Page,
  cover: Locator,
  items: readonly string[] = ['cover', 'box'],
): Promise<void> {
  await expectItemSheetsApplied(page, items);
  await expect(cover).toHaveCSS('flex-direction', 'column');
}

/** The page's scroll extent beyond the viewport, in px, on each axis. */
async function pageOverflow(
  page: Page,
): Promise<{ inline: number; block: number }> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth, scrollHeight, clientHeight } =
      document.documentElement;

    return {
      inline: scrollWidth - clientWidth,
      block: scrollHeight - clientHeight,
    };
  });
}

async function viewportHeight(page: Page): Promise<number> {
  return page.evaluate(() => window.innerHeight);
}

/**
 * The centred heading's midpoint sits halfway between the `nav`'s bottom
 * and the paragraph's top (Yeti's "centers the data-center child" case).
 */
async function expectHeadingCentred(root: Locator): Promise<void> {
  const nav = await rect(root.getByTestId('nav'));
  const heading = await rect(root.getByTestId('heading'));
  const footnote = await rect(root.getByTestId('footnote'));

  expect(
    Math.abs(
      (heading.top + heading.bottom) / 2 - (nav.bottom + footnote.top) / 2,
    ),
  ).toBeLessThanOrEqual(1);
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 320, height: 640 },
]) {
  const size = `${String(viewport.width)} x ${String(viewport.height)}`;

  test.describe(`cover at ${size}`, () => {
    test.use({ viewport });

    test('cover--default is at least as tall as the viewport, with its heading centred', async ({
      page,
    }) => {
      const root = await openStory(page, 'cover--default');
      const cover = root.getByTestId('cover');

      await expectCoverStyled(page, cover);

      expect((await rect(cover)).height).toBeGreaterThanOrEqual(
        (await viewportHeight(page)) - 0.5,
      );
      await expectHeadingCentred(root);
    });

    test('a half band is half the viewport, and an md band is the md height and shorter than a full one', async ({
      page,
    }) => {
      const half = await openStory(page, 'cover--settings', {
        args: { height: 'half' },
      });

      await expectCoverStyled(page, half.getByTestId('cover'), ['cover']);
      await expect(half.getByTestId('cover')).toHaveAttribute(
        'data-height',
        'half',
      );
      expect(
        Math.abs(
          (await rect(half.getByTestId('cover'))).height -
            (await viewportHeight(page)) / 2,
        ),
      ).toBeLessThanOrEqual(1);

      const full = await openStory(page, 'cover--settings', {
        args: { height: 'full' },
      });

      await expectCoverStyled(page, full.getByTestId('cover'), ['cover']);

      const fullHeight = (await rect(full.getByTestId('cover'))).height;
      const md = await openStory(page, 'cover--settings', {
        args: { height: 'md' },
      });
      const mdCover = md.getByTestId('cover');

      await expectCoverStyled(page, mdCover, ['cover']);

      const mdHeight = (await rect(mdCover)).height;

      expect(
        Math.abs(mdHeight - (await blockLength(md, 'var(--yeti-height-md)'))),
      ).toBeLessThanOrEqual(1);
      expect(mdHeight).toBeLessThan(fullHeight);
    });
  });
}

test.describe('cover--default at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('has no horizontal overflow', async ({ page }) => {
    const root = await openStory(page, 'cover--default');

    await expectCoverStyled(page, root.getByTestId('cover'));

    expect((await pageOverflow(page)).inline).toBeLessThanOrEqual(0);
  });
});

/**
 * The band grows past the viewport, its content's bottom stays inside it,
 * and the page scrolls in the block direction only (WCAG 1.4.4, 1.4.10).
 */
for (const { name, viewport, zoom } of [
  {
    name: 'grows past a 320 x 256 viewport',
    viewport: { width: 320, height: 256 },
    zoom: false,
  },
  // 640 px at 200 % text zoom is the 320 CSS px of WCAG 1.4.10; narrower,
  // a zoomed word can be wider than the column.
  {
    name: 'grows past a 640 x 360 viewport with 200 % text zoom',
    viewport: { width: 640, height: 360 },
    zoom: true,
  },
]) {
  test.describe('cover--default when its content outgrows the viewport', () => {
    test.use({ viewport });

    test(`${name} and scrolls in the block direction only`, async ({
      page,
    }) => {
      const root = await openStory(page, 'cover--default');

      await expectCoverStyled(page, root.getByTestId('cover'));

      if (zoom) {
        // Text zoom: the root font size at 200 %, so every rem doubles.
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      }

      const cover = await rect(root.getByTestId('cover'));
      const footnote = await rect(root.getByTestId('footnote'));
      const overflow = await pageOverflow(page);

      expect(cover.height).toBeGreaterThan(await viewportHeight(page));
      expect(footnote.bottom).toBeLessThanOrEqual(cover.bottom + 0.5);
      expect(overflow.block).toBeGreaterThan(0);
      expect(overflow.inline).toBeLessThanOrEqual(0);
    });
  });
}
