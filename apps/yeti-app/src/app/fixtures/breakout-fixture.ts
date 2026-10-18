import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  YetiBreakout,
  YetiBreakoutChild,
  YetiBreakoutNote,
} from 'ngx-yeti/breakout';
import { YetiFrame } from 'ngx-yeti/frame';

/**
 * The breakout spec's Fixture-app route (breakout.md:290-295): a long read
 * with a bleeding `yetiFrame` and a margin note, which one control removes;
 * a breakout in a `hydrate never` block; and a breakout in a client-only
 * `@defer` (the app preloads `breakout`). The `h2` puts the long read's `h3`
 * one level below a heading, as axe's `heading-order` asks under the app's
 * `h1`.
 */
@Component({
  selector: 'app-breakout-fixture',
  imports: [
    NgOptimizedImage,
    RouterLink,
    YetiBreakout,
    YetiBreakoutChild,
    YetiBreakoutNote,
    YetiFrame,
  ],
  template: `<h2>Trail maps</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live breakouts
    </button>
    <a routerLink="/replay">Leave for a page without breakouts</a>
    @if (live()) {
      <article id="live-breakout" yetiBreakout>
        <h3 i18n>A long read</h3>
        <p>
          Every marked route in the park, printed at a scale you can walk by.
        </p>
        <div
          id="bleed"
          class="app-positioned"
          yetiFrame
          ratio="21/9"
          yetiBreakoutChild
          bleed
        >
          <img
            ngSrc="trail.svg"
            fill
            alt="The trail from edge to edge of the page"
          />
        </div>
        <div id="plain">
          The valley loop is the easiest of the marked routes, and the band
          above is the exception to the column.
        </div>
        <aside id="note" yetiBreakoutNote>Closed from November to March.</aside>
        <p>Then the text picks up at exactly the width it left off.</p>
      </article>
    }
    @defer (hydrate never) {
      <article id="never-breakout" yetiBreakout gap="lg">
        <div id="never-plain">A breakout that never hydrates.</div>
        <div id="never-bleed" yetiBreakoutChild bleed>
          <p>Its band still spans the width.</p>
        </div>
      </article>
    }
    @defer (on interaction) {
      <article id="client-breakout" yetiBreakout>
        <div id="client-plain">A long read from the client.</div>
        <div id="client-bleed" yetiBreakoutChild bleed>
          <p>Its band spans the width.</p>
        </div>
      </article>
    } @placeholder {
      <button type="button">Show the client-only breakout</button>
    }`,
  styles: `
    .app-positioned {
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreakoutFixture {
  protected readonly live = signal(true);
}
