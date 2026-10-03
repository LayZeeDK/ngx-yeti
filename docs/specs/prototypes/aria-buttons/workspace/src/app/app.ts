import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Variants } from './variants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<main><router-outlet /></main>',
})
export class App {}

@Component({
  selector: 'app-home',
  imports: [Variants],
  template: '<app-variants />',
})
export class Home {}

@Component({
  selector: 'app-never',
  imports: [Variants],
  template: '@defer (hydrate never) { <app-variants /> }',
})
export class Never {}
