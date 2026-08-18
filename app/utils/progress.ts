import type { ChecklistItem } from '~/types/card'

export function computeProgress(checklist: Pick<ChecklistItem, 'done'>[]): number {
  if (checklist.length === 0) return 0
  const done = checklist.filter(item => item.done).length
  return Math.round((done / checklist.length) * 100)
}

export function computeAverageProgress(cards: { progress_percent: number }[]): number {
  if (cards.length === 0) return 0
  const total = cards.reduce((sum, card) => sum + card.progress_percent, 0)
  return Math.round(total / cards.length)
}
