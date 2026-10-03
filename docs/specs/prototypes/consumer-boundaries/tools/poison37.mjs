// Ticket 37: does a creation error in a boundary's first create pass on the server affect later
// requests in the same server process? Fresh server; the first request throws, then a clean one.
// Usage: BUILD=dev|prod PORT=4387 node poison37.mjs
import { spawn } from 'node:child_process';

const build = process.env.BUILD ?? 'dev';
const port = Number(process.env.PORT ?? 4387);
const order = (process.env.ORDER ?? 's/plain/server/ctor,s/plain/none/ctor,s/plain/none/ctor').split(',');
const log = [];
const server = spawn(process.execPath, [`D:/tmp/ngx-yeti-37/app/dist/${build}/server/server.mjs`], {
  env: { ...process.env, NG_ALLOWED_HOSTS: 'localhost', PORT: String(port) },
});
for (const s of [server.stdout, server.stderr]) s.on('data', (d) => log.push(...String(d).split(/\r?\n/).filter(Boolean)));
for (let i = 0; i < 100 && !log.some((l) => l.includes('listening')); i++) await new Promise((r) => setTimeout(r, 200));

for (const c of order) {
  const before = log.length;
  const html = await (await fetch(`http://localhost:${port}/sub/${c}`)).text();
  await new Promise((r) => setTimeout(r, 100));
  const dataT = [...html.matchAll(/data-t="((?:card|fallback)[^"]*)"/g)].map((m) => m[1]);
  const fb = html.match(/Fallback A: ([^<]*)/)?.[1] ?? null;
  console.log(`${build} ${c}: [${dataT}] ${fb ? `fallback="${fb}"` : ''} log=${log.slice(before).join(' || ') || '-'}`);
}
server.kill();
process.exit(0);
