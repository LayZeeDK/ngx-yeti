import { expectItemSheetsApplied, rect } from '@ngx-yeti/testing/playwright';
import { type Locator, type Page } from '@playwright/test';
import { expect, isProduction, routeKinds, test } from './support/fixtures';
import { nextFrames, waitForHydration } from './support/hydration';
import { clickWhileHeld, holdBackMainBundle } from './support/main-bundle';
import { describeStandardRouteCases } from './support/standard-cases';
import {
  delayCss,
  expectStyledFrames,
  itemLinks,
  productionFramesRecordedAs,
  recordFrames,
  recordPaintedAttributes,
} from './support/style-probe';

/** The busy ring: the button's `::after`, which `spinner.css` draws. */
async function ringOf(
  button: Locator,
): Promise<{ content: string; width: number; animation: string }> {
  return button.evaluate((element) => {
    const style = getComputedStyle(element, '::after');

    return {
      content: style.content,
      width: parseFloat(style.borderTopWidth),
      animation: style.animationName,
    };
  });
}

async function expectRing(button: Locator): Promise<void> {
  await expect
    .poll(() => ringOf(button), { message: 'the busy ring is drawn' })
    .toEqual({
      content: '""',
      width: expect.any(Number),
      animation: 'yeti-spin',
    });
  expect((await ringOf(button)).width).toBeGreaterThan(0);
}

/** The `button` and `spinner` links of `<head>`, in document order. */
async function buttonLinks(page: Page): Promise<readonly string[]> {
  return (await itemLinks(page)).filter(
    (item) => item === 'button' || item === 'spinner',
  );
}

/**
 * Clicks the middle of the element with the real pointer. Playwright's own
 * click waits for an element that carries `aria-disabled="true"` to become
 * enabled.
 */
