// Le Refuge : une cabane-terrasse dans un grand cerisier. Décor aquarelle (art/refuge-decor.webp), objets posés sur leur
// point de contact, avatar et mascotte au centre, effets d'ambiance qui apparaissent avec le niveau.
// La scène est interactive : chaque emplacement se touche pour y poser, déplacer ou retirer un objet.
import type { ReactNode } from 'react'
import { SLOTS, TAILLES, itemDef, slotLabel, type ItemDef } from '../domain/catalog'
import { placed, palierFor } from '../domain/refuge'
import { artUrl } from './images'
import { OBJET_RATIOS } from './ratios'

/**
 * Point d'un emplacement dans la scène (360 × 260, même rapport que l'image du décor).
 * - Objet posé : (x, y) est le point de contact, au milieu du bas de l'objet, sur la surface du support.
 * - Objet accroché (`hang`) : (x, y) est le centre de l'objet, sur le mur, à la fenêtre ou dans le ciel.
 * - `scale` : proportion de la taille de l'objet (un objet de l'étagère est plus petit qu'un objet de la terrasse).
 */
export interface SlotPoint { x: number; y: number; hang?: boolean; scale: number; /** décalage du repère « + » par rapport au point de contact (défaut : au-dessus de l'objet) */ mdy?: number }

/**
 * Positions mesurées sur l'image du décor (public/art/refuge-decor.webp, grille de 20 unités) :
 * - mur-1, mur-2 : tronc du cerisier (x 300–345, y 100–200) ; mur-3 : la fenêtre ronde de la cabane (x 253–288, y 112–150)
 * - etagere : la planche de la cabane (x 228–296, dessus à y ≈ 163) ; le banc dessous est trop près de la planche pour avoir ses emplacements
 * - table-1 : le dessus de la petite table (x 46–88, y ≈ 190) ; rambarde-1 : la lisse du garde-corps (y ≈ 160)
 * - sol-1 : la terrasse ; plante-1 : coin gauche de la terrasse ; jardin-1/2 : les buissons en bas à droite et à gauche
 * - ciel-1/2 : le ciel dégagé (accroché à un fil).
 * tests/domain/scene.test.ts vérifie que chaque point de contact est bien sur son support.
 */
export const SLOT_POS: Record<string, SlotPoint> = {
  'mur-1': { x: 316, y: 120, hang: true, scale: 0.6 }, 'mur-2': { x: 326, y: 164, hang: true, scale: 0.6 }, 'mur-3': { x: 270, y: 131, hang: true, scale: 0.6, mdy: -9 },
  'etagere-1': { x: 242, y: 163, scale: 0.65 }, 'etagere-2': { x: 284, y: 163, scale: 0.65 },
  'table-1': { x: 66, y: 191, scale: 0.8 },
  'sol-1': { x: 92, y: 246, scale: 0.75 },
  'plante-1': { x: 32, y: 208, scale: 0.65 },
  'jardin-1': { x: 322, y: 252, scale: 0.7 }, 'jardin-2': { x: 34, y: 256, scale: 0.5 },
  'ciel-1': { x: 46, y: 62, hang: true, scale: 0.9 }, 'ciel-2': { x: 170, y: 96, hang: true, scale: 0.8 },
  'rambarde-1': { x: 90, y: 162, scale: 0.7 },
}

/** Centre du repère tactile d'un emplacement (le « + » ou le milieu de l'objet) et rayon de la zone qui réagit au doigt. */
export const HIT_R = 15
export const markerCenter = (p: SlotPoint) => ({ x: p.x, y: p.hang ? p.y + (p.mdy ?? 0) : p.y + (p.mdy ?? -14) })

/** Où se tiennent l'avatar et la mascotte (rien n'est posé dessus : tests/domain/scene.test.ts le vérifie). */
export const AVATAR_BOX = { x: 134, y: 122, size: 110 } // 82 × 110 : x 134–216, y 122–232
export const MASCOTTE_BOX = { x: 222, y: 190, size: 60 } // x 222–282, y 190–250
export const FEET_Y = 232

/** Taille d'affichage d'un objet : hauteur selon sa taille et l'emplacement, largeur selon l'image (plafonnée). */
export function itemBox(item: ItemDef, slot: SlotPoint): { w: number; h: number } {
  let h = TAILLES[item.taille] * slot.scale
  const ratio = OBJET_RATIOS[item.id] ?? 1
  const maxW = 78 * slot.scale + 10
  let w = h * ratio
  if (w > maxW) { w = maxW; h = w / ratio }
  return { w, h }
}

function Fond() {
  // Secours si l'image du décor manque : ciel rose pêche et terrasse de bois
  return (
    <g>
      <defs><linearGradient id="refuge-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fdd9e2" /><stop offset="1" stopColor="#ffe9d6" /></linearGradient></defs>
      <rect width="360" height="260" fill="url(#refuge-ciel)" />
      <path d="M0 150 q90 -30 180 0 t180 0 v110 h-360z" fill="#cfe0c4" />
      <path d="M20 186 h320 l20 74 h-360z" fill="#ecc89c" />
      <rect x="20" y="160" width="300" height="6" rx="3" fill="#d9ad7c" />
    </g>
  )
}

