import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const name = 'yeti-plugin';

export const createNodes = [
  '**/schema/manifest.schema.json',
  async (files, _options, context) =>
    files.flatMap((file) => {
      const root = dirname(dirname(file));
      const manifest = JSON.parse(
        readFileSync(join(context.workspaceRoot, root, 'package.json'), 'utf8'),
      );

      if (manifest.name !== 'yeti-css') {
        return [];
      }

      return [
        [
          file,
          {
            projects: {
              [root]: {
                name: 'yeti-css',
                targets: {
                  'yeti-build': {
                    command: 'node bin/build.js',
                    options: { cwd: root },
                    cache: true,
                    inputs: [
                      '{projectRoot}/src/**/*',
                      '{projectRoot}/bin/**/*',
                      '{projectRoot}/schema/**/*',
                      {
                        externalDependencies: [
                          'esbuild',
                          'lightningcss',
                          'parse5',
                        ],
                      },
                    ],
                    outputs: ['{projectRoot}/dist'],
                    metadata: {
                      description: "Build Yeti's dist/ with its bin/build.js",
                    },
                  },
                },
              },
            },
          },
        ],
      ];
    }),
];
