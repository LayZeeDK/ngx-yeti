// PROTOTYPE (ticket 35): the package's directives, reduced to their ids.
// Aria-hosted: tabs (Tab, TabPanel) and buttons (Toolbar widgets), each giving Aria the package's ids
// through yetiAriaIds. Package-own: a label/labelled pair (aria-labelledby) and a trigger/panel pair
// (aria-controls), each id from injectYetiId() and each reference a host binding (ADR 0042 point 3).
import { Directive, input } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';
import { Tab, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { injectYetiId, yetiAriaIds } from './ids';

@Directive({ selector: '[yetiTabs]', hostDirectives: [Tabs] })
export class YetiTabs {}

@Directive({
  selector: '[yetiTabList]',
  hostDirectives: [{ directive: TabList, inputs: ['selectedTab'] }],
})
export class YetiTabList {}

@Directive({
  selector: '[yetiTab]',
  hostDirectives: [{ directive: Tab, inputs: ['value'] }],
  providers: [yetiAriaIds],
})
export class YetiTab {}

@Directive({
  selector: '[yetiTabPanel]',
  hostDirectives: [{ directive: TabPanel, inputs: ['value'] }],
  providers: [yetiAriaIds],
})
export class YetiTabPanel {}

@Directive({ selector: '[yetiButtons]', hostDirectives: [Toolbar], host: { '[attr.role]': '"toolbar"' } })
export class YetiButtons {}

@Directive({ selector: '[yetiButton]', hostDirectives: [ToolbarWidget], providers: [yetiAriaIds] })
export class YetiButton {}

@Directive({ selector: '[yetiLabel]', exportAs: 'yetiLabel', host: { '[attr.id]': 'id' } })
export class YetiLabel {
  readonly id = injectYetiId('label');
}

@Directive({ selector: '[yetiLabelled]', host: { '[attr.aria-labelledby]': 'by().id' } })
export class YetiLabelled {
  readonly by = input.required<YetiLabel>();
}

@Directive({ selector: '[yetiPanel]', exportAs: 'yetiPanel', host: { '[attr.id]': 'id' } })
export class YetiPanel {
  readonly id = injectYetiId('panel');
}

@Directive({
  selector: '[yetiTrigger]',
  host: { '[attr.aria-controls]': 'for().id', '[attr.aria-expanded]': '"false"' },
})
export class YetiTrigger {
  readonly for = input.required<YetiPanel>();
}

export const H35_ITEMS = [
  YetiTabs,
  YetiTabList,
  YetiTab,
  YetiTabPanel,
  YetiButtons,
  YetiButton,
  YetiLabel,
  YetiLabelled,
  YetiPanel,
  YetiTrigger,
];

