// Packs the built package and builds a consumer against the tarball (setup
// spec section 4 E; INTENT SC3). Run it through `npx nx pack-check ngx-yeti`,
// which builds the package first. It never publishes: the user runs
// `npm publish`.
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = path.join(import.meta.dirname, '../..');
const builtPackage = path.join(workspaceRoot, 'dist/packages/ngx-yeti');
const fixtureDir = path.join(import.meta.dirname, 'consumer');
const workDir = path.join(workspaceRoot, 'tmp/pack-check');
const consumerDir = path.join(workDir, 'consumer');
const installed = path.join(consumerDir, 'node_modules/ngx-yeti');
const ngc = path.join(
  workspaceRoot,
  'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
);
const yetiCommit = readFileSync(
  path.join(workspaceRoot, 'vendor/yeti/COMMIT'),
  'utf8',
).trim();
const yetiVersion = JSON.parse(
  readFileSync(path.join(workspaceRoot, 'vendor/yeti/package.json'), 'utf8'),
).version;

// ADR 0017's 2026-10-02 notes: 0.<Angular major><Angular minor, 2 digits>
// <breaking counter, 2 digits>.<patch>-yeti.<Yeti version>.g<SHA>
const versionFormat =
  /^0\.[1-9]\d*\d{2}\d{2}\.(?:0|[1-9]\d*)-yeti\.(?<yeti>.+)\.g(?<sha>[0-9a-f]{7,40})$/;

function check(ok, claim, detail = '') {
  if (!ok) {
    console.error(`pack-check failed: ${claim}`);

    if (detail) {
      console.error(detail);
    }

    process.exit(1);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });

  return {
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
  };
}

function isInside(file, folder) {
  const relative = path.relative(folder, file);

  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
}

// 1. Pack the built package into the git-ignored tmp folder.
rmSync(workDir, { recursive: true, force: true });
mkdirSync(installed, { recursive: true });

// npm is a .cmd script on Windows, which Node runs only through a shell.
const pack = spawnSync(
  `npm pack --json --pack-destination "${workDir}" "${builtPackage}"`,
  { cwd: workDir, encoding: 'utf8', shell: true },
);
check(pack.status === 0, 'npm pack ran', pack.stderr);
const [{ filename: tarball }] = JSON.parse(pack.stdout);

// 2. Extract the tarball as the consumer's installed `ngx-yeti`. Angular and
// tslib resolve from the workspace's node_modules further up.
const extract = run(
  'tar',
  [
    '-xzf',
    `../${tarball}`,
    '-C',
    'node_modules/ngx-yeti',
    '--strip-components=1',
  ],
  consumerDir,
);
check(extract.status === 0, 'the tarball extracted', extract.output);

for (const file of ['consumer.ts', 'tsconfig.json', 'styles.css']) {
  copyFileSync(path.join(fixtureDir, file), path.join(consumerDir, file));
}

// 3. Every specifier resolves through the tarball's own exports.
const consumerRequire = createRequire(path.join(consumerDir, 'consumer.ts'));

for (const specifier of [
  'ngx-yeti',
  'ngx-yeti/card',
  'ngx-yeti/lift',
  'ngx-yeti/styles',
]) {
  let resolved = '';

  try {
    resolved = consumerRequire.resolve(specifier);
  } catch (error) {
    check(
      false,
      `${specifier} resolves through the tarball exports`,
      String(error),
    );
  }

  check(
    isInside(resolved, installed),
    `${specifier} resolves into the tarball`,
    resolved,
  );
}

// 4. The consumer compiles with the Angular compiler under strictTemplates.
const compile = run(
  process.execPath,
  [ngc, '-p', 'tsconfig.json'],
  consumerDir,
);
check(
  compile.status === 0,
  'the consumer compiles against the tarball under strictTemplates',
  compile.output,
);

