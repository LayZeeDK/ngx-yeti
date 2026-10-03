import { dirname } from 'node:path';

export const name = 'yeti-plugin';

// vendor-yeti.mjs rewrites COMMIT on every pin move, so `default` hashes
// the pin even when the move changes only Yeti's package.json, which
// .nxignore hides from Nx and bin/build.js stamps into dist.
export const createNodes = [
  'vendor/yeti/COMMIT',
  (files) =>
    files.map((file) => {
      const root = dirname(file);

      return [
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
                    'default',
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
      ];
    }),
];
