// @ts-check
import { chargerConfiguration } from './services/assets.js';
import { creerStockage, CLES } from './services/storage.js';
import { annoncer } from './services/announce.js';
import { validerProjet, projetVide } from './core/schema.js';
import { creerPrng, genererCode } from './core/prng.js';
import { h, vider } from './ui/dom.js';
import { ecranAccueil } from './ui/screens/accueil.js';
import { ecranEtape } from './ui/screens/etapes.js';
import { ecranPropositions } from './ui/screens/propositions.js';
import { ecranValidation } from './ui/screens/validation.js';
import { ecranLivraison } from './ui/screens/livraison.js';
import { ecranSuite } from './ui/screens/suite.js';
import { ecranRetouches } from './ui/screens/retouches.js';
import { ecranImport } from './ui/screens/importer.js';
import { ecranAvis, ecranIa } from './ui/screens/avis.js';

const TITRES = { accueil: 'Accueil', suite: 'Et maintenant ?', retouches: 'Retouches', import: 'Importer', avis: 'Votre avis', ia: 'Connexion IA' };

/** Graine d'entropie fournie par le navigateur (core/ n'utilise jamais Math.random). */
const entropie = () => [...crypto.getRandomValues(new Uint32Array(2))].join('-');

/** @returns {Promise<any>} */
async function demarrer() {
  const racine = document.getElementById('contenu');
  if (!racine) return;
  const ctx = await chargerConfiguration();
  const stockage = creerStockage({ localStorage: (() => { try { return window.localStorage; } catch { return null; } })(), indexedDB: window.indexedDB || null });

  /** @type {any} */
  const app = {
    ctx, stockage, racine,
    projet: null, serie: null, verrous: {}, historique: [], notice: '',
    nouveauCode: () => genererCode(creerPrng(entropie())),
    nouveauProjet() {
      const maintenant = new Date().toISOString();
      this.projet = projetVide({ id: crypto.randomUUID(), maintenant, appVersion: ctx.app.version, graine: this.nouveauCode() });
      this.serie = null;
      this.verrous = {};
      this.sauver();
    },
    maj(fn) {
      fn(this.projet);
      this.projet.meta.modifieLe = new Date().toISOString();
      this.sauver();
    },
    _delai: 0,
    sauver() {
      clearTimeout(this._delai);
      this._delai = window.setTimeout(() => { stockage.ecrire(CLES.projet, this.projet); stockage.ecrire(CLES.historique, this.historique); }, 300);
    },
    naviguer(hash) { if (location.hash === hash) rendre(); else location.hash = hash; },
    annoncer
  };

  // Reprise du projet enregistré
  const sauve = await stockage.lire(CLES.projet);
  if (sauve) {
    const r = validerProjet(sauve, { brouillon: true });
    if (r.ok) app.projet = r.projet;
    else app.notice = 'Votre projet enregistré était illisible : un nouveau projet a été créé.';
  }
  app.historique = (await stockage.lire(CLES.historique)) || [];
  app.projetSauve = !!app.projet && !!app.projet.entreprise.nom;
  if (!app.projet) app.nouveauProjet();

  const ROUTES = {
    accueil: () => ecranAccueil(app),
    propositions: () => ecranPropositions(app),
    validation: () => ecranValidation(app),
    livraison: () => ecranLivraison(app),
    suite: () => ecranSuite(app),
    retouches: () => ecranRetouches(app),
    avis: () => ecranAvis(app),
    ia: () => ecranIa(app)
  };

  async function rendre() {
    const hash = location.hash || '#/accueil';
    const [, nom = 'accueil', arg = ''] = hash.split('/');
    vider(racine);
    racine.setAttribute('aria-busy', 'true');
    let ecran;
    try {
      if (nom === 'etape') {
        const n = Number(arg);
        ecran = n >= 1 && n <= 5 ? ecranEtape(app, n) : n === 6 ? ecranPropositions(app) : n === 7 ? ecranValidation(app) : n === 8 ? ecranLivraison(app) : ecranAccueil(app);
      } else if (nom === 'import') ecran = ecranImport(app, hash);
      else ecran = (ROUTES[nom] || ROUTES.accueil)();
      const noeud = await ecran;
      if (noeud) racine.append(noeud);
    } catch (e) {
      console.error(e);
      racine.append(h('section', null, h('h1', { tabindex: '-1' }, 'Un problème est survenu'), h('p', null, 'Désolé, cet écran n’a pas pu s’afficher. Vos données sont conservées.'), h('a', { class: 'bouton primaire', href: '#/accueil' }, 'Retour à l’accueil')));
    }
    racine.removeAttribute('aria-busy');
    const titre = racine.querySelector('h1');
    document.title = `${titre ? titre.textContent : TITRES[nom] || 'Pro-vision'} · Pro-vision`;
    if (titre) { titre.setAttribute('tabindex', '-1'); titre.focus({ preventScroll: false }); }
    annoncer(document.title);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  window.addEventListener('hashchange', rendre);
  await rendre();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

demarrer().catch((e) => {
  console.error(e);
  const r = document.getElementById('contenu');
  if (r) r.textContent = 'Pro-vision n’a pas pu démarrer. Rechargez la page ; si le problème persiste, utilisez un navigateur récent.';
});
