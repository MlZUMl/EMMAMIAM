// Catalogues : le Refuge (lieu unique) et ses objets, accessoires du compagnon, badges.
// Les conditions de déblocage sont vérifiées dans rewards.ts à partir des données enregistrées.

/**
 * Le Refuge : l'univers est un lieu unique (une cabane-terrasse dans un grand cerisier). Les objets se rangent par
 * catégorie ; chaque emplacement du lieu accepte une catégorie. L'objet débloqué se pose dans n'importe quel
 * emplacement de sa catégorie. Les positions à l'écran sont dans src/art/Scene.tsx.
 */
export type Categorie = 'mur' | 'etagere' | 'table' | 'sol' | 'plante' | 'jardin' | 'ciel' | 'rambarde'

export const CATEGORIES: { id: Categorie; label: string; hint: string }[] = [
  { id: 'mur', label: 'Au mur et sur le tronc', hint: 'Cadres, horloge, rideaux' },
  { id: 'etagere', label: "Sur l'étagère", hint: 'Petits objets' },
  { id: 'table', label: 'Sur la table', hint: 'Lampe, tasse, carnet' },
  { id: 'sol', label: 'Sur la terrasse', hint: 'Tapis, fauteuil, coussins' },
  { id: 'plante', label: 'Les grandes plantes', hint: 'Monstera, bonsaï' },
  { id: 'jardin', label: "Au pied de l'arbre", hint: 'Fontaine, fleurs, lanterne' },
  { id: 'ciel', label: 'Dans le ciel', hint: 'Étoiles, guirlandes, arc-en-ciel' },
  { id: 'rambarde', label: 'Sur la rambarde', hint: 'Télescope, souvenirs' },
]

export interface SlotDef { id: string; categorie: Categorie }
/** Les emplacements du Refuge (leur position à l'écran est dans src/art/Scene.tsx). */
export const SLOTS: SlotDef[] = [
  { id: 'mur-1', categorie: 'mur' }, { id: 'mur-2', categorie: 'mur' }, { id: 'mur-3', categorie: 'mur' },
  { id: 'etagere-1', categorie: 'etagere' }, { id: 'etagere-2', categorie: 'etagere' },
  { id: 'table-1', categorie: 'table' },
  { id: 'sol-1', categorie: 'sol' },
  { id: 'plante-1', categorie: 'plante' },
  { id: 'jardin-1', categorie: 'jardin' }, { id: 'jardin-2', categorie: 'jardin' },
  { id: 'ciel-1', categorie: 'ciel' }, { id: 'ciel-2', categorie: 'ciel' },
  { id: 'rambarde-1', categorie: 'rambarde' },
]
export const REFUGE = 'refuge'
/** Nom d'un emplacement pour l'écran : « Sur la table 2 », « Au mur 1 »… */
export function slotLabel(slotId: string): string {
  const s = SLOTS.find(x => x.id === slotId)
  if (!s) return slotId
  const cat = CATEGORIES.find(c => c.id === s.categorie)?.label ?? s.categorie
  const memes = SLOTS.filter(x => x.categorie === s.categorie)
  return memes.length > 1 ? `${cat} ${memes.indexOf(s) + 1}` : cat
}
export const slotDef = (id: string) => SLOTS.find(s => s.id === id)
export const slotsOf = (c: Categorie) => SLOTS.filter(s => s.categorie === c)

/** Taille d'affichage d'un objet dans la scène : hauteur en unités de la scène (360 × 260). */
export type Taille = 'S' | 'M' | 'L' | 'XL'
export const TAILLES: Record<Taille, number> = { S: 30, M: 44, L: 64, XL: 104 }

export interface ItemDef { id: string; name: string; categorie: Categorie; taille: Taille; how: string; emoji: string; mystery?: boolean }

