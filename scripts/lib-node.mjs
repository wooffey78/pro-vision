// Utilitaires Node partagés par les tests et les scripts (chargement des configs, polices, symboles).
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = join(RACINE, 'public');
const json = (p) => JSON.parse(readFileSync(join(PUBLIC, p), 'utf8'));

/** Configuration complète, comme le navigateur la charge. */
export function chargerContexte() {
  return { fonts: json('config/fonts.config.json'), sectors: json('config/sectors.json'), app: json('config/app.config.json'), social: json('config/social-sizes.json'), bridge: json('config/bridge.config.json'), symbolesDispo: null };
}

let opentypeMod = null;
async function opentype() {
  opentypeMod ||= await import(join(PUBLIC, 'vendor/opentype/opentype.min.mjs'));
  return opentypeMod;
}

/** Police opentype.js depuis vendor (WOFF). */
export async function chargerPolice(id, poids = 700, fonts = chargerContexte().fonts) {
  const fam = fonts.familles.find((f) => f.id === id);
  const w = fam.poids.includes(poids) ? poids : fam.poids[0];
  const b = readFileSync(join(PUBLIC, `vendor/fonts/${id}/${id}-${w}.woff`));
  return (await opentype()).parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

/** Contenu interne d'un symbole Lucide. */
export function symboleLucide(id) {
  const t = readFileSync(join(PUBLIC, `vendor/lucide/${id}.svg`), 'utf8');
  return t.slice(t.indexOf('>', t.indexOf('<svg')) + 1, t.lastIndexOf('</svg>')).trim();
}

/** Ressources du kit pour une identité donnée (équivalent Node du chargeur navigateur). */
export async function chargerRessources(projet, ctx = chargerContexte()) {
  const { titres, texte } = projet.identite.polices;
  const polices = { titres: await chargerPolice(titres, 700, ctx.fonts), texte: await chargerPolice(texte, 400, ctx.fonts) };
  const symboles = {};
  const s = projet.identite.logo.symbole;
  if (s.type === 'lucide') symboles[s.id] = symboleLucide(s.id);
  const fichiersPolices = {};
  const licencesPolices = {};
  for (const id of new Set([titres, texte])) {
    fichiersPolices[id] = {};
    for (const w of ctx.fonts.familles.find((f) => f.id === id).poids) fichiersPolices[id][w] = new Uint8Array(readFileSync(join(PUBLIC, `vendor/fonts/${id}/${id}-${w}.woff2`)));
    licencesPolices[id] = readFileSync(join(PUBLIC, `vendor/fonts/${id}/OFL.txt`), 'utf8');
  }
  return { polices, symboles, fichiersPolices, licencesPolices };
}

/** Rasteriseur PNG optionnel (resvg) pour le kit d'exemple et les tests. */
export async function rasteriseurResvg() {
  if (!existsSync(join(RACINE, 'node_modules/@resvg/resvg-js'))) return null;
  const { Resvg } = await import('@resvg/resvg-js');
  return async (svg, largeur, hauteur) => {
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: largeur } });
    const png = r.render();
    if (hauteur && png.height !== hauteur) return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'height', value: hauteur } }).render().asPng());
    return new Uint8Array(png.asPng());
  };
}

/** Projet d'exemple complet et déterministe. */
export async function projetExemple(ctx = chargerContexte(), { graine = 'AB12-CD3', rang = 3 } = {}) {
  const { genererSerie } = await import(join(PUBLIC, 'js/core/generation.js'));
  const entreprise = { nom: 'Studio Aube', mention: 'bougies artisanales', activite: 'je fabrique des bougies parfumées', secteur: 'auto', produits: ['bougies', 'cire'], publics: ['particuliers'], ville: 'Challans', email: 'bonjour@exemple.fr', telephone: '02 00 00 00 00', siteWeb: 'exemple.fr', adresse: '', statut: 'projet' };
  const preferences = { ambiances: ['chaleureux', 'artisanal'], couleursAimees: [], couleursEvitees: [], formalite: 'vous' };
  const serie = genererSerie(ctx, entreprise, preferences, graine, {}, 6);
  const p = serie[rang];
  const t = '2026-10-13T09:00:00.000Z';
  return { schemaVersion: 1, source: 'provision', meta: { id: 'exemple-0001', creeLe: t, modifieLe: t, appVersion: ctx.app.version, graine, codeProposition: p.code }, entreprise, preferences, identite: p.identite, textes: {} };
}
