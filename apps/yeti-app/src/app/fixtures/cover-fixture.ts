import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cover-fixture',
  imports: [RouterLink],
  template: `<h2>cover</h2>
    <p i18n data-fixture-stub>The cover route, a stub until its item lands.</p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverFixture {}
