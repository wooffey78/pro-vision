// @ts-check
/**
 * Point d'extension « licence ». Mode actuel : « free » (gratuit, aperçus avec filigrane, kit complet).
 * Le kit complet est toujours livré dans ce mode : aucun paiement n'est implémenté.
 */
/** @param {any} cfgApp */
export function modeLicence(cfgApp) {
  return cfgApp?.licence?.mode === 'free' ? 'free' : 'free';
}
