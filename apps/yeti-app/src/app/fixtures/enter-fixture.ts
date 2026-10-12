import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxYetiEnter } from 'ngx-yeti/enter';

/**
 * The enter spec's Fixture-app route (enter.md:266-274): live hosts above the
 * fold (a fade, a slide from the end edge, and a `once` section and a `once`
 * rise already in view); a `once` section in a `hydrate never` block; client
 * insertions of a `once` section by an `@if` and by a client-only `@defer`;
 * below the fold, a `once` section, a `once` slide from the end edge, and a
 * staggered `once` slide from the end edge; and a `once` section in a
 * `hydrate on viewport` block, each group a viewport and a half below the
 * last. `enter` is not in the
 * app's preload list, so the insertions run without it. One control removes
 * the live hosts.
 */
@Component({
  selector: 'app-enter-fixture',
  imports: [NgxYetiEnter, RouterLink],
  template: `<h2>Arrivals</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live arrivals
    </button>
    <a routerLink="/replay">Leave for the replay page</a>
    @if (live()) {
      <p id="plain" yetiEnter i18n>A note that fades in on load.</p>
      <p id="slide" yetiEnter="slide" side="end">
        A note that slides in from the end edge.
      </p>
      <section id="in-view-once" yetiEnter once>
        <h3>Already in view</h3>
        <p>This section arrives once the page has hydrated.</p>
      </section>
      <section id="in-view-rise" yetiEnter="rise" once>
        <h3>Rising into view</h3>
        <p>This section rises once the page has hydrated.</p>
      </section>
    }
    @defer (hydrate never) {
      <section id="never-once" yetiEnter once>
        <h3>Never hydrated</h3>
        <p>The server rendered it and the client leaves it alone.</p>
      </section>
    }
    <button type="button" (click)="inserted.set(true)">
      Show the inserted section
    </button>
    @if (inserted()) {
      <section id="if-once" yetiEnter once>
        <h3>Inserted</h3>
        <p>A condition inserted this section.</p>
      </section>
    }
    @defer (on interaction) {
      <section id="deferred-once" yetiEnter once>
        <h3>Loaded on demand</h3>
        <p>A client-only block inserted this section.</p>
      </section>
    } @placeholder {
      <button type="button">Show the deferred section</button>
    }
    <div class="app-enter-spacer"></div>
    @if (live()) {
      <section id="below-once" yetiEnter once>
        <h3>Further down the trail</h3>
        <p>This section arrives the first time it comes near the viewport.</p>
      </section>
      <section id="below-slide" yetiEnter="slide" side="end" once>
        <h3>Over the ridge</h3>
        <p>This section slides in from the end edge when it comes near.</p>
      </section>
      <ul id="below-stagger" yetiEnter="slide" side="end" stagger once>
        <li id="below-stagger-first">Hills</li>
        <li>Lakes</li>
      </ul>
    }
    <div class="app-enter-spacer"></div>
    @defer (hydrate on viewport) {
      <section id="viewport-once" yetiEnter once>
        <h3>Hydrated on arrival</h3>
        <p>This block hydrates as it comes into view, then arrives.</p>
      </section>
    }`,
  styles: `
    .app-enter-spacer {
      block-size: 150vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterFixture {
  protected readonly live = signal(true);
  protected readonly inserted = signal(false);
}
