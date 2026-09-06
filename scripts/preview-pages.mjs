import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const defaultRoot = resolve(projectRoot, 'dist/client');
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

export function createPreviewServer(root = defaultRoot, basePath = '/fitness-studio-landing') {
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
      const url = new URL(request.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname !== basePath && !pathname.startsWith(basePath + '/')) { response.writeHead(404); response.end('Not found'); return; }
      const rootPath = await realpath(root);
      let candidate = resolve(rootPath, '.' + pathname.slice(basePath.length));
      const contained = (path) => path === rootPath || path.startsWith(rootPath + sep);
      if (!contained(candidate)) throw new Error('Not found');
      let info = await stat(candidate);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) { response.writeHead(308, { location: `${url.pathname}/${url.search}` }); response.end(); return; }
        candidate = resolve(candidate, 'index.html');
        info = await stat(candidate);
      }
      candidate = await realpath(candidate);
      if (!contained(candidate) || !info.isFile()) throw new Error('Not found');
      response.writeHead(200, { 'Content-Type': types[extname(candidate)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      if (request.method === 'HEAD') response.end();
      else createReadStream(candidate).on('error', () => response.destroy()).pipe(response);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(4174, '127.0.0.1', () => console.log('Prototype preview: http://127.0.0.1:4174/fitness-studio-landing/club/'));
}
