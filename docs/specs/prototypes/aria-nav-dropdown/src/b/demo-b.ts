// PROTOTYPE (ticket 29), variant B: the same Yeti markup on Angular Aria's menu family.
// ngMenuTrigger / ngMenu / ngMenuItem for the dropdown; ngMenuBar on the nav's list,
// with the nested dropdown as an ngMenuItem [submenu]. Aria's Menu never hides itself
// (it only writes data-visible, NC/src/aria/menu/menu.ts:65), so the panels keep
// Yeti's `popover` attribute and a bridge maps Aria's expanded state onto it; without
// the bridge every `[popover]` / `:popover-open` selector in Yeti's CSS would miss.
import { Component, Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
// /b2 sets liRole="none" on each li (the APG menubar markup); /b keeps Yeti's li.
import { RouterLink } from '@angular/router';
import { Menu, MenuBar, MenuItem, MenuTrigger } from '@angular/aria/menu';

interface Owner {
  expanded(): boolean | null;
  close(): void;
}

@Directive({
  selector: '[yetiMenuPopover]',
  host: { '(toggle)': 'onToggle($event)' },
})
export class YetiMenuPopover {
  readonly owner = input.required<Owner>({ alias: 'yetiMenuPopover' });
  readonly #el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // earlyRead, not write: Menu focuses its first item in its own write-phase
    // afterRenderEffect (NC/src/aria/menu/menu.ts:182-189), and a closed popover
    // cannot take focus, so the panel must be shown first. With write here,
    // keyboard opening left focus on the trigger (measured).
    afterRenderEffect({
      earlyRead: () => {
        const want = !!this.owner().expanded();
        const open = this.#el.matches(':popover-open');

        if (want && !open) {
          this.#el.showPopover();
        } else if (!want && open) {
          this.#el.hidePopover();
        }
      },
    });
  }

  // The platform closed it (light dismiss, Escape, popovertarget): tell Aria.
  onToggle(e: Event): void {
    if ((e as ToggleEvent).newState === 'closed' && this.owner().expanded()) {
      this.owner().close();
    }
  }
}

@Component({
  selector: 'app-demo-b',
  imports: [RouterLink, Menu, MenuBar, MenuItem, MenuTrigger, YetiMenuPopover],
  template: `
<nav class="nav" aria-label="Site">
	<a href="#" data-brand>Yeti</a>
	<button type="button" popovertarget="site-menu" aria-label="Menu"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
	<!-- role="list" removed: as a static attribute it wins over ngMenuBar's host role="menubar" (measured in the server HTML). -->
	<ul id="site-menu" popover ngMenuBar>
		<li [attr.role]="liRole()"><a href="#" aria-current="page" ngMenuItem value="docs">Docs</a></li>
		<li [attr.role]="liRole()"><a routerLink="." [queryParams]="{ p: 'blog' }" ngMenuItem value="blog">Blog</a></li>
		<li class="dropdown" [attr.role]="liRole()">
			<button type="button" popovertarget="more-menu" ngMenuItem value="more" [submenu]="more" #moreItem="ngMenuItem">More</button>
			<div id="more-menu" popover ngMenu #more="ngMenu" [yetiMenuPopover]="moreItem">
				<a routerLink="." [queryParams]="{ p: 'guides' }" ngMenuItem value="guides">Guides</a>
				<a href="#" ngMenuItem value="components">Components</a>
				<a href="#" ngMenuItem value="changelog">Changelog</a>
			</div>
		</li>
		<li [attr.role]="liRole()"><a href="#" ngMenuItem value="about">About</a></li>
	</ul>
	<div data-actions><a class="button" href="#" data-size="sm">Get started</a></div>
</nav>
<div class="dropdown">
	<button class="button" type="button" popovertarget="account-menu" data-emphasis="medium" ngMenuTrigger [menu]="account" #accountTrigger="ngMenuTrigger">Account</button>
	<div id="account-menu" popover ngMenu #account="ngMenu" [yetiMenuPopover]="accountTrigger">
		<a routerLink="." [queryParams]="{ p: 'profile' }" ngMenuItem value="profile">Profile</a>
		<a href="#" ngMenuItem value="settings">Settings</a>
		<button type="button" ngMenuItem value="signout">Sign out</button>
	</div>
</div>
<div class="dropdown" data-trigger="hover">
	<button class="button" type="button" popovertarget="products" data-emphasis="low" ngMenuTrigger [menu]="products" #productsTrigger="ngMenuTrigger">Products</button>
	<div id="products" popover ngMenu #products="ngMenu" [yetiMenuPopover]="productsTrigger">
		<a href="#" ngMenuItem value="overview">Overview</a>
		<a href="#" ngMenuItem value="pricing">Pricing</a>
	</div>
</div>
<p><a href="#">After</a></p>
`,
})
export class DemoB {
  readonly liRole = input<string | null>(null);
}
