import type { BuJoSymbol } from '~/types/card'

export const BUJO_GLYPHS: Record<BuJoSymbol, string> = {
  task: '•',
  completed: '✕',
  migrated: '>',
  priority: '*'
}

export const BUJO_LABELS: Record<BuJoSymbol, string> = {
  task: '任務',
  completed: '完成',
  migrated: '順延',
  priority: '優先'
}
