import type { BuJoSymbol, CardDraft } from '~/types/card'

// Order matters: check more specific/ambiguous patterns appropriately.
// 'x'/'X' is deliberately required to be followed by whitespace (not just
// any char) so words like "xylophone" aren't misread as a "completed" mark.
const RULES: Array<{ pattern: RegExp, symbol: BuJoSymbol }> = [
  { pattern: /^[•-]\s*/, symbol: 'task' },
  { pattern: /^[✕xX](?=\s|$)\s*/, symbol: 'completed' },
  { pattern: /^>\s*/, symbol: 'migrated' },
  { pattern: /^\*\s*/, symbol: 'priority' },
  { pattern: /^!\s*/, symbol: 'note' }
]

// No \w-based pattern here since \w is ASCII-only and would miss tags like
// #跑步/#閱讀 -- match any run of non-whitespace, non-# characters instead.
const TAG_PATTERN = /#([^\s#]+)/g

export function parseRapidLogEntry(raw: string): CardDraft {
  const trimmed = raw.trim()

  let symbol: BuJoSymbol = 'task'
  let rest = trimmed
  for (const rule of RULES) {
    if (rule.pattern.test(trimmed)) {
      symbol = rule.symbol
      rest = trimmed.replace(rule.pattern, '')
      break
    }
  }

  const tags = [...new Set([...rest.matchAll(TAG_PATTERN)].map(m => m[1]))]
  const title = rest.replace(TAG_PATTERN, '').replace(/\s+/g, ' ').trim()

  return { bujoSymbol: symbol, title, tags, raw }
}
