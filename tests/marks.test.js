import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILLES_MARQUES, construireMarque, parametresMarque } from '../public/js/core/marks.js';
import { creerPrng } from '../public/js/core/prng.js';

test('82 familles', () => assert.equal(FAMILLES_MARQUES.length, 82));
test('chaque famille : un seul chemin fermé, déterministe, dans le cadre 0–100', () => {
  for (const f of FAMILLES_MARQUES) {
    for (let s = 0; s < 40; s++) {
      const params = parametresMarque(f, creerPrng(`${f}${s}`));
      const m = construireMarque(f, params);
      assert.equal(m.d, construireMarque(f, params).d, `${f} non déterministe`);
      assert.ok(m.d.startsWith('M'));
      assert.equal((m.d.match(/M/g) || []).length, (m.d.match(/Z/g) || []).length, `${f} : sous-chemin non fermé`);
      assert.ok(!m.d.includes('NaN') && !m.d.includes('undefined'));
      assert.ok(['nonzero', 'evenodd'].includes(m.regle));
      assert.ok(m.d.length < 2500, `${f} trop lourd`);
      if (m.accent) assert.ok(m.accent.cx > 0 && m.accent.cx < 100 && m.accent.r > 0);
    }
  }
});
test('les points d’ancrage restent dans [0,100] (hors poignées de courbes)', () => {
  for (const f of FAMILLES_MARQUES) {
    const m = construireMarque(f, parametresMarque(f, creerPrng(`ancre${f}`)));
    const nombres = [...m.d.matchAll(/([MLC])([^MLCZ]*)/g)].flatMap(([, c, args]) => { const v = args.trim().split(/\s+/).map(Number); return c === 'C' ? v.slice(4) : v; });
    for (const n of nombres) assert.ok(n >= -0.5 && n <= 100.5, `${f} : ${n}`);
  }
});
test('paramètres hors bornes ou absents : valeurs sûres, pas d’exception', () => {
  for (const f of FAMILLES_MARQUES) assert.doesNotThrow(() => construireMarque(f, { n: 999, epaisseur: -4, amplitude: 'x' }));
  assert.throws(() => construireMarque('inconnue', {}));
});
