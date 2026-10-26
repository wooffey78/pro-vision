// Test de bout en bout de l'interface dans jsdom : on charge le vrai index.html et le vrai app.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { PUBLIC } from './helpers.mjs';

const html = readFileSync(join(PUBLIC, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
const def = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
for (const k of ['window', 'document', 'location', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'Event']) def(k, k === 'window' ? window : window[k] ?? globalThis[k]);
def('navigator', window.navigator);
window.scrollTo = () => {};
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.document.fonts = { check: () => true, add() {} };
def('FontFace', class { constructor() {} load() { return Promise.resolve(this); } });
const erreursConsole = [];
const ancienErreur = console.error; console.error = (...a) => { erreursConsole.push(a.map(String).join(' ')); };
def('fetch', async (url) => {
  const chemin = join(PUBLIC, String(url).split('?')[0]);
  try {
    const buf = readFileSync(chemin);
    return { ok: true, status: 200, json: async () => JSON.parse(buf.toString('utf8')), text: async () => buf.toString('utf8'), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  } catch { return { ok: false, status: 404, json: async () => ({}), text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }; }
});
await import('../public/js/app.js');

const attendre = async (cond, ms = 15000, msg = 'condition') => { const t0 = Date.now(); for (;;) { const v = cond(); if (v) return v; if (Date.now() - t0 > ms) throw new Error(`délai dépassé : ${msg}`); await new Promise((r) => setTimeout(r, 25)); } };
const $ = (s) => window.document.querySelector(s);
const $$ = (s) => [...window.document.querySelectorAll(s)];
const aller = async (hash, titre) => { window.location.hash = hash; await attendre(() => { const h = $('#contenu h1'); return h && (!titre || h.textContent.includes(titre)); }, 15000, `écran ${hash}`); };
const saisir = (el, v) => { el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
const cliquer = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const bouton = (texte) => $$('#contenu button, #contenu a.bouton').find((b) => b.textContent.includes(texte));
const soumettre = (form) => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

await attendre(() => $('#contenu h1'), 15000, 'démarrage');

test('accueil : promesses visibles, aucune erreur de console au démarrage', () => {
  assert.match($('#contenu h1').textContent, /identité visuelle/);
  assert.equal($$('#contenu .carte').length, 3);
  assert.deepEqual(erreursConsole, []);
});
test('étape 1 : erreur accessible si le nom est vide', async () => {
  await aller('#/etape/1', 'Votre entreprise');
  soumettre($('#contenu form'));
  const resume = await attendre(() => $('.resume-erreurs'), 3000, 'résumé');
  assert.equal(resume.getAttribute('role'), 'alert');
  assert.equal($('#contenu input[name]').getAttribute('aria-invalid'), 'true');
  assert.ok($('#contenu input').getAttribute('aria-describedby'));
});
test('parcours complet jusqu’aux propositions, aux variantes et à la livraison', async () => {
  const nom = $('#contenu input');
  saisir(nom, 'Studio Aube');
  saisir($('#contenu textarea'), 'je fabrique des bougies parfumées');
  soumettre($('#contenu form'));
  await attendre(() => $('#contenu h1').textContent.includes('Votre offre'), 5000, 'étape 2');
  assert.equal($$('#contenu select option').length, 18);
  soumettre($('#contenu form'));
  await attendre(() => $('#contenu h1').textContent.includes('Votre style'), 5000, 'étape 3');
  const cases = $$('#contenu input[type=checkbox]');
  for (const c of cases.slice(0, 3)) { c.checked = true; c.dispatchEvent(new window.Event('change', { bubbles: true })); }
  assert.equal($$('#contenu input[type=checkbox]:disabled').length, cases.length - 3, 'limite de 3 ambiances');
  soumettre($('#contenu form'));
  await attendre(() => $('#contenu h1').textContent.includes('Vos couleurs'), 5000, 'étape 4');
  soumettre($('#contenu form'));
  await attendre(() => $('#contenu h1').textContent.includes('coordonnées'), 5000, 'étape 5');
  saisir($('#contenu input[type=email]'), 'pas-un-mail');
  soumettre($('#contenu form'));
  assert.ok(await attendre(() => $('.resume-erreurs'), 3000, 'erreur e-mail'));
  saisir($('#contenu input[type=email]'), 'bonjour@exemple.fr');
  soumettre($('#contenu form'));
  await attendre(() => $$('.proposition').length === 9, 20000, '9 propositions');
  for (const c of $$('.proposition')) {
    const svg = c.querySelector('svg');
    assert.ok(svg && svg.getAttribute('role') === 'img' && svg.getAttribute('aria-label'), 'logo décrit');
    assert.ok(svg.querySelector('[data-filigrane="1"]'), 'filigrane présent dans l’aperçu');
    assert.equal(c.querySelectorAll('script, foreignObject, image').length, 0);
    assert.match(c.textContent, /[0-9A-Z]{4}-[0-9A-Z]{3}/);
  }
  cliquer(bouton('Choisir la proposition 2'));
  await attendre(() => $('#contenu h1').textContent.includes('Validation'), 5000, 'validation');
  assert.equal($$('.variantes li').length, 8);
  assert.ok($$('.tableau td.ok').length > 10 && $$('.tableau td.ko').length === 0, 'contrastes tous conformes');
  cliquer($$('#contenu a.bouton').find((a) => a.textContent.includes('Confirmer')));
  await attendre(() => $('#contenu h1').textContent.includes('Votre kit'), 5000, 'livraison');
  assert.ok(bouton('Créer et télécharger mon kit'));
  assert.deepEqual(erreursConsole, []);
});
test('le projet est enregistré localement et valide', async () => {
  await new Promise((r) => setTimeout(r, 500));
  const brut = window.localStorage.getItem('provision:projet');
  assert.ok(brut);
  const p = JSON.parse(brut);
  assert.equal(p.entreprise.nom, 'Studio Aube'); assert.ok(p.identite.palette.principale);
  assert.equal(window.localStorage.getItem('autre'), null);
});
test('retouches : changer la disposition modifie l’aperçu', async () => {
  await aller('#/retouches', 'Retouches');
  await attendre(() => $('#contenu .apercu-colle svg'), 8000, 'aperçu');
  const avant = $('#contenu .apercu-colle svg').outerHTML;
  const sel = $('#r-disp'); sel.value = sel.value === 'nom-seul' ? 'symbole-dessus' : 'nom-seul'; sel.dispatchEvent(new window.Event('change', { bubbles: true }));
  await attendre(() => $('#contenu .apercu-colle svg') && $('#contenu .apercu-colle svg').outerHTML !== avant, 8000, 'aperçu mis à jour');
  const c = $('#r-couleur'); c.value = '#b32a2a'; c.dispatchEvent(new window.Event('change', { bubbles: true }));
  await attendre(() => /[0-9a-f]{6}/.test($('#contenu .apercu-colle').textContent), 8000, 'couleurs');
});
test('XSS : un nom hostile est affiché comme du texte', async () => {
  await aller('#/etape/1', 'Votre entreprise');
  saisir($('#contenu input'), '<img src=x onerror=alert(1)><script>alert(2)</script>');
  await aller('#/etape/6', 'propositions');
  await attendre(() => $$('.proposition').length >= 1, 20000, 'propositions');
  assert.equal($$('img[onerror], #contenu script').length, 0);
  assert.equal($$('#contenu [onerror], #contenu [onclick]').length, 0);
  assert.equal($$('#contenu svg script').length, 0);
});
test('passerelle : données valides prévisualisées, données hostiles refusées', async () => {
  const charge = Buffer.from(JSON.stringify({ v: 1, source: 'vyraty', entreprise: { nom: 'Café du Port', ville: 'Challans' } })).toString('base64url');
  await aller(`#/import/${charge}`, 'Informations reçues');
  assert.match($('#contenu dl').textContent, /Café du Port/);
  cliquer(bouton('Utiliser ces informations'));
  await aller('#/etape/1', 'Votre entreprise');
  assert.equal($('#contenu input').value, 'Café du Port');
  await aller(`#/import/${Buffer.from('{"v":1,"source":"pirate","entreprise":{"nom":"x"}}').toString('base64url')}`, 'Informations reçues');
  assert.ok($('#contenu .alerte.erreur'));
});
test('pages secondaires : suite, avis, IA, retour accueil', async () => {
  await aller('#/suite', 'Et maintenant');
  assert.ok($$('#contenu a[target=_blank]').every((a) => a.rel.includes('noopener')));
  await aller('#/avis', 'Votre avis');
  await aller('#/ia', 'IA');
  assert.match($('#contenu').textContent, /sans intelligence artificielle/);
  await aller('#/inconnu', 'identité visuelle');
  assert.equal(window.document.title.endsWith('Pro-vision'), true);
});
test.after(() => { console.error = ancienErreur; setTimeout(() => process.exit(0), 100).unref(); });
