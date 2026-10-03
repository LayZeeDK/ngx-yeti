import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

// The lazily loaded part: card.css, inside @defer, added and removed with @if.
@Component({
  selector: 'app-lazy-card',
  template: `
    <article class="card" data-m="card-plain">
      <h3>Plain card</h3>
      <p>Yeti card with no utilities.</p>
      <footer><span class="badge" data-variant="success">Open</span></footer>
    </article>
    <article class="card p-12 bg-amber-100 text-amber-900 flex" data-m="card-utils">
      <h3>Card with utilities</h3>
      <p>p-12 bg-amber-100 text-amber-900 flex</p>
    </article>
  `,
  styleUrl: './parts/card.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyCard {}
