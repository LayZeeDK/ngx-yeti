import {
  composite,
  contrastRatio,
  parseColor,
  type SrgbColor,
} from '@ngx-yeti/testing';
import {
  expectItemSheetsApplied,
  horizontalOverflow,
} from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

const stories = [
  'spinner--default',
  'spinner--sizes',
  'spinner--variants',
  'spinner--inputs',
  'spinner--waiting',
  'spinner--decorative',
  'spinner--defer-placeholder',
];

/** The ring's computed `rotate` in each of the next `count` animation frames. */
async function rotateFrames(ring: Locator, count: number): Promise<string[]> {
  return ring.evaluate(
    (element, frames) =>
      new Promise<string[]>((resolve) => {
        const angles: string[] = [];
        const sample = (): void => {
          angles.push(getComputedStyle(element).rotate);

          if (angles.length === frames) {
            resolve(angles);
          } else {
            requestAnimationFrame(sample);
          }
        };

        requestAnimationFrame(sample);
      }),
    count,
  );
}

/** A computed CSS time in ms. */
function durationMs(value: string): number {
  const amount = parseFloat(value);

  if (Number.isNaN(amount)) {
    throw new Error(`Not a CSS time: ${value}`);
  }

  return value.endsWith('ms') ? amount : amount * 1000;
}

/** The ring's border colours, with its turn paused at the start. */
async function forcedEdges(
  ring: Locator,
): Promise<{ blockStart: string; inlineEnd: string; blockEnd: string }> {
  return ring.evaluate((element) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }

    const style = getComputedStyle(element);

    return {
      blockStart: style.borderTopColor,
      inlineEnd: style.borderRightColor,
      blockEnd: style.borderBottomColor,
    };
  });
}

/**
 * The control: deletes the forced-colours rules that name `.spinner` from
 * every stylesheet, as if `ngx-yeti/accessibility.css` were left out, and
 * returns how many it deleted. Runs in the page.
 */
function removeForcedSpinnerRules(): number {
  let removed = 0;
  const visit = (list: CSSRuleList): void => {
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const rule = list[index];

      if (
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('forced-colors') &&
        rule.cssText.includes('.spinner')
      ) {
        if (rule.parentRule instanceof CSSGroupingRule) {
          rule.parentRule.deleteRule(index);
        } else {
          rule.parentStyleSheet?.deleteRule(index);
        }

        removed += 1;
      } else if (rule instanceof CSSGroupingRule) {
        visit(rule.cssRules);
      }
    }
  };

  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // A cross-origin sheet hides its rules; the package's is same-origin.
    }
  }

  return removed;
}

