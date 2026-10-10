// A compile-time fixture (center.md, Testing Decisions, layer 2): `large` is
// not one of Yeti's widths, so this file must fail to compile. It sits
// outside every tsconfig and the lint; `src/compile-errors.node.spec.ts`
// compiles it and expects the error.
import { Component } from '@angular/core';
import { YetiCenter } from 'ngx-yeti/center';

@Component({
  selector: 'yeti-center-max-large',
  imports: [YetiCenter],
  template: '<main yetiCenter max="large"></main>',
})
export class CenterMaxLarge {}
