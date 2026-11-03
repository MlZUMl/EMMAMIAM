// Ajouter un repas : le plat mangé et son nombre de calories, rien d'autre.
import { useState } from 'react'
import { useApp } from '../app/state'
import { TopBar } from '../ui/components'
import type { MealSlot } from '../data/types'
import { defaultMealSlot, mealLabel } from '../domain/nutrition'
import { toDay, type Day } from '../lib/dates'
import { QuickAddForm } from './food-parts'

export function FoodAdd({ query }: { query: URLSearchParams }) {
  const { today } = useApp()
  const day = (query.get('jour') as Day) || today
  const [meal] = useState<MealSlot>((query.get('repas') as MealSlot) || defaultMealSlot())
  return (
    <>
      <TopBar onBack title={`Ajouter · ${mealLabel(meal)}`} kicker={day === toDay() ? 'Aujourd\'hui' : day.split('-').reverse().join('/')} />
      <main className="content no-tabs">
        <section className="card"><QuickAddForm day={day} meal={meal} onDone={() => history.back()} /></section>
      </main>
    </>
  )
}
