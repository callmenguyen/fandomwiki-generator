import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadContent } from '../src/content.js';
import { build } from '../src/build.js';
import { markdown, escapeHtml } from '../src/render.js';

const roots = [];
async function fixture(entries = []) {
  const root = await mkdtemp(path.join(tmpdir(), 'fandomwiki-test-'));
  roots.push(root);
  await mkdir(path.join(root, 'content'), { recursive: true });
  await writeFile(path.join(root, 'site.yml'), 'name: Test Wiki\ndescription: An archive\nlanguage: vi\n');
  for (const [name, text] of entries) await writeFile(path.join(root, 'content', name), text);
  return root;
}
const universe = ['world.yml', 'id: world\ntype: universe\nname: Thế giới\nsummary: A world\n'];
const series = ['story.yaml', 'id: story\ntype: series\nname: Story\nsummary: A story\nuniverse: world\n'];
const hero = ['hero.yml', 'id: hero\ntype: character\nname: Anh hùng\nsummary: The hero\nuniverse: world\nseries: [story]\naliases: [Guardian]\nsections:\n  - title: Biography\n    body: "Met [[battle|the battle]]."\n'];
const battle = ['battle.yml', 'id: battle\ntype: event\nname: Battle\nsummary: A battle\nuniverse: world\nseries: [story]\nparticipants: [hero]\ndate: "Year 12"\n'];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe('YAML content validation', () => {
  it('loads multiple entity types and resolves wiki references and backlinks', async () => {
    const content = await loadContent(await fixture([universe, series, hero, battle]));
    expect(content.entities).toHaveLength(4);
    expect(content.byId.get('battle').backlinks).toContain('hero');
    expect(content.byId.get('hero').backlinks).toContain('battle');
  });
  it.each([
    ['duplicate ids', [universe, ['other.yml', universe[1]]], /Duplicate/],
    ['unsafe slugs', [['bad.yml', 'id: ../escape\ntype: universe\nname: X\nsummary: X']], /id/],
    ['unknown fields', [['bad.yml', universe[1] + 'typo: x\n']], /typo/],
    ['missing universe', [series], /world/],
    ['reserved index slug', [['bad.yml', universe[1].replace('id: world', 'id: index')]], /id/],
    ['wrong reference type', [universe, ['s.yml', series[1].replace('universe: world', 'universe: story')]], /universe/],
    ['unresolved wiki links', [universe, series, hero], /battle/],
    ['duplicate YAML keys', [['bad.yml', universe[1] + 'name: Again\n']], /unique|duplicate/i],
    ['invalid YAML', [['bad.yml', 'id: [']], /bad.yml/],
    ['wrong series type', [universe, ['hero.yml', hero[1].replace('[story]', '[world]').replace('[[battle|the battle]]', 'nothing')]], /series/],
    ['mismatched series universe', [universe, series, ['other.yml', 'id: other\ntype: universe\nname: Other\nsummary: Other'], ['hero.yml', hero[1].replace('universe: world', 'universe: other').replace('[[battle|the battle]]', 'nothing')]], /universe/],
    ['invalid image URL', [['bad.yml', universe[1] + 'image: javascript:alert(1)\n']], /image/],
  ])('rejects %s with a useful error', async (_, entries, message) => {
    await expect(loadContent(await fixture(entries))).rejects.toThrow(message);
  });
  it('accepts an empty archive and ignores non-YAML files', async () => {
    const root = await fixture([['notes.txt', 'not yaml']]);
    expect((await loadContent(root)).entities).toEqual([]);
  });
  it('reports missing or invalid site config', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'site.yml'), 'name: Test\nbasePath: ../escape');
    await expect(loadContent(root)).rejects.toThrow(/basePath/);
  });
  it('rejects missing universe fields and invalid participant fields', async () => {
    await expect(loadContent(await fixture([['hero.yml', 'id: hero\ntype: character\nname: Hero\nsummary: Hero']]))).rejects.toThrow(/universe/);
    await expect(loadContent(await fixture([['world.yml', universe[1] + 'participants: [hero]\n']]))).rejects.toThrow(/participants/);
    await expect(loadContent(await fixture([['world.yml', universe[1] + 'universe: world\n']]))).rejects.toThrow(/universe/);
  });
});

