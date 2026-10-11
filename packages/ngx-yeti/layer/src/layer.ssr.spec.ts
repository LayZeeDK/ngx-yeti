import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiLayer } from './layer';
import { YetiLayerChild } from './layer-child';

/**
 * Yeti's captioned picture with a static `align="end"`, a translated caption,
 * and a translated `alt` (layer.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-layer-fixture',
  imports: [NgOptimizedImage, YetiLayer, YetiLayerChild],
  template:
    '<figure yetiLayer align="end"><img ngSrc="harbour.jpg" width="1200" height="800" alt="Boats in a harbour at dawn" i18n-alt /><figcaption yetiLayerChild alignSelf="end" i18n>Dawn at the harbour</figcaption></figure>',
})
class LayerFixture {}

function render(): Promise<string> {
  return renderServer(LayerFixture);
}

describe(YetiLayer, () => {
  it('renders the layer host with its class, presence attribute, and static align on data-align only', async () => {
    expect.assertions(5);

    const [figure, ...rest] = openingTags(await render(), 'figure');
    assert.exists(figure);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(figure, 'class')).toBe('layer');
    expect(attributeValue(figure, 'data-ngx-yeti-item-layer')).toBe('');
    expect(attributeValue(figure, 'data-align')).toBe('end');
    expect(attributeValue(figure, 'align')).toBeNull();
  });

  it('renders the caption marker and its translated text, with no presence attribute', async () => {
    expect.assertions(4);

    const html = await render();
    const [caption] = openingTags(html, 'figcaption');
    assert.exists(caption);

    expect(attributeValue(caption, 'data-align-self')).toBe('end');
    expect(attributeValue(caption, 'data-justify-self')).toBeNull();
    expect(caption).not.toContain('data-ngx-yeti-');
    expect(html).toContain('Dawn at the harbour');
  });

  it('writes one layer item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [layer, ...rest] = links;
    assert.exists(layer);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(layer, 'data-ngx-yeti-styles')).toBe('layer');
    expect(attributeValue(layer, 'data-beasties-skip')).toBe('');
    expect(attributeValue(layer, 'href')).toMatch(
      /^yeti-css\/layouts\/layer\/layer\.css\?v=[0-9a-f]{40}$/,
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
