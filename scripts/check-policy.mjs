#!/usr/bin/env node
// Vérifie les règles du projet (sécurité, vie privée, pureté de core/). Échoue (code 1) à la première violation.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PUBLIC, RACINE } from './lib-node.mjs';

const parcourir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? parcourir(join(d, e.name)) : [join(d, e.name)]));
const rel = (p) => relative(RACINE, p).split('\\').join('/');
const tous = parcourir(PUBLIC).filter((p) => !rel(p).startsWith('public/vendor/'));
const js = tous.filter((p) => p.endsWith('.js') && !rel(p).endsWith('public/sw.js') || rel(p) === 'public/sw.js');
const jsApp = js.filter((p) => rel(p).startsWith('public/js/'));
const css = tous.filter((p) => p.endsWith('.css'));
const html = tous.filter((p) => p.endsWith('.html'));
const erreurs = [];
const ajouter = (fichier, regle) => erreurs.push(`${rel(fichier)} : ${regle}`);

/** Retire commentaires (approximation suffisante pour ces contrôles). */
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const HOTES_OK = ['www.w3.org', 'schema.org', 'json-schema.org', 'www.sitemaps.org', 'openfontlicense.org'];
const urlsInterdites = (texte) => [...texte.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)].map((m) => m[1]).filter((h) => !HOTES_OK.includes(h));

for (const f of jsApp) {
  const brut = readFileSync(f, 'utf8');
  const s = sansCommentaires(brut);
  for (const mot of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'setAttribute(\'style\'', 'setAttribute("style"', 'console.log', 'debugger']) if (s.includes(mot)) ajouter(f, `« ${mot} » interdit`);
  if (/\bimport\s*\(\s*['"]https?:/.test(s) || /from\s+['"]https?:/.test(s)) ajouter(f, 'import distant interdit');
  if (rel(f).startsWith('public/js/core/')) {
    for (const mot of ['Math.random', 'Date.now', 'new Date', 'document.', 'window.', 'localStorage', 'fetch(', 'performance.now']) if (s.includes(mot)) ajouter(f, `core/ doit rester pur : « ${mot} » interdit`);
  }
  if (/\b(localStorage|sessionStorage|indexedDB)\b/.test(s) && !['public/js/services/storage.js', 'public/js/app.js'].includes(rel(f))) ajouter(f, 'accès au stockage hors services/storage.js');
  const urls = urlsInterdites(s);
  if (urls.length) ajouter(f, `URL externe : ${urls[0]}`);
}
if (!/Math\.random|Date\.now/.test('')) { /* rien */ }
for (const f of [...html, ...css, ...js.filter((p) => rel(p) === 'public/sw.js')]) {
  const s = readFileSync(f, 'utf8');
  const urls = urlsInterdites(s.replace(/<!--[\s\S]*?-->/g, ''));
  if (urls.length) ajouter(f, `URL externe : ${urls[0]}`);
}
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  if (/\sstyle\s*=/.test(s)) ajouter(f, 'attribut style interdit (CSP)');
  if (/<script(?![^>]*\ssrc=)[^>]*>(?!\s*<\/script>)/i.test(s.replace(/type="application\/ld\+json"/g, ''))) ajouter(f, 'script en ligne interdit');
  if (/<style[\s>]/i.test(s)) ajouter(f, 'balise style en ligne interdite (CSP)');
  if (/\son[a-z]+\s*=/i.test(s)) ajouter(f, 'gestionnaire d’événement en ligne interdit');
  if (!/Content-Security-Policy/.test(s)) ajouter(f, 'CSP manquante');
}
for (const f of css) {
  if (rel(f) === 'public/css/tokens.css') continue;
  const s = readFileSync(f, 'utf8');
  if (/#[0-9a-fA-F]{3,8}\b/.test(s.replace(/url\([^)]*\)/g, ''))) ajouter(f, 'couleur en dur : utilisez var(--…) défini dans tokens.css');
  if (/\brgba?\(|\bhsla?\(|\boklch\(/.test(s)) ajouter(f, 'couleur fonctionnelle en dur : utilisez les tokens');
}
if (erreurs.length) {
  console.error(`check-policy : ${erreurs.length} violation(s)\n - ${erreurs.join('\n - ')}`);
  process.exit(1);
}
console.log(`check-policy : OK (${jsApp.length} modules JS, ${html.length} pages HTML, ${css.length} feuilles CSS)`);
