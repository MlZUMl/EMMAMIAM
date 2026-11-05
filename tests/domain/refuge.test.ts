// Le Refuge : catalogue cohérent, pose / déplacement / retrait, reprise des anciens placements, paliers d'ambiance.
import { describe, expect, it } from 'vitest'
import { CATEGORIES, ITEMS, LEVEL_ITEMS, MYSTERY_ITEMS, SLOTS, TAILLES, itemDef } from '../../src/domain/catalog'
import { PALIERS, candidatesFor, clearSlot, compatibleSlots, migrateEquipped, palierFor, placeItem, placed, prochainPalier, slotKey, slotOfItem } from '../../src/domain/refuge'

describe('catalogue du Refuge', () => {
  it('chaque objet a une catégorie qui a au moins un emplacement, et une taille connue', () => {
    for (const i of ITEMS) {
      expect(CATEGORIES.some(c => c.id === i.categorie), i.id).toBe(true)
      expect(compatibleSlots(i).length, i.id).toBeGreaterThan(0)
      expect(TAILLES[i.taille], i.id).toBeGreaterThan(0)
    }
  })
  it('chaque emplacement a une catégorie connue et au moins un objet possible ; pas de doublon', () => {
    expect(new Set(SLOTS.map(s => s.id)).size).toBe(SLOTS.length)
    for (const s of SLOTS) { expect(CATEGORIES.some(c => c.id === s.categorie), s.id).toBe(true); expect(candidatesFor(s.id).length, s.id).toBeGreaterThan(0) }
  })
  it('les objets débloqués par niveau ou par mission mystère existent (le déblocage reste valable)', () => {
    for (const id of [...Object.values(LEVEL_ITEMS), ...MYSTERY_ITEMS]) expect(itemDef(id), id).toBeDefined()
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length)
    expect(ITEMS.length).toBe(40)
  })
})

describe('poser, déplacer, retirer', () => {
  it('pose un objet dans un emplacement compatible', () => {
    const e = placeItem({}, 'lampe-douce', 'table-1')
    expect(e).toEqual({ [slotKey('table-1')]: 'lampe-douce' })
    expect(slotOfItem(e, 'lampe-douce')).toBe('table-1')
  })
  it('refuse un emplacement d\'une autre catégorie', () => {
    expect(placeItem({}, 'lampe-douce', 'ciel-1')).toEqual({})
    expect(placeItem({}, 'inconnu', 'table-1')).toEqual({})
  })
  it('déplace : l\'objet n\'est qu\'à un seul endroit', () => {
    let e = placeItem({}, 'horloge', 'mur-1')
    e = placeItem(e, 'horloge', 'mur-2')
    expect(placed(e)).toEqual({ 'mur-2': 'horloge' })
  })
  it('remplace l\'objet qui occupait la place sans toucher aux autres', () => {
    let e = placeItem({}, 'horloge', 'mur-1')
    e = placeItem(e, 'cadre-photo', 'mur-2')
    e = placeItem(e, 'tableau-liege', 'mur-1')
    expect(placed(e)).toEqual({ 'mur-1': 'tableau-liege', 'mur-2': 'cadre-photo' })
  })
  it('retire un objet : l\'emplacement est libre', () => {
    const e = clearSlot(placeItem({}, 'radio', 'etagere-1'), 'etagere-1')
    expect(placed(e)).toEqual({})
  })
  it('ne touche jamais aux tenues, coiffures et accessoires de l\'avatar', () => {
    const base = { 'perso:tenue': 'av-sport', 'perso:coiffure': 'av-queue' }
    const e = clearSlot(placeItem(base, 'radio', 'etagere-1'), 'etagere-1')
    expect(e).toMatchObject(base)
    expect(placeItem(base, 'radio', 'etagere-1')).toMatchObject(base)
  })
  it('un objet exclusif d\'une mission mystère répétée (id~n) se pose comme l\'objet de base', () => {
    expect(placed(placeItem({}, 'cristal-rose~1', 'etagere-2'))).toEqual({ 'etagere-2': 'cristal-rose' })
  })
})

describe('reprise des anciennes pièces', () => {
  it('range chaque objet dans un emplacement libre de sa catégorie, sans perdre les tenues', () => {
    const avant = { 'chambre:table': 'lampe-douce', 'chambre:sol': 'tapis-rond', 'jardin:eau': 'fontaine', 'balcon:ciel': 'etoile', 'perso:tenue': 'av-sport' }
    const apres = migrateEquipped(avant)
    expect(placed(apres)).toEqual({ 'table-1': 'lampe-douce', 'sol-1': 'tapis-rond', 'jardin-1': 'fontaine', 'ciel-1': 'etoile' })
    expect(apres['perso:tenue']).toBe('av-sport')
    expect(Object.keys(apres).some(k => /^(chambre|jardin|balcon):/.test(k))).toBe(false)
  })
  it('garde dans la collection ce qui ne tient plus (pas de plus de place) et ne duplique rien', () => {
    const avant = { 'chambre:a': 'radio', 'atelier:b': 'bougie', 'bibliotheque:c': 'livre-recettes', 'jardin:d': 'radio' }
    expect(Object.keys(placed(migrateEquipped(avant))).length).toBe(2)
  })
  it('ne change rien quand il n\'y a plus d\'ancien placement', () => {
    const e = { [slotKey('table-1')]: 'lampe-douce' }
    expect(migrateEquipped(e)).toBe(e)
  })
})

describe('paliers d\'ambiance', () => {
  it('de nouveaux effets apparaissent avec le niveau, jamais moins qu\'avant', () => {
    let avant = -1
    for (let niveau = 1; niveau <= 12; niveau++) { const n = palierFor(niveau).effets.length; expect(n).toBeGreaterThanOrEqual(avant); avant = n }
    expect(palierFor(1).effets).toEqual([])
    expect(palierFor(12).effets).toEqual(PALIERS.at(-1)!.effets)
  })
  it('annonce le prochain palier, et plus rien au dernier', () => {
    expect(prochainPalier(1)?.niveau).toBe(3)
    expect(prochainPalier(10)).toBeUndefined()
  })
})
