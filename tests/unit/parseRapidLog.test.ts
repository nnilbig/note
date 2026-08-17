import { describe, expect, it } from 'vitest'
import { parseRapidLogEntry } from '~/utils/parseRapidLog'

describe('parseRapidLogEntry', () => {
  it('parses task with bullet', () => {
    expect(parseRapidLogEntry('• Buy milk')).toEqual({
      bujoSymbol: 'task',
      cardType: 'task',
      title: 'Buy milk',
      raw: '• Buy milk'
    })
  })

  it('parses task with dash', () => {
    expect(parseRapidLogEntry('- Buy milk')).toMatchObject({ bujoSymbol: 'task', title: 'Buy milk' })
  })

  it('parses completed with lowercase x', () => {
    expect(parseRapidLogEntry('x Finished thing')).toMatchObject({ bujoSymbol: 'completed', title: 'Finished thing' })
  })

  it('parses completed with uppercase X', () => {
    expect(parseRapidLogEntry('X Finished thing')).toMatchObject({ bujoSymbol: 'completed', title: 'Finished thing' })
  })

  it('parses completed with unicode ✕', () => {
    expect(parseRapidLogEntry('✕ Finished thing')).toMatchObject({ bujoSymbol: 'completed', title: 'Finished thing' })
  })

  it('parses migrated', () => {
    expect(parseRapidLogEntry('> Follow up')).toMatchObject({ bujoSymbol: 'migrated', title: 'Follow up' })
  })

  it('parses priority', () => {
    expect(parseRapidLogEntry('* Ship MVP')).toMatchObject({ bujoSymbol: 'priority', title: 'Ship MVP' })
  })

  it('parses note with !', () => {
    expect(parseRapidLogEntry('! Random idea')).toMatchObject({ bujoSymbol: 'task', cardType: 'note', title: 'Random idea' })
  })

  it('defaults to task when no marker is present', () => {
    expect(parseRapidLogEntry('Just typed text')).toMatchObject({ bujoSymbol: 'task', title: 'Just typed text' })
  })

  it('handles whitespace-only input', () => {
    expect(parseRapidLogEntry('   ')).toMatchObject({ bujoSymbol: 'task', title: '' })
  })

  it('does not misread a word starting with x as completed', () => {
    expect(parseRapidLogEntry('xylophone lessons')).toMatchObject({ bujoSymbol: 'task', title: 'xylophone lessons' })
  })
})
