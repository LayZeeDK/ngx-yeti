import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiStack } from 'ngx-yeti/stack';

/**
 * The center spec's Fixture-app route (center.md:284-291): a center alone,
 * a center with `intrinsic`, a center with `yetiBox`, section 8's bordered
 * box inside a center, and a stack of centers, which one control removes; a center in a `hydrate never` block; and a stack of centers in a
 * client-only `@defer` (the app preloads `center` and `stack`), which the
 * e2e test renders after either item's link. Until `button` lands, the
 * intrinsic center holds a plain button. The `h2` puts the centers' `h3`
 * one level below a heading, as axe's `heading-order` asks under the app's
 * `h1`.
 */
@Component({
  selector: 'app-center-fixture',
  imports: [RouterLink, YetiCenter, YetiStack, YetiBox, YetiBorder],
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
      <section id="box-center" yetiCenter yetiBox gap="lg">
        <p>A padded column from one gap.</p>
      </section>
      <div id="bordered-center" yetiCenter max="md">
        <div yetiBox yetiBorder surface="raised">
          <h3>A readable column</h3>
          <p>The border sits on the box inside the center.</p>
        </div>
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

/**
 * A negative control (center.md:288, ledger A11Y-9): Yeti's own example, the
 * border on the center's element, which the center's usage rule 3 forbids.
 * The e2e test records its overflow at 320 px and leaves it out of the axe
 * and hydration checks.
 */
@Component({
  selector: 'app-center-anti-pattern-fixture',
  imports: [RouterLink, YetiCenter, YetiBox, YetiBorder],
  template: `<h2>What not to write: a border on the center</h2>
    <p i18n>
      This page shows markup not to write. The border sits on the center's own
      element, so at 320 pixels the column is wider than the page.
    </p>
    <div
      id="anti-pattern-center"
      yetiCenter
      yetiBox
      yetiBorder
      max="md"
      surface="raised"
    >
      <h3>A readable column</h3>
      <p>Never wider than the maximum, never touching the screen edge.</p>
    </div>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterAntiPatternFixture {}
