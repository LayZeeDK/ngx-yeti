import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiHeight } from 'ngx-yeti';
import { YetiCover } from './cover';
import { YetiCoverChild } from './cover-child';

/**
 * A band with a bound `height` and a centred heading (cover.md, Testing
 * Decisions, layer 3).
 */
@Component({
  selector: 'yeti-cover-fixture',
  imports: [YetiCover, YetiCoverChild],
  template:
    '<header yetiCover [height]="height()"><h1 yetiCoverChild center i18n>Trail maps</h1><p i18n>Printed maps you can walk by.</p></header>',
})
class CoverFixture {
  protected readonly height = signal<YetiHeight>('md');
}

function render(): Promise<string> {
  return renderServer(CoverFixture);
}

describe(YetiCover, () => {
  it('renders the cover host with its class, presence attribute, and height', async () => {
    expect.assertions(6);

    const html = await render();
    const [cover] = openingTags(html, 'header');
    assert.exists(cover);

    expect(attributeValue(cover, 'class')).toBe('cover');
    expect(attributeValue(cover, 'data-ngx-yeti-item-cover')).toBe('');
    expect(attributeValue(cover, 'data-height')).toBe('md');
    expect(attributeValue(cover, 'data-gap')).toBeNull();
    expect(attributeValue(cover, 'height')).toBeNull();
    expect(html).toContain('Printed maps you can walk by.');
  });

  it("renders the centred child's marker and no cover presence attribute on it", async () => {
    expect.assertions(2);

    const [heading] = openingTags(await render(), 'h1');
    assert.exists(heading);

    expect(attributeValue(heading, 'data-center')).toBe('');
    expect(attributeValue(heading, 'data-ngx-yeti-item-cover')).toBeNull();
  });

  it('writes one cover item link into the head', async () => {
    expect.assertions(3);

    const covers = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') === 'cover',
    );
    const [cover] = covers;
    assert.exists(cover);

    expect(covers).toHaveLength(1);
    expect(attributeValue(cover, 'data-beasties-skip')).toBe('');
    expect(attributeValue(cover, 'href')).toMatch(
      /^yeti-css\/layouts\/cover\/cover\.css\?v=[0-9a-f]{40}$/,
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
