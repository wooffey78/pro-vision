// @ts-check
import { pageHtml, texteHtml } from './html.js';
import { echapper } from './svgutil.js';
import { LIBELLES_ROLES, formatsCouleur, verifierPalette } from './palette.js';
import { famille } from './fonts.js';
import { nomCouleur } from './color.js';

/** @param {string} svg */
const enLigne = (svg) => svg.replace(/ width="[\d.]+" height="[\d.]+"/, '');

/**
 * Charte graphique : une page HTML autonome (polices relatives à 05-typographies/polices/).
 * @param {any} projet @param {any} fontsCfg @param {Record<string,{svg:string}>} v variantes @param {any} textes
 */
export function charteGraphique(projet, fontsCfg, v, textes) {
  const pal = projet.identite.palette;
  const e = projet.entreprise;
  const pol = projet.identite.polices;
  const ft = famille(fontsCfg, pol.titres);
  const fx = famille(fontsCfg, pol.texte);
  const roles = ['principale', 'secondaire', 'accent', 'fond', 'surface', 'texte', 'texteAttenue', 'bordure'];
  const kebab = { texteAttenue: 'texte-attenue' };
  const nuancier = roles.map((r) => {
    const f = formatsCouleur(pal[r]);
    return `<div class="nuance"><div class="teinte c-${kebab[r] || r}"></div><div class="infos"><strong>${LIBELLES_ROLES[r]}</strong> · ${echapper(f.nom)}<br>${f.hex}<br><span class="muet">${echapper(f.rgb)}<br>${echapper(f.hsl)}<br>${echapper(f.oklch)}<br>CMJN indicatif : ${echapper(f.cmjn)}</span></div></div>`;
  }).join('');
  const contr = verifierPalette(pal).filter((c) => c.mode === 'clair').map((c) => `<tr><td>${echapper(c.libelle)}</td><td class="n">${c.ratio} : 1</td><td class="n">≥ ${c.min}</td><td class="${c.ok ? 'ok' : 'ko'}">${c.ok ? 'conforme' : 'insuffisant'}</td></tr>`).join('');
  const mal = (cls, legende, svg) => `<div><div class="logo-boite mal ${cls}">${enLigne(svg)}</div><p class="croix muet">${legende}</p></div>`;
  const corps = `
<header>
<p class="muet">Charte graphique</p>
<h1>${echapper(e.nom)}</h1>
<p>${texteHtml(textes.positionnement)}</p>
<p class="alerte avert"><strong>Document généré automatiquement.</strong> C'est un point de départ : relisez-le, adaptez-le et vérifiez la disponibilité du nom et du logo avant tout usage commercial.</p>
</header>

<h2 id="logo">1. Le logo</h2>
<div class="grille">
<div><div class="logo-boite">${enLigne(v.principal.svg)}</div><p class="muet">Principal</p></div>
<div><div class="logo-boite">${enLigne(v.horizontal.svg)}</div><p class="muet">Horizontal</p></div>
<div><div class="logo-boite">${enLigne(v.vertical.svg)}</div><p class="muet">Vertical</p></div>
<div><div class="logo-boite">${enLigne(v.icone.svg)}</div><p class="muet">Icône</p></div>
<div><div class="logo-boite sombre">${enLigne(v['fond-sombre'].svg)}</div><p class="muet">Sur fond sombre</p></div>
<div><div class="logo-boite">${enLigne(v['mono-noir'].svg)}</div><p class="muet">Noir seul</p></div>
</div>
<h3>Zone de protection et taille minimale</h3>
<p>Laissez autour du logo un espace libre au moins égal à la hauteur des majuscules du nom : aucun texte, bord de page ni image ne doit y entrer. Le fichier SVG contient déjà cette marge.</p>
<p>Taille minimale conseillée : <strong>120 pixels de large</strong> à l'écran et <strong>25 mm</strong> à l'impression. En dessous, utilisez l'icône (<strong>16 pixels</strong> minimum, version favicon).</p>
<h3>À ne pas faire</h3>
<div class="grille">
${mal('mal-deforme', 'Ne pas déformer', v.principal.svg)}${mal('mal-pivote', 'Ne pas faire pivoter', v.principal.svg)}${mal('mal-couleurs', 'Ne pas changer les couleurs', v.principal.svg)}${mal('mal-ombre', 'Ne pas ajouter d’ombre', v.principal.svg)}${mal('mal-contraste', 'Ne pas poser sur un fond qui manque de contraste', v.principal.svg)}${mal('mal-petit', 'Ne pas réduire trop', v.principal.svg)}
</div>

<h2 id="couleurs">2. Les couleurs</h2>
<p>Harmonie : <strong>${echapper(pal.harmonie)}</strong>. La version sombre (fichier <code>04-couleurs/variables.css</code>) s'active automatiquement selon les préférences de l'appareil.</p>
<div class="grille">${nuancier}</div>
<h3>Contrastes (mode clair)</h3>
<table><thead><tr><th>Association</th><th class="n">Ratio</th><th class="n">Minimum</th><th>Résultat</th></tr></thead><tbody>${contr}</tbody></table>
<p class="muet">Les contrastes sont calculés selon la méthode WCAG 2.x. Un résultat conforme n'est pas une certification d'accessibilité.</p>

<h2 id="typographie">3. La typographie</h2>
<div class="carte"><p class="muet">Titres : ${echapper(ft.nom)} (${echapper(ft.categorie)})</p><p style="font-family:var(--police-titres);font-size:2rem;font-weight:${ft.poids.includes(700) ? 700 : 400};margin:.2em 0">${echapper(e.nom)}, ${echapper(e.mention || 'un titre')}</p></div>
<div class="carte"><p class="muet">Texte : ${echapper(fx.nom)} (${echapper(fx.categorie)})</p><p>Voici un paragraphe d'exemple. Il montre la lecture courante : interligne confortable, longueur de ligne raisonnable, contraste suffisant. Les polices sont sous licence libre SIL OFL 1.1.</p></div>
<table><thead><tr><th>Niveau</th><th>Taille</th><th>Usage</th></tr></thead><tbody><tr><td>Titre 1</td><td>2,2 rem</td><td>Titre de page</td></tr><tr><td>Titre 2</td><td>1,5 rem</td><td>Sections</td></tr><tr><td>Texte</td><td>1,06 rem</td><td>Paragraphes (interligne 1,6)</td></tr><tr><td>Légende</td><td>0,9 rem</td><td>Notes, mentions</td></tr></tbody></table>

<h2 id="ton">4. Le ton de voix</h2>
<div class="grille">${textes.valeurs.map((x) => `<div class="carte"><h3>${echapper(x.nom)}</h3><p>${echapper(x.phrase)}</p></div>`).join('')}</div>
<div class="grille"><div class="carte"><h3>À faire</h3><ul>${textes.ton.faire.map((t) => `<li>${echapper(t)}</li>`).join('')}</ul></div><div class="carte"><h3>À éviter</h3><ul>${textes.ton.eviter.map((t) => `<li>${echapper(t)}</li>`).join('')}</ul></div></div>

<h2 id="exemples">5. Composants d'interface</h2>
<p><a class="bouton plein" href="#exemples">Bouton principal</a> <a class="bouton contour" href="#exemples">Bouton secondaire</a></p>
<div class="alerte succes">Message de réussite</div><div class="alerte avert">Message d'attention</div><div class="alerte erreur">Message d'erreur</div>
<div class="carte"><h3>Carte</h3><p>Une carte regroupe une information. Fond « surface », bordure fine, coins arrondis.</p></div>

<h2 id="usages">6. Exemples d'usage</h2>
<ul><li>Carte de visite, papier à en-tête, étiquettes : dossier <code>07-papeterie</code>.</li><li>Visuels pour les réseaux sociaux : dossier <code>08-reseaux-sociaux</code>.</li><li>Page web d'accueil : dossier <code>09-site-web</code>.</li></ul>
<p class="muet">Couleur d'accent principale : ${echapper(nomCouleur(pal.accent))}.</p>
`;
  return pageHtml({ titre: 'Charte graphique', corps, projet, fontsCfg, racine: '', description: `Charte graphique de ${e.nom}` });
}
