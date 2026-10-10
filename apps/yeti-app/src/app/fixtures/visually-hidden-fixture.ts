import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-visually-hidden-fixture',
  imports: [RouterLink],
  template: `<h2>visually-hidden</h2>
    <p i18n data-fixture-stub>
      The visually-hidden route, a stub until its item lands.
    </p>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisuallyHiddenFixture {}
