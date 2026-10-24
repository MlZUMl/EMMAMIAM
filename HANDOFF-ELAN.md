# Élan — dossier de reprise (à donner à Claude pour bureau)

Écrit le 24 octobre 2026. Propriétaire : Omar (ne parle pas anglais : **tout en français**, appli comprise).
Aucun mot de passe ni clé secrète dans ce fichier : les accès se font par les connecteurs de Claude.

## 1. Ce que c'est
« Élan » : appli web installable (PWA, Android/Chrome) sur les habitudes, la discipline et la perte de poids,
pour **une seule utilisatrice** (la compagne d'Omar). Sport (Ring Fit, danse, vélo, marche), eau, repas (journal
type Foodvisor, recettes « sans porc »), cycle, poids, badges, boutique de points, univers/chambre, compagnon et avatar.

## 2. Liens
| Quoi | Où |
| --- | --- |
| Appli en ligne | https://mlzuml.github.io/EMMAMIAM/elan/ |
| Dépôt GitHub (hébergement Pages, branche `main`, dossier `elan/` = version construite) | https://github.com/MlZUMl/EMMAMIAM (ancien nom : CHINAREADY, redirigé) |
| Code source | ce dossier ; branche `elan-source` (le dépôt EMMAMIAM ne contient que la version construite sous `elan/`) |
| Supabase | projet `elan`, référence `rfuotoxmitsuxmdvovso` (région Paris). Tables avec RLS, fonction Edge `rappels`, tâche pg_cron chaque minute |
| Identité d'installation | manifeste `id: ./?app=elan-v14` (a forcé une installation propre après le renommage du dépôt) |

## 3. État actuel (24 oct. 2026)
En ligne : ambiance « rose pêche » (dégradé rose→pêche, liserés dorés, fleurs, pièces dorées dans la semaine, étincelles),
courbes (poids, eau, activité), jauge d'eau, bouton « Tout remettre à zéro », correctif de synchronisation.

**Non publié** (bloqué : l'accès GitHub de Claude a expiré, erreur 403 à l'envoi) :
- Commit `d530943` sur `elan-source` : la variation du poids « Par semaine » s'affiche dès deux semaines de pesées
  (avant : trois). Testé (191 tests unitaires, 18 parcours de navigateur). Version construite prête dans `dist/`.
