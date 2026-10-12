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
import { YetiTimeline } from './timeline';

/**
 * Yeti's example with a static `alternate`, `gap="md"`, and `role="list"`
 * (timeline.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-timeline-fixture',
  imports: [YetiTimeline],
  template:
    '<ol yetiTimeline alternate gap="md" role="list"><li><time datetime="2026-09-12">12 September</time><h3 i18n>The plan</h3><p>Twelve layouts on paper.</p></li><li><time datetime="2026-09-13">13 September</time><h3>The layouts</h3><p>Fifteen of them, in the browser.</p></li><li><time datetime="2026-09-14">14 September</time><h3>The components</h3><p>Eight, and two themes.</p></li></ol>',
})
class TimelineFixture {}

function render(): Promise<string> {
  return renderServer(TimelineFixture);
}

describe(YetiTimeline, () => {
  it('renders the list with its class, presence attribute, static inputs, and role', async () => {
    expect.assertions(7);

    const html = await render();
    const [list, ...rest] = openingTags(html, 'ol');
    assert.exists(list);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(list, 'class')).toBe('timeline');
    expect(attributeValue(list, 'data-ngx-yeti-item-timeline')).toBe('');
    expect(attributeValue(list, 'data-alternate')).toBe('');
    expect(attributeValue(list, 'data-gap')).toBe('md');
    expect(attributeValue(list, 'role')).toBe('list');
    expect(html).toContain('The plan');
  });

  it('keeps each entry a direct li child holding its time with datetime', async () => {
    expect.assertions(2);

    const html = await render();
    const body = /<ol\b[^>]*>(?<entries>.*?)<\/ol>/su.exec(html)?.groups?.[
      'entries'
    ];
    assert.exists(body);

    expect(
      body.replace(/<li\b[^>]*>.*?<\/li>/gsu, '').replace(/<!--.*?-->/gsu, ''),
    ).toBe('');
    expect(
      openingTags(body, 'time').map((tag) => attributeValue(tag, 'datetime')),
    ).toStrictEqual(['2026-09-12', '2026-09-13', '2026-09-14']);
  });

  it('writes one timeline item link into the head', async () => {
    expect.assertions(4);

    const html = await render();
    const link = itemLinkOf(html, 'timeline');

    expect(
      headLinks(html).filter(
        (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
      ),
    ).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'timeline'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
