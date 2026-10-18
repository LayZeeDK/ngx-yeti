import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiSpinner } from './spinner';

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
const sizes = ['sm', 'md', 'lg'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiSpinner['variant']>>().toEqualTypeOf<
  (typeof variants)[number] | undefined
>();
expectTypeOf<ReturnType<YetiSpinner['size']>>().toEqualTypeOf<
  (typeof sizes)[number] | undefined
>();

describe('spinner contract', () => {
  it('maps the manifest component to YetiSpinner with no marker or event', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.spinner, {
        class: YetiSpinner,
        attributes: {
          'data-variant': {
            directive: YetiSpinner,
            input: 'variant',
            values: variants,
          },
          'data-size': {
            directive: YetiSpinner,
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
