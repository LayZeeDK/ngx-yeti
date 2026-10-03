import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Probe } from './probe';

// PROTOTYPE (ticket 18): each @defer trigger, client-only (on ...) and
// incremental (hydrate on ...), each holding the same Yeti probe.
@Component({
  selector: 'app-defer-page',
  imports: [Probe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container stack">
      <button class="button" type="button" data-testid="when-on" (click)="go.set(true)">Set when</button>

      <section data-block="d-immediate">@defer (on immediate) { <app-probe name="d-immediate" /> } @placeholder { <p>ph d-immediate</p> }</section>
      <section data-block="d-idle">@defer (on idle) { <app-probe name="d-idle" /> } @placeholder { <p>ph d-idle</p> }</section>
      <section data-block="d-timer">@defer (on timer(800ms)) { <app-probe name="d-timer" /> } @placeholder { <p>ph d-timer</p> }</section>
      <section data-block="d-when">@defer (when go()) { <app-probe name="d-when" /> } @placeholder { <p>ph d-when</p> }</section>
      <section data-block="d-interaction">@defer (on interaction) { <app-probe name="d-interaction" /> } @placeholder { <button class="button" data-testid="ph-d-interaction">ph d-interaction</button> }</section>
      <section data-block="d-hover">@defer (on hover) { <app-probe name="d-hover" /> } @placeholder { <p data-testid="ph-d-hover">ph d-hover</p> }</section>

      <section data-block="h-immediate">@defer (hydrate on immediate) { <app-probe name="h-immediate" /> } @placeholder { <p>ph h-immediate</p> }</section>
      <section data-block="h-idle">@defer (hydrate on idle) { <app-probe name="h-idle" /> } @placeholder { <p>ph h-idle</p> }</section>
      <section data-block="h-timer">@defer (hydrate on timer(800ms)) { <app-probe name="h-timer" /> } @placeholder { <p>ph h-timer</p> }</section>
      <section data-block="h-when">@defer (hydrate when go()) { <app-probe name="h-when" /> } @placeholder { <p>ph h-when</p> }</section>
      <section data-block="h-interaction">@defer (hydrate on interaction) { <app-probe name="h-interaction" /> } @placeholder { <p>ph h-interaction</p> }</section>
      <section data-block="h-hover">@defer (hydrate on hover) { <app-probe name="h-hover" /> } @placeholder { <p>ph h-hover</p> }</section>
      <section data-block="h-never">@defer (hydrate never) { <app-probe name="h-never" /> } @placeholder { <p>ph h-never</p> }</section>

      <div class="spacer"></div>
      <section data-block="d-viewport">@defer (on viewport) { <app-probe name="d-viewport" /> } @placeholder { <p>ph d-viewport</p> }</section>
      <section data-block="h-viewport">@defer (hydrate on viewport) { <app-probe name="h-viewport" /> } @placeholder { <p>ph h-viewport</p> }</section>
      <div class="spacer"></div>
    </main>
  `,
})
export class DeferPage {
  protected readonly go = signal(false);
}
