import { defineStore } from 'pinia'
import type { BuJoSymbol, Card, CardDraft, ChecklistItem, DailyReview, PendingCard, TimeFrame, Workspace } from '~/types/card'
import { computeProgress } from '~/utils/progress'
import { isNetworkError, isOnline } from '~/utils/networkError'
import { nextTimeFrame } from '~/utils/timeFrameLabel'
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
    cards: [] as Card[],
    pendingCards: [] as PendingCard[],
    dailyReview: null as DailyReview | null,
    flushing: false,
    loading: false,
    error: null as string | null
  }),

  getters: {
    cardsInTimeFrame: state => (timeFrame: TimeFrame) =>
      state.cards.filter(c => c.time_frame === timeFrame).sort((a, b) => a.position - b.position)
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

        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('*, checklist:card_checklist_items(*)')
          .eq('owner_id', user.value.sub)
          .order('position', { ascending: true })
        if (cardsError) throw cardsError

        this.cards = (cards ?? []) as Card[]

        // IndexedDB's structured-clone step can't serialize Vue's reactive
        // Proxy objects, so snapshot data must be plain before it's stored.
        await saveBoardSnapshot(JSON.parse(JSON.stringify({
          userId: user.value.sub,
          workspace: this.workspace,
          cards: this.cards,
          cachedAt: new Date().toISOString()
        })))
      } catch (err: any) {
        if (isNetworkError(err)) {
          const snapshot = await loadBoardSnapshot(user.value.sub)
          if (snapshot) {
            this.workspace = snapshot.workspace
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

    async addCard(draft: CardDraft, timeFrame: TimeFrame = 'daily') {
      const user = useSupabaseUser()
      if (!user.value) return

      const tempId = `temp-${Date.now()}`
      const optimisticCard: Card = {
        id: tempId,
        owner_id: user.value.sub,
        bujo_symbol: draft.bujoSymbol,
        title: draft.title,
        content: null,
        tags: draft.tags,
        progress_percent: 0,
        visibility: 'private',
        time_frame: timeFrame,
        target_date: draft.targetDate,
        scheduled_start: draft.scheduledStart,
        scheduled_end: draft.scheduledEnd,
        is_shallow_task: draft.isShallowTask,
        position: this.cards.filter(c => c.time_frame === timeFrame).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        checklist: []
      }
      this.cards.push(optimisticCard)

      if (!isOnline()) {
        await this.queueOfflineCard(tempId, draft, timeFrame, optimisticCard.position, user.value.sub)
        return
      }

      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('cards')
        .insert({
          owner_id: user.value.sub,
          bujo_symbol: draft.bujoSymbol,
          title: draft.title,
          tags: draft.tags,
          time_frame: timeFrame,
          target_date: draft.targetDate,
          scheduled_start: draft.scheduledStart,
          scheduled_end: draft.scheduledEnd,
          is_shallow_task: draft.isShallowTask,
          position: optimisticCard.position
        })
        .select('*, checklist:card_checklist_items(*)')
        .single()

      const index = this.cards.findIndex(c => c.id === tempId)
      if (error) {
        if (isNetworkError(error)) {
          await this.queueOfflineCard(tempId, draft, timeFrame, optimisticCard.position, user.value.sub)
          return
        }
        if (index !== -1) this.cards.splice(index, 1)
        this.error = error.message
        return
      }
      if (index !== -1) this.cards.splice(index, 1, data as Card)
    },

    async queueOfflineCard(localId: string, draft: CardDraft, timeFrame: TimeFrame, position: number, userId: string) {
      const entry: PendingCard = {
        localId,
        userId,
        draft,
        timeFrame,
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
          owner_id: pending.userId,
          bujo_symbol: pending.draft.bujoSymbol,
          title: pending.draft.title,
          content: null,
          tags: pending.draft.tags,
          progress_percent: 0,
          visibility: 'private',
          time_frame: pending.timeFrame,
          target_date: pending.draft.targetDate,
          scheduled_start: pending.draft.scheduledStart,
          scheduled_end: pending.draft.scheduledEnd,
          is_shallow_task: pending.draft.isShallowTask,
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
            owner_id: pending.userId,
            bujo_symbol: pending.draft.bujoSymbol,
            title: pending.draft.title,
            tags: pending.draft.tags,
            time_frame: pending.timeFrame,
            target_date: pending.draft.targetDate,
            scheduled_start: pending.draft.scheduledStart,
            scheduled_end: pending.draft.scheduledEnd,
            is_shallow_task: pending.draft.isShallowTask,
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

    async toggleCardDone(cardId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      // 'note'/'event' aren't tasks and have nothing to complete;
      // 'migrated'/'cancelled' are owned by the advanceCardState cycle --
      // un-migrate or un-cancel first, then complete.
      if (!card) return
      const NOT_COMPLETABLE: BuJoSymbol[] = ['note', 'event', 'migrated', 'cancelled']
      if (NOT_COMPLETABLE.includes(card.bujo_symbol)) return

      const previous = card.bujo_symbol
      card.bujo_symbol = previous === 'completed' ? 'task' : 'completed'

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ bujo_symbol: card.bujo_symbol })
        .eq('id', cardId)

      if (error) {
        card.bujo_symbol = previous
        this.error = error.message
      }
    },

    // Direct cancel for the migration assistant's "✕ 取消" button -- unlike
    // advanceCardState's cycle (which only reaches 'cancelled' via
    // migrated/scheduled), review time lets you cancel a still-open task
    // outright without migrating it anywhere first.
    async cancelCard(cardId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card || card.bujo_symbol === 'note' || card.bujo_symbol === 'event') return

      const previous = card.bujo_symbol
      card.bujo_symbol = 'cancelled'

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ bujo_symbol: 'cancelled' })
        .eq('id', cardId)

      if (error) {
        card.bujo_symbol = previous
        this.error = error.message
      }
    },

    // Swipe-left / migrate-cycle: tasks and priorities step forward through
    // time frames, flagged 'migrated' (or 'scheduled' when they land in the
    // Future Log specifically) -- swiping again cancels, and once more
    // reverts to a plain task. Notes/events have no status cycle, so they
    // just carry forward to the next time frame unchanged, like the old
    // migrate button did for every card type.
    async advanceCardState(cardId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card || card.bujo_symbol === 'completed') return

      if (card.bujo_symbol === 'note' || card.bujo_symbol === 'event') {
        const target = nextTimeFrame(card.time_frame)
        await this.moveCard(cardId, target, this.cardsInTimeFrame(target).length)
        return
      }

      const previous = { symbol: card.bujo_symbol, timeFrame: card.time_frame, position: card.position }
      let nextSymbol: BuJoSymbol
      let nextFrame = card.time_frame

      if (card.bujo_symbol === 'migrated' || card.bujo_symbol === 'scheduled') {
        nextSymbol = 'cancelled'
      } else if (card.bujo_symbol === 'cancelled') {
        nextSymbol = 'task'
      } else {
        nextFrame = nextTimeFrame(card.time_frame)
        nextSymbol = nextFrame === 'future' ? 'scheduled' : 'migrated'
      }

      const nextPosition = nextFrame === card.time_frame ? card.position : this.cardsInTimeFrame(nextFrame).length

      card.bujo_symbol = nextSymbol
      card.time_frame = nextFrame
      card.position = nextPosition

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ bujo_symbol: nextSymbol, time_frame: nextFrame, position: nextPosition })
        .eq('id', cardId)

      if (error) {
        card.bujo_symbol = previous.symbol
        card.time_frame = previous.timeFrame
        card.position = previous.position
        this.error = error.message
      }
    },

    async updateCardTitle(cardId: string, title: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const trimmed = title.trim()
      if (!trimmed) return

      const card = this.cards.find(c => c.id === cardId)
      if (!card || card.title === trimmed) return
      const previous = card.title
      card.title = trimmed

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ title: trimmed })
        .eq('id', cardId)

      if (error) {
        card.title = previous
        this.error = error.message
      }
    },

    async fetchDailyReview(logDate: string) {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      if (!user.value) return

      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('owner_id', user.value.sub)
        .eq('log_date', logDate)
        .maybeSingle()

      if (error) {
        if (isNetworkError(error)) return
        this.error = error.message
        return
      }
      this.dailyReview = data as DailyReview | null
    },

    async saveShutdownNote(logDate: string, note: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      if (!user.value) return

      const { data, error } = await supabase
        .from('daily_reviews')
        .upsert(
          { owner_id: user.value.sub, log_date: logDate, shutdown_note: note },
          { onConflict: 'owner_id,log_date' }
        )
        .select()
        .single()

      if (error) {
        this.error = error.message
        return
      }
      this.dailyReview = data as DailyReview
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

    async moveCard(cardId: string, timeFrame: TimeFrame, position: number) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const card = this.cards.find(c => c.id === cardId)
      if (!card) return
      const previous = { timeFrame: card.time_frame, position: card.position }
      card.time_frame = timeFrame
      card.position = position

      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('cards')
        .update({ time_frame: timeFrame, position })
        .eq('id', cardId)

      if (error) {
        card.time_frame = previous.timeFrame
        card.position = previous.position
        this.error = error.message
      }
    },

    async reorderCards(timeFrame: TimeFrame, orderedIds: string[]) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const supabase = useSupabaseClient()
      orderedIds.forEach((id, position) => {
        const card = this.cards.find(c => c.id === id)
        if (card) card.position = position
      })

      const updates = orderedIds.map((id, position) =>
        supabase.from('cards').update({ position, time_frame: timeFrame }).eq('id', id)
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
      const previousProgress = card.progress_percent
      card.progress_percent = computeProgress(card.checklist)

      const supabase = useSupabaseClient()
      const { error: itemError } = await supabase
        .from('card_checklist_items')
        .update({ done: item.done })
        .eq('id', itemId)

      if (itemError) {
        item.done = previousDone
        card.progress_percent = previousProgress
        this.error = itemError.message
        return
      }

      const { error: progressError } = await supabase
        .from('cards')
        .update({ progress_percent: card.progress_percent })
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
      const previousProgress = card.progress_percent
      card.progress_percent = computeProgress(card.checklist)

      const supabase = useSupabaseClient()
      const { error: deleteError } = await supabase
        .from('card_checklist_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) {
        card.checklist.splice(index, 0, removed)
        card.progress_percent = previousProgress
        this.error = deleteError.message
        return
      }

      const { error: progressError } = await supabase
        .from('cards')
        .update({ progress_percent: card.progress_percent })
        .eq('id', cardId)

      if (progressError) this.error = progressError.message
    }
  }
})