// 5. The typed inputs are not `any`: an unknown threshold fails to compile.
writeFileSync(
  path.join(consumerDir, 'probe.ts'),
  `import { Component } from '@angular/core';
import { YetiCard } from 'ngx-yeti/card';

@Component({
  selector: 'app-probe',
  imports: [YetiCard],
  template: '<article yetiCard threshold="medium"></article>',
})
export class Probe {}
`,
);
writeFileSync(
  path.join(consumerDir, 'tsconfig.probe.json'),
  JSON.stringify({ extends: './tsconfig.json', files: ['probe.ts'] }),
);
const probe = run(
  process.execPath,
  [ngc, '-p', 'tsconfig.probe.json'],
  consumerDir,
);
check(
  probe.status !== 0 &&
    probe.output.includes('"medium"') &&
    probe.output.includes('YetiWidth'),
  'threshold="medium" fails to compile against YetiWidth',
  probe.output,
);

// 6. The global stylesheet's last line resolves through the exports map.
const stylesheetLines = readFileSync(
  path.join(consumerDir, 'styles.css'),
  'utf8',
)
  .trim()
  .split('\n');
const lastImport = /^@import '(?<specifier>[^']+)';$/.exec(
  stylesheetLines.at(-1) ?? '',
)?.groups?.specifier;
check(
  lastImport === 'ngx-yeti/accessibility.css',
  "styles.css ends with @import 'ngx-yeti/accessibility.css'",
);
let stylesheet = '';

try {
  stylesheet = consumerRequire.resolve(lastImport);
} catch (error) {
  check(
    false,
    `${lastImport} resolves through the tarball exports`,
    String(error),
  );
}

check(
  stylesheet === path.join(installed, 'accessibility.css'),
  `${lastImport} resolves to the tarball's accessibility.css`,
  stylesheet,
);

// 7. The primary entry point exports types only.
const primary = await import(
  pathToFileURL(consumerRequire.resolve('ngx-yeti')).href
);
check(
  Object.keys(primary).length === 0,
  'the primary entry point has no runtime export',
  Object.keys(primary).join(', '),
);

// 8. No published declaration imports yeti-css: `from`, `import()`, `import
// '...'`, or a types reference. Doc comments may name the default URL.
const yetiImport =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\breference\s+types\s*=\s*)["']yeti-css(?:\/[^"']*)?["']/;
const yetiImports = readdirSync(installed, {
  recursive: true,
  encoding: 'utf8',
})
  .filter((file) => file.endsWith('.d.ts'))
  .filter((file) =>
    yetiImport.test(readFileSync(path.join(installed, file), 'utf8')),
  );
check(
  yetiImports.length === 0,
  'no published .d.ts imports yeti-css',
  yetiImports.join('\n'),
);

// 9. The packed package.json declares no yeti-css and carries the version.
const manifest = JSON.parse(
  readFileSync(path.join(installed, 'package.json'), 'utf8'),
);
const yetiFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'optionalDependencies',
  'bundleDependencies',
  'bundledDependencies',
].filter((field) => JSON.stringify(manifest[field] ?? {}).includes('yeti-css'));
check(
  yetiFields.length === 0,
  'package.json declares no yeti-css dependency or peer',
  yetiFields.join(', '),
);
const version = versionFormat.exec(manifest.version)?.groups;
check(
  version !== undefined,
  'the packed version matches the ADR 0017 format',
  manifest.version,
);
check(
  version.yeti === yetiVersion && yetiCommit.startsWith(version.sha),
  'the packed version names the vendored Yeti version and commit',
  manifest.version,
);

// 10. The shipped changelog names the full Yeti commit.
let changelog = '';

try {
  changelog = readFileSync(path.join(installed, 'CHANGELOG.md'), 'utf8');
} catch (error) {
  check(false, 'the tarball ships CHANGELOG.md', String(error));
}

check(
  changelog.includes(yetiCommit),
  `the shipped CHANGELOG.md names ${yetiCommit}`,
);

console.log(tarball);
