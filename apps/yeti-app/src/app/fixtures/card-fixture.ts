import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';

/**
 * The card spec's section 8 markup. Until `badge` and `button` land, a plain
 * `span` and a plain footer link stand in for `yetiBadge` and `yetiButton`.
 * The `h2` puts the card's `h3` one level below a heading, as axe's
 * `heading-order` asks under the app's `h1`.
 */
@Component({
  selector: 'app-card-fixture',
  imports: [NgOptimizedImage, RouterLink, YetiCard, YetiCardLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture shows the spec's section 8 markup in one file, like the other fixtures
  template: `<h2>Weekend trips</h2>
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
    </article>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFixture {}
