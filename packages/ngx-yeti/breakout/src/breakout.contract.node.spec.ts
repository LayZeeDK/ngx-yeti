import { Component } from '@angular/core';
import {
  attributeValue,
  checkContract,
  gaps,
  openingTags,
  renderServer,
  widths,
} from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiBreakout } from './breakout';
import { YetiBreakoutChild } from './breakout-child';
import { YetiBreakoutNote } from './breakout-note';

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiBreakout['max']>>().toEqualTypeOf<
  (typeof widths)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBreakout['gap']>>().toEqualTypeOf<
  (typeof gaps)[number] | undefined
>();
expectTypeOf<ReturnType<YetiBreakoutChild['bleed']>>().toEqualTypeOf<boolean>();

const component = manifest.components.breakout;

@Component({
  selector: 'yeti-breakout-note-contract',
  imports: [YetiBreakoutNote],
  template: '<aside yetiBreakoutNote>A note</aside>',
})
class NoteFixture {}

describe('breakout contract', () => {
  // `data-note` is a part with no input, which `checkContract` cannot set;
  // the next test covers it.
  it('maps the manifest component to YetiBreakout and YetiBreakoutChild', async () => {
    expect.assertions(1);

    await expect(
      checkContract(
        {
          ...component,
          markers: component.markers.filter(({ name }) => name !== 'data-note'),
        },
        {
          class: YetiBreakout,
          attributes: {
            'data-max': {
              directive: YetiBreakout,
              input: 'max',
              values: widths,
            },
            'data-gap': { directive: YetiBreakout, input: 'gap', values: gaps },
          },
          markers: {
            'data-bleed': { directive: YetiBreakoutChild, input: 'bleed' },
          },
          events: {},
        },
      ),
    ).resolves.toStrictEqual([]);
  });

  it('maps the boolean data-note marker to YetiBreakoutNote, which always writes it', async () => {
    expect.assertions(3);

    const note = component.markers.find(({ name }) => name === 'data-note');
    const [aside] = openingTags(await renderServer(NoteFixture), 'aside');
    assert.exists(aside);

    expect(note?.type).toBe('boolean');
    expect(component.markers.map(({ name }) => name).toSorted()).toStrictEqual([
      'data-bleed',
      'data-note',
    ]);
    expect(attributeValue(aside, 'data-note')).toBe('');
  });
});
