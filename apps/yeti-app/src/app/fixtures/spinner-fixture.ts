import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiSpinner } from 'ngx-yeti/spinner';

/**
 * The spinner spec's Fixture-app route (spinner.md:324-330): section 8's
 * markup with the wait running on the server and the client, and a
 * `@defer (on idle)` block with a spinner placeholder, which one control
 * removes; a spinner in a `hydrate never` block; and a spinner in a
 * client-only `@defer` (the app preloads `spinner`).
 */
@Component({
  selector: 'app-spinner-fixture',
  imports: [RouterLink, YetiSpinner],
  template: `<h2>Waiting</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live spinners
    </button>
    <a routerLink="/replay">Leave for the replay page</a>
    @if (live()) {
      <p>
        <span
          id="loading-spinner"
          yetiSpinner
          role="status"
          aria-label="Loading"
          i18n-aria-label
        ></span>
        <span i18n>Loading the latest posts</span>
      </p>
      <p>
        Searching
        <span
          id="search-spinner"
          yetiSpinner
          size="lg"
          variant="neutral"
          role="status"
          aria-label="Searching"
        ></span>
      </p>
      @defer (on idle) {
        <p id="comments">Twelve comments.</p>
      } @placeholder {
        <p>
          <span
            id="placeholder-spinner"
            yetiSpinner
            role="status"
            aria-label="Loading comments"
          ></span>
          Loading comments
        </p>
      }
    }
    @defer (hydrate never) {
      <p>
        <span
          id="never-spinner"
          yetiSpinner
          role="status"
          aria-label="Loading the archive"
        ></span>
        Loading the archive
      </p>
    }
    @defer (on interaction) {
      <p>
        <span
          id="client-spinner"
          yetiSpinner
          role="status"
          aria-label="Loading the map"
        ></span>
        Loading the map
      </p>
    } @placeholder {
      <button type="button">Show the client-only spinner</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerFixture {
  protected readonly live = signal(true);
}
