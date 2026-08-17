<script setup lang="ts">
import type { Card, CardBucket } from '~/types/card'
import { BUCKET_LABELS } from '~/utils/bucketLabel'
import { computeAverageProgress } from '~/utils/progress'

const props = defineProps<{ bucket: CardBucket, cards: Card[] }>()

const progress = computed(() => computeAverageProgress(props.cards))
</script>

<template>
  <div class="mb-3">
    <div class="mb-1 flex items-center justify-between text-xs text-gray-500">
      <span>{{ BUCKET_LABELS[bucket] }}進度</span>
      <span>{{ progress }}%</span>
    </div>
    <ProgressBar :progress="progress" />
  </div>
</template>
