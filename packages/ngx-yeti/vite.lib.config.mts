// Experimental alternative to ng-packagr: fastCompile JavaScript plus typings
// from ngc with the unsupported `_experimentalAllowEmitDeclarationOnly` flag.
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import {
  exitCodeFromResult,
  formatDiagnostics,
  performCompilation,
  readConfiguration,
} from '@angular/compiler-cli';
import { rolldown } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = import.meta.dirname;
const tsconfig = join(projectRoot, 'tsconfig.lib.prod.json');

/** ng-packagr's rule: a bare specifier is a dependency and is never bundled. */
const isExternal = (id: string): boolean =>
  !/^[./\0]/.test(id) && !isAbsolute(id);

interface EntryPoint {
  /** ng-packagr's flat name: `ngx-yeti`, `ngx-yeti-<folder>`. */
  readonly name: string;
  /** The key in the package's `exports` map. */
  readonly subpath: string;
  /** The entry file, relative to the project root. */
  readonly entryFile: string;
}

/**
 * The primary entry point plus every folder one level below the project root
 * that holds an `ng-package.json`, so a new entry point needs no edit here.
 * ng-packagr searches every depth; this package has one entry per item folder.
 */
const entryPoints: readonly EntryPoint[] = [
  { name: 'ngx-yeti', subpath: '.', entryFile: entryFileOf('.') },
  ...readdirSync(projectRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(projectRoot, entry.name, 'ng-package.json')),
    )
    .map(({ name }) => ({
      name: `ngx-yeti-${name}`,
      subpath: `./${name}`,
      entryFile: join(name, entryFileOf(name)).replaceAll('\\', '/'),
    })),
];

const fesmFile = (name: string): string => `fesm2022/${name}.mjs`;
const typingsFile = (name: string): string => `types/${name}.d.ts`;

export default defineConfig(({ mode }) => ({
  root: projectRoot,
  // In production mode Analog defines `ngDevMode`, `ngJitMode` and
  // `ngServerMode`. A library leaves them to the consuming application.
  mode: 'development',
  publicDir: false,
  plugins: [
    angular({ tsconfig, fastCompile: true, fastCompileMode: 'partial' }),
    // `--mode js` compiles the JavaScript only, for a compile check that runs
    // beside `nx typecheck`.
    ...(mode === 'js' ? [] : [angularPackage()]),
  ],
  build: {
    outDir: join(projectRoot, '../../dist/fast/packages/ngx-yeti'),
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    reportCompressedSize: false,
    lib: {
      entry: Object.fromEntries(
        entryPoints.map(({ name, entryFile }) => [name, entryFile]),
      ),
      formats: ['es'],
      fileName: (_format, name) => fesmFile(name),
    },
    rolldownOptions: {
      external: isExternal,
      // fastCompile marks `ɵɵngDeclareClassMetadata(...)` statements pure;
      // honouring that drops the class metadata ng-packagr keeps.
      treeshake: { annotations: false },
      experimental: { attachDebugInfo: 'none' },
    },
  },
}));

/** An entry point's `lib.entryFile`, relative to its folder. */
function entryFileOf(folder: string): string {
  const lib = readJson(join(projectRoot, folder, 'ng-package.json'))['lib'];
  const entryFile = isRecord(lib) ? lib['entryFile'] : undefined;

  return typeof entryFile === 'string' ? entryFile : 'src/index.ts';
}

