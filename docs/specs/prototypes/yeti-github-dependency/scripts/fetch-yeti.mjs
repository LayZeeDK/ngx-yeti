// Fetch Yeti at a pinned commit and build it into .yeti/ (gitignored). Run before ng build.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const sha = 'f52d1e8b93de5bbde322480ba77d5be26c49b0ef';
const dir = '.yeti';
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

if (existsSync(`${dir}/dist/yeti.css`)) {
  process.exit(0);
}

rmSync(dir, { recursive: true, force: true });
run('git', ['init', '-q', dir]);
run('git', ['fetch', '-q', '--depth=1', 'https://github.com/foundation/yeti.git', sha], dir);
run('git', ['checkout', '-q', 'FETCH_HEAD'], dir);
run('npm', ['ci', '--ignore-scripts=false'], dir);
run('npm', ['run', 'build'], dir);
