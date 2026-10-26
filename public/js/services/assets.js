// @ts-check
import { tousLesSymboles } from '../data/symbols.js';

/** Chargement des ressources du navigateur : configuration, polices, symboles. */
const cache = { polices: new Map(), symboles: new Map(), octets: new Map(), texte: new Map(), opentype: null };

async function json(url) {
  const r = await fetch(url, { credentials: 'omit' });
  if (!r.ok) throw new Error(`Ressource introuvable : ${url}`);
  return r.json();
}

/** Configuration complète. */
export async function chargerConfiguration() {
  const [app, fonts, sectors, social, bridge] = await Promise.all(['app.config', 'fonts.config', 'sectors', 'social-sizes', 'bridge.config'].map((n) => json(`config/${n}.json`)));
  return { app, fonts, sectors, social, bridge, symbolesDispo: new Set(tousLesSymboles(sectors)) };
}

async function opentype() {
  cache.opentype ||= await import('../../vendor/opentype/opentype.min.mjs');
  return cache.opentype;
}

/** Police opentype.js (contours). @param {any} fonts @param {string} id @param {number} poids */
export async function chargerPolice(fonts, id, poids) {
  const fam = fonts.familles.find((f) => f.id === id);
  const w = fam.poids.includes(poids) ? poids : fam.poids[0];
  const cle = `${id}-${w}`;
  if (!cache.polices.has(cle)) {
    cache.polices.set(cle, (async () => {
      const r = await fetch(`vendor/fonts/${id}/${id}-${w}.woff`, { credentials: 'omit' });
      if (!r.ok) throw new Error(`Police introuvable : ${id}`);
      return (await opentype()).parse(await r.arrayBuffer());
    })());
  }
  return cache.polices.get(cle);
}

/** Contenu interne d'un symbole Lucide. @param {string} id */
export async function chargerSymbole(id) {
  if (!cache.symboles.has(id)) {
    cache.symboles.set(id, (async () => {
      const r = await fetch(`vendor/lucide/${id}.svg`, { credentials: 'omit' });
      if (!r.ok) throw new Error(`Symbole introuvable : ${id}`);
      const t = await r.text();
      return t.slice(t.indexOf('>', t.indexOf('<svg')) + 1, t.lastIndexOf('</svg>')).trim();
    })());
  }
  return cache.symboles.get(id);
}

/**
 * Ressources nécessaires pour dessiner (et livrer) une identité. Échec de police : polices à null (repli texte).
 * @param {any} identite @param {any} fonts @param {{ complet?: boolean }} [o] complet : charge aussi les WOFF2 et licences (kit)
 */
export async function chargerRessources(identite, fonts, { complet = false } = {}) {
  const { titres, texte } = identite.polices;
  const [pt, px] = await Promise.all([chargerPolice(fonts, titres, 700).catch(() => null), chargerPolice(fonts, texte, 400).catch(() => null)]);
  const symboles = {};
  const s = identite.logo.symbole;
  if (s.type === 'lucide') symboles[s.id] = await chargerSymbole(s.id).catch(() => '');
  const res = { polices: { titres: pt, texte: px, pileTitres: fonts.familles.find((f) => f.id === titres)?.pile, pileTexte: fonts.familles.find((f) => f.id === texte)?.pile }, symboles, fichiersPolices: {}, licencesPolices: {} };
  if (complet) {
    for (const id of new Set([titres, texte])) {
      res.fichiersPolices[id] = {};
      for (const w of fonts.familles.find((f) => f.id === id).poids) {
        const r = await fetch(`vendor/fonts/${id}/${id}-${w}.woff2`, { credentials: 'omit' });
        if (r.ok) res.fichiersPolices[id][w] = new Uint8Array(await r.arrayBuffer());
      }
      const l = await fetch(`vendor/fonts/${id}/OFL.txt`, { credentials: 'omit' });
      res.licencesPolices[id] = l.ok ? await l.text() : '';
    }
  }
  return res;
}

/** Déclare les polices au navigateur (FontFace) pour l'affichage de textes dans l'interface. */
export async function declarerPolice(fonts, id) {
  const fam = fonts.familles.find((f) => f.id === id);
  if (!fam || document.fonts.check(`16px "${fam.nom}"`) && cache.octets.has(id)) return;
  cache.octets.set(id, true);
  await Promise.all(fam.poids.map(async (w) => {
    const ff = new FontFace(fam.nom, `url(vendor/fonts/${id}/${id}-${w}.woff2) format("woff2")`, { weight: String(w) });
    document.fonts.add(await ff.load());
  })).catch(() => {});
}
