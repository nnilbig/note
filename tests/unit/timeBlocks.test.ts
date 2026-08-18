import { describe, expect, it } from 'vitest'
import {
  blockPosition,
  formatSlotLabel,
  formatTimeRange,
  generateSlotMinutes,
  minutesFromMidnight
} from '~/utils/timeBlocks'

describe('minutesFromMidnight', () => {
  it('parses HH:MM:SS', () => {
    expect(minutesFromMidnight('09:30:00')).toBe(570)
  })

  it('parses HH:MM', () => {
    expect(minutesFromMidnight('00:05')).toBe(5)
  })
})

describe('formatSlotLabel', () => {
  it('pads single-digit hours and minutes', () => {
    expect(formatSlotLabel(8 * 60)).toBe('08:00')
    expect(formatSlotLabel(9 * 60 + 5)).toBe('09:05')
  })
})

describe('generateSlotMinutes', () => {
  it('spans the full 08:00-22:00 range in 30-minute steps', () => {
    const slots = generateSlotMinutes()
    expect(slots[0]).toBe(8 * 60)
    expect(slots[slots.length - 1]).toBe(21 * 60 + 30)
    expect(slots.length).toBe(28)
  })
})

describe('blockPosition', () => {
  it('places a 09:00-09:30 block two slots below the 08:00 grid top', () => {
    expect(blockPosition('09:00:00', '09:30:00')).toEqual({ top: 64, height: 32 })
  })

  it('spans multiple slots for a longer block', () => {
    expect(blockPosition('09:00:00', '10:00:00')).toEqual({ top: 64, height: 64 })
  })

  it('clamps a block starting before the grid to the top', () => {
    expect(blockPosition('06:00:00', '08:30:00')).toEqual({ top: 0, height: 32 })
  })

  it('clamps a block ending after the grid to the bottom', () => {
    const result = blockPosition('21:30:00', '23:00:00')
    expect(result.top).toBe(27 * 32)
    expect(result.height).toBe(32)
  })
})

describe('formatTimeRange', () => {
  it('formats HH:MM-HH:MM without seconds', () => {
    expect(formatTimeRange('09:00:00', '09:30:00')).toBe('09:00–09:30')
  })
})
