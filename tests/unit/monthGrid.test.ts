import { describe, expect, it } from 'vitest'
import { currentMonth, dateForDay } from '~/utils/monthGrid'

describe('dateForDay', () => {
  it('formats year/month/day with zero-padding', () => {
    expect(dateForDay(2026, 8, 5)).toBe('2026-08-05')
  })

  it('does not pad an already two-digit day', () => {
    expect(dateForDay(2026, 12, 25)).toBe('2026-12-25')
  })
})

describe('currentMonth', () => {
  it('produces internally consistent bounds and a matching days array', () => {
    const m = currentMonth()
    expect(m.monthStart).toBe(dateForDay(m.year, m.month, 1))
    expect(m.monthEnd).toBe(dateForDay(m.year, m.month, m.daysInMonth))
    expect(m.days).toEqual(Array.from({ length: m.daysInMonth }, (_, i) => i + 1))
    expect(m.daysInMonth).toBeGreaterThanOrEqual(28)
    expect(m.daysInMonth).toBeLessThanOrEqual(31)
  })
})
