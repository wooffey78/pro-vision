// @ts-check
import { capitaliser, elidable, sansAccents, jetons } from './keywords.js';
import { verifierNom } from './blocklist.js';

const PRENOMS = ['Léa', 'Noé', 'Alba', 'Jules', 'Iris', 'Marius', 'Élise', 'Sacha', 'Camille', 'Lou', 'Malo', 'Nina', 'Ariane', 'Gaspard', 'Romy', 'Théo'];
const NATURES_EXTRA = ['Ourlet', 'Sillon', 'Brume', 'Mistral', 'Cristal', 'Velours', 'Ardoise', 'Argile', 'Lierre', 'Mésange', 'Feuillage', 'Galet', 'Dune', 'Ondée', 'Estuaire', 'Lagon', 'Torrent', 'Clairière', 'Orée', 'Pivoine', 'Bruyère', 'Rosée', 'Aurore', 'Garrigue', 'Tilleul', 'Olivier', 'Mosaïque', 'Vitrail', 'Pigment', 'Fusain', 'Calcaire', 'Basalte', 'Opale', 'Jade', 'Ivoire', 'Onyx', 'Nacre', 'Émeraude', 'Rubis', 'Saphir', 'Améthyste', 'Topaze', 'Quartz', 'Cèdre', 'Érable', 'Genêt', 'Hêtre', 'Myrte', 'Sésame', 'Anis', 'Girofle', 'Vanille', 'Réglisse', 'Tilia', 'Ginkgo', 'Papillon', 'Colibri', 'Renard', 'Loutre', 'Goéland', 'Hirondelle', 'Lynx', 'Fjord', 'Cirque', 'Météore', 'Comète', 'Équinoxe', 'Zénith', 'Boussole', 'Sextant', 'Marée'];
const STRUCTURES_EXTRA = ['Maison|f', 'Atelier|m', 'Studio|m', 'Comptoir|m', 'Cabinet|m', 'Fabrique|f', 'Galerie|f', 'Labo|m', 'Boutique|f', 'Passage|m', 'Jardin|m', 'Pavillon|m', 'Ferme|f', 'Halle|f', 'Terrasse|f', 'Villa|f', 'Clinique|f', 'Chaumière|f', 'Ruche|f', 'Serre|f'];
const ADJECTIFS_EXTRA = ['Vivant|Vivante', 'Libre|Libre', 'Franc|Franche', 'Tendre|Tendre', 'Sage|Sage', 'Neuf|Neuve', 'Vif|Vive', 'Calme|Calme', 'Intime|Intime', 'Malin|Maligne', 'Fin|Fine', 'Ouvert|Ouverte', 'Discret|Discrète', 'Lumineux|Lumineuse', 'Pur|Pure', 'Ludique|Ludique', 'Pratique|Pratique', 'Solaire|Solaire'];
const PRENOMS_EXTRA = ['Anouk', 'Mathis', 'Juliette', 'Hugo', 'Zoé', 'Adam', 'Mélina', 'Lucas', 'Inès', 'Tom', 'Margaux', 'Enzo', 'Clara', 'Rayan', 'Eva', 'Ismaël', 'Louise', 'Paul', 'Salomé', 'Victor'];
const LIEUX = ['Ouest', 'Aube', 'Colline', 'Rivage', 'Vallée', 'Pré', 'Bocage', 'Marais', 'Crête', 'Port'];

/** @param {string} s @returns {{mot:string, genre:string}} */
const nom = (s) => {
  const [mot, genre] = s.split('|');
  return { mot, genre: genre || 'm' };
};
const adj = (s, genre) => {
  const [m, f] = s.split('|');
  return genre === 'f' ? f || m : m;
};
const avecArticle = (n) => (elidable(n.mot) ? `l’${n.mot}` : `${n.genre === 'f' ? 'la' : 'le'} ${n.mot}`);
const avecDe = (n) => (elidable(n.mot) ? `de l’${n.mot}` : `${n.genre === 'f' ? 'de la' : 'du'} ${n.mot}`);

/**
 * Propose des noms d'entreprise à partir du lexique d'un secteur.
 * @param {any} secteur
 * @param {{ choix:<T>(l:T[])=>T, entier:(a:number,b:number)=>number }} prng
 * @param {number} n nombre de propositions
 * @param {{ exclure?: string[] }} [o]
 * @returns {{ nom: string, motif: string }[]}
 */
