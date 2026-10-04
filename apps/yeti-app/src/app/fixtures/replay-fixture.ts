import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-replay-fixture',
  template: `<button type="button" i18n (click)="increment()">
    Clicked {{ count() }} times
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayFixture {
  protected readonly count = signal(0);

  protected increment(): void {
    this.count.update((count) => count + 1);
  }
}
