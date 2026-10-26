// @ts-check
/**
 * Marques géométriques procédurales : 12 familles dessinées par le code, sans bibliothèque.
 * Chaque famille produit UN SEUL <path> fermé dans un viewBox 0 0 100 100 (+ un point d'accent optionnel).
 * Les paramètres sont stockés dans le projet : `construireMarque(famille, params)` est pure et
 * ne dépend d'aucun générateur aléatoire, ce qui garde un projet stable d'une version à l'autre.
 */

/** @typedef {(['M', number, number] | ['L', number, number] | ['C', number, number, number, number, number, number] | ['Z'])[]} Cmds */

import { FAMILLES_GEO, parametresGeo, construireGeo } from './marks-geo.js';

const FAMILLES_BASE = ['cercle-arc', 'petales', 'vague', 'feuille', 'montagne', 'soleil', 'goutte', 'hexagone', 'monogramme', 'ruban', 'etoile', 'boucle', 'arche', 'bouclier', 'spirale', 'losange', 'deux-cercles', 'quart-cercle', 'damier', 'fleche', 'pilier', 'coeur', 'trefle', 'croix', 'orbite', 'anneaux', 'ruche'];
export const FAMILLES_MARQUES = [...FAMILLES_BASE, ...FAMILLES_GEO];

