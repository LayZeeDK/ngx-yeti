import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiVisuallyHidden } from './visually-hidden';

/**
 * Yeti's read-more link, with the visible and hidden words in one `i18n`
 * message (visually-hidden.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-visually-hidden-fixture',
  imports: [YetiVisuallyHidden],
  template:
    '<a href="/trail-map.pdf" i18n>Read more<span yetiVisuallyHidden> about the trail map</span></a>',
})
class VisuallyHiddenFixture {}

function render(): Promise<string> {
  return renderServer(VisuallyHiddenFixture);
}

describe(YetiVisuallyHidden, () => {
  it('renders the span with its class and presence attribute and the translated words', async () => {
    expect.assertions(4);

    const html = await render();
    const [span, ...rest] = openingTags(html, 'span');
    assert.exists(span);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(span, 'class')).toBe('visually-hidden');
    expect(attributeValue(span, 'data-ngx-yeti-item-visually-hidden')).toBe('');
    expect(html).toMatch(/Read more<span[^>]*> about the trail map<\/span>/);
  });

  it('writes one visually-hidden item link into the head', async () => {
    expect.assertions(5);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [link, ...rest] = links;
    assert.exists(link);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(link, 'data-ngx-yeti-styles')).toBe(
      'visually-hidden',
    );
    expect(attributeValue(link, 'data-ngx-yeti-app')).toBe('ng');
    expect(attributeValue(link, 'data-beasties-skip')).toBe('');
    expect(attributeValue(link, 'href')).toMatch(
      /^yeti-css\/utilities\/visually-hidden\/visually-hidden\.css\?v=[0-9a-f]{40}$/,
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
