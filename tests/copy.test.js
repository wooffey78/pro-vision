import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerContexte, projetExemple } from './helpers.mjs';
import { genererTextes, MOTS_INTERDITS, tronquer, listeFr } from '../public/js/core/copy.js';

const ctx = chargerContexte();
const base = await projetExemple(ctx);

test('déterminisme', () => assert.deepEqual(genererTextes(base, ctx), genererTextes(base, ctx)));
test('aucun mot interdit (superlatifs, promesses) sur tous les secteurs et les deux registres', () => {
  for (const secteur of ctx.sectors.secteurs.map((s) => s.id).concat('autre')) for (const formalite of ['tu', 'vous']) for (const ambiances of [[], ['chaleureux', 'premium', 'audacieux']]) {
    const p = structuredClone(base);
    p.entreprise.secteur = secteur; p.preferences.formalite = formalite; p.preferences.ambiances = ambiances;
    const t = JSON.stringify(genererTextes(p, ctx)).toLowerCase();
    for (const m of MOTS_INTERDITS) assert.ok(!t.includes(m), `${secteur}/${formalite} : « ${m} »`);
    assert.ok(!/\d+\s?%/.test(t), 'pas de pourcentage promis');
  }
});
test('longueurs : slogans ≤ 70, fiche Google ≤ 750, bio Instagram ≤ 150, légendes ≤ 300', () => {
  for (const s of ctx.sectors.secteurs) {
    const p = structuredClone(base); p.entreprise.secteur = s.id; p.entreprise.activite = 'x'.repeat(160); p.entreprise.nom = 'N'.repeat(40);
    const t = genererTextes(p, ctx);
    assert.equal(t.slogans.length, 10);
    t.slogans.forEach((x) => assert.ok(x.length <= 70, x));
    assert.ok(t.google.length <= 750 && t.bio.instagram.length <= 150 && t.aPropos.court.length <= 280);
    Object.values(t.legendes).flat().forEach((x) => assert.ok(x.length <= 300));
    assert.equal(Object.keys(t.legendes).length, 9);
    Object.values(t.legendes).forEach((l) => assert.equal(l.length, 3));
    assert.equal(t.faq.length, 6);
  }
});
test('tu / vous', () => {
  const v = structuredClone(base); v.preferences.formalite = 'vous';
  const t = structuredClone(base); t.preferences.formalite = 'tu';
  assert.match(genererTextes(v, ctx).slogans[4], /pour vous/);
  assert.match(genererTextes(t, ctx).slogans[4], /pour toi/);
  assert.ok(!/\bvous\b/i.test(genererTextes(t, ctx).bienvenue));
});
test('champs vides : repères « À COMPLÉTER » plutôt que des inventions', () => {
  const p = structuredClone(base); p.entreprise.ville = ''; p.entreprise.email = '';
  const faq = genererTextes(p, ctx).faq;
  assert.ok(faq.some((x) => x.reponse.includes('À COMPLÉTER')));
});
test('utilitaires', () => {
  assert.equal(tronquer('un deux trois quatre', 12).endsWith('…'), true);
  assert.equal(tronquer('court', 12), 'court');
  assert.equal(listeFr(['a', 'b', 'c']), 'a, b et c');
});
