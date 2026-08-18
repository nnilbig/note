<script setup lang="ts">
import { X, Check, ChevronRight, Ban } from '@lucide/vue'
import type { Card, TimeFrame } from '~/types/card'
import { BUJO_GLYPHS } from '~/utils/bujoGlyph'
import { TIME_FRAME_LABELS } from '~/utils/timeFrameLabel'

const props = defineProps<{ timeFrame: TimeFrame, cards: Card[] }>()
const emit = defineEmits<{ close: [] }>()
const cardsStore = useCardsStore()

// The classic BuJo migration ritual: at a period's end, every still-open
// •/* item gets a decision -- done, migrated forward, or cancelled. Already
// migrated/scheduled/cancelled/completed/note/event cards aren't "open"
// decisions any more, so they don't show up here.
const openCards = computed(() =>
  props.cards.filter(c => c.time_frame === props.timeFrame && (c.bujo_symbol === 'task' || c.bujo_symbol === 'priority'))
)

function migrateAll() {
  for (const card of openCards.value) cardsStore.advanceCardState(card.id)
}
</script>

<template>
  <div class="fixed inset-0 z-20 flex items-end justify-center bg-black/30 sm:items-center" @click.self="emit('close')">
    <div class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg sm:rounded-lg">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-800">
          {{ TIME_FRAME_LABELS[timeFrame] }}結算助手
        </h2>
        <button type="button" class="rounded p-1 text-gray-400 hover:bg-gray-100" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>

      <template v-if="openCards.length">
        <button
          type="button"
          class="mb-3 w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white"
          @click="migrateAll"
        >
          全部移轉到下一個時間軸
        </button>

        <ul class="space-y-2">
          <li v-for="card in openCards" :key="card.id" class="flex items-center gap-2 rounded-md border border-gray-200 p-2 text-sm">
            <span class="bujo-glyph shrink-0 text-gray-400">{{ BUJO_GLYPHS[card.bujo_symbol] }}</span>
            <span class="min-w-0 flex-1 truncate text-gray-800">{{ card.title }}</span>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-green-600 hover:bg-green-50"
              title="標記完成"
              @click="cardsStore.toggleCardDone(card.id)"
            >
              <Check :size="14" />
            </button>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-50"
              title="移轉到下一個時間軸"
              @click="cardsStore.advanceCardState(card.id)"
            >
              <ChevronRight :size="14" />
            </button>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="取消"
              @click="cardsStore.cancelCard(card.id)"
            >
              <Ban :size="14" />
            </button>
          </li>
        </ul>
      </template>
      <p v-else class="py-6 text-center text-sm text-gray-400">
        這個時間軸沒有待處理的項目 🎉
      </p>
    </div>
  </div>
</template>
