import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';

/**
 * The visually-hidden spec's Fixture-app route (visually-hidden.md:273-280):
 * live links with hidden words, one of them long, with the visible and
 * hidden words of the first in one `i18n` message; a link in a
 * `hydrate never` block; and a link in a client-only `@defer` (the app
 * preloads `visually-hidden`). One control removes the live links.
 */
@Component({
  selector: 'app-visually-hidden-fixture',
  imports: [RouterLink, YetiVisuallyHidden],
  template: `<h2>Hidden words</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live links
    </button>
    <a routerLink="/replay">Leave for the replay page</a>
    @if (live()) {
      <ul role="list">
        <li>
          <a id="read-more" routerLink="/card" i18n
            >Read more<span id="hidden-words" yetiVisuallyHidden>
              about the trail map</span
            ></a
          >
        </li>
        <li>
          <a id="long-link" routerLink="/card"
            >Details<span id="long-words" yetiVisuallyHidden>
              about every trail, hut, ford, and ridge on the long northern route
              through the mountains</span
            ></a
          >
        </li>
      </ul>
    }
    @defer (hydrate never) {
      <p>
        <a id="never-link" routerLink="/card"
          >Read more<span id="never-words" yetiVisuallyHidden>
            about the mountain hut</span
          ></a
        >
      </p>
    }
    @defer (on interaction) {
      <p>
        <a id="client-link" routerLink="/card"
          >Read more<span id="client-words" yetiVisuallyHidden>
            about the field guide</span
          ></a
        >
      </p>
    } @placeholder {
      <button type="button">Show the client-only link</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisuallyHiddenFixture {
  protected readonly live = signal(true);
}
