// PROTOTYPE static server: the production build under /sub/, SPA fallback to index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(import.meta.dirname, 'dist/spa/browser');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon' };
const port = Number(process.env.PORT ?? 4720);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (!path.startsWith('/sub/')) {
    res.writeHead(404).end('outside base href');

    return;
  }

  const file = normalize(join(root, path.slice(5)));

  try {
    const body = await readFile(file.startsWith(root) && extname(file) ? file : join(root, 'index.html'));
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'text/html' }).end(body);
  } catch {
    res.writeHead(200, { 'content-type': 'text/html' }).end(await readFile(join(root, 'index.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/sub/`));
