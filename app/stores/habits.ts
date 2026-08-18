import { defineStore } from 'pinia'
import type { Habit, HabitEntry } from '~/types/habit'
import { isOnline } from '~/utils/networkError'

const OFFLINE_MESSAGE = '目前離線，此操作需要網路連線'

export const useHabitsStore = defineStore('habits', {
  state: () => ({
    habits: [] as Habit[],
    entries: [] as HabitEntry[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    isDone: state => (habitId: string, logDate: string) =>
      state.entries.some(e => e.habit_id === habitId && e.log_date === logDate && e.done)
  },

  actions: {
    // monthStart/monthEnd are 'YYYY-MM-DD' bounds for the visible month --
    // entries outside that range aren't needed for the grid.
    async fetchHabits(monthStart: string, monthEnd: string) {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      if (!user.value) return

      this.loading = true
      this.error = null

      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('owner_id', user.value.sub)
        .order('position', { ascending: true })

      if (habitsError) {
        this.error = habitsError.message
        this.loading = false
        return
      }
      this.habits = (habits ?? []) as Habit[]

      if (this.habits.length === 0) {
        this.entries = []
        this.loading = false
        return
      }

      const { data: entries, error: entriesError } = await supabase
        .from('habit_entries')
        .select('*')
        .in('habit_id', this.habits.map(h => h.id))
        .gte('log_date', monthStart)
        .lte('log_date', monthEnd)

      if (entriesError) {
        this.error = entriesError.message
        this.loading = false
        return
      }
      this.entries = (entries ?? []) as HabitEntry[]
      this.loading = false
    },

    async addHabit(name: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }
      const trimmed = name.trim()
      if (!trimmed) return

      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      if (!user.value) return

      const { data, error } = await supabase
        .from('habits')
        .insert({ owner_id: user.value.sub, name: trimmed, position: this.habits.length })
        .select()
        .single()

      if (error) {
        this.error = error.message
        return
      }
      this.habits.push(data as Habit)
    },

    async deleteHabit(habitId: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const index = this.habits.findIndex(h => h.id === habitId)
      if (index === -1) return
      const [removed] = this.habits.splice(index, 1)
      const removedEntries = this.entries.filter(e => e.habit_id === habitId)
      this.entries = this.entries.filter(e => e.habit_id !== habitId)

      const supabase = useSupabaseClient()
      const { error } = await supabase.from('habits').delete().eq('id', habitId)

      if (error) {
        this.habits.splice(index, 0, removed)
        this.entries.push(...removedEntries)
        this.error = error.message
      }
    },

    async toggleHabitEntry(habitId: string, logDate: string) {
      if (!isOnline()) { this.error = OFFLINE_MESSAGE; return }

      const existing = this.entries.find(e => e.habit_id === habitId && e.log_date === logDate)
      const supabase = useSupabaseClient()

      if (existing) {
        this.entries = this.entries.filter(e => e.id !== existing.id)
        const { error } = await supabase.from('habit_entries').delete().eq('id', existing.id)
        if (error) {
          this.entries.push(existing)
          this.error = error.message
        }
        return
      }

      const tempId = `temp-${Date.now()}`
      const optimisticEntry: HabitEntry = { id: tempId, habit_id: habitId, log_date: logDate, done: true }
      this.entries.push(optimisticEntry)

      const { data, error } = await supabase
        .from('habit_entries')
        .insert({ habit_id: habitId, log_date: logDate, done: true })
        .select()
        .single()

      const index = this.entries.findIndex(e => e.id === tempId)
      if (error) {
        if (index !== -1) this.entries.splice(index, 1)
        this.error = error.message
        return
      }
      if (index !== -1) this.entries.splice(index, 1, data as HabitEntry)
    }
  }
})
