// @ts-check
import { echapper } from './svgutil.js';
import { famille, graisseDisponible } from './fonts.js';
import { variablesCss } from './palette.js';

/**
 * @font-face pour les polices du projet, chemins relatifs au dossier du kit.
 * @param {any} fontsCfg @param {{titres:string,texte:string}} polices @param {string} prefixe ex. « polices/ »
 */
export function fontFaces(fontsCfg, polices, prefixe) {
  const ids = [...new Set([polices.titres, polices.texte])];
  return ids
    .flatMap((id) => famille(fontsCfg, id).poids.map((w) => `@font-face{font-family:'${famille(fontsCfg, id).nom}';font-weight:${w};font-style:normal;font-display:swap;src:url('${prefixe}${id}-${w}.woff2') format('woff2');}`))
    .join('\n');
}

const CSS_BASE = `*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--couleur-fond);color:var(--couleur-texte);font-family:var(--police-texte);font-size:1.0625rem;line-height:1.6}
main{max-width:56rem;margin:0 auto;padding:2rem 1.25rem 4rem}
h1,h2,h3{font-family:var(--police-titres);line-height:1.2;color:var(--couleur-texte)}
h1{font-size:2.2rem;margin:.2em 0 .6em}h2{font-size:1.5rem;margin:2.2em 0 .6em;padding-top:.6em;border-top:1px solid var(--couleur-bordure)}h3{font-size:1.15rem}
a{color:var(--couleur-principale)}a:focus-visible,button:focus-visible{outline:3px solid var(--couleur-accent);outline-offset:2px}
.muet{color:var(--couleur-texte-attenue)}.n{text-align:right}
table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{padding:.6rem .7rem;border-bottom:1px solid var(--couleur-bordure);text-align:left;vertical-align:top}th{font-weight:700}
.carte{background:var(--couleur-surface);border:1px solid var(--couleur-bordure);border-radius:.75rem;padding:1rem 1.2rem;margin:1rem 0}
.grille{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))}
.logo-boite{background:var(--couleur-surface);border:1px solid var(--couleur-bordure);border-radius:.75rem;padding:1.2rem;display:flex;align-items:center;justify-content:center;min-height:9rem}
.logo-boite svg{max-width:100%;height:auto;max-height:9rem}
.logo-boite.sombre{background:#0b0f14;border-color:#0b0f14}
.pastille{display:inline-block;width:1.1rem;height:1.1rem;border-radius:50%;vertical-align:-.15em;margin-right:.4rem;border:1px solid var(--couleur-bordure)}
.nuance{border-radius:.75rem;overflow:hidden;border:1px solid var(--couleur-bordure);background:var(--couleur-surface)}
.nuance .teinte{height:5.5rem}.nuance .infos{padding:.7rem .9rem;font-size:.9rem}
.c-principale{background:var(--couleur-principale)}.c-secondaire{background:var(--couleur-secondaire)}.c-accent{background:var(--couleur-accent)}.c-fond{background:var(--couleur-fond)}.c-surface{background:var(--couleur-surface)}.c-texte{background:var(--couleur-texte)}.c-texte-attenue{background:var(--couleur-texte-attenue)}.c-bordure{background:var(--couleur-bordure)}.c-succes{background:var(--couleur-succes)}.c-erreur{background:var(--couleur-erreur)}.c-avertissement{background:var(--couleur-avertissement)}
.bouton{display:inline-block;padding:.7rem 1.2rem;border-radius:.6rem;font:inherit;font-weight:700;text-decoration:none;border:2px solid var(--couleur-principale);cursor:pointer}
.bouton.plein{background:var(--couleur-principale);color:var(--couleur-sur-principale)}.bouton.contour{background:transparent;color:var(--couleur-principale)}
.alerte{border-left:.35rem solid;padding:.6rem .9rem;margin:.6rem 0;border-radius:.3rem;background:var(--couleur-surface)}
.alerte.succes{border-color:var(--couleur-succes)}.alerte.erreur{border-color:var(--couleur-erreur)}.alerte.avert{border-color:var(--couleur-avertissement)}
.ok{color:var(--couleur-succes);font-weight:700}.ko{color:var(--couleur-erreur);font-weight:700}
.a-completer{background:var(--couleur-surface);border:1px dashed var(--couleur-avertissement);padding:0 .3em;border-radius:.25rem}
.mal svg{max-height:5rem}.mal-deforme svg{transform:scaleX(1.6)}.mal-pivote svg{transform:rotate(-14deg)}.mal-couleurs svg{filter:hue-rotate(140deg) saturate(1.8)}.mal-ombre svg{filter:drop-shadow(6px 6px 3px rgba(0,0,0,.6))}
.mal-contraste{background:var(--couleur-accent)!important}.mal-petit svg{max-height:1rem}
.croix::before{content:"✗ ";color:var(--couleur-erreur);font-weight:700}
@media print{body{background:#fff;color:#000}main{max-width:none;padding:0}h2{break-after:avoid}.carte,.nuance,.logo-boite{break-inside:avoid}}`;

/**
 * Page HTML autonome aux couleurs de la marque.
 * @param {{ titre: string, corps: string, projet: any, fontsCfg: any, racine?: string, prefixePolices?: string, description?: string }} o
 * `racine` : chemin relatif vers la racine du kit (« » ou « ../ »).
 */
export function pageHtml({ titre, corps, projet, fontsCfg, racine = '', prefixePolices, description = '' }) {
  const pal = projet.identite.palette;
  const pol = projet.identite.polices;
  const prefix = prefixePolices ?? `${racine}05-typographies/polices/`;
  const pt = famille(fontsCfg, pol.titres).pile;
  const px = famille(fontsCfg, pol.texte).pile;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${echapper(titre)} · ${echapper(projet.entreprise.nom)}</title>
${description ? `<meta name="description" content="${echapper(description)}">` : ''}
<style>
${fontFaces(fontsCfg, pol, prefix)}
${variablesCss(pal)}
:root{--police-titres:${pt};--police-texte:${px}}
${CSS_BASE}
</style>
</head>
<body>
<main>
${corps}
</main>
</body>
</html>
`;
}

/** Échappe pour affichage et marque les « [À COMPLÉTER …] » de façon visible. */
export function texteHtml(s) {
  return echapper(s).replace(/\[À COMPLÉTER[^\]]*\]/g, (m) => `<span class="a-completer">${m}</span>`);
}

/** Paragraphes à partir d'un texte avec sauts de ligne. */
export function paragraphes(s) {
  return String(s).split(/\n{2,}/).map((p) => `<p>${texteHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n');
}

export { graisseDisponible };
