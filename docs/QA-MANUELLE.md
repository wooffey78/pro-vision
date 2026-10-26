# Contrôles manuels (non couverts par les tests automatiques)

Les tests tournent sous Node + jsdom : ils n'exécutent ni vrai rendu, ni canvas, ni service worker. À faire dans **Chrome, Firefox et Safari** (ordinateur) et **un mobile** :

1. Parcours complet jusqu'au téléchargement du ZIP ; décompresser ; ouvrir `00-LISEZ-MOI.html`, `06-charte-graphique.html`, `09-site-web/index.html` (polices chargées, mode sombre, impression).
2. **PNG** : `03-logo/png/*` et `08-reseaux-sociaux/png/*` s'ouvrent, fond transparent pour les logos, bonnes dimensions ; `favicon.ico` accepté par le navigateur.
3. **Polices** : mêmes tracés que l'aperçu ; pas de texte de secours dans les logos.
4. **Retouches** : rouvrir le ZIP téléchargé, changer une couleur, régénérer ; vérifier le « sélecteur de couleur » natif.
5. **Hors ligne** : charger une fois, couper le réseau, recharger ; installer la PWA.
6. **Stockage** : recharger en cours de parcours (reprise) ; navigation privée (message sans plantage) ; bouton « Effacer toutes mes données ».
7. **Passerelle** : ouvrir un lien `#/import/…` valide et un lien altéré.
8. **Clavier et lecteur d'écran** sur les écrans 1 à 8.
9. **Impression** des cartes (`*-impression.svg`, fond perdu 3 mm, traits de coupe) chez l'imprimeur ou en PDF.
10. **Performance** : génération du kit sur un téléphone d'entrée de gamme (≈ 25 PNG + ZIP).
