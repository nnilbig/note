import { defineStore } from 'pinia'
import type { Card, CardBucket, CardDraft, ChecklistItem, PendingCard, Project, Workspace } from '~/types/card'
import { computeProgress } from '~/utils/progress'
import { isNetworkError, isOnline } from '~/utils/networkError'
import {
  enqueuePendingCard,
  listPendingCards,
  loadBoardSnapshot,
  markPendingCardFailed,
  removePendingCard,
  saveBoardSnapshot
} from '~/utils/offlineDb'

const OFFLINE_MESSAGE = '目前離線，此操作需要網路連線'

export const useCardsStore = defineStore('cards', {
  state: () => ({
    workspace: null as Workspace | null,
    project: null as Project | null,
    cards: [] as Card[],
    pendingCards: [] as PendingCard[],
    flushing: false,
    loading: false,
    error: null as string | null
  }),

  getters: {
    weekCards: state => state.cards.filter(c => c.bucket === 'week').sort((a, b) => a.position - b.position),
    monthCards: state => state.cards.filter(c => c.bucket === 'month').sort((a, b) => a.position - b.position)
  },

  actions: {
    async fetchBoard() {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      if (!user.value) return

      this.loading = true
      this.error = null

      try {
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_members')
          .select('workspace_id, workspaces(id, name, type, owner_id)')
          .eq('user_id', user.value.sub)
          .limit(1)
          .single()
        if (membershipError) throw membershipError

        this.workspace = membership.workspaces as unknown as Workspace

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, workspace_id, title, cycle, target_date')
          .eq('workspace_id', this.workspace.id)
          .limit(1)
          .single()
        if (projectError) throw projectError
        this.project = project as Project

        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('*, checklist:card_checklist_items(*)')
          .eq('project_id', this.project.id)
          .order('position', { ascending: true })
        if (cardsError) throw cardsError

        this.cards = (cards ?? []) as Card[]

        // IndexedDB's structured-clone step can't serialize Vue's reactive
        // Proxy objects, so snapshot data must be plain before it's stored.
        await saveBoardSnapshot(JSON.parse(JSON.stringify({
          userId: user.value.sub,
          workspace: this.workspace,
          project: this.project,
          cards: this.cards,
          cachedAt: new Date().toISOString()
        })))
      } catch (err: any) {
        if (isNetworkError(err)) {
          const snapshot = await loadBoardSnapshot(user.value.sub)
          if (snapshot) {
            this.workspace = snapshot.workspace
            this.project = snapshot.project
            this.cards = snapshot.cards
          } else {
            this.error = '目前離線，且尚無先前載入的資料'
          }
        } else {
          this.error = err.message ?? 'Failed to load board'
        }
      } finally {
        this.loading = false
        await this.hydratePendingQueue()
      }
    },

    async addCard(draft: CardDraft, bucket: CardBucket = 'week') {
      if (!this.project) return
      const user = useSupabaseUser()

      const tempId = `temp-${Date.now()}`
      const optimisticCard: Card = {
        id: tempId,
        project_id: this.project.id,
        bujo_symbol: draft.bujoSymbol,
        title: draft.title,
        progress: 0,
        visibility: 'private',
        bucket,
        position: this.cards.filter(c => c.bucket === bucket).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        checklist: []
      }
      this.cards.push(optimisticCard)

      if (!isOnline()) {
        if (user.value) await this.queueOfflineCard(tempId, draft, bucket, optimisticCard.position, user.value.sub)
        return
      }

      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('cards')
        .insert({
          project_id: this.project.id,
          bujo_symbol: draft.bujoSymbol,
          title: draft.title,
          bucket,
          position: optimisticCard.position
        })
        .select('*, checklist:card_checklist_items(*)')
        .single()

      const index = this.cards.findIndex(c => c.id === tempId)
      if (error) {
        if (isNetworkError(error)) {
          if (user.value) await this.queueOfflineCard(tempId, draft, bucket, optimisticCard.position, user.value.sub)
          return
        }
        if (index !== -1) this.cards.splice(index, 1)
        this.error = error.message
        return
      }
      if (index !== -1) this.cards.splice(index, 1, data as Card)
    },

    async queueOfflineCard(localId: string, draft: CardDraft, bucket: CardBucket, position: number, userId: string) {
      if (!this.project) return
      const entry: PendingCard = {
        localId,
        userId,
        projectId: this.project.id,
        draft,
        bucket,
        position,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
      await enqueuePendingCard(entry)
      this.pendingCards.push(entry)
    },

    async hydratePendingQueue() {
      const user = useSupabaseUser()
      if (!user.value) return
      this.pendingCards = await listPendingCards(user.value.sub)
      for (const pending of this.pendingCards) {
        if (this.cards.some(c => c.id === pending.localId)) continue
        this.cards.push({
          id: pending.localId,
          project_id: pending.projectId,
          bujo_symbol: pending.draft.bujoSymbol,
          title: pending.draft.title,
          progress: 0,
          visibility: 'private',
          bucket: pending.bucket,
          position: pending.position,
          created_at: pending.createdAt,
          updated_at: pending.createdAt,
          checklist: []
        })
      }
      if (this.pendingCards.length && isOnline()) await this.flushOfflineQueue()
    },

    async flushOfflineQueue() {
      if (this.flushing || !isOnline() || this.pendingCards.length === 0) return
      this.flushing = true
      const supabase = useSupabaseClient()

      for (const pending of [...this.pendingCards]) {
        const { data, error } = await supabase
          .from('cards')
          .insert({
            project_id: pending.projectId,
            bujo_symbol: pending.draft.bujoSymbol,
            title: pending.draft.title,
            bucket: pending.bucket,
            position: pending.position
          })
          .select('*, checklist:card_checklist_items(*)')
          .single()

        if (error && isNetworkError(error)) break

        if (error) {
          await markPendingCardFailed(pending.localId, error.message)
          this.error = `離線卡片同步失敗：${error.message}`
          continue
        }

        const index = this.cards.findIndex(c => c.id === pending.localId)
        if (index !== -1) this.cards.splice(index, 1, data as Card)
        await removePendingCard(pending.localId)
        this.pendingCards = this.pendingCards.filter(p => p.localId !== pending.localId)
      }

      this.flushing = false
    },

    async toggleCardVisibility(cardId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card) return
      const previous = card.visibility
      card.visibility = previous === 'private' ? 'shared' : 'private'

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ visibility: card.visibility })
        .eq('id', cardId)

      if (error) {
        card.visibility = previous
        this.error = error.message
      }
    },

    async deleteCard(cardId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const index = this.cards.findIndex(c => c.id === cardId)
      if (index === -1) return
      const [removed] = this.cards.splice(index, 1)

      const supabase = useSupabaseClient()
      const { error } = await supabase.from('cards').delete().eq('id', cardId)

      if (error) {
        this.cards.splice(index, 0, removed)
        this.error = error.message
      }
    },

    async moveCard(cardId: string, bucket: CardBucket, position: number) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card) return
      const previous = { bucket: card.bucket, position: card.position }
      card.bucket = bucket
      card.position = position

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ bucket, position })
        .eq('id', cardId)

      if (error) {
        card.bucket = previous.bucket
        card.position = previous.position
        this.error = error.message
      }
    },

    async reorderCards(bucket: CardBucket, orderedIds: string[]) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const supabase = useSupabaseClient()
      orderedIds.forEach((id, position) => {
        const card = this.cards.find(c => c.id === id)
        if (card) card.position = position
      })

      const updates = orderedIds.map((id, position) =>
        supabase.from('cards').update({ position, bucket }).eq('id', id)
      )
      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed?.error) this.error = failed.error.message
    },

    async toggleChecklistItem(cardId: string, itemId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card) return
      const item = card.checklist.find(i => i.id === itemId)
      if (!item) return

      const previousDone = item.done
      item.done = !item.done
      const previousProgress = card.progress
      card.progress = computeProgress(card.checklist)

      const supabase = useSupabaseClient()
      const { error: itemError } = await supabase
        .from('card_checklist_items')
        .update({ done: item.done })
        .eq('id', itemId)

      if (itemError) {
        item.done = previousDone
        card.progress = previousProgress
        this.error = itemError.message
        return
      }

      const { error: progressError } = await supabase
        .from('cards')
        .update({ progress: card.progress })
        .eq('id', cardId)

      if (progressError) this.error = progressError.message
    },

    async addChecklistItem(cardId: string, text: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card || !text.trim()) return

      const supabase = useSupabaseClient()
      const tempId = `temp-${Date.now()}`
      const optimisticItem: ChecklistItem = {
        id: tempId,
        card_id: cardId,
        text: text.trim(),
        done: false,
        position: card.checklist.length
      }
      card.checklist.push(optimisticItem)

      const { data, error } = await supabase
        .from('card_checklist_items')
        .insert({ card_id: cardId, text: text.trim(), position: optimisticItem.position })
        .select()
        .single()

      const index = card.checklist.findIndex(i => i.id === tempId)
      if (error) {
        if (index !== -1) card.checklist.splice(index, 1)
        this.error = error.message
        return
      }
      if (index !== -1) card.checklist.splice(index, 1, data as ChecklistItem)
    },

    async deleteChecklistItem(cardId: string, itemId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card) return
      const index = card.checklist.findIndex(i => i.id === itemId)
      if (index === -1) return

      const [removed] = card.checklist.splice(index, 1)
      const previousProgress = card.progress
      card.progress = computeProgress(card.checklist)

      const supabase = useSupabaseClient()
      const { error: deleteError } = await supabase
        .from('card_checklist_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) {
        card.checklist.splice(index, 0, removed)
        card.progress = previousProgress
        this.error = deleteError.message
        return
      }

      const { error: progressError } = await supabase
        .from('cards')
        .update({ progress: card.progress })
        .eq('id', cardId)

      if (progressError) this.error = progressError.message
    }
  }
})
