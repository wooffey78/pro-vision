// @ts-check
import { chargerRessources } from '../services/assets.js';
import { genererVariantes } from '../core/variants.js';

const cache = new Map();

/**
 * Variantes de logo d'une identité (SVG), chargement des polices compris. Mise en cache.
 * @param {any} app @param {any} identite @param {any} entreprise
 */
export async function variantesPour(app, identite, entreprise) {
  const cle = JSON.stringify([identite, entreprise.nom, entreprise.mention]);
  if (!cache.has(cle)) {
    cache.set(cle, (async () => {
      const res = await chargerRessources(identite, app.ctx.fonts);
      const v = genererVariantes({ entreprise: { nom: entreprise.nom || 'Votre nom', mention: entreprise.mention || '' }, identite }, res);
      return { variantes: v, ressources: res };
    })());
    if (cache.size > 60) cache.delete(cache.keys().next().value);
  }
  return cache.get(cle);
}
