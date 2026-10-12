import {
  checkContract,
  gaps,
  widths,
  widthsOrNone,
} from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiGrid } from './grid';
import { YetiGridChild } from './grid-child';

const columns = ['1', '2', '3', '4', '5', '6'] as const;
const rows = ['2', '3', '4', '5', '6'] as const;
const tracks = [
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
const lines = ['1', ...tracks] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiGrid['min']>>().toEqualTypeOf<
  (typeof widthsOrNone)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGrid['columns']>>().toEqualTypeOf<
  (typeof columns)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGrid['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGrid['rows']>>().toEqualTypeOf<
  (typeof rows)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGrid['fold']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiGrid['tracks']>>().toEqualTypeOf<
  (typeof tracks)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGrid['threshold']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGridChild['start']>>().toEqualTypeOf<
  (typeof lines)[number] | undefined
>();
expectTypeOf<ReturnType<YetiGridChild['span']>>().toEqualTypeOf<
  (typeof lines)[number] | undefined
>();

describe('grid contract', () => {
  it('maps the manifest component to YetiGrid and YetiGridChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.grid, {
        class: YetiGrid,
        attributes: {
          'data-min': {
            directive: YetiGrid,
            input: 'min',
            values: widthsOrNone,
          },
          'data-columns': {
            directive: YetiGrid,
            input: 'columns',
            values: columns,
          },
          'data-gap': { directive: YetiGrid, input: 'gap', values: gaps },
          'data-rows': { directive: YetiGrid, input: 'rows', values: rows },
          'data-fold': { directive: YetiGrid, input: 'fold' },
          'data-tracks': {
            directive: YetiGrid,
            input: 'tracks',
            values: tracks,
          },
          'data-threshold': {
            directive: YetiGrid,
            input: 'threshold',
            values: widths,
          },
        },
        markers: {
          'data-start': {
            directive: YetiGridChild,
            input: 'start',
            values: lines,
          },
          'data-span': {
            directive: YetiGridChild,
            input: 'span',
            values: lines,
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
