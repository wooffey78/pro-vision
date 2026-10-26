# Déploiement

L'application est statique : déployer le dossier `public/`.

- **Node** : `npm start` (`PORT`, `HOST=0.0.0.0` derrière un proxy). `/healthz` répond `ok`. Ajoute CSP, HSTS (si `X-Forwarded-Proto: https`) et en-têtes de sécurité.
- **Render** : `render.yaml` (service Web Node, `healthCheckPath: /healthz`).
- **Netlify / Cloudflare Pages** : `netlify.toml` et `public/_headers` reproduisent les en-têtes (publier `public/`, sans commande de build).
- **Nginx / autre** : servir `public/`, reproduire les en-têtes de `server/server.js` (`entetesSecurite`), type MIME `application/manifest+json` pour `.webmanifest`, `font/woff2` pour `.woff2`.

Avant publication : `npm run verify`, puis suivre `docs/A_VERIFIER.md` et `docs/QA-MANUELLE.md`. Après toute modification de `public/` : `npm run precache` (sinon la CI échoue).
