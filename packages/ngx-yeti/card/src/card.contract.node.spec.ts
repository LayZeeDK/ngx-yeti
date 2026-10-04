import { Component } from '@angular/core';
import {
  attributeValue,
  checkContract,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiRatio, YetiVariant, YetiWidth } from 'ngx-yeti';
import manifest from 'yeti-css/manifest';
import { YetiCard } from './card';
import { YetiCardLink } from './card-link';

// Compile-time half: each list is a subset of the union and misses none of it.
const variants = [
  'primary',
  'secondary',
  'success',
  'warning',
  'alert',
  'danger',
  'neutral',
  'black',
  'white',
] as const satisfies readonly YetiVariant[];
const widths = [
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const satisfies readonly YetiWidth[];
const ratios = [
  '1/1',
  '4/3',
  '3/2',
  '16/9',
  '21/9',
] as const satisfies readonly YetiRatio[];

expectTypeOf<(typeof variants)[number]>().toEqualTypeOf<YetiVariant>();
expectTypeOf<(typeof widths)[number]>().toEqualTypeOf<YetiWidth>();
expectTypeOf<(typeof ratios)[number]>().toEqualTypeOf<YetiRatio>();

@Component({
  selector: 'yeti-card-contract-fixture',
  imports: [YetiCard, YetiCardLink],
  template:
    '@for (value of variants; track value) {<article yetiCard [variant]="value"></article>} @for (value of widths; track value) {<article yetiCard [threshold]="value"></article>} @for (value of ratios; track value) {<article yetiCard [ratio]="value"></article>} <article yetiCard raised><a yetiCardLink stretch href="#stretched" i18n>Stretched</a></article> <article yetiCard><a yetiCardLink href="#plain">Plain</a></article>',
})
class CardContractFixture {
  protected readonly variants = variants;
  protected readonly widths = widths;
  protected readonly ratios = ratios;
}

function nulls(count: number): null[] {
  return Array<null>(count).fill(null);
}

describe('card contract', () => {
  it('maps the manifest component to YetiCard and YetiCardLink', () => {
    expect(
      checkContract(manifest.components.card, {
        class: 'card',
        attributes: {
          'data-variant': {
            directive: YetiCard,
            input: 'variant',
            values: variants,
          },
          'data-threshold': {
            directive: YetiCard,
            input: 'threshold',
            values: widths,
          },
          'data-ratio': {
            directive: YetiCard,
            input: 'ratio',
            values: ratios,
          },
          'data-raised': { directive: YetiCard, input: 'raised' },
        },
        markers: {
          'data-stretch': { directive: YetiCardLink, input: 'stretch' },
        },
        events: {},
      }),
    ).toStrictEqual([]);
  });

  it('writes each mapped value, and nothing for unset inputs', async () => {
    expect.assertions(8);

    const html = await renderServer(CardContractFixture);
    const cards = openingTags(html, 'article');
    const attr = (name: string): (string | null)[] =>
      cards.map((tag) => attributeValue(tag, name));
    const unset = 2;
    const total = variants.length + widths.length + ratios.length + unset;

    expect(cards).toHaveLength(total);
    expect(attr('class')).toStrictEqual(Array<string>(total).fill('card'));
    expect(attr('data-variant')).toStrictEqual([
      ...variants,
      ...nulls(total - variants.length),
    ]);
    expect(attr('data-threshold')).toStrictEqual([
      ...nulls(variants.length),
      ...widths,
      ...nulls(ratios.length + unset),
    ]);
    expect(attr('data-ratio')).toStrictEqual([
      ...nulls(variants.length + widths.length),
      ...ratios,
      ...nulls(unset),
    ]);
    expect(attr('data-raised')).toStrictEqual([
      ...nulls(total - unset),
      '',
      null,
    ]);
    expect(
      openingTags(html, 'a').map((tag) => attributeValue(tag, 'data-stretch')),
    ).toStrictEqual(['', null]);
    expect(html).not.toContain('jsaction');
  });
});
