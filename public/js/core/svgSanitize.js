// @ts-check
/**
 * Nettoyeur SVG à liste blanche, sans expression régulière de nettoyage et sans DOM :
 * il fonctionne à l'identique dans le navigateur et sous Node (tests).
 *
 * Principe : analyse caractère par caractère (petit analyseur XML strict), refus des
 * DOCTYPE/ENTITY, puis reconstruction d'un SVG ne contenant QUE les éléments et attributs
 * autorisés. Tout le reste est supprimé et listé dans le rapport.
 */

export const LIMITES_SVG = Object.freeze({ octets: 200 * 1024, profondeur: 20, noeuds: 5000 });

const ELEMENTS = new Set([
  'svg', 'g', 'defs', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'title', 'desc',
  'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'use'
]);
const ELEMENTS_TEXTE = new Set(['text', 'tspan', 'title', 'desc']);

const ATTRIBUTS = new Set([
  'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'dx', 'dy', 'width', 'height', 'd', 'points', 'viewBox',
  'preserveAspectRatio', 'fill', 'fill-rule', 'fill-opacity', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform',
  'id', 'class', 'role', 'focusable', 'xmlns', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
  'patternUnits', 'patternTransform', 'patternContentUnits', 'clipPathUnits', 'maskUnits', 'maskContentUnits', 'text-anchor',
  'dominant-baseline', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'clip-path', 'mask',
  'href', 'data-filigrane', 'pointer-events', 'version', 'lang', 'textLength', 'lengthAdjust'
]);
const ATTRIBUTS_PAYSAGE_URL = new Set(['fill', 'stroke', 'clip-path', 'mask']);
const NS_SVG = 'http://www.w3.org/2000/svg';

const estEspace = (c) => c === ' ' || c === '\n' || c === '\t' || c === '\r';
const estLettre = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const estChiffre = (c) => c >= '0' && c <= '9';
const estCaractereNom = (c) => estLettre(c) || estChiffre(c) || c === '_' || c === '-' || c === '.' || c === ':';

/** Caractères de contrôle et de formatage bidirectionnel à supprimer. */
function estControle(code) {
  if (code === 9 || code === 10 || code === 13) return false;
  return code < 32 || (code >= 127 && code <= 159) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069) || code === 0x2028 || code === 0x2029 || code === 0xfeff;
}

/** @param {string} s @param {{type:string,detail:string}[]} rapport */
function retirerControles(s, rapport) {
  let sortie = '';
  let retire = false;
  for (const c of s) {
    if (estControle(c.codePointAt(0) ?? 0)) retire = true;
    else sortie += c;
  }
  if (retire) rapport.push({ type: 'caractere', detail: 'caractères de contrôle supprimés' });
  return sortie;
}

/** Décode les entités autorisées ; supprime les autres. */
function decoderEntites(s, rapport) {
  let sortie = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c !== '&') {
      sortie += c;
      i++;
      continue;
    }
    const fin = s.indexOf(';', i);
    if (fin === -1 || fin - i > 10) {
      rapport.push({ type: 'entite', detail: 'référence d’entité invalide supprimée' });
      i++;
      continue;
    }
    const nom = s.slice(i + 1, fin);
    const table = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (nom in table) sortie += table[nom];
    else if (nom[0] === '#') {
      const hex = nom[1] === 'x' || nom[1] === 'X';
      const n = parseInt(nom.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isInteger(n) && n > 31 && n < 0x110000 && !estControle(n)) sortie += String.fromCodePoint(n);
      else rapport.push({ type: 'entite', detail: 'référence numérique refusée' });
    } else rapport.push({ type: 'entite', detail: `entité « ${nom} » supprimée` });
    i = fin + 1;
  }
  return sortie;
}

class ErreurSvg extends Error {}

/**
 * Analyse XML minimale. Produit un arbre {nom, attrs:[[n,v]], enfants:[]|texte}.
 * @param {string} src
 * @param {{type:string,detail:string}[]} rapport
 */
