import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCard } from './card';
import { YetiCardLink } from './card-link';

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
const widths = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const ratios = ['1/1', '4/3', '3/2', '16/9', '21/9'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiCard['variant']>>().toEqualTypeOf<
  (typeof variants)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCard['threshold']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCard['ratio']>>().toEqualTypeOf<
  (typeof ratios)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCard['raised']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiCardLink['stretch']>>().toEqualTypeOf<boolean>();

describe('card contract', () => {
  it('maps the manifest component to YetiCard and YetiCardLink', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.card, {
        class: YetiCard,
        attributes: {
          'data-variant': {
            directive: YetiCard,
            input: 'variant',
            values: variants,
          },
          'data-threshold': {
            directive: YetiCard,
            input: 'threshold',
            values: widths,
          },
          'data-ratio': {
            directive: YetiCard,
            input: 'ratio',
            values: ratios,
          },
          'data-raised': { directive: YetiCard, input: 'raised' },
        },
        markers: {
          'data-stretch': {
            directive: YetiCardLink,
            input: 'stretch',
            selectorAttribute: 'yetiCardLink',
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
