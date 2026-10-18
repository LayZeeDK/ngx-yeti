import { checkContract, gaps, widths } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';

const sides = ['start', 'end'] as const;
const alignments = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiSidebar['side']>>().toEqualTypeOf<
  (typeof sides)[number] | undefined
>();
expectTypeOf<ReturnType<YetiSidebar['width']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiSidebar['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiSidebar['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiSidebarChild['sticky']>>().toEqualTypeOf<boolean>();

describe('sidebar contract', () => {
  it('maps the manifest component to YetiSidebar and YetiSidebarChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.sidebar, {
        class: YetiSidebar,
        attributes: {
          'data-side': { directive: YetiSidebar, input: 'side', values: sides },
          'data-width': {
            directive: YetiSidebar,
            input: 'width',
            values: widths,
          },
          'data-gap': { directive: YetiSidebar, input: 'gap', values: gaps },
          'data-align': {
            directive: YetiSidebar,
            input: 'align',
            values: alignments,
          },
        },
        markers: {
          'data-sticky': { directive: YetiSidebarChild, input: 'sticky' },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
