// @ts-check
import { AMBIANCES, HARMONIES } from './palette.js';
import { DISPOSITIONS, CONTENANTS } from './layouts.js';
import { FAMILLES_MARQUES } from './marks.js';

/** Version courante du format de projet. */
export const SCHEMA_VERSION = 1;

const HEX = { type: 'string', pattern: '^#[0-9a-f]{6}$' };
const ISO = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$' };
const texte = (max) => ({ type: 'string', maxLength: max });
const ROLES = ['fond', 'surface', 'texte', 'texteAttenue', 'bordure', 'principale', 'surPrincipale', 'secondaire', 'accent', 'succes', 'erreur', 'avertissement'];
const rolesProps = () => ({ ...Object.fromEntries(ROLES.map((r) => [r, HEX])), neutres: { type: 'array', items: HEX, minItems: 5, maxItems: 5 } });
const rolesRequis = [...ROLES, 'neutres'];

/** Schéma du projet (sous-ensemble de JSON Schema ; source unique : docs/schemas/projet.schema.json en est généré). */
export const SCHEMA_PROJET = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Projet Pro-vision',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'meta', 'entreprise', 'preferences', 'identite'],
  properties: {
    schemaVersion: { type: 'integer', enum: [SCHEMA_VERSION] },
    source: { type: 'string', enum: ['provision', 'vyraty', 'aurion'] },
    meta: {
      type: 'object', additionalProperties: false, required: ['id', 'creeLe', 'modifieLe', 'appVersion', 'graine'],
      properties: { id: { type: 'string', pattern: '^[A-Za-z0-9-]{8,48}$' }, creeLe: ISO, modifieLe: ISO, appVersion: texte(20), graine: texte(16), codeProposition: texte(16) }
    },
    entreprise: {
      type: 'object', additionalProperties: false, required: ['nom', 'activite', 'secteur'],
      properties: {
        nom: { type: 'string', minLength: 2, maxLength: 40 }, mention: texte(40), activite: texte(160),
        secteur: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' },
        produits: { type: 'array', maxItems: 8, items: texte(40) }, publics: { type: 'array', maxItems: 8, items: texte(40) },
        ville: texte(60), email: texte(80), telephone: texte(30), siteWeb: texte(120), adresse: texte(120), statut: { type: 'string', enum: ['projet', 'en-activite'] }
      }
    },
    preferences: {
      type: 'object', additionalProperties: false, required: ['ambiances', 'formalite'],
      properties: {
        ambiances: { type: 'array', maxItems: 3, items: { type: 'string', enum: AMBIANCES } },
        couleursAimees: { type: 'array', maxItems: 3, items: HEX }, couleursEvitees: { type: 'array', maxItems: 3, items: HEX },
        formalite: { type: 'string', enum: ['tu', 'vous'] }
      }
    },
    identite: {
      type: 'object', additionalProperties: false, required: ['palette', 'polices', 'logo'],
      properties: {
        palette: {
          type: 'object', additionalProperties: false, required: [...rolesRequis, 'harmonie', 'sombre'],
          properties: {
            harmonie: { type: 'string', enum: HARMONIES }, etendue: { type: 'array', maxItems: 12, items: HEX }, base: { type: 'object', additionalProperties: false, properties: { h: { type: 'number' }, c: { type: 'number' } } },
            ...rolesProps(),
            sombre: { type: 'object', additionalProperties: false, required: rolesRequis, properties: rolesProps() }
          }
        },
        polices: { type: 'object', additionalProperties: false, required: ['coupleId', 'titres', 'texte'], properties: { coupleId: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' }, titres: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' }, texte: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' } } },
        logo: {
          type: 'object', additionalProperties: false, required: ['disposition', 'symbole', 'contenant', 'epaisseurTrait', 'casseNom', 'espacementLettres'],
          properties: {
            disposition: { type: 'string', enum: DISPOSITIONS }, style: { type: 'string', enum: ['standard', 'fin', 'epais', 'plein', 'simpliste'] }, contenant: { type: 'string', enum: CONTENANTS },
            epaisseurTrait: { type: 'number', minimum: 1, maximum: 4 }, casseNom: { type: 'string', enum: ['normal', 'majuscules', 'minuscules'] }, espacementLettres: { type: 'number', minimum: -0.05, maximum: 0.3 },
            symbole: {
              type: 'object', additionalProperties: false, required: ['type', 'id'],
              properties: { type: { type: 'string', enum: ['lucide', 'marque'] }, id: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' }, params: { type: 'object', maxProperties: 12, additionalProperties: { type: 'number' } } }
            }
          }
        }
      }
    },
    textes: { type: 'object', maxProperties: 40, additionalProperties: { type: 'string', maxLength: 1500 } }
  }
};

/** Chemin lisible « a.b[2].c ». */
const chemin = (base, cle) => (typeof cle === 'number' ? `${base}[${cle}]` : base ? `${base}.${cle}` : String(cle));

/**
 * Validateur d'un sous-ensemble de JSON Schema : type, enum, pattern, min/max, longueurs, items,
 * properties, required, additionalProperties (faux ou schéma), maxProperties.
 * @param {any} schema @param {any} valeur @param {string} [base] @param {{chemin:string,message:string}[]} [erreurs]
 */
export function validerSchema(schema, valeur, base = '', erreurs = []) {
  const err = (message) => erreurs.push({ chemin: base || '(racine)', message });
  const types = schema.type ? [].concat(schema.type) : null;
  const typeDe = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
  const t = typeDe(valeur);
  if (types && !types.includes(t) && !(t === 'integer' && types.includes('number'))) {
    err(`type attendu : ${types.join(' ou ')}`);
    return erreurs;
  }
  if (schema.enum && !schema.enum.includes(valeur)) err(`valeur non autorisée`);
  if (typeof valeur === 'string') {
    if (schema.minLength !== undefined && [...valeur].length < schema.minLength) err(`au moins ${schema.minLength} caractères`);
    if (schema.maxLength !== undefined && [...valeur].length > schema.maxLength) err(`au plus ${schema.maxLength} caractères`);
    if (schema.pattern && !new RegExp(schema.pattern).test(valeur)) err('format invalide');
  }
  if (typeof valeur === 'number') {
    if (!Number.isFinite(valeur)) err('nombre invalide');
    if (schema.minimum !== undefined && valeur < schema.minimum) err(`au moins ${schema.minimum}`);
    if (schema.maximum !== undefined && valeur > schema.maximum) err(`au plus ${schema.maximum}`);
  }
  if (Array.isArray(valeur)) {
    if (schema.minItems !== undefined && valeur.length < schema.minItems) err(`au moins ${schema.minItems} éléments`);
    if (schema.maxItems !== undefined && valeur.length > schema.maxItems) err(`au plus ${schema.maxItems} éléments`);
    if (schema.items) valeur.forEach((v, i) => validerSchema(schema.items, v, chemin(base, i), erreurs));
  } else if (valeur && typeof valeur === 'object') {
    const cles = Object.keys(valeur);
    if (schema.maxProperties !== undefined && cles.length > schema.maxProperties) err(`au plus ${schema.maxProperties} propriétés`);
    for (const r of schema.required || []) if (!(r in valeur)) erreurs.push({ chemin: chemin(base, r), message: 'champ obligatoire manquant' });
    for (const k of cles) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        erreurs.push({ chemin: chemin(base, k), message: 'propriété interdite' });
        continue;
      }
      const sous = schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, k) ? schema.properties[k] : null;
      if (sous) validerSchema(sous, valeur[k], chemin(base, k), erreurs);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validerSchema(schema.additionalProperties, valeur[k], chemin(base, k), erreurs);
      else if (schema.additionalProperties === false) erreurs.push({ chemin: chemin(base, k), message: 'propriété inconnue' });
    }
  }
  return erreurs;
}

