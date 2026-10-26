// @ts-check
/**
 * Générateur pseudo-aléatoire à graine (déterministe).
 * Aucune utilisation de Math.random() ni de Date.now() dans core/.
 */

/** Alphabet de Crockford (sans I, L, O, U) : lisible à voix haute. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Transforme un texte en entier 32 bits non signé (xmur3).
 * @param {string} texte
 * @returns {number}
 */
export function hacher(texte) {
  let h = 1779033703 ^ texte.length;
  for (let i = 0; i < texte.length; i++) {
    h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * mulberry32 : renvoie une fonction qui donne un nombre dans [0, 1).
 * @param {number} graine entier 32 bits
 * @returns {() => number}
 */
export function mulberry32(graine) {
  let a = graine >>> 0;
  return function suivant() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Crée un générateur à partir d'une graine texte.
 * @param {string} graine
 */
export function creerPrng(graine) {
  const base = mulberry32(hacher(String(graine)));
  return {
    /** @returns {number} dans [0, 1) */
    suivant: base,
    /** Entier dans [min, max] inclus. */
    entier(/** @type {number} */ min, /** @type {number} */ max) {
      return min + Math.floor(base() * (max - min + 1));
    },
    /** Réel dans [min, max). */
    reel(/** @type {number} */ min, /** @type {number} */ max) {
      return min + base() * (max - min);
    },
    /** Choisit un élément. @template T @param {T[]} liste @returns {T} */
    choix(liste) {
      if (!liste.length) throw new Error('choix() : liste vide');
      return liste[Math.floor(base() * liste.length)];
    },
    /** Tirage pondéré. @template T @param {T[]} liste @param {number[]} poids @returns {T} */
    choixPondere(liste, poids) {
      const total = poids.reduce((s, p) => s + Math.max(0, p), 0);
      if (!liste.length) throw new Error('choixPondere() : liste vide');
      if (total <= 0) return liste[Math.floor(base() * liste.length)];
      let x = base() * total;
      for (let i = 0; i < liste.length; i++) {
        x -= Math.max(0, poids[i]);
        if (x < 0) return liste[i];
      }
      return liste[liste.length - 1];
    },
    /** Mélange de Fisher-Yates, sans modifier l'original. @template T @param {T[]} liste @returns {T[]} */
    melanger(liste) {
      const c = liste.slice();
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(base() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
    /** Booléen avec probabilité p. */
    pile(/** @type {number} */ p = 0.5) {
      return base() < p;
    }
  };
}

/**
 * Fabrique un code lisible « K7M2-9QX » (7 caractères) à partir d'un générateur.
 * @param {{ suivant: () => number }} prng
 * @returns {string}
 */
export function genererCode(prng) {
  let s = '';
  for (let i = 0; i < 7; i++) s += ALPHABET[Math.floor(prng.suivant() * 32)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/**
 * Normalise une saisie utilisateur en code valide, ou renvoie null.
 * Accepte minuscules, espaces, tirets absents, et les confusions O/0, I/L/1.
 * @param {string} saisie
 * @returns {string | null}
 */
export function normaliserCode(saisie) {
  const brut = String(saisie ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  if (brut.length !== 7) return null;
  for (const c of brut) if (!ALPHABET.includes(c)) return null;
  return `${brut.slice(0, 4)}-${brut.slice(4)}`;
}

/**
 * Dérive un code de proposition à partir d'un code de série et d'un rang.
 * @param {string} codeSerie
 * @param {number} rang
 * @returns {string}
 */
export function deriverCode(codeSerie, rang) {
  return genererCode(creerPrng(`${codeSerie}#${rang}`));
}
