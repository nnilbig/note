import type { BuJoSymbol, CardDraft } from '~/types/card'

// Order matters: check more specific/ambiguous patterns appropriately.
// 'x'/'X' is deliberately required to be followed by whitespace (not just
// any char) so words like "xylophone" aren't misread as a "completed" mark.
const RULES: Array<{ pattern: RegExp, symbol: BuJoSymbol }> = [
  { pattern: /^[•-]\s*/, symbol: 'task' },
  { pattern: /^[✕xX](?=\s|$)\s*/, symbol: 'completed' },
  { pattern: /^>\s*/, symbol: 'migrated' },
  { pattern: /^\*\s*/, symbol: 'priority' }
]

export function parseRapidLogEntry(raw: string): CardDraft {
  const trimmed = raw.trim()

  for (const { pattern, symbol } of RULES) {
    if (pattern.test(trimmed)) {
      return { bujoSymbol: symbol, title: trimmed.replace(pattern, '').trim(), raw }
    }
  }

  return { bujoSymbol: 'task', title: trimmed, raw }
}
