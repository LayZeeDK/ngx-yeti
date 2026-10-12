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
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiScroller } from './scroller';

/**
 * Section 8's markup, with a translated name and headings (scroller.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-scroller-fixture',
  imports: [YetiScroller, YetiBox, YetiBorder],
  template:
    '<div yetiScroller snap width="sm" aria-label="Featured articles" i18n-aria-label><article yetiBox yetiBorder surface="raised"><h2 i18n>One</h2></article><article yetiBox yetiBorder surface="raised"><h2 i18n>Two</h2></article><article yetiBox yetiBorder surface="raised"><h2 i18n>Three</h2></article><article yetiBox yetiBorder surface="raised"><h2 i18n>Four</h2></article></div>',
})
class ScrollerFixture {}

function render(): Promise<string> {
  return renderServer(ScrollerFixture);
}

describe(YetiScroller, () => {
  it('renders the scroller host with its class, role, tab stop, name, and attributes', async () => {
    expect.assertions(10);

    const html = await render();
    const [scroller, ...rest] = openingTags(html, 'div');
    assert.exists(scroller);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(scroller, 'class')).toBe('scroller');
    expect(attributeValue(scroller, 'role')).toBe('region');
    expect(attributeValue(scroller, 'tabindex')).toBe('0');
    expect(attributeValue(scroller, 'aria-label')).toBe('Featured articles');
    expect(attributeValue(scroller, 'data-ngx-yeti-item-scroller')).toBe('');
    expect(attributeValue(scroller, 'data-snap')).toBe('');
    expect(attributeValue(scroller, 'data-width')).toBe('sm');
    expect(attributeValue(scroller, 'width')).toBe('sm');
    expect(html).toContain('Four');
  });

  it('renders no attribute for an unset input', async () => {
    expect.assertions(2);

    const [scroller] = openingTags(await render(), 'div');
    assert.exists(scroller);

    expect(attributeValue(scroller, 'data-gap')).toBeNull();
    expect(attributeValue(scroller, 'data-justify')).toBeNull();
  });

  it('writes one scroller item link into the head', async () => {
    expect.assertions(3);

    const scroller = itemLinkOf(await render(), 'scroller');

    expect(scroller.count).toBe(1);
    expect(scroller.beastiesSkip).toBe(true);
    expect(scroller.href).toMatch(itemHref('layouts', 'scroller'));
  });

  it('writes the scroller link before the box link, in Yeti order', async () => {
    expect.assertions(1);

    const items = headLinks(await render())
      .map((tag) => attributeValue(tag, 'data-ngx-yeti-styles'))
      .filter((item) => item !== null);

    expect(items).toStrictEqual(['scroller', 'box']);
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
