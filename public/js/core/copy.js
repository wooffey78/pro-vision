// @ts-check
import { creerPrng } from './prng.js';
import { capitaliser, minusculeInitiale } from '../data/keywords.js';
import { resoudreSecteur } from '../data/sectors.js';

/** Mots et formulations que les textes générés ne doivent jamais contenir (promesses, superlatifs). */
export const MOTS_INTERDITS = ['meilleur', 'numéro 1', 'n°1', 'n° 1', 'leader', 'garanti', 'garantie', '100 %', '100%', 'imbattable', 'unique au monde', 'incontournable', 'révolutionnaire', 'sans égal'];

/** Phrase de valeur par ambiance : [vous, tu]. */
const VALEURS = {
  chaleureux: ['L’accueil et l’écoute passent avant tout.', 'L’accueil et l’écoute passent avant tout, pour que tu te sentes bien.'],
  rassurant: ['Vous savez à quoi vous attendre, du premier échange à la fin.', 'Tu sais à quoi t’attendre, du premier échange à la fin.'],
  'sérieux': ['Le travail est mené avec rigueur et méthode.', 'Le travail est mené avec rigueur et méthode, sans mauvaise surprise.'],
  moderne: ['Les méthodes sont simples, actuelles et efficaces.', 'Les méthodes sont simples, actuelles et efficaces.'],
  naturel: ['Le respect du vivant et des matières guide les choix.', 'Le respect du vivant et des matières guide les choix.'],
  'élégant': ['Le détail compte : chaque finition est soignée.', 'Le détail compte : chaque finition est soignée.'],
  joyeux: ['La bonne humeur fait partie du service.', 'La bonne humeur fait partie du service.'],
  artisanal: ['Chaque réalisation est pensée et travaillée à la main.', 'Chaque réalisation est pensée et travaillée à la main.'],
  premium: ['L’exigence est placée sur la qualité et la durée.', 'L’exigence est placée sur la qualité et la durée.'],
  minimaliste: ['L’essentiel, rien de superflu.', 'L’essentiel, rien de superflu.'],
  audacieux: ['On ose les idées qui sortent des sentiers battus.', 'On ose les idées qui sortent des sentiers battus.'],
  doux: ['Tout se fait avec douceur et sans pression.', 'Tout se fait avec douceur et sans pression.']
};

const VALEUR_NOMS = {
  chaleureux: 'Chaleur humaine', rassurant: 'Confiance', 'sérieux': 'Rigueur', moderne: 'Simplicité', naturel: 'Respect du vivant', 'élégant': 'Soin du détail',
  joyeux: 'Bonne humeur', artisanal: 'Travail manuel', premium: 'Exigence', minimaliste: 'Sobriété', audacieux: 'Audace', doux: 'Douceur'
};

/** @param {string[]} l */
export function listeFr(l) {
  const x = l.filter(Boolean);
  if (x.length <= 1) return x[0] || '';
  return `${x.slice(0, -1).join(', ')} et ${x[x.length - 1]}`;
}

/** Termine par un point si la phrase n'a pas de ponctuation finale. */
const phrase = (s) => {
  const t = String(s).trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
};

/** Tronque proprement à une longueur maximale (coupe sur un espace). */
export function tronquer(s, max) {
  if (s.length <= max) return s;
  const coupe = s.slice(0, max - 1);
  const i = coupe.lastIndexOf(' ');
  return `${coupe.slice(0, i > max * 0.6 ? i : max - 1).replace(/[,;: ]+$/, '')}…`;
}

/**
 * Génère tous les textes d'un projet. Déterministe : mêmes entrées, mêmes textes.
 * @param {any} projet @param {{ sectors: any }} ctx
 */
