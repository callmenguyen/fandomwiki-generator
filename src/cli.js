import { build } from './build.js';
import { loadContent } from './content.js';
import { previewServer } from './server.js';

const command = process.argv[2] ?? 'build';
try {
  if (process.argv.length > 3) throw new Error('Usage: node src/cli.js [build|validate|preview]. Set BASE_PATH or PORT via environment.');
  if (command === 'validate') {
    const content = await loadContent(process.cwd());
    console.log(`Validated ${content.entities.length} articles.`);
  } else if (command === 'build' || command === 'preview') {
    const result = await build(process.cwd(), { basePath: process.env.BASE_PATH });
    console.log(`Built ${result.articles} articles → ${result.output}`);
    if (command === 'preview') {
      const port = Number(process.env.PORT ?? 4173);
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
      const { site } = await loadContent(process.cwd());
      const base = (process.env.BASE_PATH ?? site.basePath).replace(/\/$/, '');
      const server = previewServer(result.output, base);
      server.on('error', error => { console.error(error.message); process.exitCode = 1; });
      server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}/`));
    }
  } else throw new Error(`Unknown command "${command}". Use build, validate, or preview.`);
} catch (error) {
  console.error(`Wiki error: ${error.message}`);
  process.exitCode = 1;
}
