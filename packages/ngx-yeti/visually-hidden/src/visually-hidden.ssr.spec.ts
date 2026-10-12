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

    const html = await render();
    const links = headLinks(html).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [only] = links;
    const link = itemLinkOf(html, 'visually-hidden');
    assert.exists(only);

    expect(links).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(attributeValue(only, 'data-ngx-yeti-app')).toBe('ng');
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('utilities', 'visually-hidden'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
