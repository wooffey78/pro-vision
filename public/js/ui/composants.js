// @ts-check
import { h, idUnique } from './dom.js';
import { creerSvgSur } from './safeSvg.js';
import { nomCouleur } from '../core/color.js';
import { meilleurTexteSur } from '../core/contrast.js';
import { deltaE } from '../core/color.js';

/** Retire les doublons exacts et les couleurs quasi identiques (ΔE < 0,02), en gardant l'ordre. */
export function uniques(hexes) {
  const sortie = [];
  for (const hex of hexes.filter(Boolean).map((x) => x.toLowerCase())) {
    if (!sortie.some((y) => y === hex || deltaE(y, hex) < 0.02)) sortie.push(hex);
  }
  return sortie;
}
import { t } from '../i18n/fr.js';

/** Champ de formulaire accessible (étiquette, aide, erreur liées par aria). */
export function champ({ label, aide = '', valeur = '', type = 'text', max, requis = false, multiligne = false, onInput, nom = '', autocomplete = '', inputmode = '' }) {
  const id = idUnique('champ');
  const idAide = `${id}-aide`;
  const idErr = `${id}-err`;
  const props = { id, name: nom || id, type: multiligne ? undefined : type, maxlength: max, required: requis || undefined, 'aria-describedby': `${aide ? idAide : ''} ${idErr}`.trim(), autocomplete: autocomplete || undefined, inputmode: inputmode || undefined, class: 'champ-saisie', oninput: (e) => onInput && onInput(e.target.value) };
  const el = multiligne ? h('textarea', { ...props, rows: 3 }) : h('input', { ...props, value: valeur });
  if (multiligne) el.value = valeur;
  const erreur = h('p', { id: idErr, class: 'erreur', role: 'alert' });
  const racine = h('div', { class: 'champ' }, h('label', { for: id }, label, requis ? h('span', { class: 'requis', 'aria-hidden': 'true' }, ' *') : null), aide ? h('p', { id: idAide, class: 'aide' }, aide) : null, el, erreur);
  return {
    racine, el,
    erreur(message) {
      erreur.textContent = message || '';
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
  };
}

/** Résumé d'erreurs focalisable, avec liens vers les champs. */
export function resumeErreurs(erreurs) {
  const liste = h('ul', null, ...erreurs.map((e) => h('li', null, h('a', { href: `#${e.id}` }, e.message))));
  const r = h('div', { class: 'resume-erreurs', role: 'alert', tabindex: '-1' }, h('p', { class: 'gras' }, t.erreurs.resume), liste);
  r.addEventListener('click', (ev) => {
    const a = /** @type {HTMLElement} */ (ev.target).closest('a');
    if (a) { ev.preventDefault(); document.getElementById(a.getAttribute('href').slice(1))?.focus(); }
  });
  return r;
}

/** Pastille de couleur + nom (jamais la couleur seule). */
export function pastille(hex, etiquette) {
  return h('li', { class: 'pastille-item' }, h('span', { class: 'pastille', vars: { '--pastille': hex }, 'aria-hidden': 'true' }), h('span', null, etiquette ? `${etiquette} · ` : '', h('span', { class: 'mono' }, hex), ` (${nomCouleur(hex).toLowerCase()})`));
}

/** Nuancier visuel : chaque couleur est montrée avec un exemple de texte, son nom simple et son code. */
export function nuancier(hexes, { titre = 'Nuancier' } = {}) {
  return h('ul', { class: 'nuancier', 'aria-label': titre }, ...uniques(hexes).map((hex) => h('li', { class: 'nuance-case', vars: { '--fond': hex, '--texte': meilleurTexteSur(hex) } }, h('span', { class: 'nuance-aa', 'aria-hidden': 'true' }, 'Aa'), h('span', { class: 'nuance-nom' }, nomCouleur(hex)), h('span', { class: 'mono nuance-hex' }, hex))));
}

/** Aperçu d'un logo SVG, avec texte alternatif. */
export function apercuLogo(svg, { filigrane = true, sombre = false, alt = 'Aperçu du logo', classe = 'logo-apercu' } = {}) {
  const el = creerSvgSur(svg, { filigrane, sombre, classe });
  if (!el) return h('p', { class: 'erreur' }, 'Aperçu indisponible.');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', alt);
  return el;
}

/** Bandeau de progression « Étape N sur 8 ». */
export function progression(n) {
  return h('div', { class: 'progression' }, h('p', { class: 'progression-texte' }, `Étape ${n} sur 8 · ${t.etapes[n - 1]}`), h('progress', { max: '8', value: String(n), 'aria-label': `Étape ${n} sur 8` }));
}

/** Zone de navigation bas de page. */
export function actions(...els) {
  return h('div', { class: 'actions' }, ...els);
}

/** Lien-bouton (navigation interne par hash). */
export function lienBouton(href, texte, variante = 'primaire') {
  return h('a', { class: `bouton ${variante}`, href }, texte);
}

/** Bouton. */
export function bouton(texte, onClick, variante = 'primaire', extra = {}) {
  return h('button', { type: 'button', class: `bouton ${variante}`, onclick: onClick, ...extra }, texte);
}

/** Copie dans le presse-papiers (repli : sélection manuelle impossible → message). */
export async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}
