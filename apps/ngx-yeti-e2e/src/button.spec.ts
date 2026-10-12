import {
  composite,
  contrastRatio,
  parseColor,
  type SrgbColor,
} from '@ngx-yeti/testing';
import { expectItemSheetsApplied } from '@ngx-yeti/testing/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './open-story';

/** Resolves after the page has painted twice. */
async function twoPaints(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

/** Opens a button story and waits until Yeti's button file styles it. */
async function openButtonStory(page: Page, id: string): Promise<Locator> {
  const root = await openStory(page, id);

  await expectItemSheetsApplied(page, ['button', 'spinner']);
  await expect(root.locator('[yetibutton]').first()).toHaveCSS(
    'justify-content',
    'center',
  );

  return root;
}

/** The element's block-start border, as `width style colour`. */
async function borderOf(element: Locator): Promise<string> {
  return element.evaluate((node) => {
    for (const transition of node.getAnimations()) {
      transition.finish();
    }

    const style = getComputedStyle(node);

    return `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
  });
}

/**
 * The control: deletes the forced-colours rule of ledger row A11Y-1a, the one
 * that names `aria-pressed`, from every stylesheet, and returns how many it
 * deleted. Storybook bundles the package's stylesheet with Yeti's, so leaving
 * the file out is deleting its rule; every other rule of the file stays.
 * Runs in the page.
 */
function removePressedRule(): number {
  let removed = 0;
  const visit = (list: CSSRuleList): void => {
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const rule = list[index];

      if (
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('forced-colors') &&
        rule.cssText.includes('aria-pressed')
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

/**
 * Under forced colours the `on` control's border differs from its resting
 * sibling's with the package rule, and not once the rule is deleted.
 */
async function expectStateDrawnByTheRule(
  page: Page,
  on: Locator,
  resting: Locator,
): Promise<void> {
  await page.emulateMedia({ forcedColors: 'active' });
  await twoPaints(page);

  const withRule = { on: await borderOf(on), resting: await borderOf(resting) };

  test.info().annotations.push({
    type: 'forced-colors borders with ngx-yeti-globals.css',
    description: `on ${withRule.on}; resting ${withRule.resting}`,
  });

  expect(withRule.on, 'the state is drawn by its border').not.toBe(
    withRule.resting,
  );

  expect(
    await page.evaluate(removePressedRule),
    'the package rule was found and removed',
  ).toBe(1);
  await twoPaints(page);

  const withoutRule = {
    on: await borderOf(on),
    resting: await borderOf(resting),
  };

  test.info().annotations.push({
    type: 'forced-colors borders without the A11Y-1a rule',
    description: `on ${withoutRule.on}; resting ${withoutRule.resting}`,
  });

  expect(
    withoutRule.on,
    'without the rule the border no longer tells the state',
  ).toBe(withoutRule.resting);
}

/** The background colours from the element up to the document's root. */
async function backgroundsOf(element: Locator): Promise<string[]> {
  return element.evaluate((node) => {
    const backgrounds: string[] = [];

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

    return backgrounds;
  });
}

/** Composites `backgroundsOf` down to the nearest opaque one. */
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

/**
 * The exact WCAG ratios of a pair of toggles, the first pressed: its fill
 * against the resting fill, and each fill against what the pair sits on.
 */
async function toggleRatios(pair: Locator): Promise<string> {
  const toggles = pair.locator('[yetibutton]');
  const pressed = effectiveBackground(await backgroundsOf(toggles.nth(0)));
  const resting = effectiveBackground(await backgroundsOf(toggles.nth(1)));
  const page = effectiveBackground(await backgroundsOf(pair));

  return `pressed to resting ${contrastRatio(pressed, resting).toFixed(2)}, pressed to page ${contrastRatio(pressed, page).toFixed(2)}, resting to page ${contrastRatio(resting, page).toFixed(2)}`;
}

const noTabToButtons =
  'headless WebKit does not Tab to buttons by default, as Safari does not';

test.describe('button--default', () => {
  test('draws no ring on a click and the ring on the button Tab reaches', async ({
    browserName,
    page,
  }) => {
    test.skip(browserName === 'webkit', noTabToButtons);

    const root = await openButtonStory(page, 'button--default');
    const save = root.getByRole('button', { name: 'Save' });
    const preview = root.getByRole('button', { name: 'Preview' });

    await save.click();
    await expect(save, 'a click draws no ring').toHaveCSS(
      'outline-style',
      'none',
    );

    await page.keyboard.press('Tab');

    await expect(preview).toBeFocused();
    await expect(preview, 'keyboard focus draws the ring').toHaveCSS(
      'outline-style',
      'solid',
    );
  });

  // The case WebKit can run: focus moved by script, before any pointer
  // press, matches `:focus-visible`.
  test('draws the ring on a button that a script focuses, and none on a click', async ({
    page,
  }) => {
    const root = await openButtonStory(page, 'button--default');
    const save = root.getByRole('button', { name: 'Save' });
    const preview = root.getByRole('button', { name: 'Preview' });

    await preview.focus();

    await expect(preview).toBeFocused();
    expect(
      await preview.evaluate((element) => element.matches(':focus-visible')),
    ).toBe(true);
    await expect(preview).toHaveCSS('outline-style', 'solid');

    await save.click();
    await expect(save, 'a click draws no ring').toHaveCSS(
      'outline-style',
      'none',
    );
  });
});

// button.md:315 puts the press ratio in the story; Storybook's pointer does
// not set `:active`, so a real pointer holds each button down here
// (ngx-yeti-specs, Departures).
test.describe('button--variants', () => {
  test('keeps every variant and emphasis at least 4.5:1 while pressed, in both schemes', async ({
    page,
  }) => {
    const root = await openButtonStory(page, 'button--variants');
    const buttons = await root.locator('[yetibutton]').all();
    const failures: string[] = [];

    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      await button.hover();
      await page.mouse.down();

      const pressed = await button.evaluate((element) => {
        for (const transition of element.getAnimations()) {
          transition.finish();
        }

        return {
          active: element.matches(':active'),
          color: getComputedStyle(element).color,
        };
      });
      const ratio = contrastRatio(
        pressed.color,
        effectiveBackground(await backgroundsOf(button)),
      );

      await page.mouse.up();

      if (!pressed.active || ratio < 4.5) {
        failures.push(
          `${(await button.textContent()) ?? ''} in ${(await button.evaluate((element) => element.closest('[data-scheme]')?.getAttribute('data-scheme'))) ?? ''}: active ${String(pressed.active)}, ${ratio.toFixed(2)}`,
        );
      }
    }

    expect(failures).toStrictEqual([]);
  });
});

test.describe('button--toggle', () => {
  test('draws the pressed toggle under forced colours only with the package rule (A11Y-1a)', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit has no forced colours mode; Playwright emulates only the media query',
    );

    const root = await openButtonStory(page, 'button--toggle');
    const bold = root.getByRole('button', { name: 'Bold' });
    const italic = root.getByRole('button', { name: 'Italic' });

    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'false');
    await expectStateDrawnByTheRule(page, bold, italic);
  });

  // Recorded, not asserted here: the story asserts the medium and low pairs
  // in its own wrapper, and the high-emphasis pair is the anti-pattern
  // story's (ticket 50 decision 94).
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`records the ratios between the toggle states with a ${colorScheme} page scheme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });

      const ratios: string[] = [];

      for (const [id, emphases] of [
        ['button--toggle', ['medium', 'low']],
        ['button--anti-pattern-high-emphasis-toggle', ['high']],
      ] as const) {
        const root = await openButtonStory(page, id);

        for (const emphasis of emphases) {
          const pair = root.locator(`[data-pair="${emphasis}"]`);

          await expect(pair).toHaveCount(1);
          ratios.push(`${emphasis}: ${await toggleRatios(pair)}`);
        }
      }

      test.info().annotations.push({
        type: 'toggle state ratios',
        description: `${colorScheme}; ${ratios.join('; ')}`,
      });
    });
  }
});

