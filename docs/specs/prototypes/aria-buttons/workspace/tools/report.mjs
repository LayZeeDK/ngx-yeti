// Prints the per-engine results side by side, compactly.
import { readFileSync } from 'node:fs';
for (const e of ['chromium', 'firefox', 'webkit']) {
  const r = JSON.parse(readFileSync(`results/${e}.json`, 'utf8'));
  const out = {
    engine: `${e} ${r.version}`,
    styles: { actionA: r.styles.actionA, actionB: r.styles.actionB, toggleA: r.styles.toggleA, toggleB: r.styles.toggleB, hoverExport: r.styles.hoverExport, lift: r.styles.lift },
    axe: r.a11y.axe,
    tree: r.a11y.tree,
    tabOrder: r.a11y.tabOrder,
    kbB: r.a11y.kbB,
    kbBreturn: r.a11y.kbBreturn,
    toggleB: r.a11y.toggleB,
    kbA: r.a11y.kbA,
    aSpace: r.a11y.aSpace,
    afterClick: r.a11y.afterClick,
    jsOff: r.jsOff,
    beforeHydration: r.beforeHydration,
    hydrateNever: r.hydrateNever,
  };
  console.log(JSON.stringify(out, null, 1));
}
