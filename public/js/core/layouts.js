// @ts-check
import { construireMarque } from './marks.js';
import { texteVersTraces, largeurApprox, appliquerCasse, initiales } from './textToPath.js';

/** Dispositions disponibles. */
export const DISPOSITIONS = ['symbole-dessus', 'symbole-gauche', 'symbole-droite', 'nom-seul', 'monogramme', 'deux-lignes', 'bandeau', 'badge'];
/** Contenants disponibles. */
export const CONTENANTS = ['aucun', 'cercle', 'carre-arrondi', 'ecusson', 'hexagone'];

const n2 = (n) => String(Math.round(n * 100) / 100);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Couleurs du logo selon la variante.
 * @param {'couleur'|'sombre'|'noir'|'blanc'} mode @param {any} palette
 */
export function couleursLogo(mode, palette) {
  if (mode === 'noir') return { symbole: '#000000', accent: '#000000', texte: '#000000', attenue: '#000000', contenant: null, surContenant: '#000000', trait: '#000000' };
  if (mode === 'blanc') return { symbole: '#ffffff', accent: '#ffffff', texte: '#ffffff', attenue: '#ffffff', contenant: null, surContenant: '#ffffff', trait: '#ffffff' };
  const m = mode === 'sombre' ? palette.sombre : palette;
  return { symbole: m.principale, accent: m.accent, texte: m.texte, attenue: m.texteAttenue, contenant: m.principale, surContenant: m.surPrincipale, trait: m.principale };
}

/** Contenant dans une boîte 100×100. */
function contenantSvg(type, c) {
  const rempli = c.contenant !== null;
  const style = rempli ? `fill="${c.contenant}"` : `fill="none" stroke="${c.trait}" stroke-width="4"`;
  switch (type) {
    case 'cercle': return `<circle cx="50" cy="50" r="${rempli ? 48 : 46}" ${style}/>`;
    case 'carre-arrondi': return `<rect x="${rempli ? 2 : 4}" y="${rempli ? 2 : 4}" width="${rempli ? 96 : 92}" height="${rempli ? 96 : 92}" rx="22" ${style}/>`;
    case 'ecusson': return `<path d="M50 3L92 17V50C92 76 72 91 50 97C28 91 8 76 8 50V17Z" ${style}/>`;
    case 'hexagone': return `<path d="M50 3L91 26V74L50 97L9 74V26Z" ${style}/>`;
    default: return '';
  }
}

/**
 * Symbole (marque procédurale ou Lucide) centré dans (cx, cy) à la taille donnée.
 * @param {any} symbole @param {Record<string,string>} charges contenu interne des SVG Lucide par id
 */
function symboleSvg(symbole, couleur, accent, cx, cy, taille, epaisseur, charges, style = 'standard') {
  const x = cx - taille / 2;
  const y = cy - taille / 2;
  if (symbole.type === 'lucide' && charges[symbole.id]) {
    const s = taille / 24;
    const trait = { fin: 1, standard: epaisseur, epais: 3.4, plein: 1.2, simpliste: epaisseur }[style] ?? epaisseur;
    const dessin = style === 'plein' ? `fill="${couleur}" stroke="${couleur}"` : `fill="none" stroke="${couleur}"`;
    return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s)})" ${dessin} stroke-width="${n2(trait)}" stroke-linecap="round" stroke-linejoin="round">${charges[symbole.id]}</g>`;
  }
  const famille = symbole.type === 'marque' ? symbole.id : 'cercle-arc';
  const m = construireMarque(famille, symbole.params || {});
  const point = m.accent ? `<circle cx="${n2(m.accent.cx)}" cy="${n2(m.accent.cy)}" r="${n2(m.accent.r)}" fill="${accent}"/>` : '';
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(taille / 100)})"><path d="${m.d}" fill="${couleur}" fill-rule="${m.regle}"/>${point}</g>`;
}

/**
 * Bloc de texte en tracés (ou <text> de repli si aucune police). Origine : bord gauche encre, ligne de base y.
 * @returns {{ markup: string, w: number, haut: number, bas: number, cap: number, repli: boolean }}
 */
