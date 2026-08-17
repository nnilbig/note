<script setup lang="ts">
import { Plus } from '@lucide/vue'

const { draft, submit } = useRapidLogInput()
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-3">
      <SymbolLegend />
      <div class="flex items-center gap-2">
        <Plus :size="18" class="shrink-0 text-gray-400" />
        <input
          v-model="draft"
          type="text"
          placeholder="• task   ✕ done   > migrate   * priority   ! note"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          @keyup.enter="submit"
        >
      </div>
    </div>
  </div>
</template>