const rad = (d) => (d * Math.PI) / 180;
const clampM = (x, a, b) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
const arrondi = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Arc de cercle approché par des courbes de Bézier cubiques (segments ≤ 90°). @returns {Cmds} sans le M initial */
function arcBezier(cx, cy, r, a0, a1) {
  const out = [];
  const total = a1 - a0;
  const n = Math.max(1, Math.ceil(Math.abs(total) / 90));
  const pas = total / n;
  for (let i = 0; i < n; i++) {
    const s = rad(a0 + i * pas);
    const e = rad(a0 + (i + 1) * pas);
    const k = (4 / 3) * Math.tan((e - s) / 4);
    out.push(['C', cx + r * (Math.cos(s) - k * Math.sin(s)), cy + r * (Math.sin(s) + k * Math.cos(s)), cx + r * (Math.cos(e) + k * Math.sin(e)), cy + r * (Math.sin(e) - k * Math.cos(e)), cx + r * Math.cos(e), cy + r * Math.sin(e)]);
  }
  return out;
}
const pt = (cx, cy, r, a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

/** Cercle complet (sens trigonométrique si sens=1, inverse si sens=-1). @returns {Cmds} */
function cercle(cx, cy, r, sens = 1) {
  const [x, y] = pt(cx, cy, r, 0);
  return [['M', x, y], ...arcBezier(cx, cy, r, 0, 360 * sens), ['Z']];
}

/** Polygone fermé. @param {number[][]} pts @returns {Cmds} */
function polygone(pts) {
  return [['M', pts[0][0], pts[0][1]], ...pts.slice(1).map((p) => /** @type {any} */ (['L', p[0], p[1]])), ['Z']];
}

/** Applique une transformation (x, y) → (x', y') à tous les points. @param {Cmds} cmds @param {(x:number,y:number)=>number[]} f @returns {Cmds} */
function transformer(cmds, f) {
  return cmds.map((c) => {
    if (c[0] === 'Z') return c;
    const o = [c[0]];
    for (let i = 1; i < c.length; i += 2) o.push(...f(/** @type {number} */ (c[i]), /** @type {number} */ (c[i + 1])));
    return /** @type {any} */ (o);
  });
}
const tourner = (cmds, cx, cy, deg) => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return transformer(cmds, (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

/** Points échantillonnés (pour boîte englobante et centre de masse). @param {Cmds} cmds */
function echantillons(cmds) {
  /** @type {number[][]} */
  const pts = [];
  let x0 = 0;
  let y0 = 0;
  for (const c of cmds) {
    if (c[0] === 'M' || c[0] === 'L') {
      pts.push([c[1], c[2]]);
      [x0, y0] = [c[1], c[2]];
    } else if (c[0] === 'C') {
      for (let t = 1 / 8; t <= 1.0001; t += 1 / 8) {
        const u = 1 - t;
        pts.push([u * u * u * x0 + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5], u * u * u * y0 + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6]]);
      }
      [x0, y0] = [c[5], c[6]];
    }
  }
  return pts;
}

/** @param {Cmds} cmds @returns {string} */
function enChaine(cmds) {
  return cmds.map((c) => c[0] + c.slice(1).map(arrondi).join(' ')).join('');
}

/**
 * Normalise : mise à l'échelle uniforme dans une boîte de 92 (marge 4), centrage de la boîte englobante
 * puis correction optique par le centre de masse (limitée à ±4).
 * @param {Cmds} cmds @param {{cx:number,cy:number,r:number}|null} accent
 */
function normaliser(cmds, accent) {
  const pts = echantillons(cmds);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x1 = Math.min(...xs);
  const x2 = Math.max(...xs);
  const y1 = Math.min(...ys);
  const y2 = Math.max(...ys);
  const echelle = 92 / Math.max(x2 - x1, y2 - y1, 1e-6);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const gx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const gy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const borne = (v) => Math.max(-4, Math.min(4, v));
  const dx = borne((mx - gx) * echelle * 0.35);
  const dy = borne((my - gy) * echelle * 0.35);
  const f = (x, y) => [50 + (x - mx) * echelle + dx, 50 + (y - my) * echelle + dy];
  return {
    cmds: transformer(cmds, f),
    accent: accent ? { cx: f(accent.cx, accent.cy)[0], cy: f(accent.cx, accent.cy)[1], r: accent.r * echelle } : null
  };
}

/**
 * Paramètres aléatoires (graine) pour une famille.
 * @param {string} famille
 * @param {{ entier:(a:number,b:number)=>number, reel:(a:number,b:number)=>number }} prng
 */
export function parametresMarque(famille, prng) {
  switch (famille) {
    case 'cercle-arc': return { ouverture: prng.entier(60, 140), angle: prng.entier(0, 359), epaisseur: +prng.reel(0.2, 0.38).toFixed(2) };
    case 'petales': return { n: prng.entier(3, 8), angle: prng.entier(0, 359), epaisseur: +prng.reel(0.35, 0.8).toFixed(2) };
    case 'vague': return { bandes: prng.entier(2, 3), amplitude: +prng.reel(0.15, 0.3).toFixed(2), epaisseur: +prng.reel(0.12, 0.2).toFixed(2) };
    case 'feuille': return { asymetrie: +prng.reel(-0.25, 0.25).toFixed(2), angle: prng.entier(-40, 40) };
    case 'montagne': return { pics: prng.entier(2, 3), hauteur: +prng.reel(0.55, 0.9).toFixed(2) };
    case 'soleil': return { n: prng.entier(8, 14), disque: +prng.reel(0.3, 0.48).toFixed(2), epaisseur: +prng.reel(0.22, 0.4).toFixed(2) };
    case 'goutte': return { reflet: prng.pile(0.5) ? 1 : 0, inclinaison: prng.entier(-20, 20) };
    case 'hexagone': return { epaisseur: +prng.reel(0.16, 0.3).toFixed(2), angle: prng.pile(0.5) ? 0 : 30 };
    case 'monogramme': return { epaisseur: +prng.reel(0.08, 0.16).toFixed(2) };
    case 'ruban': return { bandes: prng.entier(2, 3), pente: prng.entier(25, 45) };
    case 'etoile': return { n: prng.entier(5, 8), creux: +prng.reel(0.4, 0.58).toFixed(2), angle: prng.entier(0, 44) };
    case 'boucle': return { epaisseur: +prng.reel(0.14, 0.24).toFixed(2), angle: prng.entier(-25, 25) };
    case 'arche': return { epaisseur: +prng.reel(0.25, 0.4).toFixed(2) };
    case 'bouclier': return { epaisseur: +prng.reel(0.1, 0.2).toFixed(2) };
    case 'spirale': return { tours: +prng.reel(1.5, 2.6).toFixed(2), epaisseur: +prng.reel(0.12, 0.2).toFixed(2) };
    case 'losange': return { epaisseur: +prng.reel(0.2, 0.4).toFixed(2), point: prng.pile(0.6) ? 1 : 0 };
    case 'deux-cercles': return { ecart: prng.entier(10, 20), epaisseur: +prng.reel(0.2, 0.32).toFixed(2) };
    case 'quart-cercle': return { quarts: prng.entier(1, 2), angle: prng.entier(0, 3) * 90 };
    case 'damier': return { masque: prng.entier(17, 511) };
    case 'fleche': return { angle: prng.entier(0, 3) * 90 + prng.entier(-12, 12) };
    case 'pilier': return { nombre: prng.entier(3, 5), epaisseur: +prng.reel(0.07, 0.13).toFixed(2) };
    case 'coeur': return { angle: prng.entier(-12, 12) };
    case 'trefle': return { rayon: prng.entier(18, 22), angle: prng.entier(0, 3) * 30 };
    case 'croix': return { epaisseur: +prng.reel(0.24, 0.36).toFixed(2), angle: prng.pile(0.5) ? 0 : 45 };
    case 'orbite': return { angle: prng.entier(0, 359), taille: +prng.reel(0.07, 0.12).toFixed(2) };
    case 'anneaux': return { n: prng.entier(2, 3), ecart: prng.entier(40, 80), epaisseur: +prng.reel(0.05, 0.08).toFixed(2), angle: prng.entier(0, 359) };
    case 'ruche': return { angle: prng.entier(0, 60) };
    default:
      if (FAMILLES_GEO.includes(famille)) return parametresGeo(famille, prng);
      throw new Error(`Famille inconnue : ${famille}`);
  }
}

/**
 * Construit une marque.
 * @param {string} famille
 * @param {Record<string, number>} p paramètres (valeurs par défaut sûres si absents)
 * @returns {{ famille: string, d: string, regle: 'nonzero'|'evenodd', accent: {cx:number,cy:number,r:number}|null }}
 */
export function construireMarque(famille, p = {}) {
  /** @type {Cmds} */
  let cmds = [];
  /** @type {{cx:number,cy:number,r:number}|null} */
  let accent = null;
  const v = (nom, defaut) => (Number.isFinite(p[nom]) ? p[nom] : defaut);
  switch (famille) {
    case 'cercle-arc': {
      const ouv = v('ouverture', 100);
      const ang = v('angle', 40);
      const ep = Math.min(0.4, Math.max(0.15, v('epaisseur', 0.3)));
      const R = 46;
      const r = R * (1 - ep);
      const a0 = ang + ouv / 2;
      const a1 = ang + 360 - ouv / 2;
      const [sx, sy] = pt(50, 50, R, a0);
      const [ix, iy] = pt(50, 50, r, a1);
      cmds = [['M', sx, sy], ...arcBezier(50, 50, R, a0, a1), ['L', ix, iy], ...arcBezier(50, 50, r, a1, a0), ['Z']];
      const [ax, ay] = pt(50, 50, (R + r) / 2 * 0.4, ang);
      accent = { cx: 50 + (ax - 50) * 0.5, cy: 50 + (ay - 50) * 0.5, r: R * 0.2 };
      break;
    }
    case 'petales': {
      const n = Math.round(Math.min(8, Math.max(3, v('n', 5))));
      const R = 46;
      const gap = 6;
      const largeur = Math.min(v('epaisseur', 0.6) * 20, 0.8 * (gap + R * 0.35) * Math.tan(Math.PI / n));
      const w = Math.max(3, largeur);
      /** @type {Cmds} */
      const petale = [['M', 50, 50 - gap], ['C', 50 + w, 50 - R * 0.35, 50 + w * 0.6, 50 - R * 0.9, 50, 50 - R], ['C', 50 - w * 0.6, 50 - R * 0.9, 50 - w, 50 - R * 0.35, 50, 50 - gap], ['Z']];
      for (let i = 0; i < n; i++) cmds.push(...tourner(petale, 50, 50, v('angle', 0) + (360 / n) * i));
      accent = { cx: 50, cy: 50, r: 5.5 };
      break;
    }
    case 'vague': {
      const bandes = Math.round(Math.min(3, Math.max(2, v('bandes', 2))));
      const A = 100 * Math.min(0.3, Math.max(0.1, v('amplitude', 0.2))) * 0.5;
      const ep = 100 * Math.min(0.22, Math.max(0.1, v('epaisseur', 0.16)));
      const demi = 4;
      for (let b = 0; b < bandes; b++) {
        const y0 = 50 + (b - (bandes - 1) / 2) * (ep + 16);
        const haut = [];
        const bas = [];
        const dx = 100 / demi;
        let cmd = [['M', 0, y0]];
        for (let k = 0; k < demi; k++) {
          const sgn = k % 2 === 0 ? -1 : 1;
          cmd.push(['C', k * dx + dx * 0.4, y0 + sgn * A * 1.4, (k + 1) * dx - dx * 0.4, y0 + sgn * A * 1.4, (k + 1) * dx, y0]);
        }
        cmd.push(['L', 100, y0 + ep]);
        for (let k = demi - 1; k >= 0; k--) {
          const sgn = k % 2 === 0 ? -1 : 1;
          cmd.push(['C', (k + 1) * dx - dx * 0.4, y0 + ep + sgn * A * 1.4, k * dx + dx * 0.4, y0 + ep + sgn * A * 1.4, k * dx, y0 + ep]);
        }
        cmd.push(['Z']);
        void haut;
        void bas;
        cmds.push(.../** @type {Cmds} */ (cmd));
      }
      break;
    }
    case 'feuille': {
      const as = v('asymetrie', 0) * 40;
      cmds = [['M', 50, 94], ['C', 8 + as, 66, 12 + as, 22, 50, 6], ['C', 88 + as, 22, 92 + as, 66, 50, 94], ['Z']];
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      accent = null;
      break;
    }
    case 'montagne': {
      const h = Math.min(0.95, Math.max(0.5, v('hauteur', 0.75)));
      const pics = Math.round(Math.min(3, Math.max(2, v('pics', 2))));
      cmds.push(...polygone([[0, 90], [38, 90 - 80 * h], [76, 90]]));
      cmds.push(...polygone([[44, 90], [72, 90 - 55 * h], [100, 90]]));
      if (pics === 3) cmds.push(...polygone([[-16, 90], [10, 90 - 40 * h], [34, 90]]));
      accent = { cx: 80, cy: 18, r: 8 };
      break;
    }
    case 'soleil': {
      const n = Math.round(Math.min(14, Math.max(8, v('n', 10))));
      const disque = 46 * Math.min(0.5, Math.max(0.28, v('disque', 0.4)));
      const lw = (Math.PI * 2 * (disque + 12)) / n * Math.min(0.45, Math.max(0.2, v('epaisseur', 0.3)));
      cmds.push(...cercle(50, 50, disque));
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i;
        cmds.push(...tourner(polygone([[50 - lw / 2, 50 - disque - 6], [50 + lw / 2, 50 - disque - 6], [50, 50 - 46]]), 50, 50, a));
      }
      accent = null;
      break;
    }
    case 'goutte': {
      cmds = [['M', 50, 6], ['C', 50, 6, 82, 42, 82, 62], ['C', 82, 80, 68, 94, 50, 94], ['C', 32, 94, 18, 80, 18, 62], ['C', 18, 42, 50, 6, 50, 6], ['Z']];
      if (v('reflet', 1)) cmds.push(['M', 36, 62], ['C', 36, 72, 42, 80, 50, 82], ['C', 44, 78, 41, 70, 41, 62], ['C', 41, 56, 38, 58, 36, 62], ['Z']);
      cmds = tourner(cmds, 50, 50, v('inclinaison', 0));
      break;
    }
    case 'hexagone': {
      const ep = Math.min(0.32, Math.max(0.14, v('epaisseur', 0.22)));
      const ext = [0, 1, 2, 3, 4, 5].map((i) => pt(50, 50, 46, v('angle', 0) + 60 * i - 90));
      const int = [5, 4, 3, 2, 1, 0].map((i) => pt(50, 50, 46 * (1 - ep * 1.6), v('angle', 0) + 60 * i - 90));
      cmds = [...polygone(ext), ...polygone(int)];
      accent = { cx: 50, cy: 50, r: 6 };
      return finaliser(famille, cmds, accent, 'evenodd');
    }
    case 'monogramme': {
      const ep = Math.min(0.2, Math.max(0.06, v('epaisseur', 0.1)));
      cmds = [...cercle(50, 50, 46, 1), ...cercle(50, 50, 46 * (1 - ep), -1)];
      break;
    }
    case 'ruban': {
      const bandes = Math.round(Math.min(3, Math.max(2, v('bandes', 2))));
      const dec = 100 * Math.tan(rad(Math.min(45, Math.max(20, v('pente', 35))))) * 0.35;
      for (let b = 0; b < bandes; b++) {
        const y = 14 + b * (72 / bandes);
        const h = (72 / bandes) * 0.62;
        cmds.push(...polygone([[10 + dec, y], [90, y], [90 - dec, y + h], [10, y + h]]));
      }
      accent = null;
      break;
    }
    case 'etoile': {
      const n = Math.round(Math.min(8, Math.max(5, v('n', 5))));
      const creux = Math.min(0.6, Math.max(0.35, v('creux', 0.5)));
      const pts = [];
      for (let i = 0; i < n * 2; i++) pts.push(pt(50, 50, i % 2 === 0 ? 46 : 46 * creux, v('angle', 0) + (180 / n) * i - 90));
      cmds = polygone(pts);
      break;
    }
    case 'boucle': {
      const ep = 100 * Math.min(0.26, Math.max(0.12, v('epaisseur', 0.18))) * 0.5;
      const N = 48;
      const gauche = [];
      const droite = [];
      for (let i = 0; i < N; i++) {
        const t = (Math.PI * 2 * i) / N;
        const den = 1 + Math.sin(t) ** 2;
        const x = (44 * Math.cos(t)) / den;
        const y = (44 * Math.sin(t) * Math.cos(t)) / den;
        const t2 = (Math.PI * 2 * (i + 0.01)) / N;
        const den2 = 1 + Math.sin(t2) ** 2;
        const x2 = (44 * Math.cos(t2)) / den2;
        const y2 = (44 * Math.sin(t2) * Math.cos(t2)) / den2;
        const l = Math.hypot(x2 - x, y2 - y) || 1;
        const nx = -(y2 - y) / l;
        const ny = (x2 - x) / l;
        gauche.push([50 + x + nx * ep * 0.5, 50 + y + ny * ep * 0.5]);
        droite.push([50 + x - nx * ep * 0.5, 50 + y - ny * ep * 0.5]);
      }
      cmds = [...polygone(gauche), ...polygone(droite.reverse())];
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      accent = null;
      break;
    }
    case 'arche': {
      const ep = clampM(v('epaisseur', 0.3), 0.2, 0.45);
      const rIn = 40 * (1 - ep);
      const cmds = [['M', 10, 96], ['L', 10, 50], ...arcBezier(50, 50, 40, 180, 360), ['L', 90, 96], ['Z'], ['M', 50 - rIn, 96], ['L', 50 - rIn, 50], ...arcBezier(50, 50, rIn, 180, 360), ['L', 50 + rIn, 96], ['Z']];
      return finaliser(famille, cmds, null, 'evenodd');
    }
    case 'bouclier': {
      const ep = clampM(v('epaisseur', 0.15), 0.1, 0.25);
      const exterieur = [['M', 50, 4], ['L', 90, 16], ['L', 90, 50], ['C', 90, 74, 72, 88, 50, 96], ['C', 28, 88, 10, 74, 10, 50], ['L', 10, 16], ['Z']];
      const s = 1 - ep * 2.2;
      const interieur = transformer(exterieur, (x, y) => [50 + (x - 50) * s, 52 + (y - 52) * s]);
      return finaliser(famille, [...exterieur, ...interieur], null, 'evenodd');
    }
    case 'spirale': {
      const tours = clampM(v('tours', 2), 1.2, 3);
      const w = 100 * clampM(v('epaisseur', 0.16), 0.1, 0.25) * 0.5;
      const N = 36;
      const ext = [];
      const int = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const th = t * tours * Math.PI * 2;
        const r = 4 + 40 * t;
        ext.push([50 + (r + w) * Math.cos(th), 50 + (r + w) * Math.sin(th)]);
        int.push([50 + Math.max(0, r - w) * Math.cos(th), 50 + Math.max(0, r - w) * Math.sin(th)]);
      }
      cmds = polygone([...ext, ...int.reverse()]);
      break;
    }
    case 'losange': {
      const ep = clampM(v('epaisseur', 0.3), 0.2, 0.45);
      const ext = polygone([[50, 6], [94, 50], [50, 94], [6, 50]]);
      const s = 1 - ep * 1.1;
      const int = transformer(ext, (x, y) => [50 + (x - 50) * s, 50 + (y - 50) * s]);
      return finaliser(famille, [...ext, ...int], v('point', 1) ? { cx: 50, cy: 50, r: 5 } : null, 'evenodd');
    }
    case 'deux-cercles': {
      const ec = clampM(v('ecart', 14), 8, 24);
      const ep = clampM(v('epaisseur', 0.26), 0.18, 0.36);
      const R = 30;
      cmds = [...cercle(50 - ec, 50, R, 1), ...cercle(50 - ec, 50, R * (1 - ep), -1), ...cercle(50 + ec, 50, R, 1), ...cercle(50 + ec, 50, R * (1 - ep), -1)];
      break;
    }
    case 'quart-cercle': {
      const quarts = clampM(v('quarts', 1), 1, 2);
      const q1 = [['M', 50, 50], ['L', 50, 4], ...arcBezier(50, 50, 46, 270, 360), ['Z']];
      const q2 = [['M', 50, 50], ['L', 50, 96], ...arcBezier(50, 50, 46, 90, 180), ['Z']];
      cmds = quarts === 2 ? [...q1, ...q2] : q1;
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    case 'damier': {
      const m = Math.round(clampM(v('masque', 0b101010101), 1, 511));
      const cote = 28;
      const pas = 32;
      const x0 = 50 - (3 * cote + 2 * (pas - cote)) / 2;
      cmds = [];
      for (let k = 0; k < 9; k++) {
        if (!((m >> k) & 1)) continue;
        const x = x0 + (k % 3) * pas;
        const y = x0 + Math.floor(k / 3) * pas;
        cmds.push(...polygone([[x, y], [x + cote, y], [x + cote, y + cote], [x, y + cote]]));
      }
      if (!cmds.length) cmds = polygone([[x0, x0], [x0 + cote, x0], [x0 + cote, x0 + cote], [x0, x0 + cote]]);
      break;
    }
    case 'fleche': {
      cmds = polygone([[8, 42], [60, 42], [46, 28], [54, 20], [92, 50], [54, 80], [46, 72], [60, 58], [8, 58]]);
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    case 'pilier': {
      const n = Math.round(clampM(v('nombre', 4), 3, 5));
      const ep = clampM(v('epaisseur', 0.1), 0.06, 0.16) * 100;
      const pas = (100 - n * ep) / (n + 1);
      cmds = polygone([[4, 92], [96, 92], [96, 97], [4, 97]]);
      for (let i = 0; i < n; i++) {
        const x = pas * (i + 1) + ep * i;
        const h = 40 + 40 * (1 - Math.abs(i - (n - 1) / 2) / Math.max(1, (n - 1) / 2));
        cmds.push(...polygone([[x, 92 - h], [x + ep, 92 - h], [x + ep, 92], [x, 92]]));
      }
      break;
    }
    case 'coeur': {
      cmds = [['M', 50, 90], ['C', 20, 66, 6, 48, 6, 32], ['C', 6, 18, 16, 8, 30, 8], ['C', 40, 8, 47, 14, 50, 22], ['C', 53, 14, 60, 8, 70, 8], ['C', 84, 8, 94, 18, 94, 32], ['C', 94, 48, 80, 66, 50, 90], ['Z']];
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    case 'trefle': {
      const r = clampM(v('rayon', 20), 16, 24);
      cmds = [...cercle(50, 30, r), ...cercle(30, 62, r), ...cercle(70, 62, r)];
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    case 'croix': {
      const e = clampM(v('epaisseur', 0.3), 0.22, 0.4) * 100;
      const a = e / 2;
      cmds = polygone([[50 - a, 6], [50 + a, 6], [50 + a, 50 - a], [94, 50 - a], [94, 50 + a], [50 + a, 50 + a], [50 + a, 94], [50 - a, 94], [50 - a, 50 + a], [6, 50 + a], [6, 50 - a], [50 - a, 50 - a]]);
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    case 'orbite': {
      const ang = v('angle', 0);
      const planete = pt(50, 50, 40, ang);
      cmds = [...cercle(50, 50, 44, 1), ...cercle(50, 50, 36, -1)];
      accent = { cx: planete[0], cy: planete[1], r: 7 };
      break;
    }
    case 'anneaux': {
      const n = Math.round(clampM(v('n', 2), 2, 3));
      const gap = clampM(v('ecart', 60), 40, 80);
      const ep = Math.min(clampM(v('epaisseur', 0.07), 0.05, 0.08) * 100, 0.6 * (40 / n));
      const pas = 40 / n;
      const a0 = v('angle', 0) + gap / 2;
      const a1 = v('angle', 0) + 360 - gap / 2;
      cmds = [];
      for (let k = 0; k < n; k++) {
        const R = 46 - k * pas;
        const r = R - ep;
        const p0 = pt(50, 50, R, a0);
        const q1 = pt(50, 50, r, a1);
        cmds.push(['M', p0[0], p0[1]], ...arcBezier(50, 50, R, a0, a1), ['L', q1[0], q1[1]], ...arcBezier(50, 50, r, a1, a0), ['Z']);
      }
      break;
    }
    case 'ruche': {
      const centres = [[50, 30], [29, 66], [71, 66]];
      cmds = [];
      for (const [cx, cy] of centres) {
        const hex = [0, 1, 2, 3, 4, 5].map((i) => pt(cx, cy, 23, 60 * i - 90));
        cmds.push(...polygone(hex));
      }
      cmds = tourner(cmds, 50, 50, v('angle', 0));
      break;
    }
    default:
      if (FAMILLES_GEO.includes(famille)) return finaliser(famille, construireGeo(famille, p), null, 'nonzero');
      throw new Error(`Famille inconnue : ${famille}`);
  }
  return finaliser(famille, cmds, accent, 'nonzero');
}

/** @param {string} famille @param {Cmds} cmds @param {any} accent @param {'nonzero'|'evenodd'} regle */
function finaliser(famille, cmds, accent, regle) {
  const n = normaliser(cmds, accent);
  const a = n.accent ? { cx: +arrondi(n.accent.cx), cy: +arrondi(n.accent.cy), r: +arrondi(n.accent.r) } : null;
  return { famille, d: enChaine(n.cmds), regle, accent: a };
}
