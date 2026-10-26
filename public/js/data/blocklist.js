// @ts-check
import { jetons, sansAccents } from './keywords.js';

/** Marques très connues à ne pas imiter, et mots à ne jamais proposer comme nom. */
const MARQUES = ['apple', 'google', 'nike', 'adidas', 'cocacola', 'coca', 'pepsi', 'mcdonald', 'disney', 'amazon', 'facebook', 'instagram', 'tesla', 'samsung', 'sony', 'nintendo', 'ikea', 'renault', 'peugeot', 'citroen', 'danone', 'lego', 'starbucks', 'zara', 'chanel', 'dior', 'gucci', 'prada', 'hermes', 'cartier', 'microsoft', 'netflix', 'spotify', 'uber', 'airbnb', 'tiktok', 'whatsapp', 'youtube', 'orange', 'carrefour', 'leclerc', 'auchan', 'decathlon', 'lidl', 'nestle', 'ferrari', 'porsche', 'toyota', 'honda', 'bmw', 'audi', 'volkswagen', 'lacoste', 'puma', 'canon', 'nikon', 'intel', 'nvidia', 'paypal', 'visa', 'mastercard'];
const GROSSIERS = ['merde', 'putain', 'connard', 'salope', 'encule', 'nique', 'bite', 'pute', 'foutre', 'nazi', 'hitler'];

/**
 * Le nom est-il à éviter ? (marque connue ou grossièreté)
 * @param {string} nom
 * @returns {{ interdit: boolean, raison?: string }}
 */
export function verifierNom(nom) {
  const compact = sansAccents(nom).replace(/[^a-z0-9]/g, '');
  const mots = jetons(nom);
  for (const m of MARQUES) if (mots.includes(m) || (m.length >= 5 && compact.includes(m))) return { interdit: true, raison: 'ressemble à une marque très connue' };
  for (const m of GROSSIERS) if (compact.includes(m)) return { interdit: true, raison: 'contient un mot inapproprié' };
  return { interdit: false };
}
