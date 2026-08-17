import type { BuJoSymbol, CardDraft, CardType } from '~/types/card'

// Order matters: check more specific/ambiguous patterns appropriately.
// 'x'/'X' is deliberately required to be followed by whitespace (not just
// any char) so words like "xylophone" aren't misread as a "completed" mark.
const RULES: Array<{ pattern: RegExp, symbol: BuJoSymbol, cardType: CardType }> = [
  { pattern: /^[•-]\s*/, symbol: 'task', cardType: 'task' },
  { pattern: /^[✕xX](?=\s|$)\s*/, symbol: 'completed', cardType: 'task' },
  { pattern: /^>\s*/, symbol: 'migrated', cardType: 'task' },
  { pattern: /^\*\s*/, symbol: 'priority', cardType: 'task' },
  { pattern: /^!\s*/, symbol: 'task', cardType: 'note' }
]

export function parseRapidLogEntry(raw: string): CardDraft {
  const trimmed = raw.trim()

  for (const { pattern, symbol, cardType } of RULES) {
    if (pattern.test(trimmed)) {
      return { bujoSymbol: symbol, cardType, title: trimmed.replace(pattern, '').trim(), raw }
    }
  }

  return { bujoSymbol: 'task', cardType: 'task', title: trimmed, raw }
}
