// @ts-check
import { h } from '../dom.js';
import { actions, bouton, lienBouton } from '../composants.js';
import { lireFragment } from '../../services/bridge.js';
import { lireKit, ErreurZip } from '../../services/zipRead.js';
import { chargerFflate } from '../../services/zip.js';
import { validerProjet } from '../../core/schema.js';
import { migrer } from '../../core/migrate.js';

/**
 * Charge un fichier (kit .zip ou projet .json) dans l'application.
 * @returns {Promise<{ ok: boolean, message: string, notes: string[] }>}
 */
export async function importerFichier(app, fichier) {
  const lim = app.ctx.app.limites;
  try {
    if (fichier.size > lim.zipMaxOctets) return { ok: false, message: 'Ce fichier est trop volumineux (20 Mo maximum).', notes: [] };
    const octets = new Uint8Array(await fichier.arrayBuffer());
    let brut;
    let notes = [];
    if (octets[0] === 0x50 && octets[1] === 0x4b) {
      const r = await lireKit(await chargerFflate(), octets, lim);
      brut = r.projet;
      notes = r.avertissements;
    } else {
      if (octets.length > lim.jsonMaxOctets) return { ok: false, message: 'Ce fichier est trop volumineux.', notes: [] };
      brut = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(octets));
    }
    const m = migrer(brut, app.ctx);
    const v = validerProjet(m.projet);
    if (!v.ok) return { ok: false, message: `Ce projet n’est pas valide : ${v.erreurs[0].chemin} (${v.erreurs[0].message}).`, notes: [] };
    app.projet = v.projet;
    app.serie = null;
    app.verrous = {};
    app.sauver();
    return { ok: true, message: `Projet « ${v.projet.entreprise.nom} » ouvert.`, notes: [...notes, ...m.notes] };
  } catch (e) {
    if (e instanceof ErreurZip || e instanceof Error) return { ok: false, message: e.message && !(e instanceof SyntaxError) && !(e instanceof TypeError) ? e.message : 'Ce fichier n’est pas un kit ou un projet Pro-vision lisible.', notes: [] };
    return { ok: false, message: 'Fichier illisible.', notes: [] };
  }
}

/** Zone de dépôt/choix de fichier. */
export function selecteurFichier(app, apres) {
  const msg = h('div', { role: 'status', 'aria-live': 'polite' });
  const input = h('input', { type: 'file', id: 'fichier-projet', accept: '.zip,.json,application/zip,application/json', class: 'champ-saisie', onchange: async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    msg.replaceChildren(h('p', null, 'Lecture du fichier…'));
    const r = await importerFichier(app, f);
    msg.replaceChildren(h('p', { class: r.ok ? 'alerte succes' : 'alerte erreur', role: r.ok ? 'status' : 'alert' }, r.message), ...r.notes.map((n) => h('p', { class: 'alerte avert' }, n)));
    if (r.ok) apres();
  } });
  return h('div', { class: 'champ' }, h('label', { for: 'fichier-projet' }, 'Ouvrir un kit (.zip) ou un projet (.json)'), h('p', { class: 'aide' }, 'Le fichier est lu dans votre navigateur ; il n’est jamais envoyé.'), input, msg);
}

/** Écran d'arrivée de la passerelle : #/import/<données>. */
export function ecranImport(app, hash) {
  const r = lireFragment(hash);
  const racine = h('section', null, h('h1', null, 'Informations reçues'));
  if (!r.ok) {
    racine.append(h('p', { class: 'alerte erreur', role: 'alert' }, `Impossible d’utiliser ce lien : ${r.erreur}.`), actions(lienBouton('#/etape/1', 'Commencer à la main', 'primaire')));
    return racine;
  }
  const e = r.charge.entreprise;
  racine.append(h('p', null, `Une autre application vous envoie ces informations (${r.charge.source}). Vérifiez-les : elles ne seront utilisées que dans votre navigateur.`),
    h('dl', { class: 'resume' }, h('dt', null, 'Nom'), h('dd', null, e.nom), e.mention ? h('dt', null, 'Mention') : null, e.mention ? h('dd', null, e.mention) : null, e.activite ? h('dt', null, 'Activité') : null, e.activite ? h('dd', null, e.activite) : null, e.ville ? h('dt', null, 'Ville') : null, e.ville ? h('dd', null, e.ville) : null),
    actions(bouton('Utiliser ces informations', () => {
      app.nouveauProjet();
      app.maj((p) => {
        p.source = ['provision', 'vyraty', 'aurion'].includes(r.charge.source) ? r.charge.source : 'provision';
        Object.assign(p.entreprise, { nom: e.nom, mention: e.mention || '', activite: e.activite || '', ville: e.ville || '' });
        if (e.secteur && app.ctx.sectors.secteurs.some((s) => s.id === e.secteur)) p.entreprise.secteur = e.secteur;
        if (r.charge.couleurPrincipale) p.preferences.couleursAimees = [r.charge.couleurPrincipale];
      });
      app.naviguer('#/etape/1');
    }), lienBouton('#/accueil', 'Ignorer', 'secondaire')));
  return racine;
}
