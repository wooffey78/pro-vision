import test from 'node:test';
import assert from 'node:assert/strict';
import { creerPrng } from '../public/js/core/prng.js';
import { genererPalette, verifierPalette, AMBIANCES, HARMONIES, variablesCss, tokensJson, formatsCouleur, descriptionPalette } from '../public/js/core/palette.js';
import { deltaE } from '../public/js/core/color.js';
import { ratioContraste } from '../public/js/core/contrast.js';

test('garanties de contraste : 12 ambiances × 500 graines, modes clair et sombre', () => {
  let n = 0;
  for (const a of AMBIANCES) {
    for (let s = 0; s < 500; s++) {
      const p = genererPalette({ ambiances: [a], prng: creerPrng(`${a}-${s}`) });
      const mauvais = verifierPalette(p).filter((c) => !c.ok);
      assert.deepEqual(mauvais, [], `${a} ${s}`);
      n++;
    }
  }
  assert.equal(n, 6000);
});
test('garanties précises (texte 7:1, atténué 4,5:1, principale 3:1, texte sur principale 4,5:1)', () => {
  for (let s = 0; s < 200; s++) {
    const p = genererPalette({ ambiances: [AMBIANCES[s % 12], AMBIANCES[(s + 5) % 12]], prng: creerPrng(`g${s}`) });
    for (const m of [p, p.sombre]) {
      assert.ok(ratioContraste(m.texte, m.fond) >= 7);
      assert.ok(ratioContraste(m.texteAttenue, m.fond) >= 4.5);
      assert.ok(ratioContraste(m.principale, m.fond) >= 3);
      assert.ok(ratioContraste(m.surPrincipale, m.principale) >= 4.5);
      assert.ok(ratioContraste(m.accent, m.fond) >= 3);
    }
  }
});
test('accent distinct de l’erreur, du succès et de la principale', () => {
  for (let s = 0; s < 300; s++) {
    const p = genererPalette({ ambiances: ['audacieux'], prng: creerPrng(`d${s}`) });
    for (const m of [p, p.sombre]) for (const r of ['erreur', 'succes', 'principale']) assert.ok(deltaE(m.accent, m[r]) >= 0.09, `${s} ${r}`);
  }
});
test('couleurs évitées respectées', () => {
  let ok = 0;
  for (let s = 0; s < 100; s++) {
    const evitee = '#2a4d8f';
    const p = genererPalette({ ambiances: ['sérieux'], couleursEvitees: [evitee], prng: creerPrng(`e${s}`) });
    if ([p.principale, p.secondaire, p.accent].every((c) => deltaE(c, evitee) >= 0.08)) ok++;
  }
  assert.ok(ok >= 95, `${ok}/100`);
});
test('couleur aimée : teinte de départ conservée', () => {
  const p = genererPalette({ couleursAimees: ['#b32a2a'], harmonie: 'analogue', prng: creerPrng('r') });
  assert.ok(deltaE(p.principale, '#b32a2a') < 0.25);
});
test('déterminisme et harmonies', () => {
  const a = genererPalette({ ambiances: ['chaleureux'], prng: creerPrng('k') });
  const b = genererPalette({ ambiances: ['chaleureux'], prng: creerPrng('k') });
  assert.deepEqual(a, b);
  for (const h of HARMONIES) assert.equal(genererPalette({ harmonie: h, prng: creerPrng(h) }).harmonie, h);
});
test('sorties : CSS, tokens, formats, description', () => {
  const p = genererPalette({ ambiances: ['doux'], prng: creerPrng('s') });
  const css = variablesCss(p);
  assert.match(css, /--couleur-principale: #[0-9a-f]{6};/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.equal(tokensJson(p).couleur.clair.principale.$type, 'color');
  assert.match(formatsCouleur(p.principale).oklch, /^oklch\(/);
  assert.match(descriptionPalette(p), /principale :/);
});
test('palette étendue : 8 couleurs, aucune en double avec les rôles ni entre elles', () => {
  for (let s = 0; s < 150; s++) {
    const p = genererPalette({ ambiances: [AMBIANCES[s % 12]], prng: creerPrng(`ext${s}`) });
    assert.equal(p.etendue.length, 8);
    const tous = [...p.etendue, p.principale, p.secondaire, p.accent, p.fond, p.texte, p.sombre.principale];
    for (let i = 0; i < tous.length; i++) for (let j = i + 1; j < tous.length; j++) assert.ok(deltaE(tous[i], tous[j]) >= 0.02, `s=${s} ${tous[i]} ≈ ${tous[j]}`);
  }
});
import { uniques } from '../public/js/ui/composants.js';
test('nuancier : une même couleur n’est jamais affichée deux fois (casse et quasi-identique)', () => {
  assert.deepEqual(uniques(['#AAAAAA', '#aaaaaa', '#aaaaab', '#c46b43']), ['#aaaaaa', '#c46b43']);
  for (let s = 0; s < 100; s++) {
    const p = genererPalette({ ambiances: [AMBIANCES[s % 12]], prng: creerPrng(`dd${s}`) });
    const liste = uniques([p.principale, p.secondaire, p.accent, p.fond, p.texte, ...p.etendue]);
    assert.equal(new Set(liste).size, liste.length);
  }
});
