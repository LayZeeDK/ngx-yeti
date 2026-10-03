import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { YetiAlert, YetiBadge, YetiCard, YetiCenter, YetiStack } from 'yeti-lib';

@Component({
  imports: [YetiCard, YetiBadge, YetiAlert, YetiStack, YetiCenter],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <!-- L3: a permanent function-form leave listener keeps Angular's leaving set non-empty (angular/angular#66244). -->
      <p>Leave listener element: <span id="l3" (animate.leave)="noop($event)">L3</span></p>

      <button type="button" id="toggle" (click)="shown.set(!shown())">toggle card</button>
      @if (shown()) {
        <article yetiCard id="eager" animate.leave="leaving"><h3>Eager card</h3><p>Body</p></article>
      }
      <article class="card" id="plain-card"><h3>Plain</h3></article>

      <button type="button" id="toggle-badge" (click)="badgeShown.set(!badgeShown())">toggle badge</button>
      @if (badgeShown()) {
        <span yetiBadge id="eager-badge" data-variant="success">Eager badge</span>
      }
      @defer (hydrate never) {
        <span yetiBadge id="never-badge" data-variant="warning">Never badge</span>
      }
      @defer (hydrate on interaction) {
        <span yetiBadge id="hoi-badge" data-variant="danger">Hydrate on interaction</span>
      }

      <button type="button" #trigger id="trigger">defer trigger</button>
      @defer (on interaction(trigger)) {
        <div yetiAlert id="deferred-alert" role="status">Deferred alert</div>
      }

      <div yetiCenter id="center-top">top center</div>
      <button type="button" id="toggle-stack" (click)="stackShown.set(!stackShown())">toggle stack</button>
      @if (stackShown()) {
        <div yetiStack id="stack" gap="md"><div yetiCenter id="cis" data-max="sm">center in stack</div></div>
      }
    </main>
  `,
})
export class App {
  protected readonly shown = signal(true);
  protected readonly badgeShown = signal(true);
  protected readonly stackShown = signal(false);

  protected noop(event: { animationComplete: () => void }): void {
    event.animationComplete();
  }
}
