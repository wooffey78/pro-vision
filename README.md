# Pro-vision

Atelier web **gratuit** qui crée l'identité visuelle de départ d'une petite entreprise : nom d'affichage, logo (8 variantes), palette claire et sombre aux contrastes garantis, polices, charte graphique, papeterie, visuels pour les réseaux sociaux, page web et textes — le tout livré dans un **kit ZIP**.

- **Sans compte, sans serveur de données, sans IA** : tout est calculé dans le navigateur par un moteur de règles déterministe (même réponses + même code = même résultat).
- **Aucun service externe à l'exécution** : polices, symboles et bibliothèques sont copiés dans `public/vendor/`.
- **HTML, CSS et JavaScript natifs** (modules ES). Aucune étape de compilation obligatoire.

## Démarrer

Prérequis : Node.js ≥ 22.

```bash
npm ci            # installe les dépendances de développement (outils uniquement)
npm start         # sert public/ sur http://127.0.0.1:8080
npm test          # 128 tests (moteur, SVG hostiles, ZIP, serveur, interface jsdom)
npm run verify    # vendor + précache + règles du projet + tests (ce que fait la CI)
npm run sample    # génère un kit d'exemple dans out/kit-exemple.zip
```

Sans Node : n'importe quel serveur de fichiers statiques pointé sur `public/` suffit (Live Server, `python3 -m http.server -d public`, Nginx…). Ouvrir `index.html` directement depuis le disque (`file://`) ne marche pas : les modules ES et `fetch` exigent HTTP.

## Parcours utilisateur

Accueil → 5 questions (entreprise, offre, style, couleurs, coordonnées) → 6 propositions (chacune avec un code, verrouillage de la palette / des polices / du logo) → validation (8 variantes, contrastes, polices) → livraison du kit → suite (vérifications, passerelle vers d'autres applications). L'écran **Retouches** rouvre un kit (`.zip` ou `projet.json`) pour modifier couleur, polices, logo et textes, puis régénérer.

## Contenu du kit

`00-LISEZ-MOI.html`, `01-strategie`, `02-nom`, `03-logo` (SVG + PNG 512/1024/2048, favicon, `.ico`, zone de protection), `04-couleurs` (palette, contrastes, `variables.css`, tokens), `05-typographies` (WOFF2 + licences OFL), `06-charte-graphique.html`, `07-papeterie`, `08-reseaux-sociaux`, `09-site-web`, `10-textes`, `11-lancer-sa-marque`, `projet.json`, `licence.json`, `manifest.json` (SHA-256 de chaque fichier), `PROVENANCE.txt`. Le ZIP est **déterministe** (mêmes entrées → mêmes octets).

## Organisation du dépôt

```
public/              tout ce qui est servi (aucune dépendance au serveur)
  index.html  sw.js  manifest.webmanifest  precache.json
  config/            réglages JSON (app, polices, secteurs, formats sociaux, passerelle)
  css/               tokens.css (seul endroit des couleurs) + base, composants, écrans
  js/core/           moteur PUR (sans DOM, sans hasard global, sans date) : testé sous Node
  js/data/           secteurs, mots-clés, noms, symboles, liste de marques à éviter
  js/services/       stockage, ZIP, PNG, passerelle, chargement des ressources
  js/ui/             écrans et composants (jamais d'innerHTML)
  js/extensions/     points d'extension : IA (désactivée), licence (gratuite)
  vendor/            fflate, opentype.js, Lucide (symboles utilisés), 156 polices + licences
  legal/             mentions légales, confidentialité, CGU, accessibilité (à compléter)
server/              serveur statique sans dépendance + en-têtes de sécurité
scripts/             vendor, précache, icônes, kit d'exemple, contrôle des règles
tests/               node:test + jsdom
docs/                architecture, décisions, points à vérifier, sécurité, accessibilité, déploiement
```

## À lire avant de publier

1. [`docs/A_VERIFIER.md`](docs/A_VERIFIER.md) : ce qui est volontairement laissé à renseigner (éditeur, hébergeur, adresses de la passerelle, textes juridiques, formats des réseaux).
2. [`docs/DECISIONS.md`](docs/DECISIONS.md) : écarts assumés par rapport au cahier des charges, et pourquoi.
3. [`docs/QA-MANUELLE.md`](docs/QA-MANUELLE.md) : ce que les tests automatiques **ne couvrent pas** (export PNG par canvas, polices, service worker, téléchargement) et doit être contrôlé dans de vrais navigateurs.

Licence du code : à définir par l'éditeur (voir `LICENSE`). Licences tierces : `THIRD_PARTY_LICENSES.md` et dossiers `public/vendor/*/`.
