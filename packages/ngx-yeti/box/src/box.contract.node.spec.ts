import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiBox } from './box';
import { YetiBorder } from './box-border';
import { NgxYetiPaint } from './box-paint';
import { YetiText } from './box-text';

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
const surfaces = ['base', 'raised', 'sunken'] as const;
const paints = [
  'primary',
  'secondary',
  'success',
  'warning',
  'alert',
  'neutral',
  'white',
  'black',
  'grey',
  'grey-0',
  'grey-10',
  'grey-20',
  'grey-30',
  'grey-40',
  'grey-50',
  'grey-60',
  'grey-70',
  'grey-80',
  'grey-90',
  'grey-100',
] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiBox['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBox['gapInline']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBox['gapBlock']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBox['surface']>>().toEqualTypeOf<
  (typeof surfaces)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBorder['yetiBorder']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<NgxYetiPaint['yetiPaint']>>().toEqualTypeOf<
  (typeof paints)[number]
>();
expectTypeOf<ReturnType<YetiText['yetiText']>>().toEqualTypeOf<
  (typeof paints)[number]
>();

describe('box contract', () => {
  it('maps the manifest component to YetiBox and its three markers', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.box, {
        class: YetiBox,
        attributes: {
          'data-gap': { directive: YetiBox, input: 'gap', values: gaps },
          'data-gap-inline': {
            directive: YetiBox,
            input: 'gapInline',
            values: gaps,
          },
          'data-gap-block': {
            directive: YetiBox,
            input: 'gapBlock',
            values: gaps,
          },
          'data-surface': {
            directive: YetiBox,
            input: 'surface',
            values: surfaces,
          },
        },
        markers: {
          'data-border': { directive: YetiBorder, input: 'yetiBorder' },
          'data-paint': {
            directive: NgxYetiPaint,
            input: 'yetiPaint',
            values: paints,
          },
          'data-text': {
            directive: YetiText,
            input: 'yetiText',
            values: paints,
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
