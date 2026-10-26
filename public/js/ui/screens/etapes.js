// @ts-check
import { h } from '../dom.js';
import { t } from '../../i18n/fr.js';
import { champ, resumeErreurs, progression, actions, bouton, lienBouton, nuancier } from '../composants.js';
import { AMBIANCES, genererPalette } from '../../core/palette.js';
import { proposerNoms, contexteNoms, detecterLangue } from '../../data/names.js';
import { resoudreSecteur } from '../../data/sectors.js';
import { creerPrng } from '../../core/prng.js';
import { nomCouleur, GAMME_CHOIX } from '../../core/color.js';

const COULEURS = GAMME_CHOIX;

/** « a, b, c » → ['a','b','c'] (8 maximum, 40 caractères). */
export const liste = (s) => String(s).split(',').map((x) => x.trim().slice(0, 40)).filter(Boolean).slice(0, 8);

/** Groupe de cases à cocher limité à `max` choix. */
function groupe({ legende, aide, options, choisis, max, libelle = (x) => x, onChange }) {
  const sel = new Set(choisis);
  const cases = [];
  const maj = () => cases.forEach(({ input, valeur }) => { input.disabled = !sel.has(valeur) && sel.size >= max; });
  const items = options.map((valeur) => {
    const id = `g-${legende.length}-${valeur.replace(/\W/g, '')}`;
    const input = h('input', { type: 'checkbox', id, value: valeur, checked: sel.has(valeur) || undefined, onchange: (e) => { if (e.target.checked) sel.add(valeur); else sel.delete(valeur); maj(); onChange([...sel]); } });
    cases.push({ input, valeur });
    const pastilleCouleur = valeur.startsWith('#') ? h('span', { class: 'pastille', vars: { '--pastille': valeur }, 'aria-hidden': 'true' }) : null;
    return h('li', null, input, pastilleCouleur, h('label', { for: id }, libelle(valeur)));
  });
  maj();
  return h('fieldset', { class: 'groupe' }, h('legend', null, legende), h('p', { class: 'aide' }, aide), h('ul', { class: 'choix' }, ...items));
}