function bloc(police, texte, taille, couleur, espacement, x, y, ancre, pile) {
  if (police) {
    const t = texteVersTraces(police, texte, { taille, espacement });
    const largeur = t.bbox.x2 - t.bbox.x1;
    const tx = ancre === 'milieu' ? x - (t.bbox.x1 + t.bbox.x2) / 2 : x - t.bbox.x1;
    return { markup: `<path transform="translate(${n2(tx)} ${n2(y)})" d="${t.d}" fill="${couleur}"/>`, w: largeur, haut: -t.bbox.y1, bas: t.bbox.y2, cap: t.capHeight, repli: false };
  }
  const w = largeurApprox(texte, taille);
  const a = ancre === 'milieu' ? 'middle' : 'start';
  return { markup: `<text x="${n2(x)}" y="${n2(y)}" font-family="${esc(pile || 'sans-serif')}" font-size="${n2(taille)}" font-weight="700" text-anchor="${a}" fill="${couleur}">${esc(texte)}</text>`, w, haut: taille * 0.72, bas: taille * 0.2, cap: taille * 0.7, repli: true };
}

/** Largeur de l'encre d'un texte à une taille donnée (pour dimensionner). */
function largeurEncre(police, texte, taille, espacement) {
  if (!police) return largeurApprox(texte, taille);
  const t = texteVersTraces(police, texte, { taille, espacement });
  return t.bbox.x2 - t.bbox.x1;
}

/** Coupe un nom en deux lignes équilibrées (null si un seul mot). */
function couperNom(nom) {
  const mots = nom.split(' ').filter(Boolean);
  if (mots.length < 2) return null;
  let meilleur = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const a = mots.slice(0, i).join(' ').length;
    const b = mots.slice(i).join(' ').length;
    if (Math.abs(a - b) < ecart) {
      ecart = Math.abs(a - b);
      meilleur = i;
    }
  }
  return [mots.slice(0, meilleur).join(' '), mots.slice(meilleur).join(' ')];
}

/**
 * Compose un logo complet.
 * @param {Object} o
 * @param {{ nom: string, mention?: string }} o.entreprise
 * @param {any} o.logo configuration du logo du projet
 * @param {any} o.palette
 * @param {{ titres: any, texte: any, pileTitres?: string, pileTexte?: string }} o.polices polices opentype (ou null)
 * @param {Record<string,string>} [o.symboles] contenu Lucide
 * @param {'couleur'|'sombre'|'noir'|'blanc'} [o.mode]
 * @param {string} [o.disposition] force une disposition
 * @param {'icone'|'complet'} [o.portee] « icone » : symbole seul
 * @param {boolean} [o.protection] ajoute la zone de protection au viewBox
 * @param {boolean} [o.fond] ajoute un fond plein (couleur de fond du mode)
 * @param {string} [o.contenantForce] @param {number} [o.epaisseurMin]
 * @returns {{ svg: string, largeur: number, hauteur: number, description: string, avertissements: string[] }}
 */
