// @ts-check
/**
 * Création d'éléments DOM sans jamais passer par innerHTML.
 * Interdit : attribut style, gestionnaires « on… » en chaîne, URL « javascript: ».
 */

/**
 * @param {string} tag
 * @param {Record<string, any> | null} [props] attributs ; « on* » doit être une fonction ; « vars » : variables CSS (CSSOM)
 * @param {...(Node|string|number|null|undefined|false|(Node|string)[])} enfants
 * @returns {HTMLElement}
 */
export function h(tag, props, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty(n, String(val));
    else if (k.startsWith('on')) {
      if (typeof v !== 'function') throw new Error(`Gestionnaire ${k} : une fonction est requise`);
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'style') throw new Error('L’attribut style est interdit (CSP) : utilisez une classe ou vars');
    else if (k === 'class') el.className = String(v);
    else if (k === 'texte') el.textContent = String(v);
    else if ((k === 'href' || k === 'src') && /^\s*(javascript|data|vbscript):/i.test(String(v))) throw new Error('URL interdite');
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const e of enfants.flat()) {
    if (e === null || e === undefined || e === false) continue;
    el.append(e instanceof Node ? e : document.createTextNode(String(e)));
  }
  return el;
}

/** Vide un conteneur. @param {Node} el */
export function vider(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

let compteurId = 0;
/** Identifiant unique pour lier label et champ. @param {string} [prefixe] */
export const idUnique = (prefixe = 'pv') => `${prefixe}-${++compteurId}`;