export const ITEMS: ItemDef[] = [
  { id: 'lampe-douce', name: 'Lampe douce', categorie: 'table', taille: 'M', how: 'Offerte à l\'arrivée', emoji: '🪔' },
  { id: 'tapis-rond', name: 'Tapis rond', categorie: 'sol', taille: 'L', how: 'Offert à l\'arrivée', emoji: '🟣' },
  { id: 'tapis-yoga', name: 'Tapis de yoga', categorie: 'sol', taille: 'L', how: 'Ta première séance', emoji: '🧘‍♀️' },
  { id: 'radio', name: 'Radio rétro', categorie: 'etagere', taille: 'S', how: '5 séances terminées', emoji: '📻' },
  { id: 'horloge', name: 'Horloge de 17 h 15', categorie: 'mur', taille: 'M', how: '10 rendez-vous honorés', emoji: '🕰️' },
  { id: 'pothos', name: 'Pothos', categorie: 'mur', taille: 'M', how: 'Ton premier objectif d\'eau atteint', emoji: '🪴' },
  { id: 'monstera', name: 'Monstera', categorie: 'plante', taille: 'L', how: 'Objectif d\'eau atteint 7 jours', emoji: '🌿' },
  { id: 'fontaine', name: 'Petite fontaine', categorie: 'jardin', taille: 'L', how: 'Objectif d\'eau atteint 21 jours', emoji: '⛲' },
  { id: 'panier-fruits', name: 'Panier de fruits', categorie: 'etagere', taille: 'S', how: 'Repas notés 3 jours', emoji: '🧺' },
  { id: 'livre-recettes', name: 'Livre de cuisine', categorie: 'etagere', taille: 'S', how: 'Repas notés 14 jours', emoji: '📖' },
  { id: 'epices', name: 'Étagère à épices', categorie: 'mur', taille: 'M', how: 'Repas notés 30 jours', emoji: '🫙' },
  { id: 'carnet', name: 'Carnet fleuri', categorie: 'table', taille: 'S', how: 'Ton premier check-in', emoji: '📔' },
  { id: 'tasse', name: 'Tasse fumante', categorie: 'table', taille: 'S', how: '10 check-ins', emoji: '☕' },
  { id: 'boite-souvenirs', name: 'Boîte à souvenirs', categorie: 'table', taille: 'S', how: 'Ta première capsule temporelle', emoji: '🎁' },
  { id: 'cadre-photo', name: 'Cadre souvenir', categorie: 'mur', taille: 'M', how: 'Ouvrir une capsule', emoji: '🖼️' },
  { id: 'lanterne', name: 'Lanterne du retour', categorie: 'jardin', taille: 'M', how: 'Reprendre après une pause', emoji: '🏮' },
  { id: 'etoile', name: 'Étoile filante', categorie: 'ciel', taille: 'M', how: 'Ta première mission', emoji: '🌠' },
  { id: 'tableau-liege', name: 'Tableau en liège', categorie: 'mur', taille: 'L', how: 'Ton premier bilan de semaine', emoji: '📌' },
  { id: 'calendrier', name: 'Calendrier mural', categorie: 'mur', taille: 'M', how: '4 bilans de semaine', emoji: '🗓️' },
  { id: 'bouillotte', name: 'Bouillotte', categorie: 'table', taille: 'S', how: 'Suivre ton cycle une première fois', emoji: '🫖' },
  { id: 'bougie', name: 'Bougie apaisante', categorie: 'etagere', taille: 'S', how: 'Prendre un vrai jour de repos', emoji: '🕯️' },
  { id: 'anneau', name: 'Anneau d\'aventure', categorie: 'mur', taille: 'M', how: 'Une séance de Ring Fit', emoji: '⭕' },
  { id: 'boule-facettes', name: 'Boule à facettes', categorie: 'ciel', taille: 'M', how: 'Une séance de danse', emoji: '🪩' },
  { id: 'velo-mini', name: 'Vélo miniature', categorie: 'rambarde', taille: 'M', how: 'Une sortie à vélo', emoji: '🚲' },
  { id: 'baskets', name: 'Baskets', categorie: 'sol', taille: 'S', how: 'Une marche enregistrée', emoji: '👟' },
  // Débloqués en montant de niveau
  { id: 'coussin', name: 'Coussin moelleux', categorie: 'sol', taille: 'M', how: 'Niveau 2', emoji: '🛋️' },
  { id: 'rideaux', name: 'Rideaux poudrés', categorie: 'mur', taille: 'L', how: 'Niveau 3', emoji: '🪟' },
  { id: 'banc-bois', name: 'Banc en bois', categorie: 'sol', taille: 'L', how: 'Niveau 4', emoji: '🪑' },
  { id: 'fauteuil', name: 'Fauteuil prune', categorie: 'sol', taille: 'L', how: 'Niveau 5', emoji: '💺' },
  { id: 'cerisier', name: 'Cerisier', categorie: 'jardin', taille: 'XL', how: 'Niveau 6', emoji: '🌸' },
  { id: 'guirlande', name: 'Guirlande lumineuse', categorie: 'ciel', taille: 'L', how: 'Niveau 7', emoji: '✨' },
  { id: 'coussins-sol', name: 'Coussins de sol', categorie: 'sol', taille: 'M', how: 'Niveau 8', emoji: '🟪' },
  { id: 'massif-roses', name: 'Massif de roses', categorie: 'jardin', taille: 'M', how: 'Niveau 9', emoji: '🌹' },
  { id: 'telescope', name: 'Télescope', categorie: 'rambarde', taille: 'L', how: 'Niveau 10', emoji: '🔭' },
  // Exclusifs des missions mystères (dans cet ordre)
  { id: 'cristal-rose', name: 'Cristal rose', categorie: 'etagere', taille: 'S', how: 'Mission mystère', emoji: '💎', mystery: true },
  { id: 'lune-papier', name: 'Lune en papier', categorie: 'ciel', taille: 'M', how: 'Mission mystère', emoji: '🌙', mystery: true },
  { id: 'theiere', name: 'Théière fleurie', categorie: 'table', taille: 'S', how: 'Mission mystère', emoji: '🫖', mystery: true },
  { id: 'bonsai', name: 'Bonsaï', categorie: 'plante', taille: 'M', how: 'Mission mystère', emoji: '🌳', mystery: true },
  { id: 'coquillage', name: 'Coquillage nacré', categorie: 'rambarde', taille: 'S', how: 'Mission mystère', emoji: '🐚', mystery: true },
  { id: 'arc-en-ciel', name: 'Arc-en-ciel de verre', categorie: 'ciel', taille: 'L', how: 'Mission mystère', emoji: '🌈', mystery: true },
]

