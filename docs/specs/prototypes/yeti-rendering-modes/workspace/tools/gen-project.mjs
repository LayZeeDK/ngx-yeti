// PROTOTYPE: adds one production build configuration per rendering mode to project.json.
import { readFileSync, writeFileSync } from 'node:fs';

const p = JSON.parse(readFileSync('project.json', 'utf8'));
const b = p.targets.build;
b.options.polyfills = ['@angular/localize/init'];
b.options.assets = [
  { glob: '**/*', input: 'public' },
  { glob: 'yeti.js', input: 'node_modules/yeti-css/dist', output: 'yeti' },
];
p.i18n = { sourceLocale: 'en-US', locales: { da: 'src/locale/messages.da.xlf' } };

const prod = b.configurations.production;
const rep = (m) => (m === 'plain' ? [] : [{ replace: 'src/app/mode/providers.ts', with: `src/app/mode/providers.${m}.ts` }]);
const modes = {
  none: { file: 'none' },
  plain: { file: 'plain' },
  noreplay: { file: 'noreplay' },
  replay: { file: 'replay' },
  explicit: { file: 'explicit' },
  zone: { file: 'zone', polyfills: ['zone.js', '@angular/localize/init'] },
  'i18n-off': { file: 'plain', localize: ['da'] },
  'i18n-on': { file: 'i18n', localize: ['da'] },
};
for (const [name, m] of Object.entries(modes)) {
  b.configurations[name] = {
    ...prod,
    outputPath: `dist/${name}`,
    fileReplacements: rep(m.file),
    ...(m.polyfills ? { polyfills: m.polyfills } : {}),
    ...(m.localize ? { localize: m.localize } : {}),
  };
}
p.targets['extract-i18n'] = {
  executor: '@angular/build:extract-i18n',
  options: { buildTarget: 'ws:build:production', outputPath: 'src/locale' },
};
writeFileSync('project.json', JSON.stringify(p, null, 2) + '\n');
console.log(Object.keys(b.configurations).join(' '));
