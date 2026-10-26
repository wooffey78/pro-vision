import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nettoyerSvg, LIMITES_SVG } from '../public/js/core/svgSanitize.js';
import { creerPrng } from '../public/js/core/prng.js';

const hostiles = JSON.parse(readFileSync(new URL('./fixtures/svg-hostiles.json', import.meta.url), 'utf8'));
const INTERDITS = ['script', 'javascript', 'onload', 'onclick', 'onmouseover', 'foreignobject', 'iframe', '<object', '<embed', 'evil', 'data:', '<style', '<image', '<animate', '<set', ' style=', 'formaction', 'expression(', 'xlink', '<a ', '<a>', '\u202e'];

const verifierSortie = (nom, r) => {
  if (!r.ok) return;
  // Le texte affiché (contenu de <text>) est inoffensif : on contrôle la structure (balises et attributs).
  const bas = r.svg.replace('http://www.w3.org/2000/svg', '').replace(/>[^<]*</g, '><').toLowerCase();
  for (const mot of INTERDITS) assert.ok(!bas.includes(mot), `${nom} : « ${mot} » subsiste dans la sortie`);
  assert.ok(r.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
};

test(`${hostiles.length} SVG hostiles : refusés ou entièrement neutralisés`, () => {
  assert.ok(hostiles.length >= 30);
  for (const f of hostiles) {
    const r = nettoyerSvg(f.svg);
    if (f.refus) assert.equal(r.ok, false, `${f.nom} aurait dû être refusé`);
    verifierSortie(f.nom, r);
  }
});
test('les éléments retirés sont signalés dans le rapport', () => {
  const r = nettoyerSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>x</script><rect onclick="x" width="1" height="1"/></svg>');
  assert.ok(r.ok);
  assert.ok(r.rapport.some((x) => x.detail.includes('script')));
  assert.ok(r.rapport.some((x) => x.detail.includes('onclick')));
});
test('un SVG légitime traverse sans modification de contenu', () => {
  const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Logo"><title>Logo</title><defs><linearGradient id="g"><stop offset="0" stop-color="#ff0000"/></linearGradient><pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#000000"/></pattern></defs><g transform="translate(1 2)"><path d="M0 0L10 10Z" fill="url(#g)" fill-rule="evenodd"/><circle cx="5" cy="5" r="2" fill="url(#p)"/><text x="1" y="2" font-family="serif">Éa &amp; b</text><use href="#g"/></g></svg>';
  const r = nettoyerSvg(src);
  assert.ok(r.ok); assert.deepEqual(r.rapport, []); assert.equal(r.svg, src);
});
test('idempotence : nettoyer deux fois donne le même résultat', () => {
  for (const f of hostiles) { const a = nettoyerSvg(f.svg); if (a.ok) assert.equal(nettoyerSvg(a.svg).svg, a.svg, f.nom); }
});
test('limites : taille, nombre de nœuds', () => {
  const gros = '<svg xmlns="http://www.w3.org/2000/svg"><path d="' + 'M0 0'.repeat(60000) + '"/></svg>';
  assert.ok(gros.length > LIMITES_SVG.octets); assert.equal(nettoyerSvg(gros).ok, false);
  const noeuds = '<svg xmlns="http://www.w3.org/2000/svg">' + '<rect/>'.repeat(LIMITES_SVG.noeuds + 10) + '</svg>';
  assert.equal(nettoyerSvg(noeuds).ok, false);
});
test('fuzz : 3000 mutations aléatoires, jamais d’exception ni de sortie dangereuse', () => {
  const base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g fill="#000000"><rect width="5" height="5" onclick="x"/><path d="M0 0L5 5"/><text>a</text></g><script>alert(1)</script></svg>';
  const morceaux = ['<script>', '</', '<!', '&#', 'on', '=', '"', "'", '<', '>', 'javascript:', 'url(', ' href=', '<use ', '<style>', '\u0000', 'data:'];
  const p = creerPrng('fuzz');
  for (let i = 0; i < 3000; i++) {
    let s = base;
    for (let k = 0; k < 1 + p.entier(0, 3); k++) {
      const pos = p.entier(0, s.length);
      s = p.pile(0.5) ? s.slice(0, pos) + p.choix(morceaux) + s.slice(pos) : s.slice(0, pos) + s.slice(pos + p.entier(1, 8));
    }
    let r;
    assert.doesNotThrow(() => { r = nettoyerSvg(s); });
    verifierSortie(`fuzz ${i}`, r);
  }
});
