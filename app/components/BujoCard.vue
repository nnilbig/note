<script setup lang="ts">
import { GripVertical, ChevronRight, Trash2, Lock, Share2, Check, X as XIcon } from '@lucide/vue'
import type { Card } from '~/types/card'
import { BUJO_GLYPHS } from '~/utils/bujoGlyph'
import { TIME_FRAME_LABELS, nextTimeFrame } from '~/utils/timeFrameLabel'

const props = defineProps<{ card: Card }>()
const cards = useCardsStore()

function remove() {
  if (!confirm(`刪除「${props.card.title}」？`)) return
  cards.deleteCard(props.card.id)
}

function toggleVisibility() {
  cards.toggleCardVisibility(props.card.id)
}

const NOT_COMPLETABLE = ['note', 'event', 'migrated', 'cancelled']
const canToggleDone = computed(() => !NOT_COMPLETABLE.includes(props.card.bujo_symbol))

function toggleDone() {
  if (!canToggleDone.value) return
  cards.toggleCardDone(props.card.id)
}

function advance() {
  cards.advanceCardState(props.card.id)
}

// Swipe right = complete, swipe left = migrate/cancel cycle -- see
// advanceCardState() in the store for what each symbol transitions to.
const { offsetX, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useSwipeAction({
  onSwipeRight: () => canToggleDone.value && toggleDone(),
  onSwipeLeft: () => advance()
})

const editingTitle = ref(false)
const titleDraft = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  titleDraft.value = props.card.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

function commitEditTitle() {
  if (!editingTitle.value) return
  editingTitle.value = false
  const trimmed = titleDraft.value.trim()
  if (trimmed && trimmed !== props.card.title) {
    cards.updateCardTitle(props.card.id, trimmed)
  }
}

function cancelEditTitle() {
  editingTitle.value = false
}

const completedAt = computed(() => {
  if (props.card.bujo_symbol !== 'completed') return null
  return new Date(props.card.updated_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
})

const statusNote = computed(() => {
  if (props.card.bujo_symbol === 'migrated') return `已順延至${TIME_FRAME_LABELS[props.card.time_frame]}`
  if (props.card.bujo_symbol === 'scheduled') return `已排入${TIME_FRAME_LABELS[props.card.time_frame]}`
  if (props.card.bujo_symbol === 'cancelled') return '已取消'
  return null
})

const advanceTitle = computed(() => {
  const symbol = props.card.bujo_symbol
  if (symbol === 'note' || symbol === 'event') return `搬移到${TIME_FRAME_LABELS[nextTimeFrame(props.card.time_frame)]}`
  if (symbol === 'migrated' || symbol === 'scheduled') return '左滑／點擊取消'
  if (symbol === 'cancelled') return '左滑／點擊恢復為待辦'
  return '左滑／點擊移轉'
})
</script>

<template>
  <div class="relative overflow-hidden rounded-md">
    <div class="absolute inset-0 flex items-center justify-between px-4 text-white">
      <span class="flex items-center gap-1 text-sm font-medium" :class="offsetX > 20 ? 'opacity-100' : 'opacity-0'" style="color: #16a34a">
        <Check :size="16" /> 完成
      </span>
      <span class="flex items-center gap-1 text-sm font-medium" :class="offsetX < -20 ? 'opacity-100' : 'opacity-0'" style="color: #d97706">
        {{ advanceTitle }} <ChevronRight :size="16" />
      </span>
    </div>
    <div
      class="relative touch-pan-y rounded-md border border-gray-200 bg-white p-3 shadow-sm"
      :class="{ 'transition-transform duration-150 ease-out': !dragging }"
      :style="{ transform: `translateX(${offsetX}px)` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
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
          <input
            v-if="editingTitle"
            ref="titleInput"
            v-model="titleDraft"
            type="text"
            class="w-full rounded border border-gray-300 px-1 py-0.5 text-sm text-gray-800 focus:border-gray-500 focus:outline-none"
            @keyup.enter="commitEditTitle"
            @keyup.esc="cancelEditTitle"
            @blur="commitEditTitle"
          >
          <p
            v-else
            class="cursor-text text-sm text-gray-800"
            :class="{ 'text-gray-400 line-through': card.bujo_symbol === 'completed' }"
            title="點擊編輯"
            @click="startEditTitle"
          >
            {{ card.title }}
          </p>
          <p v-if="completedAt" class="mt-0.5 text-xs text-gray-400">
            完成於 {{ completedAt }}
          </p>
          <p v-if="statusNote" class="mt-0.5 text-xs text-gray-400">
            ({{ statusNote }})
          </p>
          <div v-if="card.tags.length" class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="tag in card.tags"
              :key="tag"
              class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
            >#{{ tag }}</span>
          </div>
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
            :title="advanceTitle"
            @click="advance"
          >
            <XIcon v-if="card.bujo_symbol === 'migrated' || card.bujo_symbol === 'scheduled'" :size="14" />
            <ChevronRight v-else :size="16" />
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
  </div>
</template>
