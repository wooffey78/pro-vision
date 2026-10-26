// @ts-check
import { hexVersOklch, oklchVersHex, deltaE, nomCouleur, hexVersRgb, hexVersHsl, hexVersCmjn } from './color.js';
import { ratioContraste, ajusterContraste, meilleurTexteSur } from './contrast.js';

/** Ambiances proposées (écran 4). */
export const AMBIANCES = ['chaleureux', 'rassurant', 'sérieux', 'moderne', 'naturel', 'élégant', 'joyeux', 'artisanal', 'premium', 'minimaliste', 'audacieux', 'doux'];

/** Harmonies disponibles. */
export const HARMONIES = ['monochrome', 'analogue', 'complementaire', 'complementaire-divisee', 'triadique', 'tetradique', 'chaleureuse', 'apaisante'];

/**
 * Table des ambiances : plage de teinte (degrés OKLCH), plage de chroma, harmonies préférées.
 * Les plages qui dépassent 360 sont ramenées modulo 360.
 */
const TABLE_AMBIANCES = {
  chaleureux: { h: [20, 70], c: [0.11, 0.15], harm: ['chaleureuse', 'analogue', 'complementaire'] },
  rassurant: { h: [225, 265], c: [0.09, 0.13], harm: ['apaisante', 'analogue', 'monochrome'] },
  'sérieux': { h: [245, 280], c: [0.07, 0.11], harm: ['monochrome', 'analogue', 'complementaire'] },
  moderne: { h: [190, 260], c: [0.12, 0.16], harm: ['complementaire-divisee', 'triadique', 'analogue'] },
  naturel: { h: [120, 165], c: [0.09, 0.13], harm: ['analogue', 'apaisante', 'chaleureuse'] },
  'élégant': { h: [300, 350], c: [0.06, 0.1], harm: ['monochrome', 'analogue', 'complementaire-divisee'] },
  joyeux: { h: [60, 110], c: [0.13, 0.17], harm: ['triadique', 'complementaire-divisee', 'chaleureuse'] },
  artisanal: { h: [40, 80], c: [0.09, 0.13], harm: ['chaleureuse', 'analogue'] },
  premium: { h: [270, 310], c: [0.07, 0.11], harm: ['monochrome', 'complementaire-divisee'] },
  minimaliste: { h: [230, 270], c: [0.03, 0.06], harm: ['monochrome', 'analogue'] },
  audacieux: { h: [10, 40], c: [0.15, 0.19], harm: ['complementaire', 'triadique', 'tetradique'] },
  doux: { h: [340, 380], c: [0.06, 0.1], harm: ['apaisante', 'analogue', 'monochrome'] }
};

/** Décalages de teinte (secondaire, accent) par harmonie, et plages dédiées. */
const TABLE_HARMONIES = {
  monochrome: { sec: 0, acc: 25 },
  analogue: { sec: 30, acc: -30 },
  complementaire: { sec: 15, acc: 180 },
  'complementaire-divisee': { sec: 150, acc: 210 },
  triadique: { sec: 120, acc: 240 },
  tetradique: { sec: 90, acc: 180 },
  chaleureuse: { sec: 20, acc: 35, h: [15, 75], c: [0.1, 0.16] },
  apaisante: { sec: -20, acc: -45, h: [180, 260], c: [0.05, 0.09] }
};

const mod360 = (h) => ((h % 360) + 360) % 360;
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * @typedef {Object} RolesCouleur
 * @property {string} fond @property {string} surface @property {string} texte @property {string} texteAttenue
 * @property {string} bordure @property {string} principale @property {string} surPrincipale
 * @property {string} secondaire @property {string} accent @property {string} succes @property {string} erreur
 * @property {string} avertissement @property {string[]} neutres
 */

