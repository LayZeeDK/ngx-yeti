import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiMasonry } from 'ngx-yeti/masonry';

/**
 * The masonry spec's Fixture-app route (masonry.md:312-318): Yeti's example
 * and eight blocks of fixed, different heights, which one control removes;
 * a layout in a `hydrate never` block; and a layout in a client-only
 * `@defer` (the app preloads `masonry`).
 */
@Component({
  selector: 'app-masonry-fixture',
  imports: [NgOptimizedImage, RouterLink, YetiMasonry],
  template: `<h2>Masonry</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live layouts
    </button>
    <a routerLink="/replay">Leave for a page without masonry</a>
    @if (live()) {
      <div id="photo-wall" yetiMasonry min="xs" columns="3">
        @for (photo of photos; track photo) {
          <img ngSrc="trail.svg" width="1600" height="900" [alt]="photo" />
        }
      </div>
      <div id="block-wall" yetiMasonry min="2xs" gap="sm">
        @for (block of blocks; track block) {
          <div>
            <a [href]="'#block-' + block">Block {{ block }}</a>
          </div>
        }
      </div>
      <p i18n>Each block keeps its own height.</p>
    }
    @defer (hydrate never) {
      <div id="never-wall" yetiMasonry min="2xs" columns="2">
        <p>A layout that never hydrates.</p>
        <p>The server rendered it.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-wall" yetiMasonry min="2xs" columns="2">
        <p>A layout from the client.</p>
        <p>Rendered after a click.</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only layout</button>
    }`,
  styles: `
    #block-wall > :nth-child(8n + 1) {
      block-size: 120px;
    }
    #block-wall > :nth-child(8n + 2) {
      block-size: 60px;
    }
    #block-wall > :nth-child(8n + 3) {
      block-size: 180px;
    }
    #block-wall > :nth-child(8n + 4) {
      block-size: 90px;
    }
    #block-wall > :nth-child(8n + 5) {
      block-size: 150px;
    }
    #block-wall > :nth-child(8n + 6) {
      block-size: 70px;
    }
    #block-wall > :nth-child(8n + 7) {
      block-size: 110px;
    }
    #block-wall > :nth-child(8n) {
      block-size: 80px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasonryFixture {
  protected readonly live = signal(true);
  protected readonly photos = [
    'A tall waterfall',
    'A wide valley',
    'A square pond',
    'A tall pine',
    'A wide ridge',
  ];
  protected readonly blocks = [1, 2, 3, 4, 5, 6, 7, 8];
}
