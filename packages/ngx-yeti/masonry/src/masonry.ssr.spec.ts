import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
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

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [masonry, ...rest] = links;
    assert.exists(masonry);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(masonry, 'data-ngx-yeti-styles')).toBe('masonry');
    expect(attributeValue(masonry, 'data-beasties-skip')).toBe('');
    expect(attributeValue(masonry, 'href')).toMatch(
      /^yeti-css\/layouts\/masonry\/masonry\.css\?v=[0-9a-f]{40}$/,
    );
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(
      allOpeningTags(await render(), '[a-z][\\w-]*').filter(
        (tag) => attributeValue(tag, 'jsaction') !== null,
      ),
    ).toStrictEqual([]);
  });
});
