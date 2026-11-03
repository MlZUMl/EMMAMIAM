// Calories dépensées pendant une séance : simple ESTIMATION (équivalent métabolique × poids × durée).
// Affichée à part, à titre indicatif. Jamais déduite de l'objectif calorique ni ajoutée au « droit de manger ».
import type { Snapshot, Workout } from '../data/types'
import { addDays, type Day } from '../lib/dates'
import { currentWeight } from './nutrition'

/** MET (valeurs usuelles des tables d'activités physiques), prudentes pour des séances à la maison. */
export const MET: Record<string, number> = {
  mobilite: 2.5, renfo: 4, mixte: 4.5, cardio: 6,
  ring_fit: 4.5, danse: 5, velo: 6, velo_appart: 5.5, corde: 8, marche: 3.5, autre: 4,
}
const DEFAULT_MET = 4

/** kcal estimées (arrondies à 5), ou null sans poids connu ou sans durée. */
export function workoutKcal(w: Pick<Workout, 'activity' | 'actual_minutes'>, kg: number | null): number | null {
  if (!kg || kg <= 0 || !w.actual_minutes || w.actual_minutes <= 0) return null
  const met = MET[w.activity] ?? DEFAULT_MET
  return Math.max(5, Math.round((met * kg * (w.actual_minutes / 60)) / 5) * 5)
}

/** Total estimé des séances terminées entre deux jours (inclus). */
export function burnBetween(s: Snapshot, from: Day, to: Day): number | null {
  const kg = currentWeight(s)
  if (!kg) return null
  let total = 0
  for (const w of s.workouts) if (w.completed && w.day >= from && w.day <= to) total += workoutKcal(w, kg) ?? 0
  return total
}

export const burnLastDays = (s: Snapshot, today: Day, days: number) => burnBetween(s, addDays(today, -(days - 1)), today)
