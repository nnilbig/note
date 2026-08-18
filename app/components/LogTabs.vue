<script setup lang="ts">
import type { TimeFrame } from '~/types/card'
import { TIME_FRAME_LABELS, TIME_FRAME_ORDER } from '~/utils/timeFrameLabel'

const active = defineModel<TimeFrame>({ required: true })
</script>

<template>
  <div class="mb-3 flex gap-1 rounded-md bg-gray-100 p-1 text-sm">
    <button
      v-for="timeFrame in TIME_FRAME_ORDER"
      :key="timeFrame"
      type="button"
      class="flex-1 rounded py-1.5 font-medium"
      :class="active === timeFrame ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
      @click="active = timeFrame"
    >
      {{ TIME_FRAME_LABELS[timeFrame] }}
    </button>
  </div>
</template>