async function pointerClick(page: Page, element: Locator): Promise<void> {
  const box = await element.boundingBox();

  if (box === null) {
    throw new Error('The element is not rendered');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Whether the element takes focus when a script asks it to. */
async function takesFocus(element: Locator): Promise<boolean> {
  return element.evaluate((node) => {
    if (node instanceof HTMLElement) {
      node.focus();
    }

    return document.activeElement === node;
  });
}

for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} button route`, () => {
    describeStandardRouteCases({
      item: 'button',
      prefix,
      liveHost: '#save',
      leaveLink: 'Leave for a page without buttons',
      styled: { property: 'display', value: 'inline-flex' },
    });

    test('leaves no link with disabled after hydration and paints no frame with it', async ({
      browserName,
      page,
    }) => {
      const painted = await recordPaintedAttributes(page, 'a[yetibutton]', [
        'disabled',
      ]);
      const frames = await recordFrames(page, '#previous', 'display');

      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      const entries = await painted();
      const sampled = await frames();

      test.info().annotations.push({
        type: 'static-disabled-frames',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ${String(entries.length)} painted disabled entries in ${String(sampled.length)} frames`,
      });
      expect(sampled.length, 'the link was sampled').toBeGreaterThan(0);
      expect(entries, 'no painted frame shows disabled on a link').toEqual([]);
      await expect(page.locator('a[disabled]')).toHaveCount(0);

      for (const id of ['#next', '#previous']) {
        const link = page.locator(id);

        await expect(link).toHaveAttribute('role', 'link');
        await expect(link).toHaveAttribute('aria-disabled', 'true');
        await expect(link).not.toHaveAttribute('href');
      }

      const docs = page.locator('#docs');

      await expect(docs).toHaveAttribute('data-variant', 'secondary');
      await expect(docs).toHaveAttribute('data-size', 'lg');
      await expect(docs).toHaveAttribute('size', 'lg');
      await expect(docs).not.toHaveAttribute('role');
      await expect(page.locator('#bold')).toHaveAttribute(
        'data-emphasis',
        'medium',
      );
    });

    test('holds the button and spinner links with no spinner on the page, removes both on leaving, and re-inserts both on returning', async ({
      page,
    }) => {
      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      await expect(page.locator('[data-ngx-yeti-item-spinner]')).toHaveCount(0);
      expect(await buttonLinks(page)).toEqual(['button', 'spinner']);
      await expectItemSheetsApplied(page, ['button', 'spinner']);
      await expectRing(page.locator('#busy'));

      await page
        .getByRole('link', { name: 'Leave for a page without buttons' })
        .click();
      await expect(page).toHaveURL(/\/replay$/);
      await expect(page.locator('[data-ngx-yeti-item-button]')).toHaveCount(0);
      await expect.poll(() => buttonLinks(page)).toEqual([]);

      await page.goBack();
      await expect(page.locator('#busy')).toBeVisible();
      await expect.poll(() => buttonLinks(page)).toEqual(['button', 'spinner']);
      await expectItemSheetsApplied(page, ['button', 'spinner']);
      await expectRing(page.locator('#busy'));
    });

    test('replays a click made on the toggle before hydration', async ({
      browserName,
      page,
    }) => {
      const release = await holdBackMainBundle(page);
      const bold = page.locator('#bold');
      const presses = page.locator('#bold-presses');

      await page.goto(`${prefix}button`, { waitUntil: 'commit' });
      await clickWhileHeld(bold, browserName);

      await expect(
        bold,
        'the click is not handled before hydration',
      ).toHaveAttribute('aria-pressed', 'false');
      await expect(presses).toHaveText('0');
      // The consumer's (click) is the toggle's only listener, and a button
      // without one carries no marker: the package adds none.
      await expect(bold).toHaveAttribute('jsaction', /^click:/);
      await expect(page.locator('#save')).not.toHaveAttribute('jsaction');

      release();

      await expect(
        bold,
        'the click reaches the handler after hydration',
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(presses).toHaveText('1');
    });

    test('replays two clicks made on the toggle before hydration, in order', async ({
      browserName,
      page,
    }) => {
      const release = await holdBackMainBundle(page);
      const bold = page.locator('#bold');
      const presses = page.locator('#bold-presses');

      await page.goto(`${prefix}button`, { waitUntil: 'commit' });
      await clickWhileHeld(bold, browserName);
      await clickWhileHeld(bold, browserName);

      await expect(bold).toHaveAttribute('aria-pressed', 'false');
      await expect(presses).toHaveText('0');

      release();

      await expect(presses, 'the handler ran once per click').toHaveText('2');
      await expect(
        bold,
        'pressed by the first click and released by the second',
      ).toHaveAttribute('aria-pressed', 'false');
    });

    // The server hosts keep both links in <head>, so the client-only button
    // reuses them.
    test('renders a client-only button with 0 unstyled frames while the server hosts hold the links', async ({
      browserName,
      page,
    }) => {
      const display = await recordFrames(page, '#client-button', 'display');

      await delayCss(page);
      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      await page
        .getByRole('button', { name: 'Show the client-only button' })
        .click();

      const button = page.locator('#client-button');

      await expect(button).toBeVisible();
      await expectItemSheetsApplied(page, ['button', 'spinner']);
      await expect(button).toHaveCSS('display', 'inline-flex');

      expectStyledFrames(await display(), {
        styled: (value) => value === 'inline-flex',
        label: `${browserName}, ${kind}, client-only button`,
        ...productionFramesRecordedAs(),
      });
    });

    test('keeps the hydrate-never button styled after every live button leaves, and records its ring', async ({
      browserName,
      page,
    }) => {
      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      const never = page.locator('#never-busy');

      await expectItemSheetsApplied(page, ['button', 'spinner']);
      await expectRing(never);

      await page
        .getByRole('button', { name: 'Remove the live buttons' })
        .click();
      await expect(page.locator('#button-form')).toHaveCount(0);
      await expect
        .poll(() => itemLinks(page, 'spinner'), {
          message:
            'no host carries the spinner presence attribute, so its link leaves',
        })
        .toEqual([]);
      await nextFrames(page);

      await expect(never).toHaveAttribute('data-ngx-yeti-item-button', '');
      expect(
        await itemLinks(page, 'button'),
        'the hydrate never host keeps the button link',
      ).toEqual(['button']);
      await expectItemSheetsApplied(page, ['button']);
      await expect(never).toHaveCSS('display', 'inline-flex');

      // Recorded, not asserted: the button host carries no spinner presence
      // attribute, so nothing holds the ring's file for it (button.md:354).
      const ring = await ringOf(never);

      test.info().annotations.push({
        type: 'hydrate-never-busy-ring',
        description: `${browserName}, ${isProduction ? 'production' : 'development'}, ${kind}: ::after content ${ring.content}, border ${String(ring.width)}px, animation ${ring.animation}`,
      });
    });

    test('keeps the button and icon links of the hydrate-never host that is both, after every live button and icon leaves', async ({
      page,
    }) => {
      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      const shared = page.locator('#never-icon-button');

      await expect(page.locator('#icon-save')).toHaveAttribute(
        'data-ngx-yeti-item-icon',
        '',
      );
      await page
        .getByRole('button', { name: 'Remove the live buttons' })
        .click();
      await expect(page.locator('#button-form')).toHaveCount(0);
      await expect(page.locator('[data-ngx-yeti-item-icon]')).toHaveCount(1);
      await nextFrames(page);

      await expect(shared).toContainClass('button icon');
      await expect(shared).toHaveAttribute('data-ngx-yeti-item-button', '');
      await expect(shared).toHaveAttribute('data-ngx-yeti-item-icon', '');
      expect(
        await itemLinks(page),
        'each presence attribute of the shared host keeps its own link',
      ).toEqual(expect.arrayContaining(['button', 'icon']));
      await expectItemSheetsApplied(page, ['button', 'icon']);
      await expect(shared).toHaveCSS('display', 'inline-flex');

      const svg = await rect(shared.locator('> svg'));
      const em = await shared.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );

      expect(svg.width).toBeCloseTo(em, 1);
      expect(svg.height).toBeCloseTo(em, 1);
    });

    test('passes axe with JavaScript on', async ({ axeViolations, page }) => {
      await page.goto(`${prefix}button`);
      await waitForHydration(page);

      expect(await axeViolations()).toEqual([]);
    });

    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('serves every host styled, with its attributes and the busy ring', async ({
        page,
      }) => {
        await page.goto(`${prefix}button`);
        await expectItemSheetsApplied(page, ['button', 'spinner']);

        for (const id of ['#save', '#send', '#offline', '#docs', '#previous']) {
          const host = page.locator(id);

          await expect(host).toHaveClass('button');
          await expect(host).toHaveAttribute('data-ngx-yeti-item-button', '');
          await expect(host).toHaveCSS('display', 'inline-flex');
        }

        await expect(page.locator('#bold')).toHaveAttribute(
          'aria-pressed',
          'false',
        );
        await expect(page.locator('#busy')).toHaveAttribute(
          'aria-busy',
          'true',
        );
        await expectRing(page.locator('#busy'));
        await expectRing(page.locator('#never-busy'));
        expect(await buttonLinks(page)).toEqual(['button', 'spinner']);
      });

      test('submits the form through the submit button', async ({ page }) => {
        await page.goto(`${prefix}button`);
        await page.locator('#send').click();

        await expect(page).toHaveURL(/button\?$/);
        await expect(page.locator('#save')).toBeVisible();
      });

      test("checks the toggle label's input with Space and submits its value", async ({
        page,
      }) => {
        await page.goto(`${prefix}button`);

        const input = page.locator('#offline input');

        await expect(input).not.toBeChecked();
        await input.focus();
        await page.keyboard.press('Space');
        await expect(input).toBeChecked();

        await page.locator('#send').click();

        await expect(page).toHaveURL(/button\?offline=yes$/);
      });

      test('follows the enabled link', async ({ page }) => {
        await page.goto(`${prefix}button`);
        await page.locator('#docs').click();

        await expect(page).toHaveURL(/\/replay$/);
      });

      test('keeps the disabled links out of focus and of navigation', async ({
        page,
      }) => {
        await page.goto(`${prefix}button`);

        const url = page.url();

        for (const id of ['#next', '#previous']) {
          const link = page.locator(id);

          await expect(link).not.toHaveAttribute('href');
          await expect(link).not.toHaveAttribute('disabled');
          await expect(link).toHaveAttribute('role', 'link');
          await expect(link).toHaveAttribute('aria-disabled', 'true');
          expect(await takesFocus(link), `${id} takes no focus`).toBe(false);

          await pointerClick(page, link);
          await page.keyboard.press('Enter');

          expect(page.url()).toBe(url);
        }
      });
    });
  });
}
