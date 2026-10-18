import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiCover, YetiCoverChild } from 'ngx-yeti/cover';

/**
 * The cover spec's Fixture-app route (cover.md:290-296): a viewport-tall
 * cover with a centred heading between a top and a bottom note, the bottom
 * one a box; a short cover holding a center, the reference for the order
 * with `center`; both removed by one control; a cover that is also a box in
 * a `hydrate never` block; and the same cover holding a center in a
 * client-only `@defer` (the app preloads `cover` and `center`). The lone
 * center outside every cover keeps the `center` link in place, so the
 * client-only cover's link can arrive after it. The `h2` puts the cover's
 * `h3` one level below a heading, as axe's `heading-order` asks under the
 * app's `h1`.
 */
@Component({
  selector: 'app-cover-fixture',
  imports: [RouterLink, YetiBox, YetiCenter, YetiCover, YetiCoverChild],
  template: `<h2>Trail maps</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live covers
    </button>
    <a routerLink="/replay">Leave for a page without covers</a>
    <div id="lone-center" yetiCenter max="xs">
      <p>A centred note outside every cover.</p>
    </div>
    @if (live()) {
      <section id="live-cover" yetiCover gap="lg">
        <p id="cover-top">Every marked route in the park.</p>
        <h3 id="cover-heading" yetiCoverChild center i18n>
          A heading centred in the viewport
        </h3>
        <p id="cover-bottom" yetiBox>Printed maps you can walk by.</p>
      </section>
      <section id="reference-cover" yetiCover height="sm">
        <div id="reference-center" yetiCenter max="2xs" yetiCoverChild center>
          <p>A centred column in a cover.</p>
        </div>
      </section>
    }
    @defer (hydrate never) {
      <section id="never-cover" yetiCover yetiBox gap="lg" height="sm">
        <p yetiCoverChild center>A cover that never hydrates.</p>
        <p>It is a box as well.</p>
      </section>
    }
    @defer (on interaction) {
      <section id="client-cover" yetiCover height="sm">
        <div id="client-center" yetiCenter max="2xs" yetiCoverChild center>
          <p>A centred column in a cover.</p>
        </div>
      </section>
    } @placeholder {
      <button type="button">Show the client-only cover</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverFixture {
  protected readonly live = signal(true);
}
