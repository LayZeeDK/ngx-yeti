import { LazyCard } from './lazy-card';
import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';

// PROTOTYPE (ticket 24): throwaway. Eager Yeti parts arrive through this
// component's styleUrl, appended after the global sheet (ticket 23, P1).
@Component({
  selector: 'app-eager',
  templateUrl: './eager.html',
  styleUrl: './parts/eager.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Eager {}


@Component({
  selector: 'app-root',
  imports: [Eager, LazyCard],
  template: `
    <main data-m="main">
      <button type="button" id="toggle" (click)="show.set(!show())">toggle card</button>
      <app-eager />
      <section data-m="lazy">
        @if (show()) {
          @defer (on immediate) {
            <app-lazy-card />
          }
        }
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly show = signal(false);
}
