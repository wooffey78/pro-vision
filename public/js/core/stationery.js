// @ts-check
import { genererVariantes } from './variants.js';
import { integrerSvg, paragraphe, racineSvg, n2, echapper } from './svgutil.js';
import { blocTexte } from './layouts.js';
import { famille } from './fonts.js';
import { ratioContraste } from './contrast.js';

/** @param {any} projet @param {any} ressources */
function contexteImpression(projet, ressources) {
  const pal = projet.identite.palette;
  return { pal, v: genererVariantes(projet, ressources), polices: ressources.polices, p: projet };
}

/** Traits de coupe pour un format avec fond perdu (unités 0,1 mm). */
function traitsDeCoupe(w, h, perdu) {
  const l = 40;
  const g = 12;
  const s = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="2"/>`;
  return [0, w].flatMap((x) => [s(x, -perdu - g, x, -perdu - g - l), s(x, h + perdu + g, x, h + perdu + g + l)]).concat([0, h].flatMap((y) => [s(-perdu - g, y, -perdu - g - l, y), s(w + perdu + g, y, w + perdu + g + l, y)])).join('');
}

/**
 * Carte de visite 85 × 55 mm. `impression` : fond perdu 3 mm + traits de coupe.
 * @returns {string[]} [recto, verso]
 */
export function carteVisite(projet, ressources, impression = false) {
  const { pal, v, polices, p } = contexteImpression(projet, ressources);
  const W = 850;
  const H = 550;
  const perdu = impression ? 30 : 0;
  const marge = impression ? 80 : 0;
  const vb = [-perdu - marge, -perdu - marge, W + 2 * (perdu + marge), H + 2 * (perdu + marge)];
  const habillage = (fond, contenu) => `<rect x="${-perdu}" y="${-perdu}" width="${W + 2 * perdu}" height="${H + 2 * perdu}" fill="${fond}"/>${contenu}${impression ? traitsDeCoupe(W, H, perdu) : ''}`;
  const logoRecto = integrerSvg(v['mono-blanc'].svg, 0, 0, 430);
  const x0 = (W - 430) / 2;
  const recto = habillage(pal.principale, integrerSvg(ratioContraste('#ffffff', pal.principale) >= 4.5 ? v['mono-blanc'].svg : v['mono-noir'].svg, x0, (H - logoRecto.hauteur) / 2, 430).markup);
  const e = p.entreprise;
  const lignes = [e.mention, e.ville, e.email, e.telephone, e.siteWeb].filter(Boolean);
  let y = 250;
  let verso = integrerSvg(v.horizontal.svg, 60, 60, 330).markup;
  for (const l of lignes.length ? lignes : ['[À COMPLÉTER : vos coordonnées]']) {
    verso += blocTexte(polices.texte || polices.titres, l, 30, pal.texte, 0.01, 60, y, 'gauche', '').markup;
    y += 46;
  }
  verso += `<rect x="60" y="${H - 60}" width="${W - 120}" height="4" rx="2" fill="${pal.accent}"/>`;
  return [
    racineSvg(vb[0], vb[1], vb[2], vb[3], recto, `Carte de visite ${e.nom}, recto`),
    racineSvg(vb[0], vb[1], vb[2], vb[3], habillage(pal.fond, verso), `Carte de visite ${e.nom}, verso`)
  ];
}

/** Papier à en-tête A4 (210 × 297 mm, unités 0,1 mm). */
export function papierEnTete(projet, ressources) {
  const { pal, v, polices, p } = contexteImpression(projet, ressources);
  const W = 2100;
  const H = 2970;
  const e = p.entreprise;
  let c = `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  c += integrerSvg(v.horizontal.svg, 200, 170, 620).markup;
  c += `<rect x="200" y="470" width="${W - 400}" height="5" fill="${pal.principale}"/>`;
  const pied = [e.nom, e.adresse, [e.ville, e.telephone].filter(Boolean).join(' · '), [e.email, e.siteWeb].filter(Boolean).join(' · ')].filter(Boolean);
  let y = H - 260 - (pied.length - 1) * 46;
  for (const l of pied) {
    c += blocTexte(polices.texte || polices.titres, l, 30, pal.texteAttenue, 0.01, 200, y, 'gauche', '').markup;
    y += 46;
  }
  c += paragraphe(polices.texte || polices.titres, '[Votre courrier commence ici.]', { x: 200, y: 760, largeur: W - 400, taille: 38, couleur: pal.texteAttenue }).markup;
  return racineSvg(0, 0, W, H, c, `Papier à en-tête ${e.nom}`);
}

