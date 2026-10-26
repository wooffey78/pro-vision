import test from 'node:test';
import assert from 'node:assert/strict';
import { creerPrng, genererCode, normaliserCode, deriverCode, hacher } from '../public/js/core/prng.js';

test('même graine, même suite', () => {
  const a = creerPrng('graine');
  const b = creerPrng('graine');
  for (let i = 0; i < 50; i++) assert.equal(a.suivant(), b.suivant());
});
test('graines différentes, suites différentes', () => {
  assert.notEqual(creerPrng('a').suivant(), creerPrng('b').suivant());
});
test('valeurs dans [0,1[ et distribution plausible', () => {
  const p = creerPrng('x');
  let somme = 0;
  for (let i = 0; i < 20000; i++) { const v = p.suivant(); assert.ok(v >= 0 && v < 1); somme += v; }
  assert.ok(Math.abs(somme / 20000 - 0.5) < 0.02);
});
test('entier, choix, melanger, choixPondere', () => {
  const p = creerPrng('y');
  for (let i = 0; i < 500; i++) { const n = p.entier(3, 7); assert.ok(n >= 3 && n <= 7); }
  assert.ok(['a', 'b'].includes(p.choix(['a', 'b'])));
  assert.deepEqual(creerPrng('z').melanger([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
  const compte = { a: 0, b: 0 };
  const q = creerPrng('w');
  for (let i = 0; i < 4000; i++) compte[q.choixPondere(['a', 'b'], [9, 1])]++;
  assert.ok(compte.a > compte.b * 5);
  assert.throws(() => p.choix([]));
});
test('code lisible : format, normalisation, confusions', () => {
  const c = genererCode(creerPrng('code'));
  assert.match(c, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{3}$/);
  assert.equal(normaliserCode(c.toLowerCase().replace('-', ' ')), c);
  assert.equal(normaliserCode('k7m2 9qx'), 'K7M2-9QX');
  assert.equal(normaliserCode('KOM1-ILX'), 'K0M1-11X');
  assert.equal(normaliserCode('trop-long-code'), null);
  assert.equal(normaliserCode('ÉÉÉÉ-ÉÉÉ'), null);
  assert.equal(normaliserCode(null), null);
});
test('codes dérivés stables et distincts', () => {
  assert.equal(deriverCode('AB12-CD3', 2), deriverCode('AB12-CD3', 2));
  assert.notEqual(deriverCode('AB12-CD3', 2), deriverCode('AB12-CD3', 3));
  assert.equal(typeof hacher('x'), 'number');
});
