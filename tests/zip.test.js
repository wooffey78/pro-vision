import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chargerContexte, RACINE } from './helpers.mjs';
import { lireKit, nomZipSur, ErreurZip } from '../public/js/services/zipRead.js';
import { creerZip } from '../public/js/services/zip.js';
import { construireIco } from '../public/js/services/png.js';
import { nomFichierSur } from '../public/js/services/download.js';
import * as fflate from '../public/vendor/fflate/fflate.js';

const lim = chargerContexte().app.limites;
const enc = (s) => new TextEncoder().encode(s);
const zip = (entrees) => fflate.zipSync(Object.fromEntries(Object.entries(entrees).map(([k, v]) => [k, typeof v === 'string' ? enc(v) : v])));
const PROJET = '{"a":1}';
const refuse = (octets, motif) => assert.rejects(() => lireKit(fflate, octets, lim), (e) => e instanceof ErreurZip && (!motif || motif.test(e.message)));

test('lecture d’un ZIP valide', async () => {
  const r = await lireKit(fflate, zip({ 'projet.json': PROJET, 'autre/fichier.txt': 'x' }), lim);
  assert.deepEqual(r.projet, { a: 1 });
});
test('noms dangereux refusés', async () => {
  for (const nom of ['../evil.txt', 'a/../../b', '/etc/passwd', 'a\\b.txt', 'CON.txt', 'dir/nul', 'c:evil', 'x\u0001y']) await refuse(zip({ 'projet.json': PROJET, [nom]: 'x' }), /interdit/);
  assert.equal(nomZipSur('03-logo/svg/principal.svg'), true);
  assert.equal(nomZipSur('a'.repeat(300)), false);
});
test('trop d’entrées', async () => {
  const e = { 'projet.json': PROJET };
  for (let i = 0; i < lim.zipMaxEntrees + 5; i++) e[`f${i}.txt`] = 'x';
  await refuse(zip(e), /trop de fichiers/);
});
test('bombe de décompression : taux anormal ou volume excessif', async () => {
  await refuse(zip({ 'projet.json': PROJET, 'zeros.bin': new Uint8Array(5 * 1024 * 1024) }), /taux de compression|volumineux/);
  await refuse(zip({ 'projet.json': PROJET, 'zeros.bin': new Uint8Array(30 * 1024 * 1024) }), /volumineux/);
});
test('projet.json démesuré refusé', async () => {
  const gros = enc('{"x":"' + 'a'.repeat(1.5 * 1024 * 1024) + '"}');
  await refuse(zip({ 'projet.json': gros }), /volumineux|compression/);
});
test('archives invalides', async () => {
  await refuse(enc('ceci n’est pas un zip'), /pas une archive/);
  await refuse(new Uint8Array(10), /pas une archive/);
  const ok = zip({ 'projet.json': PROJET });
  await refuse(ok.slice(0, ok.length - 10), /illisible|abîmée/);
  await refuse(zip({ 'lisez-moi.txt': 'x' }), /projet\.json/);
  await refuse(zip({ 'projet.json': '{pas du json' }), /illisible/);
  await refuse(zip({ 'projet.json': new Uint8Array([0xff, 0xfe, 0x00]) }), /illisible/);
  await refuse(new Uint8Array(lim.zipMaxOctets + 1), /trop volumineux/);
});
test('manifeste incohérent : avertissement, pas d’échec', async () => {
  const m = JSON.stringify({ fichiers: [{ chemin: 'projet.json', sha256: '0'.repeat(64) }] });
  const r = await lireKit(fflate, zip({ 'projet.json': PROJET, 'manifest.json': m }), lim);
  assert.equal(r.avertissements.length, 1);
});
test('création déterministe : même contenu, mêmes octets, quel que soit le fuseau horaire', () => {
  const script = `import * as f from '${RACINE}/public/vendor/fflate/fflate.js';import {creerZip} from '${RACINE}/public/js/services/zip.js';import {createHash} from 'node:crypto';console.log(createHash('sha256').update(creerZip(f,{'b.txt':'bonjour','a/é.txt':'hé','c.bin':new Uint8Array([1,2,3])})).digest('hex'))`;
  const h = ['UTC', 'Asia/Tokyo', 'America/Los_Angeles'].map((tz) => spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ: tz }, encoding: 'utf8' }).stdout.trim());
  assert.equal(new Set(h).size, 1, h.join(' '));
  assert.match(h[0], /^[0-9a-f]{64}$/);
  const a = creerZip(fflate, { 'z.txt': 'z', 'a.txt': 'a' }); const b = creerZip(fflate, { 'a.txt': 'a', 'z.txt': 'z' });
  assert.equal(createHash('sha256').update(a).digest('hex'), createHash('sha256').update(b).digest('hex'));
});
test('ICO : en-tête et décalages corrects', () => {
  const png = (n) => new Uint8Array(n).fill(7);
  const ico = construireIco([{ taille: 16, png: png(10) }, { taille: 256, png: png(20) }]);
  const v = new DataView(ico.buffer);
  assert.equal(v.getUint16(2, true), 1); assert.equal(v.getUint16(4, true), 2);
  assert.equal(ico[6], 16); assert.equal(ico[22], 0);
  assert.equal(v.getUint32(6 + 12, true), 38); assert.equal(v.getUint32(22 + 12, true), 48); assert.equal(ico.length, 68);
});
test('noms de fichiers sûrs', () => {
  assert.equal(nomFichierSur('Studio Aube & Co / Œuvre'), 'studio-aube-co-oeuvre'.replace('oeuvre', 'uvre'));
  assert.equal(nomFichierSur('../../etc'), 'etc');
  assert.equal(nomFichierSur('???'), 'kit');
});
