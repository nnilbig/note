export type BuJoSymbol = 'task' | 'completed' | 'migrated' | 'priority' | 'note'
export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'future'
export type CardVisibility = 'private' | 'shared'
export type MemberRole = 'owner' | 'member' | 'viewer'

export interface CardDraft {
  bujoSymbol: BuJoSymbol
  title: string
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
  progress_percent: number
  visibility: CardVisibility
  time_frame: TimeFrame
  target_date: string | null
  position: number
  created_at: string
  updated_at: string
  checklist: ChecklistItem[]
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