/** Construit le mode clair. @returns {RolesCouleur} */
function modeClair(H, C, Hs, Ha, Cs, Lp = 0.45) {
  const teinte = Math.min(0.012, C * 0.1);
  const fond = oklchVersHex(0.985, teinte, H);
  const surface = oklchVersHex(0.998, teinte * 0.5, H);
  const fonds = [fond, surface];
  const t = ajusterContraste(oklchVersHex(0.25, Math.min(0.03, C * 0.3), H), fonds, 7, 'sombre');
  const texte = t.ok ? t.hex : '#111111';
  const a = ajusterContraste(oklchVersHex(0.48, Math.min(0.03, C * 0.3), H), fonds, 4.5, 'sombre');
  const texteAttenue = a.ok ? a.hex : '#4a4a4a';
  const p = ajusterContraste(oklchVersHex(Lp, C, H), ['#ffffff', fond], 4.5, 'sombre');
  const principale = p.ok ? p.hex : '#173b37';
  const s = ajusterContraste(oklchVersHex(0.5, C * 0.85, Hs), fonds, 3, 'sombre');
  const secondaire = s.ok ? s.hex : '#3b5b7a';
  const ac = ajusterContraste(oklchVersHex(0.62, Math.min(0.18, C * Cs), Ha), fonds, 3, 'sombre');
  const accent = ac.ok ? ac.hex : '#8a5a14';
  const neutres = [0.97, 0.9, 0.7, 0.45, 0.25].map((L) => oklchVersHex(L, Math.min(0.02, C * 0.2), H));
  return {
    fond,
    surface,
    texte,
    texteAttenue,
    bordure: oklchVersHex(0.86, Math.min(0.02, C * 0.2), H),
    principale,
    surPrincipale: '#ffffff',
    secondaire,
    accent,
    succes: ajusterContraste(oklchVersHex(0.5, 0.11, 150), fonds, 4.5, 'sombre').hex,
    erreur: ajusterContraste(oklchVersHex(0.5, 0.17, 27), fonds, 4.5, 'sombre').hex,
    avertissement: ajusterContraste(oklchVersHex(0.52, 0.12, 75), fonds, 4.5, 'sombre').hex,
    neutres
  };
}

/** Construit le mode sombre (mêmes teintes, luminosités recalculées). @returns {RolesCouleur} */
function modeSombre(H, C, Hs, Ha, Cs) {
  const teinte = Math.min(0.015, C * 0.12);
  const fond = oklchVersHex(0.17, teinte, H);
  const surface = oklchVersHex(0.21, teinte, H);
  const fonds = [fond, surface];
  const t = ajusterContraste(oklchVersHex(0.95, Math.min(0.015, C * 0.15), H), fonds, 7, 'clair');
  const a = ajusterContraste(oklchVersHex(0.76, Math.min(0.02, C * 0.2), H), fonds, 4.5, 'clair');
  const p = ajusterContraste(oklchVersHex(0.74, C * 0.95, H), [...fonds], 4.5, 'clair');
  const s = ajusterContraste(oklchVersHex(0.72, C * 0.85, Hs), fonds, 3, 'clair');
  const ac = ajusterContraste(oklchVersHex(0.78, Math.min(0.18, C * Cs), Ha), fonds, 3, 'clair');
  const neutres = [0.2, 0.3, 0.5, 0.75, 0.93].map((L) => oklchVersHex(L, Math.min(0.02, C * 0.2), H));
  return {
    fond,
    surface,
    texte: t.ok ? t.hex : '#f5f5f5',
    texteAttenue: a.ok ? a.hex : '#c8c8c8',
    bordure: oklchVersHex(0.32, Math.min(0.02, C * 0.2), H),
    principale: p.ok ? p.hex : '#9bbcff',
    surPrincipale: fond,
    secondaire: s.ok ? s.hex : '#8fb0d0',
    accent: ac.ok ? ac.hex : '#f0b050',
    succes: ajusterContraste(oklchVersHex(0.74, 0.13, 150), fonds, 4.5, 'clair').hex,
    erreur: ajusterContraste(oklchVersHex(0.72, 0.16, 27), fonds, 4.5, 'clair').hex,
    avertissement: ajusterContraste(oklchVersHex(0.8, 0.13, 80), fonds, 4.5, 'clair').hex,
    neutres
  };
}

/** L'accent est-il bien distinct de l'erreur, du succès et de la couleur principale (dans les deux modes) ? */
function accentDistinct(clair, sombre) {
  return [clair, sombre].every((m) => deltaE(m.accent, m.erreur) >= 0.1 && deltaE(m.accent, m.succes) >= 0.1 && deltaE(m.accent, m.principale) >= 0.1);
}

/** Couleurs de rôle « visibles » comparées aux couleurs à éviter. */
function rolesVisibles(p) {
  return [p.clair.principale, p.clair.secondaire, p.clair.accent, p.sombre.principale, p.sombre.secondaire, p.sombre.accent];
}

/**
 * Génère une palette complète (clair + sombre) avec garanties de contraste.
 * @param {Object} o
 * @param {string[]} [o.ambiances]
 * @param {string[]} [o.couleursAimees] hex
 * @param {string[]} [o.couleursEvitees] hex
 * @param {string} [o.harmonie] une valeur de HARMONIES ; sinon tirée selon les ambiances
 * @param {ReturnType<import('./prng.js').creerPrng>} o.prng
 * @param {number} [o.seuilEvitees] écart OKLab minimal avec une couleur évitée
 * @returns {Object} palette : rôles du mode clair à plat + `sombre`, `harmonie`, `base`
 */
