import { Directive, input, output } from '@angular/core';
import {
  attributeValue,
  checkContract,
  type ContractComponent,
  type ContractMember,
  type ContractMapping,
  directiveInputs,
  directiveOutputs,
  openingTags,
} from './contract';

@Directive({ selector: '[yetiSample]' })
class Sample {
  readonly size = input<'a' | 'b'>();
  readonly flag = input(false);
  readonly changed = output<string>();
}

const component: ContractComponent = {
  class: 'sample',
  attributes: [
    { name: 'data-size', type: 'enum', values: ['a', 'b'] },
    { name: 'data-flag', type: 'boolean' },
  ],
  markers: [],
  js: [{ events: [{ name: 'yeti:changed' }] }],
};

const size: ContractMember = {
  directive: Sample,
  input: 'size',
  values: ['a', 'b'],
};
const flag: ContractMember = { directive: Sample, input: 'flag' };

const mapping: ContractMapping = {
  class: 'sample',
  attributes: { 'data-size': size, 'data-flag': flag },
  markers: {},
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

  it('fails an unmapped attribute, a wrong class, and a missing output', () => {
    expect(
      checkContract(component, {
        class: 'other',
        attributes: { 'data-size': size },
        markers: {},
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
        { ...mapping, markers: { 'data-extra': flag } },
      ),
    ).toStrictEqual([
      'marker data-extra is mapped but absent from the manifest',
      'event yeti:changed is mapped but absent from the manifest',
    ]);
  });
});

describe(directiveInputs, () => {
  it('lists the public inputs and outputs of a directive', () => {
    expect(directiveInputs(Sample)).toStrictEqual(['size', 'flag']);
    expect(directiveOutputs(Sample)).toStrictEqual(['changed']);
  });
});

describe(attributeValue, () => {
  it('reads valued, empty, and absent attributes of an opening tag', () => {
    const [tag] = openingTags('<p><a data-x="1/1" data-y class="c">', 'a');

    assert.exists(tag);

    expect(attributeValue(tag, 'data-x')).toBe('1/1');
    expect(attributeValue(tag, 'data-y')).toBe('');
    expect(attributeValue(tag, 'data-z')).toBeNull();
  });
});
