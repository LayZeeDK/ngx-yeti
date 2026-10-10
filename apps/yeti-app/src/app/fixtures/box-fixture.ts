import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxYetiPaint, YetiBorder, YetiBox, YetiText } from 'ngx-yeti/box';

/**
 * The box spec's Fixture-app route (box.md:305-315): Yeti's raised bordered
 * box, a painted band, and a box with `gap="3xl"`, which one control
 * removes; a box in a `hydrate never` block; and a box in a client-only
 * `@defer` (the app preloads `box`).
 */
@Component({
  selector: 'app-box-fixture',
  imports: [RouterLink, YetiBox, YetiBorder, NgxYetiPaint],
  template: `<h2>Boxes</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live boxes
    </button>
    <a routerLink="/replay">Leave for a page without boxes</a>
    @if (live()) {
      <section id="live-box" yetiBox gap="lg" surface="raised" yetiBorder>
        <h3 i18n>A box you can see</h3>
        <p>Prose inside a box keeps its rhythm.</p>
      </section>
      <section id="paint-band" yetiBox yetiPaint="primary">
        <p>News: the trail maps are back in print.</p>
      </section>
      <div id="wide-box" yetiBox gap="3xl">
        <p>A box with the widest padding.</p>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-box" yetiBox gap="lg">
        <p>A box that never hydrates.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-box" yetiBox gap="lg">
        <p>A box from the client.</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only box</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxFixture {
  protected readonly live = signal(true);
}

/** The box's three markers on elements that are not boxes: no box file. */
@Component({
  selector: 'app-box-markers-fixture',
  imports: [RouterLink, YetiBorder, NgxYetiPaint, YetiText],
  template: `<h2>Box markers</h2>
    <figure id="bordered-figure" yetiBorder>
      <figcaption i18n>A bordered figure, with no box on the page.</figcaption>
    </figure>
    <p id="muted-text" yetiText="grey-70">Muted words in grey-70.</p>
    <section id="marker-band" yetiPaint="primary">
      <p>A painted band that is not a box.</p>
    </section>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxMarkersFixture {}
