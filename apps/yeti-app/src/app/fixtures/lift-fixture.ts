import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';

/**
 * The lift spec's Fixture-app cases (lift.md:249): live lifted cards, one of
 * them `scale`; a lifted card in a `hydrate never` block; a control that
 * removes the live cards; and a lifted card in a client-only `@defer`. `lift`
 * is not in the app's preload list, so the client-only card records the
 * frames without it.
 */
@Component({
  selector: 'app-lift-fixture',
  imports: [NgxYetiLift, RouterLink, YetiCard, YetiCardLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture keeps the lift cases in one file, like the other fixtures
  template: `<h2>Lifted cards</h2>
    <p i18n>Point at a card or tab to its link to lift it.</p>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live lifted cards
    </button>
    @if (live()) {
      <article id="rise-card" yetiCard raised yetiLift>
        <h3>
          <a yetiCardLink stretch routerLink="/card">A card that rises</a>
        </h3>
        <p>It moves up while the pointer is on it.</p>
      </article>
      <article id="scale-card" yetiCard raised yetiLift="scale">
        <h3>
          <a yetiCardLink stretch routerLink="/card">A card that grows</a>
        </h3>
        <p>It grows a little instead of rising.</p>
      </article>
    }
    @defer (hydrate never) {
      <article id="never-card" yetiCard raised yetiLift>
        <h3>
          <a yetiCardLink stretch routerLink="/card"
            >A card that never hydrates</a
          >
        </h3>
        <p>The server rendered it and the client leaves it alone.</p>
      </article>
    }
    @defer (on interaction) {
      <article id="client-card" yetiCard raised yetiLift>
        <h3>
          <a yetiCardLink stretch routerLink="/card">A card from the client</a>
        </h3>
        <p>The client renders it when asked.</p>
      </article>
    } @placeholder {
      <button type="button">Show the client-only lifted card</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiftFixture {
  protected readonly live = signal(true);
}
