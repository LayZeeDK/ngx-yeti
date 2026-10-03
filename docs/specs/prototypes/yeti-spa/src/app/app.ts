// PROTOTYPE (ticket 20): app shell with a dropdown of routerLinks and a modal dialog
// that both outlive every route change.
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  template: `
    <header class="cluster">
      <div class="dropdown">
        <button class="button" type="button" popovertarget="site-menu" id="menu-btn">Menu</button>
        <div id="site-menu" popover>
          <a routerLink="/tabs" id="nav-tabs">Tabs</a>
          <a routerLink="/other" id="nav-other">Other</a>
          <a routerLink="/late" id="nav-late">Late</a>
          <a routerLink="/owned" id="nav-owned">Owned</a>
        </div>
      </div>
      <button class="button" type="button" commandfor="shell-dialog" command="show-modal" id="dlg-btn">Dialog</button>
    </header>
    <dialog class="dialog" id="shell-dialog" aria-labelledby="dlg-title">
      <h2 id="dlg-title">Go somewhere</h2>
      <a routerLink="/tabs" id="dlg-link">Tabs</a>
    </dialog>
    <main><router-outlet /></main>
  `,
})
export class App {}
