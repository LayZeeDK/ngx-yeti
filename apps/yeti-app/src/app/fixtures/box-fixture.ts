import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-box-fixture',
  imports: [RouterLink],
  template: `<h2>box</h2>
    <p i18n data-fixture-stub>The box route, a stub until its item lands.</p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxFixture {}

@Component({
  selector: 'app-box-markers-fixture',
  imports: [RouterLink],
  template: `<h2>box-markers</h2>
    <p i18n data-fixture-stub>
      The box-markers route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxMarkersFixture {}
