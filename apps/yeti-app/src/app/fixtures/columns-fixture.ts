import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-columns-fixture',
  imports: [RouterLink],
  template: `<h2>columns</h2>
    <p i18n data-fixture-stub>
      The columns route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnsFixture {}
