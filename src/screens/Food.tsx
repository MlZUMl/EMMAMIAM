import { useState } from 'react'
import { useApp } from '../app/state'
import { Sheet, TopBar } from '../ui/components'
import { navigate } from '../lib/router'
import { addDays, formatDayLong, type Day } from '../lib/dates'
import { WaterWidget } from './widgets'
import { IconBack, IconChevron, IconPlus, IconRefresh, IconStar, IconTrash, IconUser } from '../ui/icons'
import type { FoodEntry, MealSlot } from '../data/types'
import { copySources, favoriteKcal, favoritesFor, suggestFavoriteName } from '../domain/journal'
import { MEALS, entriesOn, mealTarget, calorieGoal, sumEntries, fmtKcal, toMeal, mealLabel } from '../domain/nutrition'
import { CalorieSummary, GoalSheet, QuantitySheet, QuickAddSheet, entryToItem } from './food-parts'

export function Food({ query }: { query: URLSearchParams }) {
  return (
    <>
      <TopBar title="Repas" right={<button className="icon-btn" aria-label="Profil et réglages" onClick={() => navigate('/profil')}><IconUser /></button>} />
      <main className="content">
        <Journal query={query} />
      </main>
    </>
  )
}

// ------------------------------------------------------------------ journal (façon Foodvisor)
function Journal({ query }: { query: URLSearchParams }) {
  const { snap, today, actions } = useApp()
  const [day, setDayState] = useState<Day>((query.get('jour') as Day) || today)
  const setDay = (d: Day) => { setDayState(d); history.replaceState(null, '', `#/repas?onglet=journal&jour=${d}`) }
  const [goalOpen, setGoalOpen] = useState(false)
  const [edit, setEdit] = useState<FoodEntry | null>(null)
  const [tools, setTools] = useState<MealSlot | null>(null)
  const goal = calorieGoal(snap, today).goal
  const entries = entriesOn(snap, day)
  const legacy = snap.meals.filter(m => m.day === day)
  const item = edit ? entryToItem(edit) : null
  // Anciennes lignes « recette » : modifiables comme un simple nombre de calories.
  const quick = edit ? edit.source === 'rapide' || edit.source === 'recette' || !item : false
  return (
    <>
      <div className="row between">
        <button className="icon-btn" aria-label="Jour précédent" onClick={() => setDay(addDays(day, -1))}><IconBack /></button>
        <strong>{day === today ? 'Aujourd\'hui' : day === addDays(today, -1) ? 'Hier' : formatDayLong(day)}</strong>
        <button className="icon-btn" aria-label="Jour suivant" disabled={day >= today} onClick={() => setDay(addDays(day, 1))}><IconChevron /></button>
      </div>
      <CalorieSummary day={day} onGoal={() => setGoalOpen(true)} />
      {MEALS.map(m => {
        const list = entries.filter(e => e.meal === m.id)
        const tot = sumEntries(list)
        return (
          <section className="card meal-card" key={m.id} aria-label={m.label}>
            <div className="meal-head">
              <span className="emoji-bubble" aria-hidden="true">{m.emoji}</span>
              <div><h3>{m.label}</h3><span className="muted small" data-testid={`total-${m.id}`}>{fmtKcal(tot.kcal)}{goal ? ` / ${fmtKcal(mealTarget(goal, m.id))}` : ''}</span></div>
              <button className="icon-btn" aria-label={`Ajouter ${toMeal(m.id)}`} style={{ background: 'var(--vert)', color: '#fff' }}
                onClick={() => navigate(`/repas/ajouter?repas=${m.id}&jour=${day}`)}><IconPlus /></button>
            </div>
            {!list.length && <QuickRepeat day={day} meal={m.id} onMore={() => setTools(m.id)} />}
            {list.map(e => (
              <button key={e.id} className="entry" onClick={() => setEdit(e)}>
                <span className="grow">
                  <span className="name">{e.name}</span>
                  <span className="muted small">{e.source === 'rapide' ? 'ajout rapide' : e.unit === 'portion' ? (e.portion_label ?? `${e.quantity} portion`) : `${String(e.quantity).replace('.', ',')} ${e.unit}`}{e.brand ? ' · ' + e.brand : ''}</span>
                </span>
                <span className="kcal">{Math.round(e.kcal)} kcal</span>
              </button>
            ))}
            {list.length > 0 && (
              <div className="meal-tools">
                <button className="link-btn small" onClick={() => setTools(m.id)} aria-label={`Favoris et reprise · ${m.label}`}><IconStar style={{ width: 16 }} /> Favori · reprendre</button>
              </div>
            )}
          </section>
        )
      })}
      {legacy.length > 0 && (
        <section className="card flat">
          <div className="kicker-nuit">Notés avant le journal des calories</div>
          {legacy.map(m => (
            <div key={m.id} className="entry" style={{ cursor: 'default' }}>
              <span className="grow"><span className="name">{m.title}</span><span className="muted small">sans calories</span></span>
              <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label={`Supprimer ${m.title}`} onClick={() => actions.deleteMeal(m.id)}><IconTrash style={{ width: 18 }} /></button>
            </div>
          ))}
        </section>
      )}
      <WaterWidget day={day} />
      {goalOpen && <GoalSheet onClose={() => setGoalOpen(false)} />}
      {tools && <MealToolsSheet day={day} meal={tools} onClose={() => setTools(null)} />}
      {edit && quick && <QuickAddSheet day={day} meal={edit.meal} entry={edit} onClose={() => setEdit(null)} />}
      {edit && !quick && item && <QuantitySheet item={item} entry={edit} day={edit.day} meal={edit.meal} onClose={() => setEdit(null)} />}
    </>
  )
}

