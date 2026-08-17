import { defineStore } from 'pinia'
import type { Card, CardBucket, CardDraft, ChecklistItem, Project, Workspace } from '~/types/card'
import { computeProgress } from '~/utils/progress'

export const useCardsStore = defineStore('cards', {
  state: () => ({
    workspace: null as Workspace | null,
    project: null as Project | null,
    cards: [] as Card[],
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
      } catch (err: any) {
        this.error = err.message ?? 'Failed to load board'
      } finally {
        this.loading = false
      }
    },

    async addCard(draft: CardDraft, bucket: CardBucket = 'week') {
      if (!this.project) return
      const supabase = useSupabaseClient()

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
        if (index !== -1) this.cards.splice(index, 1)
        this.error = error.message
        return
      }
      if (index !== -1) this.cards.splice(index, 1, data as Card)
    },

    async deleteCard(cardId: string) {
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
