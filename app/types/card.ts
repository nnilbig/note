export type BuJoSymbol = 'task' | 'completed' | 'migrated' | 'priority'
export type CardBucket = 'week' | 'month'
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
  project_id: string
  bujo_symbol: BuJoSymbol
  title: string
  progress: number
  visibility: CardVisibility
  bucket: CardBucket
  position: number
  created_at: string
  updated_at: string
  checklist: ChecklistItem[]
}

export interface Project {
  id: string
  workspace_id: string
  title: string
  cycle: 'daily' | 'weekly' | 'monthly'
  target_date: string | null
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
  project: Project
  cards: Card[]
  cachedAt: string
}

export interface PendingCard {
  localId: string
  userId: string
  projectId: string
  draft: CardDraft
  bucket: CardBucket
  position: number
  createdAt: string
  status: 'pending' | 'failed'
  lastError?: string
}
