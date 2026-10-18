import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiTimeline } from 'ngx-yeti/timeline';

/**
 * The timeline spec's Fixture-app route (timeline.md:321-327): Yeti's
 * example, alternating and single-sided, which one control removes; a
 * timeline in a `hydrate never` block; and a timeline in a client-only
 * `@defer` (the app preloads `timeline`). The `h2` puts the entries' `h3`
 * one level below a heading, as axe's `heading-order` asks under the app's
 * `h1`.
 */
@Component({
  selector: 'app-timeline-fixture',
  imports: [RouterLink, YetiTimeline],
  template: `<h2>Release history</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live timelines
    </button>
    <a routerLink="/replay">Leave for a page without timelines</a>
    @if (live()) {
      <ol id="alternating" yetiTimeline alternate role="list">
        <li>
          <time datetime="2026-09-12">12 September</time>
          <h3 i18n>The plan</h3>
          <p>Twelve layouts on paper.</p>
        </li>
        <li>
          <time datetime="2026-09-13">13 September</time>
          <h3>The layouts</h3>
          <p>Fifteen of them, in the browser.</p>
        </li>
        <li>
          <time datetime="2026-09-14">14 September</time>
          <h3>The components</h3>
          <p>Eight, and two themes.</p>
        </li>
      </ol>
      <ol id="single" yetiTimeline gap="md" role="list">
        <li>
          <time datetime="2026-10-01">1 October</time>
          <h3>The first milestone</h3>
          <p>Two items and the style loader.</p>
        </li>
        <li>
          <time datetime="2026-10-10">10 October</time>
          <h3>The second milestone</h3>
          <p>Every layout.</p>
        </li>
      </ol>
    }
    @defer (hydrate never) {
      <ol id="never-timeline" yetiTimeline role="list">
        <li>
          <time datetime="2026-08-01">1 August</time>
          <h3>A timeline that never hydrates</h3>
        </li>
        <li>
          <time datetime="2026-08-02">2 August</time>
          <h3>Its rail stays drawn</h3>
        </li>
      </ol>
    }
    @defer (on interaction) {
      <ol id="client-timeline" yetiTimeline role="list">
        <li>
          <time datetime="2026-07-01">1 July</time>
          <h3>A timeline from the client</h3>
        </li>
        <li>
          <time datetime="2026-07-02">2 July</time>
          <h3>Drawn with its rail</h3>
        </li>
      </ol>
    } @placeholder {
      <button type="button">Show the client-only timeline</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineFixture {
  protected readonly live = signal(true);
}
