// @ts-check
/**
 * Conversions de couleurs : sRGB ↔ linéaire ↔ OKLab ↔ OKLCH (Björn Ottosson),
 * gestion du gamut sRGB, HSL, CMJN indicatif, noms français approximatifs.
 * Fonctions pures, sans dépendance.
 */

/** @param {string} hex @returns {[number, number, number]} composantes 0..255 */
export function hexVersRgb(hex) {
  const h = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Couleur invalide : ${hex}`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** @param {number[]} rgb 0..255 (arrondi et borné) @returns {string} #rrggbb */
export function rgbVersHex(rgb) {
  return '#' + rgb.map((v) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/** @param {number} c 0..1 */
export function srgbVersLineaire(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** @param {number} c 0..1 linéaire */
export function lineaireVersSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** @param {[number, number, number]} lin RGB linéaire 0..1 @returns {[number, number, number]} [L, a, b] */
export function lineaireVersOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

/** @param {[number, number, number]} lab @returns {[number, number, number]} RGB linéaire (non borné) */
export function oklabVersLineaire([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

/** @param {string} hex @returns {[number, number, number]} [L, a, b] */
export function hexVersOklab(hex) {
  const [r, g, b] = hexVersRgb(hex).map((v) => srgbVersLineaire(v / 255));
  return lineaireVersOklab([r, g, b]);
}

/** @param {[number, number, number]} lab @returns {[number, number, number]} [L, C, H°] */
export function oklabVersOklch([L, a, b]) {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, C < 1e-6 ? 0 : H];
}

/** @param {number} L @param {number} C @param {number} H @returns {[number, number, number]} [L, a, b] */
export function oklchVersOklab(L, C, H) {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

/** @param {string} hex @returns {[number, number, number]} [L, C, H°] */
export function hexVersOklch(hex) {
  return oklabVersOklch(hexVersOklab(hex));
}

const EPS = 1e-4;
/** @param {number[]} lin */
function dansLeGamut(lin) {
  return lin.every((v) => v >= -EPS && v <= 1 + EPS);
}

/**
 * Convertit OKLCH en hexadécimal. Si la couleur sort du gamut sRGB,
 * le chroma est réduit (recherche dichotomique) en conservant L et H.
 * @param {number} L @param {number} C @param {number} H
 * @returns {string}
 */
export function oklchVersHex(L, C, H) {
  const Lb = Math.min(1, Math.max(0, L));
  let hautC = Math.max(0, C);
  let lin = oklabVersLineaire(oklchVersOklab(Lb, hautC, H));
  if (!dansLeGamut(lin)) {
    let bas = 0;
    let haut = hautC;
    for (let i = 0; i < 24; i++) {
      const mid = (bas + haut) / 2;
      if (dansLeGamut(oklabVersLineaire(oklchVersOklab(Lb, mid, H)))) bas = mid;
      else haut = mid;
    }
    hautC = bas;
    lin = oklabVersLineaire(oklchVersOklab(Lb, hautC, H));
  }
  return rgbVersHex(lin.map((v) => lineaireVersSrgb(Math.min(1, Math.max(0, v))) * 255));
}

/** Distance perceptuelle simple (euclidienne dans OKLab). @param {string} a @param {string} b */
export function deltaE(a, b) {
  const x = hexVersOklab(a);
  const y = hexVersOklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** @param {string} hex @returns {[number, number, number]} [H°, S%, L%] */
export function hexVersHsl(hex) {
  const [r, g, b] = hexVersRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * CMJN INDICATIF (formule simple, sans profil colorimétrique).
 * @param {string} hex @returns {[number, number, number, number]} pourcentages 0..100
 */
export function hexVersCmjn(hex) {
  const [r, g, b] = hexVersRgb(hex).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map((v) => Math.round(v * 100));
}

/**
 * Nom simple d'une couleur, dérivé de sa teinte et de sa luminosité (sans nom poétique).
 * Exemples : « Rouge », « Bleu foncé », « Vert clair », « Beige », « Gris ».
 * @param {string} hex
 * @returns {string}
 */
export function nomCouleur(hex) {
  const [L, C, H] = hexVersOklch(hex);
  if (C < 0.035) return L > 0.93 ? 'Blanc' : L < 0.22 ? 'Noir' : L > 0.7 ? 'Gris clair' : L < 0.42 ? 'Gris foncé' : 'Gris';
  let base;
  if (H < 22 || H >= 345) base = 'Rouge';
  else if (H < 55) base = 'Orange';
  else if (H < 100) base = 'Jaune';
  else if (H < 165) base = 'Vert';
  else if (H < 200) base = 'Turquoise';
  else if (H < 288) base = 'Bleu';
  else if (H < 312) base = 'Violet';
  else base = 'Rose';
  if (L > 0.78 && C < 0.09 && (base === 'Orange' || base === 'Jaune')) return 'Beige';
  if (L > 0.86) return `${base} clair`;
  if (L < 0.42) return `${base} foncé`;
  return base;
}

/**
 * Gamme de choix pour l'utilisateur : couleurs chromatiques (teinte × clarté × saturation)
 * et neutres. Deux couleurs de la gamme ne sont jamais à moins de 0,045 (OKLab) l'une de l'autre.
 */
export const GAMME_CHOIX = (() => {
  const candidates = [];
  for (let h = 0; h < 360; h += 10) {
    for (const L of [0.3, 0.42, 0.55, 0.7, 0.85]) for (const C of [0.04, 0.1, 0.16]) candidates.push(oklchVersHex(L, C, h));
  }
  for (const L of [0.1, 0.22, 0.5, 0.75, 0.92, 0.98]) candidates.push(oklchVersHex(L, 0, 0));
  const gamme = [];
  for (const c of new Set(candidates)) if (gamme.every((g) => deltaE(g, c) >= 0.045)) gamme.push(c);
  return gamme;
})();
