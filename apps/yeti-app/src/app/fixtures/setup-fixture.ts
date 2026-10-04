import {
  type AnimationCallbackEvent,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';

/**
 * The setup spec's layer-4 cases that need no later item (setup.md:335-341):
 * a shared `card` and `lift` host (ADR 0045); the same host in a
 * `hydrate never` and a `hydrate on interaction` block; a card that leaves
 * under a class-form `animate.leave`, beside a function-form
 * `(animate.leave)` listener; and a client-only `@defer` with a card
 * (preloaded by the app) and a lifted link (not preloaded). One control
 * removes every live host.
 */
@Component({
  selector: 'app-setup-fixture',
  imports: [NgxYetiLift, RouterLink, YetiCard, YetiCardLink],
  template: `<h2>Setup</h2>
    <p i18n>Each item loads its Yeti file as one counted link.</p>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live hosts
    </button>
    @if (live()) {
      <article id="shared-host" yetiCard raised yetiLift>
        <h3>
          <a yetiCardLink stretch routerLink="/card">A card that lifts</a>
        </h3>
        <p>One element, two items, two files.</p>
      </article>
      <article id="leaving-host" yetiCard animate.leave="app-setup-leaving">
        <h3>A card that fades out</h3>
        <p>It keeps its styles until it has left.</p>
      </article>
      <p (animate.leave)="leave($event)">
        This line leaves through a listener.
      </p>
    }
    @defer (hydrate never) {
      <article id="never-host" yetiCard raised yetiLift>
        <h3>A card that never hydrates</h3>
        <p>The server rendered it and the client leaves it alone.</p>
      </article>
    }
    @defer (hydrate on interaction) {
      <article id="interaction-host" yetiCard raised yetiLift>
        <h3>A card that hydrates on interaction</h3>
        <button type="button" (click)="hydrated.set(true)">
          {{ hydrated() ? 'Hydrated' : 'Hydrate this card' }}
        </button>
      </article>
    }
    @defer (on interaction) {
      <article id="client-card" yetiCard>
        <h3>A card from the client</h3>
        <p>The app preloads the card file.</p>
      </article>
      <a id="client-lift" yetiLift routerLink="/lift"
        >A lifted link from the client</a
      >
    } @placeholder {
      <button type="button">Show the client-only items</button>
    }`,
  styles: `
    .app-setup-leaving {
      animation: app-setup-fade 600ms linear;
    }
    @keyframes app-setup-fade {
      to {
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupFixture {
  protected readonly live = signal(true);
  protected readonly hydrated = signal(false);

  protected leave(event: AnimationCallbackEvent): void {
    event.animationComplete();
  }
}

/**
 * The setup spec's client-only `@defer` with the preload list
 * (setup.md:341; ADR 0060 point 6): the page's only card first renders on the
 * client, so the server writes no card link and the app's `card` preload is
 * the only card request before the interaction.
 */
@Component({
  selector: 'app-setup-defer-fixture',
  imports: [YetiCard],
  template: `<h2>Setup with a deferred card</h2>
    <p i18n>The card file is preloaded before the card first renders.</p>
    @defer (on interaction) {
      <article id="deferred-card" yetiCard>
        <h3>A card from the client</h3>
        <p>Its file arrived through the preload.</p>
      </article>
    } @placeholder {
      <button type="button">Show the deferred card</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupDeferFixture {}
