// Pas du jour, saisis à la main (une appli installée ne peut pas lire les pas du téléphone).
// Stockés dans les réglages du profil : { jour: nombre de pas }, aucune table en plus.
import type { Snapshot } from '../data/types'
import { addDays, type Day } from '../lib/dates'

export const DEFAULT_STEP_GOAL = 8000
export const MAX_STEPS = 100000

export const stepsOn = (s: Snapshot, day: Day): number => s.profiles[0]?.settings.steps?.[day] ?? 0
export const stepGoal = (s: Snapshot): number => s.profiles[0]?.settings.step_goal ?? DEFAULT_STEP_GOAL

/** Nombre valide de pas : entier entre 1 et 100 000, sinon null. Accepte « 6 240 », « 6240 » ou « 6,2 k ». */
export function parseSteps(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s| | /g, '')
  if (!t) return null
  const k = t.endsWith('k')
  const n = Number((k ? t.slice(0, -1) : t).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const v = Math.round(k ? n * 1000 : n)
  return v >= 1 && v <= MAX_STEPS ? v : null
}

export interface StepDay { day: Day; steps: number; goal: number; reached: boolean }

/** Pas de chaque jour sur les `days` derniers jours (aujourd'hui compris), du plus ancien au plus récent. */
export function stepsSeries(s: Snapshot, today: Day, days: number): StepDay[] {
  const goal = stepGoal(s)
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - (days - 1))
    const steps = stepsOn(s, day)
    return { day, steps, goal, reached: steps >= goal }
  })
}

export function stepsSummary(series: StepDay[]) {
  const logged = series.filter(d => d.steps > 0)
  return {
    days: series.length,
    loggedDays: logged.length,
    daysReached: series.filter(d => d.reached).length,
    /** moyenne sur les jours notés : un jour oublié ne tire pas la moyenne vers le bas */
    avg: logged.length ? Math.round(logged.reduce((n, d) => n + d.steps, 0) / logged.length) : null,
    total: series.reduce((n, d) => n + d.steps, 0),
  }
}

/** Distance approximative : environ 0,7 m par pas pour une marche normale. */
export const stepsToKm = (steps: number) => Math.round(steps * 0.7 / 100) / 10
