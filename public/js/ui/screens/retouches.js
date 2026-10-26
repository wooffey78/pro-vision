// @ts-check
import { h } from '../dom.js';
import { champ, apercuLogo, pastille, actions, bouton, lienBouton } from '../composants.js';
import { selecteurFichier } from './importer.js';
import { variantesPour } from '../apercu.js';
import { genererPalette, HARMONIES, verifierPalette } from '../../core/palette.js';
import { creerPrng } from '../../core/prng.js';
import { DISPOSITIONS, CONTENANTS } from '../../core/layouts.js';
import { FAMILLES_MARQUES, parametresMarque } from '../../core/marks.js';
import { tousLesSymboles } from '../../data/symbols.js';
import { famille } from '../../core/fonts.js';
import { textesFinaux } from '../../core/kit.js';

const LIB = {
  disposition: { 'symbole-dessus': 'Symbole au-dessus', 'symbole-gauche': 'Symbole à gauche', 'symbole-droite': 'Symbole à droite', 'nom-seul': 'Nom seul', monogramme: 'Monogramme', 'deux-lignes': 'Nom sur deux lignes', bandeau: 'Nom entre deux filets', badge: 'Badge (symbole dans un écusson)' },
  contenant: { aucun: 'Aucun', cercle: 'Cercle', 'carre-arrondi': 'Carré arrondi', ecusson: 'Écusson', hexagone: 'Hexagone' },
  casse: { normal: 'Normale', majuscules: 'Majuscules', minuscules: 'Minuscules' }
};

function selecteur(id, libelle, options, valeur, onChange) {
  return h('div', { class: 'champ' }, h('label', { for: id }, libelle), h('select', { id, class: 'champ-saisie', onchange: (e) => onChange(e.target.value) }, ...options.map(([v, l]) => h('option', { value: v, selected: v === valeur || undefined }, l))));
}

