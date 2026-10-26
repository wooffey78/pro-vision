// @ts-check
import { h } from '../dom.js';
import { progression, actions, bouton, lienBouton } from '../composants.js';
import { chargerRessources } from '../../services/assets.js';
import { construireKit } from '../../core/kit.js';
import { creerZip, chargerFflate } from '../../services/zip.js';
import { svgVersPng } from '../../services/png.js';
import { telecharger, nomFichierSur } from '../../services/download.js';
import { validerProjet } from '../../core/schema.js';

const CONTENU = ['03-logo : 8 variantes en SVG et PNG, favicon', '04-couleurs : palette, contrastes, variables CSS', '05-typographies : polices et guide', '06 : charte graphique', '07-papeterie : cartes, papier à en-tête, devis, facture, étiquettes', '08-reseaux-sociaux : profil, bannières, publications, stories', '09-site-web : page d’accueil prête à publier', '10-textes : slogans, à propos, légendes, FAQ', '11 : checklist de lancement'];

export function ecranLivraison(app) {
  const p = app.projet;
  if (!p.identite) { app.naviguer('#/etape/6'); return null; }
  const verdict = validerProjet(p);
  const racine = h('section', null, progression(8), h('h1', null, 'Votre kit'));
  if (!verdict.ok) {
    racine.append(h('p', { class: 'alerte erreur', role: 'alert' }, `Le projet est incomplet (${verdict.erreurs[0].chemin} : ${verdict.erreurs[0].message}). Complétez-le avant de créer le kit.`), actions(lienBouton('#/etape/1', 'Corriger', 'primaire')));
    return racine;
  }
  racine.append(h('p', null, 'Le kit est assemblé dans votre navigateur, puis téléchargé : rien n’est envoyé sur Internet. Comptez quelques secondes.'), h('ul', { class: 'liste' }, ...CONTENU.map((c) => h('li', null, c))));
  const etat = h('div', { 'aria-live': 'polite', class: 'etat' });
  const barre = h('progress', { max: '100', value: '0', class: 'barre', 'aria-label': 'Avancement de la création du kit', hidden: true });
  const zoneDl = h('div');
  const nomZip = `kit-${nomFichierSur(p.entreprise.nom)}.zip`;

  const montrerTelechargement = (zip, avert) => {
    zoneDl.replaceChildren(
      h('p', { class: 'alerte succes', role: 'status' }, `Votre kit est prêt (${(zip.length / 1048576).toFixed(1)} Mo).`),
      avert.length ? h('ul', { class: 'alerte avert' }, ...avert.map((a) => h('li', null, a))) : null,
      actions(bouton(`Télécharger ${nomZip}`, () => telecharger(nomZip, zip, 'application/zip')), bouton('Télécharger projet.json seul', () => telecharger('projet.json', JSON.stringify(p, null, 2), 'application/json'), 'secondaire'), lienBouton('#/suite', 'Et maintenant ?', 'secondaire')),
      h('p', { class: 'petit' }, 'Conservez le fichier ZIP : il contient projet.json, qui permet de retoucher votre identité plus tard dans Pro-vision.'));
  };

  const creer = async () => {
    bt.disabled = true;
    barre.hidden = false;
    etat.textContent = 'Préparation des polices et des symboles…';
    try {
      const ressources = await chargerRessources(p.identite, app.ctx.fonts, { complet: true });
      const fflate = await chargerFflate();
      etat.textContent = 'Création des fichiers…';
      const { fichiers, avertissements } = await construireKit(p, ressources, app.ctx, { rasterize: svgVersPng, version: app.ctx.app.version, progression: (n, total) => { barre.value = Math.round((n / total) * 95); } });
      etat.textContent = 'Compression…';
      const zip = creerZip(fflate, fichiers);
      barre.value = 100;
      etat.textContent = '';
      app.dernierKit = zip;
      app.sauver();
      montrerTelechargement(zip, avertissements);
      telecharger(nomZip, zip, 'application/zip');
      app.annoncer('Votre kit est prêt et le téléchargement a démarré.');
    } catch (e) {
      console.error(e);
      etat.textContent = '';
      zoneDl.replaceChildren(h('p', { class: 'alerte erreur', role: 'alert' }, 'La création du kit a échoué. Rechargez la page et réessayez ; vos réponses sont conservées.'));
      bt.disabled = false;
    }
    barre.hidden = true;
  };
  const bt = bouton('Créer et télécharger mon kit', creer);
  racine.append(actions(bt, lienBouton('#/etape/7', 'Retour', 'secondaire')), barre, etat, zoneDl);
  return racine;
}
