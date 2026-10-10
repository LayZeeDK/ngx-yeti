import { type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import {
  nextFrames,
  waitForHydration,
  watchHydration,
} from './support/hydration';
import { recordFrames, recordPaintedAttributes } from './support/style-probe';

/**
 * E8 (ticket 50 decision 9): hydration writes static attributes again before
 * a binding wins (building-blocks.md:347). If a frame ever paints a
 * removed-kind attribute on its host, every removed-kind input becomes
 * bound-only (cluster.md:309, icon.md:302).
 */
const probes = '[appStaticAttributeProbe]';
const removedAttributes = [
  'align',
  'border',
  'nowrap',
  'start',
  'disabled',
] as const;
const renderedValues: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  'probe-block': { 'data-align': 'end' },
  'probe-table': { 'data-border': '1' },
  'probe-cell': { 'data-align': 'right', 'data-nowrap': '' },
  'probe-list': { 'data-start': '2' },
  'probe-link': { 'data-disabled': '' },
};

async function expectRenderedNotWritten(page: Page): Promise<void> {
  for (const [id, values] of Object.entries(renderedValues)) {
    const host = page.locator(`#${id}`);

    await expect(host).toBeVisible();

    for (const attribute of removedAttributes) {
      await expect(host, `#${id} has no ${attribute}`).not.toHaveAttribute(
        attribute,
      );
    }

    for (const [attribute, value] of Object.entries(values)) {
      await expect(host).toHaveAttribute(attribute, value);
    }
  }
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} static-attributes route`, () => {
    test('hydrates with 0 skipped components and no NG05xx message', async ({
      page,
    }) => {
      test.skip(
        isProduction,
        'Angular logs hydration diagnostics in development mode only',
      );

      const expectCleanHydration = watchHydration(page);

      await page.goto(`${prefix}static-attributes`);

      await expect(page.locator('#probe-block')).toBeVisible();
      await expectCleanHydration();
    });

    test('paints no written-back static attribute from first paint through hydration (E8)', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(
        page,
        probes,
        removedAttributes,
      );
      const frames = await recordFrames(page, '#probe-block', 'display');

      await page.goto(`${prefix}static-attributes`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();

      test.info().annotations.push({
        type: 'e8-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted attribute entries in ${String(sampled.length)} frames${entries.length > 0 ? ` (${[...new Set(entries)].join(', ')})` : ''}`,
      });
      expect(sampled.length, 'the hosts were sampled').toBeGreaterThan(0);
      expect(
        entries,
        'no painted frame shows a written-back static attribute',
      ).toEqual([]);
      await expectRenderedNotWritten(page);
    });

    test('the painted-attribute probe sees an attribute a frame paints', async ({
      page,
    }) => {
      const painted = await recordPaintedAttributes(
        page,
        probes,
        removedAttributes,
      );

      await page.goto(`${prefix}static-attributes`);
      await waitForHydration(page);
      await page.locator('#probe-block').evaluate((host) => {
        host.setAttribute('align', 'end');
      });
      await nextFrames(page);

      expect(await painted()).toContain('probe-block align');
    });

    test('passes axe', async ({ axeViolations, page }) => {
      await page.goto(`${prefix}static-attributes`);
      await waitForHydration(page);

      expect(await axeViolations()).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('shows every host with its data attribute and none of the removed ones, and passes axe', async ({
        axeViolations,
        page,
      }) => {
        await page.goto(`${prefix}static-attributes`);

        await expectRenderedNotWritten(page);
        expect(await axeViolations()).toEqual([]);
      });
    });
  });
}
