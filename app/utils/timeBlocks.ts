export const DAY_START_MINUTES = 8 * 60 // 08:00
export const DAY_END_MINUTES = 22 * 60 // 22:00
export const SLOT_MINUTES = 30
export const SLOT_HEIGHT_PX = 32

export function minutesFromMidnight(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function formatSlotLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function generateSlotMinutes(): number[] {
  const slots: number[] = []
  for (let m = DAY_START_MINUTES; m < DAY_END_MINUTES; m += SLOT_MINUTES) {
    slots.push(m)
  }
  return slots
}

export const GRID_HEIGHT_PX =
  ((DAY_END_MINUTES - DAY_START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT_PX

// Absolute-position a scheduled card inside the time grid. Clamps to the
// grid's visible range so a block starting before 08:00 or ending after
// 22:00 doesn't render off the top/bottom of the container.
export function blockPosition(scheduledStart: string, scheduledEnd: string) {
  const startMinutes = Math.max(minutesFromMidnight(scheduledStart), DAY_START_MINUTES)
  const endMinutes = Math.min(
    Math.max(minutesFromMidnight(scheduledEnd), startMinutes + SLOT_MINUTES),
    DAY_END_MINUTES
  )
  const top = ((startMinutes - DAY_START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT_PX
  const height = ((endMinutes - startMinutes) / SLOT_MINUTES) * SLOT_HEIGHT_PX
  return { top, height }
}

export function formatTimeRange(scheduledStart: string, scheduledEnd: string): string {
  return `${scheduledStart.slice(0, 5)}–${scheduledEnd.slice(0, 5)}`
}

export function todayISODate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
