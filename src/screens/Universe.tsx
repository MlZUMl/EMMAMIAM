import { useEffect, useState } from 'react'
import { useApp } from '../app/state'
import { Chips, Segmented, Sheet, TopBar, Progress } from '../ui/components'
import { navigate } from '../lib/router'
import { AvatarArt } from '../art/Avatar'
import { CompanionArt } from '../art/Companion'
import { SceneArt, AVATAR_BOX, MASCOTTE_BOX } from '../art/Scene'
import { artUrl } from '../art/images'
import { ACCESSORIES, CATEGORIES, ITEMS, REFUGE, itemDef, badgeDef, slotLabel, LEVEL_ITEMS, type ItemDef } from '../domain/catalog'
import { candidatesFor, clearSlot, compatibleSlots, migrateEquipped, palierFor, placeItem, placed, prochainPalier, slotOfItem } from '../domain/refuge'
import { levelFor, owned, totalXp } from '../domain/rewards'
import { SPECIES, memoryOf } from '../domain/companion'
import { IconLock, IconUser } from '../ui/icons'
import type { Species } from '../data/types'
import { PointsPill, ShopPanel } from './Shop'
import { avatarLook } from '../domain/shop'

export function Universe({ query }: { query: URLSearchParams }) {
  const { snap } = useApp()
  const avatar = snap.avatar_profiles[0]
  const tab = (query.get('onglet') as 'univers' | 'compagnon' | 'boutique') || 'univers'
  return (
    <>
      <TopBar title="Mon univers" right={<><PointsPill onClick={() => navigate('/univers?onglet=boutique', true)} /><button className="icon-btn" aria-label="Profil et réglages" onClick={() => navigate('/profil')}><IconUser /></button></>} />
      <main className="content">
        <Segmented label="Sections univers" value={tab} onChange={t => navigate('/univers?onglet=' + t, true)} options={[{ id: 'univers', label: 'Univers' }, { id: 'compagnon', label: 'Compagnon' }, { id: 'boutique', label: 'Boutique' }]} />
        {tab === 'boutique' ? <ShopPanel /> : tab === 'compagnon' ? <CompanionPanel /> : avatar ? <World /> : <AvatarCreate />}
      </main>
    </>
  )
}

function AvatarCreate() {
  const { actions } = useApp()
  // Un seul personnage en aquarelle et un seul lieu, le Refuge : l'apparence vient des tenues et coiffures de la boutique
  const character = 'aube', style = 'longs', outfit = 'jogging'
  const [name, setName] = useState('')
  return (
    <>
      <section className="card tint">
        <h2>Crée ton personnage</h2>
        <p className="muted">Voici ton refuge : une cabane dans un grand cerisier. Il s'enrichira avec tes habitudes réelles : chaque séance, chaque verre d'eau, chaque reprise y laisse une trace.</p>
        <div style={{ display: 'grid', placeItems: 'center' }}><AvatarArt character={character} style={style} outfit={outfit} size={170} /></div>
      </section>
      <section className="card">
        <label className="field">Prénom de ton personnage <span className="hint">Facultatif</span><input className="input" value={name} onChange={e => setName(e.target.value)} /></label>
      </section>
      <button className="btn primary block" onClick={() => actions.createAvatar({ character, style, outfit, universe: REFUGE, name: name.trim() || null })}>Entrer dans mon univers</button>
    </>
  )
}

/** Image d'un objet du Refuge (aquarelle), ou son emoji tant qu'elle n'existe pas. */
function Objet({ item, size, locked = false }: { item: ItemDef; size: number; locked?: boolean }) {
  const src = artUrl(`objet-${item.id}`)
  const style = locked ? { filter: 'grayscale(1) opacity(.42)' } : undefined
  return src
    ? <img src={src} alt="" width={size} height={size} style={{ objectFit: 'contain', ...style }} />
    : <span className="em" aria-hidden="true" style={{ fontSize: size * 0.7, lineHeight: 1, ...style }}>{item.emoji}</span>
}