/** Écrans 1 à 5 du questionnaire. */
export function ecranEtape(app, n) {
  const p = app.projet;
  const e = p.entreprise;
  const pref = p.preferences;
  const champs = {};
  const racine = h('section', null, progression(n));
  const titre = h('h1', null, t.etapes[n - 1]);
  const form = h('form', { novalidate: true, onsubmit: (ev) => { ev.preventDefault(); valider(); } });
  racine.append(titre, form);
  const zoneErreurs = h('div');
  form.append(zoneErreurs);

  const maj = (cle, v) => app.maj((pr) => { pr.entreprise[cle] = v; });
  const ajoute = (cle, opts) => { const c = champ(opts); champs[cle] = c; form.append(c.racine); return c; };

  let validerEtape = () => [];
  if (n === 1) {
    ajoute('nom', { label: t.champs.nom, aide: t.champs.nomAide, valeur: e.nom, max: 40, requis: true, autocomplete: 'organization', onInput: (v) => maj('nom', v) });
    ajoute('mention', { label: t.champs.mention, aide: t.champs.mentionAide, valeur: e.mention, max: 40, onInput: (v) => maj('mention', v) });
    ajoute('activite', { label: t.champs.activite, aide: t.champs.activiteAide, valeur: e.activite, max: 160, multiligne: true, onInput: (v) => maj('activite', v) });
    const zoneIdees = h('div', { class: 'idees', 'aria-live': 'polite' });
    form.append(h('div', { class: 'champ' }, bouton('Me donner des idées de noms', () => {
      const secteur = resoudreSecteur(app.ctx.sectors, e);
      const noms = proposerNoms(secteur, creerPrng(app.nouveauCode()), 12, { exclure: [e.nom], contexte: contexteNoms(e), langue: detecterLangue(e) });
      zoneIdees.replaceChildren(h('p', { class: 'aide' }, 'Idées générées à partir de votre secteur, non vérifiées. Cliquez pour en adopter une :'), h('ul', { class: 'puces' }, ...noms.map((x) => h('li', null, bouton(x.nom, () => { maj('nom', x.nom); champs.nom.el.value = x.nom; champs.nom.erreur(''); champs.nom.el.focus(); }, 'secondaire')))));
    }, 'secondaire'), zoneIdees));
    validerEtape = () => {
      const err = [];
      const nom = e.nom.trim();
      if (nom.length < 2) { champs.nom.erreur(t.erreurs.nomRequis); err.push({ id: champs.nom.el.id, message: t.erreurs.nomRequis }); } else if (nom.length > 40) { champs.nom.erreur(t.erreurs.nomLong); err.push({ id: champs.nom.el.id, message: t.erreurs.nomLong }); } else champs.nom.erreur('');
      return err;
    };
  } else if (n === 2) {
    const id = 'secteur-select';
    const sel = h('select', { id, class: 'champ-saisie', onchange: (ev) => maj('secteur', ev.target.value) }, h('option', { value: 'auto' }, 'Détecter automatiquement'), ...app.ctx.sectors.secteurs.map((s) => h('option', { value: s.id, selected: e.secteur === s.id || undefined }, s.libelle)), h('option', { value: 'autre', selected: e.secteur === 'autre' || undefined }, 'Autre activité'));
    form.append(h('div', { class: 'champ' }, h('label', { for: id }, t.champs.secteur), sel));
    ajoute('produits', { label: t.champs.produits, aide: t.champs.produitsAide, valeur: e.produits.join(', '), onInput: (v) => maj('produits', liste(v)) });
    ajoute('publics', { label: t.champs.publics, aide: t.champs.publicsAide, valeur: e.publics.join(', '), onInput: (v) => maj('publics', liste(v)) });
  } else if (n === 3) {
    form.append(groupe({ legende: 'Ambiances (3 au maximum)', aide: 'Elles orientent les couleurs, les polices et les formes. Laissez vide pour les choisir automatiquement.', options: AMBIANCES, choisis: pref.ambiances, max: 3, libelle: (a) => a[0].toUpperCase() + a.slice(1), onChange: (l) => app.maj((pr) => { pr.preferences.ambiances = l; }) }));
    const radio = (valeur, libelle) => h('li', null, h('input', { type: 'radio', name: 'formalite', id: `f-${valeur}`, value: valeur, checked: pref.formalite === valeur || undefined, onchange: () => app.maj((pr) => { pr.preferences.formalite = valeur; }) }), h('label', { for: `f-${valeur}` }, libelle));
    form.append(h('fieldset', { class: 'groupe' }, h('legend', null, 'Comment parlez-vous à vos clients ?'), h('ul', { class: 'choix' }, radio('vous', 'Je les vouvoie'), radio('tu', 'Je les tutoie'))));
  } else if (n === 4) {
    const lib = (hex) => nomCouleur(hex);
    const zoneApercu = h('div', { class: 'apercu-palette', 'aria-live': 'polite' });
    const majApercu = () => {
      const pr = app.projet;
      const p = genererPalette({ ambiances: pr.preferences.ambiances, couleursAimees: pr.preferences.couleursAimees, couleursEvitees: pr.preferences.couleursEvitees, prng: creerPrng(`${pr.meta.graine}/apercu-palette`) });
      zoneApercu.replaceChildren(h('h2', null, 'Aperçu de votre palette'), h('p', { class: 'aide' }, 'Une palette possible selon vos choix. Elle change quand vous modifiez vos couleurs.'), nuancier([p.principale, p.secondaire, p.accent, p.fond, p.texte, ...p.etendue.slice(0, 4)], { titre: 'Aperçu de la palette' }));
    };
    form.append(groupe({ legende: 'Couleurs que vous aimez (3 au maximum)', aide: 'Facultatif. La première sert de base à votre palette.', options: COULEURS, choisis: pref.couleursAimees, max: 3, libelle: lib, onChange: (l) => { app.maj((pr) => { pr.preferences.couleursAimees = l; }); majApercu(); } }));
    form.append(groupe({ legende: 'Couleurs à éviter (3 au maximum)', aide: 'Facultatif. Elles ne seront pas utilisées comme couleurs principales.', options: COULEURS, choisis: pref.couleursEvitees, max: 3, libelle: lib, onChange: (l) => { app.maj((pr) => { pr.preferences.couleursEvitees = l; }); majApercu(); } }));
    form.append(zoneApercu);
    majApercu();
  } else {
    form.append(h('p', { class: 'aide' }, 'Facultatif : ces informations apparaissent sur les cartes, le papier à en-tête et le site. Vous pourrez les compléter plus tard.'));
    ajoute('ville', { label: t.champs.ville, valeur: e.ville, max: 60, autocomplete: 'address-level2', onInput: (v) => maj('ville', v) });
    ajoute('email', { label: t.champs.email, valeur: e.email, max: 80, type: 'email', autocomplete: 'email', onInput: (v) => maj('email', v) });
    ajoute('telephone', { label: t.champs.telephone, valeur: e.telephone, max: 30, type: 'tel', autocomplete: 'tel', onInput: (v) => maj('telephone', v) });
    ajoute('siteWeb', { label: t.champs.siteWeb, valeur: e.siteWeb, max: 120, autocomplete: 'url', onInput: (v) => maj('siteWeb', v) });
    ajoute('adresse', { label: t.champs.adresse, valeur: e.adresse, max: 120, autocomplete: 'street-address', onInput: (v) => maj('adresse', v) });
    validerEtape = () => {
      const m = e.email.trim();
      const ok = !m || (m.includes('@') && m.indexOf('.', m.indexOf('@')) > m.indexOf('@') + 1);
      champs.email.erreur(ok ? '' : t.erreurs.emailInvalide);
      return ok ? [] : [{ id: champs.email.el.id, message: t.erreurs.emailInvalide }];
    };
  }

  function valider() {
    const err = validerEtape();
    zoneErreurs.replaceChildren();
    if (err.length) {
      const r = resumeErreurs(err);
      zoneErreurs.append(r);
      r.focus();
      return;
    }
    app.naviguer(n < 5 ? `#/etape/${n + 1}` : '#/etape/6');
  }
  form.append(actions(
    n > 1 ? lienBouton(`#/etape/${n - 1}`, t.boutons.precedent, 'secondaire') : lienBouton('#/accueil', 'Accueil', 'secondaire'),
    h('button', { type: 'submit', class: 'bouton primaire' }, n < 5 ? t.boutons.suivant : t.boutons.voir)));
  return racine;
}
