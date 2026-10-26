// @ts-check
import { nettoyerSvg } from '../core/svgSanitize.js';
import { avecFiligrane } from '../core/watermark.js';

let compteur = 0;

/**
 * Transforme un SVG (texte) en élément DOM, après nettoyage à liste blanche,
 * puis ré-analyse par DOMParser (double barrière). Jamais d'innerHTML.
 * @param {string} svg
 * @param {{ filigrane?: boolean, sombre?: boolean, classe?: string }} [o]
 * @returns {SVGElement | null}
 */
export function creerSvgSur(svg, { filigrane = false, sombre = false, classe = '' } = {}) {
  let source = svg;
  if (filigrane) {
    const vb = /viewBox="([-\d.\s]+)"/.exec(svg);
    const [, , w, h] = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100];
    source = avecFiligrane(svg, w, h, sombre, `pv-f-${++compteur}`);
  }
  const net = nettoyerSvg(source);
  if (!net.ok) return null;
  const doc = new DOMParser().parseFromString(net.svg, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length) return null;
  const el = /** @type {SVGElement} */ (document.importNode(doc.documentElement, true));
  el.removeAttribute('width');
  el.removeAttribute('height');
  if (classe) el.setAttribute('class', classe);
  return el;
}
