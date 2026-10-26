// @ts-check
/**
 * Formes géométriques et abstraites, composées selon des règles de graphisme :
 * contraste de formes, répétition et rythme, asymétrie, espace négatif, grille modulaire,
 * équilibre (nombre d'or), superposition (union), découpe (trou).
 * Chaque famille : params(prng) → paramètres ; build(p) → commandes de chemin.
 * Convention : les formes pleines sont orientées dans le sens positif, les trous dans le sens
 * négatif, pour que la règle « nonzero » donne union et découpe corrects.
 */

const R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
const pt = (cx, cy, r, a) => [cx + r * Math.cos(a * R), cy + r * Math.sin(a * R)];

/** Arc (Bézier cubiques) de a0 à a1 en degrés (sens selon le signe de a1 - a0). */
function arcs(cx, cy, r, a0, a1) {
  const out = [];
  const tot = a1 - a0;
  const n = Math.max(1, Math.ceil(Math.abs(tot) / 90));
  const pas = tot / n;
  for (let i = 0; i < n; i++) {
    const s = (a0 + i * pas) * R;
    const e = (a0 + (i + 1) * pas) * R;
    const k = (4 / 3) * Math.tan((e - s) / 4);
    out.push(['C', cx + r * (Math.cos(s) - k * Math.sin(s)), cy + r * (Math.sin(s) + k * Math.cos(s)), cx + r * (Math.cos(e) + k * Math.sin(e)), cy + r * (Math.sin(e) - k * Math.cos(e)), cx + r * Math.cos(e), cy + r * Math.sin(e)]);
  }
  return out;
}

/** Aire signée (formule du lacet). */
function aire(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return s;
}

/** Polygone fermé, orienté : positif pour une forme pleine, négatif pour un trou. */
function poly(pts, trou = false) {
  const p = (aire(pts) < 0) !== trou ? [...pts].reverse() : pts;
  return [['M', p[0][0], p[0][1]], ...p.slice(1).map((q) => ['L', q[0], q[1]]), ['Z']];
}

/** Cercle complet ; trou = sens négatif. */
const cerc = (cx, cy, r, trou = false) => [['M', ...pt(cx, cy, r, 0)], ...arcs(cx, cy, r, 0, trou ? -360 : 360), ['Z']];

/** Applique f(x, y) → [x, y] à tous les points d'un chemin. */
function transformer(cmds, f) {
  return cmds.map((c) => {
    if (c[0] === 'Z') return c;
    const o = [c[0]];
    for (let i = 1; i < c.length; i += 2) {
      const [x, y] = f(c[i], c[i + 1]);
      o.push(x, y);
    }
    return o;
  });
}

