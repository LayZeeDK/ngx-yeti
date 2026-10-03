// Which Yeti class names (and attribute names) are also Tailwind v4 utilities?
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../app/node_modules/@tailwindcss/node/dist/index.mjs';

const root = 'D:/tmp/ngx-yeti-24/yeti/dist/css';
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.css')) {
      files.push(p);
    }
  }
};
walk(root);

const classes = new Map();
const attrs = new Map();
for (const f of files) {
  const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rel = f.slice(root.length + 1).replace(/\\/g, '/');
  // selectors only: text before each '{'
  for (const m of text.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1];
    if (sel.trim().startsWith('@')) {
      continue;
    }
    for (const c of sel.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) {
      if (!classes.has(c[1])) {
        classes.set(c[1], new Set());
      }
      classes.get(c[1]).add(rel);
    }
    for (const a of sel.matchAll(/\[([a-zA-Z][\w-]*)/g)) {
      if (!attrs.has(a[1])) {
        attrs.set(a[1], new Set());
      }
      attrs.get(a[1]).add(rel);
    }
  }
}

const fresh = () => compile('@import "tailwindcss";', { base: 'D:/tmp/ngx-yeti-24/app', onDependency: () => {} });
const empty = (await fresh()).build([]);
const out = [];
for (const [c, where] of [...classes].sort()) {
  const css = (await fresh()).build([c]);
  const m = css.match(/@layer utilities \{([\s\S]*?)\n\}/);
  if (m && m[1].trim()) {
    out.push({ name: c, yeti: [...where], tailwind: m[1].trim().replace(/\s+/g, ' ') });
  }
}
// attribute names that are also utility candidates (e.g. hidden)
const attrHits = [];
for (const [a, where] of [...attrs].sort()) {
  const css = (await fresh()).build([a]);
  const m = css.match(/@layer utilities \{([\s\S]*?)\n\}/);
  if (m && m[1].trim()) {
    attrHits.push({ name: a, yeti: [...where], tailwind: m[1].trim().replace(/\s+/g, ' ') });
  }
}
const result = {
  yetiClassCount: classes.size,
  yetiAttrCount: attrs.size,
  classCollisions: out,
  attrCollisions: attrHits,
  attrs: [...attrs.keys()].sort(),
};
writeFileSync('D:/tmp/ngx-yeti-24/measure/collisions.json', JSON.stringify(result, null, 2));
console.log('yeti classes', classes.size, 'attrs', attrs.size);
for (const o of out) {
  console.log('CLASS', o.name, '|', o.yeti.join(','), '|', o.tailwind.slice(0, 120));
}
for (const o of attrHits) {
  console.log('ATTR', o.name, '|', o.yeti.join(','), '|', o.tailwind.slice(0, 120));
}
