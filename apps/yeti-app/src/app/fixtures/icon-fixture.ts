import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiIcon } from 'ngx-yeti/icon';

/**
 * The icon spec's Fixture-app route (icon.md:296-302): a link with a
 * decorative icon, a meaningful icon before a message, and an icon written
 * with the static `align`, whose label ends in a zero-size probe on the
 * baseline; an icon in a `hydrate never` block; and an icon in a client-only
 * `@defer` (the app preloads `icon`). One control removes the live icons.
 */
@Component({
  selector: 'app-icon-fixture',
  imports: [RouterLink, YetiIcon],
  template: `<h2 i18n>Icons</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live icons
    </button>
    <a routerLink="/replay">Leave for a page without icons</a>
    @if (live()) {
      <p>
        <a id="link-icon" yetiIcon routerLink="/replay">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M5 12h14m0 0-5-5m5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span i18n>Open the replay page</span>
        </a>
      </p>
      <p>
        <span id="warning-icon" yetiIcon>
          <svg
            role="img"
            aria-label="Warning"
            i18n-aria-label
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3 2 21h20L12 3zm0 6v6m0 3v1"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span i18n>Your session ends in five minutes.</span>
        </span>
      </p>
      <p>
        <span id="aligned-icon" yetiIcon align="baseline">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M5 12l5 5L20 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span
            >Saved<span id="baseline-probe" class="app-icon-probe"></span
          ></span>
        </span>
      </p>
    }
    @defer (hydrate never) {
      <p>
        <span id="never-icon" yetiIcon>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M5 12l5 5L20 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span>An icon that never hydrates</span>
        </span>
      </p>
    }
    @defer (on interaction) {
      <p>
        <span id="client-icon" yetiIcon>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M5 12l5 5L20 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          <span>An icon from the client</span>
        </span>
      </p>
    } @placeholder {
      <button type="button">Show the client-only icon</button>
    }`,
  styles: `
    .app-icon-probe {
      display: inline-block;
      inline-size: 0;
      block-size: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconFixture {
  protected readonly live = signal(true);
}
