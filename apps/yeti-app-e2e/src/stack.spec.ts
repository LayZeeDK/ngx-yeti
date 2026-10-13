import {
  expectItemSheetsApplied,
  rect,
  usedLength,
} from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { removeDehydratedHosts } from './support/hosts';
import { nextFrames, waitForHydration } from './support/hydration';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

/** The rule's line above a child: Yeti draws it with `::before`. */
async function ruleLine(
  locator: Locator,
): Promise<{ content: string; top: number; width: number }> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element, '::before');

    return {
      content: style.content,
      top: parseFloat(style.top),
      width: parseFloat(style.borderTopWidth),
    };
  });
}

/** The stack and center links, in document order; later items may add more. */
async function stackAndCenterLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'stack' || item === 'center',
  );
}

/** The inline size and position of a center, with its sheet applied. */
async function centerColumn(
  center: Locator,
): Promise<{ left: number; width: number }> {
  await expect(center).not.toHaveCSS('padding-left', '0px');
  await expect(center).not.toHaveCSS('margin-left', '0px');

  const { left, width } = await rect(center);

  return { left, width };
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} stack route`, () => {
    describeStandardRouteCases({
      item: 'stack',
      prefix,
      liveHost: '#live-stack',
      leaveLink: 'Leave for a page without stacks',
      styled: { property: 'display', value: 'flex' },
      afterLeave: async (page) => {
        await expect.poll(() => stackAndCenterLinks(page)).toEqual([]);
      },
      afterReturn: async (page) => {
        await expect
          .poll(() => stackAndCenterLinks(page))
          .toEqual(['stack', 'center']);
      },
    });

    test('paints no frame with align on the stack written with a static align', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, '#aligned-stack', [
        'align',
      ]);
      const frames = await recordFrames(page, '#aligned-stack', 'text-align');

      await page.goto(`${prefix}stack`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();
      const aligned = page.locator('#aligned-stack');

      test.info().annotations.push({
        type: 'static-align-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted align entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the stack was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows align on the stack').toEqual([]);
      expect(
        sampled.filter((value) => value !== 'start'),
        "the stack's text stays start-aligned in every frame",
      ).toEqual([]);
      await expect(aligned).toHaveAttribute('data-align', 'center');
      await expect(aligned).not.toHaveAttribute('align');
    });

    test('keeps the hydrate-never stack styled after every live stack leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}stack`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Remove the live stacks' })
        .click();
      await expect(
        page.locator('#live-stack, #aligned-stack, #reference-stack'),
      ).toHaveCount(0);
      await nextFrames(page);

      const stack = page.locator('#never-stack');

      await expect(stack).toHaveAttribute('data-ngx-yeti-item-stack', '');
      expect(
        await itemLinks(page),
        'the hydrate never host keeps the stack link',
      ).toContain('stack');
      await expect(stack).toHaveCSS('display', 'flex');
      expect(
        (await rect(stack.locator('p').nth(1))).top -
          (await rect(stack.locator('p').nth(0))).bottom,
      ).toBeCloseTo(
        await usedLength(page.locator('main'), 'var(--yeti-space-lg)', 'block'),
        1,
      );
    });

    // The server hosts keep the stack link in <head>, so the client-only
    // stack reuses it.
    test('renders a client-only stack with 0 unstyled frames while the server hosts hold the stack link', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-stack', 'display');

      await delayCss(page);
      await page.goto(`${prefix}stack`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only stack' })
        .click();

      const stack = page.locator('#client-stack');

      await expect(stack).toBeVisible();
      await expect(stack).toHaveCSS('display', 'flex');

      expectStyledFrames(await display(), {
        styled: (value) => value === 'flex',
        label: `${browserName}, ${kind}, client-only stack`,
      });
    });

    // The tie (stack.md:321): the center link is in place, and the stack's
    // file arrives after it, yet lands before it in <head>.
    test('keeps a center centred in a client-only stack that loads after the center file', async ({
      page,
    }) => {
      await page.goto(`${prefix}stack`);
      await waitForHydration(page);
      await expectItemSheetsApplied(page, ['stack']);
      await expect(page.locator('#reference-stack')).toHaveCSS(
        'display',
        'flex',
      );

      const reference = await centerColumn(page.locator('#reference-center'));

      await page
        .getByRole('button', { name: 'Remove the live stacks' })
        .click();
      await removeDehydratedHosts(page, '#never-stack');
      await expect(page.locator('[data-ngx-yeti-item-stack]')).toHaveCount(0);
      await expect
        .poll(() => stackAndCenterLinks(page), {
          message: 'only the lone center holds a link',
        })
        .toEqual(['center']);

      await page
        .getByRole('button', { name: 'Show the client-only stack' })
        .click();

      const stack = page.locator('#client-stack');

      await expectItemSheetsApplied(page, ['stack']);
      await expect(stack).toHaveCSS('display', 'flex');
      expect(
        await stackAndCenterLinks(page),
        'the stack link is inserted before the center link',
      ).toEqual(['stack', 'center']);

      const inner = await centerColumn(page.locator('#client-center'));

      expect(inner.width).toBeCloseTo(reference.width, 1);
      expect(inner.left).toBeCloseTo(reference.left, 1);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves the stacks with their attributes, markers, and item link', async ({
        page,
      }) => {
        await page.goto(`${prefix}stack`);

        const stack = page.locator('#live-stack');

        await expect(stack).toHaveClass('stack');
        await expect(stack).toHaveAttribute('data-ngx-yeti-item-stack', '');
        await expect(stack).toHaveAttribute('data-gap', 'sm');
        await expect(stack).toHaveAttribute('data-rule', '');
        await expect(stack).toHaveAttribute('data-fill', '');
        await expect(page.locator('#pinned')).toHaveAttribute(
          'data-sticky',
          '',
        );
        await expect(page.locator('#spaced')).toHaveAttribute(
          'data-space',
          'xl',
        );
        await expect(page.locator('#split')).toHaveAttribute('data-split', '');
        await expect(page.locator('#aligned-stack')).toHaveAttribute(
          'data-align',
          'center',
        );
        await expect(page.locator('#aligned-stack')).not.toHaveAttribute(
          'align',
        );
        expect(await stackAndCenterLinks(page)).toEqual(['stack', 'center']);
      });

      test('lays out the gaps, the split child, and the rule', async ({
        page,
      }) => {
        await page.goto(`${prefix}stack`);

        const stack = page.locator('#live-stack');

        await expectItemSheetsApplied(page, ['stack']);
        await expect(stack).toHaveCSS('display', 'flex');

        const [sm, xl, border] = await Promise.all(
          ['--yeti-space-sm', '--yeti-space-xl', '--yeti-border-width'].map(
            (name) => usedLength(page.locator('main'), `var(${name})`, 'block'),
          ),
        );
        const [box, first, second, spaced, split] = await Promise.all(
          ['#live-stack', '#first', '#second', '#spaced', '#split'].map(
            (selector) => rect(page.locator(selector)),
          ),
        );

        if (
          sm === undefined ||
          xl === undefined ||
          box === undefined ||
          first === undefined ||
          second === undefined ||
          spaced === undefined ||
          split === undefined
        ) {
          throw new Error('A token or a child is missing');
        }

        expect(second.top - first.bottom).toBeCloseTo(sm, 1);
        expect(spaced.top - second.bottom).toBeCloseTo(xl, 1);
        expect(split.bottom).toBeCloseTo(box.bottom, 1);
        expect(split.top - spaced.bottom).toBeGreaterThan(sm);
        expect(
          box.height,
          'the filled stack is at least as tall as the viewport',
        ).toBeGreaterThanOrEqual(page.viewportSize()?.height ?? Infinity);

        expect((await ruleLine(page.locator('#pinned'))).content).toBe('none');

        const line = await ruleLine(page.locator('#second'));

        expect(line.width).toBe(border);
        expect(line.top).toBeCloseTo(-sm / 2, 1);
        expect((await ruleLine(page.locator('#spaced'))).top).toBeCloseTo(
          -xl / 2,
          1,
        );
        await expect(
          page.locator('#aligned-stack'),
          "the static align leaves the stack's text start-aligned",
        ).toHaveCSS('text-align', 'start');
      });

      test('pins the sticky child at the sticky offset while the stack scrolls past', async ({
        page,
      }) => {
        await page.goto(`${prefix}stack`);

        const stack = page.locator('#live-stack');
        const pinned = page.locator('#pinned');

        await expectItemSheetsApplied(page, ['stack']);
        await expect(stack).toHaveCSS('display', 'flex');

        const offset = await usedLength(
          page.locator('main'),
          'var(--yeti-sticky-offset)',
          'block',
        );
        const before = await rect(stack);

        expect(
          (await rect(pinned)).width,
          'the pinned child keeps the width of the column',
        ).toBeCloseTo(before.width, 0);

        await page.evaluate((top) => {
          window.scrollTo(0, top);
        }, before.top + 80);

        await expect
          .poll(async () => (await rect(stack)).top, {
            message: "the stack's top has scrolled out",
          })
          .toBeLessThan(0);
        await expect
          .poll(async () => (await rect(pinned)).top)
          .toBeCloseTo(offset, 0);
      });
    });
  });
}
