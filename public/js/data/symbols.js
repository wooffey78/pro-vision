// @ts-check
import { jetons } from './keywords.js';

/** Mot-clé (sans accents, singulier) → symbole Lucide. Les secteurs fournissent aussi leurs symboles. */
export const MOTS_VERS_SYMBOLE = {
  bougie: 'flame', cire: 'flame', feu: 'flame', cafe: 'coffee', the: 'coffee', pain: 'wheat', boulangerie: 'wheat', gateau: 'cake', patisserie: 'cake', croissant: 'croissant',
  cuisine: 'chef-hat', restaurant: 'utensils', traiteur: 'utensils', plombier: 'wrench', plomberie: 'droplets', eau: 'droplets', electricien: 'zap', electricite: 'zap', chauffage: 'thermometer',
  maison: 'house', renovation: 'hammer', peinture: 'paint-roller', maconnerie: 'brick-wall', fleur: 'flower-2', fleuriste: 'flower', jardin: 'trees', plante: 'sprout', arbre: 'trees',
  coiffure: 'scissors', beaute: 'sparkle', massage: 'hand-heart', yoga: 'leaf', sport: 'dumbbell', velo: 'bike', formation: 'graduation-cap', conseil: 'briefcase', web: 'globe',
  informatique: 'laptop', code: 'code', photo: 'camera', video: 'video', film: 'film', vetement: 'shirt', bijou: 'gem', sac: 'handbag', cadeau: 'package', epicerie: 'shopping-basket',
  smartphone: 'smartphone', ecran: 'smartphone', vin: 'wine', biere: 'beer', musique: 'music', livre: 'book-open', enfant: 'baby', animal: 'paw-print'
};

/** Ensemble complet des symboles utilisables (pour le vendoring et la validation du schéma). */
export function tousLesSymboles(cfgSecteurs) {
  const s = new Set(Object.values(MOTS_VERS_SYMBOLE));
  for (const sec of cfgSecteurs.secteurs) for (const id of sec.symboles) s.add(id);
  for (const id of ['sparkles', 'shapes', 'badge-check', 'lightbulb']) s.add(id);
  for (const id of SYMBOLES_GENERAUX) s.add(id);
  return [...s].sort();
}

/**
 * Symboles pertinents pour un texte, avec leur poids.
 * @param {string} texte @returns {Record<string, number>}
 */
export function symbolesDuTexte(texte) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const j of jetons(texte)) {
    const id = MOTS_VERS_SYMBOLE[j];
    if (id) out[id] = (out[id] || 0) + 1;
  }
  return out;
}

/** Répertoire général (138 symboles Lucide) : tiré au sort pour élargir les propositions. */
export const SYMBOLES_GENERAUX = ['sun', 'moon', 'star', 'heart', 'cloud', 'leaf', 'tree-pine', 'flower', 'mountain', 'waves', 'sparkle', 'sparkles', 'gem', 'crown', 'key', 'feather', 'anchor', 'compass', 'rocket', 'plane', 'ship', 'bird', 'fish', 'rabbit', 'cat', 'dog', 'turtle', 'snail', 'bug', 'shell', 'apple', 'cherry', 'grape', 'citrus', 'carrot', 'egg', 'beef', 'fish-symbol', 'coffee', 'cup-soda', 'wine', 'beer', 'martini', 'ice-cream-cone', 'candy', 'cake', 'cookie', 'pizza', 'sandwich', 'soup', 'salad', 'utensils', 'chef-hat', 'hand-heart', 'handshake', 'smile', 'award', 'trophy', 'medal', 'target', 'crosshair', 'map-pin', 'route', 'footprints', 'telescope', 'microscope', 'atom', 'flask-conical', 'test-tube', 'dna', 'brain', 'palette', 'paintbrush', 'pen', 'pencil', 'ruler', 'triangle', 'circle', 'square', 'hexagon', 'diamond', 'pentagon', 'shapes', 'infinity', 'orbit', 'zap', 'bolt', 'flame', 'sprout', 'wheat', 'umbrella', 'tent', 'home', 'building-2', 'landmark', 'church', 'castle', 'tower-control', 'lamp', 'lightbulb', 'bell', 'music', 'guitar', 'mic', 'headphones', 'camera', 'film', 'book-open', 'notebook', 'globe', 'earth', 'sailboat', 'bike', 'car', 'train', 'truck', 'flower-2', 'glasses', 'shirt', 'dumbbell', 'swords', 'shield-check', 'badge-check', 'puzzle', 'layers', 'box', 'package', 'gift', 'rainbow', 'snowflake', 'sunrise', 'sunset', 'thermometer', 'droplet', 'waves-ladder'];
