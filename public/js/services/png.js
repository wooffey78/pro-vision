// @ts-check
/** Rasterisation SVG → PNG dans le navigateur (canvas) et assemblage ICO. */

/**
 * Convertit un SVG en PNG via <canvas>. Navigateur uniquement.
 * @param {string} svg SVG autonome (width/height ou viewBox)
 * @param {number} largeur largeur de sortie en pixels
 * @param {number} [hauteur] hauteur de sortie (sinon proportionnelle)
 * @returns {Promise<Uint8Array>}
 */
export async function svgVersPng(svg, largeur, hauteur) {
  const vb = /viewBox="([-\d.\s]+)"/.exec(svg);
  const [, , vw, vh] = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, 1, 1];
  const h = hauteur || Math.max(1, Math.round((largeur * vh) / vw));
  const habille = svg.replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${largeur}" height="${h}"`);
  const blob = new Blob([habille], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = () => rej(new Error('Image SVG illisible'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = largeur;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');
    ctx.drawImage(img, 0, 0, largeur, h);
    const png = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!png) throw new Error('Export PNG impossible');
    return new Uint8Array(await /** @type {Blob} */ (png).arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Assemble un fichier .ico contenant des images PNG (format Vista+, accepté par tous les navigateurs).
 * @param {{ taille: number, png: Uint8Array }[]} images
 * @returns {Uint8Array}
 */
export function construireIco(images) {
  const n = images.length;
  const entete = 6 + 16 * n;
  const total = entete + images.reduce((s, i) => s + i.png.length, 0);
  const sortie = new Uint8Array(total);
  const vue = new DataView(sortie.buffer);
  vue.setUint16(0, 0, true);
  vue.setUint16(2, 1, true);
  vue.setUint16(4, n, true);
  let offset = entete;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    sortie[e] = img.taille >= 256 ? 0 : img.taille;
    sortie[e + 1] = img.taille >= 256 ? 0 : img.taille;
    sortie[e + 2] = 0;
    sortie[e + 3] = 0;
    vue.setUint16(e + 4, 1, true);
    vue.setUint16(e + 6, 32, true);
    vue.setUint32(e + 8, img.png.length, true);
    vue.setUint32(e + 12, offset, true);
    sortie.set(img.png, offset);
    offset += img.png.length;
  });
  return sortie;
}
