# À vérifier / à renseigner avant la mise en ligne

Rien ici n'a été inventé : ce sont des repères volontairement laissés ouverts.

## À renseigner (`[A_RENSEIGNER]`)
- `public/legal/*.html` : éditeur, hébergeur, contacts, directeur de la publication.
- `public/config/bridge.config.json` : `baseUrl` de VYRATY et de Pro-vision (https obligatoire). Tant que l'adresse contient `[A_RENSEIGNER]`, aucun lien de passerelle n'est affiché.
- `public/config/app.config.json` → `avis.url` : canal de retour (sinon l'écran propose un modèle à copier).

## À contrôler (informations externes susceptibles d'avoir changé)
- **Dimensions des réseaux sociaux** (`social-sizes.json`, `verifieLe: null`) : à contrôler sur chaque réseau.
- **Liens officiels** (`app.config.json` → `liens`) : INPI, TMview, AFNIC, guichet des formalités, service-public.fr, URSSAF, Google Business.
- **Textes juridiques** : mentions légales, confidentialité, CGU, accessibilité (état « non évalué »), texte de `licence.json` (`TEXTE_LICENCE` dans `core/kit.js`).
- **Contenus gabarits** (slogans, à propos, FAQ, checklist) : relus pour éviter promesses chiffrées et superlatifs (test automatique), mais à valider éditorialement.

## Limites connues
- Aucune vérification d'antériorité de nom/logo/domaine (par conception ; le kit l'explique).
- CMJN **indicatif** (formule simple, sans profil colorimétrique).
- Pas de ligatures dans les logos (voir `DECISIONS.md` n°4).
- Accessibilité : prévue pour WCAG 2.2 AA, **non auditée**.
