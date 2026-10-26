// @ts-check
/**
 * Point d'extension « IA optionnelle ». Désactivé par défaut (app.config.json : ai.enabled = false).
 * Contrat : un fournisseur expose `proposerTextes(contexte) → Promise<string[]>` ; il ne reçoit
 * JAMAIS le projet entier, seulement les champs que la personne a acceptés d'envoyer.
 */
export const fournisseurIa = Object.freeze({
  actif: false,
  /** @returns {Promise<string[]>} */
  async proposerTextes() {
    throw new Error('Aucun fournisseur d’IA n’est configuré.');
  }
});

/** @param {any} cfgApp */
export const iaDisponible = (cfgApp) => !!cfgApp?.ai?.enabled && fournisseurIa.actif;
