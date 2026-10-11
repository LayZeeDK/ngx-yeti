import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

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

/**
 * The container width at which the pair switches, twice the sidebar's width
 * plus the gap, read from a probe so no assertion depends on a token's
 * default (sidebar.md, Testing Decisions).
 */
async function switchWidth(frame: Locator): Promise<number> {
  return frame.evaluate((element) => {
    const probe = document.createElement('div');
    probe.style.inlineSize =
      'calc(2 * (var(--yeti-width-xs) + var(--yeti-space-lg)))';
    element.append(probe);
    const { width } = probe.getBoundingClientRect();
    probe.remove();

    return width;
  });
}

type Arrangement = 'side by side' | 'stacked' | 'neither';

/**
 * Sizes the container to `width` px and reads how the sidebar's two
 * children sit: side by side means equal tops; stacked means the second
 * starts below the first and both are as wide as the sidebar.
 */
async function arrangement(
  frame: Locator,
  width: number | null,
): Promise<Arrangement> {
  return frame.evaluate((element, inlineSize): Arrangement => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('The frame is not an HTML element');
    }

    if (inlineSize !== null) {
      element.style.inlineSize = `${String(inlineSize)}px`;
    }

    const sidebar = element.querySelector('[yetisidebar]');
    const [first, second] = sidebar === null ? [] : [...sidebar.children];

    if (sidebar === null || first === undefined || second === undefined) {
      throw new Error('The story has no sidebar with two children');
    }

    const [a, b, box] = [first, second, sidebar].map((node) =>
      node.getBoundingClientRect(),
    );

    if (a === undefined || b === undefined || box === undefined) {
      throw new Error('No box');
    }

    if (Math.abs(a.top - b.top) <= 1) {
      return 'side by side';
    }

    return Math.max(a.top, b.top) >= Math.min(a.bottom, b.bottom) - 0.5 &&
      Math.abs(a.width - box.width) <= 1 &&
      Math.abs(b.width - box.width) <= 1
      ? 'stacked'
      : 'neither';
  }, width);
}

/** Upstream bug O2: read geometry only once the item sheets have applied. */
async function expectSidebarStyled(page: Page, root: Locator): Promise<void> {
  await expectItemSheetsApplied(page, ['sidebar', 'box']);
  await expect(root.locator('[yetisidebar]').first()).toHaveCSS(
    'flex-wrap',
    'wrap',
  );
}

/** How far the page's content is wider than the viewport, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    return scrollWidth - clientWidth;
  });
}

test.describe('sidebar across the switching width', () => {
  // The container, not the viewport, is resized across the switch.
  for (const id of ['sidebar--default', 'sidebar--end']) {
    test(`${id} sits side by side above the switching width and stacks below it`, async ({
      page,
    }) => {
      const root = await openStory(page, id);
      const frame = root.getByTestId('frame');

      await expectSidebarStyled(page, root);

      const stop = await switchWidth(frame);

      expect(await arrangement(frame, stop + 32)).toBe('side by side');
      expect(await arrangement(frame, stop - 32)).toBe('stacked');
      expect(await arrangement(frame, stop + 32)).toBe('side by side');
    });
  }
});

test.describe('sidebar--default', () => {
  test('stacks at a 320 px viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(page, 'sidebar--default');
    const frame = root.getByTestId('frame');

    await expectSidebarStyled(page, root);

    // The story's frame scrolls its overflow so it can be resized by hand;
    // reflow is about the page, so let the overflow reach it.
    await frame.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.style.overflow = '';
        element.style.resize = '';
      }
    });

    expect(await arrangement(frame, null)).toBe('stacked');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('raises its switching width with 200 % text zoom', async ({ page }) => {
    const root = await openStory(page, 'sidebar--default');
    const frame = root.getByTestId('frame');

    await expectSidebarStyled(page, root);

    const stop = await switchWidth(frame);

    expect(await arrangement(frame, stop + 4)).toBe('side by side');

    // Text zoom: the root font size at 200 %, so every rem doubles.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomedStop = await switchWidth(frame);

    expect(zoomedStop).toBeGreaterThan(stop + 4);
    expect(await arrangement(frame, stop + 4)).toBe('stacked');
    expect(await arrangement(frame, zoomedStop + 4)).toBe('side by side');
  });
});

/** One Shift+Tab step of the walk: where the focused link and the nav sit. */
interface WalkStep {
  readonly link: number;
  readonly box: Box;
  readonly nav: Box;
}

