import test from 'node:test';
import assert from 'node:assert/strict';
import { creerStockage, CLES } from '../public/js/services/storage.js';

const faux = (quota = Infinity) => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { if ([...m.values()].join('').length + v.length > quota) throw new Error('quota'); m.set(k, v); }, removeItem: (k) => m.delete(k), get length() { return m.size; }, key: (i) => [...m.keys()][i], _m: m, ...Object.fromEntries([]) }; };
const avecCles = (ls) => new Proxy(ls, { ownKeys: () => [...ls._m.keys()], getOwnPropertyDescriptor: (t, k) => (ls._m.has(k) ? { enumerable: true, configurable: true, value: 1 } : Reflect.getOwnPropertyDescriptor(t, k)) });

test('écriture / lecture / suppression avec localStorage', async () => {
  const ls = faux(); const s = creerStockage({ localStorage: ls });
  assert.deepEqual(await s.ecrire(CLES.projet, { a: 1 }), { ok: true, persistant: true });
  assert.deepEqual(await s.lire(CLES.projet), { a: 1 });
  await s.supprimer(CLES.projet);
  assert.equal(await s.lire(CLES.projet), null);
});
test('sans localStorage : repli mémoire', async () => {
  const s = creerStockage({});
  assert.equal(s.persistant, false);
  assert.equal((await s.ecrire(CLES.prefs, { x: 2 })).ok, true);
  assert.deepEqual(await s.lire(CLES.prefs), { x: 2 });
});
test('quota dépassé : bascule en mémoire sans perdre la donnée', async () => {
  const s = creerStockage({ localStorage: faux(10) });
  const r = await s.ecrire(CLES.projet, { long: 'x'.repeat(100) });
  assert.deepEqual(r, { ok: true, persistant: false });
  assert.deepEqual(await s.lire(CLES.projet), { long: 'x'.repeat(100) });
});
test('JSON corrompu : null, pas d’exception', async () => {
  const ls = faux(); ls.setItem(CLES.projet, '{pas du json');
  assert.equal(await creerStockage({ localStorage: ls }).lire(CLES.projet), null);
});
test('valeur démesurée refusée', async () => {
  assert.equal((await creerStockage({}).ecrire(CLES.projet, 'x'.repeat(3 * 1024 * 1024))).ok, false);
});
test('toutEffacer ne touche que les clés provision:', async () => {
  const ls = faux(); ls.setItem('autre:cle', '1'); ls.setItem(CLES.projet, '{}');
  const s = creerStockage({ localStorage: avecCles(ls) });
  await s.toutEffacer();
  assert.equal(ls.getItem('autre:cle'), '1'); assert.equal(ls.getItem(CLES.projet), null);
});
