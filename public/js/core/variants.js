// @ts-check
import { composerLogo } from './layouts.js';

/** Noms des 8 variantes livrées. */
export const NOMS_VARIANTES = ['principal', 'horizontal', 'vertical', 'icone', 'mono-noir', 'mono-blanc', 'fond-sombre', 'favicon'];

/**
 * Génère les 8 variantes du logo.
 * @param {Object} projet projet complet (entreprise, identite)
 * @param {{ polices: any, symboles?: Record<string,string> }} ressources
 * @param {{ protection?: boolean }} [o]
 * @returns {Record<string, { svg: string, largeur: number, hauteur: number, description: string, avertissements: string[] }>}
 */
export function genererVariantes(projet, ressources, { protection = true } = {}) {
  const base = { entreprise: projet.entreprise, logo: projet.identite.logo, palette: projet.identite.palette, polices: ressources.polices, symboles: ressources.symboles || {}, protection };
  const sansMention = { ...projet.entreprise };
  const v = {};
  v.principal = composerLogo({ ...base });
  v.horizontal = composerLogo({ ...base, disposition: 'symbole-gauche' });
  v.vertical = composerLogo({ ...base, disposition: 'symbole-dessus' });
  v.icone = composerLogo({ ...base, portee: 'icone' });
  v['mono-noir'] = composerLogo({ ...base, mode: 'noir' });
  v['mono-blanc'] = composerLogo({ ...base, mode: 'blanc' });
  v['fond-sombre'] = composerLogo({ ...base, mode: 'sombre', fond: true });
  v.favicon = composerLogo({ ...base, entreprise: sansMention, portee: 'icone', protection: false, contenantForce: base.logo.contenant === 'aucun' ? 'carre-arrondi' : base.logo.contenant, epaisseurMin: 3 });
  return v;
}
