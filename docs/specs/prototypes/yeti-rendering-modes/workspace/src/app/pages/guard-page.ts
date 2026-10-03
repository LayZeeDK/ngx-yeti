import { AnimationCallbackEvent, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Badge } from './badge';

// PROTOTYPE (ticket 18): angular/angular#66244's guard against Yeti's badge.css,
// and a dehydrated badge (hydrate never) when the last counted badge leaves.
@Component({
  selector: 'app-guard-page',
  imports: [Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container stack">
      <div class="cluster">
        <button class="button" data-testid="g-badge" (click)="badge.set(!badge())">badge</button>
        <button class="button" data-testid="g-permclass" (click)="permClass.set(!permClass())">perm class leave</button>
        <button class="button" data-testid="g-permfn" (click)="permFn.set(!permFn())">perm fn leave</button>
        <button class="button" data-testid="g-both" (click)="badge.set(false); leaver.set(false)">badge + leaver together</button>
      </div>
      @if (badge()) {
        <p>Eager: <app-badge data-testid="g-eager">Live</app-badge></p>
      }
      @if (permClass()) {
        <p data-testid="g-permclass-el" animate.leave="t-leave-anim">Has a class-form animate.leave</p>
      }
      @if (permFn()) {
        <p data-testid="g-permfn-el" (animate.leave)="done($event)">Has a function-form (animate.leave)</p>
      }
      @if (leaver()) {
        <p data-testid="g-leaver" animate.leave="t-leave-anim">Leaves with the badge</p>
      }
      <section data-testid="g-dehydrated">
        @defer (hydrate never) { <p>Dehydrated: <app-badge data-testid="g-never">Never</app-badge></p> }
      </section>
    </main>
  `,
})
export class GuardPage {
  protected readonly badge = signal(true);
  protected readonly permClass = signal(false);
  protected readonly permFn = signal(false);
  protected readonly leaver = signal(true);

  protected done(event: AnimationCallbackEvent): void {
    event.animationComplete();
  }
}