export async function ecranRetouches(app) {
  const p = app.projet;
  const racine = h('section', null, h('h1', null, 'Retouches'));
  if (!p.identite) {
    racine.append(h('p', null, 'Ouvrez un kit déjà créé (le fichier .zip contient votre projet) pour le retoucher, ou créez d’abord votre identité.'), selecteurFichier(app, () => app.naviguer('#/retouches')), actions(lienBouton('#/etape/1', 'Créer mon identité', 'primaire'), lienBouton('#/accueil', 'Accueil', 'secondaire')));
    return racine;
  }
  const id = p.identite;
  const zoneApercu = h('div', { class: 'apercu-colle', 'aria-live': 'polite' });
  let minuterie = 0;
  const rafraichir = () => {
    clearTimeout(minuterie);
    minuterie = window.setTimeout(async () => {
      const { variantes } = await variantesPour(app, p.identite, p.entreprise);
      const pal = p.identite.palette;
      const ko = verifierPalette(pal).filter((c) => !c.ok).length;
      zoneApercu.replaceChildren(h('h2', null, 'Aperçu'), h('div', { class: 'logo-boite grand' }, apercuLogo(variantes.principal.svg, { alt: variantes.principal.description })), h('ul', { class: 'pastilles' }, pastille(pal.principale, 'Principale'), pastille(pal.secondaire, 'Secondaire'), pastille(pal.accent, 'Accent')), h('p', { class: ko ? 'alerte erreur' : 'petit' }, ko ? `${ko} contraste(s) insuffisant(s).` : 'Tous les contrastes sont conformes.'), h('p', { class: 'filigrane-note' }, 'Aperçu : le filigrane disparaît dans le kit.'));
    }, 200);
  };
  const modifier = (fn) => { app.maj((pr) => fn(pr)); rafraichir(); };

  const form = h('div', { class: 'formulaire' });
  // Entreprise
  const nom = champ({ label: 'Nom', valeur: p.entreprise.nom, max: 40, requis: true, onInput: (v) => { if (v.trim().length >= 2) { nom.erreur(''); modifier((pr) => { pr.entreprise.nom = v; }); } else nom.erreur('Au moins 2 caractères.'); } });
  const mention = champ({ label: 'Mention sous le nom', valeur: p.entreprise.mention, max: 40, onInput: (v) => modifier((pr) => { pr.entreprise.mention = v; }) });
  form.append(h('h2', null, 'Nom'), nom.racine, mention.racine);

  // Couleurs
  const harmonieSel = selecteur('r-harm', 'Harmonie', HARMONIES.map((x) => [x, x]), id.palette.harmonie, (v) => recalculer(null, v));
  const recalculer = (hex, harmonie) => {
    const pr0 = app.projet;
    const aimees = hex ? [hex] : pr0.preferences.couleursAimees;
    const pal = genererPalette({ ambiances: pr0.preferences.ambiances, couleursAimees: aimees, couleursEvitees: pr0.preferences.couleursEvitees, harmonie, prng: creerPrng(`${pr0.meta.graine}/retouche-palette`), seuilEvitees: app.ctx.app.couleurs.seuilEviteesDeltaE });
    modifier((pr) => { pr.identite.palette = pal; if (hex) pr.preferences.couleursAimees = [hex]; });
  };
  const couleur = h('input', { type: 'color', id: 'r-couleur', value: id.palette.principale, class: 'saisie-couleur', onchange: (e) => recalculer(e.target.value, harmonieSel.querySelector('select').value) });
  form.append(h('h2', null, 'Couleurs'), h('div', { class: 'champ' }, h('label', { for: 'r-couleur' }, 'Couleur de départ'), h('p', { class: 'aide' }, 'La palette complète (clair et sombre) est recalculée avec des contrastes garantis ; la couleur obtenue peut être légèrement ajustée.'), couleur), harmonieSel);

  // Polices
  form.append(h('h2', null, 'Polices'), selecteur('r-couple', 'Couple de polices', app.ctx.fonts.couples.map((c) => [c.id, `${famille(app.ctx.fonts, c.titres).nom} + ${famille(app.ctx.fonts, c.texte).nom}`]), id.polices.coupleId, (v) => { const c = app.ctx.fonts.couples.find((x) => x.id === v); modifier((pr) => { pr.identite.polices = { coupleId: c.id, titres: c.titres, texte: c.texte }; }); }));

  // Logo
  const symboles = tousLesSymboles(app.ctx.sectors);
  const optsSymb = [...symboles.map((s) => [`lucide:${s}`, `Symbole : ${s}`]), ...FAMILLES_MARQUES.filter((f) => f !== 'monogramme').map((f) => [`marque:${f}`, `Forme : ${f}`])];
  const courant = `${id.logo.symbole.type}:${id.logo.symbole.id}`;
  if (!optsSymb.some(([v]) => v === courant)) optsSymb.unshift([courant, `Actuel : ${id.logo.symbole.id}`]);
  form.append(h('h2', null, 'Logo'),
    selecteur('r-disp', 'Disposition', DISPOSITIONS.map((d) => [d, LIB.disposition[d]]), id.logo.disposition, (v) => modifier((pr) => { pr.identite.logo.disposition = v; })),
    selecteur('r-symb', 'Symbole', optsSymb, courant, (v) => { const [type, ident] = v.split(':'); modifier((pr) => { pr.identite.logo.symbole = type === 'marque' ? { type, id: ident, params: parametresMarque(ident, creerPrng(`${pr.meta.graine}/retouche-forme`)) } : { type, id: ident }; }); }),
    selecteur('r-cont', 'Contenant', CONTENANTS.map((c) => [c, LIB.contenant[c]]), id.logo.contenant, (v) => modifier((pr) => { pr.identite.logo.contenant = v; })),
    selecteur('r-style', 'Style du trait', [['standard', 'Standard'], ['fin', 'Fin'], ['epais', 'Épais'], ['plein', 'Plein'], ['simpliste', 'Simpliste (sans cadre)']], id.logo.style || 'standard', (v) => modifier((pr) => { pr.identite.logo.style = v; })),
    selecteur('r-casse', 'Casse du nom', Object.entries(LIB.casse), id.logo.casseNom, (v) => modifier((pr) => { pr.identite.logo.casseNom = v; pr.identite.logo.espacementLettres = v === 'majuscules' ? 0.08 : 0.02; })));

  // Textes
  const t0 = textesFinaux(p, app.ctx);
  const slogan = champ({ label: 'Slogan', valeur: t0.slogans[0], max: 70, onInput: (v) => modifier((pr) => { pr.textes.slogan = v; }) });
  const court = champ({ label: 'À propos (court)', valeur: t0.aPropos.court, max: 280, multiligne: true, onInput: (v) => modifier((pr) => { pr.textes.aProposCourt = v; }) });
  const google = champ({ label: 'Fiche Google (750 caractères maximum)', valeur: t0.google, max: 750, multiligne: true, onInput: (v) => modifier((pr) => { pr.textes.google = v; }) });
  form.append(h('h2', null, 'Textes'), slogan.racine, court.racine, google.racine);

  racine.append(h('div', { class: 'deux-colonnes' }, form, zoneApercu), actions(lienBouton('#/etape/8', 'Régénérer mon kit', 'primaire'), lienBouton('#/etape/7', 'Retour à la validation', 'secondaire')),
    h('details', { class: 'carte' }, h('summary', null, 'Ouvrir un autre kit'), selecteurFichier(app, () => app.naviguer('#/retouches'))));
  rafraichir();
  return racine;
}
