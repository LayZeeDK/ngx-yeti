import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from 'ngx-yeti';

@Component({
  selector: 'app-highlight-fixture',
  imports: [Highlight],
  template: `<p yetiHighlight="yellow" i18n>Highlighted text</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightFixture {}
