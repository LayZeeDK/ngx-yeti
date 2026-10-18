import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiFrame } from './frame';

const ratios = ['1/1', '4/3', '3/2', '16/9', '21/9'] as const;

// Compile-time half: the list holds exactly the values the input accepts, so
// the runtime half below compares the input, not a copy of its type.
expectTypeOf<ReturnType<YetiFrame['ratio']>>().toEqualTypeOf<
  (typeof ratios)[number] | undefined
>();

describe('frame contract', () => {
  it('maps the manifest component to YetiFrame', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.frame, {
        class: YetiFrame,
        attributes: {
          'data-ratio': {
            directive: YetiFrame,
            input: 'ratio',
            values: ratios,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
