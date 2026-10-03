// PROTOTYPE (ticket 20) candidate resolutions, switched on by ?fix=a,b in the first URL.
//   rerun          re-import tabs.js, toc.js, enter.js with a fresh query after each render
//   popover        on NavigationStart, hide open popovers and close open dialogs
//   fragment-hash  turn a click on href="#id" into location.hash = id (same document)
//   fragment-router turn a click on href="#id" into router.navigate([], { fragment })
import { afterNextRender, EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

const FIX = new Set((new URLSearchParams(location.search).get('fix') ?? '').split(',').filter(Boolean));
let run = 0;

export function rerunYeti(): Promise<unknown> {
  run++;
  const w = window as unknown as { __runs: number };
  w.__runs = run;

  return Promise.all(
    ['tabs', 'toc', 'enter'].map((name) => import(/* @vite-ignore */ new URL(`yeti/js/${name}.js?run=${run}`, document.baseURI).href)),
  );
}

export function installFixes(): void {
  const router = inject(Router);
  const injector = inject(EnvironmentInjector);
  (window as unknown as { __rerun: typeof rerunYeti }).__rerun = rerunYeti;

  if (FIX.has('rerun')) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        runInInjectionContext(injector, () => afterNextRender(() => void rerunYeti()));
      }
    });
  }

  if (FIX.has('popover')) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        for (const el of document.querySelectorAll<HTMLElement>(':popover-open')) {
          el.hidePopover();
        }

        for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) {
          dialog.close();
        }
      }
    });
  }

  const hash = FIX.has('fragment-hash');
  const viaRouter = FIX.has('fragment-router');

  if (hash || viaRouter) {
    // Bubble phase on document, registered after Yeti's modules, so carousel.js has
    // already taken (and prevented) its own dot clicks.
    document.addEventListener('click', (event) => {
      const a = (event.target as Element | null)?.closest?.('a[href^="#"]');

      if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      const id = a.getAttribute('href')!.slice(1);

      if (hash) {
        location.hash = id;
      } else {
        void router.navigate([], { fragment: id, queryParamsHandling: 'preserve' });
      }
    });
  }
}
