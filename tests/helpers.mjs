import { chargerContexte, chargerPolice, chargerRessources, projetExemple, rasteriseurResvg, symboleLucide, PUBLIC, RACINE } from '../scripts/lib-node.mjs';
export { chargerContexte, chargerPolice, chargerRessources, projetExemple, rasteriseurResvg, symboleLucide, PUBLIC, RACINE };

/** Couleurs hexadécimales et mots-clés de couleur trouvés dans les attributs fill/stroke/stop-color d'un SVG. */
export function couleursSvg(svg) {
  const out = new Set();
  for (const m of svg.matchAll(/\b(?:fill|stroke|stop-color)="([^"]*)"/g)) out.add(m[1]);
  return out;
}
