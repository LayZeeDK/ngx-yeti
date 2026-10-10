import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiStack } from 'ngx-yeti/stack';

/**
 * The center spec's Fixture-app route (center.md:284-291): a center alone,
 * a center with `intrinsic`, and a stack of centers, which one control
 * removes; a center in a `hydrate never` block; and a stack of centers in a
 * client-only `@defer` (the app preloads `center` and `stack`), which the
 * e2e test renders after either item's link. Until `button` lands, the
 * intrinsic center holds a plain button. The `h2` puts the centers' `h3`
 * one level below a heading, as axe's `heading-order` asks under the app's
 * `h1`.
 */
@Component({
  selector: 'app-center-fixture',
  imports: [RouterLink, YetiCenter, YetiStack],
  template: `<h2>Trail maps</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live centers
    </button>
    <a routerLink="/replay">Leave for a page without centers</a>
    @if (live()) {
      <section id="live-center" yetiCenter max="xs">
        <p i18n>Never wider than the maximum, never touching the edge.</p>
      </section>
      <div id="intrinsic-center" yetiCenter intrinsic>
        <h3>Welcome back</h3>
        <button type="button">Sign in</button>
      </div>
      <div id="live-stack" yetiStack>
        <section yetiCenter max="xs"><p>The first centred section.</p></section>
        <section yetiCenter max="xs">
          <p>The second centred section.</p>
        </section>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-center" yetiCenter max="xs">
        <p>A center that never hydrates.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-stack" yetiStack>
        <section yetiCenter max="xs"><p>A section from the client.</p></section>
        <section yetiCenter max="xs"><p>Another one below it.</p></section>
      </div>
    } @placeholder {
      <button type="button">Show the client-only stack of centers</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterFixture {
  protected readonly live = signal(true);
}

@Component({
  selector: 'app-center-anti-pattern-fixture',
  imports: [RouterLink],
  template: `<h2>center-anti-pattern</h2>
    <p i18n data-fixture-stub>
      The center-anti-pattern route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterAntiPatternFixture {}
