import { Directive, input, output } from '@angular/core';
import {
  checkContract,
  type ContractComponent,
  type ContractMember,
  type ContractMapping,
} from './contract';

@Directive({
  selector: '[yetiSample]',
  host: {
    class: 'sample',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-flag]': "flag() ? '' : null",
    '[attr.data-label]': 'label() ?? null',
    '[class.is-wide]': 'wide()',
  },
})
class Sample {
  readonly size = input<'a' | 'b'>();
  readonly flag = input(false);
  readonly label = input<string>();
  readonly wide = input(false);
  readonly changed = output<string>();
}

@Directive({
  selector: 'a[yetiSampleLink]',
  host: { '[attr.data-stretch]': "stretch() ? '' : null" },
})
class SampleLink {
  readonly stretch = input(false);
}

/** Sample's defects: a renamed class, a misnamed attribute, a wrong value. */
@Directive({
  selector: '[yetiMisbound]',
  host: {
    class: 'samples',
    '[attr.data-sise]': 'size() ?? null',
    '[attr.data-flag]': "flag() ? 'true' : null",
  },
})
class Misbound {
  readonly size = input<'a' | 'b'>();
  readonly flag = input(false);
}

/** SampleLink's defect: it matches any element, not only `a`. */
@Directive({
  selector: '[yetiAnyLink]',
  host: { '[attr.data-stretch]': "stretch() ? '' : null" },
})
class AnyLink {
  readonly stretch = input(false);
}

const component: ContractComponent = {
  class: 'sample',
  classes: [],
  attributes: [
    {
      name: 'data-size',
      type: 'enum',
      values: ['a', 'b'],
      description: 'Size',
    },
    { name: 'data-flag', type: 'boolean', description: 'Flag' },
    { name: 'data-label', type: 'string', description: 'Label' },
  ],
  markers: [
    { name: 'data-stretch', type: 'boolean', on: 'a', description: 'Link' },
  ],
  js: [
    {
      module: 'sample.js',
      optional: true,
      events: [{ name: 'yeti:changed', description: 'Changed' }],
    },
  ],
};

const size: ContractMember = {
  directive: Sample,
  input: 'size',
  values: ['a', 'b'],
};
const flag: ContractMember = { directive: Sample, input: 'flag' };
const label: ContractMember = { directive: Sample, input: 'label' };
const stretch: ContractMember = {
  directive: SampleLink,
  input: 'stretch',
  selectorAttribute: 'yetiSampleLink',
};

const mapping: ContractMapping = {
  class: Sample,
  attributes: { 'data-size': size, 'data-flag': flag, 'data-label': label },
  markers: { 'data-stretch': stretch },
  events: { 'yeti:changed': { directive: Sample, output: 'changed' } },
};

