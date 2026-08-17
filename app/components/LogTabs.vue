<script setup lang="ts">
import type { CardBucket } from '~/types/card'
import { BUCKET_LABELS, BUCKET_ORDER } from '~/utils/bucketLabel'

const active = defineModel<CardBucket>({ required: true })
</script>

<template>
  <div class="mb-3 flex gap-1 rounded-md bg-gray-100 p-1 text-sm">
    <button
      v-for="bucket in BUCKET_ORDER"
      :key="bucket"
      type="button"
      class="flex-1 rounded py-1.5 font-medium"
      :class="active === bucket ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
      @click="active = bucket"
    >
      {{ BUCKET_LABELS[bucket] }}
    </button>
  </div>
</template>
