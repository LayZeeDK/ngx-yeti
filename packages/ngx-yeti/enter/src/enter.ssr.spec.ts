import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { NgxYetiEnter } from './enter';

/**
 * A bare host, a slide from the end edge, and a staggered list that arrives
 * once (enter.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-enter-fixture',
  imports: [NgxYetiEnter],
  template:
    '<p yetiEnter i18n>A headline that fades in.</p><p yetiEnter="slide" side="end">A panel from the end edge.</p><ul yetiEnter="rise" stagger once role="list"><li>Hills</li><li>Lakes</li></ul>',
})
class EnterFixture {}

function render(): Promise<string> {
  return renderServer(EnterFixture);
}

describe(NgxYetiEnter, () => {
  it('renders the bare host with its class and presence attribute only', async () => {
    expect.assertions(7);

    const html = await render();
    const [bare] = openingTags(html, 'p');
    assert.exists(bare);

    expect(attributeValue(bare, 'class')).toBe('enter');
    expect(attributeValue(bare, 'data-ngx-yeti-item-enter')).toBe('');
    expect(attributeValue(bare, 'data-enter')).toBeNull();
    expect(attributeValue(bare, 'data-side')).toBeNull();
    expect(attributeValue(bare, 'data-once')).toBeNull();
    expect(attributeValue(bare, 'data-stagger')).toBeNull();
    expect(html).toContain('A headline that fades in.');
  });

  it('renders the slide and its side', async () => {
    expect.assertions(3);

    const [, slide] = openingTags(await render(), 'p');
    assert.exists(slide);

    expect(attributeValue(slide, 'class')).toBe('enter');
    expect(attributeValue(slide, 'data-enter')).toBe('slide');
    expect(attributeValue(slide, 'data-side')).toBe('end');
  });

  it('renders the staggered list with data-once and its own role', async () => {
    expect.assertions(7);

    const [list, ...rest] = openingTags(await render(), 'ul');
    assert.exists(list);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(list, 'class')).toBe('enter');
    expect(attributeValue(list, 'data-enter')).toBe('rise');
    expect(attributeValue(list, 'data-stagger')).toBe('');
    expect(attributeValue(list, 'data-once')).toBe('');
    expect(attributeValue(list, 'role')).toBe('list');
    expect(attributeValue(list, 'data-ngx-yeti-item-enter')).toBe('');
  });

  it('writes one enter item link into the head', async () => {
    expect.assertions(5);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [enter, ...rest] = links;
    assert.exists(enter);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(enter, 'data-ngx-yeti-styles')).toBe('enter');
    expect(attributeValue(enter, 'data-ngx-yeti-app')).toBe('ng');
    expect(attributeValue(enter, 'data-beasties-skip')).toBe('');
    expect(attributeValue(enter, 'href')).toMatch(
      /^yeti-css\/utilities\/enter\/enter\.css\?v=[0-9a-f]{40}$/,
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