export function genererPalette({ ambiances = [], couleursAimees = [], couleursEvitees = [], harmonie, prng, seuilEvitees = 0.08 }) {
  const amb = ambiances.filter((a) => TABLE_AMBIANCES[a]);
  const premiere = TABLE_AMBIANCES[amb[0]] || { h: [200, 260], c: [0.08, 0.13], harm: HARMONIES };
  // 1. Harmonie
  let nomHarmonie = harmonie && TABLE_HARMONIES[harmonie] ? harmonie : null;
  if (!nomHarmonie) {
    const candidates = amb.length ? [...new Set(amb.flatMap((a) => TABLE_AMBIANCES[a].harm))] : HARMONIES;
    nomHarmonie = prng.choix(candidates);
  }
  const th = TABLE_HARMONIES[nomHarmonie];
  // 2. Teinte et chroma de base
  let H;
  let C;
  const aimee = couleursAimees.find((c) => hexVersOklch(c)[1] >= 0.03) || couleursAimees[0];
  if (aimee) {
    const [, c0, h0] = hexVersOklch(aimee);
    H = h0;
    C = c0 < 0.03 ? Math.max(0.01, c0) : borne(c0, 0.05, 0.17);
  } else {
    const plageH = th.h && !amb.length ? th.h : premiere.h;
    const plageC = th.c && !amb.length ? th.c : premiere.c;
    H = prng.pile(0.35) ? prng.reel(0, 360) : mod360(prng.reel(plageH[0], plageH[1]));
    C = prng.reel(plageC[0], plageC[1]) * (prng.pile(0.3) ? 0.6 : 1);
    if (amb.length > 1) {
      const cs = amb.map((a) => TABLE_AMBIANCES[a].c);
      C = (C + cs.reduce((s, x) => s + (x[0] + x[1]) / 2, 0) / cs.length) / 2;
    }
  }
  const Cs = th.c ? 1.0 : 1.05;
  // Luminosité de la couleur principale : sombre, moyenne ou claire selon la graine.
  let Lp = aimee ? 0.45 : prng.reel(0.4, 0.6);
  // 3. Construction avec contrôle « accent distinct » et « couleurs évitées »
  let resultat = null;
  for (let essai = 0; essai < 12 && !resultat; essai++) {
    const Hb = mod360(H + essai * 30);
    let Ha = mod360(Hb + th.acc);
    let clair = modeClair(Hb, C, mod360(Hb + th.sec), Ha, Cs, Lp);
    let sombre = modeSombre(Hb, C, mod360(Hb + th.sec), Ha, Cs);
    for (let k = 0; k < 9 && !accentDistinct(clair, sombre); k++) {
      Ha = mod360(Ha + 40);
      clair = modeClair(Hb, C, mod360(Hb + th.sec), Ha, Cs, Lp);
      sombre = modeSombre(Hb, C, mod360(Hb + th.sec), Ha, Cs);
    }
    const p = { harmonie: nomHarmonie, base: { h: Math.round(Hb), c: +C.toFixed(3) }, clair, sombre };
    const loin = rolesVisibles(p).every((c) => couleursEvitees.every((e) => deltaE(c, e) >= seuilEvitees));
    if (loin || !couleursEvitees.length) resultat = p;
    else if (essai === 11) resultat = p; // dernier recours : on garde la dernière tentative
  }
  const { clair, sombre, base } = /** @type {any} */ (resultat);
  // La couleur secondaire ne doit jamais se confondre avec la principale.
  if (deltaE(clair.secondaire, clair.principale) < 0.03) {
    clair.secondaire = ajusterContraste(oklchVersHex(0.5, Math.max(0.05, base.c * 0.85), mod360(base.h + 70)), [clair.fond, clair.surface], 3, 'sombre').hex;
  }
  const dejaPris = [clair.principale, clair.secondaire, clair.accent, clair.fond, clair.surface, clair.texte, clair.texteAttenue, clair.bordure, clair.succes, clair.erreur, clair.avertissement, sombre.principale, sombre.fond];
  const etendue = [];
  for (let k = 0; k < 8; k++) {
    const h = mod360(base.h + k * 47);
    let l = [0.42, 0.62, 0.78, 0.5, 0.36, 0.7, 0.85, 0.56][k];
    const c = Math.max(0.03, base.c * [1, 0.8, 0.55, 1.1, 0.9, 0.6, 0.4, 0.75][k]);
    const conflit = (x) => [...dejaPris, ...etendue].some((y) => deltaE(x, y) < 0.03);
    let hex = oklchVersHex(l, c, h);
    // Aucun doublon : on éloigne d'abord la clarté, puis la teinte, jusqu'à une couleur distincte.
    for (let essai = 0; essai < 12 && conflit(hex); essai++) {
      l = Math.min(0.95, Math.max(0.2, l + (essai % 2 ? -0.05 : 0.05)));
      hex = oklchVersHex(l, c, h);
    }
    // Dernier recours : combinaison de teinte, de clarté et de saturation jusqu'à une couleur distincte.
    recherche: for (const dc of [0, 0.03, -0.03, 0.06]) for (const dl of [0, 0.05, -0.05, 0.1, -0.1]) for (const dh of [0, 9, -9, 18, -18, 27, -27]) {
      if (!conflit(hex)) break recherche;
      hex = oklchVersHex(Math.min(0.95, Math.max(0.2, l + dl)), Math.max(0.02, c + dc), mod360(h + dh));
    }
    etendue.push(hex);
  }
  return { harmonie: nomHarmonie, base, ...clair, sombre, etendue };
}

