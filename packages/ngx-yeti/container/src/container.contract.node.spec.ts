import { checkContract, widths } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiContainer } from './container';
import { YetiHide } from './container-hide';
import { YetiShow } from './container-show';

// Compile-time half: the list holds exactly the values each marker accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiShow['yetiShow']>>().toEqualTypeOf<
  (typeof widths)[number]
>();
expectTypeOf<ReturnType<YetiHide['yetiHide']>>().toEqualTypeOf<
  (typeof widths)[number]
>();

describe('container contract', () => {
  it('maps the manifest component to YetiContainer and its two markers', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.container, {
        class: YetiContainer,
        attributes: {},
        markers: {
          'data-show': {
            directive: YetiShow,
            input: 'yetiShow',
            values: widths,
          },
          'data-hide': {
            directive: YetiHide,
            input: 'yetiHide',
            values: widths,
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
