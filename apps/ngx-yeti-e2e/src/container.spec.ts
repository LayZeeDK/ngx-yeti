import {
  expectItemSheetsApplied,
  resize,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

/** The content-box inline size a container query measures, in px. */
async function contentWidth(container: Locator): Promise<number> {
  return container.evaluate((element) => {
    const style = getComputedStyle(element);
    const edges = [
      style.paddingLeft,
      style.paddingRight,
      style.borderLeftWidth,
      style.borderRightWidth,
    ].reduce((sum, value) => sum + Number.parseFloat(value), 0);

    return element.getBoundingClientRect().width - edges;
  });
}

/** Sizes `stage`, which `container` fills, to give it a `width` px content box. */
async function fitContainer(
  stage: Locator,
  container: Locator,
  width: number,
): Promise<void> {
  const edges =
    (await container.evaluate(
      (element) => element.getBoundingClientRect().width,
    )) - (await contentWidth(container));

  await resize(stage, width + edges);
  await expect.poll(() => contentWidth(container)).toBeCloseTo(width, 1);
}

/**
 * Sets the viewport to the widest whole px at which `container`, at its full
 * width, has a content box below `width` px, or to the narrowest at which it
 * reaches `width`. A viewport is a whole number of px and the content box is
 * not, so the two sides are one viewport px apart. A scrollbar that comes or
 * goes changes the offset, so it corrects up to three times.
 */
async function fitViewport(
  page: Page,
  container: Locator,
  width: number,
  side: 'below' | 'reached',
): Promise<void> {
  const fits = (content: number): boolean =>
    side === 'reached'
      ? content >= width && content < width + 1
      : content < width && content >= width - 1;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const viewport = page.viewportSize();

    if (viewport === null) {
      throw new Error('The page has no viewport');
    }

    const content = await contentWidth(container);

    if (fits(content)) {
      break;
    }

    const reached = Math.ceil(viewport.width + width - content);

    await page.setViewportSize({
      width: side === 'reached' ? reached : reached - 1,
      height: viewport.height,
    });
  }

  await expect
    .poll(async () => fits(await contentWidth(container)), {
      message: `the content box is one viewport px ${side === 'reached' ? 'at or above' : 'below'} ${String(width)} px`,
    })
    .toBe(true);
}

async function isDisplayed(element: Locator): Promise<boolean> {
  return element.evaluate(
    (target) => getComputedStyle(target).display !== 'none',
  );
}

const defaultCases = [
  {
    threshold: 'sm',
    below: { links: 2, shown: 0 },
    at: { links: 4, shown: 1 },
  },
  {
    threshold: 'md',
    below: { links: 4, shown: 1 },
    at: { links: 6, shown: 2 },
  },
  {
    threshold: 'lg',
    below: { links: 6, shown: 2 },
    at: { links: 7, shown: 3 },
  },
] as const;

/** Expects the link count and the one displayed paragraph of Yeti's example. */
async function expectDefaultState(
  container: Locator,
  { links, shown }: { readonly links: number; readonly shown: number },
): Promise<void> {
  await expect(
    container.getByRole('navigation', { name: 'Site' }).getByRole('link'),
  ).toHaveCount(links);

  const paragraphs = container.locator(':scope > p');
  const displayed: boolean[] = [];

  for (const paragraph of await paragraphs.all()) {
    displayed.push(await isDisplayed(paragraph));
  }

  expect(displayed).toEqual([0, 1, 2, 3].map((index) => index === shown));
}

test.describe('container--default', () => {
  test('shows the links and paragraph of each threshold as the container is resized', async ({
    page,
  }) => {
    const root = await openStory(page, 'container--default');
    const stage = root.getByTestId('stage');
    const container = root.getByTestId('container');
    const viewport = page.viewportSize();

    await expectItemSheetsApplied(page, ['container', 'box', 'cluster']);
    await expect(container).toHaveCSS('container-type', 'inline-size');

    for (const { threshold, below, at } of defaultCases) {
      // Read from a probe, so no assertion depends on a token's default
      // (container.md, Testing Decisions).
      const width = await usedLength(root, `var(--yeti-width-${threshold})`);

      await fitContainer(stage, container, width - 1);
      await expectDefaultState(container, below);

      await fitContainer(stage, container, width);
      await expectDefaultState(container, at);
    }

    expect(page.viewportSize(), 'the viewport never changed').toEqual(viewport);
  });

  test('shows the links and paragraph of each threshold as the viewport is resized', async ({
    page,
  }) => {
    const root = await openStory(page, 'container--default');
    const container = root.getByTestId('container');

    await expectItemSheetsApplied(page, ['container', 'box', 'cluster']);
    await expect(container).toHaveCSS('container-type', 'inline-size');

    for (const { threshold, below, at } of defaultCases) {
      const width = await usedLength(root, `var(--yeti-width-${threshold})`);

      await fitViewport(page, container, width, 'below');
      await expectDefaultState(container, below);

      await fitViewport(page, container, width, 'reached');
      await expectDefaultState(container, at);
    }
  });
});

test.describe('container--show-hide', () => {
  test('swaps the pair at md as the container is resized', async ({ page }) => {
    const root = await openStory(page, 'container--show-hide');
    const section = root.getByTestId('section');
    const wide = root.getByTestId('wide');
    const narrow = root.getByTestId('narrow');

    await expectItemSheetsApplied(page, ['container']);
    await expect(section).toHaveCSS('container-type', 'inline-size');

    const md = await usedLength(root, 'var(--yeti-width-md)');

    await fitContainer(section, section, md - 1);
    await expect(wide).toBeHidden();
    await expect(narrow).toBeVisible();

    await fitContainer(section, section, md);
    await expect(wide).toBeVisible();
    await expect(narrow).toBeHidden();
  });

  test('swaps the pair at md as the viewport is resized', async ({ page }) => {
    const root = await openStory(page, 'container--show-hide');
    const section = root.getByTestId('section');
    const wide = root.getByTestId('wide');
    const narrow = root.getByTestId('narrow');

    await expectItemSheetsApplied(page, ['container']);
    await expect(section).toHaveCSS('container-type', 'inline-size');

    const md = await usedLength(root, 'var(--yeti-width-md)');

    await fitViewport(page, section, md, 'below');
    await expect(wide).toBeHidden();
    await expect(narrow).toBeVisible();

    await fitViewport(page, section, md, 'reached');
    await expect(wide).toBeVisible();
    await expect(narrow).toBeHidden();
  });

  test('makes two decisions with one markup in a narrow sidebar and a full-width section', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const root = await openStory(page, 'container--show-hide');
    const section = root.getByTestId('section');

    await expectItemSheetsApplied(page, ['container']);
    await expect(section).toHaveCSS('container-type', 'inline-size');
    expect(await contentWidth(section)).toBeGreaterThanOrEqual(
      await usedLength(root, 'var(--yeti-width-md)'),
    );

    await expect(root.getByTestId('wide')).toBeVisible();
    await expect(root.getByTestId('narrow')).toBeHidden();
    await expect(root.getByTestId('sidebar-wide')).toBeHidden();
    await expect(root.getByTestId('sidebar-narrow')).toBeVisible();
  });
});
