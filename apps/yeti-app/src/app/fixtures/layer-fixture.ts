import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiLayer, YetiLayerChild } from 'ngx-yeti/layer';

/**
 * The layer spec's Fixture-app route (layer.md:285-291): a captioned picture
 * and a layer written with the static `align="end"`, which one control
 * removes; a layer in a `hydrate never` block; and a layer in a client-only
 * `@defer` (the app preloads `layer`).
 */
@Component({
  selector: 'app-layer-fixture',
  imports: [NgOptimizedImage, RouterLink, YetiLayer, YetiLayerChild],
  template: `<h2>Captioned pictures</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live layers
    </button>
    <a routerLink="/replay">Leave for a page without layers</a>
    @if (live()) {
      <figure id="live-layer" yetiLayer>
        <img
          id="picture"
          ngSrc="trail.svg"
          width="1600"
          height="900"
          priority
          alt="A mountain trail at dawn"
          i18n-alt
        />
        <figcaption id="caption" yetiLayerChild alignSelf="end" i18n>
          Dawn on the ridge trail
        </figcaption>
      </figure>
      <div id="aligned-layer" yetiLayer align="end">
        <div id="aligned-tall" class="app-layer-tall">The tall child</div>
        <div id="aligned-short">The short child</div>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-layer" yetiLayer align="end">
        <div id="never-tall" class="app-layer-tall">
          A layer that never hydrates
        </div>
        <div id="never-short">Its short child still sits at the bottom</div>
      </div>
    }
    @defer (on interaction) {
      <div id="client-layer" yetiLayer align="end">
        <div id="client-tall" class="app-layer-tall">
          A layer from the client
        </div>
        <div id="client-short">Its short child sits at the bottom</div>
      </div>
    } @placeholder {
      <button type="button">Show the client-only layer</button>
    }`,
  styles: `
    .app-layer-tall {
      block-size: 10rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerFixture {
  protected readonly live = signal(true);
}
