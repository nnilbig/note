import type { CardType } from '~/types/card'

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  task: '任務',
  project: '專案',
  habit: '習慣',
  note: '筆記'
}

export const CARD_TYPE_OPTIONS: CardType[] = ['task', 'project', 'habit', 'note']
