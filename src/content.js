import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'zod';
import { wikiReferences } from './render.js';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine(value => value !== 'index', 'id "index" is reserved for category pages');
const text = z.string().trim().min(1);
export const basePathSchema = z.string().regex(/^(?:|\/(?:[a-zA-Z0-9_-]+\/?)+)$/).transform(value => value.replace(/\/$/, ''));
export const siteSchema = z.object({
  name: text,
  description: text.default('Bách khoa toàn thư về những thế giới tưởng tượng.'),
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/).default('vi'),
  basePath: basePathSchema.default(''),
}).strict();
export const entitySchema = z.object({
  id, type: z.enum(['universe', 'series', 'character', 'event']), name: text, summary: text,
  universe: id.optional(), series: z.array(id).default([]), participants: z.array(id).default([]),
  related: z.array(id).default([]), aliases: z.array(text).default([]), tags: z.array(text).default([]),
  date: text.optional(), order: z.number().finite().default(0),
  image: z.string().regex(/^(?:https:\/\/[^\s"<>]+|\/assets\/[a-zA-Z0-9_./-]+)$/).refine(value => !value.includes('..'), 'Image path must stay inside assets').optional(),
  imageCaption: text.optional(),
  facts: z.record(text, z.union([z.string(), z.number(), z.boolean()])).default({}),
  sections: z.array(z.object({ title: text, body: text }).strict()).default([]),
}).strict().superRefine((entity, context) => {
  if (entity.type !== 'universe' && !entity.universe) context.addIssue({ code: 'custom', path: ['universe'], message: 'Required for series, character and event' });
  if (entity.type === 'universe' && entity.universe) context.addIssue({ code: 'custom', path: ['universe'], message: 'A universe cannot belong to a universe' });
  if (entity.type !== 'event' && entity.participants.length) context.addIssue({ code: 'custom', path: ['participants'], message: 'Only events have participants' });
});

async function readYaml(file, schema) {
  try {
    const doc = parseDocument(await readFile(file, 'utf8'), { uniqueKeys: true });
    if (doc.errors.length) throw doc.errors[0];
    return schema.parse(doc.toJS({ maxAliasCount: 50 }));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`, { cause: error });
  }
}

async function yamlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return yamlFiles(file);
    return entry.isFile() && /\.ya?ml$/i.test(entry.name) ? [file] : [];
  }));
  return results.flat().sort();
}

export async function loadContent(root) {
  const site = await readYaml(path.join(root, 'site.yml'), siteSchema);
  const entities = await Promise.all((await yamlFiles(path.join(root, 'content'))).map(async file => ({
    ...await readYaml(file, entitySchema), source: path.relative(root, file), backlinks: [],
  })));
  const byId = new Map();
  for (const entity of entities) {
    if (byId.has(entity.id)) throw new Error(`${entity.source}: Duplicate id "${entity.id}"`);
    byId.set(entity.id, entity);
  }
  for (const entity of entities) {
    const references = [
      ...entity.related.map(ref => [ref, undefined, 'related']),
      ...entity.series.map(ref => [ref, 'series', 'series']),
      ...entity.participants.map(ref => [ref, 'character', 'participants']),
      ...entity.sections.flatMap(section => wikiReferences(section.body).map(ref => [ref, undefined, 'sections'])),
    ];
    if (entity.universe) references.push([entity.universe, 'universe', 'universe']);
    for (const [ref, expectedType, field] of references) {
      const target = byId.get(ref);
      if (!target || (expectedType && target.type !== expectedType)) throw new Error(`${entity.source}: ${field} reference "${ref}" must point to ${expectedType ?? 'an existing article'}`);
      if (field === 'series' && target.universe !== entity.universe) throw new Error(`${entity.source}: series "${ref}" belongs to a different universe`);
      if (target.id !== entity.id && !target.backlinks.includes(entity.id)) target.backlinks.push(entity.id);
    }
  }
  entities.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, site.language));
  return { site, entities, byId };
}
