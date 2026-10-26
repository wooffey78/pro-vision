// @ts-check
import { pageHtml, texteHtml, paragraphes } from './html.js';
import { echapper } from './svgutil.js';
import { verifierPalette, formatsCouleur, LIBELLES_ROLES } from './palette.js';
import { famille } from './fonts.js';
import { nomCouleur } from './color.js';

const enLigne = (svg) => svg.replace(/ width="[\d.]+" height="[\d.]+"/, '');
const lien = (url, texte) => `<a href="${echapper(url)}" rel="noopener noreferrer" target="_blank">${echapper(texte)}</a>`;

/** @param {any} p @param {any} fontsCfg @param {string} titre @param {string} corps @param {string} racine */
const page = (p, fontsCfg, titre, corps, racine) => pageHtml({ titre, corps, projet: p, fontsCfg, racine });

export function strategiePositionnement(p, fontsCfg, textes) {
  return page(p, fontsCfg, 'Positionnement', `<h1>Positionnement</h1>
<p class="alerte avert">Brouillon à relire : ce texte est construit à partir de vos réponses. Corrigez-le avec vos mots.</p>
<h2>En une phrase</h2>${paragraphes(textes.positionnement)}
<h2>À compléter</h2><ul><li>Ce que vos clients vous reconnaissent : <span class="a-completer">[À COMPLÉTER]</span></li><li>Ce que vous faites différemment, concrètement : <span class="a-completer">[À COMPLÉTER]</span></li><li>Ce que vous ne ferez jamais : <span class="a-completer">[À COMPLÉTER]</span></li></ul>`, '../');
}

export function strategieCibles(p, fontsCfg) {
  const publics = p.entreprise.publics.length ? p.entreprise.publics : ['[À COMPLÉTER : vos clients types]'];
  const cartes = publics.map((c) => `<div class="carte"><h3>${texteHtml(c)}</h3><ul><li>Ce qu'ils cherchent : comprendre vite ce que vous proposez <span class="muet">(à confirmer avec eux)</span></li><li>Ce qui les rassure : des exemples, des prix clairs, une réponse rapide <span class="muet">(à confirmer)</span></li><li>Où les trouver : <span class="a-completer">[À COMPLÉTER]</span></li></ul></div>`).join('');
  return page(p, fontsCfg, 'Cibles', `<h1>Vos clients</h1><p>Ces fiches sont des hypothèses de départ. Parlez à de vrais clients pour les vérifier.</p>${cartes}`, '../');
}

export function strategieValeurs(p, fontsCfg, textes) {
  return page(p, fontsCfg, 'Valeurs et ton', `<h1>Valeurs et ton</h1><h2>Valeurs</h2><div class="grille">${textes.valeurs.map((x) => `<div class="carte"><h3>${echapper(x.nom)}</h3><p>${echapper(x.phrase)}</p></div>`).join('')}</div><h2>Ton de voix</h2><div class="grille"><div class="carte"><h3>À faire</h3><ul>${textes.ton.faire.map((t) => `<li>${echapper(t)}</li>`).join('')}</ul></div><div class="carte"><h3>À éviter</h3><ul>${textes.ton.eviter.map((t) => `<li>${echapper(t)}</li>`).join('')}</ul></div></div>`, '../');
}

export function nomRetenu(p, fontsCfg, v) {
  const e = p.entreprise;
  return page(p, fontsCfg, 'Nom retenu', `<h1>${echapper(e.nom)}</h1>${e.mention ? `<p class="muet">${echapper(e.mention)}</p>` : ''}<div class="logo-boite">${enLigne(v.principal.svg)}</div><p class="alerte avert"><strong>Ce nom n'a fait l'objet d'aucune vérification officielle.</strong> Avant de l'utiliser, suivez les étapes de <a href="verifications.html">vérification</a>.</p>`, '../');
}

export function nomAlternatives(p, fontsCfg, noms) {
  return page(p, fontsCfg, 'Autres idées de noms', `<h1>Autres idées de noms</h1><p>Idées générées à partir de votre secteur. Elles n'ont pas été vérifiées.</p><ul>${noms.map((n) => `<li><strong>${echapper(n.nom)}</strong> <span class="muet">(${echapper(n.motif)})</span></li>`).join('')}</ul>`, '../');
}

