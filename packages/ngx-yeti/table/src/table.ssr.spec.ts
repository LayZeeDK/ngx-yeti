import { Component } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiTable } from './table';
import { YetiTableCell } from './table-cell';
import { YetiNumeric } from './table-numeric';

/**
 * Every input, the static `border`, `align`, and `nowrap` forms, and an
 * explicit `tbody` whose rows come from `@for` (table.md, Testing
 * Decisions, layer 3).
 */
@Component({
  selector: 'yeti-table-fixture',
  imports: [YetiTable, YetiTableCell, YetiNumeric],
  template:
    '<table yetiTable size="sm" striped hover border nowrap fixed><caption i18n>Summits</caption><thead><tr><th scope="col" yetiTableCell align="center">Peak</th><th scope="col" yetiNumeric>Height (m)</th></tr></thead><tbody>@for (summit of summits; track summit.name) {<tr yetiTableCell align="center"><td yetiTableCell nowrap>{{ summit.name }}</td><td yetiNumeric>{{ summit.height }}</td></tr>}</tbody></table>',
})
class TableFixture {
  protected readonly summits = [
    { name: 'Ben Nevis', height: '1,345' },
    { name: 'Snowdon', height: '1,085' },
  ];
}

@Component({
  selector: 'yeti-table-numeric-fixture',
  imports: [YetiNumeric],
  template: '<p i18n>Total: <span yetiNumeric>1,345</span></p>',
})
class NumericFixture {}

/**
 * An attribute of a cell or row opening tag. The HTML parser drops a lone
 * `<tr>`, `<th>`, or `<td>` outside a table, so the tag is read as a `div`.
 */
function partAttribute(tag: string, name: string): string | null {
  return attributeValue(tag.replace(/^<[a-z]+/, '<div'), name);
}

/**
 * The page with every table part renamed `div`, for readers that parse each
 * opening tag alone (the parser drops a lone table part).
 */
function asDivs(html: string): string {
  return html.replaceAll(
    /<(\/?)(?:caption|thead|tbody|tr|th|td)(?=[\s>])/g,
    '<$1div',
  );
}

function render(): Promise<string> {
  return renderServer(TableFixture);
}

describe(YetiTable, () => {
  it('renders the table with its class, presence attribute, and inputs, and no border', async () => {
    expect.assertions(10);

    const [table, ...rest] = openingTags(await render(), 'table');
    assert.exists(table);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(table, 'class')).toBe('table');
    expect(attributeValue(table, 'data-ngx-yeti-item-table')).toBe('');
    expect(attributeValue(table, 'data-size')).toBe('sm');

    for (const name of ['striped', 'hover', 'border', 'nowrap', 'fixed']) {
      expect(attributeValue(table, `data-${name}`)).toBe('');
    }

    expect(attributeValue(table, 'border')).toBeNull();
  });

  it('renders data-align and no align on each aligned cell and row', async () => {
    expect.assertions(4);

    const aligned = allOpeningTags(await render(), 't[hrd]').filter(
      (tag) => partAttribute(tag, 'data-align') !== null,
    );

    expect(aligned).toHaveLength(3);
    expect(
      aligned.map((tag) => partAttribute(tag, 'data-align')),
    ).toStrictEqual(['center', 'center', 'center']);
    expect(aligned.map((tag) => partAttribute(tag, 'align'))).toStrictEqual([
      null,
      null,
      null,
    ]);
    expect(
      aligned.map((tag) => partAttribute(tag, 'data-ngx-yeti-item-table')),
    ).toStrictEqual([null, null, null]);
  });

  it('renders data-nowrap and no nowrap on each nowrap cell', async () => {
    expect.assertions(2);

    const cells = openingTags(await render(), 'td').filter(
      (tag) => partAttribute(tag, 'data-nowrap') !== null,
    );

    expect(cells.map((tag) => partAttribute(tag, 'data-nowrap'))).toStrictEqual(
      ['', ''],
    );
    expect(cells.map((tag) => partAttribute(tag, 'nowrap'))).toStrictEqual([
      null,
      null,
    ]);
  });

  it('renders data-numeric on the numeric cells', async () => {
    expect.assertions(1);

    const numeric = allOpeningTags(await render(), 't[hd]').filter(
      (tag) => partAttribute(tag, 'data-numeric') === '',
    );

    expect(numeric).toHaveLength(3);
  });

  it("keeps the consumer's tbody with the rows inside it", async () => {
    expect.assertions(3);

    const html = await render();
    const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';

    expect(openingTags(html, 'tbody')).toHaveLength(1);
    expect(body).toContain('Ben Nevis');
    expect(body.match(/<tr /g)).toHaveLength(2);
  });

  it('writes one table item link into the head', async () => {
    expect.assertions(3);

    const link = itemLinkOf(await render(), 'table');

    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('components', 'table'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(asDivs(await render()))).toStrictEqual([]);
  });
});

describe(YetiNumeric, () => {
  it('renders data-numeric and writes no item link without a table', async () => {
    expect.assertions(3);

    const html = await renderServer(NumericFixture);
    const [span] = openingTags(html, 'span');
    assert.exists(span);

    expect(attributeValue(span, 'data-numeric')).toBe('');
    expect(attributeValue(span, 'class')).toBeNull();
    expect(itemLinkOf(html, 'table').count).toBe(0);
  });
});
