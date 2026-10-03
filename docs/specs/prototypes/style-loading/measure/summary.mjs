import fs from 'node:fs';
const out = JSON.parse(fs.readFileSync(`D:/tmp/ngx-yeti-13/measure/probe-${process.env.CSS_DELAY ?? 300}.json`, 'utf8'));
const rows = {
  'JS off: eager card padding': (r) => r.jsOff.eagerPad,
  'JS off: hydrate-never badge padding': (r) => r.jsOff.neverBadgePad,
  'JS off: plain .card padding (card link present)': (r) => r.jsOff.plainCardPad,
  'JS off: part links in head': (r) => r.jsOff.links.join(','),
  'Hydration: style/link mutations after DOMContentLoaded': (r) => r.hydration.styleMutationsAfterDcl.map((m) => `${m.type} ${m.node}`).join('; ') || 'none',
  'Hydration: eager card unstyled frames / styled frames': (r) => `${r.hydration.eagerUnstyledFrames} / ${r.hydration.eagerStyledFrames}`,
  'Hydration: hydrate-never badge unstyled frames': (r) => r.hydration.neverBadgeUnstyledFrames,
  'Hydration: card vs full Yeti (differing elements)': (r) => r.hydration.cardVsFullYeti,
  'Hydration: badge vs full Yeti': (r) => r.hydration.badgeVsFullYeti,
  'Hydration: sheet order': (r) => r.hydration.sheets.map((s) => s.split(':')[0]).join(' > '),
  'Leave (L3 listener on page): card present, padding, opacity at 150 ms': (r) => `${r.leave.duringLeave.eagerPresent}, ${r.leave.duringLeave.eagerPad}, ${r.leave.duringLeave.eagerOpacity}`,
  'Leave: links at 150 ms': (r) => r.leave.duringLeave.links.join(','),
  'Leave: unstyled frames while leaving': (r) => r.leave.afterLeave.unstyledFramesWhileLeaving,
  'After leave: card present, links, plain .card padding': (r) => `${r.leave.afterLeave.eagerPresent}, [${r.leave.afterLeave.links.join(',')}], ${r.leave.afterLeave.plainCardPad}`,
  'Reload: links, card vs full Yeti, unstyled frames on reload': (r) => `[${r.reload.links.join(',')}], ${r.reload.cardVsFullYeti}, ${r.reload.unstyledFramesOnReload}`,
  'Reload: part link order': (r) => r.reload.sheets.filter((s) => s.includes('[')).map((s) => s.split(':')[0]).join(' > '),
  'Hold: eager badge hidden -> links, never badge pad, hoi badge pad': (r) => `[${r.hold.afterEagerBadgeHidden.links.join(',')}], ${r.hold.afterEagerBadgeHidden.neverBadgePad}, ${r.hold.afterEagerBadgeHidden.hoiBadgePad}`,
  'Hold: hoi block hydrated -> links, hoi badge pad': (r) => `[${r.hold.afterHoiHydrated.links.join(',')}], ${r.hold.afterHoiHydrated.hoiBadgePad}`,
  'Hold: eager badge shown again -> links, pad': (r) => `[${r.hold.afterEagerBadgeShown.links.join(',')}], ${r.hold.afterEagerBadgeShown.eagerBadgePad}`,
  'Tie: stack inserted after center -> link order': (r) => r.tie.sheetsOrder.map((s) => s.split(':')[0]).join(' > '),
  'Tie: center-in-stack margin-left (probe / full Yeti)': (r) => `${r.tie.centerInStackMarginLeft} / ${r.tie.referenceMarginLeft}`,
  'Client-only @defer, CSS delayed 300 ms: unstyled / styled frames': (r) => `${r.clientDefer.unstyledFrames} / ${r.clientDefer.styledFrames}`,
  'Client-only @defer with preload list: preloads, unstyled / styled frames': (r) => `[${r.clientDeferWithPreload.preloadLinks.join(',')}], ${r.clientDeferWithPreload.unstyledFrames} / ${r.clientDeferWithPreload.styledFrames}`,
};
const engines = Object.keys(out.engines);
console.log(`| Measurement | ${engines.join(' | ')} |`);
console.log(`| --- | ${engines.map(() => '---').join(' | ')} |`);
for (const [label, fn] of Object.entries(rows)) {
  const vals = engines.map((e) => String(fn(out.engines[e])));
  const same = vals.every((v) => v === vals[0]);
  console.log(`| ${label} | ${vals.join(' | ')} |${same ? '' : '  <-- engines differ'}`);
}
console.log('\nServer:');
console.log(JSON.stringify(out.server, null, 1));
