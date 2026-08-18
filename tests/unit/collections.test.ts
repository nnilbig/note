import { describe, expect, it } from 'vitest'
import type { Card } from '~/types/card'
import { groupCardsByTag } from '~/utils/collections'

function makeCard(id: string, tags: string[]): Card {
  return {
    id,
    owner_id: 'owner',
    bujo_symbol: 'task',
    title: id,
    content: null,
    tags,
    progress_percent: 0,
    visibility: 'private',
    time_frame: 'daily',
    target_date: null,
    scheduled_start: null,
    scheduled_end: null,
    is_shallow_task: false,
    position: 0,
    created_at: '',
    updated_at: '',
    checklist: []
  }
}

describe('groupCardsByTag', () => {
  it('groups cards under each of their tags', () => {
    const cards = [makeCard('a', ['跑步']), makeCard('b', ['跑步', '習慣']), makeCard('c', ['閱讀'])]
    const groups = groupCardsByTag(cards)

    const runGroup = groups.find(g => g.tag === '跑步')
    expect(runGroup?.cards.map(c => c.id)).toEqual(['a', 'b'])

    const habitGroup = groups.find(g => g.tag === '習慣')
    expect(habitGroup?.cards.map(c => c.id)).toEqual(['b'])
  })

  it('ignores cards with no tags', () => {
    const cards = [makeCard('a', [])]
    expect(groupCardsByTag(cards)).toEqual([])
  })

  it('sorts by frequency, most-used tag first', () => {
    const cards = [makeCard('a', ['x']), makeCard('b', ['y']), makeCard('c', ['y'])]
    const groups = groupCardsByTag(cards)
    expect(groups.map(g => g.tag)).toEqual(['y', 'x'])
  })

  it('breaks frequency ties alphabetically', () => {
    const cards = [makeCard('a', ['b']), makeCard('b', ['a'])]
    const groups = groupCardsByTag(cards)
    expect(groups.map(g => g.tag)).toEqual(['a', 'b'])
  })
})
