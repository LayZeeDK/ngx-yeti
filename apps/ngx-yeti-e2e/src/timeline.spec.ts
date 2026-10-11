import {
  expectItemSheetsApplied,
  resize,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './open-story';
import { skipUnlessTabReachesLinks } from './tab-to-links';

interface Geometry {
  readonly left: number;
  readonly right: number;
  /** The rail's centre, in viewport coordinates. */
  readonly rail: number;
  readonly entries: readonly {
    readonly left: number;
    readonly right: number;
    readonly top: number;
  }[];
}

async function geometry(list: Locator): Promise<Geometry> {
  return list.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const rail = getComputedStyle(element, '::before');

    return {
      left: box.left,
      right: box.right,
      rail: box.left + parseFloat(rail.left) + parseFloat(rail.width) / 2,
      entries: [...element.children].map((entry) => {
        const { left, right, top } = entry.getBoundingClientRect();

        return { left, right, top };
      }),
    };
  });
}

/** Single-sided: every entry starts at the same edge, beside a start rail. */
async function expectSingleSided(list: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        new Set(
          (await geometry(list)).entries.map(({ left }) => Math.round(left)),
        ).size,
      { message: 'every entry starts at the same edge' },
    )
    .toBe(1);

  const { left, rail } = await geometry(list);

  expect(rail - left).toBeLessThan(20);
}

/**
 * Alternating: a centred rail, odd entries ending before it and even ones
 * starting after it, each entry below the one before (Yeti's
 * timeline.spec.js).
 */
async function expectAlternating(list: Locator): Promise<void> {
  await expect
    .poll(
      async () => {
        const { left, right, rail } = await geometry(list);

        return Math.abs(rail - (left + right) / 2);
      },
      { message: 'the rail is centred' },
    )
    .toBeLessThanOrEqual(1);

  const { left, right, entries } = await geometry(list);
  const middle = (left + right) / 2;

  expect(entries.length).toBeGreaterThan(2);

  for (const [index, entry] of entries.entries()) {
    if (index % 2 === 0) {
      expect(entry.left).toBeCloseTo(left, 0);
      expect(entry.right).toBeLessThanOrEqual(middle);
    } else {
      expect(entry.right).toBeCloseTo(right, 0);
      expect(entry.left).toBeGreaterThanOrEqual(middle);
    }

    const previous = entries[index - 1];

    if (previous !== undefined) {
      expect(entry.top).toBeGreaterThan(previous.top);
    }
  }
}

test.describe('timeline--narrow', () => {
  test('follows its container, not the viewport, across the 48rem threshold', async ({
    page,
  }) => {
    const root = await openStory(page, 'timeline--narrow');
    const frame = root.getByTestId('frame');
    const list = root.getByTestId('timeline');
    const viewport = page.viewportSize();

    await expectItemSheetsApplied(page, ['timeline']);
    await expect(list).toHaveCSS('display', 'flex');
    await expectSingleSided(list);

    await resize(frame, await usedLength(frame, '70rem'));
    await expectAlternating(list);

    await resize(frame, await usedLength(frame, '30rem'));
    await expectSingleSided(list);

    expect(page.viewportSize(), 'the viewport never changed').toEqual(viewport);
  });
});

test.describe('timeline--links', () => {
  test('moves focus through the links in source order, each below the last', async ({
    browserName,
    page,
  }) => {
    await skipUnlessTabReachesLinks(page, browserName);

    const root = await openStory(page, 'timeline--links');
    const list = root.getByTestId('timeline');
    const links = list.getByRole('link');

    await expectItemSheetsApplied(page, ['timeline']);
    await expect(list).toHaveCSS('display', 'flex');

    const count = await links.count();

    expect(count).toBe(4);

    let previousTop = -Infinity;

    for (let index = 0; index < count; index++) {
      const link = links.nth(index);

      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();

      const top = await link.evaluate(
        (element) => element.getBoundingClientRect().top,
      );

      expect(top).toBeGreaterThan(previousTop);
      previousTop = top;
    }
  });
});

// Usage rule 8: a timeline is an inline-size container, so as an item of a
// flex row that sizes its items by their content it may collapse to its
// padding. Recorded per engine, not asserted.
test.describe('timeline--in-cluster', () => {
  test('records whether the timeline collapses as an item of a cluster', async ({
    browserName,
    page,
  }) => {
    const root = await openStory(page, 'timeline--in-cluster');
    const list = root.getByTestId('timeline');

    await expectItemSheetsApplied(page, ['cluster', 'timeline']);
    await expect(list).toHaveCSS('display', 'flex');
    await expect(root.getByTestId('cluster')).toHaveCSS('display', 'flex');

    const measured = await list.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        width: element.getBoundingClientRect().width,
        padding:
          parseFloat(style.paddingInlineStart) +
          parseFloat(style.paddingInlineEnd),
        widestEntry: Math.max(
          0,
          ...[...element.children].map(
            (entry) => entry.getBoundingClientRect().width,
          ),
        ),
      };
    });
    const collapsed = measured.width - measured.padding <= 1;

    test.info().annotations.push({
      type: 'timeline-in-cluster',
      description: `${browserName}: timeline width ${measured.width.toFixed(1)} px, inline padding ${measured.padding.toFixed(1)} px, widest entry ${measured.widestEntry.toFixed(1)} px; ${collapsed ? 'collapsed to its padding' : 'did not collapse'}`,
    });
  });
});
