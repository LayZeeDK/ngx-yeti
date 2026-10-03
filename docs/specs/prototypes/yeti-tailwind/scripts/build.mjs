// Builds one production bundle per stylesheet configuration into app/dist/<config>.
import { writeFileSync, mkdirSync, rmSync, renameSync } from 'node:fs';
import { execSync } from 'node:child_process';

const app = 'D:/tmp/ngx-yeti-24/app';
const y = (p) => `@import 'yeti-css/css/${p}';`;
const always = [
  'layers.css',
  ...['scale', 'space', 'type', 'color', 'tone', 'motion', 'surface', 'components'].map((t) => `tokens/${t}.css`),
  ...['reset', 'typography', 'prose', 'controls', 'media', 'transitions'].map((b) => `base/${b}.css`),
  'layouts/attributes.css',
].map(y).join('\n');
const eagerParts = [
  'layouts/stack/stack.css',
  'layouts/cluster/cluster.css',
  'layouts/grid/grid.css',
  'layouts/box/box.css',
  'layouts/center/center.css',
  'layouts/container/container.css',
  'components/button/button.css',
  'components/badge/badge.css',
  'components/table/table.css',
  'components/alert/alert.css',
].map(y).join('\n');
const cardPart = y('components/card/card.css');
const tw = `@import 'tailwindcss';`;

export const configs = {
  // each library alone
  Y: { styles: always, yeti: true },
  // Yeti alone with no PostCSS configuration at all (Tailwind plugin not run)
  Y0: { styles: always, yeti: true, noPostcss: true },
  T: { styles: tw, yeti: false },
  // Tailwind first, as `ng add tailwindcss` leaves styles.css, Yeti appended after
  TY: { styles: `${tw}\n${always}`, yeti: true },
  // Yeti first, Tailwind after
  YT: { styles: `${always}\n${tw}`, yeti: true },
  // one shared statement: Tailwind's preflight below Yeti, its utilities above
  S1: { styles: `@layer theme, base, yeti, components, utilities;\n${tw}\n${always}`, yeti: true },
  // S1, and Tailwind told not to generate its container utility from the Yeti class name
  S1n: { styles: `@layer theme, base, yeti, components, utilities;
${tw}
@source not inline('container');
${always}`, yeti: true },
  // no preflight: Tailwind's documented split imports, Yeti between theme and utilities
  S3: {
    styles: `@layer theme, yeti, utilities;\n@import 'tailwindcss/theme.css' layer(theme);\n@import 'tailwindcss/utilities.css' layer(utilities);\n${always}`,
    yeti: true,
  },
  // S3, and the container utility excluded
  S3n: {
    styles: `@layer theme, yeti, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@source not inline('container');
${always}`,
    yeti: true,
  },
};

const only = process.argv.slice(2);
for (const [name, c] of Object.entries(configs)) {
  if (only.length && !only.includes(name)) {
    continue;
  }
  writeFileSync(`${app}/src/styles.css`, `/* PROTOTYPE config ${name} */\n${c.styles}\n`);
  mkdirSync(`${app}/src/app/parts`, { recursive: true });
  writeFileSync(`${app}/src/app/parts/eager.css`, c.yeti ? `${eagerParts}\n` : '/* no Yeti */\n');
  writeFileSync(`${app}/src/app/parts/card.css`, c.yeti ? `${cardPart}\n` : '/* no Yeti */\n');
  if (c.noPostcss) {
    renameSync(`${app}/.postcssrc.json`, `${app}/.postcssrc.json.off`);
  }
  rmSync(`${app}/dist/${name}`, { recursive: true, force: true });
  console.log(`== build ${name}`);
  execSync(`npx ng build --output-path dist/${name}`, { cwd: app, stdio: 'inherit', env: { ...process.env, CLAUDECODE: '' } });
  if (c.noPostcss) {
    renameSync(`${app}/.postcssrc.json.off`, `${app}/.postcssrc.json`);
  }
}