/**
 * Contrôles de contraste d'une palette (utilisés par l'écran de validation et les tests).
 * @param {any} palette
 * @returns {{ id: string, mode: string, libelle: string, ratio: number, min: number, ok: boolean }[]}
 */
export function verifierPalette(palette) {
  const sortie = [];
  const jeu = (mode, m) => {
    const c = (id, libelle, a, b, min) => {
      const ratio = ratioContraste(a, b);
      sortie.push({ id: `${mode}.${id}`, mode, libelle, ratio: +ratio.toFixed(2), min, ok: ratio >= min });
    };
    c('texte-fond', 'Texte sur fond', m.texte, m.fond, 7);
    c('texte-surface', 'Texte sur surface', m.texte, m.surface, 7);
    c('attenue-fond', 'Texte atténué sur fond', m.texteAttenue, m.fond, 4.5);
    c('principale-fond', 'Couleur principale sur fond', m.principale, m.fond, 3);
    c('sur-principale', 'Texte sur la couleur principale', m.surPrincipale, m.principale, 4.5);
    c('secondaire-fond', 'Couleur secondaire sur fond', m.secondaire, m.fond, 3);
    c('accent-fond', "Couleur d'accent sur fond", m.accent, m.fond, 3);
    c('erreur-fond', 'Erreur sur fond', m.erreur, m.fond, 4.5);
    c('succes-fond', 'Succès sur fond', m.succes, m.fond, 4.5);
  };
  jeu('clair', palette);
  jeu('sombre', palette.sombre);
  return sortie;
}

/** Libellés français des rôles. */
export const LIBELLES_ROLES = {
  principale: 'Principale', secondaire: 'Secondaire', accent: 'Accent', fond: 'Fond', surface: 'Surface',
  texte: 'Texte', texteAttenue: 'Texte atténué', bordure: 'Bordure', succes: 'Succès', erreur: 'Erreur', avertissement: 'Avertissement'
};

/**
 * Description textuelle d'une palette (alternative textuelle accessible).
 * @param {any} p
 * @returns {string}
 */
export function descriptionPalette(p) {
  return ['principale', 'secondaire', 'accent', 'fond', 'texte']
    .map((r) => `${LIBELLES_ROLES[r].toLowerCase()} : ${nomCouleur(p[r]).toLowerCase()} ${p[r]}`)
    .join(' ; ');
}

/**
 * Formats de sortie d'une couleur : HEX, RGB, HSL, OKLCH, CMJN indicatif.
 * @param {string} hex
 */
export function formatsCouleur(hex) {
  const [L, C, H] = hexVersOklch(hex);
  const [r, g, b] = hexVersRgb(hex);
  const [h, s, l] = hexVersHsl(hex);
  const [c, m, y, k] = hexVersCmjn(hex);
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    oklch: `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`,
    cmjn: `${c}/${m}/${y}/${k} (indicatif : demandez un profil à votre imprimeur)`,
    nom: nomCouleur(hex)
  };
}

const KEBAB = { texteAttenue: 'texte-attenue', surPrincipale: 'sur-principale' };
const kebab = (k) => KEBAB[k] || k;
const ROLES_CSS = ['fond', 'surface', 'texte', 'texteAttenue', 'bordure', 'principale', 'surPrincipale', 'secondaire', 'accent', 'succes', 'erreur', 'avertissement'];

/**
 * Variables CSS du kit (thème clair + sombre via prefers-color-scheme).
 * @param {any} p
 * @returns {string}
 */
export function variablesCss(p) {
  const bloc = (m, indent) => ROLES_CSS.map((r) => `${indent}--couleur-${kebab(r)}: ${m[r]};`).join('\n');
  return `:root {\n${bloc(p, '  ')}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${bloc(p.sombre, '    ')}\n  }\n}\n`;
}

/**
 * Tokens JSON (format proche du Design Tokens Community Group).
 * @param {any} p
 */
export function tokensJson(p) {
  const jeu = (m) => Object.fromEntries(ROLES_CSS.map((r) => [kebab(r), { $value: m[r], $type: 'color' }]));
  return { couleur: { clair: jeu(p), sombre: jeu(p.sombre) } };
}

export { meilleurTexteSur };
