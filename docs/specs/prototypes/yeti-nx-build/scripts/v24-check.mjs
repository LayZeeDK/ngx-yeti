// Lists every target's executor across the workspace and flags any on the Nx v24 removal list
// (https://nx.dev/blog/look-mum-no-executors, "Executors removed in Nx v24").
import { execSync } from 'node:child_process';

const removedPrefixes = ['@nx/cypress:', '@nx/detox:', '@nx/eslint:lint', '@nx/expo:', '@nx/jest:jest', '@nx/next:', '@nx/playwright:playwright', '@nx/react-native:', '@nx/remix:', '@nx/rollup:rollup', '@nx/rspack:', '@nx/storybook:', '@nx/vite:', '@nx/vitest:test', '@nx/webpack:'];
const run = (cmd) => execSync(cmd, { cwd: process.argv[2], encoding: 'utf8' });
const projects = JSON.parse(run('npx nx show projects --json'));
let flagged = 0;

for (const name of projects) {
  const { targets } = JSON.parse(run(`npx nx show project ${name} --json`));

  for (const [target, config] of Object.entries(targets)) {
    const hit = removedPrefixes.some((p) => config.executor?.startsWith(p));
    flagged += hit ? 1 : 0;
    console.log(`${hit ? '[REMOVED-IN-24]' : '[OK]'} ${name}:${target} ${config.executor}`);
  }
}

console.log(`flagged: ${flagged}`);
process.exit(flagged ? 1 : 0);
