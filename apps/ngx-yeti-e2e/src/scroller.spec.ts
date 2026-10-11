import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectItemSheetsApplied } from './item-styles';
import { openStory } from './open-story';

const stories = [
  'scroller--default',
  'scroller--keyboard',
  'scroller--settings',
  'scroller--media',
  'scroller--rtl',
] as const;

const viewports = [
  { width: 1280, height: 800 },
  { width: 320, height: 640 },
] as const;

/** Upstream bug O2: read geometry only once the scroller's sheet has applied. */
async function expectScrollerStyled(
  page: Page,
  scroller: Locator,
): Promise<void> {
  await expectItemSheetsApplied(page, ['scroller']);
  await expect(scroller).toHaveCSS('display', 'flex');
}

async function scrollLeft(scroller: Locator): Promise<number> {
  return scroller.evaluate((element) => element.scrollLeft);
}

/** The elements axe's `scrollable-region-focusable` rule reports, as HTML. */
/** Waits until a smooth scroll comes to rest and returns where it stopped. */
async function settledScrollLeft(scroller: Locator): Promise<number> {
  let previous = Number.NaN;

  await expect
    .poll(async () => {
      const current = await scrollLeft(scroller);
      const settled = current === previous;
      previous = current;

      return settled;
    })
    .toBe(true);

  return previous;
}

async function scrollableRegionViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .include('#storybook-root')
    .withRules(['scrollable-region-focusable'])
    .analyze();

  return violations.flatMap((violation) =>
    violation.nodes.map((node) => node.html),
  );
}

test.describe('scroller--keyboard', () => {
  for (const viewport of viewports) {
    test(`is focused by Tab and scrolled by the arrow keys at ${String(viewport.width)} x ${String(viewport.height)}`, async ({
      browserName,
      page,
    }) => {
      await page.setViewportSize(viewport);

      const root = await openStory(page, 'scroller--keyboard');
      const scroller = root.getByTestId('scroller');
      const button = root.getByRole('button', { name: 'Before the strip' });

      await expectScrollerStyled(page, scroller);

      // WebKit does not focus a button on click, so the walk starts from a
      // button focused by script there (scroller.md, layer 4).
      await (browserName === 'webkit' ? button.focus() : button.click());
      await page.keyboard.press('Tab');

      await expect(scroller).toBeFocused();
      expect(await scrollLeft(scroller)).toBe(0);

      await page.keyboard.press('ArrowRight');
      await expect.poll(() => scrollLeft(scroller)).toBeGreaterThan(0);

      const scrolled = await settledScrollLeft(scroller);

      await page.keyboard.press('ArrowLeft');
      await expect.poll(() => scrollLeft(scroller)).toBeLessThan(scrolled);

      await page.keyboard.press('Tab');
      await expect(
        root.getByRole('button', { name: 'After the strip' }),
      ).toBeFocused();
    });
  }

  test('passes scrollable-region-focusable only through its tabindex', async ({
    page,
  }) => {
    const root = await openStory(page, 'scroller--keyboard');
    const scroller = root.getByTestId('scroller');

    await expectScrollerStyled(page, scroller);
    expect(
      await scroller.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
      'the scroller overflows, so the rule applies',
    ).toBe(true);

    expect(await scrollableRegionViolations(page)).toEqual([]);

    await scroller.evaluate((element) => {
      element.removeAttribute('tabindex');
    });

    const violations = await scrollableRegionViolations(page);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('data-testid="scroller"');
  });
});

test.describe('scroller--rtl', () => {
  test('scrolls toward the last item with ArrowLeft, to a negative scrollLeft', async ({
    page,
  }) => {
    const root = await openStory(page, 'scroller--rtl');
    const scroller = root.getByTestId('scroller');

    await expectScrollerStyled(page, scroller);

    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => scrollLeft(scroller)).toBeLessThan(0);
  });
});

test.describe('scroller--settings', () => {
  test('settles the third item at the centre of the track with snap and justify="center"', async ({
    page,
  }) => {
    const root = await openStory(page, 'scroller--settings', {
      args: { snap: true, justify: 'center', width: 'sm' },
    });
    const scroller = root.getByTestId('scroller');

    await expect(scroller).toHaveAttribute('data-justify', 'center');
    await expectScrollerStyled(page, scroller);

    await scroller.evaluate((element) => {
      const third = element.children[2];

      if (!(third instanceof HTMLElement)) {
        throw new Error('The scroller has a third item');
      }

      element.scrollLeft = third.offsetLeft;
    });
    // Snapping settles within the spec's 400 ms (scroller.md, layer 4).
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 400);
        }),
    );

    const offset = await scroller.evaluate((element) => {
      const third = element.children[2];

      if (third === undefined) {
        throw new Error('The scroller has a third item');
      }

      const track = element.getBoundingClientRect();
      const item = third.getBoundingClientRect();

      return (item.left + item.right) / 2 - (track.left + track.right) / 2;
    });

    expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  });
});

test.describe('at a 320 x 640 viewport', () => {
  for (const story of stories) {
    test(`${story} scrolls inside its scroller while the page has no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });

      const root = await openStory(page, story);
      const scroller = root.getByTestId('scroller');

      await expectScrollerStyled(page, scroller);

      expect(
        await scroller.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        ),
      ).toBeGreaterThan(0);
      expect(
        await page.evaluate(() => {
          const { scrollWidth, clientWidth } = document.documentElement;

          return scrollWidth - clientWidth;
        }),
      ).toBeLessThanOrEqual(0);
    });
  }
});
