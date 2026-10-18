import { checkContract, gaps } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiIcon } from './icon';

const alignments = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiIcon['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiIcon['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();

// Usage rule 3: the directive declares no input for a name or an ARIA
// attribute (`aria-label`, `aria-hidden`, `role`). Its two inputs are its
// only public members.
expectTypeOf<keyof YetiIcon>().toEqualTypeOf<'gap' | 'align'>();

describe('icon contract', () => {
  it('maps the manifest component to YetiIcon', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.icon, {
        class: YetiIcon,
        attributes: {
          'data-gap': { directive: YetiIcon, input: 'gap', values: gaps },
          'data-align': {
            directive: YetiIcon,
            input: 'align',
            values: alignments,
          },
        },
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
