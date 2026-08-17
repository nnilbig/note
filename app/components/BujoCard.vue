<script setup lang="ts">
import { GripVertical, ChevronRight, Trash2 } from '@lucide/vue'
import type { Card, CardBucket } from '~/types/card'
import { BUJO_GLYPHS } from '~/utils/bujoGlyph'

const props = defineProps<{ card: Card }>()
const cards = useCardsStore()

function migrate() {
  const target: CardBucket = props.card.bucket === 'week' ? 'month' : 'week'
  const position = target === 'week' ? cards.weekCards.length : cards.monthCards.length
  cards.moveCard(props.card.id, target, position)
}

function remove() {
  if (!confirm(`刪除「${props.card.title}」？`)) return
  cards.deleteCard(props.card.id)
}
</script>

<template>
  <div class="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
    <div class="flex items-start gap-2">
      <GripVertical :size="14" class="drag-handle mt-0.5 shrink-0 cursor-grab text-gray-300" />
      <span class="bujo-glyph shrink-0 text-gray-500">{{ BUJO_GLYPHS[card.bujo_symbol] }}</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-gray-800" :class="{ 'text-gray-400 line-through': card.bujo_symbol === 'completed' }">
          {{ card.title }}
        </p>
        <ProgressBar v-if="card.checklist.length" :progress="card.progress" class="mt-2" />
        <CardChecklist :card="card" />
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          :title="card.bucket === 'week' ? '搬移到本月' : '搬移到本週'"
          @click="migrate"
        >
          <ChevronRight :size="16" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="刪除卡片"
          @click="remove"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