/** Resolves after the page has painted twice. */
async function twoPaints(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

/**
 * The colour, the block-start border colour, and the background colours from
 * the element up to the nearest opaque one, so the ratio is computed here
 * with the exact formula.
 */
async function paintOf(
  element: Locator,
): Promise<{ color: string; edge: string; backgrounds: string[] }> {
  return element.evaluate((node) => {
    const backgrounds: string[] = [];

    for (
      let current: Element | null = node;
      current !== null;
      current = current.parentElement
    ) {
      backgrounds.push(getComputedStyle(current).backgroundColor);
    }

    const style = getComputedStyle(node);

    return { color: style.color, edge: style.borderTopColor, backgrounds };
  });
}

/** Composites the backgrounds of `paintOf` down to the nearest opaque one. */
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

test.describe('spinner--default', () => {
  test('turns once and stands still under reduced motion (A11Y-13)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const root = await openStory(page, 'spinner--default');
    const ring = root.locator('[yetispinner]').first();

    await expectItemSheetsApplied(page, ['spinner']);
    await expect(ring).toHaveCSS('animation-name', 'yeti-spin');

    const { duration, iterations } = await ring.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
      };
    });

    // Yeti's bound, `0.01ms`, computes as `1e-05s`; the tolerance absorbs
    // the float error of the unit conversion.
    expect(durationMs(duration)).toBeLessThanOrEqual(0.01 + 1e-9);
    expect(iterations).toBe('1');

    await twoPaints(page);
    const angles = await rotateFrames(ring, 6);

    expect(angles).toHaveLength(6);
    expect(new Set(angles).size, `one angle in ${angles.join(', ')}`).toBe(1);
  });

  test('turns without the preference: two frames 100 ms apart read different angles', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const root = await openStory(page, 'spinner--default');
    const ring = root.locator('[yetispinner]').first();

    await expectItemSheetsApplied(page, ['spinner']);
    await expect(ring).toHaveCSS('animation-name', 'yeti-spin');

    expect(
      await ring.evaluate((element) =>
        element
          .getAnimations()
          .some(({ playState }) => playState === 'running'),
      ),
    ).toBe(true);

    const [first, second] = await ring.evaluate(
      (element) =>
        new Promise<string[]>((resolve) => {
          const before = getComputedStyle(element).rotate;

          setTimeout(() => {
            resolve([before, getComputedStyle(element).rotate]);
          }, 100);
        }),
    );

    expect(second).not.toBe(first);
  });

  test('keeps the bright edge distinct under forced colours only with the package rule (A11Y-32)', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit has no forced colours mode; Playwright emulates only the media query',
    );

    const root = await openStory(page, 'spinner--default');
    const ring = root.locator('[yetispinner]').first();

    await expectItemSheetsApplied(page, ['spinner']);
    await expect(ring).toHaveCSS('animation-name', 'yeti-spin');

    await page.emulateMedia({ forcedColors: 'active' });
    await twoPaints(page);

    const withRule = await forcedEdges(ring);

    test.info().annotations.push({
      type: 'forced-colors edges with accessibility.css',
      description: `block-start ${withRule.blockStart}; inline-end ${withRule.inlineEnd}; block-end ${withRule.blockEnd}`,
    });
    await test.info().attach('forced-colors spinner', {
      body: await ring.screenshot(),
      contentType: 'image/png',
    });

    expect(withRule.blockStart, 'the bright edge').not.toBe(withRule.inlineEnd);
    expect(withRule.blockStart, 'the bright edge').not.toBe(withRule.blockEnd);

    expect(
      await page.evaluate(removeForcedSpinnerRules),
      'the package rule was found and removed',
    ).toBeGreaterThan(0);
    await twoPaints(page);

    const withoutRule = await forcedEdges(ring);

    test.info().annotations.push({
      type: 'forced-colors edges without accessibility.css',
      description: `block-start ${withoutRule.blockStart}; inline-end ${withoutRule.inlineEnd}; block-end ${withoutRule.blockEnd}`,
    });

    expect(
      withoutRule.blockStart,
      'without the rule the bright edge merges with the ring',
    ).toBe(withoutRule.inlineEnd);
  });
});

test.describe('spinner--default in each page scheme', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`keeps the bright edge at least 3:1 and the text at least 4.5:1 with a ${colorScheme} page scheme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      const root = await openStory(page, 'spinner--default');

      await expectItemSheetsApplied(page, ['spinner']);

      await expect(root.locator('[yetispinner]').first()).toHaveCSS(
        'animation-name',
        'yeti-spin',
      );

      for (const ring of await root.locator('[yetispinner]').all()) {
        const line = await paintOf(ring.locator('..'));
        const own = await paintOf(ring);
        const background = effectiveBackground(line.backgrounds);

        expect(
          contrastRatio(own.edge, background),
          'the bright edge',
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrastRatio(line.color, background),
          'the text',
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

test.describe('spinner--variants', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`keeps every line's text at least 4.5:1 and records each bright edge with a ${colorScheme} page scheme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      const root = await openStory(page, 'spinner--variants');

      await expectItemSheetsApplied(page, ['spinner']);

      await expect(root.locator('[yetispinner]').first()).toHaveCSS(
        'animation-name',
        'yeti-spin',
      );

      const ratios: string[] = [];

      for (const ring of await root.locator('[yetispinner]').all()) {
        const variant = await ring.getAttribute('data-variant');
        const scheme = await ring.evaluate(
          (element) =>
            element.closest('[data-scheme]')?.getAttribute('data-scheme') ?? '',
        );
        const line = await paintOf(ring.locator('..'));
        const own = await paintOf(ring);

        expect(
          contrastRatio(line.color, effectiveBackground(line.backgrounds)),
          `the ${String(variant)} line's text in the ${scheme} wrapper`,
        ).toBeGreaterThanOrEqual(4.5);
        ratios.push(
          `${scheme} ${String(variant)} ${contrastRatio(own.edge, effectiveBackground(line.backgrounds)).toFixed(2)}`,
        );
      }

      // Recorded, not asserted: the spec asserts 3:1 for the default variant
      // only and records the bright edge of every other variant (spinner.md,
      // section 7).
      test.info().annotations.push({
        type: 'bright edge ratios',
        description: ratios.join('; '),
      });
    });
  }
});

test.describe('every spinner story', () => {
  for (const id of stories) {
    test(`${id} reflows at a 320 px viewport without horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await openStory(page, id);

      expect(
        await horizontalOverflow(page),
        'horizontal overflow in px',
      ).toBeLessThanOrEqual(0);
    });
  }
});
