// Experimental alternative to ng-packagr: fastCompile JavaScript plus typings
// from ngc with the unsupported `_experimentalAllowEmitDeclarationOnly` flag.
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
const fesmFile = 'fesm2022/ngx-yeti.mjs';
const typingsFile = 'types/ngx-yeti.d.ts';

/** ng-packagr's rule: a bare specifier is a dependency and is never bundled. */
const isExternal = (id: string): boolean =>
  !/^[./\0]/.test(id) && !isAbsolute(id);

export default defineConfig({
  root: projectRoot,
  // In production mode Analog defines `ngDevMode`, `ngJitMode` and
  // `ngServerMode`. A library leaves them to the consuming application.
  mode: 'development',
  publicDir: false,
  plugins: [
    angular({ tsconfig, fastCompile: true, fastCompileMode: 'partial' }),
    angularPackage(),
  ],
  build: {
    outDir: join(projectRoot, '../../dist/fast/packages/ngx-yeti'),
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    reportCompressedSize: false,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => fesmFile },
    rolldownOptions: {
      external: isExternal,
      // fastCompile marks `ɵɵngDeclareClassMetadata(...)` statements pure;
      // honouring that drops the class metadata ng-packagr keeps.
      treeshake: { annotations: false },
      experimental: { attachDebugInfo: 'none' },
    },
  },
});

/** Emits the rest of the package beside the FESM: typings, manifest, docs. */
function angularPackage(): Plugin {
  return {
    name: 'ngx-yeti:angular-package',
    async generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: typingsFile,
        source: await bundleTypings(),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: packageManifest(),
      });

      for (const fileName of ['README.md', 'LICENSE']) {
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
 * one flat file.
 */
async function bundleTypings(): Promise<string> {
  const declarationDir = mkdtempSync(join(tmpdir(), 'ngx-yeti-dts-'));

  try {
    const { rootNames, options } = readConfiguration(tsconfig);
    const { diagnostics } = performCompilation({
      rootNames,
      options: {
        ...options,
        rootDir: join(projectRoot, 'src'),
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

    const bundle = await rolldown({
      input: join(declarationDir, 'index.d.ts'),
      external: isExternal,
      plugins: [dts({ dtsInput: true, tsconfig: false })],
      experimental: { attachDebugInfo: 'none' },
    });
    const { output } = await bundle.generate({
      format: 'es',
      comments: { legal: true, annotation: false, jsdoc: true },
    });
    await bundle.close();

    return output[0].code;
  } finally {
    rmSync(declarationDir, { recursive: true, force: true });
  }
}

/** ng-packagr's manifest for a single entry point compiled in partial mode. */
function packageManifest(): string {
  const source = readJson(join(projectRoot, 'package.json'));
  const angularCompiler = readJson(
    new URL(import.meta.resolve('@angular/compiler/package.json')),
  );

  return JSON.stringify(
    {
      ...source,
      module: fesmFile,
      typings: typingsFile,
      exports: {
        './package.json': { default: './package.json' },
        '.': { types: `./${typingsFile}`, default: `./${fesmFile}` },
      },
      sideEffects: source['sideEffects'] ?? false,
      type: 'module',
      dependencies: {
        ...(source['dependencies'] as Record<string, string> | undefined),
        tslib: (angularCompiler['dependencies'] as Record<string, string>)[
          'tslib'
        ],
      },
    },
    undefined,
    2,
  );
}

function readJson(path: string | URL): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}