function analyser(src, rapport) {
  const racine = { nom: '#racine', attrs: [], enfants: [] };
  /** @type {any[]} */
  const pile = [racine];
  let noeuds = 0;
  let i = 0;
  const n = src.length;
  while (i < n) {
    const courant = pile[pile.length - 1];
    if (src[i] !== '<') {
      let j = src.indexOf('<', i);
      if (j === -1) j = n;
      const texte = decoderEntites(src.slice(i, j), rapport);
      if (texte.length) {
        if (++noeuds > LIMITES_SVG.noeuds) throw new ErreurSvg('trop de nœuds');
        courant.enfants.push({ texte });
      }
      i = j;
      continue;
    }
    if (src.startsWith('<!--', i)) {
      const j = src.indexOf('-->', i + 4);
      if (j === -1) throw new ErreurSvg('commentaire non fermé');
      i = j + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      const j = src.indexOf(']]>', i + 9);
      if (j === -1) throw new ErreurSvg('CDATA non fermé');
      courant.enfants.push({ texte: src.slice(i + 9, j) });
      i = j + 3;
    } else if (src.startsWith('<?', i)) {
      const j = src.indexOf('?>', i + 2);
      if (j === -1) throw new ErreurSvg('instruction non fermée');
      i = j + 2;
    } else if (src.startsWith('<!', i)) {
      throw new ErreurSvg('déclaration interdite');
    } else if (src[i + 1] === '/') {
      const j = src.indexOf('>', i);
      if (j === -1) throw new ErreurSvg('balise fermante incomplète');
      const nom = src.slice(i + 2, j).trim();
      if (pile.length < 2 || pile[pile.length - 1].nom !== nom) throw new ErreurSvg(`balise fermante inattendue : ${nom}`);
      pile.pop();
      i = j + 1;
    } else {
      // balise ouvrante
      let j = i + 1;
      let nom = '';
      while (j < n && estCaractereNom(src[j])) nom += src[j++];
      if (!nom) throw new ErreurSvg('nom de balise manquant');
      /** @type {[string,string][]} */
      const attrs = [];
      let autoFermee = false;
      for (;;) {
        while (j < n && estEspace(src[j])) j++;
        if (j >= n) throw new ErreurSvg('balise non fermée');
        if (src[j] === '>') {
          j++;
          break;
        }
        if (src[j] === '/' && src[j + 1] === '>') {
          autoFermee = true;
          j += 2;
          break;
        }
        let an = '';
        while (j < n && !estEspace(src[j]) && src[j] !== '=' && src[j] !== '>' && src[j] !== '/') an += src[j++];
        if (!an) throw new ErreurSvg('attribut mal formé');
        while (j < n && estEspace(src[j])) j++;
        if (src[j] !== '=') throw new ErreurSvg('attribut sans valeur');
        j++;
        while (j < n && estEspace(src[j])) j++;
        const q = src[j];
        if (q !== '"' && q !== "'") throw new ErreurSvg('valeur d’attribut sans guillemets');
        const fin = src.indexOf(q, j + 1);
        if (fin === -1) throw new ErreurSvg('valeur d’attribut non fermée');
        attrs.push([an, decoderEntites(src.slice(j + 1, fin), rapport)]);
        j = fin + 1;
      }
      if (++noeuds > LIMITES_SVG.noeuds) throw new ErreurSvg('trop de nœuds');
      const el = { nom, attrs, enfants: [] };
      courant.enfants.push(el);
      if (!autoFermee) {
        if (pile.length > LIMITES_SVG.profondeur) throw new ErreurSvg('imbrication trop profonde');
        pile.push(el);
      }
      i = j;
    }
  }
  if (pile.length !== 1) throw new ErreurSvg('balise non fermée');
  return racine;
}

/** Référence interne « #identifiant » valide ? */
function refInterne(v) {
  if (v.length < 2 || v[0] !== '#') return false;
  for (let k = 1; k < v.length; k++) if (!estCaractereNom(v[k]) || v[k] === ':') return false;
  return true;
}

