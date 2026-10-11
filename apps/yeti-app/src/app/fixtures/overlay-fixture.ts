import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxYetiPaint, YetiBox } from 'ngx-yeti/box';
import { YetiOverlay, YetiOverlayChild } from 'ngx-yeti/overlay';

/**
 * The overlay spec's Fixture-app route (overlay.md:323-328): Yeti's "sold
 * out" stamp and a `fixed` notice, which one control removes; an overlay in
 * a `hydrate never` block; and an overlay in a client-only `@defer` (the app
 * preloads `overlay`). The controls come first, so the fixed notice in the
 * middle of the viewport covers none of them.
 */
@Component({
  selector: 'app-overlay-fixture',
  imports: [
    NgOptimizedImage,
    NgxYetiPaint,
    RouterLink,
    YetiBox,
    YetiOverlay,
    YetiOverlayChild,
  ],
  template: `<h2>Held content</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live overlays
    </button>
    <a routerLink="/replay">Leave for a page without overlays</a>
    @defer (on interaction) {
      <div id="client-overlay" class="app-overlay-box" yetiOverlay>
        <p>An overlay from the client.</p>
        <p id="client-held" yetiOverlayChild over>Held over it</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only overlay</button>
    }
    @defer (hydrate never) {
      <div id="never-overlay" class="app-overlay-box" yetiOverlay gap="lg">
        <p>An overlay that never hydrates.</p>
        <p id="never-held" yetiOverlayChild over>Still held over it</p>
      </div>
    }
    @if (live()) {
      <div id="live-overlay" class="app-overlay-box" yetiOverlay>
        <img
          id="picture"
          ngSrc="trail.svg"
          width="1600"
          height="900"
          priority
          alt="A mountain trail at dawn"
        />
        <p id="held" yetiBox yetiPaint="alert" yetiOverlayChild over i18n>
          Sold out
        </p>
      </div>
      <div id="fixed-overlay" yetiOverlay fixed>
        <p>The page underneath the notice.</p>
        <p
          id="fixed-held"
          yetiBox
          yetiPaint="primary"
          yetiOverlayChild
          over
          role="status"
        >
          Offline: changes will sync later.
        </p>
      </div>
    }`,
  styles: `
    .app-overlay-box {
      inline-size: 24rem;
      max-inline-size: 100%;
      block-size: 12rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayFixture {
  protected readonly live = signal(true);
}