/** Planche d'étiquettes A4 : 2 colonnes × 4 lignes. */
export function etiquettes(projet, ressources) {
  const { pal, v } = contexteImpression(projet, ressources);
  const W = 2100;
  const H = 2970;
  const cw = 910;
  const ch = 600;
  const logo = integrerSvg(v.vertical.svg, 0, 0, cw - 400);
  let c = `<rect width="${W}" height="${H}" fill="#ffffff"/><defs><g id="pv-logo">${logo.markup}</g></defs>`;
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 2; k++) {
      const x = 140 + k * (cw + 40);
      const y = 150 + r * (ch + 70);
      c += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="40" fill="${pal.fond}" stroke="${pal.bordure}" stroke-width="3"/><use href="#pv-logo" x="${x + 200}" y="${y + Math.max(30, (ch - logo.hauteur) / 2)}"/>`;
    }
  }
  return racineSvg(0, 0, W, H, c, `Planche d'étiquettes ${projet.entreprise.nom}`);
}

const cssMail = (pal) => `font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${pal.texte};line-height:1.45`;

/** Signature e-mail : HTML (styles en ligne, compatible messageries) + texte brut. */
export function signature(projet, logoUrlRelatif = 'logo-signature.png') {
  const e = projet.entreprise;
  const pal = projet.identite.palette;
  const ligne = [e.mention, e.ville, e.telephone, e.email, e.siteWeb].filter(Boolean);
  const tableau = `<table role="presentation" cellpadding="0" cellspacing="0" style="${cssMail(pal)}"><tr><td style="padding-right:16px;border-right:3px solid ${pal.accent}"><img src="${logoUrlRelatif}" alt="Logo ${echapper(e.nom)}" width="120" style="display:block"></td><td style="padding-left:16px"><strong style="font-size:16px;color:${pal.principale}">${echapper(e.nom)}</strong><br>${ligne.map(echapper).join('<br>') || '[À COMPLÉTER : vos coordonnées]'}</td></tr></table>`;
  const html = `<!doctype html>\n<html lang="fr">\n<head><meta charset="utf-8"><title>Signature e-mail · ${echapper(e.nom)}</title></head>\n<body>\n<!-- Sélectionnez et copiez uniquement le tableau ci-dessous dans les réglages de signature de votre messagerie. Les styles sont en ligne pour rester compatibles. -->\n${tableau}\n</body>\n</html>\n`;
  const texte = [e.nom, ...ligne].join('\n') + '\n';
  return { html, texte };
}

/** Modèle de devis ou de facture : page HTML imprimable (champs à compléter). */
export function documentCommercial(projet, type, enveloppeCss) {
  const e = projet.entreprise;
  const titre = type === 'devis' ? 'Devis' : 'Facture';
  const lignes = [1, 2, 3].map(() => '<tr><td>[Désignation]</td><td class="n">[Qté]</td><td class="n">[Prix unitaire]</td><td class="n">[Total]</td></tr>').join('');
  const mentions = type === 'devis' ? 'Devis valable [À COMPLÉTER] jours. Bon pour accord : date et signature.' : 'À régler avant le [À COMPLÉTER]. Mentions légales obligatoires (numéro SIRET, TVA ou mention d’exonération, pénalités de retard…) : [À COMPLÉTER, voir le guide de lancement].';
  return `<h1>${titre} n° [À COMPLÉTER]</h1><p class="muet">Date : [À COMPLÉTER]</p><div class="deux"><div><strong>${echapper(e.nom)}</strong><br>${[e.adresse, e.ville, e.email, e.telephone].filter(Boolean).map(echapper).join('<br>') || '[Vos coordonnées]'}<br>SIRET : [À COMPLÉTER]</div><div><strong>Client</strong><br>[Nom et adresse du client]</div></div><table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">Prix unitaire</th><th class="n">Total</th></tr></thead><tbody>${lignes}</tbody></table><p class="total">Total : [À COMPLÉTER]</p><p class="muet">${mentions}</p>${enveloppeCss || ''}`;
}

export { famille };