export function genererTextes(projet, ctx) {
  const e = projet.entreprise;
  const tu = projet.preferences.formalite === 'tu';
  const v = (a, b) => (tu ? b : a);
  const prng = creerPrng(`${projet.meta.graine}/textes`);
  const secteur = resoudreSecteur(ctx.sectors, e);
  const nom = e.nom;
  const produits = (e.produits || []).filter(Boolean);
  const produit = produits[0] || (secteur.produits && secteur.produits[0]) || '';
  const ambiances = projet.preferences.ambiances.length ? projet.preferences.ambiances : secteur.ambiances;
  const valeurs = ambiances.map((a) => (VALEURS[a] ? VALEURS[a][tu ? 1 : 0] : '')).filter(Boolean);
  const activite = phrase(e.activite || `${nom} propose ${produits.length ? listeFr(produits) : 'ses services'}`);
  const ville = e.ville || '';
  const cta = v('N’hésitez pas à nous écrire pour échanger sur votre projet.', 'N’hésite pas à nous écrire pour parler de ton projet.');

  // Slogans
  const sec = secteur.slogans.map(capitaliser);
  const slogans = [
    `${sec[0]}.`,
    `${sec[1] || sec[0]}.`,
    `${sec[2] || sec[0]}.`,
    `${nom}, ${minusculeInitiale(sec[0])}.`,
    v(`Chez ${nom}, on prend le temps pour vous.`, `Chez ${nom}, on prend le temps pour toi.`),
    e.mention ? `${nom} : ${e.mention}.` : `${nom}, ${minusculeInitiale(sec[1] || sec[0])}.`,
    produit ? `${capitaliser(produit)}, avec soin.` : 'Un travail simple et soigné.',
    `${nom}, un savoir-faire simple et soigné.`,
    ville ? `${nom}, à ${ville}.` : `${nom}, près de vous.`,
    v('Avec vous, pas à pas.', 'Avec toi, pas à pas.')
  ].map((s) => tronquer(s, 70));

  const valeursTxt = valeurs.slice(0, 2).join(' ');
  const aProposCourt = tronquer(`${nom} : ${activite} ${valeursTxt}`.trim(), 280);
  const aProposLong = [
    `${nom} : ${activite}`,
    produits.length ? v(`Au programme : ${listeFr(produits)}.`, `Au programme : ${listeFr(produits)}.`) : '',
    valeurs.join(' '),
    ville ? `${nom} est basé${''} à ${ville}.`.replace('basé à', 'situé à') : '',
    cta
  ].filter(Boolean).join('\n\n');

  const google = tronquer(
    [`${nom} : ${activite}`, produits.length ? `Au programme : ${listeFr(produits)}.` : '', valeursTxt, ville ? `Basé à ${ville}.` : '', v('Contactez-nous pour en savoir plus.', 'Contacte-nous pour en savoir plus.')].filter(Boolean).join(' '),
    750
  );

  const mots = [...new Set([...(secteur.motsCles.slice(0, 3)), ...produits.slice(0, 2)])].map((m) => `#${m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '')}`).filter((h) => h.length > 2);
  const hashtags = mots.slice(0, 4).join(' ');
  const bio = {
    instagram: tronquer([e.mention || (produit ? capitaliser(produit) : nom), ville, v('Écrivez-nous', 'Écris-nous')].filter(Boolean).join(' • '), 150),
    facebook: tronquer(aProposCourt, 255),
    linkedin: tronquer(`${nom} : ${activite} ${valeursTxt}`, 220)
  };

  const legendesBase = {
    bienvenue: [`Bienvenue chez ${nom} ! ${phrase(e.mention || 'Nous sommes heureux de commencer cette aventure')} ${hashtags}`, `Voici ${nom}. ${activite} ${v('Suivez-nous pour découvrir la suite.', 'Suis-nous pour découvrir la suite.')}`, `${nom} ouvre sa page. ${cta}`],
    produit: [`${produit ? capitaliser(produit) : 'Notre sélection'} : ${v('découvrez', 'découvre')} ce que nous préparons. ${hashtags}`, `Gros plan sur ${produit || 'notre travail'}, fait avec soin.`, `${v('Dites-nous', 'Dis-nous')} ce qui vous intéresse le plus.`],
    coulisses: [`Dans les coulisses de ${nom}.`, `Un aperçu de notre quotidien. ${valeurs[0] || ''}`.trim(), `${v('Voulez-vous', 'Veux-tu')} voir comment ça se passe ? ${v('Dites-le', 'Dis-le')} en commentaire.`],
    conseil: [`Le conseil du jour : ${v('prenez', 'prends')} le temps de bien définir votre besoin avant de commencer.`, `Une question revient souvent ? ${v('Posez-la', 'Pose-la')} en commentaire, nous répondons.`, `Petit rappel : un bon projet commence par une bonne discussion.`],
    avis: [`Merci pour vos retours : ils nous aident à avancer.`, `${v('Vous avez', 'Tu as')} un avis à partager ? Nous sommes à l’écoute.`, `Chaque retour compte pour ${nom}.`],
    offre: [`À ${v('découvrir', 'découvrir')} : une nouveauté chez ${nom}. ${v('Écrivez-nous', 'Écris-nous')} pour les détails.`, `Une idée à ${v('vous', 'te')} proposer ? ${v('Contactez-nous', 'Contacte-nous')}.`, `${v('Renseignez-vous', 'Renseigne-toi')} auprès de nous pour connaître les conditions.`],
    evenement: [`Rendez-vous bientôt ! ${v('Suivez-nous', 'Suis-nous')} pour ne rien manquer.`, `Un moment à partager avec ${nom}. Les détails arrivent.`, `${v('Notez', 'Note')} la date : nous ${v('vous', 'te')} en disons plus très vite.`],
    citation: [`« Bien faire, simplement. » ${nom}`, `« Prendre soin du détail. » ${nom}`, `« Avancer ensemble. » ${nom}`],
    equipe: [`Derrière ${nom}, des personnes qui aiment ce qu’elles font.`, `${v('Faisons', 'Faisons')} connaissance : ${activite}`, `Merci à celles et ceux qui nous accompagnent.`]
  };
  const legendes = Object.fromEntries(Object.entries(legendesBase).map(([k, l]) => [k, l.map((t) => tronquer(t, 300))]));

  const faq = [
    [v('Comment vous contacter ?', 'Comment te contacter ?'), v(`Écrivez-nous${e.email ? ` à ${e.email}` : ''}${e.telephone ? ` ou appelez le ${e.telephone}` : ''} : nous répondons dès que possible.`, `Écris-nous${e.email ? ` à ${e.email}` : ''}${e.telephone ? ` ou appelle le ${e.telephone}` : ''} : nous répondons dès que possible.`)],
    ['Où êtes-vous ?', ville ? `${nom} est situé à ${ville}.` : '[À COMPLÉTER : indiquez votre lieu ou votre zone d’intervention.]'],
    ['Que proposez-vous ?', produits.length ? `Au programme : ${listeFr(produits)}. ${activite}` : activite],
    ['Quels sont les délais ?', v('Ils dépendent de votre demande : contactez-nous pour une estimation.', 'Ils dépendent de ta demande : contacte-nous pour une estimation.')],
    ['Comment se passe le paiement ?', '[À COMPLÉTER : moyens de paiement acceptés et conditions.]'],
    [v('Puis-je poser une question avant de me décider ?', 'Puis-je poser une question avant de me décider ?'), v('Bien sûr, c’est même conseillé.', 'Bien sûr, c’est même conseillé.')]
  ].map(([q, r]) => ({ question: q, reponse: r }));

  const bienvenue = [
    `Bonjour,`,
    '',
    `Merci de votre intérêt pour ${nom}. ${activite}`,
    '',
    v('Si vous avez une question ou un projet, répondez simplement à ce message : nous reviendrons vers vous rapidement.', 'Si tu as une question ou un projet, réponds simplement à ce message : nous reviendrons vers toi rapidement.'),
    '',
    v('À très bientôt,', 'À très bientôt,'),
    `L’équipe ${nom}`
  ].join('\n');

  const publics = (e.publics || []).filter(Boolean);
  const positionnement = tronquer(`${nom} : ${activite} ${valeursTxt}`.trim(), 400) + (publics.length ? ` Public visé : ${listeFr(publics)}.` : '');
  const valeursListe = ambiances.slice(0, 3).map((a) => ({ nom: VALEUR_NOMS[a] || capitaliser(a), phrase: (VALEURS[a] || ['', ''])[tu ? 1 : 0] }));
  const ton = {
    faire: [v('Utiliser « vous », avec chaleur et simplicité.', 'Utiliser « tu », avec chaleur et simplicité.'), 'Phrases courtes, mots du quotidien.', 'Dire concrètement ce qui est proposé.'],
    eviter: ['Les superlatifs et les promesses chiffrées.', 'Le jargon que vos clients n’emploient pas.', 'Les majuscules et les points d’exclamation en rafale.']
  };

  return { slogans, aPropos: { court: aProposCourt, long: aProposLong }, google, bio, legendes, faq, bienvenue, positionnement, valeurs: valeursListe, ton, hashtags };
}
