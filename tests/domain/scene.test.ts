// Les emplacements du Refuge : chacun a un point dans le cadre, loin des autres (un tap ne tombe jamais sur le voisin),
// et rien n'est posé sur l'avatar ni sur la mascotte.
import { describe, expect, it } from 'vitest'
import { AVATAR_BOX, FEET_Y, HIT_R, MASCOTTE_BOX, SLOT_POS, itemBox, markerCenter } from '../../src/art/Scene'
import { ITEMS, SLOTS, slotsOf } from '../../src/domain/catalog'
import { OBJET_RATIOS } from '../../src/art/ratios'

const AVATAR = { x1: AVATAR_BOX.x, x2: AVATAR_BOX.x + AVATAR_BOX.size * 0.75, y1: AVATAR_BOX.y, y2: FEET_Y }
const MASCOTTE = { x1: MASCOTTE_BOX.x, x2: MASCOTTE_BOX.x + MASCOTTE_BOX.size, y1: MASCOTTE_BOX.y, y2: MASCOTTE_BOX.y + MASCOTTE_BOX.size }
const touche = (a: { x1: number; x2: number; y1: number; y2: number }, b: typeof a) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1

/** Rectangle occupé par un objet posé ou accroché à cet emplacement (le plus grand objet possible de sa catégorie). */
function plusGrand(slotId: string) {
  const pt = SLOT_POS[slotId]
  const cat = SLOTS.find(s => s.id === slotId)!.categorie
  let w = 0, h = 0
  for (const i of ITEMS.filter(i => i.categorie === cat)) { const b = itemBox(i, pt); if (b.h > h) h = b.h; if (b.w > w) w = b.w }
  return pt.hang ? { x1: pt.x - w / 2, x2: pt.x + w / 2, y1: pt.y - h / 2, y2: pt.y + h / 2 } : { x1: pt.x - w / 2, x2: pt.x + w / 2, y1: pt.y - h, y2: pt.y }
}

/**
 * Les supports, mesurés sur l'image du décor (grille de 20 unités, voir src/art/Scene.tsx) : le point de contact d'un
 * objet posé (ou le centre d'un objet accroché) doit tomber dedans, sinon l'objet flotte à côté de son support.
 */
const SUPPORT: Record<string, { x1: number; x2: number; y1: number; y2: number }> = {
  'mur-1': { x1: 300, x2: 350, y1: 100, y2: 140 }, 'mur-2': { x1: 300, x2: 350, y1: 140, y2: 200 }, // tronc du cerisier
  'mur-3': { x1: 253, x2: 288, y1: 112, y2: 150 }, // fenêtre ronde de la cabane
  'etagere-1': { x1: 228, x2: 296, y1: 160, y2: 168 }, 'etagere-2': { x1: 228, x2: 296, y1: 160, y2: 168 }, // planche de la cabane
  'table-1': { x1: 46, x2: 88, y1: 186, y2: 197 }, // dessus de la petite table
  'sol-1': { x1: 60, x2: 200, y1: 205, y2: 258 }, // terrasse
  'plante-1': { x1: 20, x2: 60, y1: 198, y2: 225 }, // coin gauche de la terrasse
  'jardin-1': { x1: 270, x2: 355, y1: 225, y2: 260 }, 'jardin-2': { x1: 0, x2: 62, y1: 235, y2: 260 }, // buissons
  'ciel-1': { x1: 20, x2: 100, y1: 40, y2: 90 }, 'ciel-2': { x1: 130, x2: 210, y1: 92, y2: 112 }, // ciel dégagé
  'rambarde-1': { x1: 40, x2: 200, y1: 156, y2: 166 }, // lisse du garde-corps
}

describe('emplacements du Refuge', () => {
  it('chaque point de contact est sur son support (les objets ne flottent pas à côté)', () => {
    expect(Object.keys(SUPPORT).sort()).toEqual(SLOTS.map(s => s.id).sort())
    for (const [id, r] of Object.entries(SUPPORT)) {
      const p = SLOT_POS[id]
      expect(p.x, `${id} (x)`).toBeGreaterThanOrEqual(r.x1); expect(p.x, `${id} (x)`).toBeLessThanOrEqual(r.x2)
      expect(p.y, `${id} (y)`).toBeGreaterThanOrEqual(r.y1); expect(p.y, `${id} (y)`).toBeLessThanOrEqual(r.y2)
    }
  })
  it('chaque emplacement du catalogue a un point, et il n\'y en a pas en trop', () => {
    expect(Object.keys(SLOT_POS).sort()).toEqual(SLOTS.map(s => s.id).sort())
  })
  it('chaque catégorie d\'objets a au moins un emplacement', () => {
    for (const i of ITEMS) expect(slotsOf(i.categorie).length, i.id).toBeGreaterThan(0)
  })
  it('les repères tactiles sont assez loin les uns des autres : un tap ne tombe jamais sur le voisin', () => {
    const ids = Object.keys(SLOT_POS)
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const p = markerCenter(SLOT_POS[ids[a]]), q = markerCenter(SLOT_POS[ids[b]])
      expect(Math.hypot(p.x - q.x, p.y - q.y), `${ids[a]} / ${ids[b]}`).toBeGreaterThanOrEqual(2 * HIT_R)
    }
  })
  it('le repère et le plus grand objet possible restent dans le cadre 360 × 260', () => {
    for (const id of Object.keys(SLOT_POS)) {
      const m = markerCenter(SLOT_POS[id]); const r = plusGrand(id)
      expect(m.x - HIT_R, id).toBeGreaterThanOrEqual(0); expect(m.x + HIT_R, id).toBeLessThanOrEqual(360)
      expect(m.y - HIT_R, id).toBeGreaterThanOrEqual(0); expect(m.y + HIT_R, id).toBeLessThanOrEqual(260)
      expect(r.x1, `${id} (objet)`).toBeGreaterThanOrEqual(-1); expect(r.x2, `${id} (objet)`).toBeLessThanOrEqual(361)
      expect(r.y1, `${id} (objet)`).toBeGreaterThanOrEqual(-1); expect(r.y2, `${id} (objet)`).toBeLessThanOrEqual(261)
    }
  })
  it('aucun objet, même le plus grand, ne tombe sur l\'avatar ni sur la mascotte', () => {
    for (const id of Object.keys(SLOT_POS)) {
      expect(touche(plusGrand(id), AVATAR), `${id} sur l'avatar`).toBe(false)
      expect(touche(plusGrand(id), MASCOTTE), `${id} sur la mascotte`).toBe(false)
    }
  })
  it('chaque objet a une proportion connue (image emballée) : sinon il serait dessiné carré', () => {
    for (const i of ITEMS) expect(OBJET_RATIOS[i.id], i.id).toBeGreaterThan(0)
  })
})
