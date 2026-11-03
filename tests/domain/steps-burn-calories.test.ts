// Pas saisis à la main, calories dépensées estimées, bilan calories de la semaine.
import { describe, it, expect } from 'vitest'
import { baseSnap, workout, T } from '../helpers'
import type { FoodEntry, Snapshot } from '../../src/data/types'
import { parseSteps, stepGoal, stepsOn, stepsSeries, stepsSummary, stepsToKm, DEFAULT_STEP_GOAL } from '../../src/domain/steps'
import { burnBetween, workoutKcal } from '../../src/domain/burn'
import { calorieSeries, calorieWeek } from '../../src/domain/series'
import { DataStore } from '../../src/data/store'
import { createActions } from '../../src/app/actions'

const TODAY = '2026-10-20'
const food = (day: string, kcal: number, i = 0): FoodEntry => ({
  id: `${day}-${i}`, day, meal: 'dejeuner', source: 'rapide', ref: null, name: 'Ajout rapide', brand: null, quantity: 1, unit: 'portion', grams: 0,
  portion_label: null, per100: null, kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, details: {}, category: null, at: day + 'T12:00:00.000Z', ...T(day + 'T12:00:00.000Z'),
})
const withGoal = (s: Snapshot, goal: number | null) => {
  s.profiles = [{ ...s.profiles[0], settings: { ...s.profiles[0].settings, nutrition: { ...(s.profiles[0].settings.nutrition ?? {}), manualGoal: goal } } }]
  return s
}

describe('pas', () => {
  it('lit les nombres saisis à la main (espaces, virgule, « k »)', () => {
    expect(parseSteps('6240')).toBe(6240)
    expect(parseSteps('6 240')).toBe(6240)
    expect(parseSteps('6,2k')).toBe(6200)
    expect(parseSteps('')).toBeNull()
    expect(parseSteps('0')).toBeNull()
    expect(parseSteps('-5')).toBeNull()
    expect(parseSteps('abc')).toBeNull()
    expect(parseSteps('250000')).toBeNull()
  })
  it('série sur 7 jours, objectif par défaut 8 000, moyenne sur les jours notés seulement', () => {
    const s = baseSnap()
    s.profiles = [{ ...s.profiles[0], settings: { ...s.profiles[0].settings, steps: { [TODAY]: 9000, '2026-10-19': 5000, '2026-10-10': 12000 } } }]
    expect(stepGoal(s)).toBe(DEFAULT_STEP_GOAL)
    expect(stepsOn(s, TODAY)).toBe(9000)
    const ser = stepsSeries(s, TODAY, 7)
    expect(ser).toHaveLength(7)
    expect(ser[6]).toMatchObject({ day: TODAY, steps: 9000, reached: true })
    expect(ser[5]).toMatchObject({ steps: 5000, reached: false })
    const sum = stepsSummary(ser)
    expect(sum).toMatchObject({ loggedDays: 2, daysReached: 1, avg: 7000 })
    expect(stepsSummary(stepsSeries(baseSnap(), TODAY, 7)).avg).toBeNull()
    expect(stepsToKm(10000)).toBe(7)
  })
  it('actions : enregistrer, remplacer, effacer, objectif borné ; rien d\'autre ne bouge dans le profil', async () => {
    const store = await DataStore.open('pas-' + Math.random())
    const actions = createActions(store)
    await actions.completeOnboarding({ name: 'A', ritual: { days: [1, 2, 3, 4, 5], time: '17:15', usualMinutes: 20, minMinutes: 10, place: 'Salon' }, species: 'chat', companionName: 'Mochi', waterMl: 2000, equipment: ['tapis'] })
    await actions.setSteps(TODAY, 6240)
    await actions.setSteps('2026-10-19', 4000)
    await actions.setSteps(TODAY, 7000)
    expect(store.snapshot().profiles[0].settings.steps).toEqual({ [TODAY]: 7000, '2026-10-19': 4000 })
    await actions.setSteps('2026-10-19', null)
    expect(store.snapshot().profiles[0].settings.steps).toEqual({ [TODAY]: 7000 })
    await actions.setStepGoal(500)
    expect(store.snapshot().profiles[0].settings.step_goal).toBe(1000)
    await actions.setStepGoal(10000)
    expect(store.snapshot().profiles[0].settings.step_goal).toBe(10000)
    expect(store.snapshot().profiles[0].water_goal_ml).toBe(2000)
    store.close()
  })
})

