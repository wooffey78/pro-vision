// @ts-check
import { h } from '../dom.js';
import { progression, apercuLogo, pastille, actions, lienBouton, nuancier } from '../composants.js';
import { variantesPour } from '../apercu.js';
import { verifierPalette, LIBELLES_ROLES } from '../../core/palette.js';
import { famille } from '../../core/fonts.js';
import { declarerPolice } from '../../services/assets.js';
import { NOMS_VARIANTES } from '../../core/variants.js';

const LIB_VARIANTES = { principal: 'Principal', horizontal: 'Horizontal', vertical: 'Vertical', icone: 'Icône', 'mono-noir': 'Noir seul', 'mono-blanc': 'Blanc seul', 'fond-sombre': 'Sur fond sombre', favicon: 'Favicon' };

export async function ecranValidation(app) {
  const p = app.projet;
  if (!p.identite) { app.naviguer('#/etape/6'); return null; }
  const id = p.identite;
  const { variantes } = await variantesPour(app, id, p.entreprise);
  await Promise.all([declarerPolice(app.ctx.fonts, id.polices.titres), declarerPolice(app.ctx.fonts, id.polices.texte)]);
  const ft = famille(app.ctx.fonts, id.polices.titres);
  const fx = famille(app.ctx.fonts, id.polices.texte);
  const pal = id.palette;
  const controles = verifierPalette(pal);
  const roles = ['principale', 'secondaire', 'accent', 'fond', 'texte', 'texteAttenue'];
  return h('section', null, progression(7), h('h1', null, 'Validation de votre identité'),
    h('div', { class: 'logo-boite grand' }, apercuLogo(variantes.principal.svg, { alt: variantes.principal.description })),
    h('p', { class: 'filigrane-note' }, 'Aperçu : le filigrane disparaît dans le kit téléchargé.'),
    h('h2', null, 'Les 8 variantes du logo'),
    h('ul', { class: 'variantes' }, ...NOMS_VARIANTES.map((n) => h('li', { class: n === 'fond-sombre' || n === 'mono-blanc' ? 'carte sombre' : 'carte' }, h('div', { class: 'logo-boite petit' }, apercuLogo(variantes[n].svg, { sombre: n === 'mono-blanc' || n === 'fond-sombre', alt: `${LIB_VARIANTES[n]} : ${variantes[n].description}` })), h('p', { class: 'petit' }, LIB_VARIANTES[n])))),
    h('h2', null, 'Couleurs'),
    nuancier([...roles.map((r) => pal[r]), ...(pal.etendue || [])], { titre: 'Toutes les couleurs' }),
    h('p', { class: 'petit' }, `Harmonie : ${pal.harmonie}. Une version sombre est aussi fournie.`),
    h('h2', null, 'Contrastes'),
    h('table', { class: 'tableau' }, h('caption', { class: 'sr-seulement' }, 'Contrastes WCAG des associations de couleurs'), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Association'), h('th', { scope: 'col' }, 'Mode'), h('th', { scope: 'col' }, 'Ratio'), h('th', { scope: 'col' }, 'Résultat'))),
      h('tbody', null, ...controles.map((c) => h('tr', null, h('td', null, c.libelle), h('td', null, c.mode), h('td', null, `${c.ratio} : 1 (min. ${c.min})`), h('td', { class: c.ok ? 'ok' : 'ko' }, c.ok ? '✓ conforme' : '✗ insuffisant'))))),
    h('h2', null, 'Polices'),
    h('p', { class: 'specimen titre', vars: { '--police': ft.pile } }, `${p.entreprise.nom || 'Votre nom'} — ${ft.nom}`),
    h('p', { class: 'specimen', vars: { '--police': fx.pile } }, `Voici un texte courant en ${fx.nom}, pour juger la lecture. Œuvre, été, ça et là.`),
    h('p', { class: 'alerte avert' }, 'Avant d’adopter ce nom : aucune vérification d’antériorité n’a été faite. Le kit explique comment contrôler marques, noms de domaine et réseaux.'),
    actions(lienBouton('#/etape/6', 'Autres propositions', 'secondaire'), lienBouton('#/retouches', 'Retoucher', 'secondaire'), lienBouton('#/etape/8', 'Confirmer et créer mon kit', 'primaire')));
}
