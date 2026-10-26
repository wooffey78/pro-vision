// @ts-check
import { genererVariantes, NOMS_VARIANTES } from './variants.js';
import { genererTextes } from './copy.js';
import { genererReseaux } from './social.js';
import { carteVisite, papierEnTete, etiquettes, signature, documentCommercial } from './stationery.js';
import { genererSite } from './website.js';
import { charteGraphique } from './charter.js';
import * as pg from './pages.js';
import { pageHtml, fontFaces } from './html.js';
import { variablesCss, tokensJson, formatsCouleur } from './palette.js';
import { integrerSvg, racineSvg, n2 } from './svgutil.js';
import { proposerNoms, contexteNoms, detecterLangue } from '../data/names.js';
import { resoudreSecteur } from '../data/sectors.js';
import { creerPrng } from './prng.js';
import { famille } from './fonts.js';
import { construireIco } from '../services/png.js';

/** Licence du kit gratuit (texte à faire valider par l'éditeur : voir docs/A_VERIFIER.md). */
export const TEXTE_LICENCE = 'Licence gratuite, sans garantie. Ce kit vous est remis pour votre entreprise. Aucune vérification d’antériorité (marque, nom de domaine, logo) n’a été effectuée. Les polices restent sous leur licence SIL OFL 1.1.';

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Applique les textes modifiés par la personne (écran de retouches). */
export function textesFinaux(projet, ctx) {
  const t = genererTextes(projet, ctx);
  const o = projet.textes || {};
  if (o.slogan) t.slogans = [o.slogan, ...t.slogans.filter((s) => s !== o.slogan)];
  if (o.aProposCourt) t.aPropos.court = o.aProposCourt;
  if (o.aProposLong) t.aPropos.long = o.aProposLong;
  if (o.google) t.google = o.google;
  return t;
}

/**
 * Construit tous les fichiers du kit.
 * @param {any} projet projet complet et valide
 * @param {{ polices: any, symboles?: Record<string,string>, fichiersPolices: Record<string, Record<number, Uint8Array>>, licencesPolices: Record<string,string> }} ressources
 * @param {{ fonts:any, sectors:any, app:any, social:any }} ctx
 * @param {{ rasterize?: (svg:string, largeur:number, hauteur?:number)=>Promise<Uint8Array>, version?: string, progression?: (n:number,total:number)=>void }} [o]
 * @returns {Promise<{ fichiers: Record<string, string|Uint8Array>, avertissements: string[] }>}
 */
