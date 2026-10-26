// @ts-check
/**
 * Texte → tracés vectoriels, glyphe par glyphe.
 * On évite font.getPath() : opentype.js 2.0 échoue sur certaines tables GSUB (lookup 6, format 2).
 * Conséquence assumée : pas de ligatures ; le crénage n'est appliqué que s'il est lisible
 * dans la table « kern » (sinon 0). La police est injectée : ce module reste pur et testable.
 */

/** @param {number} n */
const r2 = (n) => Math.round(n * 100) / 100;

/** Nombre arrondi à 2 décimales, sans « -0 » ni notation exponentielle. @param {number} n */
const num = (n) => {
  const r = Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/**
 * Sérialise les commandes d'un chemin opentype.js. On n'utilise pas toPathData() :
 * dans opentype.js 2.0 il peut produire des « NaN » dans certains tracés.
 * @param {{type:string,x?:number,y?:number,x1?:number,y1?:number,x2?:number,y2?:number}[]} commandes
 */
export function commandesVersD(commandes) {
  let d = '';
  for (const c of commandes) {
    if (c.type === 'Z') d += 'Z';
    else if (c.type === 'M' || c.type === 'L') d += `${c.type}${num(/** @type {number} */ (c.x))} ${num(/** @type {number} */ (c.y))}`;
    else if (c.type === 'Q') d += `Q${num(/** @type {number} */ (c.x1))} ${num(/** @type {number} */ (c.y1))} ${num(/** @type {number} */ (c.x))} ${num(/** @type {number} */ (c.y))}`;
    else if (c.type === 'C') d += `C${num(/** @type {number} */ (c.x1))} ${num(/** @type {number} */ (c.y1))} ${num(/** @type {number} */ (c.x2))} ${num(/** @type {number} */ (c.y2))} ${num(/** @type {number} */ (c.x))} ${num(/** @type {number} */ (c.y))}`;
  }
  return d;
}

/**
 * @param {any} police objet opentype.js Font
 * @param {string} texte
 * @param {{ taille?: number, espacement?: number }} [o] espacement en fraction de la taille (em)
 * @returns {{ d: string, largeur: number, bbox: {x1:number,y1:number,x2:number,y2:number}, xHeight: number, capHeight: number }}
 */
export function texteVersTraces(police, texte, { taille = 100, espacement = 0 } = {}) {
  const echelle = taille / police.unitsPerEm;
  let x = 0;
  let precedent = null;
  const morceaux = [];
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const ch of texte) {
    const g = police.charToGlyph(ch);
    if (precedent) {
      let k = 0;
      try {
        k = police.getKerningValue(precedent, g) || 0;
      } catch {
        k = 0;
      }
      x += k * echelle;
    }
    const chemin = g.getPath(x, 0, taille);
    const data = commandesVersD(chemin.commands);
    if (data) {
      morceaux.push(data);
      const b = chemin.getBoundingBox();
      x1 = Math.min(x1, b.x1);
      y1 = Math.min(y1, b.y1);
      x2 = Math.max(x2, b.x2);
      y2 = Math.max(y2, b.y2);
    }
    x += (g.advanceWidth || 0) * echelle + espacement * taille;
    precedent = g;
  }
  if (!morceaux.length) {
    x1 = 0; y1 = 0; x2 = 0; y2 = 0;
  }
  const os2 = police.tables && police.tables.os2;
  const xHeight = os2 && os2.sxHeight ? os2.sxHeight * echelle : taille * 0.5;
  const capHeight = os2 && os2.sCapHeight ? os2.sCapHeight * echelle : taille * 0.7;
  return {
    d: morceaux.join(''),
    largeur: r2(Math.max(0, x - espacement * taille)),
    bbox: { x1: r2(x1), y1: r2(y1), x2: r2(x2), y2: r2(y2) },
    xHeight: r2(xHeight),
    capHeight: r2(capHeight)
  };
}

/**
 * Estimation de largeur sans police (repli).
 * @param {string} texte @param {number} taille
 */
export function largeurApprox(texte, taille) {
  return [...texte].length * taille * 0.56;
}

/** Applique la casse choisie. @param {string} texte @param {'normal'|'majuscules'|'minuscules'} casse */
export function appliquerCasse(texte, casse) {
  if (casse === 'majuscules') return texte.toLocaleUpperCase('fr');
  if (casse === 'minuscules') return texte.toLocaleLowerCase('fr');
  return texte;
}

/**
 * Initiales (1 ou 2 lettres) d'un nom d'entreprise.
 * @param {string} nom
 */
export function initiales(nom) {
  const mots = nom.split(/[\s'’-]+/).filter((m) => m && !['de', 'du', 'des', 'la', 'le', 'les', 'et', 'l', 'd'].includes(m.toLowerCase()));
  const base = mots.length ? mots : [nom];
  const lettres = base.slice(0, 2).map((m) => [...m][0] || '');
  return lettres.join('').toLocaleUpperCase('fr') || '?';
}
