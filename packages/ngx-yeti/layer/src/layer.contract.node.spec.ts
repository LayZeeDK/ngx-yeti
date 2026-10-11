import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiLayer } from './layer';
import { YetiLayerChild } from './layer-child';

const alignments = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
const selves = ['start', 'center', 'end', 'stretch'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiLayer['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiLayerChild['alignSelf']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiLayerChild['justifySelf']>>().toEqualTypeOf<
  (typeof selves)[number] | undefined
>();

describe('layer contract', () => {
  it('maps the manifest component to YetiLayer and YetiLayerChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.layer, {
        class: YetiLayer,
        attributes: {
          'data-align': {
            directive: YetiLayer,
            input: 'align',
            values: alignments,
          },
        },
        markers: {
          'data-align-self': {
            directive: YetiLayerChild,
            input: 'alignSelf',
            values: alignments,
          },
          'data-justify-self': {
            directive: YetiLayerChild,
            input: 'justifySelf',
            values: selves,
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
