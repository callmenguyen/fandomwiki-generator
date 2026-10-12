import { afterEach, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { previewServer } from '../src/server.js';

const cleanups = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'wiki-server-'));
  await writeFile(path.join(root, 'index.html'), '<h1>Wiki</h1>');
  await writeFile(path.join(root, 'file.xyz'), 'binary');
  await mkdir(path.join(root, 'directory'));
  const server = previewServer(root, '/wiki');
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  cleanups.push(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true }); });
  return (url, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path: url, method }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on('error', reject); req.end();
  });
}
it('serves static files at the configured prefix and handles HEAD', async () => {
  const get = await fixture();
  expect(await get('/wiki/')).toMatchObject({ status: 200, body: '<h1>Wiki</h1>' });
  expect(await get('/wiki', 'HEAD')).toMatchObject({ status: 200, body: '' });
  expect((await get('/wiki/file.xyz')).headers['content-type']).toBe('application/octet-stream');
});
it('rejects missing pages, traversal, malformed URLs, directories and unsupported methods', async () => {
  const get = await fixture();
  for (const url of ['/outside', '/wiki/nope', '/wiki/directory', '/wiki/%2e%2e%2fsite.yml', '/wiki/%5csecret', '/wiki/%00']) expect((await get(url)).status).toBeGreaterThanOrEqual(400);
  expect((await get('/wiki/%zz')).status).toBe(400);
  expect((await get('/wiki/', 'POST')).status).toBe(405);
});