function World() {
  const { snap, actions } = useApp()
  const avatar = snap.avatar_profiles[0]
  const comp = snap.companion_profiles[0]
  const ownedItems = owned(snap, 'item')
  const [slot, setSlot] = useState<string | null>(null)
  const [fiche, setFiche] = useState<string | null>(null)
  const [edit, setEdit] = useState(false)
  const [style, setStyle] = useState(false)
  const xp = totalXp(snap)
  const lvl = levelFor(xp)
  const palier = palierFor(lvl.level)
  const suivant = prochainPalier(lvl.level)
  const poses = placed(avatar.equipped)
  const nextLevelItem = LEVEL_ITEMS[lvl.level + 1] ? itemDef(LEVEL_ITEMS[lvl.level + 1]) : undefined
  const mysteryOwned = snap.reward_grants.filter(g => g.kind === 'item' && itemDef(g.ref.split('~')[0])?.mystery)
  const visibles = ITEMS.filter(i => !i.mystery || ownedItems.has(i.id))

  // Reprise des anciennes pièces : chaque objet déjà posé trouve sa place dans le Refuge (une seule fois)
  useEffect(() => {
    if (migrateEquipped(avatar.equipped) !== avatar.equipped) actions.updateAvatar(c => ({ equipped: migrateEquipped(c.equipped) }))
  }, [avatar.equipped, actions])

  // Poser, déplacer ou retirer : toujours à partir de la version enregistrée la plus récente (voir updateAvatar)
  const poser = (slotId: string, itemId: string | null) =>
    actions.updateAvatar(c => ({ equipped: itemId ? placeItem(c.equipped, itemId, slotId) : clearSlot(c.equipped, slotId) }))

  return (
    <>
      <div className="scene">
        <SceneArt equipped={avatar.equipped} level={lvl.level} editable={edit} onSlot={s => setSlot(s)} selected={slot}
          avatar={<g>{(() => { const l = avatarLook(avatar); return <AvatarArt character={avatar.character} style={l.style} outfit={l.outfit} extras={l.extras} size={AVATAR_BOX.size} x={AVATAR_BOX.x} y={AVATAR_BOX.y} /> })()}</g>}
          companion={comp ? <foreignObject x={MASCOTTE_BOX.x} y={MASCOTTE_BOX.y} width={MASCOTTE_BOX.size} height={MASCOTTE_BOX.size}><CompanionArt species={comp.species} expression="content" color={comp.color} accessories={comp.accessories} size={MASCOTTE_BOX.size} /></foreignObject> : null} />
        <div className="row between" style={{ padding: '10px 14px' }}>
          <span className="small muted">{edit ? 'Touche un emplacement pour y poser un objet.' : `Le refuge de ${avatar.name ?? 'ton personnage'} — ${palier.nom}`}</span>
          <button className={`btn sm ${edit ? 'primary' : 'secondary'}`} onClick={() => setEdit(e => !e)}>{edit ? 'Terminé' : 'Décorer'}</button>
        </div>
      </div>

      <section className="card tint">
        <div className="row between"><div><div className="kicker">Niveau {lvl.level}{avatar.name ? ` · ${avatar.name}` : ''} · {palier.nom}</div><strong>{xp - lvl.current} / {lvl.next - lvl.current} points vers le niveau {lvl.level + 1}</strong></div>
          <button className="btn ghost sm" onClick={() => setStyle(true)}>Tenue</button></div>
        <Progress value={lvl.progress} label="Progression de niveau" />
        {nextLevelItem && <p className="muted small">Au niveau {lvl.level + 1} : {nextLevelItem.emoji} {nextLevelItem.name}</p>}
        {suivant && <p className="muted small">Au niveau {suivant.niveau}, ton refuge deviendra « {suivant.nom} » : de nouvelles lueurs apparaîtront dans le décor.</p>}
        <p className="muted small">Les points viennent de la régularité, des reprises et de la découverte — jamais de la balance.</p>
      </section>

      <section className="card">
        <h2>Ma collection ({ownedItems.size} / {ITEMS.length})</h2>
        <p className="muted small">Les objets en couleur sont à toi : touche-en un pour le poser dans ton refuge. Les objets grisés restent à débloquer.</p>
        {CATEGORIES.map(cat => {
          const dedans = visibles.filter(i => i.categorie === cat.id)
          const obtenus = dedans.filter(i => ownedItems.has(i.id)).length
          return (
            <div key={cat.id} className="collection-cat">
              <div className="row between"><strong>{cat.label}</strong><span className="muted small">{obtenus} / {dedans.length}</span></div>
              <div className="item-grid">
                {dedans.map(i => ownedItems.has(i.id)
                  ? <button key={i.id} className={`item-card ${Object.values(poses).includes(i.id) ? 'on' : ''}`} onClick={() => setFiche(i.id)} aria-label={`${i.name}, ${Object.values(poses).includes(i.id) ? 'posé' : 'dans ta collection'}`}><Objet item={i} size={52} />{i.name}{Object.values(poses).includes(i.id) && <span className="muted" style={{ fontSize: '.68rem' }}>Posé</span>}</button>
                  : <div key={i.id} className="item-card locked" aria-label={`${i.name}, à débloquer : ${i.how}`}><Objet item={i} size={52} locked />{i.name}<span className="muted" style={{ fontSize: '.7rem' }}>{i.how}</span></div>)}
              </div>
            </div>
          )
        })}
        {ITEMS.some(i => i.mystery && !ownedItems.has(i.id)) && <div className="item-grid"><div className="item-card locked"><span className="em" aria-hidden="true">❔</span>Objets mystères<span className="muted" style={{ fontSize: '.7rem' }}>Missions mystères</span></div></div>}
        <p className="muted small">Objets exclusifs des missions mystères : {mysteryOwned.length} trouvé{mysteryOwned.length > 1 ? 's' : ''}. D'autres attendent d'être découverts.</p>
      </section>

      {slot && (
        <Sheet title={`Choisir un objet · ${slotLabel(slot)}`} onClose={() => setSlot(null)}>
          {(() => {
            const possibles = candidatesFor(slot).filter(i => !i.mystery || ownedItems.has(i.id))
            const mien = possibles.filter(i => ownedItems.has(i.id))
            const verrouilles = possibles.filter(i => !ownedItems.has(i.id))
            return (
              <>
                {mien.length ? (
                  <div className="item-grid">
                    {mien.map(i => {
                      const ici = poses[slot] === i.id
                      const ailleurs = Object.entries(poses).find(([s, id]) => id === i.id && s !== slot)?.[0]
                      return <button key={i.id} className={`item-card ${ici ? 'on' : ''}`} onClick={() => { poser(slot, ici ? null : i.id); setSlot(null) }}><Objet item={i} size={52} />{i.name}{ailleurs && <span className="muted" style={{ fontSize: '.68rem' }}>Posé : {slotLabel(ailleurs)}</span>}</button>
                    })}
                  </div>
                ) : <p className="muted">Aucun objet débloqué pour cet emplacement.</p>}
                {verrouilles.length > 0 && (
                  <>
                    <div className="kicker">À débloquer</div>
                    <div className="item-grid">{verrouilles.map(i => <div key={i.id} className="item-card locked"><Objet item={i} size={52} locked />{i.name}<span className="muted" style={{ fontSize: '.7rem' }}>{i.how}</span></div>)}</div>
                  </>
                )}
              </>
            )
          })()}
          {poses[slot] && <button className="btn ghost" onClick={() => { poser(slot, null); setSlot(null) }}>Libérer l'emplacement</button>}
        </Sheet>
      )}

      {fiche && (() => {
        const item = itemDef(fiche)!
        const ou = slotOfItem(avatar.equipped, item.id)
        return (
          <Sheet title={item.name} onClose={() => setFiche(null)}>
            <div style={{ display: 'grid', placeItems: 'center' }}><Objet item={item} size={110} /></div>
            <p className="muted small" style={{ textAlign: 'center' }}>{ou ? `Posé : ${slotLabel(ou)}` : 'Dans ta collection'} · {item.how}</p>
            <div className="kicker">{ou ? 'Déplacer vers' : 'Poser dans'}</div>
            <div className="chips">
              {compatibleSlots(item).map(s => {
                const occupant = poses[s.id] && poses[s.id] !== item.id ? itemDef(poses[s.id])?.name : null
                return <button key={s.id} className={`chip ${ou === s.id ? 'on' : ''}`} aria-pressed={ou === s.id} onClick={() => { poser(s.id, item.id); setFiche(null) }}>{slotLabel(s.id)}{occupant ? ` (remplace ${occupant})` : ''}</button>
              })}
            </div>
            {ou && <button className="btn ghost" onClick={() => { poser(ou, null); setFiche(null) }}>Retirer du refuge</button>}
          </Sheet>
        )
      })()}
      {style && <StyleSheet onClose={() => setStyle(false)} />}
    </>
  )
}

function StyleSheet({ onClose }: { onClose: () => void }) {
  const { snap, actions } = useApp()
  const a = snap.avatar_profiles[0]
  const look = avatarLook(a)
  return (
    <Sheet title="Mon personnage" onClose={onClose}>
      <div style={{ display: 'grid', placeItems: 'center' }}><AvatarArt character={a.character} style={look.style} outfit={look.outfit} extras={look.extras} size={150} /></div>
      <button className="btn secondary" onClick={() => { onClose(); navigate('/univers?onglet=boutique', true) }}>👗 Plus de tenues et de coiffures : la boutique</button>
      <label className="field">Prénom<input className="input" defaultValue={a.name ?? ''} onBlur={e => actions.updateAvatar({ name: e.target.value.trim() || null })} /></label>
    </Sheet>
  )
}

function CompanionPanel() {
  const { snap, actions, today } = useApp()
  const comp = snap.companion_profiles[0]
  const accOwned = owned(snap, 'accessory')
  if (!comp) return null
  const memories = snap.reward_grants.filter(g => g.kind === 'badge' || g.kind === 'item').sort((a, b) => b.granted_at.localeCompare(a.granted_at)).slice(0, 6)
  return (
    <>
      <section className="card tint celebrate">
        <CompanionArt species={comp.species} expression="content" color={comp.color} accessories={comp.accessories} size={150} className="bob" />
        <h2>{comp.name}</h2>
        <p className="muted">{SPECIES.find(s => s.id === comp.species)?.trait}</p>
      </section>
      <section className="card">
        <label className="field">Prénom<input className="input" defaultValue={comp.name} onBlur={e => e.target.value.trim() && actions.updateCompanion({ name: e.target.value.trim() })} /></label>
        <strong>Espèce</strong>
        <Chips label="Espèce" value={comp.species} onChange={(v: Species | null) => v && actions.updateCompanion({ species: v })} options={SPECIES.map(s => ({ id: s.id, label: s.label }))} />
        <strong>Accessoires</strong>
        <div className="item-grid">
          {ACCESSORIES.map(a => {
            const has = accOwned.has(a.id)
            const on = comp.accessories.includes(a.id)
            return (
              <button key={a.id} className={`item-card ${has ? '' : 'locked'} ${on ? 'on' : ''}`} disabled={!has} aria-pressed={on}
                onClick={() => actions.updateCompanion({ accessories: on ? comp.accessories.filter(x => x !== a.id) : [...comp.accessories, a.id] })}>
                <CompanionArt species={comp.species} color={comp.color} accessories={[a.id]} size={48} />
                {a.name}{!has && <span className="muted" style={{ fontSize: '.68rem' }}>{a.how}</span>}
              </button>
            )
          })}
        </div>
        <button className="btn secondary" onClick={() => navigate('/univers?onglet=boutique', true)}>👕 Tenues et coiffures : la boutique</button>
        <strong>Messages</strong>
        <Chips label="Fréquence des messages" value={comp.frequency} onChange={v => v && actions.updateCompanion({ frequency: v })} options={[{ id: 'normal', label: 'Bavard' }, { id: 'discret', label: 'Discret' }]} />
      </section>
      <section className="card">
        <h2>Nos souvenirs</h2>
        {memories.length ? (
          <div className="list">{memories.map(g => {
            const label = g.kind === 'badge' ? '🏅 Badge' : '🎁 Objet'
            const name = g.kind === 'item' ? itemDef(g.ref.split('~')[0])?.name : g.ref
            return <div className="list-item" key={g.id}><div className="grow"><div className="title">{label} : {g.kind === 'badge' ? memoryLabel(g.ref) : name}</div><div className="muted small">{new Date(g.granted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {g.reason}</div></div></div>
          })}</div>
        ) : <p className="muted">Nos premiers souvenirs arriveront avec ta première séance.</p>}
        {memories.length > 0 && <p className="muted small">{memoryOf(snap, today)}</p>}
      </section>
    </>
  )
}

function memoryLabel(id: string) { return badgeDef(id)?.name ?? id }
