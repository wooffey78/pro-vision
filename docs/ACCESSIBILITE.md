# Accessibilité

Objectif : WCAG 2.2 niveau AA. État : **non audité** (voir `public/legal/accessibilite.html`).

Prévu et testé automatiquement (`tests/ui.test.js`) : un seul `h1` par écran avec focus à chaque navigation, annonces `aria-live`, champs avec `label`, aide et erreur liés par `aria-describedby`, résumé d'erreurs focalisable (`role="alert"`), `aria-invalid`, logos avec `role="img"` + `aria-label`, tableau de contrastes avec légende, couleur toujours doublée d'un texte, cibles ≥ 44 px, focus visible, lien d'évitement, `prefers-reduced-motion`, `prefers-color-scheme`, `forced-colors`.

À contrôler à la main : lecteur d'écran (NVDA/VoiceOver), zoom 200 %, navigation clavier complète, contrastes réels des thèmes clair/sombre de l'interface.
