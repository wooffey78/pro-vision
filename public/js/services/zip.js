// @ts-check
/**
 * Création de ZIP déterministe avec fflate : mêmes fichiers → mêmes octets.
 * Date fixe (1980-01-01, heure locale « neutre »), ordre alphabétique, niveau constant.
 */

/** @param {any} fflate module fflate (importé dynamiquement) */
export function creerZip(fflate, fichiers) {
  const encodeur = new TextEncoder();
  const date = new Date(1980, 0, 1, 0, 0, 0);
  /** @type {Record<string, [Uint8Array, object]>} */
  const entrees = {};
  for (const chemin of Object.keys(fichiers).sort()) {
    const contenu = fichiers[chemin];
    const octets = typeof contenu === 'string' ? encodeur.encode(contenu) : contenu;
    entrees[chemin] = [octets, { level: 6, mtime: date, os: 3 }];
  }
  return fflate.zipSync(entrees, { level: 6 });
}

/** Charge fflate depuis vendor (navigateur) — importé à la demande. */
export async function chargerFflate() {
  return import('../../vendor/fflate/fflate.js');
}
