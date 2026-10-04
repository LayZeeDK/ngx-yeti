import { expect, type Locator, type Page } from '@playwright/test';
import { itemLinks } from './style-probe';

/**
 * Removes the hosts matching `selector` from the DOM. Angular keeps a
 * dehydrated block's server DOM even after its parent view is destroyed
 * (measured with an `@if` around a `hydrate never` block), so no control can
 * remove such a host; the test does.
 */
export async function removeDehydratedHosts(
  page: Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).evaluateAll((hosts) => {
    for (const host of hosts) {
      host.remove();
    }
  });
}

/**
 * Clicks the button named `button`, which removes the live hosts, removes
 * the dehydrated hosts matching `dehydrated`, and waits for `<head>` to hold
 * no item link.
 */
export async function removeEveryHost(
  page: Page,
  button: string,
  dehydrated: string,
): Promise<void> {
  await page.getByRole('button', { name: button }).click();
  await removeDehydratedHosts(page, dehydrated);
  await expect(page.locator('[data-ngx-yeti-item-card]')).toHaveCount(0);
  await expect.poll(() => itemLinks(page)).toEqual([]);
}

/** Hovers the card with the real pointer and expects its top to rise. */
export async function expectHoverLifts(
  page: Page,
  card: Locator,
): Promise<void> {
  // Yeti's `.lift` transition list; an element without Yeti computes `all`.
  await expect(card).not.toHaveCSS('transition-property', 'all');

  // Away from the card first, then wait until two reads agree, so the hover
  // starts from rest.
  await page.mouse.move(0, 0);

  let before = await card.boundingBox();

  await expect
    .poll(
      async () => {
        const previous = before?.y;

        before = await card.boundingBox();

        return before !== null && before.y === previous;
      },
      { message: 'the card comes to rest' },
    )
    .toBe(true);

  if (before === null) {
    throw new Error('The card is not rendered');
  }

  await card.hover();

  await expect
    .poll(async () => (await card.boundingBox())?.y, {
      message: "the hovered card's top decreases",
    })
    .toBeLessThan(before.y);
}
