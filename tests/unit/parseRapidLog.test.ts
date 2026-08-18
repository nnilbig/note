import { describe, expect, it } from 'vitest'
import { parseRapidLogEntry } from '~/utils/parseRapidLog'

describe('parseRapidLogEntry', () => {
  it('parses task with bullet', () => {
    expect(parseRapidLogEntry('• Buy milk')).toEqual({
      bujoSymbol: 'task',
      title: 'Buy milk',
      tags: [],
      scheduledStart: null,
      scheduledEnd: null,
      isShallowTask: false,
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
      scheduledStart: null,
      scheduledEnd: null,
      isShallowTask: false,
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

  it('parses a 4-digit time range after the symbol', () => {
    expect(parseRapidLogEntry('• 0900-0930 深度工作')).toMatchObject({
      title: '深度工作',
      scheduledStart: '09:00:00',
      scheduledEnd: '09:30:00'
    })
  })

  it('parses a colon-separated time range', () => {
    expect(parseRapidLogEntry('9:00-9:30 深度工作')).toMatchObject({
      scheduledStart: '09:00:00',
      scheduledEnd: '09:30:00'
    })
  })

  it('defaults schedule to null when no time range is present', () => {
    expect(parseRapidLogEntry('• Buy milk')).toMatchObject({ scheduledStart: null, scheduledEnd: null })
  })

  it('marks a shallow task with a leading ~', () => {
    expect(parseRapidLogEntry('~ 回信 #email')).toMatchObject({
      title: '回信',
      tags: ['email'],
      isShallowTask: true
    })
  })

  it('defaults isShallowTask to false without the ~ marker', () => {
    expect(parseRapidLogEntry('• Buy milk')).toMatchObject({ isShallowTask: false })
  })

  it('combines shallow marker, symbol, time range, and tags', () => {
    expect(parseRapidLogEntry('~ x 0900-0910 回信 #email')).toEqual({
      bujoSymbol: 'completed',
      title: '回信',
      tags: ['email'],
      scheduledStart: '09:00:00',
      scheduledEnd: '09:10:00',
      isShallowTask: true,
      raw: '~ x 0900-0910 回信 #email'
    })
  })

  it('parses scheduled with <', () => {
    expect(parseRapidLogEntry('< Ship v2')).toMatchObject({ bujoSymbol: 'scheduled', title: 'Ship v2' })
  })

  it('parses event with @', () => {
    expect(parseRapidLogEntry('@ Team offsite')).toMatchObject({ bujoSymbol: 'event', title: 'Team offsite' })
  })

  it('combines scheduled symbol with a time range', () => {
    expect(parseRapidLogEntry('< 0900-0930 開會')).toMatchObject({
      bujoSymbol: 'scheduled',
      title: '開會',
      scheduledStart: '09:00:00',
      scheduledEnd: '09:30:00'
    })
  })

  it('has no creation-time trigger for cancelled -- untagged text stays task', () => {
    expect(parseRapidLogEntry('~ Random text')).toMatchObject({ bujoSymbol: 'task' })
  })
})