const shortDay = (d: Day, today: Day) => d === addDays(today, -1) ? 'Hier' : d === addDays(today, -2) ? 'Avant-hier' : formatDayLong(d)

/** Repas vide : proposer en un geste le même repas de la veille (ou du dernier jour noté). */
function QuickRepeat({ day, meal, onMore }: { day: Day; meal: MealSlot; onMore: () => void }) {
  const { snap, today, actions, toast } = useApp()
  const src = copySources(snap, day, meal, 7, 1)[0]
  const favs = snap.favorite_meals.length
  if (!src && !favs) return null
  const repeat = async () => {
    try { const n = await actions.copyMeal(src.day, meal, day, meal); toast('↻', n > 1 ? `${n} aliments ajoutés` : 'Aliment ajouté') }
    catch { toast('⛔', 'Ce repas contient du porc : il ne peut pas être recopié.') }
  }
  return (
    <div className="meal-tools">
      {src && <button className="chip soft" onClick={repeat} aria-label={`Comme ${shortDay(src.day, day).toLowerCase()} · ${mealLabel(meal)}`}><IconRefresh style={{ width: 16 }} /> Comme {src.day === addDays(day, -1) ? 'hier' : shortDay(src.day, today).toLowerCase()} · {fmtKcal(src.kcal)}</button>}
      <button className="link-btn small" onClick={onMore} aria-label={`Favoris et reprise · ${mealLabel(meal)}`}><IconStar style={{ width: 16 }} /> {favs ? 'Favoris' : 'Autres jours'}</button>
    </div>
  )
}

/** Favoris, reprise d'un autre jour, enregistrement du repas en favori. */
function MealToolsSheet({ day, meal, onClose }: { day: Day; meal: MealSlot; onClose: () => void }) {
  const { snap, today, actions, toast } = useApp()
  const current = snap.food_entries.filter(f => f.day === day && f.meal === meal).sort((a, b) => a.at.localeCompare(b.at))
  const [name, setName] = useState(suggestFavoriteName(current))
  const [manage, setManage] = useState(false)
  const sources = copySources(snap, day, meal)
  const favs = favoritesFor(snap, meal)
  const done = (n: number) => { toast('✅', n > 1 ? `${n} aliments ajoutés ${toMeal(meal)}` : `Ajouté ${toMeal(meal)}`); onClose() }
  const fail = () => toast('⛔', 'Contient du porc : impossible de l\'ajouter.')
  const save = async () => {
    try { await actions.saveFavorite(name, meal, current); toast('⭐', 'Repas enregistré dans tes favoris'); onClose() }
    catch (e) { if ((e as Error).message === 'PORC') fail() }
  }
  return (
    <Sheet title={mealLabel(meal)} onClose={onClose}>
      {current.length > 0 && (
        <section className="stack" aria-label="Enregistrer en favori">
          <strong>Enregistrer ce repas en favori</strong>
          <p className="muted small">{current.length} aliment{current.length > 1 ? 's' : ''} · {fmtKcal(sumEntries(current).kcal)}. Tu pourras le rajouter en un geste.</p>
          <label className="field">Nom du favori<input className="input" value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="Ex. : mon petit-déj habituel" /></label>
          <button className="btn secondary block" disabled={!name.trim()} onClick={save}><IconStar /> Enregistrer en favori</button>
        </section>
      )}
      <section className="stack" aria-label="Mes repas favoris">
        <div className="row between"><strong>Mes repas favoris</strong>{favs.length > 0 && <button className="link-btn small" onClick={() => setManage(!manage)}>{manage ? 'Terminé' : 'Gérer'}</button>}</div>
        {!favs.length && <p className="muted small">Aucun favori pour l'instant. Note un repas que tu manges souvent, puis enregistre-le ici.</p>}
        <div className="list">
          {favs.map(f => (
            <div className="row" key={f.id} style={{ gap: 4 }}>
              <button className="entry" style={{ flex: 1, minWidth: 0 }} disabled={manage} onClick={async () => { try { done(await actions.logFavorite(f.id, day, meal)) } catch { fail() } }}>
                <span className="grow"><span className="name">{f.name}</span><span className="muted small">{f.items.map(i => i.name.split(',')[0]).join(', ')}</span></span>
                <span className="kcal">{fmtKcal(favoriteKcal(f))}</span>
              </button>
              {manage && <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label={`Supprimer le favori ${f.name}`} onClick={() => actions.deleteFavorite(f.id)}><IconTrash style={{ width: 18 }} /></button>}
            </div>
          ))}
        </div>
      </section>
      <section className="stack" aria-label="Reprendre un autre jour">
        <strong>Reprendre le {mealLabel(meal).toLowerCase()} d'un autre jour</strong>
        {!sources.length && <p className="muted small">Rien de noté pour ce repas ces deux dernières semaines.</p>}
        <div className="list">
          {sources.map(src => (
            <button key={src.day} className="entry" onClick={async () => { try { done(await actions.copyMeal(src.day, meal, day, meal)) } catch { fail() } }}>
              <span className="grow"><span className="name">{shortDay(src.day, today)}</span><span className="muted small">{src.entries.map(e => e.name.split(',')[0]).join(', ')}</span></span>
              <span className="kcal">{fmtKcal(src.kcal)}</span>
            </button>
          ))}
        </div>
      </section>
    </Sheet>
  )
}
