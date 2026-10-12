// A compile-time fixture (button.md, usage rule 4): the template binds
// `[disabled]` on an `a[yetiButton]` without importing
// `YetiButtonDisabledLink`, and `disabled` is not a property of `a`, so this
// file must fail to compile with NG8002. It sits outside every tsconfig and
// the lint; `src/compile-errors.node.spec.ts` compiles it and expects the
// error.
import { Component, signal } from '@angular/core';
import { YetiButton } from 'ngx-yeti/button';

@Component({
  selector: 'yeti-button-disabled-link-not-imported',
  imports: [YetiButton],
  template: '<a yetiButton [disabled]="last()">Next</a>',
})
export class ButtonDisabledLinkNotImported {
  protected readonly last = signal(true);
}
