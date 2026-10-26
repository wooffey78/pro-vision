# Architecture

## Principes

1. **Moteur pur** (`public/js/core/`) : fonctions sans DOM, sans `Math.random`, sans `Date`, sans réseau. Les ressources (polices, symboles, configuration) sont **injectées**. Conséquence : tout le moteur est testé sous Node et le résultat est reproductible.
2. **Frontière nette** : `services/` parle au navigateur (stockage, fetch, canvas, téléchargement), `ui/` construit le DOM, `core/` calcule. `scripts/check-policy.mjs` fait respecter ces frontières (voir `docs/SECURITE.md`).
3. **Un seul modèle de données** : le *projet* (`core/schema.js`), validé strictement à chaque entrée (stockage local, import ZIP/JSON, passerelle). Le schéma JSON de `docs/schemas/` en est **généré** (`npm run schema`) ; un test vérifie qu'ils sont identiques.

## Génération d'une identité

`genererProposition(ctx, entreprise, preferences, code, verrous)` :
- trois flux aléatoires **indépendants** (`code/palette`, `code/polices`, `code/logo`) : verrouiller la palette ne change ni les polices ni le logo ;
- **palette** (`palette.js`) : base OKLCH selon ambiances ou couleur aimée ; harmonie (8) ; rôles clair et sombre ; chaque rôle est ajusté en luminosité jusqu'au contraste visé (texte 7:1, atténué 4,5:1, graphiques 3:1, texte sur couleur principale 4,5:1) ; accent distinct de l'erreur/succès ; couleurs à éviter respectées par rotation de teinte. Vérifié sur 6 000 palettes (`palette.test.js`) ;
- **polices** : 156 familles sous licences libres (OFL ou Apache 2.0), 282 couples générés à partir des ambiances (`scripts/build-fonts-config.mjs`) ;
- **logo** : symbole Lucide (secteur + mots-clés) ou une des 12 marques procédurales (un `<path>` fermé chacune), contenant, disposition, casse. Le texte est converti en **tracés** (`textToPath.js`) : le logo ne dépend d'aucune police installée.

Le code d'une proposition (`K7M2-9QX`) + les réponses suffisent à la retrouver à l'identique.

## Kit

`core/kit.js` assemble ~140 fichiers à partir du projet ; aucune date « maintenant » : les horodatages viennent du projet. `services/zip.js` écrit un ZIP déterministe (date 1980, ordre alphabétique, niveau fixe — vérifié sous trois fuseaux horaires). `manifest.json` contient le SHA-256 de chaque fichier.

## Interface

Routeur par fragment (`#/etape/N`, `#/retouches`, `#/import/…`). Chaque écran est une fonction `(app) → Node`. `ui/dom.js` (`h()`) refuse les attributs `style`, les gestionnaires `on*` en chaîne et les URL `javascript:`. Les SVG passent par `ui/safeSvg.js` : nettoyage à liste blanche puis **ré-analyse par `DOMParser`**.

## Hors ligne

`sw.js` pré-charge tous les fichiers listés dans `precache.json` (généré par `npm run precache`, qui fixe aussi la version de cache). Cache d'abord, réseau en repli, `index.html` pour la navigation hors ligne.
