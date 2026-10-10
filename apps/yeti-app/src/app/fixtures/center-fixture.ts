import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-center-fixture',
  imports: [RouterLink],
  template: `<h2>center</h2>
    <p i18n data-fixture-stub>The center route, a stub until its item lands.</p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterFixture {}

@Component({
  selector: 'app-center-anti-pattern-fixture',
  imports: [RouterLink],
  template: `<h2>center-anti-pattern</h2>
    <p i18n data-fixture-stub>
      The center-anti-pattern route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterAntiPatternFixture {}
