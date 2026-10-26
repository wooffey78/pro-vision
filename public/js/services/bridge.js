// @ts-check
import { validerSchema } from '../core/schema.js';

/** Passerelle entre applications : un projet réduit voyage dans le FRAGMENT d'URL (jamais envoyé au serveur). */
export const LIMITE_FRAGMENT = 12000;

const TXT = (max) => ({ type: 'string', maxLength: max });
/** Schéma du projet réduit accepté par la passerelle. */
export const SCHEMA_PASSERELLE = {
  type: 'object', additionalProperties: false, required: ['v', 'source', 'entreprise'],
  properties: {
    v: { type: 'integer', enum: [1] }, source: { type: 'string', enum: ['provision', 'vyraty', 'aurion'] },
    entreprise: { type: 'object', additionalProperties: false, required: ['nom'], properties: { nom: { type: 'string', minLength: 2, maxLength: 40 }, mention: TXT(40), activite: TXT(160), secteur: { type: 'string', pattern: '^[a-z0-9-]{2,40}$' }, ville: TXT(60), produits: { type: 'array', maxItems: 8, items: TXT(40) }, publics: { type: 'array', maxItems: 8, items: TXT(40) } } },
    couleurPrincipale: { type: 'string', pattern: '^#[0-9a-f]{6}$' }
  }
};

/** @param {string} s */
const versBase64Url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** @param {string} s */
const depuisBase64Url = (s) => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/**
 * Lit « #/import/<données> ».
 * @param {string} hash @returns {{ ok: boolean, charge?: any, erreur?: string }}
 */
export function lireFragment(hash) {
  const prefixe = '#/import/';
  if (!hash.startsWith(prefixe)) return { ok: false, erreur: 'aucune donnée reçue' };
  const donnees = hash.slice(prefixe.length);
  if (!donnees || donnees.length > LIMITE_FRAGMENT) return { ok: false, erreur: 'données trop volumineuses ou vides' };
  for (const c of donnees) if (!(/[A-Za-z0-9_-]/.test(c))) return { ok: false, erreur: 'données mal formées' };
  let obj;
  try {
    obj = JSON.parse(depuisBase64Url(donnees));
  } catch {
    return { ok: false, erreur: 'données illisibles' };
  }
  const erreurs = validerSchema(SCHEMA_PASSERELLE, obj);
  if (erreurs.length) return { ok: false, erreur: `données non conformes (${erreurs[0].chemin} : ${erreurs[0].message})` };
  return { ok: true, charge: obj };
}

/**
 * Lien vers une autre application (null si inactive ou adresse non renseignée).
 * @param {any} cfgBridge @param {string} appId @param {any} projet
 */
export function construireLien(cfgBridge, appId, projet) {
  const app = cfgBridge.apps.find((a) => a.id === appId);
  if (!app || !app.actif || !app.baseUrl || app.baseUrl.includes('[A_RENSEIGNER]')) return null;
  if (!app.baseUrl.startsWith('https://')) return null;
  const e = projet.entreprise;
  const charge = { v: 1, source: 'provision', entreprise: { nom: e.nom, ...(e.mention ? { mention: e.mention } : {}), ...(e.activite ? { activite: e.activite } : {}), ...(e.secteur && e.secteur !== 'auto' ? { secteur: e.secteur } : {}), ...(e.ville ? { ville: e.ville } : {}) }, couleurPrincipale: projet.identite?.palette?.principale };
  if (!charge.couleurPrincipale) delete charge.couleurPrincipale;
  const lien = `${app.baseUrl.replace(/\/$/, '')}/#/import/${versBase64Url(JSON.stringify(charge))}`;
  return lien.length <= LIMITE_FRAGMENT ? lien : null;
}