/** Valeur d'attribut sûre ? Interdit scripts, data:, URL externes. */
function valeurSure(nom, valeur) {
  let compact = '';
  for (const c of valeur.toLowerCase()) if (!estEspace(c) && !estControle(c.codePointAt(0) ?? 0)) compact += c;
  if (compact.includes('javascript:') || compact.includes('vbscript:') || compact.includes('data:') || compact.includes('expression(') || compact.includes('<') || compact.includes('@import')) return false;
  let pos = compact.indexOf('url(');
  while (pos !== -1) {
    if (!ATTRIBUTS_PAYSAGE_URL.has(nom)) return false;
    let k = pos + 4;
    if (compact[k] === '"' || compact[k] === "'") k++;
    if (compact[k] !== '#') return false;
    pos = compact.indexOf('url(', pos + 4);
  }
  return true;
}

const echapper = (s) => {
  let r = '';
  for (const c of s) r += c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : c;
  return r;
};

/** @returns {string} */
function reconstruire(el, parentTexte, rapport, estRacine) {
  if (!ELEMENTS.has(el.nom)) {
    rapport.push({ type: 'element', detail: `élément retiré : ${el.nom}` });
    return '';
  }
  const attrsSortie = [];
  const vus = new Set();
  for (const [n, v0] of el.attrs) {
    const v = retirerControles(v0, rapport);
    const ok = (ATTRIBUTS.has(n) || n.startsWith('aria-')) && !vus.has(n);
    if (!ok) {
      rapport.push({ type: 'attribut', detail: `attribut retiré : ${n} (${el.nom})` });
      continue;
    }
    if (n === 'xmlns') continue; // réécrit proprement sur la racine
    if (n === 'href') {
      if (el.nom !== 'use' || !refInterne(v)) {
        rapport.push({ type: 'attribut', detail: 'href non interne retiré' });
        continue;
      }
    } else if (n === 'class') {
      let propre = true;
      for (const c of v) if (!(estCaractereNom(c) || c === ' ') || c === ':') propre = false;
      if (!propre) {
        rapport.push({ type: 'attribut', detail: 'class dangereuse retirée' });
        continue;
      }
    } else if (n === 'data-filigrane' && v !== '1') continue;
    if (!valeurSure(n, v)) {
      rapport.push({ type: 'attribut', detail: `valeur dangereuse retirée : ${n}` });
      continue;
    }
    vus.add(n);
    attrsSortie.push(`${n}="${echapper(v)}"`);
  }
  if (el.nom === 'use' && !vus.has('href')) {
    rapport.push({ type: 'element', detail: 'use sans référence interne retiré' });
    return '';
  }
  if (estRacine) attrsSortie.unshift(`xmlns="${NS_SVG}"`);
  let interieur = '';
  for (const e of el.enfants) {
    if (e.texte !== undefined) {
      if (ELEMENTS_TEXTE.has(el.nom)) interieur += echapper(retirerControles(e.texte, rapport));
    } else interieur += reconstruire(e, el.nom, rapport, false);
  }
  const a = attrsSortie.length ? ' ' + attrsSortie.join(' ') : '';
  return interieur ? `<${el.nom}${a}>${interieur}</${el.nom}>` : `<${el.nom}${a}/>`;
}

/**
 * Nettoie un SVG.
 * @param {string} source
 * @returns {{ ok: boolean, svg: string, rapport: {type:string,detail:string}[] }}
 */
export function nettoyerSvg(source) {
  /** @type {{type:string,detail:string}[]} */
  const rapport = [];
  const echec = (detail) => ({ ok: false, svg: '', rapport: [...rapport, { type: 'refus', detail }] });
  if (typeof source !== 'string' || !source.trim()) return echec('SVG vide');
  if (new TextEncoder().encode(source).length > LIMITES_SVG.octets) return echec('SVG trop volumineux (200 Ko maximum)');
  const bas = source.toLowerCase();
  if (bas.includes('<!doctype') || bas.includes('<!entity')) return echec('DOCTYPE et ENTITY interdits');
  let arbre;
  try {
    arbre = analyser(source, rapport);
  } catch (e) {
    return echec(e instanceof ErreurSvg ? e.message : 'SVG illisible');
  }
  const elements = arbre.enfants.filter((e) => e.texte === undefined);
  if (elements.length !== 1 || elements[0].nom !== 'svg') return echec('la racine doit être un unique élément svg');
  const svg = reconstruire(elements[0], '', rapport, true);
  if (!svg) return echec('SVG vide après nettoyage');
  return { ok: true, svg, rapport };
}