function Ambiance({ level }: { level: number }) {
  const effets = palierFor(level).effets
  return (
    <g aria-hidden="true" pointerEvents="none">
      {effets.includes('lueur') && (
        <>
          <defs><radialGradient id="refuge-lueur" cx="0.15" cy="0.12" r="0.9"><stop offset="0" stopColor="#fff2c4" stopOpacity=".55" /><stop offset="1" stopColor="#fff2c4" stopOpacity="0" /></radialGradient></defs>
          <rect width="360" height="260" fill="url(#refuge-lueur)" />
        </>
      )}
      {effets.includes('etoiles') && [[22, 20], [48, 62], [86, 28], [118, 70], [150, 18], [188, 54], [20, 96], [104, 104]].map(([x, y], i) => (
        <path key={i} className="etoile" style={{ animationDelay: `${(i * 0.7) % 4}s` }} d={`M${x} ${y - 4} l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z`} fill="#fff3b8" />
      ))}
      {effets.includes('lucioles') && [[44, 226], [120, 238], [212, 246], [270, 232], [330, 236], [180, 200]].map(([x, y], i) => (
        <circle key={i} className="luciole" style={{ animationDelay: `${(i * 0.9) % 5}s` }} cx={x} cy={y} r="2" fill="#ffe27a" />
      ))}
      {effets.includes('petales') && [20, 70, 120, 170, 215, 255, 300, 340].map((x, i) => (
        <ellipse key={i} className="petale" style={{ animationDelay: `${-(i * 1.7) % 11}s`, animationDuration: `${9 + (i % 4) * 2}s`, ['--dx' as string]: `${i % 2 ? 36 : -30}px` }} cx={x} cy="-8" rx="3.4" ry="2.2" fill="#f7b6c6" opacity=".85" />
      ))}
    </g>
  )
}

export interface SceneProps {
  equipped: Record<string, string>
  level: number
  editable: boolean
  onSlot: (slotId: string) => void
  /** Emplacement mis en valeur (celui qu'on est en train de choisir) */
  selected?: string | null
  avatar: ReactNode
  companion: ReactNode
}

function ObjetPose({ item, slot, slotId, editable, selected, onSlot }: { item: ItemDef; slot: SlotPoint; slotId: string; editable: boolean; selected: boolean; onSlot: (s: string) => void }) {
  const src = artUrl(`objet-${item.id}`)
  const { w, h } = itemBox(item, slot)
  const top = slot.hang ? slot.y - h / 2 : slot.y - h
  const cx = slot.x
  return (
    <g className="slot-btn" role="button" tabIndex={0} aria-label={`${item.name} (${slotLabel(slotId)})`}
      onClick={() => onSlot(slotId)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSlot(slotId) }}>
      {!slot.hang && <ellipse cx={cx} cy={slot.y} rx={Math.max(8, w * 0.42)} ry="2.6" fill="#4a2340" opacity=".16" />}
      {src
        ? <image href={src} x={cx - w / 2} y={top} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
        : <text x={cx} y={slot.hang ? slot.y + 10 : slot.y - 4} textAnchor="middle" fontSize="30">{item.emoji}</text>}
      {/* zone tactile : la boîte de l'objet (au moins 24 × 24), pour ne pas déborder sur les voisins */}
      <rect x={cx - Math.max(w, 24) / 2} y={(slot.hang ? slot.y : slot.y - h / 2) - Math.max(h, 24) / 2} width={Math.max(w, 24)} height={Math.max(h, 24)} fill="transparent" />
      {editable && selected && <circle cx={cx} cy={slot.hang ? slot.y : slot.y - h / 2} r={Math.max(w, h) / 2 + 4} fill="none" stroke="#b83a66" strokeWidth="2" strokeDasharray="4 3" />}
    </g>
  )
}

function Repere({ slot, slotId, selected, onSlot }: { slot: SlotPoint; slotId: string; selected: boolean; onSlot: (s: string) => void }) {
  const { y: cy } = markerCenter(slot)
  return (
    <g className="slot-btn" role="button" tabIndex={0} aria-label={`Emplacement libre : ${slotLabel(slotId)}`}
      onClick={() => onSlot(slotId)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSlot(slotId) }}>
      <circle cx={slot.x} cy={cy} r={HIT_R} fill="transparent" />
      <circle cx={slot.x} cy={cy} r="12" fill="rgba(255,255,255,.62)" stroke={selected ? '#b83a66' : '#c4878d'} strokeDasharray="4 4" strokeWidth={selected ? 2.4 : 1.8} />
      <path d={`M${slot.x - 4.5} ${cy} h9 M${slot.x} ${cy - 4.5} v9`} stroke="#a86a72" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

export function SceneArt({ equipped, level, editable, onSlot, selected = null, avatar, companion }: SceneProps) {
  const decor = artUrl('refuge-decor')
  const poses = placed(equipped)
  const objets = SLOTS.map(s => ({ id: s.id, slot: SLOT_POS[s.id], item: poses[s.id] ? itemDef(poses[s.id].split('~')[0]) : undefined })).filter(o => o.slot)
  const derriere = objets.filter(o => o.slot.y <= FEET_Y)
  const devant = objets.filter(o => o.slot.y > FEET_Y)
  const dessiner = (o: typeof objets[number]) => o.item
    ? <ObjetPose key={o.id} item={o.item} slot={o.slot} slotId={o.id} editable={editable} selected={selected === o.id} onSlot={onSlot} />
    : editable ? <Repere key={o.id} slot={o.slot} slotId={o.id} selected={selected === o.id} onSlot={onSlot} /> : null
  return (
    <svg viewBox="0 0 360 260" role="img" aria-label="Scène de ton univers">
      {decor ? <image href={decor} width="360" height="260" preserveAspectRatio="xMidYMid slice" /> : <Fond />}
      <Ambiance level={level} />
      {derriere.map(dessiner)}
      {avatar}
      {companion}
      {devant.map(dessiner)}
    </svg>
  )
}
