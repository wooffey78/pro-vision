#!/usr/bin/env node
// Liste tous les fichiers de public/ pour le fonctionnement hors ligne et fixe la version du service worker.
//   node scripts/build-precache.mjs           → écrit public/precache.json et met à jour sw.js
//   node scripts/build-precache.mjs --verify  → échoue si precache.json ou sw.js ne sont pas à jour
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { PUBLIC } from './lib-node.mjs';

const EXCLUS = new Set(['sw.js', 'precache.json', '_headers']);
const parcourir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? parcourir(join(d, e.name)) : [join(d, e.name)]));
const fichiers = parcourir(PUBLIC).map((p) => relative(PUBLIC, p).split('\\').join('/')).filter((f) => !EXCLUS.has(f) && !f.endsWith('.map')).sort();
const h = createHash('sha256');
for (const f of fichiers) { h.update(f); h.update(readFileSync(join(PUBLIC, f))); }
const hash = h.digest('hex').slice(0, 12);
const precache = JSON.stringify({ version: hash, fichiers: ['./', ...fichiers] }, null, 1) + '\n';
const sw = readFileSync(join(PUBLIC, 'sw.js'), 'utf8');
const swNeuf = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${hash}';`);

if (process.argv.includes('--verify')) {
  let ok = true;
  try { if (readFileSync(join(PUBLIC, 'precache.json'), 'utf8') !== precache) ok = false; } catch { ok = false; }
  if (sw !== swNeuf) ok = false;
  if (!ok) { console.error('precache.json ou sw.js obsolète : lancez « npm run precache »'); process.exit(1); }
  console.log(`precache : à jour (${fichiers.length} fichiers, version ${hash})`);
} else {
  writeFileSync(join(PUBLIC, 'precache.json'), precache);
  writeFileSync(join(PUBLIC, 'sw.js'), swNeuf);
  console.log(`precache : ${fichiers.length} fichiers, version ${hash}`);
}
