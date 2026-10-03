import { Directive, input } from '@angular/core';

@Directive({
  selector: '[yetiHighlight]',
  host: {
    '[style.background-color]': 'color()',
  },
})
export class Highlight {
  color = input('yellow', { alias: 'yetiHighlight' });
}