export function nomVerifications(p, fontsCfg, liens) {
  return page(p, fontsCfg, 'Vérifications', `<h1>Vérifier votre nom</h1><p class="alerte avert">Pro-vision ne consulte aucune base de données : <strong>aucune disponibilité n'a été vérifiée</strong>. À vous de contrôler avant de créer votre marque.</p>
<ol><li>Marques déposées en France : ${lien(liens.inpi, 'base de l’INPI')}</li><li>Marques européennes et internationales : ${lien(liens.tmview, 'TMview')}</li><li>Nom de domaine en .fr : ${lien(liens.afnic, 'AFNIC')}</li><li>Comptes sur les réseaux sociaux : cherchez votre nom directement sur chaque réseau.</li><li>Recherche générale : tapez votre nom dans un moteur de recherche et regardez qui l'utilise déjà.</li></ol>
<p class="muet">Ces liens renvoient vers des sites officiels ; leur contenu et leur adresse peuvent évoluer.</p>`, '../');
}

export function couleursPalette(p, fontsCfg) {
  const pal = p.identite.palette;
  const kebab = { texteAttenue: 'texte-attenue' };
  const roles = ['principale', 'secondaire', 'accent', 'fond', 'surface', 'texte', 'texteAttenue', 'bordure', 'succes', 'erreur', 'avertissement'];
  const l = (r) => { const f = formatsCouleur(pal[r]); return `<div class="nuance"><div class="teinte c-${kebab[r] || r}"></div><div class="infos"><strong>${LIBELLES_ROLES[r]}</strong> · ${echapper(f.nom)}<br>${f.hex}<br><span class="muet">${echapper(f.rgb)}<br>${echapper(f.hsl)}<br>${echapper(f.oklch)}<br>CMJN indicatif : ${echapper(f.cmjn)}</span></div></div>`; };
  return page(p, fontsCfg, 'Palette', `<h1>Palette</h1><p>Harmonie : ${echapper(pal.harmonie)}. Mode clair ci-dessous ; le mode sombre est dans <code>variables.css</code>.</p><div class="grille">${roles.map(l).join('')}</div>`, '../');
}

export function couleursContrastes(p, fontsCfg) {
  const lignes = verifierPalette(p.identite.palette).map((c) => `<tr><td>${c.mode}</td><td>${echapper(c.libelle)}</td><td class="n">${c.ratio} : 1</td><td class="n">≥ ${c.min}</td><td class="${c.ok ? 'ok' : 'ko'}">${c.ok ? 'conforme' : 'insuffisant'}</td></tr>`).join('');
  return page(p, fontsCfg, 'Contrastes', `<h1>Contrastes</h1><table><thead><tr><th>Mode</th><th>Association</th><th class="n">Ratio</th><th class="n">Minimum</th><th>Résultat</th></tr></thead><tbody>${lignes}</tbody></table><p class="muet">Méthode WCAG 2.x. Informatif : ce n'est pas une certification.</p>`, '../');
}

export function typoGuide(p, fontsCfg) {
  const ft = famille(fontsCfg, p.identite.polices.titres);
  const fx = famille(fontsCfg, p.identite.polices.texte);
  return page(p, fontsCfg, 'Typographies', `<h1>Typographies</h1><div class="carte"><p class="muet">Titres : ${echapper(ft.nom)}</p><p style="font-family:var(--police-titres);font-size:2rem;margin:.2em 0;font-weight:${ft.poids.includes(700) ? 700 : 400}">Aa Bb Cc, 0123456789 — œ é è ê à ç</p></div><div class="carte"><p class="muet">Texte : ${echapper(fx.nom)}</p><p>Portez un toast à ce vieux juge blond qui fume. 0123456789 — œ é è ê à ç.</p></div>
<h2>Utiliser les polices</h2><ol><li>Les fichiers sont dans <code>polices/</code> (format WOFF2, pour le web).</li><li>Le fichier <code>fonts.css</code> les déclare : liez-le à votre site avec <code>&lt;link rel="stylesheet" href="fonts.css"&gt;</code>.</li><li>Pour installer une police sur votre ordinateur (Word, Canva…), téléchargez la version « TTF » sur la page officielle de la famille.</li></ol>
<h2>Licence</h2><p>Ces polices sont sous licence <strong>SIL Open Font License 1.1</strong> : usage libre, y compris commercial. Le texte de la licence est fourni dans chaque dossier de police.</p>`, '../');
}

