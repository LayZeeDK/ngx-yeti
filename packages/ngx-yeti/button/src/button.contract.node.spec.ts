import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiButton } from './button';

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
] as const;
const emphases = ['high', 'medium', 'low'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiButton['variant']>>().toEqualTypeOf<
  (typeof variants)[number] | undefined
>();
expectTypeOf<ReturnType<YetiButton['emphasis']>>().toEqualTypeOf<
  (typeof emphases)[number] | undefined
>();
expectTypeOf<ReturnType<YetiButton['size']>>().toEqualTypeOf<
  (typeof sizes)[number] | undefined
>();

describe('button contract', () => {
  it('maps the manifest component to YetiButton with no marker or event', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.button, {
        class: YetiButton,
        attributes: {
          'data-variant': {
            directive: YetiButton,
            input: 'variant',
            values: variants,
          },
          'data-emphasis': {
            directive: YetiButton,
            input: 'emphasis',
            values: emphases,
          },
          'data-size': {
            directive: YetiButton,
            input: 'size',
            values: sizes,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