/** Supprime les caractères de contrôle et ajuste les espaces de toutes les chaînes. */
function nettoyerChaines(v) {
  if (typeof v === 'string') {
    let s = '';
    for (const c of v) {
      const code = c.codePointAt(0) ?? 0;
      if (code === 10 || code === 9) s += c === '\t' ? ' ' : '\n';
      else if (!(code < 32 || (code >= 127 && code <= 159) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069))) s += c;
    }
    return s.trim();
  }
  if (Array.isArray(v)) return v.map(nettoyerChaines);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nettoyerChaines(x)]));
  return v;
}

/**
 * Valide un projet reçu (import, passerelle, stockage). Refuse tout ce qui n'est pas prévu.
 * @param {any} objet
 * @param {{ brouillon?: boolean }} [o] brouillon : `identite` peut être null (questionnaire en cours)
 * @returns {{ ok: boolean, projet: any, erreurs: {chemin:string,message:string}[] }}
 */
export function validerProjet(objet, { brouillon = false } = {}) {
  if (!objet || typeof objet !== 'object' || Array.isArray(objet)) return { ok: false, projet: null, erreurs: [{ chemin: '(racine)', message: 'objet attendu' }] };
  const copie = nettoyerChaines(objet);
  let schema = SCHEMA_PROJET;
  if (brouillon && copie.identite === null) {
    delete copie.identite;
    schema = structuredClone(SCHEMA_PROJET);
    schema.required = schema.required.filter((r) => r !== 'identite');
    schema.properties.entreprise.properties.nom.minLength = 0;
  }
  const erreurs = validerSchema(schema, copie);
  if (!erreurs.length && copie.identite && /** @type {any} */ (copie.identite).logo.symbole.type === 'marque' && !FAMILLES_MARQUES.includes(copie.identite.logo.symbole.id)) {
    erreurs.push({ chemin: 'identite.logo.symbole.id', message: 'famille de marque inconnue' });
  }
  return { ok: erreurs.length === 0, projet: erreurs.length ? null : copie, erreurs };
}

/**
 * Brouillon vide (questionnaire non commencé).
 * @param {{ id: string, maintenant: string, appVersion: string, graine: string }} o
 */
export function projetVide({ id, maintenant, appVersion, graine }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    source: 'provision',
    meta: { id, creeLe: maintenant, modifieLe: maintenant, appVersion, graine },
    entreprise: { nom: '', mention: '', activite: '', secteur: 'auto', produits: [], publics: [], ville: '', email: '', telephone: '', siteWeb: '', adresse: '', statut: 'projet' },
    preferences: { ambiances: [], couleursAimees: [], couleursEvitees: [], formalite: 'vous' },
    identite: null,
    textes: {}
  };
}
