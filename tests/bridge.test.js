import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerContexte, projetExemple } from './helpers.mjs';
import { lireFragment, construireLien, LIMITE_FRAGMENT } from '../public/js/services/bridge.js';

const ctx = chargerContexte();
const projet = await projetExemple(ctx);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const cfg = { apps: [{ id: 'vyraty', nom: 'VYRATY', baseUrl: 'https://vyraty.example', actif: true }, { id: 'aurion', nom: 'AURION', baseUrl: '', actif: false }, { id: 'x', nom: 'X', baseUrl: 'http://clair.example', actif: true }, { id: 'p', nom: 'P', baseUrl: 'https://[A_RENSEIGNER]', actif: true }] };

test('aller-retour : lien construit puis relu', () => {
  const lien = construireLien(cfg, 'vyraty', projet);
  assert.match(lien, /^https:\/\/vyraty\.example\/#\/import\/[A-Za-z0-9_-]+$/);
  const r = lireFragment(lien.slice(lien.indexOf('#')));
  assert.ok(r.ok, r.erreur);
  assert.equal(r.charge.entreprise.nom, 'Studio Aube');
  assert.equal(r.charge.source, 'provision');
  assert.match(r.charge.couleurPrincipale, /^#[0-9a-f]{6}$/);
});
test('accents et caractères spéciaux conservés', () => {
  const p = structuredClone(projet); p.entreprise.nom = 'Œuvre & Éclat — 日本';
  const lien = construireLien(cfg, 'vyraty', p);
  assert.equal(lireFragment(lien.slice(lien.indexOf('#'))).charge.entreprise.nom, 'Œuvre & Éclat — 日本');
});
test('liens refusés : application inactive, adresse non renseignée, http clair, inconnue', () => {
  for (const id of ['aurion', 'p', 'x', 'inconnue']) assert.equal(construireLien(cfg, id, projet), null, id);
});
test('fragments invalides', () => {
  const cas = ['', '#/accueil', '#/import/', '#/import/!!!', `#/import/${'A'.repeat(LIMITE_FRAGMENT + 1)}`, '#/import/bm90LWpzb24', `#/import/${b64({ v: 1, source: 'pirate', entreprise: { nom: 'Abc' } })}`, `#/import/${b64({ v: 1, source: 'vyraty', entreprise: { nom: 'A' } })}`, `#/import/${b64({ v: 1, source: 'vyraty', entreprise: { nom: 'Abc', evil: 1 } })}`, `#/import/${b64({ v: 2, source: 'vyraty', entreprise: { nom: 'Abc' } })}`, `#/import/${b64({ v: 1, source: 'vyraty', entreprise: { nom: 'Abc' }, couleurPrincipale: 'red' })}`, `#/import/${b64({ v: 1, source: 'vyraty', entreprise: { nom: 'Abc' }, __proto__x: 1 })}`, `#/import/${Buffer.from([0xff, 0xfe]).toString('base64url')}`];
  for (const c of cas) assert.equal(lireFragment(c).ok, false, c.slice(0, 40));
  assert.equal(lireFragment(`#/import/${b64({ v: 1, source: 'vyraty', entreprise: { nom: 'Abc' } })}`).ok, true);
});
