import { checkContract, gaps, widths } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiCluster } from './cluster';

const alignments = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
const justifications = [
  'start',
  'center',
  'end',
  'between',
  'around',
  'evenly',
] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiCluster['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCluster['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCluster['justify']>>().toEqualTypeOf<
  (typeof justifications)[number] | undefined
>();
expectTypeOf<ReturnType<YetiCluster['threshold']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();

describe('cluster contract', () => {
  it('maps the manifest component to YetiCluster', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.cluster, {
        class: YetiCluster,
        attributes: {
          'data-gap': { directive: YetiCluster, input: 'gap', values: gaps },
          'data-align': {
            directive: YetiCluster,
            input: 'align',
            values: alignments,
          },
          'data-justify': {
            directive: YetiCluster,
            input: 'justify',
            values: justifications,
          },
          'data-threshold': {
            directive: YetiCluster,
            input: 'threshold',
            values: widths,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
