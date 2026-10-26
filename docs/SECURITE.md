# Sécurité et vie privée

## Surface d'attaque
Application statique, sans base de données, sans API, sans compte. Les entrées non fiables sont : fichiers importés (ZIP, JSON), fragment d'URL de la passerelle, stockage local corrompu, et textes saisis.

## Mesures
- **CSP stricte** (`default-src 'none'`, scripts et styles `'self'`, pas de `unsafe-inline`), `Referrer-Policy: no-referrer`, `nosniff`, COOP/CORP, `X-Frame-Options`/`frame-ancestors 'none'` et HSTS (derrière HTTPS) par le serveur.
- **Pas d'`innerHTML`**, d'`eval`, de `new Function`, de `style=` en ligne : interdits par `check-policy.mjs` (échec de la CI).
- **SVG** : liste blanche d'éléments/attributs, URL internes uniquement, pas de DOCTYPE/ENTITY, limites (200 Ko, 20 niveaux, 5 000 nœuds), double analyse (maison puis `DOMParser`).
- **ZIP importé** : 20 Mo, 500 entrées, taux de compression ≤ 100, noms contrôlés (`..`, absolus, `\`, réservés Windows), seuls `projet.json`, `licence.json`, `manifest.json` sont décompressés, `projet.json` ≤ 1 Mo.
- **Projets** : schéma strict (propriétés inconnues refusées, `__proto__` refusé), chaînes nettoyées des caractères de contrôle et bidirectionnels, version future refusée.
- **Passerelle** : données dans le fragment (`#/import/…`, jamais envoyé au serveur), ≤ 12 000 caractères, schéma réduit, sources connues, liens sortants en `https://` uniquement.
- **Sorties du kit** : toutes les valeurs saisies sont échappées dans le HTML ; le HTML du kit n'appelle aucune ressource externe.
- **Chaîne d'approvisionnement** : versions exactes (`package-lock.json`), bibliothèques copiées dans `public/vendor/` avec empreintes SHA-256 (`VENDOR_MANIFEST.json`, `npm run vendor -- --verify`).
- **Vie privée** : aucun cookie, aucune mesure d'audience, aucune requête externe. Clés locales : `provision:projet`, `provision:historique`.

## Signaler une vulnérabilité
Voir `SECURITY.md`.
