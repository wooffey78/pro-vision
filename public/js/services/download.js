// @ts-check
/** Nom de fichier sûr : ASCII, tirets, sans caractère spécial. @param {string} s */
export function nomFichierSur(s) {
  const t = String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return t.slice(0, 50) || 'kit';
}

/**
 * Déclenche un téléchargement local (aucun envoi).
 * @param {string} nom @param {Uint8Array|string} contenu @param {string} type
 */
export function telecharger(nom, contenu, type = 'application/octet-stream') {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
