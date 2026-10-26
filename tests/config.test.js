import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chargerContexte, PUBLIC, RACINE } from './helpers.mjs';
import { tousLesSymboles } from '../public/js/data/symbols.js';
import { jetons } from '../public/js/data/keywords.js';
import { verifierNom } from '../public/js/data/blocklist.js';
import { proposerNoms } from '../public/js/data/names.js';
import { classerSecteurs, resoudreSecteur } from '../public/js/data/sectors.js';
import { creerPrng } from '../public/js/core/prng.js';
import { AMBIANCES } from '../public/js/core/palette.js';

const ctx = chargerContexte();

test('16 secteurs complets', () => {
  assert.equal(ctx.sectors.secteurs.length, 16);
  for (const s of ctx.sectors.secteurs) {
    assert.ok(s.motsCles.length >= 10 && s.motsCles.length <= 20, `${s.id} : ${s.motsCles.length} mots-clés`);
    assert.ok(s.symboles.length >= 3 && s.symboles.length <= 6, s.id);
    assert.ok(s.ambiances.every((a) => AMBIANCES.includes(a)), s.id);
    assert.ok(s.slogans.length >= 3 && s.lexique.natures.length >= 6 && s.lexique.structures.length >= 2, s.id);
    for (const sym of s.symboles) assert.ok(existsSync(join(PUBLIC, 'vendor/lucide', `${sym}.svg`)), `${s.id} : symbole ${sym} non vendorisé`);
  }
  assert.equal(new Set(ctx.sectors.secteurs.map((s) => s.id)).size, 16);
});
test('tous les symboles utilisables sont vendorisés', () => {
  for (const id of tousLesSymboles(ctx.sectors)) assert.ok(existsSync(join(PUBLIC, 'vendor/lucide', `${id}.svg`)), id);
});
test('polices : 156 familles, couples cohérents, fichiers et licences présents', () => {
  assert.equal(ctx.fonts.familles.length, 156);
  const ids = new Set(ctx.fonts.familles.map((f) => f.id));
  assert.ok(ctx.fonts.couples.length >= 100);
  for (const c of ctx.fonts.couples) { assert.ok(ids.has(c.titres) && ids.has(c.texte), c.id); assert.ok(c.ambiances.every((a) => AMBIANCES.includes(a))); }
  for (const f of ctx.fonts.familles) {
    assert.ok(existsSync(join(PUBLIC, 'vendor/fonts', f.id, 'OFL.txt')), f.id);
    assert.match(readFileSync(join(PUBLIC, 'vendor/fonts', f.id, 'OFL.txt'), 'utf8'), /SIL OPEN FONT LICENSE|Apache License/i);
    for (const w of f.poids) for (const ext of ['woff2', 'woff']) assert.ok(existsSync(join(PUBLIC, 'vendor/fonts', f.id, `${f.id}-${w}.${ext}`)), `${f.id} ${w} ${ext}`);
  }
});
test('formats réseaux sociaux : dimensions plausibles, avertissement « à vérifier »', () => {
  assert.match(ctx.social.avertissement, /À VÉRIFIER/);
  for (const f of ctx.social.formats) { assert.ok(f.largeur >= 400 && f.hauteur >= 300 || f.id === 'profil'); assert.equal(f.verifieLe, null); }
});
test('passerelle : VYRATY actif, adresse à renseigner, AURION inactif', () => {
  const a = Object.fromEntries(ctx.bridge.apps.map((x) => [x.id, x]));
  assert.equal(a.vyraty.actif, true); assert.match(a.vyraty.baseUrl, /A_RENSEIGNER/); assert.equal(a.aurion.actif, false);
});
test('configuration : IA désactivée, licence free', () => { assert.equal(ctx.app.ai.enabled, false); assert.equal(ctx.app.licence.mode, 'free'); });
test('détection de secteur par mots-clés', () => {
  assert.equal(resoudreSecteur(ctx.sectors, { activite: 'je suis plombier chauffagiste' }).id, 'plomberie-chauffage-electricite');
  assert.equal(resoudreSecteur(ctx.sectors, { activite: 'je fabrique des bougies' }).id, 'artisanat-bougies');
  assert.equal(resoudreSecteur(ctx.sectors, { activite: 'zzz' }).id, 'autre');
  assert.equal(resoudreSecteur(ctx.sectors, { secteur: 'sport-coaching', activite: 'bougies' }).id, 'sport-coaching');
  assert.equal(classerSecteurs(ctx.sectors, 'photographe mariage')[0].secteur.id, 'photo-video');
  assert.deepEqual(jetons('Les Bougies parfumées'), ['les', 'bougie', 'parfumee']);
});
test('noms : déterministes, uniques, sans marque connue', () => {
  for (const s of ctx.sectors.secteurs) {
    const a = proposerNoms(s, creerPrng(`n-${s.id}`), 12); const b = proposerNoms(s, creerPrng(`n-${s.id}`), 12);
    assert.deepEqual(a, b);
    assert.ok(a.length >= 10, `${s.id} : ${a.length} noms`);
    assert.equal(new Set(a.map((x) => x.nom.toLowerCase())).size, a.length);
    assert.ok(a.length >= 10, s.id + ' : ' + a.length);
    for (const n of a) { assert.equal(verifierNom(n.nom).interdit, false, n.nom); assert.ok(n.nom.length >= 3 && n.nom.length <= 32); }
  }
  assert.equal(verifierNom('Café Nike').interdit, true);
  assert.equal(verifierNom('Mac Donald’s').interdit, false);
  assert.equal(verifierNom('McDonald').interdit, true);
  assert.equal(verifierNom('Atelier Aube').interdit, false);
});
test('règles du projet (check-policy), vendor et précache à jour', () => {
  for (const args of [['scripts/check-policy.mjs'], ['scripts/vendor.mjs', '--verify'], ['scripts/build-precache.mjs', '--verify']]) {
    const r = spawnSync(process.execPath, args, { cwd: RACINE, encoding: 'utf8' });
    assert.equal(r.status, 0, `${args.join(' ')} :\n${r.stdout}${r.stderr}`);
  }
});
test('ni Math.random ni Date dans core/ (revérifié ici)', () => {
  const { readdirSync } = require_('node:fs');
  for (const f of readdirSync(join(PUBLIC, 'js/core'), { recursive: true }).filter((x) => x.endsWith('.js'))) {
    const s = readFileSync(join(PUBLIC, 'js/core', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.ok(!/Math\.random|Date\.now|new Date/.test(s), f);
  }
});
function require_(m) { return { readdirSync: (...a) => readdirSyncImport(...a) }; }
import { readdirSync as readdirSyncImport } from 'node:fs';
