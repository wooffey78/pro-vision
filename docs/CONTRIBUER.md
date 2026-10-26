# Contribuer

1. `npm ci`, puis `npm run verify` doit passer avant toute modification.
2. Le moteur (`public/js/core/`) reste **pur** : pas de DOM, pas de `Math.random`, pas de date. Toute nouvelle ressource est injectée.
3. Interface : jamais d'`innerHTML` ; construire avec `h()`. Les couleurs vivent uniquement dans `css/tokens.css`.
4. Nouveau champ de projet : modifier `core/schema.js`, lancer `npm run schema`, ajouter un test refusé/accepté.
5. Nouvelle police ou bibliothèque : l'ajouter dans `package.json` (version exacte) et `config/`, lancer `npm run vendor`.
6. Après toute modification de `public/` : `npm run precache`.
7. Un bogue de rendu = un test (ou une fixture) ajouté.