describe('calories dépensées (estimation)', () => {
  it('MET × poids × durée, arrondi à 5 ; rien sans poids connu', () => {
    // marche : 3,5 × 70 kg × 1 h = 245
    expect(workoutKcal({ activity: 'marche', actual_minutes: 60 }, 70)).toBe(245)
    // danse 30 min à 60 kg : 5 × 60 × 0,5 = 150
    expect(workoutKcal({ activity: 'danse', actual_minutes: 30 }, 60)).toBe(150)
    expect(workoutKcal({ activity: 'inconnue', actual_minutes: 30 }, 60)).toBe(120)
    expect(workoutKcal({ activity: 'marche', actual_minutes: 30 }, null)).toBeNull()
    expect(workoutKcal({ activity: 'marche', actual_minutes: 0 }, 70)).toBeNull()
  })
  it('total sur une période : séances terminées seulement ; null sans poids', () => {
    const s = baseSnap()
    s.workouts = [workout('2026-10-20', 30, { activity: 'danse' }), workout('2026-10-19', 30, { activity: 'danse', completed: false }), workout('2026-10-01', 30, { activity: 'danse' })]
    expect(burnBetween(s, '2026-10-14', TODAY)).toBeNull()
    s.weights = [{ id: '2026-10-18', day: '2026-10-18', kg: 60, note: null, ...T('2026-10-18T08:00:00.000Z') }]
    expect(burnBetween(s, '2026-10-14', TODAY)).toBe(150)
  })
  it('n\'entre jamais dans l\'objectif calorique', () => {
    const s = withGoal(baseSnap(), 1800)
    s.weights = [{ id: '2026-10-18', day: '2026-10-18', kg: 60, note: null, ...T('2026-10-18T08:00:00.000Z') }]
    const avant = calorieWeek(s, TODAY).goal
    s.workouts = [workout(TODAY, 60, { activity: 'cardio' })]
    expect(calorieWeek(s, TODAY).goal).toBe(avant)
    expect(avant).toBe(1800)
  })
})

describe('bilan calories de la semaine', () => {
  it('moyenne sur les jours notés, journée en cours laissée de côté, jours à ±10 % de l\'objectif', () => {
    const s = withGoal(baseSnap(), 1800)
    s.food_entries = [food('2026-10-19', 1700), food('2026-10-19', 100, 1), food('2026-10-18', 1500), food('2026-10-17', 2200), food(TODAY, 400)]
    const ser = calorieSeries(s, TODAY, 7)
    expect(ser[6]).toMatchObject({ day: TODAY, kcal: 400, logged: true })
    expect(ser[5].kcal).toBe(1800)
    expect(ser[0].logged).toBe(false)
    const wk = calorieWeek(s, TODAY)
    expect(wk.goal).toBe(1800)
    expect(wk.loggedDays).toBe(4)
    // (1800 + 1500 + 2200) / 3 = 1833 ; 400 (aujourd'hui, pas fini) n'abaisse pas la moyenne
    expect(wk.avg).toBe(1833)
    expect(wk.countedDays).toBe(3)
    expect(wk.nearDays).toBe(1)
  })
  it('compare avec les 7 jours d\'avant ; rien noté = pas de moyenne inventée', () => {
    const s = withGoal(baseSnap(), 1800)
    expect(calorieWeek(s, TODAY)).toMatchObject({ avg: null, prevAvg: null, loggedDays: 0 })
    s.food_entries = [food('2026-10-18', 1600), food('2026-10-12', 2000), food('2026-10-11', 1800)]
    expect(calorieWeek(s, TODAY)).toMatchObject({ avg: 1600, prevAvg: 1900 })
  })
  it('aujourd\'hui seul : sa valeur est utilisée plutôt que rien', () => {
    const s = withGoal(baseSnap(), 1800)
    s.food_entries = [food(TODAY, 700)]
    expect(calorieWeek(s, TODAY).avg).toBe(700)
  })
})
