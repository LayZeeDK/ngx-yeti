// PROTOTYPE (ticket 29), variant A: Yeti's markup verbatim plus the row 32/34 directives.
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiDropdown, YetiDropdownPanel, YetiNav, YetiNavList } from './yeti-a';

@Component({
  selector: 'app-demo-a',
  imports: [RouterLink, YetiDropdown, YetiDropdownPanel, YetiNav, YetiNavList],
  template: `
<nav class="nav" aria-label="Site" yetiNav>
	<a href="#" data-brand>Yeti</a>
	<button type="button" popovertarget="site-menu" aria-label="Menu"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
	<ul id="site-menu" popover role="list" yetiNavList>
		<li><a href="#" aria-current="page">Docs</a></li>
		<li><a routerLink="." [queryParams]="{ p: 'blog' }">Blog</a></li>
		<li class="dropdown" yetiDropdown>
			<button type="button" popovertarget="more-menu">More</button>
			<div id="more-menu" popover yetiDropdownPanel>
				<a routerLink="." [queryParams]="{ p: 'guides' }">Guides</a>
				<a href="#">Components</a>
				<a href="#">Changelog</a>
			</div>
		</li>
		<li><a href="#">About</a></li>
	</ul>
	<div data-actions><a class="button" href="#" data-size="sm">Get started</a></div>
</nav>
<div class="dropdown" yetiDropdown>
	<button class="button" type="button" popovertarget="account-menu" data-emphasis="medium">Account</button>
	<div id="account-menu" popover yetiDropdownPanel>
		<a routerLink="." [queryParams]="{ p: 'profile' }">Profile</a>
		<a href="#">Settings</a>
		<button type="button">Sign out</button>
	</div>
</div>
<div class="dropdown" data-trigger="hover" yetiDropdown trigger="hover">
	<button class="button" type="button" popovertarget="products" data-emphasis="low">Products</button>
	<div id="products" popover yetiDropdownPanel>
		<a href="#">Overview</a>
		<a href="#">Pricing</a>
	</div>
</div>
<p><a href="#">After</a></p>
`,
})
export class DemoA {}
