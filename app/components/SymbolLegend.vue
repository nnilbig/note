<script setup lang="ts">
import { BUJO_GLYPHS, BUJO_LABELS } from '~/utils/bujoGlyph'

const symbols = ['task', 'completed', 'migrated', 'priority'] as const
</script>

<template>
  <div class="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
    <span v-for="symbol in symbols" :key="symbol" class="flex items-center gap-1">
      <span class="bujo-glyph">{{ BUJO_GLYPHS[symbol] }}</span>
      {{ BUJO_LABELS[symbol] }}
    </span>
    <span class="flex items-center gap-1">
      <span class="bujo-glyph">!</span>
      筆記
    </span>
  </div>
</template>
