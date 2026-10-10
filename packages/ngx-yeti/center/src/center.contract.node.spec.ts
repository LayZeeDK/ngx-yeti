import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCenter } from './center';

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
