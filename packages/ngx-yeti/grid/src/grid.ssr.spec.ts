import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiColumns } from 'ngx-yeti';
import { YetiGrid } from './grid';
import { YetiGridChild } from './grid-child';

/**
 * A list grid with a bound `columns`, and a tracks grid with two placed
 * cells, one of them an `ol` written with the static `start` (grid.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-grid-fixture',
  imports: [YetiGrid, YetiGridChild],
  template:
    '<ul yetiGrid min="2xs" role="list" [columns]="columns()"><li i18n>One trail</li><li>Two trails</li><li>Three trails</li></ul><div yetiGrid tracks="12" threshold="md"><figure yetiGridChild start="2" span="6"><figcaption i18n>The first work</figcaption></figure><ol yetiGridChild start="9" span="4"><li>The first step</li><li>The second step</li></ol></div>',
})
class GridFixture {
  protected readonly columns = signal<YetiColumns>('3');
}

function render(): Promise<string> {
  return renderServer(GridFixture);
}

describe(YetiGrid, () => {
  it('renders the list grid with its class, presence attribute, and bound columns', async () => {
    expect.assertions(7);

    const html = await render();
    const [list, ...rest] = openingTags(html, 'ul');
    assert.exists(list);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(list, 'class')).toBe('grid');
    expect(attributeValue(list, 'data-ngx-yeti-item-grid')).toBe('');
    expect(attributeValue(list, 'data-min')).toBe('2xs');
    expect(attributeValue(list, 'data-columns')).toBe('3');
    expect(attributeValue(list, 'role')).toBe('list');
    expect(html).toContain('One trail');
  });

  it('renders no attribute for an unset input on the list grid', async () => {
    expect.assertions(1);

    const [list] = openingTags(await render(), 'ul');
    assert.exists(list);

    expect(
      [
        'data-gap',
        'data-rows',
        'data-fold',
        'data-tracks',
        'data-threshold',
      ].filter((name) => attributeValue(list, name) !== null),
    ).toStrictEqual([]);
  });

  it('renders the tracks grid with data-tracks and data-threshold', async () => {
    expect.assertions(3);

    const [tracks] = openingTags(await render(), 'div');
    assert.exists(tracks);

    expect(attributeValue(tracks, 'class')).toBe('grid');
    expect(attributeValue(tracks, 'data-tracks')).toBe('12');
    expect(attributeValue(tracks, 'data-threshold')).toBe('md');
  });

  it("renders each cell's markers, and no start or presence attribute on them", async () => {
    expect.assertions(8);

    const html = await render();
    const [figure] = openingTags(html, 'figure');
    const [list] = openingTags(html, 'ol');
    assert.exists(figure);
    assert.exists(list);

    expect(attributeValue(figure, 'data-start')).toBe('2');
    expect(attributeValue(figure, 'data-span')).toBe('6');
    expect(attributeValue(figure, 'start')).toBeNull();
    expect(attributeValue(list, 'data-start')).toBe('9');
    expect(attributeValue(list, 'data-span')).toBe('4');
    expect(attributeValue(list, 'start')).toBeNull();
    expect(attributeValue(list, 'span')).toBe('4');
    expect(`${figure}${list}`).not.toContain('data-ngx-yeti-');
  });

  it('writes one grid item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [grid, ...rest] = links;
    assert.exists(grid);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(grid, 'data-ngx-yeti-styles')).toBe('grid');
    expect(attributeValue(grid, 'data-beasties-skip')).toBe('');
    expect(attributeValue(grid, 'href')).toMatch(
      /^yeti-css\/layouts\/grid\/grid\.css\?v=[0-9a-f]{40}$/,
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
