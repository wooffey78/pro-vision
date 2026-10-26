// @ts-check
/** Textes de l'interface (français). Toute chaîne visible passe par ici ou par un écran, jamais par du HTML brut. */
export const t = {
  appNom: 'Pro-vision',
  accueil: {
    titre: 'Votre identité visuelle de départ, en quelques minutes',
    intro: 'Répondez à quelques questions : Pro-vision crée un nom d’affichage, un logo, des couleurs, des polices et une trentaine de documents prêts à l’emploi. Gratuit, sans compte.',
    commencer: 'Commencer',
    reprendre: 'Reprendre mon projet',
    ouvrir: 'Ouvrir un kit existant',
    promesses: [
      ['Gratuit et sans compte', 'Aucune inscription, aucun paiement : vous obtenez un kit complet à télécharger.'],
      ['Vos données restent chez vous', 'Tout est calculé dans votre navigateur. Rien n’est envoyé à un serveur.'],
      ['Sans intelligence artificielle', 'Un moteur de règles propose des identités cohérentes et lisibles, sans service externe.']
    ],
    attention: 'Pro-vision ne vérifie ni la disponibilité d’un nom ni les droits sur une marque : le kit explique comment le faire.'
  },
  etapes: ['Votre entreprise', 'Votre offre', 'Votre style', 'Vos couleurs', 'Vos coordonnées', 'Propositions', 'Validation', 'Livraison'],
  champs: {
    nom: 'Nom de l’entreprise', nomAide: 'Entre 2 et 40 caractères. Pas encore de nom ? Demandez des idées ci-dessous.',
    mention: 'Mention sous le nom (facultatif)', mentionAide: 'Par exemple « bougies artisanales ». 40 caractères au maximum.',
    activite: 'Que faites-vous ? (facultatif)', activiteAide: 'Une phrase simple. Elle sert à choisir le symbole et à rédiger vos textes.',
    secteur: 'Secteur d’activité', produits: 'Produits ou services', produitsAide: 'Séparez-les par des virgules (8 maximum).',
    publics: 'Vos clients', publicsAide: 'Qui sont-ils ? Séparez par des virgules (8 maximum).',
    ville: 'Ville', email: 'Adresse e-mail', telephone: 'Téléphone', siteWeb: 'Site web', adresse: 'Adresse'
  },
  erreurs: {
    nomRequis: 'Indiquez le nom de votre entreprise (2 caractères minimum).',
    nomLong: 'Le nom est trop long (40 caractères maximum).',
    emailInvalide: 'Cette adresse e-mail semble incomplète.',
    resume: 'Veuillez corriger les champs suivants :'
  },
  boutons: { suivant: 'Continuer', precedent: 'Retour', voir: 'Voir mes propositions', choisir: 'Choisir cette proposition', nouvelles: 'Nouvelles propositions', telecharger: 'Télécharger mon kit (.zip)', copier: 'Copier le code' },
  filigrane: 'Aperçu : le filigrane disparaît dans le kit téléchargé.'
};