export const LEVEL_ITEMS: Record<number, string> = {
  2: 'coussin', 3: 'rideaux', 4: 'banc-bois', 5: 'fauteuil', 6: 'cerisier', 7: 'guirlande', 8: 'coussins-sol', 9: 'massif-roses', 10: 'telescope',
}

export const MYSTERY_ITEMS = ITEMS.filter(i => i.mystery).map(i => i.id)

export interface AccessoryDef { id: string; name: string; how: string }
export const ACCESSORIES: AccessoryDef[] = [
  { id: 'noeud', name: 'Petit nœud', how: 'Offert à l\'arrivée' },
  { id: 'echarpe', name: 'Écharpe tricotée', how: '5 rendez-vous honorés' },
  { id: 'chapeau', name: 'Chapeau de paille', how: 'Objectif d\'eau atteint 7 jours' },
  { id: 'lunettes', name: 'Lunettes rondes', how: 'Repas notés 10 jours' },
  { id: 'couronne', name: 'Couronne de fleurs', how: 'Niveau 5' },
  { id: 'cape', name: 'Cape étoilée', how: 'Un badge secret' },
]

export interface BadgeDef { id: string; name: string; description: string; secret: boolean; emoji: string }

export const BADGES: BadgeDef[] = [
  { id: 'premier-pas', name: 'Le premier pas', description: 'Commencer une nouvelle habitude.', secret: false, emoji: '👣' },
  { id: 'rdv-5', name: 'Le rendez-vous avec soi-même', description: 'Honorer 5 rendez-vous sportifs.', secret: false, emoji: '💗' },
  { id: 'rdv-20', name: 'Fidèle à soi', description: 'Honorer 20 rendez-vous sportifs.', secret: false, emoji: '🌷' },
  { id: 'rdv-50', name: 'Ancrée', description: 'Honorer 50 rendez-vous sportifs.', secret: false, emoji: '🌳' },
  { id: 'semaine-complete', name: 'Semaine complète', description: 'Honorer tous les rendez-vous prévus d\'une semaine.', secret: false, emoji: '🗓️' },
  { id: 'hydratation-7', name: 'Bien hydratée', description: 'Atteindre ton objectif d\'eau 7 jours.', secret: false, emoji: '💧' },
  { id: 'journal-14', name: 'Carnet fidèle', description: 'Noter tes repas 14 jours.', secret: false, emoji: '📒' },
  { id: 'ecoute-de-soi', name: 'À l\'écoute de soi', description: 'Faire 10 check-ins d\'énergie.', secret: false, emoji: '🫶' },
  { id: 'capsule-1', name: 'Gardienne du temps', description: 'Créer ta première capsule temporelle.', secret: false, emoji: '⏳' },
  { id: 'capsule-ouverte', name: 'Lettre reçue', description: 'Ouvrir une capsule temporelle.', secret: false, emoji: '💌' },
  { id: 'bilan-4', name: 'Regard bienveillant', description: 'Faire 4 bilans de semaine.', secret: false, emoji: '🔎' },
  { id: 'explorateur', name: 'Exploratrice', description: 'Essayer 4 types d\'activité différents.', secret: false, emoji: '🧭' },
  { id: 'missions-10', name: 'Missionnaire', description: 'Réussir 10 missions du jour.', secret: false, emoji: '🎯' },
  { id: 'niveau-5', name: 'Univers en fleur', description: 'Atteindre le niveau 5.', secret: false, emoji: '🌼' },
  { id: 'repos-assume', name: 'Le repos fait partie du plan', description: 'Prendre 3 vrais jours de repos quand ton corps le demande.', secret: false, emoji: '🌙' },
  // Badges secrets : leur existence se découvre au déblocage
  { id: 'retour-gagnant', name: 'Le retour gagnant', description: 'Reprendre ton rendez-vous après une interruption.', secret: true, emoji: '🔁' },
  { id: 'petite-victoire', name: 'La petite victoire', description: 'Faire une séance plus courte plutôt que renoncer.', secret: true, emoji: '🌱' },
  { id: 'pluie-ou-soleil', name: 'Pluie ou soleil', description: 'Honorer ton rendez-vous un jour où tu te sentais épuisée.', secret: true, emoji: '🌦️' },
  { id: 'deuxieme-souffle', name: 'Le deuxième souffle', description: 'Reprendre 3 fois après une pause.', secret: true, emoji: '🌬️' },
  { id: 'fidele-vendredi', name: 'Fidèle du vendredi', description: 'Honorer ton rendez-vous 4 vendredis.', secret: true, emoji: '🎈' },
  { id: 'chasseuse-mysteres', name: 'Chasseuse de mystères', description: 'Réussir 3 missions mystères.', secret: true, emoji: '🔮' },
  { id: 'lever-soleil', name: 'Lever de soleil', description: 'Boire un verre d\'eau avant 9 h, 5 jours différents.', secret: true, emoji: '🌅' },
  { id: 'constance-douce', name: 'La constance douce', description: 'Tenir la version minimale 4 fois dans la même semaine.', secret: true, emoji: '🫧' },
  { id: 'joueuse', name: 'Joueuse', description: '5 séances de Ring Fit.', secret: true, emoji: '🕹️' },
  { id: 'cent-verres', name: '25 litres', description: '25 litres d\'eau bus au total.', secret: true, emoji: '🥛' },
]

export function itemDef(id: string) { return ITEMS.find(i => i.id === id) }
export function badgeDef(id: string) { return BADGES.find(b => b.id === id) }
