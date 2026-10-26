// @ts-check
import { creerPrng, deriverCode, genererCode } from './prng.js';
import { genererPalette } from './palette.js';
import { choisirCouple, famille } from './fonts.js';
import { FAMILLES_MARQUES, parametresMarque } from './marks.js';
import { DISPOSITIONS } from './layouts.js';
import { resoudreSecteur } from '../data/sectors.js';
import { symbolesDuTexte, SYMBOLES_GENERAUX } from '../data/symbols.js';

/**
 * @typedef {Object} Contexte
 * @property {any} fonts configuration des polices
 * @property {any} sectors configuration des secteurs
 * @property {any} app configuration de l'application
 * @property {Set<string>|null} [symbolesDispo] symboles Lucide réellement disponibles (null : tous)
 */

/**
 * Génère UNE proposition d'identité, entièrement déterminée par (code, entreprise, préférences, verrous).
 * Chaque brique (palette, polices, logo) utilise son propre flux aléatoire : verrouiller l'une ne change pas les autres.
 * @param {Contexte} ctx
 * @param {any} entreprise @param {any} preferences @param {string} code
 * @param {{ palette?: any, polices?: any, logo?: any }} [verrous]
 */
export function genererProposition(ctx, entreprise, preferences, code, verrous = {}) {
  const ambiances = preferences.ambiances || [];
  const secteur = resoudreSecteur(ctx.sectors, entreprise);
  const ambEff = ambiances.length ? ambiances : secteur.ambiances;

  const palette = verrous.palette || genererPalette({
    ambiances: ambEff,
    couleursAimees: preferences.couleursAimees || [],
    couleursEvitees: preferences.couleursEvitees || [],
    prng: creerPrng(`${code}/palette`),
    seuilEvitees: ctx.app.couleurs?.seuilEviteesDeltaE ?? 0.08
  });

  let polices = verrous.polices;
  if (!polices) {
    const couple = choisirCouple(ctx.fonts, ambEff, creerPrng(`${code}/polices`));
    polices = { coupleId: couple.id, titres: couple.titres, texte: couple.texte };
  }
  if (!famille(ctx.fonts, polices.titres)) throw new Error('Police inconnue');

  const logo = verrous.logo || genererLogo(ctx, entreprise, secteur, code);
  return { code, identite: { palette, polices, logo } };
}

/** @param {Contexte} ctx @param {any} entreprise @param {any} secteur @param {string} code */
function genererLogo(ctx, entreprise, secteur, code) {
  const prng = creerPrng(`${code}/logo`);
  const nbMots = entreprise.nom.trim().split(/\s+/).length;
  const dispositions = DISPOSITIONS.filter((d) => d !== 'deux-lignes' || nbMots >= 2);
  const poidsDisp = { 'symbole-dessus': 3, 'symbole-gauche': 3, 'symbole-droite': 1, 'nom-seul': 0.7, monogramme: 1.3, 'deux-lignes': 1.2, bandeau: 1.6, badge: 1.4 };
  const disposition = prng.choixPondere(dispositions, dispositions.map((d) => poidsDisp[d]));
  // Symbole : Lucide (secteur + mots-clés) ou marque procédurale
  const motsTexte = `${entreprise.activite || ''} ${(entreprise.produits || []).join(' ')}`;
  const parMots = symbolesDuTexte(motsTexte);
  /** @type {Record<string, number>} */
  const poids = {};
  for (const id of secteur.symboles) poids[id] = (poids[id] || 0) + 2;
  for (const [id, n] of Object.entries(parMots)) poids[id] = (poids[id] || 0) + 4 * n;
  const dispo = ctx.symbolesDispo;
  const ids = Object.keys(poids).filter((id) => !dispo || dispo.has(id));
  const marques = FAMILLES_MARQUES.filter((f) => f !== 'monogramme');
  const utiliserLucide = (ids.length > 0 || !dispo) && prng.pile(0.55);
  let symbole;
  if (utiliserLucide) {
    // 40 % du temps : un symbole général (variété) ; sinon un symbole lié à l'activité.
    const generaux = SYMBOLES_GENERAUX.filter((id) => !dispo || dispo.has(id));
    symbole = prng.pile(0.4) && generaux.length
      ? { type: 'lucide', id: prng.choix(generaux) }
      : { type: 'lucide', id: prng.choixPondere(ids, ids.map((i) => poids[i])) };
  } else {
    const f = prng.choix(marques);
    symbole = { type: 'marque', id: f, params: parametresMarque(f, prng) };
  }
  let contenant = prng.choixPondere(['aucun', 'cercle', 'carre-arrondi', 'ecusson', 'hexagone'], [3.5, 2, 2.5, 1, 1]);
  if (disposition === 'nom-seul') contenant = 'aucun';
  const style = prng.choixPondere(['standard', 'fin', 'epais', 'plein', 'simpliste'], [4, 2, 2, 1.2, 1.2]);
  const casseNom = prng.choixPondere(['normal', 'majuscules', 'minuscules'], [7, 2.2, 0.8]);
  return {
    disposition,
    style,
    symbole,
    contenant,
    epaisseurTrait: prng.choix([1.5, 2, 2.5]),
    casseNom,
    espacementLettres: casseNom === 'majuscules' ? 0.08 : 0.02
  };
}

/**
 * Série de propositions. Les codes sont dérivés du code de série : « série + rang » → proposition.
 * @param {Contexte} ctx @param {any} entreprise @param {any} preferences
 * @param {string} codeSerie @param {{ palette?: any, polices?: any, logo?: any }} [verrous]
 * @param {number} [n]
 */
export function genererSerie(ctx, entreprise, preferences, codeSerie, verrous = {}, n = 6) {
  const out = [];
  const vus = new Set();
  for (let i = 0; i < n * 3 && out.length < n; i++) {
    const code = deriverCode(codeSerie, i);
    const p = genererProposition(ctx, entreprise, preferences, code, verrous);
    const empreinte = JSON.stringify([p.identite.logo, p.identite.palette.principale, p.identite.polices.coupleId]);
    if (vus.has(empreinte)) continue;
    vus.add(empreinte);
    out.push(p);
  }
  return out;
}

/** Nouveau code de série à partir d'un compteur / graine de session. @param {{suivant:()=>number}} prng */
export const nouveauCodeSerie = (prng) => genererCode(prng);
