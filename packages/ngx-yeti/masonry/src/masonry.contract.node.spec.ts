import { checkContract, gaps, widthsOrNone } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiMasonry } from './masonry';

const columns = ['1', '2', '3', '4', '5', '6'] as const;

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
