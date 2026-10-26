// @ts-check
import { h } from '../dom.js';
import { t } from '../../i18n/fr.js';
import { lienBouton, bouton } from '../composants.js';

export function ecranAccueil(app) {
  const reprise = app.projetSauve && app.projet.entreprise.nom;
  return h('section', { class: 'accueil' },
    h('h1', null, t.accueil.titre),
    h('p', { class: 'intro' }, t.accueil.intro),
    app.notice ? h('p', { role: 'status' }, app.notice) : null,
    h('div', { class: 'actions' },
      bouton(reprise ? 'Nouveau projet' : t.accueil.commencer, () => { if (reprise) app.nouveauProjet(); app.naviguer('#/etape/1'); }, reprise ? 'secondaire' : 'primaire'),
      reprise ? h('a', { class: 'bouton primaire', href: app.projet.identite ? '#/retouches' : '#/etape/1' }, `${t.accueil.reprendre} (${app.projet.entreprise.nom})`) : null,
      lienBouton('#/retouches', t.accueil.ouvrir, 'secondaire')),
    h('ul', { class: 'cartes' }, ...t.accueil.promesses.map(([titre, texte]) => h('li', { class: 'carte' }, h('h2', null, titre), h('p', null, texte)))),
    h('p', { class: 'petit' }, t.accueil.attention));
}
