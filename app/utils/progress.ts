import type { ChecklistItem } from '~/types/card'

export function computeProgress(checklist: Pick<ChecklistItem, 'done'>[]): number {
  if (checklist.length === 0) return 0
  const done = checklist.filter(item => item.done).length
  return Math.round((done / checklist.length) * 100)
}
