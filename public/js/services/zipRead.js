// @ts-check
/**
 * Lecture sûre d'un kit ZIP (import de projet) : limites strictes, noms contrôlés,
 * seuls projet.json / licence.json / manifest.json sont décompressés.
 */

const LUS = new Set(['projet.json', 'licence.json', 'manifest.json']);
const RESERVES = new Set(['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9']);

export class ErreurZip extends Error {}

/**
 * Nom d'entrée ZIP acceptable ? Refuse « .. », chemins absolus, antislash, contrôles, noms réservés Windows.
 * @param {string} nom
 */
export function nomZipSur(nom) {
  if (!nom || nom.length > 255) return false;
  if (nom.startsWith('/') || nom.includes('\\') || nom.includes(':')) return false;
  for (const c of nom) {
    const code = c.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) return false;
  }
  for (const seg of nom.split('/')) {
    if (seg === '..' || seg === '.') return false;
    const base = seg.split('.')[0].toLowerCase();
    if (RESERVES.has(base)) return false;
  }
  return true;
}

/** @param {Uint8Array} octets @returns {Promise<string>} */
async function sha256(octets) {
  const d = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {any} fflate
 * @param {Uint8Array} octets
 * @param {{ zipMaxOctets:number, zipMaxEntrees:number, zipRatioMax:number, jsonMaxOctets:number }} limites
 * @returns {Promise<{ projet: any, licence: any|null, avertissements: string[] }>}
 */
export async function lireKit(fflate, octets, limites) {
  if (octets.length > limites.zipMaxOctets) throw new ErreurZip('Ce fichier est trop volumineux (20 Mo maximum).');
  if (octets.length < 22 || octets[0] !== 0x50 || octets[1] !== 0x4b) throw new ErreurZip('Ce fichier n’est pas une archive ZIP.');
  let entrees = 0;
  let total = 0;
  let fichiers;
  try {
    fichiers = fflate.unzipSync(octets, {
      filter(f) {
        entrees++;
        if (entrees > limites.zipMaxEntrees) throw new ErreurZip('Cette archive contient trop de fichiers.');
        if (!nomZipSur(f.name)) throw new ErreurZip('Cette archive contient un nom de fichier interdit.');
        total += f.originalSize;
        if (total > limites.zipMaxOctets) throw new ErreurZip('Le contenu de cette archive est trop volumineux.');
        if (f.size > 0 && f.originalSize / f.size > limites.zipRatioMax) throw new ErreurZip('Cette archive est suspecte (taux de compression anormal).');
        if (!LUS.has(f.name)) return false;
        if (f.originalSize > limites.jsonMaxOctets) throw new ErreurZip(`${f.name} est trop volumineux.`);
        return true;
      }
    });
  } catch (e) {
    if (e instanceof ErreurZip) throw e;
    throw new ErreurZip('Cette archive est illisible ou abîmée.');
  }
  if (!fichiers['projet.json']) throw new ErreurZip('Aucun fichier projet.json dans cette archive : ce n’est pas un kit Pro-vision.');
  const dec = new TextDecoder('utf-8', { fatal: true });
  let projet;
  let licence = null;
  try {
    projet = JSON.parse(dec.decode(fichiers['projet.json']));
    if (fichiers['licence.json']) licence = JSON.parse(dec.decode(fichiers['licence.json']));
  } catch {
    throw new ErreurZip('Le fichier projet.json est illisible.');
  }
  const avertissements = [];
  if (fichiers['manifest.json']) {
    try {
      const m = JSON.parse(dec.decode(fichiers['manifest.json']));
      const attendu = m.fichiers?.find((x) => x.chemin === 'projet.json');
      if (attendu && attendu.sha256 !== (await sha256(fichiers['projet.json']))) avertissements.push('Le fichier projet.json a été modifié depuis la création du kit.');
    } catch {
      avertissements.push('Le manifeste du kit est illisible.');
    }
  }
  return { projet, licence, avertissements };
}
