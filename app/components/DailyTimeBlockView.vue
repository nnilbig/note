<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import type { Card } from '~/types/card'
import { BUJO_GLYPHS } from '~/utils/bujoGlyph'
import {
  DAY_START_MINUTES,
  GRID_HEIGHT_PX,
  SLOT_HEIGHT_PX,
  blockPosition,
  formatSlotLabel,
  formatTimeRange,
  generateSlotMinutes,
  todayISODate
} from '~/utils/timeBlocks'

const props = defineProps<{ cards: Card[] }>()
const cardsStore = useCardsStore()

// Three Daily-Log zones per the source article: a time-block grid for
// pre-planned work, a "shallow task" batch for low-cognitive items, and
// whatever's left un-triaged (cards added without a time range or ~ marker).
const scheduledCards = computed(() =>
  props.cards.filter(c => c.scheduled_start && c.scheduled_end && !c.is_shallow_task)
)
const shallowCards = computed(() => props.cards.filter(c => c.is_shallow_task))
const unscheduledCards = computed(() =>
  props.cards.filter(c => !c.scheduled_start && !c.is_shallow_task)
)

const slots = generateSlotMinutes()
const today = todayISODate()

const shutdownDraft = ref('')
cardsStore.fetchDailyReview(today)
watch(() => cardsStore.dailyReview, (review) => {
  shutdownDraft.value = review?.shutdown_note ?? ''
}, { immediate: true })

function saveShutdown() {
  cardsStore.saveShutdownNote(today, shutdownDraft.value)
}

function toggleShallowDone(card: Card) {
  if (card.bujo_symbol === 'note' || card.bujo_symbol === 'migrated') return
  cardsStore.toggleCardDone(card.id)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="shallowCards.length" class="rounded-md border border-gray-200 bg-white p-3">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        淺任務批次
      </p>
      <ul class="space-y-1">
        <li v-for="(card, i) in shallowCards" :key="card.id" class="flex items-center gap-2 text-sm">
          <span class="w-4 shrink-0 text-right text-xs text-gray-400">{{ i + 1 }}</span>
          <button type="button" class="bujo-glyph shrink-0 text-gray-500 hover:text-gray-900" @click="toggleShallowDone(card)">
            {{ BUJO_GLYPHS[card.bujo_symbol] }}
          </button>
          <span class="flex-1" :class="{ 'text-gray-400 line-through': card.bujo_symbol === 'completed' }">{{ card.title }}</span>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-600"
            title="刪除"
            @click="cardsStore.deleteCard(card.id)"
          >
            <Trash2 :size="12" />
          </button>
        </li>
      </ul>
    </div>

    <div class="relative overflow-hidden rounded-md border border-gray-200 bg-white" :style="{ height: `${GRID_HEIGHT_PX}px` }">
      <div
        v-for="slot in slots"
        :key="slot"
        class="absolute inset-x-0 border-t border-gray-100"
        :style="{ top: `${((slot - DAY_START_MINUTES) / 30) * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }"
      >
        <span class="ml-1 text-[10px] text-gray-300">{{ formatSlotLabel(slot) }}</span>
      </div>

      <div
        v-for="card in scheduledCards"
        :key="card.id"
        class="absolute left-14 right-2 overflow-hidden rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-900"
        :style="{
          top: `${blockPosition(card.scheduled_start!, card.scheduled_end!).top}px`,
          height: `${blockPosition(card.scheduled_start!, card.scheduled_end!).height}px`
        }"
      >
        <p class="truncate font-medium" :class="{ 'line-through opacity-60': card.bujo_symbol === 'completed' }">
          {{ card.title }}
        </p>
        <p class="text-[10px] text-blue-500">
          {{ formatTimeRange(card.scheduled_start!, card.scheduled_end!) }}
        </p>
      </div>
    </div>

    <div v-if="unscheduledCards.length" class="space-y-2">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
        未排入時段
      </p>
      <BujoCard v-for="card in unscheduledCards" :key="card.id" :card="card" />
    </div>

    <div class="rounded-md border border-gray-200 bg-white p-3">
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        收工儀式回顧
      </p>
      <textarea
        v-model="shutdownDraft"
        rows="2"
        placeholder="今天完成了什麼？有什麼要延到明天？"
        class="w-full resize-none rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        @blur="saveShutdown"
      />
    </div>
  </div>
</template>