- Pour publier : `npm run build`, puis copier `dist/` dans `elan/` du dépôt EMMAMIAM (supprimer d'abord `elan/assets`),
  commit, push sur `main`. La version construite est aussi fournie dans `elan-dist.tar.gz`.
- **Prérequis : reconnecter GitHub** (Réglages de Claude > Connecteurs > GitHub ; ou installer l'application « Claude »
  côté organisation GitHub).

À vérifier par Omar sur son téléphone (jamais testé en réel) : son, vibration, réception des notifications après le
correctif de synchro, nouveaux graphiques, bouton de remise à zéro. La synchro doit revenir à « 0 en attente ».

## 4. Pile technique
Vite 6, React 19, TypeScript 5.8, vite-plugin-pwa (injectManifest, `src/sw.ts`), routeur par hash.
Données : IndexedDB (`src/data/store.ts`) + moteur de synchro (`src/data/sync.ts`, dernier écrit gagne, file d'envoi)
vers Supabase. Notifications : Web Push, règles côté serveur (`elan_private.due_notifications()`, fonction Edge `rappels`).
Tests : Vitest (domaine + base PGlite) et Playwright (écran 360 × 740, `page.clock`). Variable `SHOTS_DIR` pour écrire des captures.

Commandes : `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e` (après build).
Les données d'aliments et de recettes sont dans `public/data` ; scripts de génération dans `scripts/`.
Le README du dépôt détaille l'organisation (dossiers `src/data`, `src/domain`, `src/screens`, `src/art`, `supabase`).

## 5. Règles à ne jamais casser
1. **Jamais de porc** : contrôle permanent (`src/domain/pork.ts`), « sans porc » remplace « halal ».
2. Le cycle n'est **jamais** présenté comme contraception et ne déduit **jamais** une grossesse.
3. Données intimes privées : table séparée avec RLS.
4. Ne jamais annoncer un résultat non testé. Dire ce qui n'a pas pu être vérifié (téléphone réel).
5. **Demander avant** toute action destructive ou irréversible. Les migrations Supabase demandent la confirmation explicite d'Omar.
6. **Ne pas toucher au lien en ligne avant que l'aperçu soit validé** par Omar (c'est lui qui valide les propositions d'abord).
7. Pas de nouvelles dépendances inutiles ; simple, d'abord pour mobile.
8. Ne pas copier de personnages sous licence : seulement l'ambiance des références.
9. Supabase : l'outil refuse les `DELETE` depuis Claude (statut « cancelled ») ; ne pas contourner. Données de test des deux comptes non effacées côté serveur (script SQL donné à Omar).

## 6. Décisions d'Omar (dans l'ordre)
- Abandon des notifications intelligentes, du résumé hebdo et des calories en grand : **seuls les graphiques/jauges** ont été gardés.
- Courbe de poids : **option 2**, variation semaine par semaine (barres : baisse en rose vers le bas, hausse en or vers le haut), placée dans Progrès > Courbes (carte Poids, bascule « Poids | Par semaine ») et dans Corps.
- Ambiance : **A « rose pêche »**, **tous les motifs**. Inspirée d'une illustration de charme du Nouvel An chinois (rose/pêche, liserés dorés, fleurs, pièces, étincelles). Le personnage de cette illustration est sous licence : ne pas le reproduire.
- Plusieurs essais d'avatar/chat en dessin vectoriel (voir branches) : **abandonnés**, puis :
- **24 oct. : Omar inverse sa règle « pas d'illustrations ComfyUI »** et veut avatar, compagnons et tenues en **images ComfyUI aquarelle**
  (enfants en capuche d'animal, style de sa référence : tons rosés doux, pastel, aquarelle). Il utilise son propre ComfyUI (Windows 11, GPU AMD, déjà lancé) via Claude pour bureau relié à la session.
- Veut aussi un **compteur de pas lié au téléphone** : non faisable en PWA (Health Connect réservé aux vraies applis Android). Proposé : saisie quotidienne des pas, ou emballage Android natif (gros chantier). Pas de décision.
- Idée en attente : import de recette depuis une capture d'écran (1. coller le texte copié → analyse ; 2. lecture par IA via fonction Supabase, coût à l'image ; 3. OCR sur le téléphone). Recommandé : 1 d'abord. Pas de décision.

## 7. Tâche à reprendre : images ComfyUI
Mécanisme déjà présent : `public/config.js` peut contenir `art: { "avatar": "art/avatar.png", "compagnon-chat": "art/chat.png", … }`.
`src/art/Avatar.tsx` et `src/art/Companion.tsx` remplacent alors le dessin vectoriel par l'image. Les tenues/coiffures de la boutique
sont aujourd'hui des **calques vectoriels** (ne fonctionnent pas avec une image unique) ; ids du catalogue dans `src/domain/shop.ts`
(15 tenues `av-*`, 10 coiffures, 6 accessoires ; compagnon : 22 objets).

Plan proposé (à valider avec Omar) :
1. Générer 1 à 2 personnages **originaux** de test (fond transparent), les lui montrer.
2. Après accord : compagnons (5 espèces : chat, lapin, nuage, créature, pousse), avatar de base, puis une image par tenue ; décider avec lui du sort des coiffures et accessoires (calques simples ou intégrés).
3. Optimiser (WebP, tailles raisonnables) pour que l'appli reste légère sur téléphone ; garder le dessin vectoriel en secours.
4. Aucune publication avant validation d'Omar.
Le prompt de référence : enfant mignon en capuche d'animal, aquarelle douce, contours fins, tons rose pâle/pêche, fond transparent, ombre légère.
Omar a aussi un outil d'écriture de prompts (« Hermes », Ollama local) : lui demander les prompts s'il préfère.

## 8. Branches locales (dans l'archive `elan.bundle`)
- `elan-source` : version publiée + correctif poids `d530943` (la plus à jour, **à utiliser**).
- `da-rose-peche` : DA seule (déjà incluse dans `elan-source`).
- `perso-porte-bonheur` : essai de chat porte-bonheur + avatar « Pivoine » en vectoriel, avec migration `0009_compagnon_fortune.sql` **non appliquée** (abandonné).
- `avatar-portrait` : essai de portrait en arche + avatar figurine 2D en vectoriel (abandonné).
