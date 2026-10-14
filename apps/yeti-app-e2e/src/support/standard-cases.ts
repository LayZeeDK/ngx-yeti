import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { type Page } from '@playwright/test';
import { expect, isProduction, test } from './fixtures';
import { waitForHydration, watchHydration } from './hydration';
import { itemLinks } from './style-probe';

/**
 * Registers the tests every item route has, for one render mode. Call it once
 * inside a spec's `routeKinds` loop, in that kind's `describe`.
 */
export function describeStandardRouteCases(cases: {
  /** The item's name, which is its class and the value of its item link. */
  readonly item: string;
  /** The render mode's route prefix, from `routeKinds`. */
  readonly prefix: string;
  /** The fixture key, when it is not the item's name. */
  readonly route?: string;
  /** A selector of a server-rendered host of the item. */
  readonly liveHost: string;
  /** The name of the link that leaves for a page without the item. */
  readonly leaveLink: string;
  /** A computed style `liveHost` has only with the item's file applied. */
  readonly styled: {
    readonly property: string;
    readonly value: string | RegExp;
  };
  /** The URL `leaveLink` leaves for, the replay page by default. */
  readonly leaveUrl?: RegExp;
  /**
   * The item links the route holds, in document order; `[item]` by default.
   * All of them leave with the route and return with it.
   */
  readonly links?: readonly string[];
  /**
   * More to expect of the page after going back to the route, once the
   * item's sheet has applied.
   */
  readonly afterReturn?: (page: Page) => Promise<void>;
  /**
   * A selector of the elements that arrive with `enter`. They fade in, and in
   * Firefox axe runs on a fresh copy of the page, where they play again;
   * mid-fade text fails its contrast check. The arrival ends at the content's
   * own colours, so the JavaScript-off test then runs under reduced motion
   * and waits for each to be opaque, and axe reads the end state.
   */
  readonly arrivals?: string;
}): void {
  const {
    item,
    prefix,
    route = item,
    liveHost,
    leaveLink,
    styled,
    leaveUrl = /\/replay$/,
    links = [item],
    afterReturn,
    arrivals,
  } = cases;
  const presence = `data-ngx-yeti-item-${item}`;

  test('hydrates with 0 skipped components and no NG05xx message', async ({
    page,
  }) => {
    test.skip(
      isProduction,
      'Angular logs hydration diagnostics in development mode only',
    );

    const expectCleanHydration = watchHydration(page);

    await page.goto(`${prefix}${route}`);

    await expect(page.locator(liveHost)).toBeVisible();
    await expectCleanHydration();
  });

  test(`removes the ${item} link on leaving the route and re-inserts it on returning`, async ({
    page,
  }) => {
    await page.goto(`${prefix}${route}`);
    await waitForHydration(page);

    const routeLinks = async (): Promise<readonly string[]> =>
      (await itemLinks(page)).filter((name) => links.includes(name));

    expect(await routeLinks()).toEqual(links);

    await page.getByRole('link', { name: leaveLink }).click();
    await expect(page).toHaveURL(leaveUrl);
    await expect(page.locator(`[${presence}]`)).toHaveCount(0);
    await expect.poll(routeLinks).toEqual([]);

    await page.goBack();
    await expect(page.locator(liveHost)).toBeVisible();
    await expect.poll(routeLinks).toEqual(links);
    await expectItemSheetsApplied(page, [item]);
    await expect(page.locator(liveHost)).toHaveCSS(
      styled.property,
      styled.value,
    );
    await afterReturn?.(page);
  });

  test.describe('with JavaScript off', () => {
    test.use({
      javaScriptEnabled: false,
      ...(arrivals === undefined ? {} : { reducedMotion: 'reduce' as const }),
    });

    test(`serves the ${item} host with its class, presence attribute, and item link, in server HTML that axe passes`, async ({
      axeViolations,
      page,
    }) => {
      await page.goto(`${prefix}${route}`);

      const host = page.locator(liveHost);

      await expect(host).toContainClass(item);
      await expect(host).toHaveAttribute(presence, '');
      expect(await itemLinks(page, item)).toEqual([item]);

      if (arrivals !== undefined) {
        for (const arrival of await page.locator(arrivals).all()) {
          await expect(arrival).toHaveCSS('opacity', '1');
        }
      }

      expect(await axeViolations()).toEqual([]);
    });
  });
}
