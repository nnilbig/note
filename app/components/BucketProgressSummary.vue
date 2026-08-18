<script setup lang="ts">
import type { Card, TimeFrame } from '~/types/card'
import { TIME_FRAME_LABELS } from '~/utils/timeFrameLabel'
import { computeAverageProgress } from '~/utils/progress'

const props = defineProps<{ timeFrame: TimeFrame, cards: Card[] }>()

const progress = computed(() => computeAverageProgress(props.cards))
</script>

<template>
  <div class="mb-3">
    <div class="mb-1 flex items-center justify-between text-xs text-gray-500">
      <span>{{ TIME_FRAME_LABELS[timeFrame] }}進度</span>
      <span>{{ progress }}%</span>
    </div>
    <ProgressBar :progress="progress" />
  </div>
</template>
