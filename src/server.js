import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
export function previewServer(directory, basePath = '') {
  const root = path.resolve(directory);
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) { response.writeHead(404); response.end('Not found'); return; }
      let relative = pathname.slice(basePath.length);
      if (!relative) relative = '/';
      if (relative.endsWith('/')) relative += 'index.html';
      const target = path.resolve(root, `.${relative}`);
      if (!target.startsWith(`${root}${path.sep}`) || relative.includes('\\') || relative.includes('\0')) { response.writeHead(403); response.end('Forbidden'); return; }
      if (!(await stat(target)).isFile()) throw new Error('Not a file');
      const body = await readFile(target);
      response.writeHead(200, { 'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404);
      response.end(error instanceof URIError ? 'Invalid URL' : 'Not found');
    }
  });
}
