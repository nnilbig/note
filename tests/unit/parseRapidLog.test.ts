import { describe, expect, it } from 'vitest'
import { parseRapidLogEntry } from '~/utils/parseRapidLog'

describe('parseRapidLogEntry', () => {
  it('parses task with bullet', () => {
    expect(parseRapidLogEntry('• Buy milk')).toEqual({
      bujoSymbol: 'task',
      title: 'Buy milk',
      tags: [],
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
    expect(parseRapidLogEntry('! Random idea')).toMatchObject({ bujoSymbol: 'note', title: 'Random idea' })
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

  it('extracts a single tag and strips it from the title', () => {
    expect(parseRapidLogEntry('• 晨跑 30 分鐘 #跑步')).toEqual({
      bujoSymbol: 'task',
      title: '晨跑 30 分鐘',
      tags: ['跑步'],
      raw: '• 晨跑 30 分鐘 #跑步'
    })
  })

  it('extracts multiple tags regardless of position', () => {
    expect(parseRapidLogEntry('#閱讀 讀完一章 #習慣')).toMatchObject({
      title: '讀完一章',
      tags: ['閱讀', '習慣']
    })
  })

  it('dedupes repeated tags', () => {
    expect(parseRapidLogEntry('• #跑步 晨跑 #跑步')).toMatchObject({
      title: '晨跑',
      tags: ['跑步']
    })
  })

  it('defaults to an empty tags array when none are present', () => {
    expect(parseRapidLogEntry('Just typed text')).toMatchObject({ tags: [] })
  })
})
