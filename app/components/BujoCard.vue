<script setup lang="ts">
import { GripVertical, ChevronRight, Trash2, Lock, Share2 } from '@lucide/vue'
import type { Card } from '~/types/card'
import { BUJO_GLYPHS } from '~/utils/bujoGlyph'
import { TIME_FRAME_LABELS, nextTimeFrame } from '~/utils/timeFrameLabel'

const props = defineProps<{ card: Card }>()
const cards = useCardsStore()

function migrate() {
  const target = nextTimeFrame(props.card.time_frame)
  const position = cards.cardsInTimeFrame(target).length
  cards.moveCard(props.card.id, target, position)
}

function remove() {
  if (!confirm(`刪除「${props.card.title}」？`)) return
  cards.deleteCard(props.card.id)
}

function toggleVisibility() {
  cards.toggleCardVisibility(props.card.id)
}

const canToggleDone = computed(() =>
  props.card.bujo_symbol !== 'note' && props.card.bujo_symbol !== 'migrated'
)

function toggleDone() {
  if (!canToggleDone.value) return
  cards.toggleCardDone(props.card.id)
}

const completedAt = computed(() => {
  if (props.card.bujo_symbol !== 'completed') return null
  return new Date(props.card.updated_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
})

const migratedNote = computed(() => {
  if (props.card.bujo_symbol !== 'migrated') return null
  return `已順延至${TIME_FRAME_LABELS[props.card.time_frame]}`
})
</script>

<template>
  <div class="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
    <div class="flex items-start gap-2">
      <GripVertical :size="14" class="drag-handle mt-0.5 shrink-0 cursor-grab text-gray-300" />
      <button
        v-if="canToggleDone"
        type="button"
        class="bujo-glyph shrink-0 text-gray-500 hover:text-gray-900"
        :title="card.bujo_symbol === 'completed' ? '點擊改回待辦' : '點擊標記完成'"
        @click="toggleDone"
      >{{ BUJO_GLYPHS[card.bujo_symbol] }}</button>
      <span v-else class="bujo-glyph shrink-0 text-gray-500">{{ BUJO_GLYPHS[card.bujo_symbol] }}</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-gray-800" :class="{ 'text-gray-400 line-through': card.bujo_symbol === 'completed' }">
          {{ card.title }}
        </p>
        <p v-if="completedAt" class="mt-0.5 text-xs text-gray-400">
          完成於 {{ completedAt }}
        </p>
        <p v-if="migratedNote" class="mt-0.5 text-xs text-gray-400">
          ({{ migratedNote }})
        </p>
        <template v-if="card.checklist.length">
          <p class="mt-1 text-xs text-gray-400">
            狀態: 進行中 進度: {{ card.progress_percent }}%
          </p>
          <ProgressBar :progress="card.progress_percent" class="mt-1" />
        </template>
        <CardChecklist :card="card" />
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          class="rounded p-1"
          :class="card.visibility === 'shared' ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'"
          :title="card.visibility === 'shared' ? '已分享至團隊，點擊改回私人' : '私人卡片，點擊分享至團隊'"
          @click="toggleVisibility"
        >
          <Share2 v-if="card.visibility === 'shared'" :size="14" />
          <Lock v-else :size="14" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          :title="`搬移到${TIME_FRAME_LABELS[nextTimeFrame(card.time_frame)]}`"
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
