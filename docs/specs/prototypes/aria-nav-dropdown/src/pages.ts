// PROTOTYPE (ticket 29): the four routes. *-never wrap the variant in @defer (hydrate never).
import { Component } from '@angular/core';
import { DemoA } from './a/demo-a';
import { DemoB } from './b/demo-b';

@Component({ selector: 'app-page-a', imports: [DemoA], template: '<main><h1>Variant A</h1><app-demo-a /></main>' })
export class PageA {}

@Component({ selector: 'app-page-b', imports: [DemoB], template: '<main><h1>Variant B</h1><app-demo-b /></main>' })
export class PageB {}

@Component({
  selector: 'app-page-a-never',
  imports: [DemoA],
  template: '<main><h1>Variant A, hydrate never</h1>@defer (hydrate never) { <app-demo-a /> }</main>',
})
export class PageANever {}

@Component({
  selector: 'app-page-b-never',
  imports: [DemoB],
  template: '<main><h1>Variant B, hydrate never</h1>@defer (hydrate never) { <app-demo-b /> }</main>',
})
export class PageBNever {}

@Component({ selector: 'app-page-b2', imports: [DemoB], template: '<main><h1>Variant B</h1><app-demo-b liRole="none" /></main>' })
export class PageB2 {}
