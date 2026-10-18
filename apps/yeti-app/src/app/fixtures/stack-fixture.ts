import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiStack, YetiStackChild } from 'ngx-yeti/stack';

/**
 * The stack spec's Fixture-app route (stack.md:315-322): a ruled, filled
 * stack with a pinned, a spaced, and a split child; a stack written with the
 * static `align`; a stack holding a center, the reference for the tie with
 * `center`; a stack in a `hydrate never` block; and a stack holding a center
 * in a client-only `@defer` (the app preloads `stack` and `center`). One
 * control removes the live stacks. The lone center outside every stack keeps
 * the `center` link in place, so the client-only stack's link arrives after
 * it. The `h2` puts the stack's `h3` one level below a heading, as axe's
 * `heading-order` asks under the app's `h1`.
 */
@Component({
  selector: 'app-stack-fixture',
  imports: [RouterLink, YetiCenter, YetiStack, YetiStackChild],
  template: `<h2>Trail notes</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live stacks
    </button>
    <a routerLink="/replay">Leave for a page without stacks</a>
    <div id="lone-center" yetiCenter max="xs">
      <p>A centred note outside every stack.</p>
    </div>
    @if (live()) {
      <div id="live-stack" yetiStack gap="sm" rule fill>
        <h3 id="pinned" class="app-stack-pinned" yetiStackChild sticky>
          Notes from the ridge
        </h3>
        <p id="first" i18n>Each note sits one gap below the last.</p>
        <p id="second">The rule draws a line in the middle of each gap.</p>
        <p id="spaced" yetiStackChild space="xl">More room above this note.</p>
        <p id="split" yetiStackChild split>
          Pushed to the bottom of the stack.
        </p>
      </div>
      <div id="aligned-stack" yetiStack align="center">
        <p>A note that keeps its own width.</p>
      </div>
      <div id="reference-stack" yetiStack>
        <div id="reference-center" yetiCenter max="xs">
          <p>A centred column in a stack.</p>
        </div>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-stack" yetiStack gap="lg">
        <p>A stack that never hydrates.</p>
        <p>The server rendered it and the client leaves it alone.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-stack" yetiStack>
        <div id="client-center" yetiCenter max="xs">
          <p>A centred column in a stack.</p>
        </div>
      </div>
    } @placeholder {
      <button type="button">Show the client-only stack</button>
    }`,
  styles: `
    .app-stack-pinned {
      background-color: var(--yeti-color-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackFixture {
  protected readonly live = signal(true);
}
