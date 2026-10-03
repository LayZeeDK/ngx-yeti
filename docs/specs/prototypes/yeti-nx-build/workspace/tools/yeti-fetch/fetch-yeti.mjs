// Fetch Yeti at the commit in yeti.pin and build it into .yeti/ (git-ignored).
// Nx caches .yeti/dist keyed on yeti.pin and this script, so a warm run never fetches.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

const sha = readFileSync(new URL('./yeti.pin', import.meta.url), 'utf8').trim();
const dir = '.yeti';
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

rmSync(dir, { recursive: true, force: true });
run('git', ['init', '-q', dir]);
run('git', ['fetch', '-q', '--depth=1', 'https://github.com/foundation/yeti.git', sha], dir);
run('git', ['checkout', '-q', 'FETCH_HEAD'], dir);
run('npm', ['ci', '--ignore-scripts'], dir);
run('npm', ['run', 'build'], dir);
