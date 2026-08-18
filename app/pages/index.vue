<script setup lang="ts">
const cardsStore = useCardsStore()
const { activeTimeFrame, activeCards } = useBoard()

onMounted(() => {
  cardsStore.fetchBoard()
})
</script>

<template>
  <div>
    <p v-if="cardsStore.error" class="mb-3 text-sm text-red-600">
      {{ cardsStore.error }}
    </p>

    <LogTabs v-model="activeTimeFrame" />

    <BucketProgressSummary :time-frame="activeTimeFrame" :cards="activeCards" />

    <BoardColumn :time-frame="activeTimeFrame" :cards="activeCards" />

    <RapidLogInput />
  </div>
</template>
