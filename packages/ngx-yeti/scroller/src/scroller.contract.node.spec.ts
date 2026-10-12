import { checkContract, gaps, widths } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiScroller } from './scroller';

const justifications = ['start', 'center', 'end'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiScroller['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiScroller['width']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiScroller['justify']>>().toEqualTypeOf<
  (typeof justifications)[number] | undefined
>();
expectTypeOf<ReturnType<YetiScroller['snap']>>().toEqualTypeOf<boolean>();

describe('scroller contract', () => {
  it('maps the manifest component to YetiScroller', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.scroller, {
        class: YetiScroller,
        attributes: {
          'data-gap': { directive: YetiScroller, input: 'gap', values: gaps },
          'data-width': {
            directive: YetiScroller,
            input: 'width',
            values: widths,
          },
          'data-snap': { directive: YetiScroller, input: 'snap' },
          'data-justify': {
            directive: YetiScroller,
            input: 'justify',
            values: justifications,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
