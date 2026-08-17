<script setup lang="ts">
defineProps<{ progress: number }>()
</script>

<template>
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
    <div
      class="h-full rounded-full bg-emerald-500 transition-all"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>
