export interface Habit {
  id: string
  owner_id: string
  name: string
  position: number
  created_at: string
}

export interface HabitEntry {
  id: string
  habit_id: string
  log_date: string
  done: boolean
}
