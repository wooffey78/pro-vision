#!/usr/bin/env node
// Copie les bibliothèques et polices depuis node_modules vers public/vendor/ (aucun CDN à l'exécution).
// Usage : node scripts/vendor.mjs            → (re)génère public/vendor et VENDOR_MANIFEST.json
//         node scripts/vendor.mjs --verify   → vérifie les empreintes SHA-256 sans rien modifier
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const NM = join(RACINE, 'node_modules');
const VENDOR = join(RACINE, 'public', 'vendor');
const lire = (p) => readFileSync(p);
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

function parcourir(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? parcourir(join(dossier, e.name)) : [join(dossier, e.name)]));
}

if (process.argv.includes('--verify')) {
  const manifeste = json(join(VENDOR, 'VENDOR_MANIFEST.json'));
  let erreurs = 0;
  for (const lib of manifeste.bibliotheques) {
    for (const f of lib.fichiers) {
      const chemin = join(VENDOR, f.chemin);
      if (!existsSync(chemin)) { console.error(`MANQUANT  ${f.chemin}`); erreurs++; continue; }
      if (sha(lire(chemin)) !== f.sha256) { console.error(`MODIFIÉ   ${f.chemin}`); erreurs++; }
    }
  }
  const attendus = new Set(manifeste.bibliotheques.flatMap((l) => l.fichiers.map((f) => f.chemin)));
  for (const p of parcourir(VENDOR)) {
    const rel = relative(VENDOR, p).split('\\').join('/');
    if (rel !== 'VENDOR_MANIFEST.json' && !attendus.has(rel)) { console.error(`NON LISTÉ ${rel}`); erreurs++; }
  }
  if (erreurs) { console.error(`${erreurs} problème(s) dans public/vendor`); process.exit(1); }
  console.log(`vendor : ${attendus.size} fichiers vérifiés`);
  process.exit(0);
}

const fontsCfg = json(join(RACINE, 'public/config/fonts.config.json'));
const secteurs = json(join(RACINE, 'public/config/sectors.json'));
const { tousLesSymboles } = await import(join(RACINE, 'public/js/data/symbols.js'));

rmSync(VENDOR, { recursive: true, force: true });
mkdirSync(VENDOR, { recursive: true });
const bibliotheques = [];
const fichiers = (lib) => (nom, contenu) => {
  const chemin = join(VENDOR, nom);
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, contenu);
  lib.fichiers.push({ chemin: nom, sha256: sha(contenu) });
};
const info = (paquet) => { const p = json(join(NM, paquet, 'package.json')); return { nom: paquet, version: p.version, licence: p.license, source: `https://www.npmjs.com/package/${paquet}`, fichiers: [] }; };

// fflate
{
  const lib = info('fflate'); const ecrire = fichiers(lib);
  ecrire('fflate/fflate.js', lire(join(NM, 'fflate/esm/browser.js')));
  ecrire('fflate/LICENSE.txt', lire(join(NM, 'fflate/LICENSE')));
  bibliotheques.push(lib);
}
// opentype.js (on retire seulement le commentaire sourceMappingURL, pour éviter une requête 404)
{
  const lib = info('opentype.js'); const ecrire = fichiers(lib);
  const src = readFileSync(join(NM, 'opentype.js/dist/opentype.min.mjs'), 'utf8').replace(/\n?\/\/# sourceMappingURL=.*\s*$/m, '\n');
  ecrire('opentype/opentype.min.mjs', Buffer.from(src));
  ecrire('opentype/LICENSE.txt', lire(join(NM, 'opentype.js/LICENSE')));
  bibliotheques.push(lib);
}
// Lucide : uniquement les symboles utilisés
{
  const lib = info('lucide-static'); const ecrire = fichiers(lib);
  for (const id of tousLesSymboles(secteurs)) {
    const p = join(NM, 'lucide-static/icons', `${id}.svg`);
    if (!existsSync(p)) throw new Error(`Symbole Lucide introuvable : ${id}`);
    ecrire(`lucide/${id}.svg`, lire(p));
  }
  ecrire('lucide/LICENSE.txt', lire(join(NM, 'lucide-static/LICENSE')));
  bibliotheques.push(lib);
}
// Polices : WOFF2 (affichage, kit) + WOFF (lecture des contours par opentype.js)
for (const fam of fontsCfg.familles) {
  const paquet = `@fontsource/${fam.id}`;
  const lib = info(paquet); const ecrire = fichiers(lib);
  for (const w of fam.poids) for (const ext of ['woff2', 'woff']) {
    const p = join(NM, paquet, 'files', `${fam.id}-latin-${w}-normal.${ext}`);
    if (!existsSync(p)) throw new Error(`Fichier de police introuvable : ${p}`);
    ecrire(`fonts/${fam.id}/${fam.id}-${w}.${ext}`, lire(p));
  }
  ecrire(`fonts/${fam.id}/OFL.txt`, lire(join(NM, paquet, 'LICENSE')));
  bibliotheques.push(lib);
}
writeFileSync(join(VENDOR, 'VENDOR_MANIFEST.json'), JSON.stringify({ genereePar: 'scripts/vendor.mjs', bibliotheques }, null, 2) + '\n');
const lignes = bibliotheques.map((l) => `| ${l.nom} | ${l.version} | ${l.licence} | ${l.source} |`);
writeFileSync(join(RACINE, 'THIRD_PARTY_LICENSES.md'), `# Licences tierces\n\nFichiers copiés dans \`public/vendor/\` par \`npm run vendor\`. Chaque dossier contient le texte de licence d'origine.\n\n| Paquet | Version | Licence | Source |\n|---|---|---|---|\n${lignes.join('\n')}\n`);
console.log(`vendor : ${bibliotheques.length} paquets, ${bibliotheques.reduce((s, l) => s + l.fichiers.length, 0)} fichiers`);
