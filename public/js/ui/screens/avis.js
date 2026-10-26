// @ts-check
import { h } from '../dom.js';
import { actions, bouton, lienBouton, copier } from '../composants.js';

const MODELE = 'Ce que j’ai voulu faire :\n\nCe qui s’est passé :\n\nCe qui m’a plu / manqué :\n\n(Navigateur et appareil : )\n';

export function ecranAvis(app) {
  const url = app.ctx.app.avis.url;
  const zone = h('textarea', { id: 'avis-modele', rows: '9', class: 'champ-saisie', 'aria-label': 'Modèle de retour' });
  zone.value = MODELE;
  return h('section', null, h('h1', null, 'Votre avis'),
    h('p', null, 'Votre retour nous aide à améliorer Pro-vision. N’y mettez aucune information confidentielle.'),
    url ? h('p', null, h('a', { class: 'bouton primaire', href: url, rel: 'noopener noreferrer', target: '_blank' }, 'Donner mon avis (nouvel onglet)')) : h('p', { class: 'alerte avert' }, 'Aucun canal de retour n’est encore configuré pour cette installation. Copiez le modèle ci-dessous et envoyez-le à la personne qui vous a donné accès à Pro-vision.'),
    zone,
    actions(bouton('Copier le modèle', async (ev) => { const ok = await copier(zone.value); ev.target.textContent = ok ? 'Copié' : 'Copie impossible'; app.annoncer(ok ? 'Modèle copié' : 'Copie impossible'); }, 'secondaire'), lienBouton('#/accueil', 'Accueil', 'secondaire')));
}

export function ecranIa(app) {
  return h('section', null, h('h1', null, 'Connexion à une IA (optionnelle)'),
    h('p', null, app.ctx.app.ai.enabled ? 'Cette installation propose une connexion optionnelle à un service d’IA.' : 'Cette version de Pro-vision fonctionne entièrement sans intelligence artificielle : tout est calculé par des règles, dans votre navigateur.'),
    h('p', null, 'Une connexion optionnelle à un service d’IA, avec votre propre clé, pourra être proposée plus tard. Elle ne sera jamais obligatoire, et aucun texte ne sera envoyé sans votre accord explicite.'),
    actions(lienBouton('#/accueil', 'Accueil', 'secondaire')));
}
