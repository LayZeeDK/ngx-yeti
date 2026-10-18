import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiGrid, YetiGridChild } from 'ngx-yeti/grid';

/**
 * The grid spec's Fixture-app route (grid.md:308-314): a fitted list grid, a
 * folded grid, and a tracks grid whose last cell is an `ol` written with the
 * static `start` and `span`, which one control removes; a grid in a
 * `hydrate never` block; and a grid in a client-only `@defer` (the app
 * preloads `grid`).
 */
@Component({
  selector: 'app-grid-fixture',
  imports: [RouterLink, YetiGrid, YetiGridChild],
  template: `<h2>Grids</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live grids
    </button>
    <a routerLink="/replay">Leave for a page without grids</a>
    @if (live()) {
      <ul id="fitted-grid" yetiGrid min="2xs" columns="3" role="list">
        <li i18n>The ridge</li>
        <li>The valley</li>
        <li>The lake</li>
        <li>The coast</li>
        <li>The forest</li>
      </ul>
      <div id="folded-grid" yetiGrid columns="4" fold>
        @for (cell of cells; track cell) {
          <p>Stop {{ cell }}</p>
        }
      </div>
      <div id="tracks-grid" yetiGrid tracks="12" threshold="md" gap="sm">
        <figure id="first-work" yetiGridChild start="2" span="6">
          <figcaption>The first work</figcaption>
        </figure>
        <figure id="second-work" yetiGridChild start="9" span="4">
          <figcaption>The second work</figcaption>
        </figure>
        <ol id="steps-cell" yetiGridChild start="2" span="6">
          <li>Walk to the ridge</li>
          <li>Follow the river down</li>
        </ol>
      </div>
    }
    @defer (hydrate never) {
      <ul id="never-grid" yetiGrid min="2xs" columns="2" role="list">
        <li>A grid that never hydrates</li>
        <li>The server rendered it</li>
      </ul>
    }
    @defer (on interaction) {
      <ul id="client-grid" yetiGrid min="2xs" columns="2" role="list">
        <li>A grid from the client</li>
        <li>Rendered after a click</li>
      </ul>
    } @placeholder {
      <button type="button">Show the client-only grid</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridFixture {
  protected readonly live = signal(true);
  protected readonly cells = [1, 2, 3, 4, 5, 6, 7, 8];
}
