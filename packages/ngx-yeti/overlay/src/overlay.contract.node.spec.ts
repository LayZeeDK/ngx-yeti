import { checkContract, gaps } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiOverlay } from './overlay';
import { YetiOverlayChild } from './overlay-child';

// Compile-time half: the list holds exactly the values `gap` accepts, so the
// runtime half below compares the input, not a copy of its type.
expectTypeOf<ReturnType<YetiOverlay['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiOverlay['fixed']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiOverlayChild['over']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiOverlayChild['fill']>>().toEqualTypeOf<boolean>();

describe('overlay contract', () => {
  it('maps the manifest component to YetiOverlay and YetiOverlayChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.overlay, {
        class: YetiOverlay,
        attributes: {
          'data-gap': { directive: YetiOverlay, input: 'gap', values: gaps },
          'data-fixed': { directive: YetiOverlay, input: 'fixed' },
        },
        markers: {
          'data-over': { directive: YetiOverlayChild, input: 'over' },
          'data-fill': { directive: YetiOverlayChild, input: 'fill' },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
