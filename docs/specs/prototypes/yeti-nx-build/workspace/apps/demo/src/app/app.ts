import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="stack"><button class="button" type="button" data-variant="primary">Themed</button></main>`,
})
export class App {}
