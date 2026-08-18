import type { Card } from '~/types/card'

export interface TagGroup {
  tag: string
  cards: Card[]
}

// Dynamic index per the blueprint: cards group themselves by #tag with no
// manual index/page-number bookkeeping. Sorted by frequency (most-used
// tags first) since that's usually what you're looking for at a glance;
// ties break alphabetically for a stable order.
export function groupCardsByTag(cards: Card[]): TagGroup[] {
  const groups = new Map<string, Card[]>()

  for (const card of cards) {
    for (const tag of card.tags) {
      if (!groups.has(tag)) groups.set(tag, [])
      groups.get(tag)!.push(card)
    }
  }

  return [...groups.entries()]
    .map(([tag, taggedCards]) => ({ tag, cards: taggedCards }))
    .sort((a, b) => b.cards.length - a.cards.length || a.tag.localeCompare(b.tag))
}
