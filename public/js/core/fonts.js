// @ts-check
/** Choix des polices : couples éprouvés selon les ambiances. Pur (configuration injectée). */

/** @param {any} cfg fonts.config.json @param {string} id */
export function famille(cfg, id) {
  return cfg.familles.find((f) => f.id === id) || cfg.familles[0];
}

/**
 * Choisit un couple de polices selon les ambiances.
 * @param {any} cfg @param {string[]} ambiances @param {{choixPondere:<T>(l:T[],p:number[])=>T}} prng
 * @param {string} [verrou] id de couple imposé
 */
export function choisirCouple(cfg, ambiances, prng, verrou) {
  const imposé = verrou && cfg.couples.find((c) => c.id === verrou);
  if (imposé) return imposé;
  const poids = cfg.couples.map((c) => 1 + 3 * c.ambiances.filter((a) => ambiances.includes(a)).length);
  return prng.choixPondere(cfg.couples, poids);
}

/** Pile CSS d'une famille. @param {any} cfg @param {string} id */
export function pileCss(cfg, id) {
  return famille(cfg, id).pile;
}

/** Graisse réellement disponible (la plus proche). @param {any} cfg @param {string} id @param {number} poids */
export function graisseDisponible(cfg, id, poids) {
  const dispo = famille(cfg, id).poids;
  return dispo.includes(poids) ? poids : dispo.reduce((m, p) => (Math.abs(p - poids) < Math.abs(m - poids) ? p : m), dispo[0]);
}

/** Chemin relatif d'un fichier de police dans vendor/ et dans le kit. */
export const cheminPolice = (id, poids, ext = 'woff2') => `vendor/fonts/${id}/${id}-${poids}.${ext}`;