/** Emits the rest of the package beside the FESMs: typings, manifest, docs. */
function angularPackage(): Plugin {
  return {
    name: 'ngx-yeti:angular-package',
    async generateBundle() {
      for (const [name, source] of await bundleTypings()) {
        this.emitFile({ type: 'asset', fileName: typingsFile(name), source });
      }

      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: packageManifest(),
      });

      const secondaries = entryPoints
        .filter(({ subpath }) => subpath !== '.')
        .map((entry) => ({ ...entry, folder: entry.subpath.slice(2) }));

      // ng-packagr's development-only stub per secondary entry point, and
      // the .npmignore that keeps the stubs out of the tarball.
      for (const { name, folder } of secondaries) {
        this.emitFile({
          type: 'asset',
          fileName: `${folder}/package.json`,
          source: JSON.stringify(
            {
              module: `../${fesmFile(name)}`,
              typings: `../${typingsFile(name)}`,
            },
            undefined,
            2,
          ),
        });
      }

      this.emitFile({
        type: 'asset',
        fileName: '.npmignore',
        source: [
          "# Nested package.json's are only needed for development.",
          ...secondaries.map(({ folder }) => `${folder}/package.json`),
        ].join('\n'),
      });

      // ponytail: `assets` entries are taken as plain file paths; ng-packagr's
      // glob and object forms need handling once ng-package.json uses them.
      const assets = readJson(join(projectRoot, 'ng-package.json'))['assets'];

      for (const fileName of [
        'README.md',
        'LICENSE',
        ...secondaries.map(({ folder }) => `${folder}/README.md`),
        ...(Array.isArray(assets)
          ? assets.filter((a) => typeof a === 'string')
          : []),
      ]) {
        const path = join(projectRoot, fileName);

        if (existsSync(path)) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: readFileSync(path),
          });
        }
      }
    },
  };
}

/**
 * Declaration-only ngc forces local compilation mode: per-file `.d.ts` with
 * Ivy `ɵcmp`/`ɵdir` types. They go to a throwaway directory and come back as
 * one flat file per entry point.
 */
async function bundleTypings(): Promise<Map<string, string>> {
  const declarationDir = mkdtempSync(join(tmpdir(), 'ngx-yeti-dts-'));

  try {
    const { rootNames, options } = readConfiguration(tsconfig);
    const { diagnostics } = performCompilation({
      rootNames,
      options: {
        ...options,
        rootDir: projectRoot,
        outDir: declarationDir,
        declaration: true,
        declarationMap: false,
        emitDeclarationOnly: true,
        _experimentalAllowEmitDeclarationOnly: true,
      },
    });

    if (exitCodeFromResult(diagnostics) !== 0) {
      throw new Error(formatDiagnostics(diagnostics));
    }

    const typings = new Map<string, string>();

    for (const { name, entryFile } of entryPoints) {
      const bundle = await rolldown({
        input: join(declarationDir, entryFile.replace(/\.ts$/, '.d.ts')),
        external: isExternal,
        plugins: [dts({ dtsInput: true, tsconfig: false })],
        experimental: { attachDebugInfo: 'none' },
      });
      const { output } = await bundle.generate({
        format: 'es',
        comments: { legal: true, annotation: false, jsdoc: true },
      });
      await bundle.close();
      typings.set(name, output[0].code);
    }

    return typings;
  } finally {
    rmSync(declarationDir, { recursive: true, force: true });
  }
}

/** ng-packagr's manifest for the entry points compiled in partial mode. */
function packageManifest(): string {
  const source = readJson(join(projectRoot, 'package.json'));
  const angularCompiler = readJson(
    new URL(import.meta.resolve('@angular/compiler/package.json')),
  );
  const sourceExports = source['exports'];

  return JSON.stringify(
    {
      ...source,
      module: fesmFile('ngx-yeti'),
      typings: typingsFile('ngx-yeti'),
      exports: {
        ...(isRecord(sourceExports) ? sourceExports : {}),
        './package.json': { default: './package.json' },
        ...Object.fromEntries(
          entryPoints.map(({ name, subpath }) => [
            subpath,
            { types: `./${typingsFile(name)}`, default: `./${fesmFile(name)}` },
          ]),
        ),
      },
      sideEffects: source['sideEffects'] ?? false,
      type: 'module',
      dependencies: {
        ...(isRecord(source['dependencies']) ? source['dependencies'] : {}),
        tslib: isRecord(angularCompiler['dependencies'])
          ? angularCompiler['dependencies']['tslib']
          : undefined,
      },
    },
    undefined,
    2,
  );
}

function readJson(path: string | URL): Record<string, unknown> {
  const json: unknown = JSON.parse(readFileSync(path, 'utf8'));

  if (!isRecord(json)) {
    throw new Error(`Expected a JSON object in ${String(path)}`);
  }

  return json;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
