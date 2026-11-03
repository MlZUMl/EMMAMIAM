# Élan

Application web installable (Android, Chrome) pour construire une routine sport, eau et repas
qui tient **même les jours sans motivation** : rendez-vous concrets, version minimale, reprise
après une pause, et un univers qui grandit avec les habitudes réelles.

- Appli en ligne : https://mlzuml.github.io/EMMAMIAM/elan/
- Données : sur le téléphone (IndexedDB) + sauvegarde privée Supabase (projet `elan`, Paris).
- Rappels : notifications push envoyées par Supabase chaque minute, appli fermée.

## Lancer en local

```bash
npm install
npm run dev          # développement
npm run build        # vérifie les types puis construit dist/
npm test             # tests unitaires + base de données (PGlite)
npm run test:e2e     # parcours réels dans Chromium, écran 360 px (après npm run build)
npm run ciqual       # régénère la table des aliments depuis scripts/data/ciqual-2020.xls
```

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/data` | Stockage local (une seule transaction par action), file d'envoi, synchronisation Supabase |
| `src/domain` | Règles métier pures et testées : rituel, énergie, récompenses, missions, capsules, analyse, compagnon, nutrition, aliments, contrôle « sans porc » |
| `src/screens` | Écrans (journal alimentaire : `Food.tsx`, `FoodAdd.tsx`, `food-parts.tsx`) |
| `src/art` | Illustrations vectorielles (remplaçables, voir ci-dessous) |
| `public/data` | `ciqual.json` (aliments) — lu à l'exécution |
| `scripts` | Conversion de la table Ciqual |
| `supabase/migrations` | Schéma, RLS, stockage des photos, règles des rappels, tâche planifiée, journal alimentaire (0005), points (0006), cycle (0007), v1.4 : favoris, rappels de repas, mensurations, sommeil (0008) |
| `supabase/functions/rappels` | Envoi des notifications push |
| `tests` | Tests unitaires, base de données, navigateur |

## Journal alimentaire

- Objectif calorique automatique (Mifflin-St Jeor × activité, rythme modéré par défaut), modifiable
  à la main. Plancher : 1 200 kcal (femme) / 1 500 kcal (homme), et jamais sous le métabolisme de base.
  L'objectif ne baisse jamais les jours de faible énergie ; les calories du sport ne sont pas déduites.
- 4 repas (25 / 35 / 10 / 30 %), protéines, glucides, lipides, fibres.
- Sources : table **Ciqual 2020** (embarquée), **Open Food Facts** (recherche de marques sur demande,
  code-barres), aliments personnels, et surtout la **saisie rapide : un simple nombre de calories**
  (premier onglet de l'écran « Ajouter »). Quantités en g, ml ou portions.
- Pas de recettes, de menu ni de liste de courses : retirés à la demande d'Omar (3 nov. 2026).
  Les tables `user_recipes` et `meal_plans` restent dans la base (aucune donnée effacée) mais ne sont plus utilisées.
- Les valeurs sont figées au moment de l'ajout : aucune double comptabilité, l'historique ne bouge pas.
- Profil nutrition (année de naissance, taille, poids, activité, rythme) proposé dès l'accueil (étape facultative) :
  l'objectif est prêt dans le journal et le poids saisi devient la première pesée.

### Journal plus rapide (v1.4)

- **Comme hier** : un repas vide propose en un geste le même repas du dernier jour noté (7 jours).
  « Favori · reprendre » permet aussi de recopier ce repas depuis n'importe quel jour des deux dernières semaines.
- **Repas favoris** (table `favorite_meals`) : enregistrer un repas noté, puis le rajouter en un geste depuis le
  journal ou l'écran « Ajouter » (ligne « Mes repas favoris »). Le contrôle sans porc s'applique aussi.
- Les lignes recopiées gardent leurs valeurs ; les anciennes lignes « recette » restent visibles et modifiables comme un simple nombre de calories.
- **Rappels de repas** (Profil > Rappels, désactivables) : à l'heure choisie (13 h 30 et 20 h 30 par défaut),
  seulement si le déjeuner ou le dîner n'est pas encore noté ce jour-là.

## Contrôle « sans porc » (permanent)

`src/domain/pork.ts` est appliqué partout : résultats Open Food Facts (retirés), code-barres (refusé),
aliments personnels et noms de saisie rapide (enregistrement bloqué). Les aliments
Ciqual au statut incertain sont exclus de la recherche. Si la composition d'un produit n'est pas
renseignée, l'appli demande de confirmer avoir vérifié l'étiquette. Ce contrôle n'a pas de réglage.

## Choix faits avec l'utilisatrice

- Palette G : fond blanc, vert profond `#0A3323` (texte, boutons), bleu nuit `#105666` (repères, eau),
  mousse `#839958`, rose `#D3968C` (règles et surfaces, jamais pour du texte).
- Journal alimentaire avec calories, façon Foodvisor . Recettes, menu et courses retirés le 3 nov. 2026 : seulement le nombre de calories.
- Pesée hebdomadaire, courbe lissée ; aucune récompense ne dépend du poids.
- Rituel du lundi au vendredi à 17 h 15, ton selon l'énergie du jour.
