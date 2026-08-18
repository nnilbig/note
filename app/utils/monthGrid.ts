function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function dateForDay(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export interface CurrentMonth {
  year: number
  month: number // 1-indexed
  daysInMonth: number
  monthStart: string
  monthEnd: string
  days: number[]
}

export function currentMonth(): CurrentMonth {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  return {
    year,
    month,
    daysInMonth,
    monthStart: dateForDay(year, month, 1),
    monthEnd: dateForDay(year, month, daysInMonth),
    days: Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }
}
