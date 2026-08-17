<script setup lang="ts">
const { draft, submit } = useRapidLogInput()
</script>

<template>
  <div class="mb-4">
    <SymbolLegend />
    <input
      v-model="draft"
      type="text"
      placeholder="• task   ✕ done   > migrate   * priority"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      @keyup.enter="submit"
    >
  </div>
</template>
