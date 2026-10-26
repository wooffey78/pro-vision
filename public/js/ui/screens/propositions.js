// @ts-check
import { h } from '../dom.js';
import { progression, apercuLogo, pastille, actions, bouton, lienBouton, copier, champ, nuancier } from '../composants.js';
import { variantesPour } from '../apercu.js';
import { genererSerie, genererProposition } from '../../core/generation.js';
import { normaliserCode } from '../../core/prng.js';
import { famille } from '../../core/fonts.js';

const VERROUS = [['palette', 'cette palette'], ['polices', 'ces polices'], ['logo', 'ce logo']];

/** Crée une série et mémorise son code (5 dernières séries). */
function creerSerie(app, code) {
  const { entreprise, preferences } = app.projet;
  const propositions = genererSerie(app.ctx, entreprise, preferences, code, app.verrous, 9);
  app.serie = { code, propositions };
  app.historique = [code, ...app.historique.filter((c) => c !== code)].slice(0, 5);
  app.sauver();
}

export async function ecranPropositions(app) {
  const p = app.projet;
  if (p.entreprise.nom.trim().length < 2) { app.naviguer('#/etape/1'); return null; }
  if (!app.serie) creerSerie(app, app.nouveauCode());
  const racine = h('section', null, progression(6), h('h1', null, 'Vos propositions'));
  racine.append(h('p', null, 'Chaque proposition est calculée à partir de vos réponses ; son code permet de la retrouver à l’identique. Cochez « garder » pour conserver un élément dans les prochaines propositions.'));

  const barre = h('div', { class: 'barre-outils' });
  const champCode = champ({ label: 'J’ai un code', aide: 'Format XXXX-XXX', max: 12, onInput: () => {} });
  barre.append(
    bouton('Nouvelles propositions', () => { creerSerie(app, app.nouveauCode()); app.naviguer('#/etape/6'); }, 'secondaire'),
    h('form', { class: 'ligne', onsubmit: (ev) => {
      ev.preventDefault();
      const code = normaliserCode(champCode.el.value);
      if (!code) { champCode.erreur('Ce code n’est pas valide (exemple : K7M2-9QX).'); return; }
      champCode.erreur('');
      const prop = genererProposition(app.ctx, p.entreprise, p.preferences, code);
      app.serie = { code: app.serie.code, propositions: [prop, ...app.serie.propositions.filter((x) => x.code !== code)].slice(0, 9) };
      app.naviguer('#/etape/6');
    } }, champCode.racine, h('button', { type: 'submit', class: 'bouton secondaire' }, 'Retrouver')));
  if (app.historique.length > 1) {
    const sel = h('select', { id: 'hist', class: 'champ-saisie', onchange: (ev) => { if (ev.target.value) { creerSerie(app, ev.target.value); app.naviguer('#/etape/6'); } } }, h('option', { value: '' }, 'Séries précédentes…'), ...app.historique.map((c) => h('option', { value: c }, `Série ${c}`)));
    barre.append(h('div', { class: 'champ' }, h('label', { for: 'hist' }, 'Revenir à une série'), sel));
  }
  racine.append(barre);

  const grille = h('ul', { class: 'propositions', 'aria-busy': 'true' });
  racine.append(grille);
  const verrouBoites = [];
  const majVerrous = () => verrouBoites.forEach(({ box, type, prop }) => { box.checked = app.verrous[type] === prop.identite[type]; });

  const rendus = await Promise.all(app.serie.propositions.map(async (prop) => ({ prop, ...(await variantesPour(app, prop.identite, p.entreprise)) })));
  rendus.forEach(({ prop, variantes }, i) => {
    const id = prop.identite;
    const pal = id.palette;
    const fam = (x) => famille(app.ctx.fonts, x).nom;
    const carte = h('li', { class: 'carte proposition' },
      h('h2', null, `Proposition ${i + 1}`),
      h('div', { class: 'logo-boite' }, apercuLogo(variantes.principal.svg, { alt: variantes.principal.description })),
      h('ul', { class: 'pastilles', 'aria-label': 'Couleurs' }, pastille(pal.principale, 'Principale'), pastille(pal.secondaire, 'Secondaire'), pastille(pal.accent, 'Accent')),
      nuancier([pal.principale, pal.secondaire, pal.accent], { titre: `Couleurs de la proposition ${i + 1}` }),
      h('p', { class: 'petit' }, `Polices : ${fam(id.polices.titres)} (titres), ${fam(id.polices.texte)} (texte)`),
      h('p', { class: 'petit' }, 'Code : ', h('span', { class: 'mono' }, prop.code), ' ', bouton('Copier', async (ev) => { const ok = await copier(prop.code); ev.target.textContent = ok ? 'Copié' : 'Copie impossible'; app.annoncer(ok ? 'Code copié' : 'Copie impossible'); }, 'lien')),
      h('fieldset', { class: 'verrous' }, h('legend', null, 'Garder pour la suite'), ...VERROUS.map(([type, libelle]) => {
        const box = h('input', { type: 'checkbox', id: `v-${i}-${type}`, onchange: (ev) => { if (ev.target.checked) app.verrous[type] = id[type]; else delete app.verrous[type]; majVerrous(); } });
        verrouBoites.push({ box, type, prop });
        return h('div', null, box, h('label', { for: `v-${i}-${type}` }, libelle));
      })),
      bouton(`Choisir la proposition ${i + 1}`, () => {
        app.maj((pr) => { pr.identite = structuredClone(id); pr.meta.codeProposition = prop.code; pr.meta.graine = prop.code; delete pr.textes.slogan; });
        app.naviguer('#/etape/7');
      }));
    grille.append(carte);
  });
  majVerrous();
  grille.removeAttribute('aria-busy');
  racine.append(h('p', { class: 'filigrane-note' }, 'Aperçu : le filigrane disparaît dans le kit téléchargé.'), actions(lienBouton('#/etape/5', 'Retour', 'secondaire')));
  return racine;
}
