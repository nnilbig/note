import { describe, expect, it } from 'vitest'
import { computeProgress } from '~/utils/progress'

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
