import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiStack } from './stack';
import { YetiStackChild } from './stack-child';

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
expectTypeOf<ReturnType<YetiStack['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiStack['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiStack['fill']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiStack['rule']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiStackChild['split']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiStackChild['space']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiStackChild['sticky']>>().toEqualTypeOf<boolean>();

describe('stack contract', () => {
  it('maps the manifest component to YetiStack and YetiStackChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.stack, {
        class: YetiStack,
        attributes: {
          'data-gap': { directive: YetiStack, input: 'gap', values: gaps },
          'data-align': {
            directive: YetiStack,
            input: 'align',
            values: alignments,
          },
          'data-fill': { directive: YetiStack, input: 'fill' },
          'data-rule': { directive: YetiStack, input: 'rule' },
        },
        markers: {
          'data-split': { directive: YetiStackChild, input: 'split' },
          'data-space': {
            directive: YetiStackChild,
            input: 'space',
            values: gaps,
          },
          'data-sticky': { directive: YetiStackChild, input: 'sticky' },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
