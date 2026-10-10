import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiWidth } from 'ngx-yeti';
import { YetiCard } from 'ngx-yeti/card';
import { YetiStack } from 'ngx-yeti/stack';
import { YetiCenter } from './center';

/**
 * A center with a bound `max` and one with every input unset, between a
 * card, which Yeti ranks later, and a stack, which it ranks earlier, so the
 * center's link is acquired after the card's and before the stack's and its
 * place in the head is the loader's work (center.md, Testing Decisions,
 * layer 3).
 */
@Component({
  selector: 'yeti-center-fixture',
  imports: [YetiCard, YetiCenter, YetiStack],
  template:
    '<article yetiCard><p>A card</p></article><main yetiCenter [max]="max()"><h1 i18n>A readable column</h1></main><section yetiCenter><p>An unset column</p></section><div yetiStack><p>A stack</p></div>',
})
class CenterFixture {
  protected readonly max = signal<YetiWidth>('md');
}

function render(): Promise<string> {
  return renderServer(CenterFixture);
}

describe(YetiCenter, () => {
  it('renders the center host with its class, presence attribute, and bound max', async () => {
    expect.assertions(6);

    const html = await render();
    const [center] = openingTags(html, 'main');
    assert.exists(center);

    expect(attributeValue(center, 'class')).toBe('center');
    expect(attributeValue(center, 'data-ngx-yeti-item-center')).toBe('');
    expect(attributeValue(center, 'data-max')).toBe('md');
    expect(attributeValue(center, 'data-gap')).toBeNull();
    expect(attributeValue(center, 'data-intrinsic')).toBeNull();
    expect(html).toContain('A readable column');
  });

  it('renders no data-max where max is unset', async () => {
    expect.assertions(2);

    const [center] = openingTags(await render(), 'section');
    assert.exists(center);

    expect(attributeValue(center, 'class')).toBe('center');
    expect(attributeValue(center, 'data-max')).toBeNull();
  });

  it('writes one center item link, after the stack link and before the card link', async () => {
    expect.assertions(3);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [center] = links.filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') === 'center',
    );
    assert.exists(center);

    expect(
      links.map((tag) => attributeValue(tag, 'data-ngx-yeti-styles')),
    ).toStrictEqual(['stack', 'center', 'card']);
    expect(attributeValue(center, 'data-beasties-skip')).toBe('');
    expect(attributeValue(center, 'href')).toMatch(
      /^yeti-css\/layouts\/center\/center\.css\?v=[0-9a-f]{40}$/,
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
