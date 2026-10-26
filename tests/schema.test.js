import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerContexte, projetExemple, PUBLIC, RACINE } from './helpers.mjs';
import { validerProjet, SCHEMA_PROJET, projetVide } from '../public/js/core/schema.js';
import { migrer } from '../public/js/core/migrate.js';

const ctx = chargerContexte();
const ok = await projetExemple(ctx);

test('le schéma de docs/ est généré depuis la source unique', () => {
  const fichier = JSON.parse(readFileSync(join(RACINE, 'docs/schemas/projet.schema.json'), 'utf8'));
  assert.deepEqual(fichier, JSON.parse(JSON.stringify(SCHEMA_PROJET)));
});
test('projet valide accepté', () => { const r = validerProjet(ok); assert.ok(r.ok, JSON.stringify(r.erreurs)); });
test('brouillon vide accepté en mode brouillon uniquement', () => {
  const v = projetVide({ id: 'abcdefgh-1', maintenant: '2026-01-01T00:00:00.000Z', appVersion: '1.0.0', graine: 'AB12-CD3' });
  assert.ok(validerProjet(v, { brouillon: true }).ok);
  assert.equal(validerProjet(v).ok, false);
});
const mut = (f) => { const c = structuredClone(ok); f(c); return validerProjet(c); };
const refus = [
  ['propriété inconnue à la racine', (p) => { p.admin = true; }],
  ['propriété inconnue dans entreprise', (p) => { p.entreprise.x = 1; }],
  ['version future', (p) => { p.schemaVersion = 2; }],
  ['nom trop court', (p) => { p.entreprise.nom = 'A'; }],
  ['nom trop long', (p) => { p.entreprise.nom = 'x'.repeat(41); }],
  ['couleur invalide', (p) => { p.identite.palette.principale = 'rouge'; }],
  ['couleur majuscules', (p) => { p.identite.palette.principale = '#FFAA00'; }],
  ['ambiance inconnue', (p) => { p.preferences.ambiances = ['sauvage']; }],
  ['trop d’ambiances', (p) => { p.preferences.ambiances = ['doux', 'joyeux', 'moderne', 'naturel']; }],
  ['disposition inconnue', (p) => { p.identite.logo.disposition = 'diagonale'; }],
  ['épaisseur hors bornes', (p) => { p.identite.logo.epaisseurTrait = 99; }],
  ['type de symbole inconnu', (p) => { p.identite.logo.symbole.type = 'image'; }],
  ['identifiant de symbole avec chemin', (p) => { p.identite.logo.symbole.id = '../../etc/passwd'; }],
  ['famille de marque inconnue', (p) => { p.identite.logo.symbole = { type: 'marque', id: 'dragon', params: {} }; }],
  ['paramètre non numérique', (p) => { p.identite.logo.symbole = { type: 'marque', id: 'etoile', params: { n: 'x' } }; }],
  ['neutres incomplets', (p) => { p.identite.palette.neutres = ['#000000']; }],
  ['id de projet invalide', (p) => { p.meta.id = '<script>'; }],
  ['date invalide', (p) => { p.meta.creeLe = 'hier'; }],
  ['texte trop long', (p) => { p.textes.slogan = 'x'.repeat(1501); }],
  ['produits trop nombreux', (p) => { p.entreprise.produits = new Array(9).fill('a'); }],
  ['source inconnue', (p) => { p.source = 'pirate'; }],
  ['identité absente', (p) => { delete p.identite; }]
];
for (const [nom, f] of refus) test(`refusé : ${nom}`, () => assert.equal(mut(f).ok, false));

test('pollution de prototype refusée', () => {
  const sale = JSON.parse(JSON.stringify(ok).replace('"entreprise":{', '"entreprise":{"__proto__":{"x":1},'));
  assert.equal(validerProjet(sale).ok, false);
  assert.equal({}.x, undefined);
  const r = validerProjet(JSON.parse('{"__proto__":{"admin":true}}'));
  assert.equal(r.ok, false); assert.equal({}.admin, undefined);
});
test('types faux et non-objets', () => {
  for (const v of [null, 5, 'x', [], undefined]) assert.equal(validerProjet(v).ok, false);
  assert.equal(mut((p) => { p.entreprise.nom = 42; }).ok, false);
});
test('nettoyage des caractères de contrôle dans les chaînes', () => {
  const r = mut((p) => { p.entreprise.mention = '  bougies\u0000\u202e artisanales  '; });
  assert.ok(r.ok);
  assert.equal(r.projet.entreprise.mention, 'bougies artisanales');
});
test('migration : ancien prototype régénéré, version future refusée', () => {
  const proto = { schemaVersion: 1, meta: { idKit: 'PV-1', modifieLe: '2026-10-13T10:00:00.000Z' }, entreprise: { nom: 'Studio Aube', mention: 'dépannage', activite: 'je répare des écrans', secteur: 'Services à la personne' }, preferences: { ambiances: ['rassurant'], couleur: 'Bleu' }, identite: { palSeed: 7, mark: 'x', layout: 'y', font: 'z' } };
  const { projet, notes } = migrer(proto, ctx);
  assert.ok(validerProjet(projet).ok, JSON.stringify(validerProjet(projet).erreurs));
  assert.equal(projet.entreprise.secteur, 'services-personne');
  assert.ok(notes.length === 1);
  assert.throws(() => migrer({ schemaVersion: 9 }, ctx), /plus récente/);
  assert.equal(migrer(ok, ctx).projet, ok);
});