/**
 * Focuses the article's last link, then presses Shift+Tab back through every
 * earlier article link, and returns where each focused link and the stuck
 * `nav` sat.
 */
async function walkBack(page: Page, root: Locator): Promise<WalkStep[]> {
  const nav = root.getByTestId('nav');
  const links = root.getByTestId('article').getByRole('link');
  const count = await links.count();
  const steps: WalkStep[] = [];

  expect(count).toBeGreaterThan(1);

  await links.last().focus();

  for (let index = count - 2; index >= 0; index--) {
    const link = links.nth(index);

    await page.keyboard.press('Shift+Tab');
    await expect(link).toBeFocused();
    steps.push({
      link: index + 1,
      box: await rect(link),
      nav: await rect(nav),
    });
  }

  return steps;
}

/** Whether some of `box` shows between the nav's bottom and the viewport's. */
function partlyVisible(step: WalkStep, viewportHeight: number): boolean {
  return (
    step.box.bottom > Math.max(step.nav.bottom, 0) &&
    step.box.top < viewportHeight
  );
}

test.describe('sidebar--sticky stacked at 320 x 640', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  // WCAG 2.4.11, ledger row A11Y-22 with usage rule 4 followed: the stuck
  // `nav` comes first in the stacked order, so the root's scroll padding is
  // set to its height.
  test('keeps every link that Shift+Tab focuses at least partly visible below the stuck nav, with the scroll padding set to its height', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'sidebar--sticky');
    const nav = root.getByTestId('nav');

    await expectSidebarStyled(page, root);
    expect(await arrangement(root.getByTestId('frame'), null)).toBe('stacked');
    await expect(nav).toHaveAttribute('data-sticky', '');

    await page.evaluate(
      (height) => {
        document.documentElement.style.setProperty(
          '--yeti-scroll-padding',
          `${String(height)}px`,
        );
      },
      (await rect(nav)).height,
    );

    const steps = await walkBack(page, root);

    test.info().annotations.push({
      type: 'a11y-22-walk',
      description: `${browserName}, rule 4 followed: ${steps.map((step) => `link ${String(step.link)} ${String(Math.round(step.box.top))} to ${String(Math.round(step.box.bottom))} px, nav bottom ${String(Math.round(step.nav.bottom))} px`).join('; ')}`,
    });

    for (const step of steps) {
      expect(
        partlyVisible(step, 640),
        `link ${String(step.link)} (${String(step.box.top)} to ${String(step.box.bottom)}) is hidden by the stuck nav (bottom ${String(step.nav.bottom)})`,
      ).toBe(true);
    }
  });

  // Recorded, not asserted (ticket 50 decision 47): the evidence for ledger
  // row A11Y-22 with Yeti's default scroll padding.
  test('records the same walk with the default scroll padding', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'sidebar--sticky');

    await expectSidebarStyled(page, root);

    const steps = await walkBack(page, root);
    const hidden = steps.filter((step) => !partlyVisible(step, 640));

    expect(steps.length, 'the walk focused every earlier link').toBe(
      (await root.getByTestId('article').getByRole('link').count()) - 1,
    );

    test.info().annotations.push({
      type: 'a11y-22-default-padding',
      description: `${browserName}: ${String(hidden.length)} of ${String(steps.length)} focused links fully hidden by the stuck nav${hidden.length === 0 ? '' : ` (links ${hidden.map((step) => String(step.link)).join(', ')})`}`,
    });
  });
});
