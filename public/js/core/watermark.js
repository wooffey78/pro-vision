// @ts-check
/**
 * Filigrane de l'aperçu gratuit : motif répété « APERÇU » semi-transparent.
 * Il est ajouté au SVG des aperçus uniquement ; jamais dans les fichiers du kit.
 */

/**
 * @param {number} largeur @param {number} hauteur @param {boolean} [sombre] @param {string} [id]
 * @returns {string} fragment SVG (groupe marqué data-filigrane)
 */
export function svgFiligrane(largeur, hauteur, sombre = false, id = 'pv-filigrane') {
  const couleur = sombre ? '#ffffff' : '#000000';
  const pas = Math.max(60, Math.round(Math.min(largeur, hauteur) / 2.2));
  return (
    `<defs><pattern id="${id}" width="${pas * 2}" height="${pas}" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">` +
    `<text x="0" y="${pas * 0.6}" font-family="sans-serif" font-size="${Math.round(pas * 0.34)}" font-weight="700" fill="${couleur}" fill-opacity="0.16">APERÇU</text>` +
    `</pattern></defs>` +
    `<g data-filigrane="1" aria-hidden="true" pointer-events="none"><rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#${id})"/></g>`
  );
}

/**
 * Insère le filigrane juste avant la balise fermante du SVG.
 * @param {string} svg @param {number} largeur @param {number} hauteur @param {boolean} [sombre]
 */
export function avecFiligrane(svg, largeur, hauteur, sombre = false, id = 'pv-filigrane') {
  const i = svg.lastIndexOf('</svg>');
  return i === -1 ? svg : svg.slice(0, i) + svgFiligrane(largeur, hauteur, sombre, id) + svg.slice(i);
}
