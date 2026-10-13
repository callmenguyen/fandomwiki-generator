import { expect, it } from 'vitest';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadContent } from '../src/content.js';
import { build } from '../src/build.js';

it('the manual character example in GUIDE can be validated and built with the bundled archive', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'wiki-guide-'));
  try {
    await cp('content', path.join(root, 'content'), { recursive: true });
    await cp('site.yml', path.join(root, 'site.yml'));
    const guide = await readFile('GUIDE.md', 'utf8');
    const example = /```yaml\n([\s\S]*?)```/.exec(guide)[1];
    await writeFile(path.join(root, 'content/characters/mai-chi.yml'), example);
    const archive = await loadContent(root);
    expect(archive.byId.get('mai-chi').type).toBe('character');
    await build(root);
    expect(await readFile(path.join(root, 'dist/characters/mai-chi.html'), 'utf8')).toContain('<h1>Mai Chi</h1>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
