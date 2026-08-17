import type { BuJoSymbol } from '~/types/card'

export const BUJO_GLYPHS: Record<BuJoSymbol, string> = {
  task: '•',
  completed: '✕',
  migrated: '>',
  priority: '*'
}

export const BUJO_LABELS: Record<BuJoSymbol, string> = {
  task: 'Task',
  completed: 'Completed',
  migrated: 'Migrated',
  priority: 'Priority'
}
