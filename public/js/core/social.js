// @ts-check
import { genererVariantes } from './variants.js';
import { integrerSvg, integrerSvgBorne, paragraphe, racineSvg, n2 } from './svgutil.js';
import { ratioContraste } from './contrast.js';
import { blocTexte } from './layouts.js';

const TITRES_POSTS = {
  bienvenue: 'Bienvenue', produit: 'À découvrir', coulisses: 'En coulisses', conseil: 'Le conseil du jour', avis: 'Vos retours',
  offre: 'Une nouveauté', evenement: 'Rendez-vous bientôt', citation: '', equipe: 'Faisons connaissance'
};

/** Couleur de texte lisible sur un fond. */
const lisible = (pal, fond) => (ratioContraste('#ffffff', fond) >= 4.5 ? '#ffffff' : '#10151b');

/**
 * Génère tous les visuels de réseaux sociaux.
 * @param {any} projet @param {{polices:any,symboles?:any}} ressources @param {any} textes sortie de genererTextes
 * @param {any} formats social-sizes.json
 * @returns {Record<string,string>} nom de fichier → SVG
 */
export function genererReseaux(projet, ressources, textes, formats) {
  const pal = projet.identite.palette;
  const e = projet.entreprise;
  const v = genererVariantes(projet, ressources);
  const pol = ressources.polices;
  const titres = pol.titres;
  const corps = pol.texte || pol.titres;
  const sortie = {};
  const f = (id) => formats.formats.find((x) => x.id === id);

  // Profil
  {
    const { largeur: W, hauteur: H } = f('profil');
    const ic = integrerSvg(v.icone.svg, 0, 0, W * 0.74);
    const c = `<rect width="${W}" height="${H}" fill="${pal.fond}"/>` + integrerSvg(v.icone.svg, W * 0.13, (H - ic.hauteur) / 2, W * 0.74).markup;
    sortie['profil.svg'] = racineSvg(0, 0, W, H, c, `Photo de profil ${e.nom}`);
  }
  // Bannières
  for (const id of ['banniere-facebook', 'banniere-linkedin', 'banniere-x', 'banniere-youtube']) {
    const { largeur: W, hauteur: H, securite } = f(id);
    const zoneH = id === 'banniere-youtube' ? H * 0.3 : H * (1 - 2 * securite);
    const zoneW = id === 'banniere-youtube' ? W * 0.6 : W * 0.7;
    const svgLogo = lisible(pal, pal.principale) === '#ffffff' ? v['mono-blanc'].svg : v['mono-noir'].svg;
    const ratio = integrerSvg(svgLogo, 0, 0, 100).hauteur / 100;
    const larg = Math.min(zoneW * 0.55, (zoneH * 0.8) / ratio);
    const logo = integrerSvg(svgLogo, (W - larg) / 2, (H - larg * ratio) / 2, larg);
    const c = `<rect width="${W}" height="${H}" fill="${pal.principale}"/><circle cx="${W * 0.92}" cy="${H * 0.1}" r="${H * 0.45}" fill="${pal.accent}" fill-opacity="0.25"/>` + logo.markup;
    sortie[`${id}.svg`] = racineSvg(0, 0, W, H, c, `Bannière ${f(id).reseau}`);
  }
  // Publications carrées
  const { largeur: P } = f('post-carre');
  Object.keys(TITRES_POSTS).forEach((cle, i) => {
    const clair = i % 3 === 1;
    const fond = clair ? pal.fond : i % 3 === 0 ? pal.principale : pal.secondaire;
    const txt = clair ? pal.texte : lisible(pal, fond);
    const titre = cle === 'citation' ? textes.slogans[0] : TITRES_POSTS[cle];
    let c = `<rect width="${P}" height="${P}" fill="${fond}"/>`;
    c += `<circle cx="${P * 0.9}" cy="${P * 0.12}" r="${P * 0.34}" fill="${clair ? pal.accent : txt}" fill-opacity="${clair ? 0.22 : 0.12}"/>`;
    const para = paragraphe(titres, titre, { x: 100, y: P * 0.34, largeur: P - 200, taille: cle === 'citation' ? 92 : 112, couleur: txt, interligne: 1.15, maxLignes: 5, pile: pol.pileTitres });
    c += para.markup;
    c += `<rect x="100" y="${P * 0.34 + para.hauteur + 10}" width="120" height="10" rx="5" fill="${clair ? pal.accent : txt}"/>`;
    c += paragraphe(corps, e.mention || e.nom, { x: 100, y: P * 0.34 + para.hauteur + 100, largeur: P - 200, taille: 44, couleur: clair ? pal.texteAttenue : txt, pile: pol.pileTexte }).markup;
    const logoVar = clair ? v.horizontal.svg : (lisible(pal, fond) === '#ffffff' ? v['mono-blanc'].svg : v['mono-noir'].svg);
    c += integrerSvgBorne(logoVar, 100, P - 80, 380, 200).markup;
    sortie[`post-${String(i + 1).padStart(2, '0')}-${cle}.svg`] = racineSvg(0, 0, P, P, c, `Publication « ${titre || cle} »`);
  });
  // Stories
  const st = f('story');
  ['citation', 'annonce', 'avis'].forEach((cle, i) => {
    const fond = [pal.principale, pal.fond, pal.secondaire][i];
    const txt = i === 1 ? pal.texte : lisible(pal, fond);
    const titre = [textes.slogans[1], 'Une annonce', 'Merci pour vos retours'][i];
    let c = `<rect width="${st.largeur}" height="${st.hauteur}" fill="${fond}"/>`;
    c += `<circle cx="${st.largeur * 0.8}" cy="${st.hauteur * 0.85}" r="${st.largeur * 0.5}" fill="${i === 1 ? pal.accent : txt}" fill-opacity="0.14"/>`;
    c += paragraphe(titres, titre, { x: 100, y: st.hauteur * 0.4, largeur: st.largeur - 200, taille: 120, couleur: txt, interligne: 1.15, maxLignes: 6, pile: pol.pileTitres }).markup;
    c += integrerSvg(i === 1 ? v.vertical.svg : lisible(pal, fond) === '#ffffff' ? v['mono-blanc'].svg : v['mono-noir'].svg, (st.largeur - 420) / 2, st.hauteur - 540, 420).markup;
    sortie[`story-${i + 1}-${cle}.svg`] = racineSvg(0, 0, st.largeur, st.hauteur, c, `Story « ${titre} »`);
  });
  // Vignette vidéo et partage
  for (const id of ['vignette-video', 'partage']) {
    const { largeur: W, hauteur: H } = f(id);
    let c = `<rect width="${W}" height="${H}" fill="${pal.principale}"/><rect x="0" y="${H - 18}" width="${W}" height="18" fill="${pal.accent}"/>`;
    const txt = lisible(pal, pal.principale);
    c += paragraphe(titres, e.nom, { x: 70, y: H * 0.45, largeur: W * 0.58, taille: id === 'partage' ? 80 : 96, couleur: txt, interligne: 1.15, maxLignes: 3, pile: pol.pileTitres }).markup;
    c += paragraphe(corps, e.mention || textes.slogans[0], { x: 70, y: H * 0.75, largeur: W * 0.6, taille: 38, couleur: txt, pile: pol.pileTexte }).markup;
    c += integrerSvg(v.icone.svg, W - 70 - H * 0.42, (H - H * 0.42) / 2, H * 0.42).markup;
    sortie[`${id}.svg`] = racineSvg(0, 0, W, H, c, `Image ${id}`);
  }
  void n2;
  void blocTexte;
  return sortie;
}