test.describe('button--toggle-input', () => {
  test('draws the checked label under forced colours only with the package rule (A11Y-1a)', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit has no forced colours mode; Playwright emulates only the media query',
    );

    const root = await openButtonStory(page, 'button--toggle-input');
    const offline = root.locator('label', { hasText: 'Keep maps offline' });
    const contours = root.locator('label', { hasText: 'Contours' });

    await expect(offline.locator('input')).toBeChecked();
    await expect(contours.locator('input')).not.toBeChecked();
    await expectStateDrawnByTheRule(page, offline, contours);
  });

  test('checks the focused checkbox with a real Space, not with Enter, and moves the radio choice with a real arrow key', async ({
    page,
  }) => {
    const root = await openButtonStory(page, 'button--toggle-input');
    const contours = root.getByRole('checkbox', { name: 'Contours' });
    const monthly = root.getByRole('radio', { name: 'Monthly' });
    const yearly = root.getByRole('radio', { name: 'Yearly' });

    await contours.focus();
    await page.keyboard.press('Enter');
    await expect(contours, 'Enter changes no state').not.toBeChecked();

    await page.keyboard.press('Space');
    await expect(contours).toBeChecked();

    await page.keyboard.press('Space');
    await expect(contours).not.toBeChecked();

    await monthly.focus();
    await page.keyboard.press('ArrowRight');

    await expect(yearly).toBeChecked();
    await expect(yearly).toBeFocused();
    await expect(monthly).not.toBeChecked();
  });
});

