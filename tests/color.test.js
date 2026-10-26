import test from 'node:test';
import assert from 'node:assert/strict';
import { hexVersOklch, oklchVersHex, hexVersHsl, hexVersCmjn, nomCouleur, deltaE, hexVersRgb, rgbVersHex } from '../public/js/core/color.js';
import { ratioContraste, luminance, ajusterContraste, niveauWcag, meilleurTexteSur } from '../public/js/core/contrast.js';

const proche = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('valeurs OKLCH de référence (Ottosson)', () => {
  const [Lr, Cr, Hr] = hexVersOklch('#ff0000');
  proche(Lr, 0.628, 0.002); proche(Cr, 0.258, 0.002); proche(Hr, 29.2, 0.3);
  const [Lg, , Hg] = hexVersOklch('#00ff00'); proche(Lg, 0.866, 0.002); proche(Hg, 142.5, 0.3);
  const [Lb, , Hb] = hexVersOklch('#0000ff'); proche(Lb, 0.452, 0.002); proche(Hb, 264.05, 0.3);
  assert.deepEqual(hexVersOklch('#ffffff').map((v) => Math.round(v * 1000) / 1000), [1, 0, 0]);
  assert.equal(hexVersOklch('#000000')[0], 0);
});
test('aller-retour hex → OKLCH → hex', () => {
  for (const hex of ['#1f3a5f', '#b8780a', '#2e6b4f', '#c2557f', '#808080', '#fbfaf7']) {
    const [L, C, H] = hexVersOklch(hex);
    const retour = oklchVersHex(L, C, H);
    assert.ok(deltaE(hex, retour) < 0.004, `${hex} → ${retour}`);
  }
});
test('gamut : un chroma impossible est réduit, jamais de hex invalide', () => {
  for (let h = 0; h < 360; h += 15) assert.match(oklchVersHex(0.7, 0.5, h), /^#[0-9a-f]{6}$/);
  assert.match(oklchVersHex(1.4, 0.1, 10), /^#[0-9a-f]{6}$/);
});
test('hex invalide refusé', () => { assert.throws(() => hexVersRgb('rouge')); assert.equal(rgbVersHex([300, -5, 0.4]), '#ff0000'); });
test('HSL, CMJN indicatif et noms', () => {
  assert.deepEqual(hexVersHsl('#ff0000'), [0, 100, 50]);
  assert.deepEqual(hexVersCmjn('#000000'), [0, 0, 0, 100]);
  assert.deepEqual(hexVersCmjn('#ffffff'), [0, 0, 0, 0]);
  assert.equal(nomCouleur('#ffffff'), 'Blanc');
  assert.equal(nomCouleur('#0f1b33'), 'Bleu foncé');
  assert.equal(nomCouleur('#c46b43'), 'Orange');
});
test('contraste WCAG : valeurs connues', () => {
  proche(ratioContraste('#000000', '#ffffff'), 21, 0.001);
  proche(ratioContraste('#767676', '#ffffff'), 4.54, 0.01);
  assert.equal(ratioContraste('#123456', '#123456'), 1);
  assert.equal(luminance('#ffffff'), 1);
  assert.equal(niveauWcag(7.1), 'AAA'); assert.equal(niveauWcag(4.6), 'AA'); assert.equal(niveauWcag(3), 'insuffisant');
  assert.equal(meilleurTexteSur('#0f1b33'), '#ffffff'); assert.equal(meilleurTexteSur('#fff3d6'), '#10151b');
});
test('ajusterContraste atteint le minimum en gardant la teinte', () => {
  const r = ajusterContraste('#9bb8ff', ['#ffffff'], 4.5, 'sombre');
  assert.ok(r.ok && ratioContraste(r.hex, '#ffffff') >= 4.5);
  const [, , h0] = hexVersOklch('#9bb8ff'); const [, , h1] = hexVersOklch(r.hex);
  assert.ok(Math.abs(h0 - h1) < 6);
  assert.equal(ajusterContraste('#777777', ['#808080'], 21, 'sombre').ok, false);
});
import { GAMME_CHOIX } from '../public/js/core/color.js';
test('gamme de choix : au moins 60 couleurs, deux à deux distinctes (ΔE ≥ 0,045)', () => {
  assert.ok(GAMME_CHOIX.length >= 60, `${GAMME_CHOIX.length} couleurs`);
  assert.equal(new Set(GAMME_CHOIX).size, GAMME_CHOIX.length);
  for (let i = 0; i < GAMME_CHOIX.length; i++) for (let j = i + 1; j < GAMME_CHOIX.length; j++) assert.ok(deltaE(GAMME_CHOIX[i], GAMME_CHOIX[j]) >= 0.045, `${GAMME_CHOIX[i]} ≈ ${GAMME_CHOIX[j]}`);
});
