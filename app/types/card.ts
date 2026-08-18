export type BuJoSymbol = 'task' | 'completed' | 'migrated' | 'priority' | 'note'
export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'future'
export type CardVisibility = 'private' | 'shared'
export type MemberRole = 'owner' | 'member' | 'viewer'

export interface CardDraft {
  bujoSymbol: BuJoSymbol
  title: string
  tags: string[]
  scheduledStart: string | null
  scheduledEnd: string | null
  isShallowTask: boolean
  raw: string
}

export interface ChecklistItem {
  id: string
  card_id: string
  text: string
  done: boolean
  position: number
}

export interface Card {
  id: string
  owner_id: string
  bujo_symbol: BuJoSymbol
  title: string
  content: string | null
  tags: string[]
  progress_percent: number
  visibility: CardVisibility
  time_frame: TimeFrame
  target_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  is_shallow_task: boolean
  position: number
  created_at: string
  updated_at: string
  checklist: ChecklistItem[]
}

export interface DailyReview {
  id: string
  owner_id: string
  log_date: string
  shutdown_note: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  type: 'personal' | 'team'
  owner_id: string
}

export interface BoardSnapshot {
  userId: string
  workspace: Workspace
  cards: Card[]
  cachedAt: string
}

export interface PendingCard {
  localId: string
  userId: string
  draft: CardDraft
  timeFrame: TimeFrame
  position: number
  createdAt: string
  status: 'pending' | 'failed'
  lastError?: string
}
