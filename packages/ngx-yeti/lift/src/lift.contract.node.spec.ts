import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { NgxYetiLift } from './lift';

const gestures = ['rise', 'scale'] as const;

// Compile-time half: the list holds exactly the gestures the input accepts
// besides `''`, the bare attribute.
expectTypeOf<ReturnType<NgxYetiLift['yetiLift']>>().toEqualTypeOf<
  (typeof gestures)[number] | '' | undefined
>();

describe('lift contract', () => {
  it('maps the manifest component to NgxYetiLift', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.lift, {
        class: NgxYetiLift,
        attributes: {
          'data-lift': {
            directive: NgxYetiLift,
            input: 'yetiLift',
            values: gestures,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
