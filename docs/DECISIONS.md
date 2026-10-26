# Décisions et écarts assumés

Ce fichier liste ce qui diffère d'une lecture littérale du cahier des charges, et pourquoi.

| # | Sujet | Décision | Raison |
|---|---|---|---|
| 1 | Dossier `config/` | Placé dans `public/config/` | Le navigateur doit pouvoir le télécharger ; hors de `public/` il serait inaccessible. Pas de duplication à synchroniser. |
| 2 | CSP | Posée en `<meta>` **et** en en-tête par `server/server.js`. `frame-ancestors`, HSTS et `upgrade-insecure-requests` ne sont mis qu'en en-tête HTTP | Ces directives sont ignorées en `<meta>` ; `upgrade-insecure-requests` en meta casserait le développement sur `http://127.0.0.1`. |
| 3 | Nettoyeur SVG | Analyseur XML maison (liste blanche) au lieu de `DOMParser` seul | Fonctionne sous Node : les 48 SVG hostiles et un fuzz de 3 000 mutations sont testés. Le navigateur ré-analyse ensuite le résultat avec `DOMParser` (double barrière). DOCTYPE/ENTITY → refus total. |
| 4 | Texte → tracés | Glyphe par glyphe (`charToGlyph`), sans ligatures ; crénage seulement si lisible dans `kern` | `opentype.js` 2.0 échoue sur certaines tables GSUB (lookup 6 format 2) avec `getPath`/`stringToGlyphs`, et `toPathData` produit parfois des `NaN` : sérialisation maison. |
| 5 | WOFF **et** WOFF2 | Les deux sont copiés dans `vendor/` | `opentype.js` ne lit pas le WOFF2 ; le kit livre du WOFF2. |
| 6 | Aperçu de la charte et du site | Non affichés dans l'application | Une page HTML avec `<style>` en ligne hérite de la CSP stricte (`style-src 'self'`) et s'afficherait sans style. Les aperçus affichés sont des SVG ; charte et site s'ouvrent depuis le ZIP décompressé (hors CSP de l'application). |
| 7 | Dépendances de développement | + `@resvg/resvg-js` (icônes, kit d'exemple avec PNG) et `jsdom` (test d'interface) | Aucune alternative sans dépendance pour rasteriser un SVG sous Node. Aucun impact sur l'exécution ; les PNG d'icônes sont versionnés ; `scripts/build-icons.html` sert de secours. |
| 8 | PNG du kit | Générés par `<canvas>` dans le navigateur ; les tests Node utilisent un rasteriseur factice (structure) et le script d'exemple utilise resvg | Pas de navigateur dans l'environnement de test : voir `QA-MANUELLE.md`. |
| 9 | Schéma | Défini en JS (`SCHEMA_PROJET`), JSON généré | Une seule source de vérité, un validateur réel (sous-ensemble de JSON Schema). |
| 10 | Palette dans le projet | Rôles du mode clair à plat (comme dans l'exemple du cahier) + objet `sombre` | Stabilité : le projet embarque la palette calculée, donc un changement futur du moteur ne modifie pas un projet existant. |
| 11 | Dispositions de logo | 6 (dessus, gauche, droite, nom seul, monogramme, deux lignes) — pas d'« emblème » | Périmètre maîtrisé ; l'écusson existe comme contenant. |
| 12 | Icônes d'interface | Aucune : libellés textuels | Accessibilité (pas d'icône seule) et moins de fichiers. |
| 13 | Historique des séries | IndexedDB, mais ne contient que des **codes** | Une série se régénère depuis son code : pas besoin de stocker des SVG. |
| 14 | Tests | `node --test "tests/*.test.js"` | Node 22 n'accepte pas un dossier en argument. |
| 15 | Texte de licence du kit | « Licence gratuite, sans garantie » + précisions | Repris de la forme du prototype ; **à faire valider** (`A_VERIFIER.md`). |
| 16 | Ancien prototype | `migrer()` régénère l'identité à partir du nom et de la graine, conserve nom, mention, activité, ambiances | Les deux moteurs diffèrent : les couleurs et le logo ne peuvent pas être reproduits à l'identique ; l'utilisateur en est averti. |
