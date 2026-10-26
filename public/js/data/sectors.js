// @ts-check
import { jetons } from './keywords.js';

/** Secteur « autre » utilisé quand rien ne correspond. */
export const SECTEUR_AUTRE = {
  id: 'autre', libelle: 'Autre activité', motsCles: [], symboles: ['sparkles', 'shapes', 'badge-check', 'lightbulb'], ambiances: ['moderne', 'rassurant'],
  produits: [], couleurs: ['Bleu', 'Vert'],
  lexique: { structures: ['Atelier|m', 'Maison|f', 'Studio|m'], natures: ['Aube|f', 'Cap|m', 'Source|f', 'Horizon|m', 'Trèfle|m', 'Repère|m'], adjectifs: ['Clair|Claire', 'Juste|Juste'], racines: ['nov', 'cap', 'lum'], suffixes: ['a', 'ia', 'eo'] },
  slogans: ['pensé avec soin', 'simple et bien fait', 'à vos côtés']
};

/** @param {any} cfg configuration sectors.json @param {string} id */
export function secteurParId(cfg, id) {
  return cfg.secteurs.find((s) => s.id === id) || SECTEUR_AUTRE;
}

/**
 * Classe les secteurs selon un texte libre (activité, produits).
 * @param {any} cfg @param {string} texte
 * @returns {{ secteur: any, score: number }[]}
 */
export function classerSecteurs(cfg, texte) {
  const t = new Set(jetons(texte));
  return cfg.secteurs
    .map((secteur) => ({ secteur, score: secteur.motsCles.reduce((s, m) => s + jetons(m).filter((j) => t.has(j)).length, 0) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Secteur retenu : celui choisi par la personne, sinon détecté, sinon « autre ».
 * @param {any} cfg @param {{ secteur?: string, activite?: string, produits?: string[] }} e
 */
export function resoudreSecteur(cfg, e) {
  if (e.secteur && e.secteur !== 'auto') return secteurParId(cfg, e.secteur);
  const [premier] = classerSecteurs(cfg, `${e.activite || ''} ${(e.produits || []).join(' ')}`);
  return premier && premier.score > 0 ? premier.secteur : SECTEUR_AUTRE;
}
