import { Component } from '@angular/core';
import {
  attributeValue,
  checkContract,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiLift } from 'ngx-yeti';
import manifest from 'yeti-css/manifest';
import { NgxYetiLift } from './lift';

// Compile-time half: the list is a subset of the union and misses none of it.
const gestures = ['rise', 'scale'] as const satisfies readonly YetiLift[];

expectTypeOf<(typeof gestures)[number]>().toEqualTypeOf<YetiLift>();

@Component({
  selector: 'yeti-lift-contract-fixture',
  imports: [NgxYetiLift],
  template:
    '@for (gesture of gestures; track gesture) {<div i18n [yetiLift]="gesture">Lift</div>} <div yetiLift></div> <div [yetiLift]="empty"></div>',
})
class LiftContractFixture {
  protected readonly gestures = gestures;
  protected readonly empty = '';
}

describe('lift contract', () => {
  it('maps the manifest component to NgxYetiLift', () => {
    expect(
      checkContract(manifest.components.lift, {
        class: 'lift',
        attributes: {
          'data-lift': {
            directive: NgxYetiLift,
            input: 'yetiLift',
            values: gestures,
          },
        },
        markers: {},
        events: {},
      }),
    ).toStrictEqual([]);
  });

  it('writes each mapped gesture, and nothing for unset or empty input', async () => {
    expect.assertions(3);

    const hosts = openingTags(await renderServer(LiftContractFixture), 'div');

    expect(hosts.map((tag) => attributeValue(tag, 'class'))).toStrictEqual(
      Array<string>(hosts.length).fill('lift'),
    );
    expect(hosts.map((tag) => attributeValue(tag, 'data-lift'))).toStrictEqual([
      ...gestures,
      null,
      null,
    ]);
    expect(
      hosts.every(
        (tag) => attributeValue(tag, 'data-ngx-yeti-item-lift') === '',
      ),
    ).toBe(true);
  });
});
