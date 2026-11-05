// Le Refuge : poser, déplacer et retirer les objets débloqués. Fonctions pures (testées dans tests/domain/refuge.test.ts).
// Les objets posés sont rangés dans avatar.equipped sous la clé `refuge:<emplacement>` ; les clés `perso:*` (tenues,
// coiffures, accessoires de l'avatar) sont à côté et ne sont jamais touchées ici.
import { ITEMS, REFUGE, SLOTS, itemDef, slotDef, slotsOf, type ItemDef, type SlotDef } from './catalog'

export type Equipped = Record<string, string>

export const slotKey = (slotId: string) => `${REFUGE}:${slotId}`
const isRefugeKey = (k: string) => k.startsWith(REFUGE + ':')

/** Anciennes zones (avant le Refuge) : leurs clés d'emplacement ressemblaient à `chambre:table`. */
const ANCIENNES_ZONES = ['chambre', 'jardin', 'bibliotheque', 'atelier', 'balcon']
export const isLegacyKey = (k: string) => ANCIENNES_ZONES.some(z => k.startsWith(z + ':'))

/** Objets posés : emplacement -> identifiant d'objet. */
export function placed(equipped: Equipped): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, id] of Object.entries(equipped)) if (isRefugeKey(k) && slotDef(k.slice(REFUGE.length + 1))) out[k.slice(REFUGE.length + 1)] = id
  return out
}

/** Où est posé cet objet (identifiant d'emplacement), ou undefined. */
export function slotOfItem(equipped: Equipped, itemId: string): string | undefined {
  return Object.entries(placed(equipped)).find(([, id]) => id === itemId)?.[0]
}

/** Les emplacements où l'objet peut aller. */
export function compatibleSlots(item: ItemDef): SlotDef[] { return slotsOf(item.categorie) }

/** Les objets qui peuvent aller dans cet emplacement (tous, y compris ceux qui ne sont pas encore débloqués). */
export function candidatesFor(slotId: string): ItemDef[] {
  const s = slotDef(slotId)
  return s ? ITEMS.filter(i => i.categorie === s.categorie) : []
}

/** Pose un objet dans un emplacement : il quitte son ancien emplacement (un objet n'est qu'à un endroit) ; celui qui occupait la place est rangé. */
export function placeItem(equipped: Equipped, itemId: string, slotId: string): Equipped {
  const item = itemDef(itemId.split('~')[0])
  const slot = slotDef(slotId)
  if (!item || !slot || item.categorie !== slot.categorie) return equipped
  const next: Equipped = { ...equipped }
  for (const [k, v] of Object.entries(next)) if (isRefugeKey(k) && v === item.id) delete next[k]
  next[slotKey(slotId)] = item.id
  return next
}

/** Retire l'objet d'un emplacement (il reste dans la collection). */
export function clearSlot(equipped: Equipped, slotId: string): Equipped {
  const next = { ...equipped }
  delete next[slotKey(slotId)]
  return next
}

/**
 * Reprend les placements d'avant le Refuge (`chambre:table` -> lampe douce…) : chaque objet va dans le premier emplacement
 * libre de sa catégorie ; s'il n'y a plus de place, il reste simplement dans la collection. Ne touche pas aux clés `perso:*`.
 * Renvoie le même objet s'il n'y a rien à reprendre.
 */
export function migrateEquipped(equipped: Equipped): Equipped {
  const anciens = Object.entries(equipped).filter(([k]) => isLegacyKey(k))
  if (!anciens.length) return equipped
  const next: Equipped = {}
  for (const [k, v] of Object.entries(equipped)) if (!isLegacyKey(k)) next[k] = v
  for (const [, id] of anciens) {
    const item = itemDef(id.split('~')[0])
    if (!item || Object.entries(next).some(([k, v]) => isRefugeKey(k) && v === item.id)) continue
    const libre = slotsOf(item.categorie).find(s => !next[slotKey(s.id)])
    if (libre) next[slotKey(libre.id)] = item.id
  }
  return next
}

/** Niveau d'ambiance du Refuge selon le niveau du joueur : de nouveaux effets apparaissent dans le décor. */
export interface Palier { niveau: number; nom: string; effets: ('petales' | 'lueur' | 'lucioles' | 'etoiles')[] }
export const PALIERS: Palier[] = [
  { niveau: 1, nom: 'Une première clairière', effets: [] },
  { niveau: 3, nom: 'Le refuge s\'éveille', effets: ['petales'] },
  { niveau: 5, nom: 'Le refuge prend vie', effets: ['petales', 'lueur'] },
  { niveau: 7, nom: 'Le refuge scintille', effets: ['petales', 'lueur', 'lucioles'] },
  { niveau: 9, nom: 'Le refuge enchanté', effets: ['petales', 'lueur', 'lucioles', 'etoiles'] },
]
export function palierFor(level: number): Palier {
  return [...PALIERS].reverse().find(p => level >= p.niveau) ?? PALIERS[0]
}
export function prochainPalier(level: number): Palier | undefined { return PALIERS.find(p => p.niveau > level) }

export { SLOTS }
