# Modifier le portfolio — guide du Studio

Le Studio : https://pauline-yvelin.sanity.studio (raccourci : ajouter `/studio` à l'adresse du site)

Tu t'y connectes avec le compte qui a reçu l'invitation Sanity. Une modification n'apparaît sur le site qu'après avoir cliqué sur **Publier** (en bas à droite). Le site la reprend tout seul en moins d'une minute : pas besoin de toucher au code ni à GitHub.

## Le menu

| Dans le menu | Ce qu'on y trouve |
|---|---|
| **Accueil** | Le texte qui tourne autour du smiley, le bouton « Ça vous dit un café ? » |
| **Projets** | Tous les projets (le bouton **+** en ajoute un). Onglet **Fiche** : nom, étiquettes, bouton du haut (texte et adresse), « Le projet », « La conception » (4 étapes au plus). Onglet **Images** : la grande image et les deux du dessous. Onglet **Sur l'accueil** : l'étiquette et l'image de la carte qui défile |
| **À propos** | Titre, sous-titre, texte, photo, CV (PDF), bouton et playlist de musique |
| **Contact** | L'adresse qui reçoit les messages, le nom et le métier sur la carte postale, le texte d'exemple, la photo du timbre |

## Bon à savoir

- **Images** : remplace-les par glisser-déposer. Remplis la « Description de l'image » (une phrase sur ce qu'on voit).
- **Accents dans les titres** : la police des titres n'a pas d'accents ; le site les dessine lui-même pour é, è, à et ù. Écris normalement.
- **Ajouter un projet** : dans **Projets**, bouton **+**. Remplir le nom, cliquer « Générer » à côté de l'adresse, mettre l'image de la carte (onglet « Sur l'accueil »), puis Publier. Il prend sa place dans la boucle de l'accueil et a sa page (`…/projet.html?p=son-adresse`).
- **Ordre des cartes** : « Position sur l'accueil » (onglet « Sur l'accueil ») : 1 = la carte qu'on voit en arrivant, puis 2, 3… Les projets sans numéro passent après, du plus récent au plus ancien.
- **Supprimer un projet** : menu « ⋯ » de la fiche, Supprimer. Il disparaît de l'accueil.
- **Le reste** (couleurs, mise en page, animations, cases « Direction artistique / Product design / Branding ») est dans le code : `src/site.css`, `src/pages.css`, `src/site.js`. Le lien avec Sanity est dans `src/cms.js`.

## Pour le code

```bash
cd studio
npm install
npm run dev      # Studio en local : http://localhost:3333
npm run deploy   # remet le Studio en ligne après un changement du schéma
```

Projet Sanity : `h1m9xg4z`, données `production` (lecture publique, aucune clé dans le site).