export function composerLogo(o) {
  const { entreprise, logo, palette, polices, symboles = {}, mode = 'couleur', portee = 'complet', protection = true, fond = false } = o;
  const c = couleursLogo(mode, palette);
  const avert = [];
  let disposition = o.disposition || logo.disposition;
  const nom = appliquerCasse(entreprise.nom, logo.casseNom || 'normal');
  const mention = entreprise.mention ? appliquerCasse(entreprise.mention, 'normal') : '';
  const esp = logo.espacementLettres ?? 0.02;
  const ep = Math.max(logo.epaisseurTrait ?? 2, o.epaisseurMin ?? 0);
  const police = polices.titres;
  const policeT = polices.texte || polices.titres;
  if (!police) avert.push('Police non chargée : le nom est écrit en texte (police de secours) au lieu de tracés.');
  let contenant = o.contenantForce || logo.contenant || 'aucun';
  const style = logo.style || 'standard';
  if (style === 'simpliste') contenant = 'aucun';
  if (disposition === 'badge') {
    disposition = 'symbole-dessus';
    if (contenant === 'aucun') contenant = 'ecusson';
  }
  if (disposition === 'monogramme' && contenant === 'aucun') contenant = 'cercle';
  /** @type {string[]} */
  const parts = [];
  let bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;
  const etendre = (x1, y1, x2, y2) => {
    bx1 = Math.min(bx1, x1); by1 = Math.min(by1, y1); bx2 = Math.max(bx2, x2); by2 = Math.max(by2, y2);
  };

  /** Dessine le symbole 100×100 à (x, y). */
  const dessinerSymbole = (x, y) => {
    let g = '';
    const rempli = c.contenant !== null;
    if (contenant !== 'aucun') g += contenantSvg(contenant, c);
    if (disposition === 'monogramme') {
      const ini = initiales(entreprise.nom);
      const taille = ini.length > 1 ? 40 : 52;
      const t = bloc(police, ini, taille, rempli ? c.surContenant : c.symbole, 0, 50, 50 + taille * 0.35, 'milieu', polices.pileTitres);
      g += t.markup;
    } else {
      const taille = contenant === 'aucun' ? 100 : 54;
      const couleur = contenant !== 'aucun' && rempli ? c.surContenant : c.symbole;
      const accent = contenant !== 'aucun' ? couleur : c.accent;
      g += symboleSvg(logo.symbole, couleur, accent, 50, 50, taille, contenant === 'aucun' ? ep : ep * 1.0, symboles, style);
    }
    parts.push(`<g transform="translate(${n2(x)} ${n2(y)})">${g}</g>`);
    etendre(x, y, x + 100, y + 100);
  };

  let capRef = 12;
  if (portee === 'icone') {
    dessinerSymbole(0, 0);
    capRef = 25;
  } else if (disposition === 'nom-seul') {
    const taille = Math.min(60, (460 / Math.max(1, largeurEncre(police, nom, 100, esp))) * 100);
    const n = bloc(police, nom, taille, c.texte, esp, 0, taille * 0.72, 'gauche', polices.pileTitres);
    parts.push(n.markup);
    etendre(0, 0, n.w, n.haut + n.bas);
    capRef = n.cap;
    if (mention) {
      const m = bloc(policeT, mention, taille * 0.34, c.attenue, 0.06, 0, taille * 0.72 + taille * 0.55, 'gauche', polices.pileTexte);
      parts.push(m.markup);
      etendre(0, 0, Math.max(n.w, m.w), taille * 0.72 + taille * 0.55 + m.bas);
    }
  } else if (disposition === 'bandeau') {
    // Nom seul encadré de filets : rythme horizontal, typographie espacée en capitales.
    const texteBandeau = nom.toLocaleUpperCase('fr');
    const taille = Math.min(54, (420 / Math.max(1, largeurEncre(police, texteBandeau, 100, 0.12))) * 100);
    const probe = bloc(police, texteBandeau, taille, c.texte, 0.12, 0, 0, 'gauche', polices.pileTitres);
    const L = 46;
    const G = 16;
    const yBase = taille * 0.72;
    const milieu = yBase - probe.cap / 2;
    const n = bloc(police, texteBandeau, taille, c.texte, 0.12, L + G, yBase, 'gauche', polices.pileTitres);
    parts.push(`<rect x="0" y="${n2(milieu - ep / 2)}" width="${L}" height="${n2(ep)}" fill="${c.accent}"/>`);
    parts.push(`<rect x="${n2(L + G + n.w + G)}" y="${n2(milieu - ep / 2)}" width="${L}" height="${n2(ep)}" fill="${c.accent}"/>`);
    parts.push(n.markup);
    etendre(0, milieu - ep / 2, L + G + n.w + G + L, yBase + n.bas);
    capRef = n.cap;
    if (mention) {
      const m = bloc(policeT, mention, taille * 0.3, c.attenue, 0.06, (L + G + n.w + G + L) / 2, yBase + taille * 0.55, 'milieu', polices.pileTexte);
      parts.push(m.markup);
      etendre(0, yBase, L + G + n.w + G + L, yBase + taille * 0.55 + m.bas);
    }
  } else if (disposition === 'symbole-dessus') {
    const w100 = largeurEncre(police, nom, 100, esp);
    const taille = Math.min(46, (380 / Math.max(1, w100)) * 100);
    const probe = bloc(police, nom, taille, c.texte, esp, 0, 0, 'milieu', polices.pileTitres);
    const mProbe = mention ? bloc(policeT, mention, taille * 0.34, c.attenue, 0.06, 0, 0, 'milieu', polices.pileTexte) : null;
    const W = Math.max(100, probe.w, mProbe ? mProbe.w : 0);
    dessinerSymbole(W / 2 - 50, 0);
    const yNom = 100 + 24 + probe.cap;
    const n = bloc(police, nom, taille, c.texte, esp, W / 2, yNom, 'milieu', polices.pileTitres);
    parts.push(n.markup);
    etendre(W / 2 - n.w / 2, yNom - n.haut, W / 2 + n.w / 2, yNom + n.bas);
    capRef = n.cap;
    if (mention) {
      const yM = yNom + 14 + taille * 0.24 + taille * 0.34 * 0.7;
      parts.push(`<rect x="${n2(W / 2 - 14)}" y="${n2(yNom + 12)}" width="28" height="3" rx="1.5" fill="${c.accent}"/>`);
      const m = bloc(policeT, mention, taille * 0.34, c.attenue, 0.06, W / 2, yM + 6, 'milieu', polices.pileTexte);
      parts.push(m.markup);
      etendre(W / 2 - m.w / 2, yM + 6 - m.haut, W / 2 + m.w / 2, yM + 6 + m.bas);
    }
  } else {
    // gauche / droite / deux-lignes / monogramme : symbole à côté d'un bloc de texte centré verticalement
    const lignes = disposition === 'deux-lignes' ? couperNom(nom) || [nom] : [nom];
    const plusLarge = lignes.reduce((a, b) => (largeurEncre(police, a, 100, esp) >= largeurEncre(police, b, 100, esp) ? a : b));
    const taille = Math.min(lignes.length > 1 ? 40 : 50, (400 / Math.max(1, largeurEncre(police, plusLarge, 100, esp))) * 100);
    const capN = bloc(police, 'H', taille, c.texte, 0, 0, 0, 'gauche', polices.pileTitres).cap;
    const interligne = capN * 0.55;
    const hMention = mention ? taille * 0.34 * 0.7 : 0;
    const hTotal = lignes.length * capN + (lignes.length - 1) * interligne + (mention ? capN * 0.7 + hMention : 0);
    let yCourant = 50 - hTotal / 2 + capN;
    const sondes = lignes.map((l) => bloc(police, l, taille, c.texte, esp, 0, 0, 'gauche', polices.pileTitres).w);
    const mProbe = mention ? bloc(policeT, mention, taille * 0.34, c.attenue, 0.06, 0, 0, 'gauche', polices.pileTexte) : null;
    const wTexte = Math.max(...sondes, mProbe ? mProbe.w : 0);
    const gap = 26;
    const droite = disposition === 'symbole-droite';
    const xSym = droite ? wTexte + gap : 0;
    const xTexte = droite ? 0 : 100 + gap;
    dessinerSymbole(xSym, 0);
    lignes.forEach((l, i) => {
      const n = bloc(police, l, taille, c.texte, esp, xTexte, yCourant, 'gauche', polices.pileTitres);
      parts.push(n.markup);
      etendre(xTexte, yCourant - n.haut, xTexte + n.w, yCourant + n.bas);
      capRef = n.cap;
      if (i < lignes.length - 1) yCourant += capN + interligne;
    });
    if (mention) {
      parts.push(`<rect x="${n2(xTexte)}" y="${n2(yCourant + capN * 0.42)}" width="28" height="3" rx="1.5" fill="${c.accent}"/>`);
      const yM = yCourant + capN * 0.42 + 3 + hMention + capN * 0.35;
      const m = bloc(policeT, mention, taille * 0.34, c.attenue, 0.06, xTexte, yM, 'gauche', polices.pileTexte);
      parts.push(m.markup);
      etendre(xTexte, yM - m.haut, xTexte + m.w, yM + m.bas);
    }
  }
  const marge = protection ? Math.max(8, capRef) : 4;
  const x = bx1 - marge;
  const y = by1 - marge;
  const w = bx2 - bx1 + 2 * marge;
  const h = by2 - by1 + 2 * marge;
  const fondSvg = fond ? `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" fill="${(mode === 'sombre' ? palette.sombre : palette).fond}"/>` : '';
  const description = `Logo de ${entreprise.nom}${mention ? `, ${mention}` : ''} : ${portee === 'icone' ? 'symbole seul' : 'symbole et nom'}.`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)}" width="${n2(w)}" height="${n2(h)}" role="img" aria-label="${esc(description)}"><title>${esc(entreprise.nom)}</title>${fondSvg}${parts.join('')}</svg>`;
  return { svg, largeur: +n2(w), hauteur: +n2(h), description, avertissements: avert, marge: +n2(marge) };
}

export { bloc as blocTexte, largeurEncre };
