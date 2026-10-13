import { syncReadme } from '../src/readme.js';

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) throw new Error('Usage: node scripts/update-readme.js [--check]');
  const changed = await syncReadme(process.cwd(), { check: args[0] === '--check' });
  console.log(changed ? 'README.md updated from project sources.' : 'README.md is up to date.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
