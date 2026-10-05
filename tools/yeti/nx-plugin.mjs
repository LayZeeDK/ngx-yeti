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
      // bin/build.js resolves these from Yeti's own node_modules first, where
      // npm nests a copy when Yeti's range excludes the root version. Nx's
      // externalDependencies hashes only the root copy, and both directories
      // are gitignored, so print the version of the copy Node resolves. The
      // empty externalDependencies stops Nx from hashing every npm package.
      const toolVersions = `node -p "['esbuild','lightningcss','parse5'].map(p=>{const f=['${root}/node_modules/','node_modules/'].map(d=>d+p+'/package.json').find(require('fs').existsSync);return p+'@'+JSON.parse(require('fs').readFileSync(f)).version}).join(' ')"`;

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
                    '{workspaceRoot}/tools/yeti/nx-plugin.mjs',
                    { runtime: toolVersions },
                    { externalDependencies: [] },
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
