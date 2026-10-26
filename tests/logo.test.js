import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerContexte, chargerRessources, projetExemple, couleursSvg } from './helpers.mjs';
import { genererSerie } from '../public/js/core/generation.js';
import { genererVariantes, NOMS_VARIANTES } from '../public/js/core/variants.js';
import { composerLogo } from '../public/js/core/layouts.js';
import { nettoyerSvg } from '../public/js/core/svgSanitize.js';
import { avecFiligrane } from '../public/js/core/watermark.js';
import { appliquerCasse, initiales } from '../public/js/core/textToPath.js';
import { DISPOSITIONS, CONTENANTS } from '../public/js/core/layouts.js';

const ctx = chargerContexte();
const base = await projetExemple(ctx);
const entrees = [
  { nom: 'Studio Aube', mention: 'bougies artisanales' },
  { nom: 'Œuvre & Éclat', mention: '' },
  { nom: 'L’Atelier d’Ève', mention: 'céramique' },
  { nom: 'Zo', mention: 'x' },
  { nom: 'Très Long Nom De Société Artisanale Du Bocage', mention: 'une mention assez longue aussi' }
];

test('8 variantes pour des séries variées : SVG propres, rapport de nettoyage vide', async () => {
  let n = 0;
  for (const [i, e] of entrees.entries()) {
    const entreprise = { ...base.entreprise, ...e };
    const serie = genererSerie(ctx, entreprise, base.preferences, `T${i}AB-C${i}D`, {}, 6);
    for (const prop of serie) {
      const projet = { ...base, entreprise, identite: prop.identite };
      const res = await chargerRessources(projet, ctx);
      const v = genererVariantes(projet, res);
      assert.deepEqual(Object.keys(v).sort(), [...NOMS_VARIANTES].sort());
      for (const [nom, x] of Object.entries(v)) {
        const r = nettoyerSvg(x.svg);
        assert.ok(r.ok, `${nom} refusé`);
        assert.deepEqual(r.rapport, [], `${nom} : ${JSON.stringify(r.rapport)}`);
        assert.ok(x.largeur > 10 && x.hauteur > 10 && !x.svg.includes('NaN'), nom);
        assert.match(x.svg, /role="img"/);
        assert.deepEqual(x.avertissements, []);
        n++;
      }
    }
  }
  assert.ok(n >= 5 * 6 * 8 - 40);
});
test('mono-noir : uniquement #000000 (et none) ; mono-blanc : uniquement #ffffff', async () => {
  const serie = genererSerie(ctx, base.entreprise, base.preferences, 'MONO-001', {}, 6);
  for (const prop of serie) {
    const projet = { ...base, identite: prop.identite };
    const v = genererVariantes(projet, await chargerRessources(projet, ctx));
    for (const c of couleursSvg(v['mono-noir'].svg)) assert.ok(['#000000', 'none'].includes(c), `noir : ${c}`);
    for (const c of couleursSvg(v['mono-blanc'].svg)) assert.ok(['#ffffff', 'none'].includes(c), `blanc : ${c}`);
  }
});
test('déterminisme : mêmes entrées, même SVG', async () => {
  const res = await chargerRessources(base, ctx);
  assert.equal(genererVariantes(base, res).principal.svg, genererVariantes(base, res).principal.svg);
});
test('toutes les dispositions et tous les contenants se dessinent', async () => {
  const res = await chargerRessources(base, ctx);
  for (const disposition of DISPOSITIONS) for (const contenant of CONTENANTS) {
    const logo = { ...base.identite.logo, disposition, contenant };
    const r = composerLogo({ entreprise: base.entreprise, logo, palette: base.identite.palette, polices: res.polices, symboles: res.symboles });
    assert.ok(nettoyerSvg(r.svg).ok, `${disposition}/${contenant}`);
    assert.ok(r.largeur > 0);
  }
});
test('police absente : repli en <text> avec avertissement, jamais d’exception', () => {
  const r = composerLogo({ entreprise: base.entreprise, logo: base.identite.logo, palette: base.identite.palette, polices: { titres: null, texte: null }, symboles: {} });
  assert.ok(r.avertissements.length >= 1);
  assert.match(r.svg, /<text /);
  assert.ok(nettoyerSvg(r.svg).ok);
});
test('zone de protection : plus grande que le contenu nu', async () => {
  const res = await chargerRessources(base, ctx);
  const a = composerLogo({ entreprise: base.entreprise, logo: base.identite.logo, palette: base.identite.palette, polices: res.polices, symboles: res.symboles, protection: true });
  const b = composerLogo({ entreprise: base.entreprise, logo: base.identite.logo, palette: base.identite.palette, polices: res.polices, symboles: res.symboles, protection: false });
  assert.ok(a.largeur > b.largeur && a.marge > 4);
});
test('filigrane : ajouté à l’aperçu, présent après nettoyage, absent du logo livré', async () => {
  const res = await chargerRessources(base, ctx);
  const v = genererVariantes(base, res);
  assert.ok(!v.principal.svg.includes('data-filigrane'));
  const f = avecFiligrane(v.principal.svg, v.principal.largeur, v.principal.hauteur, false, 'pv-f-1');
  const net = nettoyerSvg(f);
  assert.ok(net.ok && net.svg.includes('data-filigrane="1"') && net.svg.includes('APERÇU'));
  assert.deepEqual(net.rapport, []);
});
test('casse et initiales', () => {
  assert.equal(appliquerCasse('Éclat', 'majuscules'), 'ÉCLAT');
  assert.equal(appliquerCasse('Éclat', 'minuscules'), 'éclat');
  assert.equal(initiales('Studio Aube'), 'SA');
  assert.equal(initiales('L’Atelier de la Lune'), 'AL');
  assert.equal(initiales('Zo'), 'Z');
});
