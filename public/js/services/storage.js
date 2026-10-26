// @ts-check
/**
 * Stockage local (jamais de serveur). localStorage pour le projet et les préférences,
 * IndexedDB pour l'historique, repli mémoire si le navigateur refuse (navigation privée, quota).
 */

export const CLES = Object.freeze({ projet: 'provision:projet', prefs: 'provision:prefs', historique: 'provision:historique' });
const PREFIXE = 'provision:';
const MAX_OCTETS = 2 * 1024 * 1024;

/**
 * @param {{ localStorage?: Storage|null, indexedDB?: IDBFactory|null }} [env]
 */
export function creerStockage({ localStorage: ls = null, indexedDB: idb = null } = {}) {
  /** @type {Map<string,string>} */
  const memoire = new Map();
  let persistant = !!ls;
  const dbNom = 'provision';

  /** @returns {Promise<IDBDatabase>} */
  const ouvrirDb = () => new Promise((res, rej) => {
    const r = /** @type {IDBFactory} */ (idb).open(dbNom, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const idbOp = async (mode, f) => {
    const db = await ouvrirDb();
    return new Promise((res, rej) => {
      const t = db.transaction('kv', mode);
      const req = f(t.objectStore('kv'));
      t.oncomplete = () => { db.close(); res(req?.result ?? null); };
      t.onerror = () => rej(t.error);
    });
  };
  const versIdb = (cle) => !!idb && cle === CLES.historique;

  return {
    get persistant() { return persistant; },
    /** @param {string} cle @returns {Promise<any|null>} */
    async lire(cle) {
      try {
        let brut;
        if (versIdb(cle)) brut = await idbOp('readonly', (s) => s.get(cle));
        else brut = ls && persistant ? ls.getItem(cle) : memoire.get(cle) ?? null;
        return brut ? JSON.parse(brut) : null;
      } catch {
        return null;
      }
    },
    /** @param {string} cle @param {any} valeur @returns {Promise<{ok:boolean, persistant:boolean}>} */
    async ecrire(cle, valeur) {
      const brut = JSON.stringify(valeur);
      if (brut.length > MAX_OCTETS) return { ok: false, persistant };
      try {
        if (versIdb(cle)) await idbOp('readwrite', (s) => s.put(brut, cle));
        else if (ls && persistant) ls.setItem(cle, brut);
        else memoire.set(cle, brut);
        return { ok: true, persistant };
      } catch {
        persistant = false;
        memoire.set(cle, brut);
        return { ok: true, persistant: false };
      }
    },
    /** @param {string} cle */
    async supprimer(cle) {
      memoire.delete(cle);
      try {
        if (versIdb(cle)) await idbOp('readwrite', (s) => s.delete(cle));
        else ls?.removeItem(cle);
      } catch { /* rien à faire */ }
    },
    /** Efface toutes les données de l'application. */
    async toutEffacer() {
      memoire.clear();
      try {
        if (ls) for (const k of Object.keys(ls)) if (k.startsWith(PREFIXE)) ls.removeItem(k);
        if (idb) await new Promise((res) => { const r = idb.deleteDatabase(dbNom); r.onsuccess = r.onerror = r.onblocked = () => res(null); });
      } catch { /* rien à faire */ }
    }
  };
}