describe(checkContract, () => {
  it('passes a mapping that matches the manifest component', async () => {
    expect.assertions(1);

    await expect(checkContract(component, mapping)).resolves.toStrictEqual([]);
  });

  it('fails an attribute whose input is missing', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          ...mapping.attributes,
          'data-flag': { directive: Sample, input: 'absent' },
        },
      }),
    ).resolves.toStrictEqual([
      'attribute data-flag: Sample has no input absent',
    ]);
  });

  it('fails a renamed class, a misnamed attribute, and a wrong value', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        class: Misbound,
        attributes: {
          ...mapping.attributes,
          'data-size': { ...size, directive: Misbound },
          'data-flag': { directive: Misbound, input: 'flag' },
        },
      }),
    ).resolves.toStrictEqual([
      'class sample: Misbound does not write it',
      'attribute data-size: Misbound with size = "a" renders no data-size',
      'attribute data-size: Misbound with size = "b" renders no data-size',
      'attribute data-flag: Misbound with flag = true renders data-flag="true"',
    ]);
  });

  it('fails a union that holds a value the manifest lacks', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          ...mapping.attributes,
          'data-size': { ...size, values: ['a', 'b', 'c'] },
        },
      }),
    ).resolves.toStrictEqual([
      'attribute data-size: the union holds c, which the manifest lacks',
    ]);
  });

  it('fails a union that lacks a vocabulary value', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          ...mapping.attributes,
          'data-size': { ...size, values: ['a'] },
        },
      }),
    ).resolves.toStrictEqual([
      'attribute data-size: the union lacks the value b',
    ]);
  });

  it('fails an enum the manifest lists no values for', async () => {
    expect.assertions(1);

    await expect(
      checkContract(
        {
          ...component,
          attributes: [
            { name: 'data-size', type: 'enum', description: 'Size' },
            { name: 'data-flag', type: 'enum', values: [], description: '' },
          ],
        },
        {
          ...mapping,
          attributes: {
            'data-size': size,
            'data-flag': { ...flag, values: [] },
          },
        },
      ),
    ).resolves.toStrictEqual([
      'attribute data-size: an enum the manifest lists no values for',
    ]);
  });

  it("fails an enum mapped without the union's values", async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          ...mapping.attributes,
          'data-size': { directive: Sample, input: 'size' },
        },
      }),
    ).resolves.toStrictEqual([
      "attribute data-size: an enum mapped without the union's values",
    ]);
  });

  it('fails an unmapped attribute, a wrong class directive, and a missing output', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        class: SampleLink,
        attributes: { 'data-size': size, 'data-label': label },
        events: { 'yeti:changed': { directive: Sample, output: 'absent' } },
      }),
    ).resolves.toStrictEqual([
      'class sample: SampleLink does not write it',
      'attribute data-flag is not mapped',
      'event yeti:changed: Sample has no output absent',
    ]);
  });

  it('fails a mapped marker and a mapped event absent from the manifest', async () => {
    expect.assertions(1);

    await expect(
      checkContract(
        { ...component, js: null },
        { ...mapping, markers: { ...mapping.markers, 'data-extra': flag } },
      ),
    ).resolves.toStrictEqual([
      'marker data-extra is mapped but absent from the manifest',
      'event yeti:changed is mapped but absent from the manifest',
    ]);
  });

  it('passes a modifier class its input writes and fails one it does not', async () => {
    expect.assertions(2);

    const wide: ContractComponent = {
      ...component,
      classes: [{ name: 'is-wide', type: 'boolean', description: '' }],
    };

    await expect(
      checkContract(wide, {
        ...mapping,
        classes: { 'is-wide': { directive: Sample, input: 'wide' } },
      }),
    ).resolves.toStrictEqual([]);
    await expect(
      checkContract(wide, { ...mapping, classes: { 'is-wide': flag } }),
    ).resolves.toStrictEqual([
      'class is-wide: Sample with flag = true renders no class is-wide',
    ]);
  });

  it('fails an unmapped modifier class and a mapped one the manifest lacks', async () => {
    expect.assertions(1);

    await expect(
      checkContract(
        {
          ...component,
          classes: [{ name: 'is-wide', type: 'boolean', description: '' }],
        },
        { ...mapping, classes: { 'is-tall': flag } },
      ),
    ).resolves.toStrictEqual([
      'class is-wide is not mapped',
      'class is-tall is mapped but absent from the manifest',
    ]);
  });

  it('fails a marker whose directive matches elements its on excludes', async () => {
    expect.assertions(1);

    await expect(
      checkContract(component, {
        ...mapping,
        markers: {
          'data-stretch': {
            directive: AnyLink,
            input: 'stretch',
            selectorAttribute: 'yetiAnyLink',
          },
        },
      }),
    ).resolves.toStrictEqual([
      'marker data-stretch: AnyLink matches elements other than a',
    ]);
  });

  it('fails a marker whose selector attribute does not select it', async () => {
    expect.assertions(2);

    await expect(
      checkContract(component, {
        ...mapping,
        markers: {
          'data-stretch': { ...stretch, selectorAttribute: 'yetiAnyLink' },
        },
      }),
    ).resolves.toStrictEqual([
      'marker data-stretch: SampleLink does not match <a yetiAnyLink>',
    ]);
    await expect(
      checkContract(component, {
        ...mapping,
        markers: {
          'data-stretch': { directive: SampleLink, input: 'stretch' },
        },
      }),
    ).resolves.toStrictEqual([
      "marker data-stretch: on a needs the mapping's selectorAttribute",
    ]);
  });
});
