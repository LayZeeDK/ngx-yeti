// PROTOTYPE (ticket 30, point 1): the package's directives hosting Angular Aria's
// Toolbar and Tabs, so the server HTML has one Tab stop and no inert panel, and
// Aria's own values take over once Aria has set its active item in the browser.
// Public Aria API only: active(), selected(), visible(), and host-directive inputs.
import { booleanAttribute, computed, contentChildren, Directive, inject, input, model } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';
import { Tab, TabList, TabPanel, Tabs } from '@angular/aria/tabs';

// ---------------------------------------------------------------- buttons

@Directive({
  selector: '[yetiButtons]',
  hostDirectives: [{ directive: Toolbar, inputs: ['orientation', 'wrap', 'softDisabled', 'disabled'] }],
  host: {
    // A binding, not a static attribute: it runs after the consumer's static
    // role="group" is created, so it overwrites it, on the server too.
    '[attr.role]': '"toolbar"',
  },
})
export class YetiButtons {
  readonly buttons = contentChildren(YetiButton, { descendants: true });
  // Aria's activeItem is private; "some widget is active" is the public sign
  // that Aria's afterRenderEffect has run (toolbar.ts:103), so only then hand over.
  readonly ariaLive = computed(() => this.buttons().some((b) => b.widget.active()));
}

@Directive({
  selector: '[yetiButton]',
  hostDirectives: [{ directive: ToolbarWidget, inputs: ['disabled: busy'] }],
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '[attr.aria-pressed]': 'pressed() ?? null',
    '(click)': 'toggle()',
  },
})
export class YetiButton {
  readonly widget = inject(ToolbarWidget);
  readonly #group = inject(YetiButtons);
  // Same public name as the aliased ToolbarWidget input: one [busy] sets both.
  readonly busy = input(false, { transform: booleanAttribute });
  readonly pressed = model<boolean | undefined>(undefined);

  protected readonly tabIndex = computed(() => {
    if (this.#group.ariaLive()) {
      return this.widget.active() ? 0 : -1;
    }

    return this.#group.buttons()[0] === this ? 0 : -1;
  });

  toggle() {
    const p = this.pressed();

    if (p !== undefined) {
      this.pressed.set(!p);
    }
  }
}

// ---------------------------------------------------------------- tabs

@Directive({ selector: '[yetiTabs]', hostDirectives: [Tabs] })
export class YetiTabs {
  readonly tabs = contentChildren(YetiTab, { descendants: true });
  readonly ariaLive = computed(() => this.tabs().some((t) => t.tab.active()));
  /** The server's one Tab stop: the selected tab, else the first. */
  readonly serverStop = computed(() => this.tabs().find((t) => t.tab.selected()) ?? this.tabs()[0]);
}

@Directive({
  selector: '[yetiTabList]',
  hostDirectives: [
    {
      directive: TabList,
      inputs: ['selectedTab', 'orientation', 'wrap', 'selectionMode', 'disabled'],
      outputs: ['selectedTabChange'],
    },
  ],
})
export class YetiTabList {}

@Directive({
  selector: '[yetiTab]',
  hostDirectives: [{ directive: Tab, inputs: ['value', 'id', 'disabled'] }],
  host: { '[attr.tabindex]': 'tabIndex()' },
})
export class YetiTab {
  readonly tab = inject(Tab);
  readonly #tabs = inject(YetiTabs);

  protected readonly tabIndex = computed(() => {
    if (this.#tabs.ariaLive()) {
      return this.tab.active() ? 0 : -1;
    }

    return this.#tabs.serverStop() === this ? 0 : -1;
  });
}

/** Yeti's tabs panel: no inert and no hidden until Aria is live; then inert plus hidden, as tabs.js hides. */
@Directive({
  selector: '[yetiTabPanel]',
  hostDirectives: [{ directive: TabPanel, inputs: ['value', 'id'] }],
  host: {
    '[attr.inert]': 'off() ? true : null',
    '[attr.hidden]': 'off() ? "" : null',
  },
})
export class YetiTabPanel {
  readonly #panel = inject(TabPanel);
  readonly #tabs = inject(YetiTabs);
  protected readonly off = computed(() => this.#tabs.ariaLive() && !this.#panel.visible());
}

/** The carousel's slide: never inert in server HTML (ADR 0024 point 1); Aria's inert once live. Never hidden. */
@Directive({
  selector: '[yetiCarouselSlide]',
  hostDirectives: [{ directive: TabPanel, inputs: ['value', 'id'] }],
  host: { '[attr.inert]': 'off() ? true : null' },
})
export class YetiCarouselSlide {
  readonly #panel = inject(TabPanel);
  readonly #tabs = inject(YetiTabs);
  protected readonly off = computed(() => this.#tabs.ariaLive() && !this.#panel.visible());
}

export const YETI_ROVING = [YetiButtons, YetiButton, YetiTabs, YetiTabList, YetiTab, YetiTabPanel, YetiCarouselSlide];
