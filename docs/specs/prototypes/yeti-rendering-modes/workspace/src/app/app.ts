import { ApplicationRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { mark } from './rec';
import { PlainProbe } from './pages/plain-probe';

// PROTOTYPE (ticket 18): the root only marks when the application is stable.
@Component({
  imports: [RouterOutlet, PlainProbe],
  selector: 'app-root',
  // Eager (22 defaults to OnPush) so the probe below is checked on every tick.
  changeDetection: ChangeDetectionStrategy.Eager,
  // The probe sits in the root (Eager change detection), not under an OnPush page.
  template: '<router-outlet /><app-plain-probe />',
})
export class App {
  constructor() {
    mark('appCtor');
    inject(ApplicationRef)
      .whenStable()
      .then(() => mark('stable'));
  }
}
