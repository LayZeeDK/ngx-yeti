import { NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, provideRouter } from '@angular/router';
import {
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiRatio } from 'ngx-yeti';
import { YetiCard } from './card';
import { YetiCardLink } from './card-link';

/**
 * Section 8's markup with a bound `ratio` and a static `raised` (card.md,
 * Testing Decisions, layer 3). Until `badge` and `button` land, a plain
 * `span` and a plain footer link stand in for `yetiBadge` and `yetiButton`,
 * so the order of their head links is asserted with them (M004).
 */
@Component({
  selector: 'yeti-card-fixture',
  imports: [NgOptimizedImage, RouterLink, YetiCard, YetiCardLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture is section 8's markup in one file, like the Fixture app's card fixture
  template: `<article yetiCard threshold="xs" raised [ratio]="ratio()">
    <img
      ngSrc="trail.jpg"
      width="1600"
      height="900"
      alt="A mountain trail at dawn"
    />
    <h3>
      <a yetiCardLink stretch routerLink="/hills">Weekend in the hills</a>
    </h3>
    <p i18n>Six miles, one summit, and a view worth the early start.</p>
    <footer>
      <span>Open</span>
      <a routerLink="/hills" tabindex="-1">Read more</a>
    </footer>
  </article>`,
})
class CardFixture {
  protected readonly ratio = signal<YetiRatio>('4/3');
}

function render(): Promise<string> {
  return renderServer(CardFixture, { providers: [provideRouter([])] });
}

describe(YetiCard, () => {
  it('renders the card host with its class, presence attribute, and inputs', async () => {
    expect.assertions(7);

    const [card, ...rest] = openingTags(await render(), 'article');
    assert.exists(card);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(card, 'class')).toBe('card');
    expect(attributeValue(card, 'data-ngx-yeti-item-card')).toBe('');
    expect(attributeValue(card, 'data-threshold')).toBe('xs');
    expect(attributeValue(card, 'data-ratio')).toBe('4/3');
    expect(attributeValue(card, 'data-raised')).toBe('');
    expect(attributeValue(card, 'data-variant')).toBeNull();
  });

  it('renders the stretched link with its marker and href', async () => {
    expect.assertions(3);

    const html = await render();
    const [link] = openingTags(html, 'a').filter(
      (tag) => attributeValue(tag, 'yeticardlink') !== null,
    );
    assert.exists(link);

    expect(attributeValue(link, 'data-stretch')).toBe('');
    expect(attributeValue(link, 'href')).toBe('/hills');
    expect(html).toContain(
      'Six miles, one summit, and a view worth the early start.',
    );
  });

  it('writes one card item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [card, ...rest] = links;
    assert.exists(card);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(card, 'data-ngx-yeti-styles')).toBe('card');
    expect(attributeValue(card, 'data-beasties-skip')).toBe('');
    expect(attributeValue(card, 'href')).toMatch(
      /components\/card\/card\.css\?v=[0-9a-f]{40}$/,
    );
  });

  it('puts no jsaction from the package on the card or its link', async () => {
    expect.assertions(3);

    const html = await render();
    const [card] = openingTags(html, 'article');
    const [stretched, plain] = openingTags(html, 'a');
    assert.exists(card);
    assert.exists(stretched);
    assert.exists(plain);

    // RouterLink's click listener is the only one in the fixture: the
    // stretched link carries what the plain routerLink link carries, no more.
    expect(attributeValue(card, 'jsaction')).toBeNull();
    expect(attributeValue(plain, 'jsaction')).not.toBeNull();
    expect(attributeValue(stretched, 'jsaction')).toBe(
      attributeValue(plain, 'jsaction'),
    );
  });
});
