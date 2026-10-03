// PROTOTYPE: writes src/styles.css as Yeti's own @import list, minus badge.css,
// which the leave-guard test loads through a component styleUrl instead.
import { readFileSync, writeFileSync } from 'node:fs';

const list = readFileSync('node_modules/yeti-css/dist/css/yeti.css', 'utf8');
const imports = [...list.matchAll(/@import "([^"]+)";/g)].map((m) => m[1]);
const kept = imports.filter((p) => p !== 'components/badge/badge.css');
const out = [
  '/* PROTOTYPE (ticket 18): Yeti f52d1e8b9 in its own order, every file but badge.css. */',
  ...kept.map((p) => `@import 'yeti-css/css/${p}';`),
  '',
  '/* Test-only classes for animate.leave (Yeti has no leave class of its own). */',
  '.t-leave-dialog { opacity: 0; translate: 0 1rem; }',
  '@keyframes t-fade-out { to { opacity: 0; } }',
  '.t-leave-anim { animation: t-fade-out 300ms ease forwards; }',
  '.spacer { block-size: 150vh; }',
  '',
].join('\n');
writeFileSync('src/styles.css', out);
console.log(`kept ${kept.length} of ${imports.length} imports`);
