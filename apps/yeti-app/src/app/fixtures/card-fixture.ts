import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';

/**
 * The card spec's Fixture-app route (card.md:332-339): section 8's markup and
 * a grid of lifted cards, which one control removes; a `card` and `lift`
 * host in a `hydrate never` block (ADR 0045); a card in a client-only
 * `@defer` (the app preloads `card`); and a link to a route with no card.
 * Until `badge` and `button` land, a plain `span` and a plain footer link
 * stand in for `yetiBadge` and `yetiButton`, and until `grid` lands the grid
 * is a plain list. The `h2` puts the cards' `h3`s one level below a heading,
 * as axe's `heading-order` asks under the app's `h1`.
 */
@Component({
  selector: 'app-card-fixture',
  imports: [NgOptimizedImage, NgxYetiLift, RouterLink, YetiCard, YetiCardLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture shows the spec's section 8 markup in one file, like the other fixtures
  template: `<h2>Weekend trips</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live cards
    </button>
    <a routerLink="/replay">Leave for a page without cards</a>
    @if (live()) {
      <article yetiCard threshold="xs">
        <img
          ngSrc="trail.svg"
          width="1600"
          height="900"
          alt="A mountain trail at dawn"
        />
        <h3>
          <a yetiCardLink stretch routerLink="/replay">Weekend in the hills</a>
        </h3>
        <p i18n>Six miles, one summit, and a view worth the early start.</p>
        <footer>
          <span>Open</span>
          <a routerLink="/replay" tabindex="-1">Read more</a>
        </footer>
      </article>
      <ul role="list">
        <li id="crop-card" yetiCard yetiLift raised threshold="2xl" ratio="1/1">
          <img
            ngSrc="trail.svg"
            width="1600"
            height="900"
            alt="A mountain trail at dawn, cropped to a square"
          />
          <h3>
            <a yetiCardLink stretch routerLink="/replay">A square summit</a>
          </h3>
          <p>The picture is cropped to a square.</p>
        </li>
        <li yetiCard yetiLift raised>
          <h3>
            <a yetiCardLink stretch routerLink="/replay">A lake loop</a>
          </h3>
          <p>Four miles around the water.</p>
        </li>
        <li yetiCard yetiLift raised>
          <h3>
            <a yetiCardLink stretch routerLink="/replay">A forest ridge</a>
          </h3>
          <p>Shade all the way up.</p>
        </li>
      </ul>
    }
    @defer (hydrate never) {
      <div id="never-card" yetiCard yetiLift>
        <h3>
          <a yetiCardLink stretch routerLink="/replay"
            >A card that never hydrates</a
          >
        </h3>
        <p>The server rendered it and the client leaves it alone.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-card" yetiCard>
        <h3>A card from the client</h3>
        <p>The app preloads the card file.</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only card</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFixture {
  protected readonly live = signal(true);
}
