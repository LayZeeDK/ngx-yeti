import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { NgxYetiColumns } from './columns';
import { YetiColumnsChild } from './columns-child';

const widths = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const gaps = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'xs-sm',
  'xs-md',
  'xs-lg',
  'xs-xl',
  'xs-2xl',
  'xs-3xl',
  'sm-md',
  'sm-lg',
  'sm-xl',
  'sm-2xl',
  'sm-3xl',
  'md-lg',
  'md-xl',
  'md-2xl',
  'md-3xl',
  'lg-xl',
  'lg-2xl',
  'lg-3xl',
  'xl-2xl',
  'xl-3xl',
  '2xl-3xl',
] as const;
const alignments = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
const justifications = [
  'start',
  'center',
  'end',
  'between',
  'around',
  'evenly',
] as const;
const counts = ['1', '2', '3', '4', '5', '6'] as const;
const spans = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<NgxYetiColumns['threshold']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<NgxYetiColumns['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<NgxYetiColumns['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<NgxYetiColumns['justify']>>().toEqualTypeOf<
  (typeof justifications)[number] | undefined
>();
expectTypeOf<ReturnType<NgxYetiColumns['columns']>>().toEqualTypeOf<
  (typeof counts)[number] | undefined
>();
expectTypeOf<ReturnType<YetiColumnsChild['span']>>().toEqualTypeOf<
  (typeof spans)[number] | undefined
>();

describe('columns contract', () => {
  it('maps the manifest component to NgxYetiColumns and YetiColumnsChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.columns, {
        class: NgxYetiColumns,
        attributes: {
          'data-threshold': {
            directive: NgxYetiColumns,
            input: 'threshold',
            values: widths,
          },
          'data-gap': { directive: NgxYetiColumns, input: 'gap', values: gaps },
          'data-align': {
            directive: NgxYetiColumns,
            input: 'align',
            values: alignments,
          },
          'data-justify': {
            directive: NgxYetiColumns,
            input: 'justify',
            values: justifications,
          },
          'data-columns': {
            directive: NgxYetiColumns,
            input: 'columns',
            values: counts,
          },
        },
        markers: {
          'data-span': {
            directive: YetiColumnsChild,
            input: 'span',
            values: spans,
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
