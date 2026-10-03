// Local Nx inferred-tasks plugin: finds a Yeti checkout by its manifest schema
// and gives it a cacheable `yeti-build` target that runs Yeti's own build.
// Exports `createNodes` (the batch signature; `createNodesV2` is deprecated in Nx 23).
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

exports.name = 'yeti-plugin';

exports.createNodes = [
  '**/schema/manifest.schema.json',
  async (files, options, context) =>
    files.flatMap((file) => {
      const root = dirname(dirname(file));
      let pkg;

      try {
        pkg = JSON.parse(readFileSync(join(context.workspaceRoot, root, 'package.json'), 'utf8'));
      } catch {
        return [];
      }

      if (pkg.name !== 'yeti-css') {
        return [];
      }

      return [
        [
          file,
          {
            projects: {
              [root]: {
                targets: {
                  [options?.targetName ?? 'yeti-build']: {
                    command: 'node bin/build.js',
                    options: { cwd: root },
                    cache: true,
                    inputs: [
                      '{projectRoot}/src/**/*',
                      '{projectRoot}/bin/**/*',
                      '{projectRoot}/schema/**/*',
                      '{projectRoot}/package.json',
                      { externalDependencies: ['esbuild', 'lightningcss', 'parse5'] },
                    ],
                    outputs: ['{projectRoot}/dist'],
                    metadata: { description: "Build Yeti's dist/ with its own bin/build.js" },
                  },
                  'yeti-pack': {
                    executor: 'nx:run-commands',
                    // npm pack needs the destination folder to exist.
                    options: {
                      cwd: root,
                      commands: ['node -e "require(`fs`).mkdirSync(`../../dist/yeti-pack`,{recursive:true})"', 'npm pack --pack-destination ../../dist/yeti-pack'],
                      parallel: false,
                    },
                    cache: true,
                    dependsOn: [options?.targetName ?? 'yeti-build'],
                    inputs: [{ dependentTasksOutputFiles: '**/*' }, '{projectRoot}/package.json'],
                    outputs: ['{workspaceRoot}/dist/yeti-pack'],
                    metadata: { description: 'npm pack the built Yeti (ticket 21 option C)' },
                  },
                },
              },
            },
          },
        ],
      ];
    }),
];
