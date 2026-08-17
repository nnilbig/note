import type { CardBucket } from '~/types/card'

export const BUCKET_LABELS: Record<CardBucket, string> = {
  daily: '今日',
  week: '本週',
  month: '本月',
  future: '未來誌'
}

// Sequential migrate order: daily -> week -> month -> future -> (wraps to daily)
export const BUCKET_ORDER: CardBucket[] = ['daily', 'week', 'month', 'future']

export function nextBucket(bucket: CardBucket): CardBucket {
  const index = BUCKET_ORDER.indexOf(bucket)
  return BUCKET_ORDER[(index + 1) % BUCKET_ORDER.length]
}
