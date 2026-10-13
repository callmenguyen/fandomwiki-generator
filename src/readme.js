import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'zod';
import { loadContent, entitySchema, siteSchema } from './content.js';
import { collections, labels, escapeHtml } from './render.js';

// Escape authored values before inserting them in Markdown tables or links.
const cell = value => escapeHtml(value).replace(/[|`[\]\\]/g, char => ({ '|': '&#124;', '`': '&#96;', '[': '&#91;', ']': '&#93;', '\\': '&#92;' })[char]).replace(/\r?\n/g, '<br>');
const code = value => `<code>${cell(value)}</code>`;
const fileLink = file => `[${cell(file)}](${file.split('/').map(encodeURIComponent).join('/')})`;
const table = (headers, rows) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map(row => `| ${row.join(' | ')} |`),
].join('\n');

function schemaType(property) {
  if (property.enum) return property.enum.map(code).join(', ');
  if (property.anyOf) return property.anyOf.map(schemaType).join(' / ');
  if (property.type === 'array') return `array&lt;${schemaType(property.items)}&gt;`;
  if (property.type === 'object') return 'object';
  return cell(property.type);
}
function schemaTable(schema) {
  const json = z.toJSONSchema(schema, { io: 'input' });
  return table(['Trường', 'Kiểu dữ liệu', 'Bắt buộc', 'Mặc định'], Object.entries(json.properties).map(([key, property]) => {
    const parsedDefault = schema.shape[key].safeParse(undefined);
    return [code(key), schemaType(property), json.required.includes(key) ? 'Có' : 'Không',
      parsedDefault.success && parsedDefault.data !== undefined ? code(JSON.stringify(parsedDefault.data)) : '—'];
  }));
}
async function sourceFiles(directory, prefix = 'src') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    if (entry.isDirectory()) return sourceFiles(path.join(directory, entry.name), `${prefix}/${entry.name}`);
    return entry.isFile() ? [`${prefix}/${entry.name}`] : [];
  }));
  return files.flat().sort();
}

export async function generateReadme(root) {
  const [content, packageText, template, files, workflowText] = await Promise.all([
    loadContent(root), readFile(path.join(root, 'package.json'), 'utf8'),
    readFile(path.join(root, 'docs/README.template.md'), 'utf8'), sourceFiles(path.join(root, 'src')),
    readFile(path.join(root, '.github/workflows/pages.yml'), 'utf8'),
  ]);
  const pkg = JSON.parse(packageText);
  const document = parseDocument(workflowText);
  if (document.errors.length) throw document.errors[0];
  const workflow = document.toJS();
  const output = workflow.jobs.build.steps.find(step => step.uses?.startsWith('actions/upload-pages-artifact@')).with.path;
  const blocks = {
    PROJECT: `**${cell(pkg.name)} · v${cell(pkg.version)}**<br>\nNode.js: ${code(pkg.engines.node)}<br>\nWiki: **${cell(content.site.name)}** — ${cell(content.site.description)}`,
    COMMANDS: table(['Lệnh', 'Thực thi từ package.json'], Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b)).map(([name, command]) => [code(`npm run ${name}`), code(command)])),
    DEPENDENCIES: table(['Nhóm', 'Package', 'Phiên bản khai báo'], [['Runtime', pkg.dependencies], ['Development', pkg.devDependencies ?? {}]].flatMap(([group, dependencies]) => Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)).map(([name, version]) => [group, code(name), code(version)]))),
    SOURCE_FILES: files.map(file => `- ${fileLink(file)}`).join('\n'),
    SITE_SCHEMA: schemaTable(siteSchema),
    ENTITY_SCHEMA: schemaTable(entitySchema),
    CONTENT_COUNTS: table(['Loại bài', 'Số lượng', 'Đường dẫn HTML'], Object.entries(collections).map(([type, directory]) => [labels[type], String(content.entities.filter(entity => entity.type === type).length), code(`${directory}/`)])),
    CONTENT_INDEX: content.entities.length ? table(['Bài viết', 'Loại', 'File YAML'], content.entities.map(entity => [cell(entity.name), labels[entity.type], fileLink(entity.source)])) : 'Chưa có bài viết. Thêm YAML vào `content/` để bắt đầu.',
    DEPLOYMENT: `Workflow: **${cell(workflow.name)}** ([cấu hình](.github/workflows/pages.yml)). Artifact xuất bản: ${code(output)}.`,
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => {
    if (!Object.hasOwn(blocks, name)) throw new Error(`Unknown README template variable: ${name}`);
    return blocks[name];
  });
}

export async function syncReadme(root, { check = false } = {}) {
  const generated = await generateReadme(root);
  let current;
  try { current = await readFile(path.join(root, 'README.md'), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (generated === current) return false;
  if (check) throw new Error('README.md is out of date. Run npm run docs:generate.');
  await writeFile(path.join(root, 'README.md'), generated);
  return true;
}
