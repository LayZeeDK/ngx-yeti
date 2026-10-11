import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiSidebar } from './sidebar';
import { YetiSidebarChild } from './sidebar-child';

const sides = ['start', 'end'] as const;
const widths = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const gaps = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'xs-sm',
  'xs-md',
  'xs-lg',
  'xs-xl',
  'xs-2xl',
  'xs-3xl',
  'sm-md',
  'sm-lg',
  'sm-xl',
  'sm-2xl',
  'sm-3xl',
  'md-lg',
  'md-xl',
  'md-2xl',
  'md-3xl',
  'lg-xl',
  'lg-2xl',
  'lg-3xl',
  'xl-2xl',
  'xl-3xl',
  '2xl-3xl',
] as const;
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
