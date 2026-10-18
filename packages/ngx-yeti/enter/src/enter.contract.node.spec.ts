import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { NgxYetiEnter } from './enter';

const arrivals = ['fade', 'rise', 'fall', 'slide', 'scale'] as const;
const sides = ['start', 'end'] as const;

// Compile-time half: each list holds exactly the values its input accepts
// besides `''`, the bare attribute.
expectTypeOf<ReturnType<NgxYetiEnter['yetiEnter']>>().toEqualTypeOf<
  (typeof arrivals)[number] | ''
>();
expectTypeOf<ReturnType<NgxYetiEnter['side']>>().toEqualTypeOf<
  (typeof sides)[number] | undefined
>();
expectTypeOf<ReturnType<NgxYetiEnter['stagger']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<NgxYetiEnter['view']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<NgxYetiEnter['once']>>().toEqualTypeOf<boolean>();

describe('enter contract', () => {
  it('maps the manifest component to NgxYetiEnter', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.enter, {
        class: NgxYetiEnter,
        attributes: {
          'data-enter': {
            directive: NgxYetiEnter,
            input: 'yetiEnter',
            values: arrivals,
          },
          'data-side': {
            directive: NgxYetiEnter,
            input: 'side',
            values: sides,
          },
          'data-stagger': { directive: NgxYetiEnter, input: 'stagger' },
          'data-view': { directive: NgxYetiEnter, input: 'view' },
          'data-once': { directive: NgxYetiEnter, input: 'once' },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
