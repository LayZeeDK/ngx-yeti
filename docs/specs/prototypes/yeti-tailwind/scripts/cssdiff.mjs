// Compare the CSS that Y0 (no PostCSS) and Y (PostCSS with @tailwindcss/postcss) ship.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dist = 'D:/tmp/ngx-yeti-24/app/dist';
const files = (c) => readdirSync(`${dist}/${c}/browser`).filter((f) => /\.(js|css)$/.test(f));
const read = (c, f) => readFileSync(`${dist}/${c}/browser/${f}`, 'utf8');
// pull CSS strings out of JS chunks: Angular emits styles: ["..."] or `...`
const cssOf = (c) => {
  const out = {};
  for (const f of files(c)) {
    const t = read(c, f);
    if (f.endsWith('.css')) {
      out.global = t;
    } else {
      const m = [...t.matchAll(/@layer yeti\.[\s\S]*?(?=["`],?\s*\]|["`]\])/g)].map((x) => x[0]);
      if (m.length) {
        out[f.startsWith('main') ? 'eager' : 'lazy'] = m.join('\n');
      }
    }
  }
  return out;
};
const a = cssOf('Y0');
const b = cssOf('Y');
const split = (s) => s.split(/(?<=[}])/);
const report = {};
for (const k of Object.keys(a)) {
  const sa = new Set(split(a[k]));
  const sb = new Set(split(b[k] ?? ''));
  report[k] = {
    y0Length: a[k].length,
    yLength: (b[k] ?? '').length,
    onlyInY0: [...sa].filter((x) => !sb.has(x)).slice(0, 15),
    onlyInY: [...sb].filter((x) => !sa.has(x)).slice(0, 15),
  };
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/cssdiff.json', JSON.stringify(report, null, 2));
for (const [k, v] of Object.entries(report)) {
  console.log(`== ${k}: Y0 ${v.y0Length} chars, Y ${v.yLength} chars`);
  console.log('only in Y0:', v.onlyInY0.map((x) => x.slice(0, 160)));
  console.log('only in Y:', v.onlyInY.map((x) => x.slice(0, 160)));
}