/** Mots de l'activité et des produits, utilisés pour rester proche du métier. */
/** Lexiques de noms en italien, espagnol et anglais, déclenchés par le contexte détecté. */
const LANGUES = {
  it: {
    nom: 'italien', mots: ['ristorante', 'pizzeria', 'caffe', 'gelato', 'gelateria', 'pasticceria', 'bottega', 'cucina', 'vino', 'panificio', 'sartoria', 'parrucchiere', 'trattoria', 'osteria', 'olio', 'italia', 'pasta'],
    structures: ['Bottega', 'Casa', 'Laboratorio', 'Officina', 'Terra'], natures: ['Sole', 'Luna', 'Vento', 'Fiore', 'Ulivo', 'Ardesia', 'Ambra', 'Cielo', 'Mare', 'Vigna'], adjectifs: ['Buono', 'Sincero', 'Fresco', 'Dolce'],
    duo: (n, a) => `${n} ${a}`, ctx: (s, c) => `${s} di ${c}`, pref: (s, n) => `${s} di ${n}`
  },
  es: {
    nom: 'espagnol', mots: ['restaurante', 'panaderia', 'taller', 'tienda', 'cafeteria', 'peluqueria', 'gimnasio', 'obrador', 'bodega', 'zapateria', 'carniceria', 'pescaderia', 'tapas', 'cerveceria', 'sol'],
    structures: ['Casa', 'Taller', 'Obrador', 'Tienda', 'Rincon'], natures: ['Sol', 'Luna', 'Viento', 'Flor', 'Olivo', 'Pizarra', 'Ambar', 'Cielo', 'Mar', 'Vega'], adjectifs: ['Bueno', 'Sincero', 'Fresco', 'Dulce'],
    duo: (n, a) => `${n} ${a}`, ctx: (s, c) => `${s} de ${c}`, pref: (s, n) => `${s} de ${n}`
  },
  en: {
    nom: 'anglais', mots: ['coffee', 'bakery', 'shop', 'studio', 'kitchen', 'design', 'salon', 'barber', 'gym', 'cafe', 'bistro', 'workshop', 'store', 'tea', 'wine', 'brewery', 'fitness', 'consulting', 'photography', 'web', 'app', 'software'],
    structures: ['House', 'Studio', 'Workshop', 'Atelier', 'Works'], natures: ['Sun', 'Moon', 'Wind', 'Bloom', 'Olive', 'Slate', 'Amber', 'Sky', 'Tide', 'Terra', 'Stone'], adjectifs: ['Honest', 'Fresh', 'Sweet', 'Bright'],
    duo: (n, a) => `${a} ${n}`, ctx: (s, c) => `${s} ${c}`, pref: (s, n) => `${s} ${n}`
  }
};

/** Détecte la langue du contexte (activité, produits, secteur). Renvoie 'it', 'es', 'en' ou null. */
export function detecterLangue(e) {
  const texte = sansAccents(`${e.activite || ''} ${(e.produits || []).join(' ')} ${e.secteur || ''}`);
  const mots = texte.split(/[^a-z]+/).filter(Boolean);
  let meilleure = null;
  let score = 0;
  for (const [code, L] of Object.entries(LANGUES)) {
    const n = L.mots.filter((m) => mots.includes(sansAccents(m))).length;
    if (n > score) { score = n; meilleure = code; }
  }
  return meilleure;
}

