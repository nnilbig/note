import { describe, expect, it } from 'vitest'
import { computeAverageProgress, computeProgress } from '~/utils/progress'

describe('computeProgress', () => {
  it('returns 0 for an empty checklist', () => {
    expect(computeProgress([])).toBe(0)
  })

  it('returns 0 when nothing is done', () => {
    expect(computeProgress([{ done: false }, { done: false }])).toBe(0)
  })

  it('returns 100 when everything is done', () => {
    expect(computeProgress([{ done: true }, { done: true }])).toBe(100)
  })

  it('returns a rounded percentage for partial completion', () => {
    expect(computeProgress([{ done: true }, { done: false }, { done: false }])).toBe(33)
  })
})

describe('computeAverageProgress', () => {
  it('returns 0 for an empty card list', () => {
    expect(computeAverageProgress([])).toBe(0)
  })

  it('averages progress across cards, rounded', () => {
    expect(computeAverageProgress([{ progress_percent: 100 }, { progress_percent: 0 }, { progress_percent: 50 }])).toBe(50)
  })

  it('rounds a non-integer average', () => {
    expect(computeAverageProgress([{ progress_percent: 100 }, { progress_percent: 0 }, { progress_percent: 0 }])).toBe(33)
  })
})
