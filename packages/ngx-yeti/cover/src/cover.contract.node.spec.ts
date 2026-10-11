import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCover } from './cover';
import { YetiCoverChild } from './cover-child';

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
