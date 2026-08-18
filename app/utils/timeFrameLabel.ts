import type { TimeFrame } from '~/types/card'

export const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  daily: '今日',
  weekly: '本週',
  monthly: '本月',
  future: '未來誌'
}

// Sequential migrate order: daily -> weekly -> monthly -> future -> (wraps to daily)
export const TIME_FRAME_ORDER: TimeFrame[] = ['daily', 'weekly', 'monthly', 'future']

export function nextTimeFrame(timeFrame: TimeFrame): TimeFrame {
  const index = TIME_FRAME_ORDER.indexOf(timeFrame)
  return TIME_FRAME_ORDER[(index + 1) % TIME_FRAME_ORDER.length]
}
