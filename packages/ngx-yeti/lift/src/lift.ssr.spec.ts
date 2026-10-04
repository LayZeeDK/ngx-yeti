import { Component } from '@angular/core';
import { renderServer } from '@ngx-yeti/testing/server';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from './lift';

@Component({
  selector: 'yeti-lift-fixture',
  imports: [YetiCard, YetiCardLink, NgxYetiLift],
  template:
    '<article yetiCard raised yetiLift><h3><a yetiCardLink stretch href="#rise">A card that rises</a></h3><p i18n>The card rises and its shadow deepens.</p></article><article yetiCard raised yetiLift="scale"><h3><a yetiCardLink stretch href="#scale">A tile that grows</a></h3></article>',
})
class LiftFixture {}

/** The opening tags of every element named `tag`, in document order. */
function openingTags(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(
    ([match]) => match,
  );
}

function head(html: string): string {
  return /<head>[\s\S]*<\/head>/.exec(html)?.[0] ?? '';
}

describe(NgxYetiLift, () => {
  it('renders the lift on both hosts and the gesture on the scale card', async () => {
    expect.assertions(6);

    const html = await renderServer(LiftFixture);
    const [rise, scale, ...rest] = openingTags(html, 'article');
    assert.exists(rise);
    assert.exists(scale);

    expect(rest).toStrictEqual([]);
    expect(rise).toContain('class="card lift"');
    expect(scale).toContain('class="card lift"');
    expect(rise).not.toContain('data-lift');
    expect(scale).toContain('data-lift="scale"');
    expect(html).toContain('The card rises and its shadow deepens.');
  });

  it('marks each host with the card and lift presence attributes', async () => {
    expect.assertions(4);

    const html = await renderServer(LiftFixture);

    for (const host of openingTags(html, 'article')) {
      expect(host).toContain('data-ngx-yeti-item-card=""');
      expect(host).toContain('data-ngx-yeti-item-lift=""');
    }
  });

  it('writes the card and lift item links into the head in yeti.css order', async () => {
    expect.assertions(3);

    const links = openingTags(head(await renderServer(LiftFixture)), 'link');
    const [card, lift, ...rest] = links;

    expect(rest).toStrictEqual([]);
    expect(card).toMatch(
      /^<link rel="stylesheet" href="yeti-css\/components\/card\/card\.css\?v=[0-9a-f]{40}" data-ngx-yeti-styles="card" data-ngx-yeti-app="ng" data-beasties-skip="">$/,
    );
    expect(lift).toMatch(
      /^<link rel="stylesheet" href="yeti-css\/utilities\/lift\/lift\.css\?v=[0-9a-f]{40}" data-ngx-yeti-styles="lift" data-ngx-yeti-app="ng" data-beasties-skip="">$/,
    );
  });

  it('puts no jsaction on the hosts', async () => {
    expect.assertions(2);

    const html = await renderServer(LiftFixture);

    for (const host of openingTags(html, 'article')) {
      expect(host).not.toContain('jsaction');
    }
  });
});
