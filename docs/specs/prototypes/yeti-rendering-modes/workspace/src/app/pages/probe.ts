import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { mark, rec } from '../rec';

// PROTOTYPE (ticket 18): content of one @defer block. Its constructor marks when
// the block is created or hydrated on the client; its button shows replay.
@Component({
  selector: 'app-probe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" [attr.data-testid]="'probe-' + name()">
      <button class="button" type="button" [attr.data-testid]="'click-' + name()" (click)="hit()">Clicked {{ n() }}</button>
      <button class="button" type="button" [attr.commandfor]="'dlg-' + name()" command="show-modal" [attr.data-testid]="'dlgopen-' + name()">Open</button>
      <dialog class="dialog" [id]="'dlg-' + name()" [attr.data-testid]="'dlg-' + name()"><form method="dialog"><button class="button">Close</button></form></dialog>
      <div class="tabs" [attr.data-testid]="'tabs-' + name()">
        <div role="tablist" aria-label="Probe">
          <button type="button" role="tab" [id]="'t1-' + name()" [attr.aria-controls]="'p1-' + name()">One</button>
          <button type="button" role="tab" [id]="'t2-' + name()" [attr.aria-controls]="'p2-' + name()">Two</button>
        </div>
        <section role="tabpanel" [id]="'p1-' + name()">First</section>
        <section role="tabpanel" [id]="'p2-' + name()">Second</section>
      </div>
    </div>
  `,
})
export class Probe {
  readonly name = input.required<string>();
  protected readonly n = signal(0);

  constructor() {
    queueMicrotask(() => mark('probe:' + this.name()));
  }

  protected hit(): void {
    this.n.update((v) => v + 1);
    rec('click:' + this.name());
  }
}
