// @ts-check
import { texteVersTraces, largeurApprox } from './textToPath.js';
import { blocTexte } from './layouts.js';

export const n2 = (n) => String(Math.round(n * 100) / 100);
export const echapper = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Intègre un logo SVG dans un autre SVG, à la largeur voulue, sans élément image.
 * @param {string} svg SVG produit par composerLogo (viewBox obligatoire)
 * @param {number} x @param {number} y @param {number} largeur
 * @returns {{ markup: string, hauteur: number }}
 */
export function integrerSvg(svg, x, y, largeur) {
  const vb = /viewBox="([-\d.\s]+)"/.exec(svg);
  if (!vb) return { markup: '', hauteur: 0 };
  const [a, b, w, h] = vb[1].trim().split(/\s+/).map(Number);
  const s = largeur / w;
  const debut = svg.indexOf('>') + 1;
  let interieur = svg.slice(debut, svg.lastIndexOf('</svg>'));
  const t1 = interieur.indexOf('<title>');
  if (t1 !== -1) interieur = interieur.slice(0, t1) + interieur.slice(interieur.indexOf('</title>') + 8);
  return { markup: `<g transform="translate(${n2(x - a * s)} ${n2(y - b * s)}) scale(${n2(s)})">${interieur}</g>`, hauteur: h * s };
}

/**
 * Paragraphe à retour à la ligne automatique (tracés si police, sinon <text>).
 * @param {any} police @param {string} texte
 * @param {{ x:number, y:number, largeur:number, taille:number, couleur:string, interligne?:number, ancre?:'gauche'|'milieu', maxLignes?:number, pile?:string, espacement?:number }} o
 * @returns {{ markup: string, hauteur: number, lignes: number }}
 */
export function paragraphe(police, texte, o) {
  const { x, y, largeur, taille, couleur, interligne = 1.3, ancre = 'gauche', maxLignes = 12, pile, espacement = 0 } = o;
  const mesure = (t) => (police ? texteVersTraces(police, t, { taille, espacement }).largeur : largeurApprox(t, taille));
  const mots = String(texte).split(/\s+/).filter(Boolean);
  const lignes = [];
  let courante = '';
  for (const m of mots) {
    const essai = courante ? `${courante} ${m}` : m;
    if (courante && mesure(essai) > largeur) {
      lignes.push(courante);
      courante = m;
    } else courante = essai;
  }
  if (courante) lignes.push(courante);
  const gardees = lignes.slice(0, maxLignes);
  if (lignes.length > maxLignes) gardees[maxLignes - 1] = gardees[maxLignes - 1].replace(/\s*\S*$/, '…');
  let markup = '';
  gardees.forEach((l, i) => {
    const bx = ancre === 'milieu' ? x + largeur / 2 : x;
    markup += blocTexte(police, l, taille, couleur, espacement, bx, y + i * taille * interligne, ancre, pile).markup;
  });
  return { markup, hauteur: gardees.length * taille * interligne, lignes: gardees.length };
}

/** Racine SVG standard. */
export function racineSvg(x, y, w, h, contenu, titre) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)}" width="${n2(w)}" height="${n2(h)}" role="img" aria-label="${echapper(titre)}"><title>${echapper(titre)}</title>${contenu}</svg>`;
}

/** Palette du mode clair/sombre sous forme d'objet de rôles. */
export const mode = (palette, sombre) => (sombre ? palette.sombre : palette);

/**
 * Logo aligné à gauche, ancré par son BAS (yBas), borné en largeur ET en hauteur (jamais rogné).
 * @param {string} svg @param {number} x @param {number} yBas @param {number} largeurMax @param {number} hauteurMax
 */
export function integrerSvgBorne(svg, x, yBas, largeurMax, hauteurMax) {
  const ratio = integrerSvg(svg, 0, 0, 100).hauteur / 100;
  const largeur = Math.min(largeurMax, hauteurMax / (ratio || 1));
  return integrerSvg(svg, x, yBas - largeur * ratio, largeur);
}