const VIDES = ['fabrique', 'fabriquer', 'propose', 'proposer', 'réalise', 'réaliser', 'nous', 'vous', 'faire', 'avec', 'pour', 'dans', 'sont', 'mais', 'aussi', 'chez', 'plus'];
export function contexteNoms(e) {
  const depuisActivite = (e.activite || '').split(/[\s,.;:!?'’()«»-]+/).map((x) => x.toLocaleLowerCase('fr')).filter((x) => x.length >= 5 && !VIDES.includes(x));
  const mots = [...(e.produits || []).map((x) => x.trim()), ...depuisActivite];
  return [...new Set(mots.filter(Boolean).map((m) => capitaliser(m)))].slice(0, 6);
}

export function proposerNoms(secteur, prng, n = 12, { exclure = [], contexte = [], langue = null } = {}) {
  const b = secteur.lexique;
  const lx = {
    structures: [...b.structures, ...STRUCTURES_EXTRA],
    natures: [...b.natures, ...b.natures, ...b.natures, ...NATURES_EXTRA],
    adjectifs: [...b.adjectifs, ...ADJECTIFS_EXTRA],
    racines: b.racines,
    suffixes: b.suffixes
  };
  const vus = new Set(exclure.map((e) => sansAccents(e)));
  const sortie = [];
  const L = langue && LANGUES[langue] ? LANGUES[langue] : null;
  const motifsLangue = L ? [
    () => { const s = prng.choix(L.structures); const x = prng.choix(L.natures); return { nom: L.pref(s, x), motif: `${L.nom} : structure + nature` }; },
    () => { const x = prng.choix(L.natures); const a = prng.choix(L.adjectifs); return { nom: L.duo(x, a), motif: `${L.nom} : nature + qualité` }; },
    () => { const s = prng.choix(L.structures); return { nom: contexte.length ? L.ctx(s, prng.choix(contexte)) : L.pref(s, prng.choix(L.natures)), motif: `${L.nom} : structure + activité` }; }
  ] : [];
  const motifs = [
    ...motifsLangue, ...motifsLangue, ...motifsLangue,
    ...(contexte.length ? Array.from({ length: 4 }, () => [() => { const s = nom(prng.choix(lx.structures)); return { nom: `${s.mot} ${prng.choix(contexte)}`, motif: 'structure + activité' }; }, () => ({ nom: `${prng.choix(contexte)} ${prng.choix(PRENOMS)}`, motif: 'activité + prénom' })]).flat() : []),
    () => { const s = nom(prng.choix(lx.structures)); const x = nom(prng.choix(lx.natures)); return { nom: `${s.mot} ${x.mot}`, motif: 'structure + évocation' }; },
    () => { const s = nom(prng.choix(lx.structures)); const x = nom(prng.choix(lx.natures)); return { nom: `${capitaliser(avecArticle(s))} ${avecDe(x)}`, motif: 'article + structure + de' }; },
    () => { const s = nom(prng.choix(lx.structures)); const a = prng.choix(lx.adjectifs); return { nom: `${s.mot} ${adj(a, s.genre)}`, motif: 'structure + adjectif' }; },
    () => { const x = nom(prng.choix(lx.natures)); const y = nom(prng.choix(lx.natures)); return { nom: x.mot === y.mot ? `${x.mot} & Co` : `${x.mot} & ${y.mot}`, motif: 'deux évocations' }; },
    () => ({ nom: `Chez ${prng.choix(PRENOMS)}`, motif: 'chez + prénom' }),
    () => { const x = nom(prng.choix(lx.natures)); return { nom: `${prng.choix(PRENOMS_EXTRA)} & ${x.mot}`, motif: 'prénom et évocation' }; },
    () => { const r = prng.choix(lx.racines); const f = prng.choix(lx.suffixes); const x = nom(prng.choix(lx.natures)); return { nom: `${capitaliser(r + f)} ${x.mot}`, motif: 'mot inventé + évocation' }; },
    () => { const x = nom(prng.choix(lx.natures)); const a = adj(prng.choix(lx.adjectifs), x.genre); return { nom: `${x.mot} ${a}`, motif: 'évocation + adjectif' }; },
    () => { const s = nom(prng.choix(lx.structures)); return { nom: `${s.mot} ${prng.choix(PRENOMS)}`, motif: 'structure + prénom' }; },
    () => { const r = prng.choix(lx.racines); const f = prng.choix(lx.suffixes); return { nom: capitaliser(r + f), motif: 'mot inventé' }; },
    () => { const x = nom(prng.choix(lx.natures)); return { nom: `${capitaliser(avecArticle(x))} ${prng.choix(LIEUX).toLowerCase() === 'aube' ? '' : ''}`.trim() || x.mot, motif: 'évocation seule' }; },
    () => { const s = nom(prng.choix(lx.structures)); return { nom: `${s.mot} de ${prng.choix(LIEUX)}`.replace(/de ([AEIOUÉ])/, 'd’$1'), motif: 'structure + lieu' }; }
  ];
  for (let essai = 0; essai < n * 30 && sortie.length < n; essai++) {
    const c = prng.choix(motifs)();
    const cle = sansAccents(c.nom);
    if (c.nom.length < 3 || c.nom.length > 32 || vus.has(cle) || verifierNom(c.nom).interdit) continue;
    vus.add(cle);
    sortie.push(c);
  }
  return sortie;
}
