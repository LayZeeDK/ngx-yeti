import { Component, signal } from '@angular/core';
import {
  attributeValue,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiSurface } from 'ngx-yeti';
import { YetiBox } from './box';
import { YetiBorder } from './box-border';
import { NgxYetiPaint } from './box-paint';
import { YetiText } from './box-text';

/**
 * A box with every input, one with none, and the two colour markers outside
 * any box (box.md, Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-box-fixture',
  imports: [YetiBox, YetiBorder, NgxYetiPaint, YetiText],
  template:
    '<section yetiBox gap="lg" gapInline="xl" gapBlock="sm" yetiBorder [surface]="surface()"><h2 i18n>A box you can see</h2><p>Prose inside a box keeps its rhythm.</p></section><article yetiBox><p>An unset box</p></article><p yetiText="grey-70">Muted words</p><span yetiPaint="primary">A band</span>',
})
class BoxFixture {
  protected readonly surface = signal<YetiSurface>('raised');
}

/** Markers on their own: no box, so no item file. */
@Component({
  selector: 'yeti-box-markers-fixture',
  imports: [YetiBorder, NgxYetiPaint, YetiText],
  template:
    '<figure yetiBorder><figcaption i18n>A bordered figure</figcaption></figure><p yetiText="grey-70">Muted words</p><span yetiPaint="primary">A band</span>',
})
class BoxMarkersFixture {}

function render(): Promise<string> {
  return renderServer(BoxFixture);
}

function itemLinkTags(html: string): string[] {
  return headLinks(html).filter(
    (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
  );
}

describe(YetiBox, () => {
  it('renders the box host with its class, presence attribute, and bound attributes', async () => {
    expect.assertions(8);

    const html = await render();
    const [box] = openingTags(html, 'section');
    assert.exists(box);

    expect(attributeValue(box, 'class')).toBe('box');
    expect(attributeValue(box, 'data-ngx-yeti-item-box')).toBe('');
    expect(attributeValue(box, 'data-gap')).toBe('lg');
    expect(attributeValue(box, 'data-gap-inline')).toBe('xl');
    expect(attributeValue(box, 'data-gap-block')).toBe('sm');
    expect(attributeValue(box, 'data-surface')).toBe('raised');
    expect(attributeValue(box, 'data-border')).toBe('');
    expect(html).toContain('A box you can see');
  });

  it('renders none of the attributes where every input is unset', async () => {
    expect.assertions(5);

    const [box] = openingTags(await render(), 'article');
    assert.exists(box);

    expect(attributeValue(box, 'class')).toBe('box');
    expect(attributeValue(box, 'data-gap')).toBeNull();
    expect(attributeValue(box, 'data-gap-inline')).toBeNull();
    expect(attributeValue(box, 'data-gap-block')).toBeNull();
    expect(attributeValue(box, 'data-surface')).toBeNull();
  });

  it('renders each colour marker as its attribute with no class', async () => {
    expect.assertions(4);

    const html = await render();
    const [text] = openingTags(html, 'p').filter(
      (tag) => attributeValue(tag, 'yetitext') !== null,
    );
    const [paint] = openingTags(html, 'span');
    assert.exists(text);
    assert.exists(paint);

    expect(attributeValue(text, 'data-text')).toBe('grey-70');
    expect(attributeValue(text, 'class')).toBeNull();
    expect(attributeValue(paint, 'data-paint')).toBe('primary');
    expect(attributeValue(paint, 'class')).toBeNull();
  });

  it('writes one box item link into the head', async () => {
    expect.assertions(4);

    const html = await render();
    const link = itemLinkOf(html, 'box');

    expect(itemLinkTags(html)).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'box'));
  });

  it('writes no item link for markers without a box', async () => {
    expect.assertions(2);

    const html = await renderServer(BoxMarkersFixture);

    expect(html).toContain('data-border=""');
    expect(itemLinkTags(html)).toStrictEqual([]);
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
