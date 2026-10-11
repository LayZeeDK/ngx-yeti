import { NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiGap } from 'ngx-yeti';
import { YetiOverlay } from './overlay';
import { YetiOverlayChild } from './overlay-child';

/**
 * Section 8's stamp with a bound `gap` and a translated held child, and a
 * second overlay whose held child carries a static `fill` (overlay.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-overlay-fixture',
  imports: [NgOptimizedImage, YetiOverlay, YetiOverlayChild],
  template:
    '<div id="stamp" yetiOverlay [gap]="gap()"><img ngSrc="lake.jpg" width="1200" height="800" alt="A lake at dawn" /><p id="held" yetiOverlayChild over i18n>Sold out</p></div><form id="veil" yetiOverlay><label for="email">Email</label><input id="email" type="email" /><div id="filled" yetiOverlayChild over fill>Saving</div></form>',
})
class OverlayFixture {
  protected readonly gap = signal<YetiGap>('sm');
}

function render(): Promise<string> {
  return renderServer(OverlayFixture);
}

function byId(tags: readonly string[], id: string): string {
  const tag = tags.find((candidate) => attributeValue(candidate, 'id') === id);
  assert.exists(tag);

  return tag;
}

describe(YetiOverlay, () => {
  it('renders both overlay hosts with their class, presence attribute, and bound gap', async () => {
    expect.assertions(7);

    const html = await render();
    const stamp = byId(openingTags(html, 'div'), 'stamp');
    const veil = byId(openingTags(html, 'form'), 'veil');

    for (const host of [stamp, veil]) {
      expect(attributeValue(host, 'class')).toBe('overlay');
      expect(attributeValue(host, 'data-ngx-yeti-item-overlay')).toBe('');
      expect(attributeValue(host, 'data-fixed')).toBeNull();
    }

    expect(attributeValue(stamp, 'data-gap')).toBe('sm');
  });

  it('renders the held children with their markers, a static fill beside data-fill, and no presence attribute', async () => {
    expect.assertions(7);

    const html = await render();
    const held = byId(openingTags(html, 'p'), 'held');
    const filled = byId(openingTags(html, 'div'), 'filled');

    expect(attributeValue(held, 'data-over')).toBe('');
    expect(attributeValue(held, 'data-fill')).toBeNull();
    expect(attributeValue(filled, 'data-over')).toBe('');
    expect(attributeValue(filled, 'data-fill')).toBe('');
    expect(attributeValue(filled, 'fill')).toBe('');
    expect(`${held}${filled}`).not.toContain('data-ngx-yeti-');
    expect(html).toContain('Sold out');
  });

  it('writes one overlay item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [overlay, ...rest] = links;
    assert.exists(overlay);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(overlay, 'data-ngx-yeti-styles')).toBe('overlay');
    expect(attributeValue(overlay, 'data-beasties-skip')).toBe('');
    expect(attributeValue(overlay, 'href')).toMatch(
      /^yeti-css\/layouts\/overlay\/overlay\.css\?v=[0-9a-f]{40}$/,
    );
  });

  it('puts no jsaction, inert, or aria-hidden on any element', async () => {
    expect.assertions(1);

    expect(
      allOpeningTags(await render(), '[a-z][\\w-]*').filter((tag) =>
        ['jsaction', 'inert', 'aria-hidden'].some(
          (name) => attributeValue(tag, name) !== null,
        ),
      ),
    ).toStrictEqual([]);
  });
});
