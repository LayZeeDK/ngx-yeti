import { Component } from '@angular/core';
import {
  attributeValue,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { NgxYetiColumns } from './columns';
import { YetiColumnsChild } from './columns-child';

/**
 * Yeti's example with a static `align` and one spanning child (columns.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-columns-fixture',
  imports: [NgxYetiColumns, YetiColumnsChild, YetiBox, YetiBorder],
  template:
    '<div yetiColumns threshold="md" align="center"><section yetiBox surface="raised" yetiBorder><h2 i18n>Plan</h2><p>Three equal columns in a wide container.</p></section><section yetiBox surface="raised" yetiBorder><h2 i18n>Build</h2><p>Three rows in a narrow one.</p></section><section yetiBox surface="raised" yetiBorder yetiColumnsChild span="2"><h2 i18n>Ship</h2><p>No breakpoint anywhere.</p></section></div>',
})
class ColumnsFixture {}

function render(): Promise<string> {
  return renderServer(ColumnsFixture);
}

describe(NgxYetiColumns, () => {
  it('renders the columns host with its class, presence attribute, and inputs, and no align', async () => {
    expect.assertions(8);

    const html = await render();
    const [columns, ...rest] = openingTags(html, 'div');
    assert.exists(columns);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(columns, 'class')).toBe('columns');
    expect(attributeValue(columns, 'data-ngx-yeti-item-columns')).toBe('');
    expect(attributeValue(columns, 'data-threshold')).toBe('md');
    expect(attributeValue(columns, 'data-align')).toBe('center');
    expect(attributeValue(columns, 'align')).toBeNull();
    expect(attributeValue(columns, 'data-columns')).toBeNull();
    expect(html).toContain('No breakpoint anywhere.');
  });

  it("renders the spanning child's marker and no columns presence attribute on it", async () => {
    expect.assertions(3);

    const sections = openingTags(await render(), 'section');
    const spanning = sections.filter(
      (tag) => attributeValue(tag, 'data-span') !== null,
    );
    const [child] = spanning;
    assert.exists(child);

    expect(spanning).toHaveLength(1);
    expect(attributeValue(child, 'data-span')).toBe('2');
    expect(attributeValue(child, 'data-ngx-yeti-item-columns')).toBeNull();
  });

  it('writes one columns item link into the head', async () => {
    expect.assertions(3);

    const link = itemLinkOf(await render(), 'columns');

    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'columns'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
