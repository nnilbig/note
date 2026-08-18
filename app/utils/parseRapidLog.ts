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

// "0900-0930" / "9:00-9:30" -- a time-block range for the Daily time-grid.
const TIME_RANGE_PATTERN = /^(\d{1,2}:?\d{2})\s*-\s*(\d{1,2}:?\d{2})\s*/

// Leading '~' batches the entry into the Daily "shallow task" zone instead
// of the time grid -- low-cognitive work (email, messages) per the source
// article's remote-work Daily Log format.
const SHALLOW_PATTERN = /^~\s*/

function normalizeClockTime(value: string): string {
  const digits = value.includes(':') ? value.replace(':', '') : value
  const padded = digits.padStart(4, '0')
  const hours = padded.slice(0, -2)
  const minutes = padded.slice(-2)
  return `${hours.padStart(2, '0')}:${minutes}:00`
}

export function parseRapidLogEntry(raw: string): CardDraft {
  const trimmed = raw.trim()

  const isShallowTask = SHALLOW_PATTERN.test(trimmed)
  let rest = isShallowTask ? trimmed.replace(SHALLOW_PATTERN, '') : trimmed

  let symbol: BuJoSymbol = 'task'
  for (const rule of RULES) {
    if (rule.pattern.test(rest)) {
      symbol = rule.symbol
      rest = rest.replace(rule.pattern, '')
      break
    }
  }

  let scheduledStart: string | null = null
  let scheduledEnd: string | null = null
  const timeMatch = rest.match(TIME_RANGE_PATTERN)
  if (timeMatch) {
    scheduledStart = normalizeClockTime(timeMatch[1])
    scheduledEnd = normalizeClockTime(timeMatch[2])
    rest = rest.replace(TIME_RANGE_PATTERN, '')
  }

  const tags = [...new Set([...rest.matchAll(TAG_PATTERN)].map(m => m[1]))]
  const title = rest.replace(TAG_PATTERN, '').replace(/\s+/g, ' ').trim()

  return { bujoSymbol: symbol, title, tags, scheduledStart, scheduledEnd, isShallowTask, raw }
}
