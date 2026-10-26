// @ts-check
import { hexVersRgb, srgbVersLineaire, hexVersOklch, oklchVersHex } from './color.js';

/**
 * Luminance relative WCAG 2.x.
 * @param {string} hex
 * @returns {number}
 */
export function luminance(hex) {
  const [r, g, b] = hexVersRgb(hex).map((v) => srgbVersLineaire(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Rapport de contraste WCAG 2.x : (L1 + 0,05) / (L2 + 0,05).
 * @param {string} a @param {string} b
 * @returns {number} entre 1 et 21
 */
export function ratioContraste(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Ajuste la luminosité (L d'OKLCH) par pas de 0,01 jusqu'à atteindre le contraste demandé,
 * en conservant la teinte (et le chroma, réduit au besoin par le gamut).
 * @param {string} hex couleur à ajuster
 * @param {string[]} fonds fonds contre lesquels le contraste doit être atteint
 * @param {number} min ratio minimal
 * @param {'sombre' | 'clair' | 'auto'} [sens] direction de l'ajustement
 * @returns {{ hex: string, ok: boolean }} ok=false si impossible (l'appelant choisit un repli sûr)
 */
export function ajusterContraste(hex, fonds, min, sens = 'auto') {
  const fondsListe = Array.isArray(fonds) ? fonds : [fonds];
  const valide = (c) => fondsListe.every((f) => ratioContraste(c, f) >= min);
  if (valide(hex)) return { hex, ok: true };
  const [L, C, H] = hexVersOklch(hex);
  let direction = sens;
  if (direction === 'auto') {
    const lumMoy = fondsListe.reduce((s, f) => s + luminance(f), 0) / fondsListe.length;
    direction = lumMoy > 0.4 ? 'sombre' : 'clair';
  }
  const pas = direction === 'sombre' ? -0.01 : 0.01;
  let cur = L;
  for (let i = 0; i < 100; i++) {
    cur += pas;
    if (cur < 0 || cur > 1) break;
    const c = oklchVersHex(cur, C, H);
    if (valide(c)) return { hex: c, ok: true };
  }
  return { hex, ok: false };
}

/**
 * Choisit le meilleur texte (blanc ou quasi-noir) à poser sur un fond.
 * @param {string} fond
 * @param {string} [clair] @param {string} [fonce]
 * @returns {string}
 */
export function meilleurTexteSur(fond, clair = '#ffffff', fonce = '#10151b') {
  return ratioContraste(clair, fond) >= ratioContraste(fonce, fond) ? clair : fonce;
}

/**
 * Niveau WCAG indicatif d'un ratio pour du texte normal.
 * @param {number} ratio
 * @returns {'AAA' | 'AA' | 'insuffisant'}
 */
export function niveauWcag(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'insuffisant';
}
