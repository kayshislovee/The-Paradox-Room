// escape-room/scripts/export-levels.mjs
import { buildSync } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const keep = process.argv.includes('--keep');

const entryFile = path.join(root, '_export-entry.ts');
const entry = `
export { LEVEL_6 } from './src/data/level6.ts';
export { LEVEL_7 } from './src/data/level7.ts';
`;
writeFileSync(entryFile, entry, 'utf8');

const bundleFile = path.join(root, '_levels.bundle.mjs');
buildSync({
  entryPoints: [entryFile],
  bundle: true,
  outfile: bundleFile,
  format: 'esm',
  platform: 'node',
  logLevel: 'warning',
  target: 'node20',
});

const { pathToFileURL } = await import('node:url');
const mod = await import(pathToFileURL(bundleFile).href + `?t=${Date.now()}`);
console.log('exports terbaca:', Object.keys(mod));

const outDir = path.resolve(root, '../escape-room-api/database/seeders/data');
mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'levels.json');
const payload = {
  level_6: mod.LEVEL_6,
  level_7: mod.LEVEL_7,
};
writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');

const count = (v) => (Array.isArray(v) ? v.length : 0);
console.log(`OK -> ${outFile}`);
for (const [key, lvl] of Object.entries(payload)) {
  if (!lvl) { console.warn(`!! ${key} kosong`); continue; }
  console.log(` - ${key}: scenes=${count(lvl.scenes)}, puzzles=${count(lvl.puzzles)}, treasures=${count(lvl.treasures)}, achievements=${count(lvl.achievements)}`);
}

if (!keep) {
  if (existsSync(entryFile)) rmSync(entryFile);
  if (existsSync(bundleFile)) rmSync(bundleFile);
  console.log('(file temp dibersihkan, pakai --keep untuk menyimpannya)');
}