test.describe('button--disabled', () => {
  test('skips the four disabled controls on Tab', async ({
    browserName,
    page,
  }) => {
    test.skip(browserName === 'webkit', noTabToButtons);

    const root = await openButtonStory(page, 'button--disabled');

    await root.getByRole('button', { name: 'Enable the controls' }).focus();
    await page.keyboard.press('Tab');

    await expect(root.getByRole('button', { name: 'Cancel' })).toBeFocused();
  });

  test('keeps real presses off the disabled controls and lets them through once enabled', async ({
    page,
  }) => {
    const root = await openButtonStory(page, 'button--disabled');
    const enable = root.getByRole('button', { name: 'Enable the controls' });
    const save = root.getByRole('button', { name: 'Save' });
    const link = root.locator('a', { hasText: 'Next' });
    const routed = root.getByText('The docs page');
    const takesFocus = (element: Locator): Promise<boolean> =>
      element.evaluate((node) => {
        if (node instanceof HTMLElement) {
          node.focus();
        }

        return document.activeElement === node;
      });

    await expect(save).toBeDisabled();
    await expect(link).not.toHaveAttribute('href');
    expect(await takesFocus(link), 'the disabled link takes no focus').toBe(
      false,
    );
    expect(await takesFocus(save), 'the disabled button takes no focus').toBe(
      false,
    );

    // A real pointer press on the disabled link follows nothing.
    const box = await link.boundingBox();

    if (box === null) {
      throw new Error('The link is not rendered');
    }

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(routed).toHaveCount(0);

    // Enter and Space activate the toggle that enables the controls.
    await enable.focus();
    await page.keyboard.press('Enter');
    await expect(enable).toHaveAttribute('aria-pressed', 'true');
    await expect(save).toBeEnabled();

    await page.keyboard.press('Space');
    await expect(enable).toHaveAttribute('aria-pressed', 'false');
    await expect(save).toBeDisabled();

    await page.keyboard.press('Space');
    await expect(link).toHaveAttribute('href', '/docs');
    await expect(link).not.toHaveAttribute('aria-disabled');

    // The enabled link takes focus and Enter follows it.
    expect(await takesFocus(link)).toBe(true);
    await page.keyboard.press('Enter');
    await expect(routed).toBeVisible();
  });
});

test.describe('button--busy', () => {
  test('turns the busy ring once under reduced motion (A11Y-13)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const root = await openButtonStory(page, 'button--busy');
    const button = root.getByRole('button', { name: 'Saving' });

    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect
      .poll(() =>
        button.evaluate(
          (element) => getComputedStyle(element, '::after').animationName,
        ),
      )
      .toBe('yeti-spin');

    expect(
      await button.evaluate(
        (element) =>
          getComputedStyle(element, '::after').animationIterationCount,
      ),
    ).toBe('1');
  });

  test('turns the busy ring without end without the preference', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const root = await openButtonStory(page, 'button--busy');
    const button = root.getByRole('button', { name: 'Saving' });

    await expect
      .poll(() =>
        button.evaluate(
          (element) =>
            getComputedStyle(element, '::after').animationIterationCount,
        ),
      )
      .toBe('infinite');
  });
});
