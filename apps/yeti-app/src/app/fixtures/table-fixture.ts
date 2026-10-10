import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-table-fixture',
  imports: [RouterLink],
  template: `<h2>table</h2>
    <p i18n data-fixture-stub>The table route, a stub until its item lands.</p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFixture {}

@Component({
  selector: 'app-table-numeric-fixture',
  imports: [RouterLink],
  template: `<h2>table-numeric</h2>
    <p i18n data-fixture-stub>
      The table-numeric route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableNumericFixture {}

@Component({
  selector: 'app-table-without-tbody-fixture',
  imports: [RouterLink],
  template: `<h2>table-without-tbody</h2>
    <p i18n data-fixture-stub>
      The table-without-tbody route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableWithoutTbodyFixture {}
