// Briques du journal alimentaire : résumé calorique, ajout d'un repas (plat + calories), objectif calorique.
import { useState } from 'react'
import { useApp } from '../app/state'
import { Chips, Ring, Sheet, Toggle } from '../ui/components'
import type { FoodEntry, MealSlot } from '../data/types'
import {
  ACTIVITY, MEALS, PACE, calorieGoal, currentWeight, dayTotals, fmtKcal, toMeal, remainingText,
} from '../domain/nutrition'
import { toDay, type Day } from '../lib/dates'

// ------------------------------------------------------------------ résumé du jour
export function CalorieSummary({ day, compact = false, onGoal }: { day: Day; compact?: boolean; onGoal?: () => void }) {
  const { snap } = useApp()
  const goal = calorieGoal(snap, toDay()).goal
  const t = dayTotals(snap, day)
  const rem = remainingText(t.kcal, goal)
  const ratio = goal ? Math.min(1, t.kcal / goal) : 0
  return (
    <section className="card" aria-label="Calories du jour">
      <div className="kcal-hero">
        <Ring value={goal ? ratio : 0} size={compact ? 96 : 116} stroke={compact ? 9 : 11} color={goal && t.kcal > goal ? 'var(--nuit)' : 'var(--mousse)'}>
          <span className="ring-label" data-testid="kcal-restantes"><b>{rem.big.replace(' kcal', '')}</b><small>{goal ? (t.kcal > goal ? 'kcal notées' : 'kcal restantes') : 'kcal'}</small></span>
        </Ring>
        <div className="nums">
          <div><strong data-testid="kcal-mangees">{fmtKcal(t.kcal)}</strong><span>mangées</span></div>
          <div><strong>{goal ? fmtKcal(goal) : '—'}</strong><span>objectif</span></div>
          {goal && t.kcal > goal && <div style={{ gridColumn: '1 / -1' }}><span>Au-delà de l'objectif : c'est noté, rien à compenser.</span></div>}
          {!goal && <div style={{ gridColumn: '1 / -1' }}>{onGoal ? <button className="link-btn" onClick={onGoal}>Définir mon objectif</button> : <span>Objectif à définir dans Repas</span>}</div>}
        </div>
      </div>
      {!compact && goal && onGoal && <button className="link-btn small" style={{ alignSelf: 'flex-start' }} onClick={onGoal}>Modifier mon objectif</button>}
    </section>
  )
}

// ------------------------------------------------------------------ choix du repas et du jour
export function MealChips({ value, onChange }: { value: MealSlot; onChange: (m: MealSlot) => void }) {
  return <Chips label="Repas" value={value} onChange={v => v && onChange(v)} options={MEALS.map(m => ({ id: m.id, label: m.label }))} />
}

// ------------------------------------------------------------------ ajout : le plat et ses calories
export function QuickAddSheet({ day, meal: meal0, entry, onClose }: { day: Day; meal: MealSlot; entry?: FoodEntry; onClose: () => void }) {
  return <Sheet title={entry ? 'Modifier ce repas' : 'Ajouter un repas'} onClose={onClose}><QuickAddForm day={day} meal={meal0} entry={entry} onDone={onClose} /></Sheet>
}

