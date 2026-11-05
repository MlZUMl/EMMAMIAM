# Le Refuge — charte de l'univers visuel

Un seul lieu, centré sur l'avatar : **une cabane-terrasse perchée dans un grand cerisier, à l'heure dorée**.
L'avatar et sa mascotte y vivent ; chaque objet débloqué s'y pose et le lieu s'enrichit. Ce n'est pas une pièce
(ni chambre, ni salon, ni bibliothèque) : c'est un endroit identifiable, ouvert sur le paysage, qui peut accueillir
de nouveaux objets, de nouveaux effets d'ambiance et, un jour, de nouveaux coins.

## 1. Direction artistique
| | |
| --- | --- |
| **Style** | Illustration de livre pour enfants à l'**aquarelle** : lavis doux, bords qui bavent, grain de papier visible, **contours fins brun chaud** (jamais noirs), petits reflets dorés. Le même style que l'avatar et les mascottes. |
| **Palette** | Rose pâle `#F9D6DE`, pêche `#FFD9C2`, crème `#FFF3E6`, bois de miel `#E8C9A8`, vert sauge `#BFD8B8`, lilas `#D9C9E8`, or `#D6AC67`, contour brun `#8A5A4A`. Un objet n'introduit pas de couleur vive hors de cette famille. |
| **Lumière** | Heure dorée, lumière chaude venant du **haut à gauche**. Ombres douces bleutées-lilas, jamais grises ni noires. |
| **Matières** | Bois clair veiné, lin, laine tricotée, céramique émaillée, verre pastel, laiton doux, papier. Toujours en lavis, pas de rendu photo ni de reflets durs. |
| **Détail** | Décor : moyen-élevé (feuillage, veines du bois). Objets : silhouette simple et lisible à 30–60 px, 2 ou 3 détails (motif, reflet, ruban), pas de texte. |
| **Perspective** | Vue **de face**, caméra **légèrement en plongée** (comme l'avatar, de face). Les objets sont vus de face, un peu de dessus. |
| **Cohérence** | Avatar, mascotte, décor et objets partagent palette, contours et lumière. Un objet neuf doit pouvoir être posé à côté de la lampe douce sans qu'on voie qu'il vient d'ailleurs. |

## 2. Formats
| Élément | Fichier | Taille | Remarques |
| --- | --- | --- | --- |
| Décor | `public/art/refuge-decor.webp` | 1152 × 832 (même rapport que la scène 360 × 260) | Aucun objet sur les surfaces : étagère, tables, terrasse, rambarde libres. |
| Objet | `public/art/objet-<id>.webp` | hauteur ≤ 256, fond transparent | Recadré **au plus juste** : le bas de l'image est le point de contact avec le support, le haut est le haut de l'objet. Pas d'ombre au sol (elle est dessinée par l'appli). |
| Avatar, tenues | `avatar-av-*`, `portrait-av-*`, `article-av-*` | hauteur 640 / 256 / 288 | Voir `src/art/images.ts`. |
| Mascottes | `compagnon-<espèce>[-<objet>]` | hauteur 384 | 5 espèces × 22 objets. |

## 3. Comment ça fonctionne
- **Catalogue** : `src/domain/catalog.ts` — 40 objets (`ITEMS`), chacun avec une **catégorie** (mur, étagère, table, terrasse, grande plante, pied de l'arbre, ciel, rambarde) et une **taille** (S, M, L, XL). Les identifiants n'ont pas changé : les déblocages déjà obtenus restent valables.
- **Emplacements** : `SLOTS` (14). Chaque emplacement accepte une catégorie ; un objet se pose dans n'importe quel emplacement de sa catégorie. Leur position à l'écran est dans `src/art/Scene.tsx` (`SLOT_POS`) : point de contact pour un objet posé, centre pour un objet accroché, plus un facteur d'échelle par emplacement (un objet de l'étagère est plus petit qu'un objet de la terrasse).
- **Placement** : `src/domain/refuge.ts` (fonctions pures testées) — poser, déplacer (l'objet quitte son ancien emplacement), retirer, reprise des anciens placements par pièce (`chambre:table` → `refuge:table-1`). Les placements sont enregistrés dans `avatar.equipped` sous `refuge:<emplacement>` ; les tenues de l'avatar (`perso:*`) ne sont jamais touchées.
- **Déblocage** : inchangé, dans `src/domain/rewards.ts` (succès, niveaux, missions mystères). Il n'y a plus de zones à ouvrir.
- **Évolution du lieu** : `PALIERS` (niveau 1, 3, 5, 7, 9) — des effets apparaissent dans le décor : pétales, lueur dorée, lucioles, étoiles (désactivés si l'appareil réduit les animations).
- **Collection** : tous les objets sont visibles ; ceux qui sont obtenus sont en couleur, les autres grisés avec leur condition de déblocage.
- **Sans image** : le décor a un fond vectoriel de secours, et un objet sans image s'affiche avec son emoji.

## 4. Ajouter de nouveaux objets (même style)
1. Ajouter l'objet dans `ITEMS` (identifiant, nom, catégorie, taille, condition de déblocage, emoji) et, si besoin, un emplacement dans `SLOTS` + `SLOT_POS`.
2. Générer l'image avec ComfyUI : `essais-art/outils-comfyui/make_jobs_refuge_objets.py` (une ligne de description par objet, le style est commun) puis `comfy_batch.py` (lot rapide, ~22 s par image).
3. Emballer : `emballer_refuge.py` (détourage sur fond blanc, recadrage au plus juste, WebP, mise à jour de `src/art/ratios.ts`).
4. `npm test` : les tests vérifient que chaque objet a sa catégorie, son image et sa proportion, que les emplacements sont assez espacés et ne tombent ni sur l'avatar ni sur la mascotte.

## 5. Modèles ComfyUI utilisés (vérifiés)
Z-Image Turbo (`z_image_turbo_bf16`, chargé en fp8) avec l'encodeur `qwen_3_4b_fp8_mixed` et le VAE `ae`. Aucun LoRA ni modèle de détourage n'est installé : le détourage se fait sur fond blanc avec Pillow.
Prompt de style commun : *Delicate watercolor washes with visible paper grain, soft bleeding edges, thin fine warm brown ink outlines, soft pale pink and peach pastel palette with honey wood, sage green and lilac accents, tiny gold highlights, gentle warm golden light from the upper left.*
