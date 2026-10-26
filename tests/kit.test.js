import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chargerContexte, chargerRessources, projetExemple } from './helpers.mjs';
import { construireKit, textesFinaux } from '../public/js/core/kit.js';
import { creerZip } from '../public/js/services/zip.js';
import { lireKit } from '../public/js/services/zipRead.js';
import { validerProjet } from '../public/js/core/schema.js';
import { nettoyerSvg } from '../public/js/core/svgSanitize.js';
import * as fflate from '../public/vendor/fflate/fflate.js';

const ctx = chargerContexte();
const projet = await projetExemple(ctx);
const ressources = await chargerRessources(projet, ctx);
const faussePng = async (svg, w, h) => { const o = new Uint8Array(24); o.set([137, 80, 78, 71, 13, 10, 26, 10]); new DataView(o.buffer).setUint32(16, w || 1); new DataView(o.buffer).setUint32(20, h || 1); return o; };
const kit = await construireKit(projet, ressources, ctx, { rasterize: faussePng, version: '1.0.0' });
const f = kit.fichiers;
const noms = Object.keys(f);
const texte = (n) => (typeof f[n] === 'string' ? f[n] : new TextDecoder().decode(f[n]));

test('arborescence attendue présente, rien d’autre à la racine', () => {
  const requis = ['00-LISEZ-MOI.html', 'PROVENANCE.txt', 'licence.json', 'manifest.json', 'projet.json', '06-charte-graphique.html',
    '01-strategie/positionnement.html', '01-strategie/cibles.html', '01-strategie/valeurs-et-ton.html',
    '02-nom/nom-retenu.html', '02-nom/alternatives.html', '02-nom/verifications.html',
    '03-logo/zone-de-protection.svg', '03-logo/favicon/favicon.svg', '03-logo/favicon/favicon.ico', '03-logo/favicon/apple-touch-icon.png',
    '04-couleurs/palette.json', '04-couleurs/tokens.json', '04-couleurs/variables.css', '04-couleurs/palette.html', '04-couleurs/contrastes.html',
    '05-typographies/fonts.css', '05-typographies/guide-typo.html',
    '07-papeterie/carte-de-visite-recto.svg', '07-papeterie/carte-de-visite-verso-impression.svg', '07-papeterie/papier-a-en-tete.svg', '07-papeterie/signature-email.html', '07-papeterie/signature-email.txt', '07-papeterie/devis.html', '07-papeterie/facture.html', '07-papeterie/etiquettes.svg',
    '08-reseaux-sociaux/profil.svg', '08-reseaux-sociaux/banniere-linkedin.svg', '08-reseaux-sociaux/partage.svg',
    '09-site-web/index.html', '09-site-web/style.css', '09-site-web/personnaliser.js', '09-site-web/robots.txt', '09-site-web/sitemap.xml',
    '10-textes/slogans.txt', '10-textes/a-propos.txt', '10-textes/google-business.txt', '10-textes/bios-reseaux.txt', '10-textes/legendes-reseaux.txt', '10-textes/faq.txt', '10-textes/message-bienvenue.txt',
    '11-lancer-sa-marque/checklist-7-jours.html'];
  for (const r of requis) assert.ok(noms.includes(r), `manquant : ${r}`);
  for (const v of ['principal', 'horizontal', 'vertical', 'icone', 'mono-noir', 'mono-blanc', 'fond-sombre', 'favicon']) {
    assert.ok(noms.includes(`03-logo/svg/${v}.svg`));
    if (v !== 'favicon') for (const w of [512, 1024, 2048]) assert.ok(noms.includes(`03-logo/png/${v}-${w}.png`), `${v}-${w}`);
  }
  assert.equal(noms.filter((n) => n.startsWith('08-reseaux-sociaux/post-')).length, 9);
  const racines = new Set(noms.map((n) => n.split('/')[0]));
  const permis = new Set(['00-LISEZ-MOI.html', 'PROVENANCE.txt', 'licence.json', 'manifest.json', 'projet.json', '06-charte-graphique.html', '01-strategie', '02-nom', '03-logo', '04-couleurs', '05-typographies', '07-papeterie', '08-reseaux-sociaux', '09-site-web', '10-textes', '11-lancer-sa-marque']);
  for (const r of racines) assert.ok(permis.has(r), `élément inattendu : ${r}`);
  assert.deepEqual(kit.avertissements, []);
});
test('manifeste : chaque fichier est listé avec le bon SHA-256', () => {
  const m = JSON.parse(texte('manifest.json'));
  const listes = new Set(m.fichiers.map((x) => x.chemin));
  assert.deepEqual([...listes].sort(), noms.filter((n) => n !== 'manifest.json').sort());
  for (const x of m.fichiers) {
    const octets = typeof f[x.chemin] === 'string' ? new TextEncoder().encode(f[x.chemin]) : f[x.chemin];
    assert.equal(x.sha256, createHash('sha256').update(octets).digest('hex'), x.chemin);
    assert.equal(x.octets, octets.length);
  }
});
test('tous les SVG du kit sont propres et sans filigrane', () => {
  for (const n of noms.filter((x) => x.endsWith('.svg'))) {
    const r = nettoyerSvg(texte(n));
    assert.ok(r.ok, n);
    assert.deepEqual(r.rapport, [], n);
    assert.ok(!texte(n).includes('data-filigrane') && !texte(n).includes('APERÇU'), `filigrane dans ${n}`);
  }
});
test('HTML : lang, titre, aucune ressource externe ni script distant', () => {
  const ok = ['data.inpi.fr', 'www.tmdn.org', 'www.afnic.fr', 'formalites.entreprises.gouv.fr', 'www.service-public.fr', 'www.w3.org', 'schema.org', 'www.sitemaps.org', 'openfontlicense.org', 'json-schema.org', 'exemple.fr'];
  for (const n of noms.filter((x) => x.endsWith('.html'))) {
    const t = texte(n);
    assert.match(t, /<html lang="fr">/, n);
    assert.match(t, /<title>[^<]+<\/title>/, n);
    assert.ok(!/<script[^>]+src="https?:/.test(t) && !/<link[^>]+href="https?:/.test(t) && !/<img[^>]+src="https?:/.test(t), n);
    for (const m of t.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) assert.ok(ok.includes(m[1]), `${n} : ${m[1]}`);
    for (const mot of ['googleapis', 'gstatic', 'cdn.', 'cloudflare', 'unpkg']) assert.ok(!t.includes(mot), `${n} : ${mot}`);
  }
});
test('contenu : nom échappé, repères « À COMPLÉTER », avertissements d’antériorité', () => {
  const p = structuredClone(projet); p.entreprise.nom = 'A<b>&"\'C';
  return construireKit(p, ressources, ctx, { version: '1.0.0' }).then((k) => {
    for (const [n, c] of Object.entries(k.fichiers)) if (/\.(html|svg|xml)$/.test(n)) assert.ok(!String(typeof c === 'string' ? c : '').includes('<b>'), `${n} : nom non échappé`);
  });
});
test('Lisez-moi et vérifications rappellent qu’aucune vérification n’a été faite', () => {
  assert.match(texte('00-LISEZ-MOI.html'), /Aucune vérification d'antériorité/);
  assert.match(texte('02-nom/verifications.html'), /aucune disponibilité n'a été vérifiée/);
  assert.match(texte('licence.json'), /sans garantie/);
});
test('projet.json du kit : valide et relisible (aller-retour ZIP)', async () => {
  assert.ok(validerProjet(JSON.parse(texte('projet.json'))).ok);
  const zip = creerZip(fflate, f);
  const r = await lireKit(fflate, zip, ctx.app.limites);
  assert.deepEqual(r.projet, JSON.parse(texte('projet.json')));
  assert.deepEqual(r.avertissements, []);
});
test('déterminisme : deux constructions donnent le même ZIP, octet pour octet', async () => {
  const k2 = await construireKit(projet, ressources, ctx, { rasterize: faussePng, version: '1.0.0' });
  const a = creerZip(fflate, f); const b = creerZip(fflate, k2.fichiers);
  assert.equal(createHash('sha256').update(a).digest('hex'), createHash('sha256').update(b).digest('hex'));
});
test('textes modifiés par la personne repris dans le kit', async () => {
  const p = structuredClone(projet); p.textes = { slogan: 'Mon slogan à moi.', google: 'Ma fiche.' };
  const k = await construireKit(p, ressources, ctx, { version: '1.0.0' });
  assert.match(k.fichiers['10-textes/slogans.txt'], /1\. Mon slogan à moi\./);
  assert.equal(k.fichiers['10-textes/google-business.txt'], 'Ma fiche.\n');
  assert.equal(textesFinaux(p, ctx).slogans[0], 'Mon slogan à moi.');
});
test('sans rasteriseur : pas de PNG, signature en SVG, aucun avertissement bloquant', async () => {
  const k = await construireKit(projet, ressources, ctx, { version: '1.0.0' });
  assert.ok(!Object.keys(k.fichiers).some((n) => n.endsWith('.png')));
  assert.match(k.fichiers['07-papeterie/signature-email.html'], /logo-signature\.svg/);
});
test('polices : WOFF2 + licence OFL dans le kit, @font-face relatifs', () => {
  assert.ok(noms.some((n) => n.startsWith('05-typographies/polices/') && n.endsWith('.woff2')));
  assert.ok(noms.some((n) => /^05-typographies\/polices\/LICENCE-.+\.txt$/.test(n)));
  assert.match(texte('05-typographies/fonts.css'), /url\('polices\/[a-z0-9-]+-\d{3}\.woff2'\)/);
  assert.match(texte('04-couleurs/variables.css'), /prefers-color-scheme: dark/);
});