/** Le plat mangé (nom libre) et le nombre de calories : rien d'autre. */
export function QuickAddForm({ day, meal: meal0, entry, onDone }: { day: Day; meal: MealSlot; entry?: FoodEntry; onDone: () => void }) {
  const { actions, toast } = useApp()
  const [name, setName] = useState(entry && entry.name !== 'Repas' && entry.name !== 'Ajout rapide' ? entry.name : '')
  const [kcal, setKcal] = useState(entry ? String(Math.round(entry.kcal)) : '')
  const [meal, setMeal] = useState<MealSlot>(entry?.meal ?? meal0)
  const k = toNum(kcal)
  const save = async () => {
    if (k === null || k <= 0) return
    try {
      await actions.saveFoodEntry({
        id: entry?.id, day, meal, source: 'rapide', ref: null, name: name.trim() || 'Repas', brand: null, quantity: 1, unit: 'portion', grams: 0,
        portion_label: null, per100: null, kcal: Math.round(k), protein: 0, carbs: 0, fat: 0, fiber: 0, details: {}, category: null,
      })
      toast('✅', entry ? 'Modifié' : `${Math.round(k)} kcal ajoutées ${toMeal(meal)}`)
      onDone()
    } catch { toast('⛔', 'Ce nom évoque du porc : ajout refusé.') }
  }
  return (
    <div className="stack">
      <label className="field">Plat mangé <span className="hint">Ex. : pâtes au poulet, part de gâteau…</span>
        <input className="input" value={name} maxLength={80} onChange={e => setName(e.target.value)} aria-label="Plat mangé" /></label>
      <label className="field">Calories (kcal)<input className="input big-input" inputMode="numeric" value={kcal} onChange={e => setKcal(e.target.value)} aria-label="Calories" /></label>
      <strong className="small">Repas</strong>
      <MealChips value={meal} onChange={setMeal} />
      <div className="grid2">
        {entry ? <button className="btn danger" onClick={async () => { await actions.deleteFoodEntry(entry.id); onDone() }}>Supprimer</button> : <span />}
        <button className="btn primary" disabled={k === null || k <= 0} onClick={save}>{entry ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </div>
  )
}

const s = (x: number | undefined | null) => (x === undefined || x === null ? '' : String(x))
const toNum = (s: string): number | null => { const n = Number(s.replace(',', '.')); return s.trim() && Number.isFinite(n) && n >= 0 ? n : null }

// ------------------------------------------------------------------ objectif calorique
export function GoalSheet({ onClose }: { onClose: () => void }) {
  const { snap, actions, today, toast } = useApp()
  const cur = snap.profiles[0]?.settings.nutrition ?? {}
  const lastWeight = [...snap.weights].sort((a, b) => b.day.localeCompare(a.day))[0]
  const [sex, setSex] = useState<'F' | 'H'>(cur.sex ?? 'F')
  const [birth, setBirth] = useState(s(cur.birthYear))
  const [height, setHeight] = useState(s(cur.heightCm))
  const [weight, setWeight] = useState(s(cur.weightKg ?? currentWeight(snap) ?? undefined))
  const [activity, setActivity] = useState(cur.activity ?? 'sedentaire')
  const [pace, setPace] = useState(cur.pace ?? 'modere')
  const [manualOn, setManualOn] = useState(Boolean(cur.manualGoal))
  const [manual, setManual] = useState(s(cur.manualGoal ?? undefined))
  const draft = {
    sex, birthYear: toNum(birth) ?? undefined, heightCm: toNum(height) ?? undefined, weightKg: lastWeight ? cur.weightKg : toNum(weight) ?? undefined,
    activity, pace, manualGoal: manualOn ? toNum(manual) : null,
  }
  // Aperçu calculé avec les valeurs en cours de saisie
  const preview = calorieGoal({ ...snap, profiles: [{ ...snap.profiles[0], settings: { ...snap.profiles[0].settings, nutrition: draft } }] }, today)
  const year = Number(today.slice(0, 4))
  const birthOk = !birth || ((toNum(birth) ?? 0) >= year - 100 && (toNum(birth) ?? 0) <= year - 16)
  const save = async () => {
    await actions.saveNutritionSettings(draft)
    toast('🎯', 'Objectif enregistré')
    onClose()
  }
  return (
    <Sheet title="Mon objectif calorique" onClose={onClose}>
      <p className="muted small">Calcul de Mifflin-St Jeor. L'objectif ne baisse jamais les jours de fatigue, et les calories du sport ne sont pas déduites : bouger reste un bonus, pas une monnaie d'échange.</p>
      <Chips label="Sexe" value={sex} onChange={v => v && setSex(v)} options={[{ id: 'F', label: 'Femme' }, { id: 'H', label: 'Homme' }]} />
      <div className="grid2">
        <label className="field">Année de naissance<input className="input" inputMode="numeric" value={birth} onChange={e => setBirth(e.target.value)} aria-label="Année de naissance" /></label>
        <label className="field">Taille (cm)<input className="input" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value)} aria-label="Taille en centimètres" /></label>
      </div>
      {!birthOk && <p className="muted small">Vérifie l'année de naissance.</p>}
      {lastWeight ? <p className="small">Poids utilisé : <strong>{String(lastWeight.kg).replace('.', ',')} kg</strong> <span className="muted">(dernière pesée, mise à jour automatique)</span></p>
        : <label className="field">Poids actuel (kg) <span className="hint">Remplacé automatiquement par tes pesées</span><input className="input" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} aria-label="Poids en kilos" /></label>}
      <strong className="small">Activité au quotidien</strong>
      <div className="stack" style={{ gap: 6 }}>
        {Object.entries(ACTIVITY).map(([id, a]) => (
          <button key={id} type="button" className={`chip ${activity === id ? 'on' : ''}`} aria-pressed={activity === id} style={{ justifyContent: 'flex-start', textAlign: 'left', borderRadius: 14 }} onClick={() => setActivity(id as typeof activity)}>
            <span><strong>{a.label}</strong><br /><span style={{ fontWeight: 600, fontSize: '.8rem' }}>{a.hint}</span></span>
          </button>
        ))}
      </div>
      <strong className="small">Rythme</strong>
      <Chips label="Rythme" value={pace} onChange={v => v && setPace(v)} options={Object.entries(PACE).map(([id, p]) => ({ id: id as typeof pace, label: p.label }))} />
      <p className="muted small">{PACE[pace].hint}</p>
      <div className="equip-summary" aria-live="polite">
        {preview.source === 'incomplet' && !manualOn ? <>Il manque : {preview.missing.join(', ')}.</> : (
          <>
            <strong style={{ fontSize: '1.1rem' }}>{preview.goal ? fmtKcal(preview.goal) : '—'} par jour</strong>
            {preview.bmr && <div className="small muted">Métabolisme de base ≈ {fmtKcal(preview.bmr)} · dépense estimée ≈ {fmtKcal(preview.tdee!)}</div>}
            {preview.floored && !manualOn && <div className="small">L'objectif est relevé au plancher de sécurité ({fmtKcal(preview.floor!)}).</div>}
          </>
        )}
      </div>
      <Toggle label="Fixer mon objectif à la main" checked={manualOn} onChange={setManualOn} />
      {manualOn && <label className="field">Objectif (kcal par jour)<input className="input" inputMode="numeric" value={manual} onChange={e => setManual(e.target.value)} aria-label="Objectif manuel" /></label>}
      {manualOn && (toNum(manual) ?? 0) > 0 && (toNum(manual) ?? 0) < 1200 && <div className="warn">Un objectif sous 1 200 kcal n'est pas recommandé sans suivi médical.</div>}
      <button className="btn primary block" disabled={!birthOk || (manualOn && (toNum(manual) ?? 0) < 800)} onClick={save}>Enregistrer</button>
    </Sheet>
  )
}

