// @ts-check
import { SCHEMA_VERSION } from './schema.js';
import { genererProposition } from './generation.js';
import { deriverCode, hacher } from './prng.js';
import { oklchVersHex } from './color.js';

/** Couleurs nommées de l'ancien prototype → teinte approximative. */
const COULEURS_PROTOTYPE = { Bleu: '#2a4d8f', Vert: '#2e6b4f', Rouge: '#b32a2a', Ambre: '#b8780a', Violet: '#6a3d9a', Rose: '#c2557f', Corail: '#d96a55', 'Bleu nuit': '#0f1b33', Turquoise: '#0e7492' };

/**
 * Migre un objet de projet vers le schéma courant.
 * Formats reconnus : projet courant ; ancien prototype monofichier (identite.palSeed) ;
 * versions futures (refusées avec un message clair).
 * @param {any} obj
 * @param {import('./generation.js').Contexte | null} [ctx] requis pour migrer le prototype (régénération de l'identité)
 * @returns {{ projet: any, notes: string[] }}
 */
export function migrer(obj, ctx = null) {
  const notes = [];
  if (!obj || typeof obj !== 'object') throw new Error('Fichier de projet illisible.');
  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Ce projet vient d’une version plus récente de Pro-vision. Mettez l’application à jour pour l’ouvrir.');
  }
  const proto = obj.identite && (obj.identite.palSeed !== undefined || obj.identite.mark !== undefined);
  if (!proto) return { projet: obj, notes };
  if (!ctx) throw new Error('Migration impossible sans configuration.');
  const e = obj.entreprise || {};
  const lib = String(e.secteur || '').toLowerCase();
  const secteur = ctx.sectors.secteurs.find((s) => s.libelle.toLowerCase() === lib);
  const aimee = COULEURS_PROTOTYPE[obj.preferences?.couleur];
  const maintenant = obj.meta?.modifieLe || '2026-01-01T00:00:00.000Z';
  const entreprise = {
    nom: e.nom || 'Mon entreprise',
    mention: e.mention || '',
    activite: e.activite || '',
    secteur: secteur ? secteur.id : 'autre',
    produits: [],
    publics: [],
    statut: 'projet'
  };
  const preferences = { ambiances: (obj.preferences?.ambiances || []).slice(0, 3), couleursAimees: aimee ? [aimee] : [], couleursEvitees: [], formalite: 'vous' };
  const graine = String(obj.identite.palSeed || entreprise.nom);
  const code = deriverCode(`MIG${(hacher(graine) % 9999).toString(36).toUpperCase().padStart(4, '0')}`, 0);
  const prop = genererProposition(ctx, entreprise, preferences, code);
  notes.push('Ce projet vient de l’ancienne version : l’identité visuelle a été régénérée avec le nouveau moteur (les couleurs et le logo peuvent différer). Vos textes et votre nom sont conservés.');
  return {
    projet: {
      schemaVersion: SCHEMA_VERSION,
      source: 'provision',
      meta: { id: /^[A-Za-z0-9-]{8,48}$/.test(String(obj.meta?.idKit)) ? String(obj.meta.idKit) : `migre-${code}`, creeLe: maintenant, modifieLe: maintenant, appVersion: String(obj.meta?.appVersion || '1.0.0'), graine: code, codeProposition: code },
      entreprise,
      preferences,
      identite: prop.identite,
      textes: {}
    },
    notes
  };
}

export { oklchVersHex };
