// @ts-check
import { echapper } from './svgutil.js';
import { texteHtml } from './html.js';
import { fontFaces } from './html.js';
import { variablesCss } from './palette.js';
import { famille } from './fonts.js';

/**
 * Site d'une page, statique, sans dépendance. Retourne les fichiers du dossier 09-site-web.
 * @param {any} projet @param {any} fontsCfg @param {any} textes @param {{principal:{svg:string}}} v
 * @param {{ avecPng: boolean }} o
 * @returns {Record<string,string>}
 */
export function genererSite(projet, fontsCfg, textes, v, { avecPng }) {
  const e = projet.entreprise;
  const pal = projet.identite.palette;
  const pol = projet.identite.polices;
  const pt = famille(fontsCfg, pol.titres).pile;
  const px = famille(fontsCfg, pol.texte).pile;
  const produits = e.produits.length ? e.produits : ['[À COMPLÉTER : vos offres]'];
  const url = e.siteWeb ? (e.siteWeb.startsWith('http') ? e.siteWeb : `https://${e.siteWeb}`) : 'https://[A_RENSEIGNER]/';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: e.nom,
    description: textes.aPropos.court,
    ...(e.email ? { email: e.email } : {}),
    ...(e.telephone ? { telephone: e.telephone } : {}),
    ...(e.ville ? { address: { '@type': 'PostalAddress', addressLocality: e.ville, addressCountry: 'FR' } } : {}),
    url
  };
  const ldJson = JSON.stringify(ld, null, 2).replace(/</g, '\\u003c');
  const csp = "default-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'";
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>${echapper(e.nom)}${e.mention ? ` · ${echapper(e.mention)}` : ''}</title>
<meta name="description" content="${echapper(textes.aPropos.court.slice(0, 155))}">
<meta property="og:title" content="${echapper(e.nom)}">
<meta property="og:description" content="${echapper(textes.slogans[0])}">
<meta property="og:image" content="images/${avecPng ? 'partage.png' : 'partage.svg'}">
<meta name="theme-color" content="${pal.principale}">
<link rel="icon" href="images/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="style.css">
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
<a class="evitement" href="#contenu">Aller au contenu</a>
<header class="entete"><div class="conteneur"><a href="#haut" class="logo" aria-label="${echapper(e.nom)}, accueil"><img src="images/logo.svg" alt="${echapper(e.nom)}" width="190"></a>
<nav aria-label="Navigation principale"><ul><li><a href="#offres">Offres</a></li><li><a href="#apropos">À propos</a></li><li><a href="#contact">Contact</a></li></ul></nav></div></header>
<main id="contenu">
<section class="heros" id="haut"><div class="conteneur"><h1>${echapper(e.nom)}</h1><p class="accroche">${texteHtml(textes.slogans[0])}</p><p><a class="bouton" href="#contact">Nous contacter</a></p></div></section>
<section id="offres"><div class="conteneur"><h2>Nos offres</h2><ul class="cartes">${produits.map((x) => `<li class="carte"><h3>${texteHtml(x.charAt(0).toLocaleUpperCase('fr') + x.slice(1))}</h3><p>[À COMPLÉTER : décrivez cette offre en une ou deux phrases.]</p></li>`).join('')}</ul></div></section>
<section id="apropos" class="bandeau"><div class="conteneur"><h2>À propos</h2>${textes.aPropos.long.split(/\n{2,}/).map((p) => `<p>${texteHtml(p)}</p>`).join('')}</div></section>
<section id="contact"><div class="conteneur"><h2>Contact</h2><ul class="contact">${[e.email && `<li>E-mail : <a href="mailto:${echapper(e.email)}">${echapper(e.email)}</a></li>`, e.telephone && `<li>Téléphone : ${echapper(e.telephone)}</li>`, e.adresse && `<li>Adresse : ${echapper(e.adresse)}</li>`, e.ville && `<li>Ville : ${echapper(e.ville)}</li>`].filter(Boolean).join('') || '<li>[À COMPLÉTER : vos coordonnées]</li>'}</ul></div></section>
</main>
<footer class="pied"><div class="conteneur"><p>© ${echapper(e.nom)} · <a href="#mentions">Mentions légales</a></p></div></footer>
<section id="mentions" class="mentions"><div class="conteneur"><h2>Mentions légales</h2><p>[À COMPLÉTER : éditeur du site, hébergeur, numéro SIRET, contact. Ces mentions sont obligatoires en France : renseignez-vous auprès d'un professionnel ou d'une source officielle.]</p></div></section>
<script src="personnaliser.js"></script>
</body>
</html>
`;
  const css = `${fontFaces(fontsCfg, pol, 'polices/')}
${variablesCss(pal)}
:root{--police-titres:${pt};--police-texte:${px};color-scheme:light dark}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--couleur-fond);color:var(--couleur-texte);font-family:var(--police-texte);font-size:1.0625rem;line-height:1.65}
h1,h2,h3{font-family:var(--police-titres);line-height:1.2}
.conteneur{max-width:60rem;margin:0 auto;padding:0 1.25rem}
a{color:var(--couleur-principale)}
a:focus-visible,.bouton:focus-visible{outline:3px solid var(--couleur-accent);outline-offset:3px}
.evitement{position:absolute;left:-999px;top:0;background:var(--couleur-surface);padding:.6rem 1rem}.evitement:focus{left:.5rem;top:.5rem;z-index:10}
.entete{background:var(--couleur-surface);border-bottom:1px solid var(--couleur-bordure)}.entete .conteneur{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;padding-block:.6rem}
.entete ul{display:flex;gap:1.2rem;list-style:none;margin:0;padding:0}.entete a{text-decoration:none;font-weight:700}
.logo img{display:block;height:auto;max-width:100%}
.heros{padding:5rem 0;background:var(--couleur-principale);color:var(--couleur-sur-principale)}.heros h1{font-size:clamp(2rem,6vw,3.4rem);margin:0 0 .4em;color:inherit}
.accroche{font-size:1.3rem;max-width:34rem}
.bouton{display:inline-block;padding:.8rem 1.4rem;border-radius:.6rem;background:var(--couleur-fond);color:var(--couleur-principale);font-weight:700;text-decoration:none;border:2px solid var(--couleur-fond)}
section{padding:3.5rem 0}.bandeau{background:var(--couleur-surface)}
.cartes{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));list-style:none;padding:0}.carte{background:var(--couleur-surface);border:1px solid var(--couleur-bordure);border-radius:.8rem;padding:1.1rem 1.3rem}
.bandeau .carte{background:var(--couleur-fond)}
.contact{list-style:none;padding:0}
.pied{padding:1.5rem 0;border-top:1px solid var(--couleur-bordure);color:var(--couleur-texte-attenue)}
.mentions{color:var(--couleur-texte-attenue);font-size:.95rem}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
  const js = `'use strict';
// Personnalisation : ce fichier est volontairement minimal.
// Il n'appelle aucun service externe. Ajoutez ici vos propres comportements.
`;
  return {
    'index.html': html,
    'style.css': css,
    'personnaliser.js': js,
    'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${url.replace(/\/$/, '')}/sitemap.xml\n`,
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${echapper(url)}</loc></url>\n</urlset>\n`,
    'images/logo.svg': v.principal.svg,
    'images/favicon.svg': v.favicon.svg
  };
}
