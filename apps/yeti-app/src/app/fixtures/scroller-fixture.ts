import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiScroller } from 'ngx-yeti/scroller';

/**
 * The scroller spec's Fixture-app route (scroller.md:310-316): section 8's
 * markup first on the page, so the first Tab reaches it; one control that
 * removes it; a scroller in a `hydrate never` block; and a scroller in a
 * client-only `@defer` (the app preloads `scroller`). The `h2` puts the
 * items' `h3` one level below a heading, as axe's `heading-order` asks under
 * the app's `h1`.
 */
@Component({
  selector: 'app-scroller-fixture',
  imports: [RouterLink, YetiBorder, YetiBox, YetiScroller],
  template: `<h2 i18n>Featured articles</h2>
    @if (live()) {
      <div
        id="featured-scroller"
        yetiScroller
        snap
        width="sm"
        aria-label="Featured articles"
        i18n-aria-label
      >
        @for (title of titles; track title) {
          <article yetiBox yetiBorder surface="raised">
            <h3>{{ title }}</h3>
          </article>
        }
      </div>
    }
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live scroller
    </button>
    <a routerLink="/replay">Leave for a page without scrollers</a>
    @defer (hydrate never) {
      <div id="never-scroller" yetiScroller width="sm" aria-label="Archive">
        <p>A scroller that never hydrates</p>
        <p>The server rendered it</p>
        <p>It still scrolls by keyboard</p>
        <p>And keeps its item file</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-scroller" yetiScroller width="sm" aria-label="Later">
        <p>A scroller from the client</p>
        <p>Rendered after a click</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only scroller</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollerFixture {
  protected readonly live = signal(true);
  protected readonly titles = ['One', 'Two', 'Three', 'Four'];
}
