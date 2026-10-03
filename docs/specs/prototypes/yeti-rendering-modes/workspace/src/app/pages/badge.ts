import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

// PROTOTYPE (ticket 18): Yeti's badge.css through a component styleUrl, the
// S1 shape from ticket 04, so SharedStylesHost owns and counts it.
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './badge.css',
  host: { class: 'badge', 'data-variant': 'success' },
  template: '<ng-content />',
})
export class Badge {}
