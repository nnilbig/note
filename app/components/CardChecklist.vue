<script setup lang="ts">
import { X } from '@lucide/vue'
import type { Card } from '~/types/card'

const props = defineProps<{ card: Card }>()
const cards = useCardsStore()
const newItemText = ref('')

function addItem() {
  if (!newItemText.value.trim()) return
  cards.addChecklistItem(props.card.id, newItemText.value)
  newItemText.value = ''
}
</script>

<template>
  <ul class="mt-2 space-y-1">
    <li v-for="item in card.checklist" :key="item.id" class="group flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        :checked="item.done"
        class="h-4 w-4 rounded border-gray-300"
        @change="cards.toggleChecklistItem(card.id, item.id)"
      >
      <span class="flex-1" :class="{ 'text-gray-400 line-through': item.done }">{{ item.text }}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-600"
        title="移除項目"
        @click="cards.deleteChecklistItem(card.id, item.id)"
      >
        <X :size="12" />
      </button>
    </li>
  </ul>
  <input
    v-model="newItemText"
    type="text"
    placeholder="新增檢查項目…"
    class="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
    @keyup.enter="addItem"
  >
</template>
