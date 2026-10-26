// @ts-check
/** Normalisation de texte français : minuscules, sans accents, jetons au singulier approximatif. */

/** @param {string} s */
export function sansAccents(s) {
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** @param {string} s @returns {string[]} */
export function jetons(s) {
  return sansAccents(s)
    .split(/[^a-z0-9]+/)
    .filter((j) => j.length >= 3)
    .map((j) => (j.length > 3 && (j.endsWith('s') || j.endsWith('x')) ? j.slice(0, -1) : j));
}

/** Première lettre en majuscule. @param {string} s */
export function capitaliser(s) {
  const t = String(s ?? '');
  return t ? t[0].toLocaleUpperCase('fr') + t.slice(1) : t;
}

/** Première lettre en minuscule. @param {string} s */
export function minusculeInitiale(s) {
  const t = String(s ?? '');
  return t ? t[0].toLocaleLowerCase('fr') + t.slice(1) : t;
}

/** Le mot commence-t-il par une voyelle ou un h muet (élision) ? */
export function elidable(mot) {
  const c = sansAccents(mot)[0] || '';
  return 'aeiouyh'.includes(c);
}

/** « de » / « d' » devant un mot. */
export const de = (mot) => (elidable(mot) ? `d’${mot}` : `de ${mot}`);
/** Article défini selon le genre : « le », « la » ou « l’ ». */
export const article = (mot, genre) => (elidable(mot) ? `l’${mot}` : `${genre === 'f' ? 'la' : 'le'} ${mot}`);
