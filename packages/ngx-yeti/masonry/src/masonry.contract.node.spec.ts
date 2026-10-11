import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiMasonry } from './masonry';

const widthsOrNone = [
  'none',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;
const columns = ['1', '2', '3', '4', '5', '6'] as const;
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

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiMasonry['min']>>().toEqualTypeOf<
  (typeof widthsOrNone)[number] | undefined
>();
expectTypeOf<ReturnType<YetiMasonry['columns']>>().toEqualTypeOf<
  (typeof columns)[number] | undefined
>();
expectTypeOf<ReturnType<YetiMasonry['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();

describe('masonry contract', () => {
  it('maps the manifest component to YetiMasonry', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.masonry, {
        class: YetiMasonry,
        attributes: {
          'data-min': {
            directive: YetiMasonry,
            input: 'min',
            values: widthsOrNone,
          },
          'data-columns': {
            directive: YetiMasonry,
            input: 'columns',
            values: columns,
          },
          'data-gap': { directive: YetiMasonry, input: 'gap', values: gaps },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
