# Prompt de discussion — projet ÉLAN

> À coller au début d'une conversation avec Claude (ou à lui donner à lire : « lis PROMPT-ELAN.md »).
> Mis à jour le 25 octobre 2026. Les détails techniques complets sont dans `HANDOFF-ELAN.md`.

---

## Qui je suis, comment me parler
Je suis Omar. Je ne parle pas anglais : **réponds toujours en français**, simplement, sans jargon. L'appli aussi est 100 % en français.
Je pilote, tu exécutes : propose, montre-moi, et attends mon accord avant de continuer sur un gros chantier.

## Le projet
**Élan** est une appli web installable (PWA, Android/Chrome) sur les habitudes, la discipline et la perte de poids, pour **une seule utilisatrice** : ma compagne. Elle contient : sport (Ring Fit, danse, vélo, marche), eau, repas (journal + recettes sans porc), cycle, poids, badges, boutique de points, **univers** (pièces à décorer), **compagnon** (mascotte) et **avatar**.

- Code : `C:\Users\omara\Downloads\pilhan\elan`, branche `elan-source`.
- Pile : Vite, React 19, TypeScript, PWA, IndexedDB + synchro Supabase. Tests : Vitest + Playwright.
- En ligne : https://mlzuml.github.io/EMMAMIAM/elan/ (rien de nouveau n'y est publié depuis le 24 oct.).

## Règles à ne jamais casser
1. **Jamais de porc** (contrôle permanent dans `src/domain/pork.ts`).
2. Le cycle n'est jamais présenté comme contraception et ne déduit jamais une grossesse.
3. Données intimes privées (table séparée, RLS).
4. **Ne jamais dire « c'est réglé » sans l'avoir testé.** Dis ce que tu n'as pas pu vérifier (téléphone réel).
5. **Demande-moi avant** toute action destructive ou irréversible (suppression, migration Supabase, etc.).
6. **Ne rien publier** (ni `git push`, ni mise en ligne) tant que je n'ai pas validé l'aperçu.
7. Pas de dépendance inutile ; simple, d'abord pour mobile (écran 360 × 740).
8. Pas de personnage sous licence : seulement l'ambiance des références.

## Univers visuel (la référence pour toute image)
Style **aquarelle douce** générée avec **mon ComfyUI** (Windows 11, GPU AMD RX 7900 GRE 16 Go) : tons rose pâle / pêche, pastel, contours fins, fond transparent, ombre légère, enfants en capuche d'animal.
- **Avatar de base : le « lapin 1 »** — fille en cape rose à oreilles de lapin tombantes.
- **5 compagnons** : chat, lapin, nuage, créature, pousse.
- Tenues, coiffures, accessoires et objets de mascotte sont déjà en aquarelle (`public/art/`, 177 fichiers WebP).
- Génération : je veux **~25 s par image** (réglages rapides déjà trouvés : fp8, encoder tous les textes d'abord, un seul lot à la fois, scripts dans `essais-art/outils-comfyui/`). Ne lance jamais deux lots en parallèle.

## Ce qui est fait, et ce qui ne l'est pas encore
- Fait localement (non publié) : avatar + boutique avatar + mascottes aquarelle, correction du bug de pose rapide d'objets (`updateAvatar` avec fonction).
- **Le décor des pièces et les objets de l'univers sont encore en dessin vectoriel + emojis** : `src/art/Scene.tsx` dessine le fond en SVG et les objets en emoji. Les clés `zone-<pièce>` et `objet-<id>` existent dans `config.js` mais ne sont pas branchées sur `artUrl()` ni fournies.

## Deux chantiers ouverts (c'est de ça qu'on parle maintenant)

### 1. Les objets ne se posent pas sur leur support
Dans « Univers de départ » / ma pièce, quand je choisis un objet pour la table (par exemple la lampe douce), il apparaît **sur l'image de la table mais pas sur la table elle-même** ; c'est pareil pour les autres objets.

Cause trouvée (à confirmer par un test dans le navigateur) : chaque emplacement n'a qu'un point (`SLOT_POS` dans `Scene.tsx`) et l'objet est dessiné **centré** sur ce point, pas **posé** dessus. Pour la table de la chambre, le plateau est à y = 160 mais l'objet est dessiné jusqu'à y ≈ 180–188 : il flotte devant les pieds de la table au lieu d'être sur le plateau. Les autres emplacements ont le même défaut ; je n'en ai vérifié qu'un seul pour l'instant.

Ce que je veux : **chaque objet repose réellement sur son support** (table, étagère, lit, sol, banc, rambarde…), avec son ombre au bon endroit, et qu'il reste correct si l'image du décor change.
Piste : pour chaque emplacement, définir un point de contact (centre du bord bas de l'objet = surface du support) plutôt qu'un centre, avec une taille maximale par emplacement ; ancrer l'objet par le bas ; vérifier visuellement les 5 pièces (chambre, jardin, bibliothèque, atelier, balcon) en 360 × 740.

### 2. Les objets générés doivent être dans l'univers de mes avatars
Les objets (lampe, plantes, radio, tapis, livres, fontaine, etc. — la liste est dans `src/domain/catalog.ts`) doivent être **de vraies illustrations aquarelle** dans le même style que l'avatar et les compagnons, au lieu d'emojis ; et les fonds de pièces aussi, pour que tout forme un seul monde.
Piste : pour chaque pièce, un fond aquarelle avec des supports clairement lisibles (table, étagère, lit…) dont on connaît les coordonnées ; pour chaque objet, une image carrée à fond transparent dont le bas touche le support. Brancher les clés `zone-*` et `objet-*` sur le même mécanisme que le reste (`artUrl`, test des fichiers présents, mise en cache hors-ligne).
Ordre conseillé : d'abord la correction de pose (chantier 1), puis 1 pièce complète en essai (chambre), que je valide, puis les autres.

## Comment je veux qu'on travaille
- Commence par me dire en 2–3 phrases ce que tu as compris et ce que tu vas faire.
- Pour tout visuel : montre-moi une planche d'essai avant de produire en série.
- Après chaque changement : lance `npm test` et les parcours navigateur, et dis-moi le résultat réel.
- Garde le dessin vectoriel en secours si une image manque.
- En fin de séance, mets à jour `HANDOFF-ELAN.md` (ou ta mémoire) pour pouvoir reprendre sans que je réexplique.

## Questions qui restent ouvertes pour moi
- Veux-tu garder les 5 pièces ou commencer par la chambre seule ?
- Les objets déjà posés par la compagne doivent-ils rester en place après le changement de positions ? (par défaut : oui, les identifiants d'emplacements ne changent pas)