describe('safe article rendering', () => {
  it('escapes HTML, unsafe links and wiki labels while preserving Markdown', () => {
    const byId = new Map([['hero', { id: 'hero', name: 'Hero', type: 'character' }]]);
    const html = markdown('<script>alert(1)</script> **bold** [[hero|<img src=x>]] [bad](javascript:alert(1))', byId, '/wiki');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('/wiki/characters/hero.html');
    expect(html).toContain('&lt;img src=x&gt;');
    expect(escapeHtml('"&<>\'')).toBe('&quot;&amp;&lt;&gt;&#39;');
  });
  it('leaves wiki links inside code untouched and fails for unknown references', () => {
    expect(markdown('`[[missing]]`', new Map(), '')).toContain('<code>[[missing]]</code>');
    expect(() => markdown('[[missing]]', new Map(), '')).toThrow(/missing/);
  });
});

describe('static build', () => {
  it('generates article, index, search, timeline, 404 and assets with subpath links', async () => {
    const root = await fixture([universe, series, hero, battle]);
    await build(root, { basePath: '/fandomwiki-generator/' });
    const article = await readFile(path.join(root, 'dist/characters/hero.html'), 'utf8');
    expect(article).toContain('/fandomwiki-generator/events/battle.html');
    expect(article).toContain('Biography');
    expect(article).toContain('Liên kết đến đây');
    const search = JSON.parse(await readFile(path.join(root, 'dist/search-index.json'), 'utf8'));
    expect(search.find(e => e.id === 'hero').aliases).toEqual(['Guardian']);
    expect(search.find(e => e.id === 'hero').url).toBe('/fandomwiki-generator/characters/hero.html');
    expect(await readdir(path.join(root, 'dist'))).toEqual(expect.arrayContaining(['index.html', '404.html', 'timeline.html', '.nojekyll', 'assets', 'search.html']));
    await build(root);
    expect(await readFile(path.join(root, 'dist/index.html'), 'utf8')).toContain('href="/characters/hero.html"');
  });
  it('does not destroy a previous build when validation fails', async () => {
    const root = await fixture([universe]);
    await build(root);
    const previous = await readFile(path.join(root, 'dist/index.html'), 'utf8');
    await writeFile(path.join(root, 'content/broken.yml'), 'broken: true');
    await expect(build(root)).rejects.toThrow();
    expect(await readFile(path.join(root, 'dist/index.html'), 'utf8')).toBe(previous);
  });
  it('refuses to overwrite an unrelated output directory', async () => {
    const root = await fixture();
    await mkdir(path.join(root, 'dist'));
    await writeFile(path.join(root, 'dist/keep.txt'), 'keep');
    await expect(build(root)).rejects.toThrow(/dist/);
    expect(await readFile(path.join(root, 'dist/keep.txt'), 'utf8')).toBe('keep');
  });
  it('renders an empty wiki and validates the deployment prefix', async () => {
    const root = await fixture();
    await build(root);
    expect(await readFile(path.join(root, 'dist/index.html'), 'utf8')).toContain('Chưa có bài viết');
    await expect(build(root, { basePath: '//evil.example' })).rejects.toThrow(/basePath/);
  });
  it('copies authored images and renders escaped infobox fields', async () => {
    const root = await fixture([['world.yml', universe[1] + 'image: /assets/world.svg\nimageCaption: A world\nfacts:\n  Population: 12\n  Active: true\ntags: [Fantasy]\n']] );
    await mkdir(path.join(root, 'public/assets'), { recursive: true });
    await writeFile(path.join(root, 'public/assets/world.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    await build(root);
    const html = await readFile(path.join(root, 'dist/universes/world.html'), 'utf8');
    expect(html).toContain('src="/assets/world.svg"');
    expect(html).toContain('<figcaption>A world</figcaption>');
    expect(html).toContain('Population');
    expect(await readFile(path.join(root, 'dist/assets/world.svg'), 'utf8')).toContain('<svg');
  });
  it('rejects symlink output directories and symlinked public assets', async () => {
    const root = await fixture();
    await symlink(path.join(root, 'content'), path.join(root, 'dist'));
    await expect(build(root)).rejects.toThrow(/dist/);
    await rm(path.join(root, 'dist'));
    await mkdir(path.join(root, 'public/assets'), { recursive: true });
    await symlink(path.join(root, 'site.yml'), path.join(root, 'public/assets/leak.yml'));
    await expect(build(root)).rejects.toThrow(/symlink/i);
  });
  it('refuses authored asset collisions', async () => {
    const root = await fixture();
    await mkdir(path.join(root, 'public/assets'), { recursive: true });
    await writeFile(path.join(root, 'public/assets/search.js'), 'bad');
    await expect(build(root)).rejects.toThrow();
    expect((await readdir(root)).filter(name => name.startsWith('.wiki-build-'))).toEqual([]);
  });
});