/** Rotation autour du centre (50, 50). */
const rot = (cmds, deg, cx = 50, cy = 50) => {
  const c = Math.cos(deg * R);
  const s = Math.sin(deg * R);
  return transformer(cmds, (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

/** Polygone régulier de n côtés, rayon r, rotation a0. */
const reg = (n, r, a0 = 0, cx = 50, cy = 50) => Array.from({ length: n }, (_, i) => pt(cx, cy, r, a0 + (360 / n) * i - 90));

const bits = (m, n) => Array.from({ length: n }, (_, k) => ((m >> k) & 1) === 1);

/** Définitions : famille → { params, build }. v(nom, défaut) lit un paramètre numérique. */
export const FORMES = {
  'cercle-segment': {
    params: (r) => ({ d: r.reel(-30, -5), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const d = clamp(v('d', -18), -32, -4);
      const s = Math.sqrt(44 * 44 - d * d);
      return rot([['M', 50 + s, 50 + d], ...arcs(50, 50, 44, Math.atan2(d, s) / R, Math.atan2(d, -s) / R), ['Z']], v('rot', 0));
    }
  },
  'cercle-bande': {
    params: (r) => ({ d1: r.reel(-14, -5), d2: r.reel(5, 14), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const d1 = clamp(v('d1', -8), -16, -4);
      const d2 = clamp(v('d2', 8), 4, 16);
      const s1 = Math.sqrt(44 * 44 - d1 * d1);
      const s2 = Math.sqrt(44 * 44 - d2 * d2);
      const haut = [['M', 50 + s1, 50 + d1], ...arcs(50, 50, 44, Math.atan2(d1, s1) / R, Math.atan2(d1, -s1) / R), ['Z']];
      const bas = [['M', 50 + s2, 50 + d2], ...arcs(50, 50, 44, Math.atan2(d2, s2) / R, Math.atan2(d2, -s2) / R), ['Z']];
      return rot([...haut, ...bas], v('rot', 0));
    }
  },
  'carre-arrondi': {
    params: (r) => ({ rayon: r.reel(8, 30), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const k = clamp(v('rayon', 16), 4, 40);
      return rot([['M', 6 + k, 6], ['L', 94 - k, 6], ...arcs(94 - k, 6 + k, k, -90, 0), ['L', 94, 94 - k], ...arcs(94 - k, 94 - k, k, 0, 90), ['L', 6 + k, 94], ...arcs(6 + k, 94 - k, k, 90, 180), ['L', 6, 6 + k], ...arcs(6 + k, 6 + k, k, 180, 270), ['Z']], v('rot', 0));
    }
  },
  triangle: { params: (r) => ({ rot: r.entier(0, 11) * 30 }), build: (v) => rot(poly([[50, 8], [92, 86], [8, 86]]), v('rot', 0)) },
  'triangle-droit': { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot(poly([[8, 8], [92, 8], [8, 92]]), v('rot', 0)) },
  'demi-disque': { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot([['M', 6, 70], ...arcs(50, 70, 44, 180, 360), ['Z']], v('rot', 0)) },
  anneau: { params: (r) => ({ ep: r.reel(0.18, 0.4) }), build: (v) => [...cerc(50, 50, 44), ...cerc(50, 50, 44 * (1 - clamp(v('ep', 0.3), 0.15, 0.5)), true)] },
  'carre-troue': {
    params: (r) => ({ ep: r.reel(0.25, 0.45), rot: r.entier(0, 3) * 45 }),
    build: (v) => {
      const h = 42 * (1 - clamp(v('ep', 0.35), 0.2, 0.5));
      return rot([...poly([[8, 8], [92, 8], [92, 92], [8, 92]]), ...poly([[50 - h, 50 - h], [50 + h, 50 - h], [50 + h, 50 + h], [50 - h, 50 + h]], true)], v('rot', 0));
    }
  },
  'losange-double': { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot([...poly([[50, 6], [70, 26], [50, 46], [30, 26]]), ...poly([[50, 54], [70, 74], [50, 94], [30, 74]])], v('rot', 0)) },
  hexagone: { params: (r) => ({ rot: r.entier(0, 5) * 30 }), build: (v) => poly(reg(6, 44, v('rot', 0))) },
  octogone: { params: (r) => ({ rot: r.entier(0, 3) * 22.5 }), build: (v) => poly(reg(8, 44, v('rot', 0))) },
  pentagone: { params: (r) => ({ rot: r.entier(0, 4) * 18 }), build: (v) => poly(reg(5, 44, v('rot', 0))) },
  'etoile-six': { params: (r) => ({ rot: r.entier(0, 3) * 15 }), build: (v) => rot([...poly(reg(3, 44, 0)), ...poly(reg(3, 44, 60))], v('rot', 0)) },
  chevrons: { params: () => ({}), build: () => [...poly([[12, 18], [50, 38], [88, 18], [88, 34], [50, 54], [12, 34]]), ...poly([[12, 50], [50, 70], [88, 50], [88, 66], [50, 86], [12, 66]])] },
  trapeze: { params: (r) => ({ inv: r.pile(0.5) ? 1 : 0 }), build: (v) => (v('inv', 0) ? poly([[6, 20], [94, 20], [80, 80], [20, 80]]) : poly([[20, 20], [80, 20], [94, 80], [6, 80]])) },
  parallelogramme: { params: (r) => ({ rot: r.entier(0, 1) * 90 }), build: (v) => rot(poly([[24, 18], [94, 18], [76, 82], [6, 82]]), v('rot', 0)) },
  'arcs-concentriques': {
    params: (r) => ({ n: r.entier(2, 3), ep: r.reel(6, 9) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 3), 2, 3));
      const ep = clamp(v('ep', 8), 5, 10);
      const out = [];
      for (let k = 0; k < n; k++) {
        const R0 = 46 - k * (40 / n);
        const r0 = R0 - ep;
        out.push(['M', 50 - R0, 74], ...arcs(50, 74, R0, 180, 360), ['L', 50 + r0, 74], ...arcs(50, 74, r0, 360, 180), ['Z']);
      }
      return out;
    }
  },
  'demi-lune': {
    params: (r) => ({ off: r.reel(8, 12), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const o = clamp(v('off', 10), 8, 12);
      return rot([...cerc(50, 50, 44), ...cerc(50 + o, 50, 44 - o, true)], v('rot', 0));
    }
  },
  secteurs: {
    params: (r) => ({ n: r.entier(4, 6), masque: r.entier(3, 63), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 4), 3, 6));
      const m = Math.round(clamp(v('masque', 5), 1, 63));
      const out = [];
      for (let k = 0; k < n; k++) {
        if (!((m >> k) & 1)) continue;
        const a0 = (360 / n) * k + 3;
        const a1 = (360 / n) * (k + 1) - 3;
        out.push(['M', 50, 50], ['L', ...pt(50, 50, 44, a0)], ...arcs(50, 50, 44, a0, a1), ['Z']);
      }
      return out.length ? rot(out, v('rot', 0)) : poly([[50, 6], [94, 50], [50, 94]]);
    }
  },
  bandes: {
    params: (r) => ({ n: r.entier(3, 5), raison: r.reel(0.6, 0.9) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 4), 3, 5));
      const q = clamp(v('raison', 0.75), 0.5, 0.95);
      const hs = Array.from({ length: n }, (_, i) => Math.pow(q, i));
      const somme = hs.reduce((a, b) => a + b, 0);
      const libre = 88 - (n - 1) * 4;
      let y = 6;
      const out = [];
      hs.forEach((h) => {
        const hh = (h / somme) * libre;
        out.push(...poly([[6, y], [94, y], [94, y + hh], [6, y + hh]]));
        y += hh + 4;
      });
      return out;
    }
  },
  'cercle-triangle': { params: (r) => ({ rot: r.entier(0, 2) * 60 }), build: (v) => [...cerc(50, 50, 44), ...poly(reg(3, 30, v('rot', 0) - 90), true)] },
  'carre-diagonal': {
    params: (r) => ({ off: r.reel(0, 6), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const o = clamp(v('off', 3), 0, 6);
      return rot([...poly([[8, 8], [92, 8], [8, 92]]), ...poly([[92 + o, 92 + o], [8 + o, 92 + o], [92 + o, 8 + o]])], v('rot', 0));
    }
  },
  mondrian: {
    params: (r) => ({ sx: r.reel(0.3, 0.7), sy: r.reel(0.3, 0.7), masque: r.entier(3, 15) }),
    build: (v) => {
      const xs = [6, 6 + 88 * clamp(v('sx', 0.5), 0.25, 0.75), 94];
      const ys = [6, 6 + 88 * clamp(v('sy', 0.5), 0.25, 0.75), 94];
      const m = Math.round(clamp(v('masque', 9), 1, 15));
      const cells = [[0, 0], [1, 0], [0, 1], [1, 1]];
      const out = [];
      cells.forEach(([i, j], k) => {
        if (!((m >> k) & 1)) return;
        const g = 2.5;
        out.push(...poly([[xs[i] + g, ys[j] + g], [xs[i + 1] - g, ys[j] + g], [xs[i + 1] - g, ys[j + 1] - g], [xs[i] + g, ys[j + 1] - g]]));
      });
      return out.length ? out : poly([[6, 6], [94, 6], [94, 94], [6, 94]]);
    }
  },
  bauhaus: { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot([...cerc(34, 34, 26), ...poly([[50, 50], [92, 50], [92, 92], [50, 92]]), ...poly([[6, 92], [50, 92], [6, 50]])], v('rot', 0)) },
  'or-spirale': {
    params: () => ({}),
    build: () => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const b = Math.log(phi) / (Math.PI / 2);
      const N = 40;
      const ext = [];
      const int = [];
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * 3 * Math.PI;
        const r = 2 * Math.exp(b * th);
        const w = 0.04 * r + 1.2;
        ext.push(pt(50, 50, r + w, th / R));
        int.push(pt(50, 50, Math.max(0.5, r - w), th / R));
      }
      return poly([...ext, ...int.reverse()]);
    }
  },
  'rythme-cercles': {
    params: (r) => ({ n: r.entier(3, 4) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 3), 2, 4));
      const out = [];
      let ext = 44;
      for (let k = 0; k < n; k++) {
        const t = 8 - 1.4 * k;
        out.push(...cerc(50, 50, ext), ...cerc(50, 50, ext - t, true));
        ext -= t + 3 + k;
      }
      return out;
    }
  },
  'rythme-barres': {
    params: (r) => ({ n: r.entier(4, 5), raison: r.reel(0.55, 0.8) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 4), 3, 5));
      const q = clamp(v('raison', 0.7), 0.5, 0.9);
      const w = (88 - (n - 1) * 4) / n;
      const out = [];
      for (let i = 0; i < n; i++) {
        const h = 80 * Math.pow(q, i);
        const x = 6 + i * (w + 4);
        out.push(...poly([[x, 94 - h], [x + w, 94 - h], [x + w, 94], [x, 94]]));
      }
      return out;
    }
  },
  negatif: {
    params: (r) => ({ g: r.reel(4, 10) }),
    build: (v) => {
      const g = clamp(v('g', 6), 3, 12);
      return [['M', 50 - g, 6], ...arcs(50 - g, 50, 44, -90, -270), ['Z'], ['M', 50 + g, 6], ...arcs(50 + g, 50, 44, -90, 90), ['Z']];
    }
  },
  entrelacs: { params: (r) => ({ rot: r.entier(0, 2) * 60 }), build: (v) => rot([...cerc(50, 30, 24), ...cerc(50, 30, 18, true), ...cerc(32, 62, 24), ...cerc(32, 62, 18, true), ...cerc(68, 62, 24), ...cerc(68, 62, 18, true)], v('rot', 0)) },
  truchet: {
    params: (r) => ({ masque: r.entier(1, 511) }),
    build: (v) => {
      const m = Math.round(clamp(v('masque', 170), 1, 511));
      const s = 88 / 3;
      const out = [];
      for (let k = 0; k < 9; k++) {
        const x0 = 6 + (k % 3) * s;
        const y0 = 6 + Math.floor(k / 3) * s;
        if ((m >> k) & 1) out.push(['M', x0, y0], ['L', x0 + s, y0], ...arcs(x0, y0, s, 0, 90), ['Z']);
        else out.push(['M', x0 + s, y0], ['L', x0, y0], ...arcs(x0 + s, y0, s, 180, 90), ['Z']);
      }
      return out;
    }
  },
  zigzag: {
    params: (r) => ({ amp: r.reel(14, 24), w: r.reel(6, 9) }),
    build: (v) => {
      const amp = clamp(v('amp', 18), 10, 28);
      const w = clamp(v('w', 7), 4, 10);
      const N = 4;
      const haut = [];
      const bas = [];
      for (let i = 0; i <= N; i++) {
        const x = 6 + (88 * i) / N;
        const y = 50 + (i % 2 ? -amp : amp);
        haut.push([x, y - w]);
        bas.push([x, y + w]);
      }
      return poly([...haut, ...bas.reverse()]);
    }
  },
  asymetrie: { params: () => ({}), build: () => [...cerc(60, 62, 30), ...poly([[8, 8], [30, 8], [30, 30], [8, 30]])] },
  'eclat-rayons': {
    params: (r) => ({ n: r.entier(8, 12) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 10), 6, 14));
      const d = 180 / n * 0.55;
      const out = [];
      for (let k = 0; k < n; k++) {
        const a = (360 / n) * k;
        const R2 = k % 2 ? 30 : 44;
        out.push(...poly([[50, 50], pt(50, 50, R2, a - d), pt(50, 50, R2, a + d)]));
      }
      return out;
    }
  },
  ondulation: {
    params: () => ({}),
    build: () => {
      const out = [];
      [[24, 30], [46, 30], [68, 30], [84, 30], [13, 60], [35, 60], [57, 60], [79, 60]].forEach(([x, y]) => out.push(['M', x - 12, y], ...arcs(x, y, 12, 180, 360), ['Z']));
      return out;
    }
  },
  pli: { params: (r) => ({ coin: r.reel(20, 34) }), build: (v) => { const c = clamp(v('coin', 26), 14, 40); return poly([[10, 6], [94 - c, 6], [94, 6 + c], [94, 94], [10, 94]]); } },
  'cadre-decale': { params: () => ({}), build: () => [...poly([[10, 10], [70, 10], [70, 70], [10, 70]]), ...poly([[18, 18], [62, 18], [62, 62], [18, 62]], true), ...poly([[30, 30], [90, 30], [90, 90], [30, 90]]), ...poly([[38, 38], [82, 38], [82, 82], [38, 82]], true)] },
  cascade: { params: (r) => ({ ecart: r.reel(1, 4) }), build: (v) => { const e = clamp(v('ecart', 2), 0, 6); const out = []; for (let k = 0; k < 4; k++) { const x = 6 + k * (20 + e); const h = (k + 1) * 20 + 8; out.push(...poly([[x, 94 - h], [x + 20, 94 - h], [x + 20, 94], [x, 94]])); } return out; } },
  'traits-brises': { params: (r) => ({ d: r.reel(-4, 4) }), build: (v) => { const d = clamp(v('d', 0), -6, 6); const out = []; [[[6, 56], [64, 94]], [[6, 30], [38, 94]], [[6, 70], [78, 94]]].forEach((row, i) => row.forEach(([a, b]) => { const y = [20, 45, 70][i] + d * (i - 1) * 0.3; out.push(...poly([[a, y], [b, y], [b, y + 10], [a, y + 10]])); })); return out; } },
  'matrice-points': { params: (r) => ({ masque: r.entier(3, 511) }), build: (v) => { const m = Math.round(clamp(v('masque', 341), 1, 511)); const out = []; for (let k = 0; k < 9; k++) if ((m >> k) & 1) out.push(...cerc(20 + (k % 3) * 30, 20 + Math.floor(k / 3) * 30, 9)); return out.length ? out : cerc(50, 50, 9); } },
  triptyque: { params: () => ({}), build: () => [...cerc(22, 50, 16), ...poly([[40, 34], [60, 34], [60, 66], [40, 66]]), ...poly([[68, 80], [92, 80], [80, 20]])] },
  'arc-arcs': {
    params: (r) => ({ n: r.entier(2, 3) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 3), 2, 4));
      const out = [];
      for (let k = 0; k < n; k++) {
        const Rk = 30 + k * (44 / n);
        const rk = Rk - 9;
        out.push(['M', ...pt(50, 88, Rk, 200)], ...arcs(50, 88, Rk, 200, 340), ['L', ...pt(50, 88, rk, 340)], ...arcs(50, 88, rk, 340, 200), ['Z']);
      }
      return out;
    }
  },
  'porte-cercle': {
    params: () => ({}),
    build: () => {
      const arc = [];
      for (let i = 0; i <= 12; i++) arc.push(pt(50, 50, 40, 180 + (180 * i) / 12));
      return [...poly([[10, 94], [10, 50], ...arc, [90, 50], [90, 94]]), ...cerc(50, 64, 16, true)];
    }
  },
  quadrants: {
    params: (r) => ({ masque: r.entier(1, 15) }),
    build: (v) => {
      const m = Math.round(clamp(v('masque', 9), 1, 15));
      const out = [];
      [[6, 6], [50, 6], [6, 50], [50, 50]].forEach(([x, y], k) => {
        if ((m >> k) & 1) out.push(...poly([[x, y], [x + 44, y], [x + 44, y + 44], [x, y + 44]]));
        else out.push(['M', x, y], ['L', x + 44, y], ...arcs(x, y, 44, 0, 90), ['Z']);
      });
      return out;
    }
  },
  'semis-cercles': {
    params: (r) => ({ q: r.reel(0.6, 0.78) }),
    build: (v) => {
      const q = clamp(v('q', 0.7), 0.5, 0.9);
      const rs = [0, 1, 2, 3].map((i) => 22 * Math.pow(q, i));
      const ecart = 3;
      const largeur = rs.reduce((a, r) => a + 2 * r, 0) + ecart * (rs.length - 1);
      const f = 88 / largeur;
      let x = 6;
      const out = [];
      rs.forEach((r0) => {
        const r = r0 * f;
        const cx = x + r;
        out.push(['M', cx - r, 94], ...arcs(cx, 94, r, 180, 360), ['Z']);
        x += 2 * r + ecart * f;
      });
      return out;
    }
  },
  'goutte-geo': { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot([...cerc(50, 62, 30), ...poly([[50, 6], [68, 44], [32, 44]])], v('rot', 0)) },
  'feuille-lentille': {
    params: (r) => ({ rot: r.entier(0, 3) * 45 }),
    build: (v) => {
      const d = Math.sqrt(40 * 40 - 12 * 12);
      const aTop = Math.atan2(-d, 12) / R;
      const bTop = Math.atan2(-d, -12) / R;
      const cmds = [['M', 22, 50], ...arcs(62, 50, 40, 180, bTop + 360), ...arcs(38, 50, 40, aTop, 0), ...arcs(38, 50, 40, 0, -aTop), ...arcs(62, 50, 40, -bTop, 180), ['Z']];
      return rot(cmds, v('rot', 0));
    }
  },
  'vague-pleine': {
    params: (r) => ({ amp: r.reel(8, 16), ph: r.reel(0, 3) }),
    build: (v) => {
      const amp = clamp(v('amp', 12), 4, 20);
      const ph = clamp(v('ph', 1), 0, 6);
      const top = [];
      for (let i = 0; i <= 20; i++) { const x = 6 + (88 * i) / 20; top.push([x, 50 + amp * Math.sin((i / 20) * 2 * Math.PI + ph)]); }
      return poly([...top, [94, 94], [6, 94]]);
    }
  },
  'demi-anneau': {
    params: (r) => ({ ep: r.reel(10, 16), rot: r.entier(0, 3) * 90 }),
    build: (v) => {
      const e = clamp(v('ep', 12), 6, 20);
      return rot([['M', 6, 70], ...arcs(50, 70, 44, 180, 360), ['L', 50 + (44 - e), 70], ...arcs(50, 70, 44 - e, 360, 180), ['Z']], v('rot', 0));
    }
  },
  'triangle-pointu': { params: (r) => ({ rot: r.entier(0, 5) * 30 }), build: (v) => rot([...cerc(50, 50, 36), ...poly(reg(3, 46, -90))], v('rot', 0)) },
  'cercle-croix-creuse': { params: (r) => ({ rot: r.entier(0, 1) * 45 }), build: (v) => rot([...cerc(50, 50, 44), ...poly([[42, 13], [58, 13], [58, 42], [87, 42], [87, 58], [58, 58], [58, 87], [42, 87], [42, 58], [13, 58], [13, 42], [42, 42]], true)], v('rot', 0)) },
  'carre-cercle': { params: (r) => ({ rot: r.entier(0, 3) * 45 }), build: (v) => rot([...poly([[14, 14], [86, 14], [86, 86], [14, 86]]), ...cerc(50, 50, 36)], v('rot', 0)) },
  'hexagone-creux': { params: (r) => ({ rot: r.entier(0, 5) * 30 }), build: (v) => rot([...poly(reg(6, 44)), ...poly(reg(6, 28), true)], v('rot', 0)) },
  rosace: {
    params: (r) => ({ n: r.entier(5, 8) }),
    build: (v) => {
      const n = Math.round(clamp(v('n', 6), 4, 10));
      const star = [];
      for (let i = 0; i < n * 2; i++) star.push(pt(50, 50, i % 2 ? 14 : 28, (180 / n) * i - 90));
      return [...cerc(50, 50, 44), ...poly(star, true)];
    }
  },
  'arc-plein': { params: (r) => ({ rot: r.entier(0, 3) * 90 }), build: (v) => rot([['M', 6, 50], ...arcs(50, 50, 44, 180, 270), ['L', 50, 30], ...arcs(50, 50, 20, 270, 180), ['Z']], v('rot', 0)) },
  pilule: {
    params: (r) => ({ rot: r.entier(0, 1) * 90 }),
    build: (v) => rot([['M', 22, 28], ['L', 78, 28], ...arcs(78, 50, 22, -90, 90), ['L', 22, 72], ...arcs(22, 50, 22, 90, 270), ['Z']], v('rot', 0))
  }
};

export const FAMILLES_GEO = Object.keys(FORMES);

/** Paramètres aléatoires d'une famille géométrique. */
export function parametresGeo(famille, prng) {
  const f = FORMES[famille];
  if (!f) throw new Error(`Famille géométrique inconnue : ${famille}`);
  return f.params(prng);
}

/** Commandes de chemin d'une famille géométrique. */
export function construireGeo(famille, p = {}) {
  const f = FORMES[famille];
  if (!f) throw new Error(`Famille géométrique inconnue : ${famille}`);
  const v = (nom, defaut) => (Number.isFinite(p[nom]) ? p[nom] : defaut);
  return f.build(v);
}
