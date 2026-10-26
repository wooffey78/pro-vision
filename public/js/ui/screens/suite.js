// @ts-check
import { h } from '../dom.js';
import { actions, bouton, lienBouton } from '../composants.js';
import { construireLien } from '../../services/bridge.js';

export function ecranSuite(app) {
  const p = app.projet;
  const liens = (app.ctx.bridge.apps || []).filter((a) => a.id !== 'provision').map((a) => ({ app: a, url: p.identite ? construireLien(app.ctx.bridge, a.id, p) : null })).filter((x) => x.url);
  const L = app.ctx.app.liens;
  return h('section', null, h('h1', null, 'Et maintenant ?'),
    h('p', null, 'Votre kit est un point de départ. Voici les prochaines étapes utiles.'),
    h('ul', { class: 'cartes' },
      h('li', { class: 'carte' }, h('h2', null, 'Vérifier votre nom'), h('p', null, 'Contrôlez les marques, les noms de domaine et les réseaux avant d’aller plus loin.'), h('ul', { class: 'liste' }, ...[['Base de l’INPI', L.inpi], ['TMview', L.tmview], ['AFNIC', L.afnic]].map(([n, u]) => h('li', null, h('a', { href: u, rel: 'noopener noreferrer', target: '_blank' }, `${n} (nouvel onglet)`))))),
      h('li', { class: 'carte' }, h('h2', null, 'Lancer votre marque'), h('p', null, 'Le dossier 11 du kit contient une checklist sur 7 jours.')),
      h('li', { class: 'carte' }, h('h2', null, 'Retoucher votre identité'), h('p', null, 'Changez une couleur, une police ou un texte, puis régénérez le kit.'), lienBouton('#/retouches', 'Retoucher', 'secondaire')),
      liens.length ? h('li', { class: 'carte' }, h('h2', null, 'Continuer dans une autre application'), h('p', null, 'Votre nom et votre activité sont transmis dans l’adresse du lien, sans passer par un serveur.'), ...liens.map((x) => h('a', { class: 'bouton secondaire', href: x.url, rel: 'noopener' }, `Ouvrir ${x.app.nom}`))) : null),
    h('h2', null, 'Vos données'),
    h('p', null, 'Votre projet est enregistré uniquement dans ce navigateur.'),
    actions(bouton('Effacer toutes mes données', async () => { if (window.confirm('Effacer le projet et toutes les données de Pro-vision enregistrées dans ce navigateur ?')) { await app.stockage.toutEffacer(); app.projetSauve = false; app.historique = []; app.nouveauProjet(); app.naviguer('#/accueil'); } }, 'danger'), lienBouton('#/avis', 'Donner mon avis', 'secondaire'), lienBouton('#/accueil', 'Accueil', 'secondaire')));
}
