<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import type { Card, CardDraft } from '~/types/card'
import { currentMonth, dateForDay } from '~/utils/monthGrid'

const props = defineProps<{ cards: Card[] }>()
const cardsStore = useCardsStore()
const habitsStore = useHabitsStore()

const month = currentMonth()
habitsStore.fetchHabits(month.monthStart, month.monthEnd)

// Left column: events (○) grouped by the day of the month they fall on.
// Right column: everything else in the Monthly Log -- the "本月重點" task
// pool. Events without a target_date fall into their own list so nothing
// typed without a day number gets lost.
const eventCards = computed(() => props.cards.filter(c => c.bujo_symbol === 'event'))
const taskCards = computed(() => props.cards.filter(c => c.bujo_symbol !== 'event'))
const unscheduledEvents = computed(() => eventCards.value.filter(c => !c.target_date))

function eventsForDay(day: number) {
  const date = dateForDay(month.year, month.month, day)
  return eventCards.value.filter(c => c.target_date === date)
}

const addingEventForDay = ref<number | null>(null)
const eventDraft = ref('')

function startAddEvent(day: number) {
  addingEventForDay.value = day
  eventDraft.value = ''
}

function submitEvent(day: number) {
  // Unmounting the input (v-if, right below) fires a native blur, which
  // would re-run this via @blur -- bail on that second call.
  if (addingEventForDay.value !== day) return

  const title = eventDraft.value.trim()
  addingEventForDay.value = null
  eventDraft.value = ''
  if (!title) return

  const draft: CardDraft = {
    bujoSymbol: 'event',
    title,
    tags: [],
    scheduledStart: null,
    scheduledEnd: null,
    isShallowTask: false,
    targetDate: dateForDay(month.year, month.month, day),
    raw: title
  }
  cardsStore.addCard(draft, 'monthly')
}

const newHabitName = ref('')
function submitNewHabit() {
  const name = newHabitName.value.trim()
  if (!name) return
  habitsStore.addHabit(name)
  newHabitName.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="rounded-md border border-gray-200 bg-white">
        <p class="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          {{ month.month }}月 · 事件時間軸
        </p>
        <ul class="max-h-[480px] divide-y divide-gray-100 overflow-y-auto">
          <li v-for="day in month.days" :key="day" class="flex items-start gap-2 px-3 py-1.5 text-sm">
            <span class="w-6 shrink-0 pt-0.5 text-right text-xs text-gray-400">{{ day }}</span>
            <div class="min-w-0 flex-1">
              <div v-if="eventsForDay(day).length" class="space-y-0.5">
                <div v-for="card in eventsForDay(day)" :key="card.id" class="flex items-center gap-1 text-gray-700">
                  <span class="bujo-glyph shrink-0 text-gray-400">○</span>
                  <span class="truncate">{{ card.title }}</span>
                  <button
                    type="button"
                    class="ml-auto shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-600"
                    title="刪除事件"
                    @click="cardsStore.deleteCard(card.id)"
                  >
                    <Trash2 :size="11" />
                  </button>
                </div>
              </div>
              <input
                v-if="addingEventForDay === day"
                v-model="eventDraft"
                type="text"
                autofocus
                placeholder="輸入事件名稱…"
                class="mt-0.5 w-full rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:border-gray-400 focus:outline-none"
                @keyup.enter="submitEvent(day)"
                @blur="submitEvent(day)"
              >
              <button
                v-else
                type="button"
                class="mt-0.5 flex items-center gap-0.5 text-xs text-gray-300 hover:text-gray-600"
                @click="startAddEvent(day)"
              >
                <Plus :size="10" /> 事件
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-2">
        <div v-if="unscheduledEvents.length" class="rounded-md border border-gray-200 bg-white p-3">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            未定日期的事件
          </p>
          <BujoCard v-for="card in unscheduledEvents" :key="card.id" :card="card" />
        </div>
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            本月重點
          </p>
          <div class="space-y-2">
            <BujoCard v-for="card in taskCards" :key="card.id" :card="card" />
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-md border border-gray-200 bg-white p-3">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        習慣打卡矩陣
      </p>
      <div class="overflow-x-auto">
        <table class="border-collapse text-xs">
          <thead>
            <tr>
              <th class="sticky left-0 min-w-[96px] bg-white px-2 py-1 text-left font-medium text-gray-500">
                習慣
              </th>
              <th v-for="day in month.days" :key="day" class="w-6 px-0 py-1 text-center font-normal text-gray-400">
                {{ day }}
              </th>
              <th class="w-8" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="habit in habitsStore.habits" :key="habit.id">
              <td class="sticky left-0 whitespace-nowrap bg-white px-2 py-1 text-gray-700">
                {{ habit.name }}
              </td>
              <td v-for="day in month.days" :key="day" class="px-0 py-1 text-center">
                <button
                  type="button"
                  class="h-5 w-5 rounded text-[11px]"
                  :class="habitsStore.isDone(habit.id, dateForDay(month.year, month.month, day))
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-300 hover:bg-gray-100'"
                  @click="habitsStore.toggleHabitEntry(habit.id, dateForDay(month.year, month.month, day))"
                >
                  {{ habitsStore.isDone(habit.id, dateForDay(month.year, month.month, day)) ? '✕' : '·' }}
                </button>
              </td>
              <td class="px-1">
                <button
                  type="button"
                  class="rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-600"
                  title="刪除習慣"
                  @click="habitsStore.deleteHabit(habit.id)"
                >
                  <Trash2 :size="12" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-2 flex items-center gap-2">
        <Plus :size="14" class="shrink-0 text-gray-400" />
        <input
          v-model="newHabitName"
          type="text"
          placeholder="新增習慣，例如：運動、冥想…"
          class="w-full max-w-xs rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          @keyup.enter="submitNewHabit"
        >
      </div>
    </div>
  </div>
</template>
