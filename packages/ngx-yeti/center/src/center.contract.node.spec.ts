import { checkContract, gaps, widths } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCenter } from './center';

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiCenter['max']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCenter['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCenter['intrinsic']>>().toEqualTypeOf<boolean>();

describe('center contract', () => {
  it('maps the manifest component to YetiCenter', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.center, {
        class: YetiCenter,
        attributes: {
          'data-max': { directive: YetiCenter, input: 'max', values: widths },
          'data-gap': { directive: YetiCenter, input: 'gap', values: gaps },
          'data-intrinsic': { directive: YetiCenter, input: 'intrinsic' },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