export function checklist7Jours(p, fontsCfg, liens) {
  const jours = [
    ['Jour 1 · Relire et choisir', `Relisez le nom, le logo et les couleurs. Montrez-les à 3 personnes sans rien expliquer : comprennent-elles votre activité ?`],
    ['Jour 2 · Vérifier le nom', `Consultez ${lien(liens.inpi, 'l’INPI')}, ${lien(liens.tmview, 'TMview')} et ${lien(liens.afnic, 'l’AFNIC')}. Notez ce que vous trouvez.`],
    ['Jour 3 · Réserver', 'Si le nom est libre : réservez le nom de domaine et les comptes sur les réseaux sociaux.'],
    ['Jour 4 · Préparer les documents', 'Complétez les champs « À COMPLÉTER » des cartes, du papier à en-tête, des devis et factures.'],
    ['Jour 5 · Se présenter', 'Publiez la fiche Google, la bio des réseaux et le premier visuel de bienvenue (dossiers 08 et 10).'],
    ['Jour 6 · Mettre en ligne', 'Personnalisez la page d’accueil du dossier 09-site-web et publiez-la.'],
    ['Jour 7 · Annoncer', `Envoyez le message de bienvenue à vos premiers contacts. Pour les démarches de création, voir ${lien(liens.formalites, 'le guichet officiel des formalités')} et ${lien(liens.servicePublic, 'service-public.fr')}.`]
  ];
  return page(p, fontsCfg, 'Lancer sa marque en 7 jours', `<h1>Lancer sa marque en 7 jours</h1><p class="alerte avert">Ceci est une liste de repères, pas un conseil juridique ou fiscal. Pour votre situation, adressez-vous à un professionnel.</p>${jours.map(([t, x]) => `<div class="carte"><h3>${echapper(t)}</h3><p>${x}</p></div>`).join('')}`, '../');
}

export function lisezMoi(p, fontsCfg, v, version) {
  const e = p.entreprise;
  return pageHtml({ titre: 'Lisez-moi', projet: p, fontsCfg, racine: '', description: `Kit d'identité visuelle de ${e.nom}`, corps: `<h1>Votre kit : ${echapper(e.nom)}</h1><div class="logo-boite">${enLigne(v.principal.svg)}</div>
<h2>Par où commencer</h2><ol><li>Ouvrez <a href="06-charte-graphique.html">06-charte-graphique.html</a> : c'est le résumé de votre identité.</li><li>Utilisez les logos du dossier <code>03-logo</code> (SVG pour l'impression et le web, PNG pour le reste).</li><li>Complétez les champs « À COMPLÉTER » dans les modèles.</li></ol>
<h2>Contenu</h2><table><tbody>
<tr><td><code>01-strategie</code></td><td>Positionnement, clients, valeurs et ton</td></tr><tr><td><code>02-nom</code></td><td>Nom retenu, autres idées, vérifications à faire</td></tr><tr><td><code>03-logo</code></td><td>8 variantes du logo (SVG et PNG), favicon, zone de protection</td></tr><tr><td><code>04-couleurs</code></td><td>Palette, contrastes, variables CSS, tokens</td></tr><tr><td><code>05-typographies</code></td><td>Polices (WOFF2), CSS, guide</td></tr><tr><td><code>07-papeterie</code></td><td>Cartes de visite, papier à en-tête, signature, devis, facture, étiquettes</td></tr><tr><td><code>08-reseaux-sociaux</code></td><td>Profil, bannières, publications, stories</td></tr><tr><td><code>09-site-web</code></td><td>Page d'accueil prête à personnaliser</td></tr><tr><td><code>10-textes</code></td><td>Slogans, à propos, légendes, FAQ, message de bienvenue</td></tr><tr><td><code>11-lancer-sa-marque</code></td><td>Checklist des 7 premiers jours</td></tr>
<tr><td><code>projet.json</code></td><td>Votre projet : à conserver pour faire des retouches dans Pro-vision</td></tr></tbody></table>
<h2>Important</h2><ul><li><strong>Aucune vérification d'antériorité</strong> (marque, nom de domaine, logo) n'a été faite. À vous de la réaliser avant tout usage commercial.</li><li>Les textes sont des gabarits : relisez-les et adaptez-les.</li><li>Les couleurs CMJN sont indicatives : demandez un profil à votre imprimeur.</li><li>Les polices sont sous licence licence libre (texte fourni).</li><li>Licence du kit : voir <code>licence.json</code>. Généré par Pro-vision ${echapper(version)}, sans intelligence artificielle ni service externe.</li></ul>` });
}

export { nomCouleur };
