<script setup lang="ts">
const active = defineModel<'week' | 'month'>({ required: true })
</script>

<template>
  <div class="mb-3 flex gap-1 rounded-md bg-gray-100 p-1 text-sm">
    <button
      type="button"
      class="flex-1 rounded py-1.5 font-medium"
      :class="active === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
      @click="active = 'week'"
    >
      本週
    </button>
    <button
      type="button"
      class="flex-1 rounded py-1.5 font-medium"
      :class="active === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
      @click="active = 'month'"
    >
      本月
    </button>
  </div>
</template>
