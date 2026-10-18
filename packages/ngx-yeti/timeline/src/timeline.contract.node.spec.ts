import { checkContract, gaps } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiTimeline } from './timeline';

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiTimeline['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiTimeline['alternate']>>().toEqualTypeOf<boolean>();

describe('timeline contract', () => {
  it('maps the manifest component to YetiTimeline', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.timeline, {
        class: YetiTimeline,
        attributes: {
          'data-gap': { directive: YetiTimeline, input: 'gap', values: gaps },
          'data-alternate': { directive: YetiTimeline, input: 'alternate' },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
