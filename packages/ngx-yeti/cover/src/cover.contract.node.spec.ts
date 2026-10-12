import { checkContract, gaps } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCover } from './cover';
import { YetiCoverChild } from './cover-child';

const heights = ['sm', 'md', 'lg', 'xl', 'half', 'full'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiCover['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCover['height']>>().toEqualTypeOf<
  (typeof heights)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCoverChild['center']>>().toEqualTypeOf<boolean>();

describe('cover contract', () => {
  it('maps the manifest component to YetiCover and YetiCoverChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.cover, {
        class: YetiCover,
        attributes: {
          'data-gap': { directive: YetiCover, input: 'gap', values: gaps },
          'data-height': {
            directive: YetiCover,
            input: 'height',
            values: heights,
          },
        },
        markers: {
          'data-center': { directive: YetiCoverChild, input: 'center' },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
