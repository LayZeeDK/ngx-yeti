import { Component } from '@angular/core';
import {
  attributeValue,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiMasonry } from './masonry';

/**
 * Yeti's example with captioned items and the static `min` and `columns`
 * (masonry.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-masonry-fixture',
  imports: [YetiMasonry],
  template:
    '<div yetiMasonry min="xs" columns="3"><figure><figcaption i18n>A tall waterfall</figcaption></figure><figure><figcaption>A wide valley</figcaption></figure><figure><figcaption>A square pond</figcaption></figure></div>',
})
class MasonryFixture {}

function render(): Promise<string> {
  return renderServer(MasonryFixture);
}

describe(YetiMasonry, () => {
  it('renders the host with its class, presence attribute, and attributes', async () => {
    expect.assertions(8);

    const html = await render();
    const [host, ...rest] = openingTags(html, 'div');
    assert.exists(host);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(host, 'class')).toBe('masonry');
    expect(attributeValue(host, 'data-ngx-yeti-item-masonry')).toBe('');
    expect(attributeValue(host, 'data-min')).toBe('xs');
    expect(attributeValue(host, 'data-columns')).toBe('3');
    expect(attributeValue(host, 'data-gap')).toBeNull();
    expect(attributeValue(host, 'min')).toBe('xs');
    expect(html).toContain('A tall waterfall');
  });

  it('writes one masonry item link into the head', async () => {
    expect.assertions(4);

    const html = await render();
    const link = itemLinkOf(html, 'masonry');

    expect(
      headLinks(html).filter(
        (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
      ),
    ).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'masonry'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
