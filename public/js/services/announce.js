// @ts-check
/** Annonces pour lecteurs d'écran : écrit dans la zone aria-live #annonces. */
export function annoncer(message) {
  const zone = document.getElementById('annonces');
  if (!zone) return;
  zone.textContent = '';
  setTimeout(() => { zone.textContent = message; }, 40);
}
