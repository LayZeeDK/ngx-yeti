import { Directive, input, output } from '@angular/core';
import {
  checkContract,
  type ContractComponent,
  type ContractMember,
  type ContractMapping,
  directiveInputs,
  directiveOutputs,
} from './contract';

@Directive({ selector: '[yetiSample]' })
class Sample {
  readonly size = input<'a' | 'b'>();
  readonly flag = input(false);
  readonly changed = output<string>();
}

@Directive({ selector: 'a[yetiSampleLink]' })
class SampleLink {
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
const stretch: ContractMember = { directive: SampleLink, input: 'stretch' };

const mapping: ContractMapping = {
  class: 'sample',
  attributes: { 'data-size': size, 'data-flag': flag },
  markers: { 'data-stretch': stretch },
  events: { 'yeti:changed': { directive: Sample, output: 'changed' } },
};

describe(checkContract, () => {
  it('passes a mapping that matches the manifest component', () => {
    expect(checkContract(component, mapping)).toStrictEqual([]);
  });

  it('fails an attribute whose input is missing', () => {
    expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          'data-size': size,
          'data-flag': { directive: Sample, input: 'absent' },
        },
      }),
    ).toStrictEqual(['attribute data-flag: Sample has no input absent']);
  });

  it('fails a union that holds a value the manifest lacks', () => {
    expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          'data-size': { ...size, values: ['a', 'b', 'c'] },
          'data-flag': flag,
        },
      }),
    ).toStrictEqual([
      'attribute data-size: the union holds c, which the manifest lacks',
    ]);
  });

  it('fails a union that lacks a vocabulary value', () => {
    expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          'data-size': { ...size, values: ['a'] },
          'data-flag': flag,
        },
      }),
    ).toStrictEqual(['attribute data-size: the union lacks the value b']);
  });

  it('fails an enum mapped without values and an enum with none listed', () => {
    expect(
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
    ).toStrictEqual([
      'attribute data-size: an enum the manifest lists no values for',
    ]);
    expect(
      checkContract(component, {
        ...mapping,
        attributes: {
          'data-size': { directive: Sample, input: 'size' },
          'data-flag': flag,
        },
      }),
    ).toStrictEqual([
      "attribute data-size: an enum mapped without the union's values",
    ]);
  });

  it('fails an unmapped attribute, a wrong class, and a missing output', () => {
    expect(
      checkContract(component, {
        ...mapping,
        class: 'other',
        attributes: { 'data-size': size },
        events: { 'yeti:changed': { directive: Sample, output: 'absent' } },
      }),
    ).toStrictEqual([
      'class sample is mapped as other',
      'attribute data-flag is not mapped',
      'event yeti:changed: Sample has no output absent',
    ]);
  });

  it('fails a mapped marker and a mapped event absent from the manifest', () => {
    expect(
      checkContract(
        { ...component, js: null },
        { ...mapping, markers: { ...mapping.markers, 'data-extra': flag } },
      ),
    ).toStrictEqual([
      'marker data-extra is mapped but absent from the manifest',
      'event yeti:changed is mapped but absent from the manifest',
    ]);
  });

  it('fails an unmapped modifier class and a mapped one the manifest lacks', () => {
    expect(
      checkContract(
        {
          ...component,
          classes: [{ name: 'is-wide', type: 'boolean', description: '' }],
        },
        { ...mapping, classes: { 'is-tall': flag } },
      ),
    ).toStrictEqual([
      'class is-wide is not mapped',
      'class is-tall is mapped but absent from the manifest',
    ]);
  });

  it('fails a marker whose directive matches elements its on excludes', () => {
    expect(
      checkContract(component, {
        ...mapping,
        markers: { 'data-stretch': { directive: Sample, input: 'flag' } },
      }),
    ).toStrictEqual([
      'marker data-stretch: Sample matches elements other than a',
    ]);
  });
});

describe(directiveInputs, () => {
  it('lists the public inputs and outputs of a directive', () => {
    expect(directiveInputs(Sample)).toStrictEqual(['size', 'flag']);
    expect(directiveOutputs(Sample)).toStrictEqual(['changed']);
  });
});