export async function construireKit(projet, ressources, ctx, { rasterize, version = '1.0.0', progression } = {}) {
  /** @type {Record<string, string|Uint8Array>} */
  const f = {};
  const avert = new Set();
  const fontsCfg = ctx.fonts;
  const liens = ctx.app.liens;
  const textes = textesFinaux(projet, ctx);
  const rs = { polices: ressources.polices, symboles: ressources.symboles || {} };
  const v = genererVariantes(projet, rs);
  for (const x of Object.values(v)) x.avertissements.forEach((a) => avert.add(a));
  const secteur = resoudreSecteur(ctx.sectors, projet.entreprise);

  // 03-logo
  for (const n of NOMS_VARIANTES) f[`03-logo/svg/${n}.svg`] = v[n].svg;
  const pr = v.principal;
  const cadre = integrerSvg(pr.svg, 0, 0, pr.largeur);
  f['03-logo/zone-de-protection.svg'] = racineSvg(0, 0, pr.largeur, pr.hauteur, `${cadre.markup}<rect x="1" y="1" width="${n2(pr.largeur - 2)}" height="${n2(pr.hauteur - 2)}" fill="none" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="6 4"/><rect x="${n2(pr.marge)}" y="${n2(pr.marge)}" width="${n2(pr.largeur - 2 * pr.marge)}" height="${n2(pr.hauteur - 2 * pr.marge)}" fill="none" stroke="#2c7a4b" stroke-width="1"/>`, 'Zone de protection du logo');
  f['03-logo/favicon/favicon.svg'] = v.favicon.svg;

  // PNG (navigateur) : logos, favicons, réseaux sociaux
  const avecPng = typeof rasterize === 'function';
  const taches = [];
  if (avecPng) {
    for (const n of NOMS_VARIANTES.filter((x) => x !== 'favicon')) for (const w of [512, 1024, 2048]) taches.push([`03-logo/png/${n}-${w}.png`, v[n].svg, w, undefined]);
    for (const s of [16, 32, 48, 180, 192, 512]) taches.push([`03-logo/favicon/favicon-${s}.png`, v.favicon.svg, s, s]);
  }
  // 07-papeterie
  const [rectoE, versoE] = carteVisite(projet, rs, false);
  const [rectoI, versoI] = carteVisite(projet, rs, true);
  f['07-papeterie/carte-de-visite-recto.svg'] = rectoE;
  f['07-papeterie/carte-de-visite-verso.svg'] = versoE;
  f['07-papeterie/carte-de-visite-recto-impression.svg'] = rectoI;
  f['07-papeterie/carte-de-visite-verso-impression.svg'] = versoI;
  f['07-papeterie/papier-a-en-tete.svg'] = papierEnTete(projet, rs);
  f['07-papeterie/etiquettes.svg'] = etiquettes(projet, rs);
  const sig = signature(projet, avecPng ? 'logo-signature.png' : 'logo-signature.svg');
  f['07-papeterie/signature-email.html'] = sig.html;
  f['07-papeterie/signature-email.txt'] = sig.texte;
  f['07-papeterie/logo-signature.svg'] = v.horizontal.svg;
  if (avecPng) taches.push(['07-papeterie/logo-signature.png', v.horizontal.svg, 480, undefined]);
  for (const t of ['devis', 'facture']) {
    f[`07-papeterie/${t}.html`] = pageHtml({ titre: t === 'devis' ? 'Devis' : 'Facture', corps: documentCommercial(projet, t), projet, fontsCfg, racine: '../' });
  }
  // 08-reseaux-sociaux
  const reseaux = genererReseaux(projet, rs, textes, ctx.social);
  for (const [nom, svg] of Object.entries(reseaux)) {
    f[`08-reseaux-sociaux/${nom}`] = svg;
    if (avecPng) taches.push([`08-reseaux-sociaux/png/${nom.replace('.svg', '.png')}`, svg, undefined, undefined]);
  }
  // 09-site-web
  const site = genererSite(projet, fontsCfg, textes, v, { avecPng });
  for (const [nom, c] of Object.entries(site)) f[`09-site-web/${nom}`] = c;
  f['09-site-web/images/partage.svg'] = reseaux['partage.svg'];
  if (avecPng) taches.push(['09-site-web/images/partage.png', reseaux['partage.svg'], 1200, 630]);

  // Rasterisation (séquentielle pour limiter la mémoire)
  let fait = 0;
  for (const [chemin, svg, w, h] of taches) {
    const largeurVb = Number(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(svg)?.[1] || 1000);
    f[chemin] = await /** @type {Function} */ (rasterize)(svg, w || Math.min(1080, Math.round(largeurVb)), h);
    progression?.(++fait, taches.length);
  }
  if (avecPng) {
    f['03-logo/favicon/apple-touch-icon.png'] = f['03-logo/favicon/favicon-180.png'];
    f['03-logo/favicon/favicon.ico'] = construireIco([16, 32, 48].map((s) => ({ taille: s, png: /** @type {Uint8Array} */ (f[`03-logo/favicon/favicon-${s}.png`]) })));
    f['09-site-web/images/favicon.ico'] = f['03-logo/favicon/favicon.ico'];
  }

  // 04-couleurs
  const pal = projet.identite.palette;
  f['04-couleurs/palette.json'] = JSON.stringify({ harmonie: pal.harmonie, clair: Object.fromEntries(Object.entries(pal).filter(([k]) => !['sombre', 'harmonie', 'base'].includes(k))), sombre: pal.sombre, formats: Object.fromEntries(['principale', 'secondaire', 'accent'].map((r) => [r, formatsCouleur(pal[r])])) }, null, 2) + '\n';
  f['04-couleurs/tokens.json'] = JSON.stringify(tokensJson(pal), null, 2) + '\n';
  f['04-couleurs/variables.css'] = variablesCss(pal);
  f['04-couleurs/palette.html'] = pg.couleursPalette(projet, fontsCfg);
  f['04-couleurs/contrastes.html'] = pg.couleursContrastes(projet, fontsCfg);

  // 05-typographies
  const ids = [...new Set([projet.identite.polices.titres, projet.identite.polices.texte])];
  for (const id of ids) {
    const dispo = ressources.fichiersPolices[id] || {};
    for (const [w, octets] of Object.entries(dispo)) {
      f[`05-typographies/polices/${id}-${w}.woff2`] = octets;
      f[`09-site-web/polices/${id}-${w}.woff2`] = octets;
    }
    f[`05-typographies/polices/LICENCE-${id}.txt`] = ressources.licencesPolices[id] || 'Licence libre (SIL OFL 1.1 ou Apache 2.0) — voir la source de la police.';
    if (!Object.keys(dispo).length) avert.add(`Fichiers de police introuvables pour ${famille(fontsCfg, id).nom}.`);
  }
  f['05-typographies/fonts.css'] = `/* Polices du kit (licences libres, voir LICENCE-*.txt). Liez ce fichier depuis votre site. */\n${fontFaces(fontsCfg, projet.identite.polices, 'polices/')}\n`;
  f['05-typographies/guide-typo.html'] = pg.typoGuide(projet, fontsCfg);

  // 01 / 02 / 06 / 10 / 11
  f['01-strategie/positionnement.html'] = pg.strategiePositionnement(projet, fontsCfg, textes);
  f['01-strategie/cibles.html'] = pg.strategieCibles(projet, fontsCfg);
  f['01-strategie/valeurs-et-ton.html'] = pg.strategieValeurs(projet, fontsCfg, textes);
  f['02-nom/nom-retenu.html'] = pg.nomRetenu(projet, fontsCfg, v);
  const noms = proposerNoms(secteur, creerPrng(`${projet.meta.graine}/noms`), 12, { exclure: [projet.entreprise.nom], contexte: contexteNoms(projet.entreprise), langue: detecterLangue(projet.entreprise) });
  f['02-nom/alternatives.html'] = pg.nomAlternatives(projet, fontsCfg, noms);
  f['02-nom/verifications.html'] = pg.nomVerifications(projet, fontsCfg, liens);
  f['06-charte-graphique.html'] = charteGraphique(projet, fontsCfg, v, textes);
  f['10-textes/slogans.txt'] = textes.slogans.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n';
  f['10-textes/a-propos.txt'] = `COURT\n${textes.aPropos.court}\n\nLONG\n${textes.aPropos.long}\n`;
  f['10-textes/google-business.txt'] = textes.google + '\n';
  f['10-textes/bios-reseaux.txt'] = `INSTAGRAM\n${textes.bio.instagram}\n\nFACEBOOK\n${textes.bio.facebook}\n\nLINKEDIN\n${textes.bio.linkedin}\n`;
  f['10-textes/legendes-reseaux.txt'] = Object.entries(textes.legendes).map(([k, l]) => `${k.toUpperCase()}\n${l.map((x, i) => `  ${i + 1}) ${x}`).join('\n')}`).join('\n\n') + '\n';
  f['10-textes/faq.txt'] = textes.faq.map((x) => `Q : ${x.question}\nR : ${x.reponse}`).join('\n\n') + '\n';
  f['10-textes/message-bienvenue.txt'] = textes.bienvenue + '\n';
  f['11-lancer-sa-marque/checklist-7-jours.html'] = pg.checklist7Jours(projet, fontsCfg, liens);
  f['00-LISEZ-MOI.html'] = pg.lisezMoi(projet, fontsCfg, v, version);

  // Projet, licence, provenance
  f['projet.json'] = JSON.stringify(projet, null, 2) + '\n';
  f['licence.json'] = JSON.stringify({ mode: ctx.app.licence.mode, idKit: projet.meta.id, emisLe: projet.meta.modifieLe, mention: TEXTE_LICENCE }, null, 2) + '\n';
  f['PROVENANCE.txt'] = [
    `Kit généré par Pro-vision ${version}.`,
    'Moteur déterministe exécuté dans le navigateur : aucune intelligence artificielle, aucun service externe.',
    `Graine : ${projet.meta.graine}${projet.meta.codeProposition ? ` · proposition ${projet.meta.codeProposition}` : ''}`,
    `Projet : ${projet.meta.id} (modifié le ${projet.meta.modifieLe})`,
    `Polices : ${ids.map((i) => famille(fontsCfg, i).nom).join(', ')} (licences libres : SIL OFL 1.1 ou Apache 2.0, voir le dossier polices).`,
    'Symboles : Lucide (licence ISC) lorsque le logo en utilise un.',
    'Les marques et noms cités ne sont pas vérifiés. Voir 02-nom/verifications.html.'
  ].join('\n') + '\n';

  // Manifest (somme SHA-256 de chaque fichier)
  const manifest = [];
  for (const chemin of Object.keys(f).sort()) {
    const octets = typeof f[chemin] === 'string' ? enc.encode(/** @type {string} */ (f[chemin])) : /** @type {Uint8Array} */ (f[chemin]);
    manifest.push({ chemin, octets: octets.length, sha256: hex(await crypto.subtle.digest('SHA-256', octets)) });
  }
  f['manifest.json'] = JSON.stringify({ app: 'Pro-vision', version, fichiers: manifest }, null, 2) + '\n';
  return { fichiers: f, avertissements: [...avert] };
}
